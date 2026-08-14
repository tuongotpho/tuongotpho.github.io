const crypto = require('crypto');
const { formatVnd } = require('./catalog');

const SHOP_MAP_URL = 'https://maps.app.goo.gl/Kgb7iHMjhNCQFnSu9';
const CONFIRM_BASE_URL = 'https://tuongotpho.github.io/app.html';

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

/** Cac nut hanh dong dinh kem tin nhan don hang. */
function buildOwnerKeyboard(order) {
    const rows = [];

    if (order.channel === 'telegram' && order.tgUser && order.tgUser.id) {
        const url = `${CONFIRM_BASE_URL}?action=confirm` +
            `&to_id=${encodeURIComponent(order.tgUser.id)}` +
            `&name=${encodeURIComponent(order.customer.name)}` +
            `&order=${encodeURIComponent(order.orderId)}`;
        rows.push([{ text: '✅ Xác Nhận Đơn & Báo Khách', url }]);
    }

    const actions = [];
    if (order.customer.phone) {
        actions.push({ text: '💬 Chat Zalo', url: `https://zalo.me/${order.customer.phone}` });
    }
    actions.push({ text: '📍 Vị Trí Shop', url: SHOP_MAP_URL });
    rows.push(actions);

    return rows;
}

async function sendMessage(botToken, payload) {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    return res.json();
}

module.exports = {
    escapeHtml,
    verifyInitData,
    buildOwnerMessage,
    buildOwnerKeyboard,
    sendMessage
};
