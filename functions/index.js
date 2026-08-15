/**
 * API DAT HANG TAP TRUNG - TUONG OT BONG OT
 *
 * Vi sao co file nay:
 *  1. Bot token khong con nam trong ma nguon cong khai nua - no o day, phia server.
 *  2. Gia tien duoc tinh lai o server, client khong the sua gia.
 *  3. Moi don deu duoc luu vao Firestore TRUOC khi gui Telegram -> Telegram loi
 *     hay bi chan thi don van con, khong bao gio "boc hoi" nhu truoc.
 *  4. Moi don co ma BO-YYMMDD-NNN va chong trung khi khach bam 2 lan.
 */

const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret, defineString } = require('firebase-functions/params');
const { setGlobalOptions } = require('firebase-functions/v2');
const logger = require('firebase-functions/logger');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const { buildOrderLines, normalizePhone, formatVnd } = require('./catalog');
const {
    CONFIRM_PREFIX, NHU_CAU, buildEnquiryMessage, buildEnquiryKeyboard, verifyInitData, buildOwnerMessage, buildOwnerKeyboard,
    buildCustomerConfirmMessage, webhookSecretFor, safeEquals,
    sendMessage, answerCallbackQuery, editMessageText
} = require('./telegram');
const {
    createOrder, createEnquiry, findOrderByClientKey, confirmOrder, checkRateLimit,
    markNotified, markCustomerNotified
} = require('./orders');

const TELEGRAM_BOT_TOKEN = defineSecret('TELEGRAM_BOT_TOKEN');
const TELEGRAM_OWNER_CHAT_ID = defineString('TELEGRAM_OWNER_CHAT_ID', { default: '5056715300' });

initializeApp();

// Project nay dung database co TEN RIENG, khong phai "(default)".
// Bo tham so nay di la function chet ngay voi loi NOT_FOUND khi ghi don.
const FIRESTORE_DB_ID = 'tuongot';
const db = getFirestore(FIRESTORE_DB_ID);

// Gioi han so instance de hoa don khong bao gio vuot ngoai du kien.
setGlobalOptions({ region: 'asia-southeast1', maxInstances: 5 });

const ALLOWED_ORIGINS = [
    'https://tuongotpho.github.io',
    'https://tuongotcay.github.io',
    'https://tuongot-sieucay.web.app',
    'https://tuongotsieucay.web.app',
    'https://tuongot-sieucay.firebaseapp.com',
    /^http:\/\/localhost(:\d+)?$/,
    /^http:\/\/127\.0\.0\.1(:\d+)?$/
];

const HOTLINE = '0982.722.036';

function fail(res, status, message, extra = {}) {
    return res.status(status).json({ ok: false, error: message, ...extra });
}

/** Don da ton tai -> tra ve y nguyen, khach thay thong bao than thien chu khong phai loi. */
function respondDuplicated(res, order) {
    return res.json({
        ok: true,
        duplicated: true,
        orderId: order.orderId,
        total: order.subtotal,
        totalText: formatVnd(order.subtotal),
        message: `Đơn ${order.orderId} của bạn đã được ghi nhận trước đó rồi nhé!`
    });
}

exports.order = onRequest(
    { cors: ALLOWED_ORIGINS, secrets: [TELEGRAM_BOT_TOKEN] },
    async (req, res) => {
        if (req.method !== 'POST') {
            return fail(res, 405, 'Phương thức không được hỗ trợ.');
        }

        const body = req.body || {};

        // .trim() la bat buoc: dan token vao Secret Manager rat de dinh kem
        // ky tu xuong dong, va Telegram se tra ve 404 Not Found rat kho doan.
        const botToken = TELEGRAM_BOT_TOKEN.value().trim();

        // --- 1. Xac thuc nguon don: Telegram Mini App hay trinh duyet web? ---
        let channel = 'web';
        let tgUser = null;
        if (body.initData) {
            const check = verifyInitData(body.initData, botToken);
            if (check.valid) {
                channel = 'telegram';
                tgUser = {
                    id: check.user.id,
                    username: check.user.username || null,
                    firstName: check.user.first_name || null,
                    lastName: check.user.last_name || null
                };
            } else {
                // Khong chan don - chi ha xuong thanh don web de khong mat khach.
                logger.warn('initData khong hop le, xu ly nhu don web', { reason: check.reason });
            }
        }

        // --- 2. Hang rao rong: chan bot quet endpoint, van du thoang cho khach nhap lai ---
        const ip = (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim()
            || req.ip || 'unknown';
        const identity = tgUser ? `tg:${tgUser.id}` : `ip:${ip}`;
        try {
            const guard = await checkRateLimit(db, identity, { bucket: 'req', limit: 40 });
            if (!guard.allowed) {
                return fail(res, 429,
                    `Hệ thống ghi nhận quá nhiều yêu cầu từ thiết bị này. Vui lòng gọi hotline ${HOTLINE} để được hỗ trợ ngay.`);
            }
        } catch (err) {
            logger.error('Loi kiem tra hang rao request, van cho di tiep', err);
        }

        // --- 3. Kiem tra thong tin khach ---
        const name = String(body.name || '').trim();
        const address = String(body.address || '').trim();
        const note = String(body.note || '').trim().slice(0, 500);
        const phone = normalizePhone(body.phone);

        if (name.length < 2) return fail(res, 400, 'Vui lòng nhập họ tên người nhận.');
        if (!phone) return fail(res, 400, 'Số điện thoại chưa đúng. Vui lòng kiểm tra lại (ví dụ: 0982722036).');
        if (address.length < 8) return fail(res, 400, 'Địa chỉ quá ngắn. Vui lòng ghi rõ số nhà, đường, quận/huyện.');

        // --- 4. Tinh lai tien o server (khong tin gia tu client) ---
        const priced = buildOrderLines(body.items);
        if (!priced.ok) return fail(res, 400, priced.error);

        if (body.clientTotal !== undefined && Number(body.clientTotal) !== priced.subtotal) {
            logger.warn('Tong tien client khac server', {
                clientTotal: body.clientTotal, serverTotal: priced.subtotal
            });
        }

        const clientKey = String(body.clientKey || '').trim().slice(0, 100)
            || `auto-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

        // --- 5. Khach bam lai don cu -> tra ve nguyen don do, KHONG tinh vao gioi han.
        //        Phai kiem tra truoc buoc dem, neu khong khach bam voi vai lan
        //        se bi bao "dat qua nhieu don" mot cach vo ly.
        try {
            const existing = await findOrderByClientKey(db, clientKey);
            if (existing) return respondDuplicated(res, existing);
        } catch (err) {
            logger.error('Loi tra cuu don trung, van cho don di tiep', err);
        }

        // --- 6. Gio moi dem don that: khach nhap sai vai lan khong bao gio bi khoa ---
        try {
            const rl = await checkRateLimit(db, identity, { bucket: 'order', limit: 5 });
            if (!rl.allowed) {
                return fail(res, 429,
                    `Bạn vừa đặt khá nhiều đơn liên tiếp. Vui lòng thử lại sau ${rl.waitMin} phút hoặc gọi hotline ${HOTLINE} để đặt thêm.`);
            }
        } catch (err) {
            logger.error('Loi kiem tra gioi han don, van cho don di tiep', err);
        }

        // --- 7. Luu don TRUOC, bao Telegram SAU ---
        let created;
        try {
            created = await createOrder(db, {
                clientKey,
                draft: {
                    channel,
                    tgUser,
                    customer: { name: name.slice(0, 120), phone, address: address.slice(0, 300), note },
                    lines: priced.lines,
                    subtotal: priced.subtotal,
                    totalQty: priced.totalQty,
                    source: { ip, userAgent: String(req.headers['user-agent'] || '').slice(0, 300) }
                }
            });
        } catch (err) {
            logger.error('Khong ghi duoc don vao Firestore', err);
            return fail(res, 500,
                `Hệ thống đang bận. Vui lòng gọi hotline ${HOTLINE} để đặt hàng ngay.`);
        }

        const order = created.order;

        // Hai request ap sat nhau cung mot key -> chi mot don duoc tao,
        // request con lai nhan ve dung don do, khong ban tin trung cho chu shop.
        if (created.duplicated) return respondDuplicated(res, order);

        // --- 8. Bao Telegram cho chu shop ---
        let notified = false;
        let notifyDetail = null;
        try {
            const result = await sendMessage(botToken, {
                chat_id: TELEGRAM_OWNER_CHAT_ID.value().trim(),
                text: buildOwnerMessage(order),
                parse_mode: 'HTML',
                reply_markup: { inline_keyboard: buildOwnerKeyboard(order) }
            });
            notified = !!result.ok;
            if (!result.ok) {
                notifyDetail = result.description || 'unknown';
                logger.error('Telegram tu choi tin nhan', { orderId: order.orderId, result });
            }
        } catch (err) {
            notifyDetail = err.message;
            logger.error('Khong goi duoc Telegram API', { orderId: order.orderId, err });
        }

        markNotified(db, order.orderId, notified, notifyDetail).catch(err =>
            logger.error('Khong cap nhat duoc trang thai thong bao', err));

        // Don da nam an toan trong Firestore -> luon tra ve thanh cong that su.
        return res.json({
            ok: true,
            orderId: order.orderId,
            total: order.subtotal,
            totalText: formatVnd(order.subtotal),
            notified,
            message: notified
                ? `Đơn ${order.orderId} đã được gửi tới cửa hàng!`
                : `Đơn ${order.orderId} đã được ghi nhận. Nếu sau 30 phút chưa có ai gọi lại, vui lòng gọi hotline ${HOTLINE}.`
        });
    }
);

/**
 * FORM LIEN HE / TU VAN / MUA BUON tren trang chu.
 *
 * Truoc day form nay ban thang len Telegram bang token trong script.js va
 * chi gui ten/email/sdt/loi nhan - chu shop nhan duoc ma khong biet khach
 * muon gi, o dau. Nay di qua server nhu don hang: co ma LH-YYMMDD-NNN,
 * co luu lai, va khong con can token o client.
 */
exports.contact = onRequest(
    { cors: ALLOWED_ORIGINS, secrets: [TELEGRAM_BOT_TOKEN] },
    async (req, res) => {
        if (req.method !== 'POST') {
            return fail(res, 405, 'Phương thức không được hỗ trợ.');
        }

        const body = req.body || {};
        const botToken = TELEGRAM_BOT_TOKEN.value().trim();

        const ip = (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim()
            || req.ip || 'unknown';

        try {
            const guard = await checkRateLimit(db, `ip:${ip}`, { bucket: 'req', limit: 40 });
            if (!guard.allowed) {
                return fail(res, 429,
                    `Hệ thống ghi nhận quá nhiều yêu cầu từ thiết bị này. Vui lòng gọi hotline ${HOTLINE}.`);
            }
        } catch (err) {
            logger.error('Loi hang rao request form lien he', err);
        }

        const name = String(body.name || '').trim();
        const address = String(body.address || '').trim().slice(0, 300);
        const message = String(body.message || '').trim().slice(0, 1000);
        const need = NHU_CAU[body.need] ? body.need : 'khac';
        const phone = normalizePhone(body.phone);

        if (name.length < 2) return fail(res, 400, 'Vui lòng nhập họ tên của bạn.');
        if (!phone) return fail(res, 400, 'Số điện thoại chưa đúng. Vui lòng kiểm tra lại (ví dụ: 0982722036).');

        const clientKey = String(body.clientKey || '').trim().slice(0, 100)
            || `lh-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

        try {
            const rl = await checkRateLimit(db, `ip:${ip}`, { bucket: 'enquiry', limit: 5 });
            if (!rl.allowed) {
                return fail(res, 429,
                    `Bạn vừa gửi khá nhiều liên hệ. Vui lòng gọi hotline ${HOTLINE} để được hỗ trợ ngay.`);
            }
        } catch (err) {
            logger.error('Loi gioi han form lien he', err);
        }

        let created;
        try {
            created = await createEnquiry(db, {
                clientKey,
                draft: {
                    need,
                    customer: { name: name.slice(0, 120), phone, address, message },
                    source: { ip, userAgent: String(req.headers['user-agent'] || '').slice(0, 300) }
                }
            });
        } catch (err) {
            logger.error('Khong ghi duoc lien he vao Firestore', err);
            return fail(res, 500, `Hệ thống đang bận. Vui lòng gọi hotline ${HOTLINE}.`);
        }

        const enquiry = created.enquiry;

        if (created.duplicated) {
            return res.json({
                ok: true, duplicated: true, enquiryId: enquiry.orderId,
                message: `Liên hệ ${enquiry.orderId} của bạn đã được ghi nhận trước đó rồi nhé!`
            });
        }

        let notified = false;
        try {
            const result = await sendMessage(botToken, {
                chat_id: TELEGRAM_OWNER_CHAT_ID.value().trim(),
                text: buildEnquiryMessage(enquiry),
                parse_mode: 'HTML',
                reply_markup: { inline_keyboard: buildEnquiryKeyboard(enquiry) }
            });
            notified = !!result.ok;
            if (!result.ok) logger.error('Telegram tu choi tin lien he', { id: enquiry.orderId, result });
        } catch (err) {
            logger.error('Khong goi duoc Telegram cho form lien he', { id: enquiry.orderId, err });
        }

        markNotified(db, enquiry.orderId, notified, null, 'enquiries')
            .catch(err => logger.error('Khong cap nhat duoc trang thai lien he', err));

        return res.json({
            ok: true,
            enquiryId: enquiry.orderId,
            notified,
            message: `Đã nhận liên hệ ${enquiry.orderId}. Chúng tôi sẽ gọi lại cho bạn sớm nhất!`
        });
    }
);

/**
 * WEBHOOK NHAN SU KIEN TU TELEGRAM
 *
 * Chi xu ly mot viec: chu shop bam nut "Xac Nhan Don".
 *  - Chong bam 2 lan bang transaction, khach khong bao gio nhan 2 tin duyet
 *  - Sua lai chinh tin nhan don thanh "DA XAC NHAN luc HH:mm" va go nut di,
 *    nen nhin lich su chat la biet don nao da chot
 *  - Don tu web cung chot duoc (ghi vao so sach), khong con la ngo cut
 */
exports.telegramWebhook = onRequest(
    { cors: false, secrets: [TELEGRAM_BOT_TOKEN] },
    async (req, res) => {
        const botToken = TELEGRAM_BOT_TOKEN.value().trim();

        // Endpoint nay cong khai tren Internet. Khong co buoc nay thi bat ky ai
        // cung gia duoc su kien "chu shop da xac nhan" va bao khach linh tinh.
        if (!safeEquals(req.headers['x-telegram-bot-api-secret-token'], webhookSecretFor(botToken))) {
            logger.warn('Webhook bi goi voi secret sai', { ip: req.headers['x-forwarded-for'] });
            return res.status(403).send('forbidden');
        }

        const cq = req.body && req.body.callback_query;
        if (!cq || !cq.data || !cq.data.startsWith(CONFIRM_PREFIX)) {
            return res.status(200).send('ok'); // su kien khac -> bo qua
        }

        const ownerId = TELEGRAM_OWNER_CHAT_ID.value().trim();
        const orderId = cq.data.slice(CONFIRM_PREFIX.length);

        // QUAN TRONG: lam xong het viec ROI moi tra 200.
        //
        // Truoc day ham nay tra 200 ngay tu dau roi xu ly sau. Tren Cloud
        // Functions v2 (chay tren Cloud Run) CPU bi cat ngay khi response da
        // gui, nen phan viec con lai co the khong chay xong: nut tren may chu
        // shop quay mai, hoac don duoc chot ma khach khong nhan duoc tin.
        // Toan bo cong viec duoi day chi mat 1-3 giay, thoai mai trong han
        // 60 giay cua Telegram.
        try {
            if (String(cq.from && cq.from.id) !== ownerId) {
                await answerCallbackQuery(botToken, cq.id, '⛔ Bạn không có quyền duyệt đơn này.', true);
                return res.status(200).send('ok');
            }

            const result = await confirmOrder(db, orderId, cq.from.id);

            if (!result.found) {
                await answerCallbackQuery(botToken, cq.id,
                    `Không tìm thấy đơn ${orderId} trong hệ thống.`, true);
                return res.status(200).send('ok');
            }

            if (result.already) {
                await answerCallbackQuery(botToken, cq.id,
                    `Đơn ${orderId} đã được xác nhận lúc ${result.order.confirmedAtText || 'trước đó'}.`, true);
                return res.status(200).send('ok');
            }

            const order = result.order;

            // Bao khach - chi lam duoc khi khach dat tu trong Telegram
            let customerMsg = 'Đã ghi nhận. Khách đặt từ web nên hãy gọi điện hoặc nhắn Zalo cho khách.';
            if (order.channel === 'telegram' && order.tgUser && order.tgUser.id) {
                const sent = await sendMessage(botToken, {
                    chat_id: order.tgUser.id,
                    text: buildCustomerConfirmMessage(order),
                    parse_mode: 'HTML'
                });
                customerMsg = sent.ok
                    ? 'Đã xác nhận và nhắn báo khách thành công!'
                    : `Đã xác nhận, nhưng KHÔNG nhắn được cho khách (${sent.description || 'lỗi'}). Hãy gọi điện.`;
                await markCustomerNotified(db, orderId, !!sent.ok, sent.description || null)
                    .catch(err => logger.error('Khong ghi duoc trang thai bao khach', err));
            } else {
                await markCustomerNotified(db, orderId, false, 'khach dat tu web')
                    .catch(err => logger.error('Khong ghi duoc trang thai bao khach', err));
            }

            // Sua tin nhan goc: dong dau xac nhan, go nut de khong bam nham nua
            if (cq.message) {
                const newText = buildOwnerMessage(order) +
                    `\n\n✅ <b>ĐÃ XÁC NHẬN</b> lúc ${order.confirmedAtText}`;
                const edited = await editMessageText(
                    botToken, cq.message.chat.id, cq.message.message_id,
                    newText, buildOwnerKeyboard(order, true)
                );
                if (!edited.ok) logger.warn('Khong sua duoc tin nhan don', { orderId, edited });
            }

            await answerCallbackQuery(botToken, cq.id, `✅ ${customerMsg}`, true);
        } catch (err) {
            logger.error('Loi xu ly webhook xac nhan don', { orderId, err });
            try {
                await answerCallbackQuery(botToken, cq.id,
                    'Có lỗi khi xác nhận đơn. Vui lòng thử lại.', true);
            } catch (e) { /* het cach */ }
        }

        // Luon bao 200 du ket qua the nao, de Telegram khong gui lai lien tuc.
        return res.status(200).send('ok');
    }
);

/** Endpoint kiem tra suc khoe - dung de test nhanh sau khi deploy. */
exports.health = onRequest({ cors: true }, (req, res) => {
    res.json({ ok: true, service: 'tuongot-order-api', time: new Date().toISOString() });
});
