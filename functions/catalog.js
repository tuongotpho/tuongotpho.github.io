/**
 * NGUON SU THAT DUY NHAT VE SAN PHAM & GIA.
 * Client (app.html, index.html) chi dung de HIEN THI.
 * Moi so tien gui ve deu bi tinh lai o day - khong bao gio tin gia tu client.
 */

const PRODUCTS = {
    p350: {
        name: 'Chai Siêu Cay 350ml',
        price: 30000,
        unit: 'chai',
        step: 1,
        min: 1,
        max: 200
    },
    p500: {
        name: 'Chai Truyền Thống 500ml',
        price: 45000,
        unit: 'chai',
        step: 1,
        min: 1,
        max: 200
    },
    pBulk: {
        name: 'Tương Ớt Bán Buôn (Can)',
        price: 60000,
        unit: 'Lít',
        step: 5,   // ban buon nhay theo can 5L
        min: 5,    // don toi thieu 5L nhu cong bo tren web
        max: 500
    }
};

/**
 * Chuan hoa so dien thoai Viet Nam ve dang 0xxxxxxxxx.
 * Tra ve null neu khong phai so hop le -> chan don rac ngay tu dau.
 */
function normalizePhone(raw) {
    let digits = String(raw || '').replace(/\D/g, '');

    if (digits.startsWith('84') && digits.length >= 11) {
        digits = '0' + digits.slice(2);
    }
    if (!digits.startsWith('0')) {
        digits = '0' + digits;
    }

    // Di dong VN: 10 so, dau 03/05/07/08/09. Co dinh Ha Noi/HCM: 10 so, dau 024/028.
    const isMobile = /^0(3|5|7|8|9)\d{8}$/.test(digits);
    const isLandline = /^0(2\d)\d{7,8}$/.test(digits);

    return (isMobile || isLandline) ? digits : null;
}

/**
 * Kiem tra gio hang tu client va tinh lai toan bo tien o phia server.
 * Tra ve { ok, error } hoac { ok: true, lines, subtotal, totalQty }.
 */
function buildOrderLines(rawItems) {
    const items = rawItems && typeof rawItems === 'object' ? rawItems : {};
    const lines = [];
    let subtotal = 0;
    let totalQty = 0;

    for (const [key, spec] of Object.entries(PRODUCTS)) {
        const qty = Number(items[key] || 0);

        if (!Number.isInteger(qty) || qty < 0) {
            return { ok: false, error: `Số lượng "${spec.name}" không hợp lệ.` };
        }
        if (qty === 0) continue;

        if (qty < spec.min) {
            return { ok: false, error: `${spec.name} phải đặt tối thiểu ${spec.min} ${spec.unit}.` };
        }
        if (qty % spec.step !== 0) {
            return { ok: false, error: `${spec.name} chỉ nhận bội số của ${spec.step} ${spec.unit}.` };
        }
        if (qty > spec.max) {
            return {
                ok: false,
                error: `Đơn ${spec.name} vượt quá ${spec.max} ${spec.unit}. Vui lòng gọi hotline 0982.722.036 để được báo giá sỉ riêng.`
            };
        }

        const amount = qty * spec.price;
        lines.push({ key, name: spec.name, unit: spec.unit, qty, price: spec.price, amount });
        subtotal += amount;
        totalQty += qty;
    }

    if (lines.length === 0) {
        return { ok: false, error: 'Vui lòng chọn ít nhất 1 sản phẩm trước khi đặt hàng.' };
    }

    return { ok: true, lines, subtotal, totalQty };
}

function formatVnd(amount) {
    return Number(amount || 0).toLocaleString('vi-VN') + '₫';
}

module.exports = { PRODUCTS, normalizePhone, buildOrderLines, formatVnd };
