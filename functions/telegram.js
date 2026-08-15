const crypto = require('crypto');
const { formatVnd } = require('./catalog');

const SHOP_MAP_URL = 'https://maps.app.goo.gl/Kgb7iHMjhNCQFnSu9';

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Xac thuc initData cua Telegram Mini App theo thuat toan chinh thuc:
 *   secret_key = HMAC_SHA256(key="WebAppData", data=bot_token)
 *   hash       = HMAC_SHA256(key=secret_key, data=data_check_string)
 *
 * Nho buoc nay, truong "khach dat tu Telegram" moi la su that -
 * client khong the tu bia ra user id de mao danh nguoi khac.
 */
function verifyInitData(initData, botToken, maxAgeSeconds = 86400) {
    if (!initData || typeof initData !== 'string') {
        return { valid: false, reason: 'missing' };
    }

    let params;
    try {
        params = new URLSearchParams(initData);
    } catch (e) {
        return { valid: false, reason: 'malformed' };
    }

    const hash = params.get('hash');
    if (!hash) return { valid: false, reason: 'no_hash' };
    params.delete('hash');

    const dataCheckString = [...params.entries()]
        .map(([k, v]) => `${k}=${v}`)
        .sort()
        .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const computed = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    const a = Buffer.from(computed, 'utf8');
    const b = Buffer.from(hash, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return { valid: false, reason: 'bad_hash' };
    }

    const authDate = Number(params.get('auth_date') || 0);
    if (!authDate || (Date.now() / 1000 - authDate) > maxAgeSeconds) {
        return { valid: false, reason: 'expired' };
    }

    let user = null;
    try {
        user = JSON.parse(params.get('user') || 'null');
    } catch (e) {
        return { valid: false, reason: 'bad_user' };
    }
    if (!user || !user.id) return { valid: false, reason: 'no_user' };

    return { valid: true, user };
}

/** Soan tin nhan don hang gui cho chu shop. */
function buildOwnerMessage(order) {
    const itemLines = order.lines
        .map(l => `• <b>${l.qty}</b> ${l.unit} ${escapeHtml(l.name)} — ${formatVnd(l.amount)}`)
        .join('\n');

    let channelLine;
    if (order.channel === 'telegram') {
        const uname = order.tgUser.username ? `@${escapeHtml(order.tgUser.username)}` : 'không có username';
        channelLine = `📱 <b>Kênh đặt:</b> Telegram Mini App ✅ đã xác thực\n` +
            `👥 <b>Tài khoản:</b> ${uname} — ID <code>${order.tgUser.id}</code>`;
    } else {
        channelLine = `🌐 <b>Kênh đặt:</b> Trình duyệt Web (khách không dùng Telegram)`;
    }

    return `🔥 <b>ĐƠN HÀNG MỚI</b> — <code>${order.orderId}</code>\n\n` +
        `👤 <b>Khách hàng:</b> ${escapeHtml(order.customer.name)}\n` +
        `📞 <b>Điện thoại:</b> <code>${escapeHtml(order.customer.phone)}</code>\n` +
        `📍 <b>Địa chỉ:</b> ${escapeHtml(order.customer.address)}\n` +
        `📝 <b>Ghi chú:</b> ${escapeHtml(order.customer.note || 'Không có')}\n\n` +
        `📦 <b>Chi tiết:</b>\n${itemLines}\n\n` +
        `💰 <b>TỔNG TIỀN HÀNG:</b> <b>${formatVnd(order.subtotal)}</b>\n` +
        `🚚 <i>Phí ship báo sau khi chốt địa chỉ</i>\n\n` +
        channelLine + `\n` +
        `⏰ <b>Thời gian:</b> ${order.createdAtText}`;
}

/** Cac muc dich khach co the chon o form lien he trang chu. */
const NHU_CAU = {
    le: 'Mua lẻ / dùng gia đình',
    buon: 'Mua buôn — quán phở, nhà hàng, đại lý',
    tuvan: 'Tư vấn sản phẩm',
    khac: 'Việc khác'
};

/** Soan tin nhan lien he / xin tu van gui cho chu shop. */
function buildEnquiryMessage(enquiry) {
    return `💬 <b>LIÊN HỆ MỚI</b> — <code>${enquiry.orderId}</code>\n\n` +
        `👤 <b>Họ tên:</b> ${escapeHtml(enquiry.customer.name)}\n` +
        `📞 <b>Điện thoại:</b> <code>${escapeHtml(enquiry.customer.phone)}</code>\n` +
        `🎯 <b>Nhu cầu:</b> ${escapeHtml(NHU_CAU[enquiry.need] || NHU_CAU.khac)}\n` +
        `📍 <b>Địa chỉ:</b> ${escapeHtml(enquiry.customer.address || 'Chưa cung cấp')}\n` +
        `📝 <b>Lời nhắn:</b> ${escapeHtml(enquiry.customer.message || 'Không có')}\n\n` +
        `🌐 <b>Nguồn:</b> Form liên hệ trang chủ\n` +
        `⏰ <b>Thời gian:</b> ${enquiry.createdAtText}`;
}

/** Nut hanh dong cho tin nhan lien he - khong co nut xac nhan vi day khong phai don hang. */
function buildEnquiryKeyboard(enquiry) {
    const actions = [];
    if (enquiry.customer.phone) {
        actions.push({ text: '💬 Chat Zalo', url: `https://zalo.me/${enquiry.customer.phone}` });
    }
    actions.push({ text: '📍 Vị Trí Shop', url: SHOP_MAP_URL });
    return [actions];
}

/** Tien to cua callback_data khi chu shop bam nut xac nhan. */
const CONFIRM_PREFIX = 'cf:';

/**
 * Cac nut hanh dong dinh kem tin nhan don hang.
 *
 * Nut xac nhan dung callback_data chu khong phai URL nhu truoc:
 *  - Bam 2 lan khong gui 2 tin cho khach (URL thi bam bao nhieu lan cung gui)
 *  - Don tu WEB cung co nut, bam vao la danh dau da chot trong so sach,
 *    thay vi ngo cut nhu truoc
 *  - Khong con can mo trang app.html?action=confirm, tuc la bot token
 *    khong con ly do ton tai trong ma nguon client
 */
function buildOwnerKeyboard(order, confirmed = false) {
    const rows = [];

    if (!confirmed) {
        const label = (order.channel === 'telegram' && order.tgUser && order.tgUser.id)
            ? '✅ Xác Nhận Đơn & Báo Khách'
            : '✅ Xác Nhận Đơn (khách đặt từ web)';
        rows.push([{ text: label, callback_data: CONFIRM_PREFIX + order.orderId }]);
    }

    const actions = [];
    if (order.customer.phone) {
        actions.push({ text: '💬 Chat Zalo', url: `https://zalo.me/${order.customer.phone}` });
    }
    actions.push({ text: '📍 Vị Trí Shop', url: SHOP_MAP_URL });
    rows.push(actions);

    return rows;
}

/** Tin nhan bao khach da duoc duyet don - kem ma don va chi tiet hang. */
function buildCustomerConfirmMessage(order) {
    const itemLines = order.lines
        .map(l => `• <b>${l.qty}</b> ${l.unit} ${escapeHtml(l.name)} — ${formatVnd(l.amount)}`)
        .join('\n');

    return `🌶️ <b>ĐƠN HÀNG ĐÃ ĐƯỢC XÁC NHẬN</b> 🌶️\n\n` +
        `Chào <b>${escapeHtml(order.customer.name)}</b>, đơn của bạn đã được cửa hàng duyệt! 🎉\n\n` +
        `📋 <b>Mã đơn:</b> <code>${order.orderId}</code>\n` +
        `📦 <b>Chi tiết:</b>\n${itemLines}\n` +
        `💰 <b>Tổng tiền hàng:</b> <b>${formatVnd(order.subtotal)}</b>\n` +
        `📍 <b>Giao tới:</b> ${escapeHtml(order.customer.address)}\n\n` +
        `🚚 <b>Dự kiến giao:</b> 1 - 2 ngày làm việc\n` +
        `📞 <b>Hotline hỗ trợ:</b> 0982.722.036\n\n` +
        `Cảm ơn bạn đã tin dùng Tương Ớt Bông Ớt! ❤️`;
}

/**
 * Chuoi bi mat dung de xac thuc webhook, suy ra tu chinh bot token.
 *
 * Lam vay de khong phai quan them mot secret thu hai (viec nap secret da
 * hong 3 lan roi). Doi lai: moi lan revoke token thi chuoi nay doi theo,
 * BAT BUOC phai chay lai setup-webhook.js.
 */
function webhookSecretFor(botToken) {
    return crypto.createHash('sha256').update(botToken.trim()).digest('hex');
}

function safeEquals(a, b) {
    const bufA = Buffer.from(String(a || ''), 'utf8');
    const bufB = Buffer.from(String(b || ''), 'utf8');
    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

async function callTelegram(botToken, method, payload) {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    return res.json();
}

function sendMessage(botToken, payload) {
    return callTelegram(botToken, 'sendMessage', payload);
}

/** Bat buoc goi trong vong ~10 giay, neu khong nut se quay vong mai tren may chu shop. */
function answerCallbackQuery(botToken, callbackQueryId, text, showAlert = false) {
    return callTelegram(botToken, 'answerCallbackQuery', {
        callback_query_id: callbackQueryId,
        text: text.slice(0, 200),
        show_alert: showAlert
    });
}

function editMessageText(botToken, chatId, messageId, text, inlineKeyboard) {
    return callTelegram(botToken, 'editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: inlineKeyboard }
    });
}

module.exports = {
    CONFIRM_PREFIX,
    NHU_CAU,
    buildEnquiryMessage,
    buildEnquiryKeyboard,
    escapeHtml,
    verifyInitData,
    buildOwnerMessage,
    buildOwnerKeyboard,
    buildCustomerConfirmMessage,
    webhookSecretFor,
    safeEquals,
    sendMessage,
    answerCallbackQuery,
    editMessageText
};
