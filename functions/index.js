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
const { verifyInitData, buildOwnerMessage, buildOwnerKeyboard, sendMessage } = require('./telegram');
const { createOrder, findOrderByClientKey, checkRateLimit, markNotified } = require('./orders');

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

/** Endpoint kiem tra suc khoe - dung de test nhanh sau khi deploy. */
exports.health = onRequest({ cors: true }, (req, res) => {
    res.json({ ok: true, service: 'tuongot-order-api', time: new Date().toISOString() });
});
