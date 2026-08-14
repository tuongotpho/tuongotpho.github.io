/**
 * Kiem thu webhook xac nhan don tren Firebase Emulator.
 *
 *   firebase emulators:start --only functions,firestore --project demo-tuongot
 *   node functions/test-webhook.js
 *
 * Token gia trong .secret.local nen moi loi goi ra Telegram deu that bai -
 * dung nhu mong muon: bai test chi quan tam trang thai don trong Firestore.
 */

const crypto = require('crypto');

const BASE = 'http://127.0.0.1:5001/demo-tuongot/asia-southeast1';
const FAKE_TOKEN = '123456:FAKE_TOKEN_FOR_LOCAL_TEST';
const SECRET = crypto.createHash('sha256').update(FAKE_TOKEN).digest('hex');
const OWNER_ID = 5056715300;

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
initializeApp({ projectId: 'demo-tuongot' });
const db = getFirestore('tuongot');

let pass = 0, fail = 0;
const check = (label, ok, detail) => {
    if (ok) { pass++; console.log('  ok   ' + label); }
    else { fail++; console.log('  FAIL ' + label + '  ->  ' + JSON.stringify(detail)); }
};

const RUN = Math.floor(Math.random() * 200);

async function taoDon(extra = {}) {
    const res = await fetch(`${BASE}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `192.0.${RUN}.9` },
        body: JSON.stringify({
            name: 'Khach Kiem Thu',
            phone: '0912345678',
            address: '1 Duong Test, Ba Dinh, Ha Noi',
            items: { p350: 1 },
            clientKey: 'wh-' + Math.random(),
            ...extra
        })
    });
    return (await res.json()).orderId;
}

function bamNutXacNhan(orderId, { secret = SECRET, fromId = OWNER_ID } = {}) {
    return fetch(`${BASE}/telegramWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-telegram-bot-api-secret-token': secret },
        body: JSON.stringify({
            update_id: Date.now(),
            callback_query: {
                id: String(Date.now()),
                from: { id: fromId, first_name: 'Chu Shop' },
                data: 'cf:' + orderId,
                message: { message_id: 999, chat: { id: OWNER_ID }, text: 'don hang' }
            }
        })
    });
}

const doc = id => db.collection('orders').doc(id).get().then(s => s.data());
const doi = ms => new Promise(r => setTimeout(r, ms));

(async () => {
    console.log('\n=== 1. Chu shop bam nut xac nhan ===');
    const id1 = await taoDon();
    const r1 = await bamNutXacNhan(id1);
    check('webhook tra 200 ngay lap tuc', r1.status === 200, r1.status);
    await doi(2500);
    const d1 = await doc(id1);
    check('don chuyen sang trang thai confirmed', d1.status === 'confirmed', d1.status);
    check('co ghi lai thoi diem xac nhan', !!d1.confirmedAtText, d1.confirmedAtText);
    check('co ghi lai nguoi xac nhan', d1.confirmedBy === String(OWNER_ID), d1.confirmedBy);

    console.log('\n=== 2. Bam lai lan 2 (khong duoc bao khach 2 lan) ===');
    const mocCu = d1.confirmedAtText;
    await bamNutXacNhan(id1);
    await doi(2000);
    const d2 = await doc(id1);
    check('thoi diem xac nhan KHONG bi ghi de', d2.confirmedAtText === mocCu, d2.confirmedAtText);

    console.log('\n=== 3. Secret sai bi chan ===');
    const id3 = await taoDon();
    const r3 = await bamNutXacNhan(id3, { secret: 'sai-be-bet' });
    check('tra ve 403', r3.status === 403, r3.status);
    await doi(1500);
    check('don KHONG bi xac nhan', (await doc(id3)).status === 'new', (await doc(id3)).status);

    console.log('\n=== 4. Nguoi la bam nut (secret dung nhung khong phai chu shop) ===');
    const id4 = await taoDon();
    await bamNutXacNhan(id4, { fromId: 99999999 });
    await doi(2000);
    check('don KHONG bi xac nhan', (await doc(id4)).status === 'new', (await doc(id4)).status);

    console.log('\n=== 5. Ma don khong ton tai ===');
    const r5 = await bamNutXacNhan('BO-999999-999');
    check('van tra 200, khong sap function', r5.status === 200, r5.status);

    console.log('\n=== 6. Su kien khac (tin nhan thuong) bi bo qua ===');
    const r6 = await fetch(`${BASE}/telegramWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-telegram-bot-api-secret-token': SECRET },
        body: JSON.stringify({ update_id: 1, message: { text: '/start' } })
    });
    check('tra 200 va khong lam gi', r6.status === 200, r6.status);

    console.log(`\n============ KET QUA: ${pass} dat / ${fail} loi ============\n`);
    process.exit(fail > 0 ? 1 : 0);
})();
