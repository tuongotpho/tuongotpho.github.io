const { FieldValue } = require('firebase-admin/firestore');

const TZ = 'Asia/Ho_Chi_Minh';

/** Ngay hien tai theo gio VN, dang YYMMDD - dung lam moc dem so don trong ngay. */
function vnDateCode(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: TZ, year: '2-digit', month: '2-digit', day: '2-digit'
    }).formatToParts(date);
    const get = t => parts.find(p => p.type === t).value;
    return `${get('year')}${get('month')}${get('day')}`;
}

function vnDateTimeText(date = new Date()) {
    return date.toLocaleString('vi-VN', { timeZone: TZ });
}

/**
 * Gioi han tan suat theo danh tinh (IP hoac Telegram user id).
 *
 * Dung 2 tang rieng biet (tham so `bucket`):
 *  - bucket 'req'   : hang rao rong cho MOI request, chan bot quet endpoint.
 *  - bucket 'order' : chi dem don HOP LE da tao thanh cong.
 * Tach ra de khach go nham so dien thoai vai lan khong bi khoa oan.
 */
async function checkRateLimit(db, identity, { limit = 5, windowMs = 10 * 60 * 1000, bucket = 'order' } = {}) {
    const docId = encodeURIComponent(`${bucket}:${identity}`).slice(0, 500);
    const ref = db.collection('rateLimits').doc(docId);
    const now = Date.now();

    return db.runTransaction(async tx => {
        const snap = await tx.get(ref);
        const data = snap.exists ? snap.data() : null;

        if (!data || (now - (data.windowStart || 0)) > windowMs) {
            tx.set(ref, { windowStart: now, count: 1, updatedAt: FieldValue.serverTimestamp() });
            return { allowed: true, count: 1 };
        }

        const count = (data.count || 0) + 1;
        if (count > limit) {
            const waitMin = Math.ceil((windowMs - (now - data.windowStart)) / 60000);
            return { allowed: false, waitMin };
        }

        tx.update(ref, { count, updatedAt: FieldValue.serverTimestamp() });
        return { allowed: true, count };
    });
}

/**
 * Tra ve don da tao truoc do voi cung clientKey (neu co).
 * Goi TRUOC khi dem gioi han, de khach bam lai khong bi tinh la don moi.
 */
async function findOrderByClientKey(db, clientKey) {
    const keySnap = await db.collection('orderKeys').doc(clientKey).get();
    if (!keySnap.exists) return null;

    const orderId = keySnap.data().orderId;
    const orderSnap = await db.collection('orders').doc(orderId).get();
    return orderSnap.exists ? orderSnap.data() : { orderId };
}

/**
 * Ghi mot ban ghi (don hang hoac lien he) AN TOAN TUYET DOI VOI VIEC BAM 2 LAN:
 * - clientKey giong nhau -> tra ve dung ban ghi cu, khong tao cai moi.
 * - So thu tu duoc cap trong cung transaction nen khong bao gio trung.
 *
 * Don hang va lien he dung chung ham nay de chi co MOT cho quyet dinh
 * cach danh so va cach chong trung.
 */
async function createRecord(db, { collection, keyCollection, prefix, counterId, clientKey, draft }) {
    const keyRef = db.collection(keyCollection).doc(clientKey);
    const dateCode = vnDateCode();
    const counterRef = db.collection('counters').doc(counterId);

    return db.runTransaction(async tx => {
        // --- Toan bo doc phai thuc hien truoc moi thao tac ghi ---
        const keySnap = await tx.get(keyRef);
        if (keySnap.exists) {
            const existingId = keySnap.data().orderId;
            const existingSnap = await tx.get(db.collection(collection).doc(existingId));
            return {
                duplicated: true,
                record: existingSnap.exists ? existingSnap.data() : { orderId: existingId }
            };
        }

        const counterSnap = await tx.get(counterRef);
        const seq = (counterSnap.exists ? counterSnap.data().seq || 0 : 0) + 1;

        // Ten truong giu nguyen la `orderId` cho ca 2 loai ban ghi - doi ten
        // se lam moi cho doc lai tu Firestore hong theo.
        const orderId = `${prefix}-${dateCode}-${String(seq).padStart(3, '0')}`;

        // Chot chan: tuyet doi khong duoc ghi de len ban ghi da co. Neu bo dem
        // vi ly do nao do bi lui lai, tha bao loi cho khach goi hotline con hon
        // lam mat mot don hang that ma khong ai biet.
        const trungRef = db.collection(collection).doc(orderId);
        if ((await tx.get(trungRef)).exists) {
            throw new Error(`Ma ${orderId} da ton tai - bo dem ${counterId} khong dong bo`);
        }

        const record = {
            ...draft,
            orderId,
            status: 'new',
            createdAt: new Date().toISOString(),
            createdAtText: vnDateTimeText()
        };

        tx.set(counterRef, { seq, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        tx.set(trungRef, record);
        tx.set(keyRef, { orderId, createdAt: FieldValue.serverTimestamp() });

        return { duplicated: false, record };
    });
}

/**
 * Don hang: ma BO-YYMMDD-NNN. Tra ve { order, duplicated }.
 * Bo dem van dung doc id cu (chi YYMMDD) de khong danh so lai tu dau
 * va ghi de len cac don da co tren production.
 */
async function createOrder(db, { clientKey, draft }) {
    const r = await createRecord(db, {
        collection: 'orders', keyCollection: 'orderKeys', prefix: 'BO',
        counterId: vnDateCode(), clientKey, draft
    });
    return { duplicated: r.duplicated, order: r.record };
}

/** Lien he / tu van: ma LH-YYMMDD-NNN. Tra ve { enquiry, duplicated }. */
async function createEnquiry(db, { clientKey, draft }) {
    const r = await createRecord(db, {
        collection: 'enquiries', keyCollection: 'enquiryKeys', prefix: 'LH',
        counterId: `LH-${vnDateCode()}`, clientKey, draft
    });
    return { duplicated: r.duplicated, enquiry: r.record };
}

/**
 * Chot don. Chong bam 2 lan o ngay tang du lieu bang transaction:
 * lan bam thu hai luon nhan { already: true } nen khach khong bao gio
 * nhan 2 tin "don da duoc duyet".
 *
 * Tra ve { found, already, order }.
 */
async function confirmOrder(db, orderId, byUserId) {
    const ref = db.collection('orders').doc(orderId);

    return db.runTransaction(async tx => {
        const snap = await tx.get(ref);
        if (!snap.exists) return { found: false, already: false, order: null };

        const order = snap.data();
        if (order.status === 'confirmed') {
            return { found: true, already: true, order };
        }

        const confirmedAtText = vnDateTimeText();
        tx.update(ref, {
            status: 'confirmed',
            confirmedAt: FieldValue.serverTimestamp(),
            confirmedAtText,
            confirmedBy: String(byUserId || 'unknown')
        });

        return { found: true, already: false, order: { ...order, status: 'confirmed', confirmedAtText } };
    });
}

/** Ghi nhan da bao (hoac khong bao duoc) cho khach sau khi chot don. */
async function markCustomerNotified(db, orderId, ok, detail) {
    await db.collection('orders').doc(orderId).set({
        customerNotified: ok,
        customerNotifyDetail: detail || null
    }, { merge: true });
}

/** Danh dau don da (hoac chua) bao duoc ve Telegram cho chu shop. */
async function markNotified(db, orderId, notified, detail, collection = 'orders') {
    await db.collection(collection).doc(orderId).set({
        notified,
        notifyDetail: detail || null,
        notifiedAt: FieldValue.serverTimestamp()
    }, { merge: true });
}

module.exports = {
    createOrder, createEnquiry, findOrderByClientKey, confirmOrder, checkRateLimit,
    markNotified, markCustomerNotified, vnDateCode, vnDateTimeText
};
