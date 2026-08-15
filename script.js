// Trang chu Tuong Ot Bong Ot
//
// File nay KHONG con chua bot token. Moi lien he deu di qua API cua shop
// (/api/contact), giong nhu don hang di qua /api/order.
//
// Gio hang cu da duoc go bo hoan toan: no chua bao gio hoat dong (khong co
// nut "them vao gio" nao tren trang), va toan bo viec dat hang nay do
// app.html dam nhan.

const CONTACT_API_URL = (function () {
    const host = location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://127.0.0.1:5001/demo-tuongot/asia-southeast1/contact';
    }
    if (/\.(web\.app|firebaseapp\.com)$/.test(host)) return '/api/contact';
    return 'https://tuongot-sieucay.web.app/api/contact';
})();

const HOTLINE = '0982722036';

// Telegram Mini App SDK - co the trang chu duoc mo tu trong Telegram
const tgApp = (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp)
    ? window.Telegram.WebApp
    : null;

if (tgApp) {
    try {
        tgApp.ready();
        tgApp.expand();
    } catch (e) {
        console.warn('Telegram WebApp Init Warning:', e);
    }
}

function triggerHaptic(type = 'medium') {
    if (tgApp && tgApp.HapticFeedback) {
        try {
            if (type === 'success' || type === 'warning' || type === 'error') {
                tgApp.HapticFeedback.notificationOccurred(type);
            } else {
                tgApp.HapticFeedback.impactOccurred(type);
            }
        } catch (e) {}
    }
}

function newClientKey() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return `lh-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

document.addEventListener('DOMContentLoaded', function () {
    initScrollEffects();
    initContactForm();
    initSmoothScroll();
    animateOnLoad();
});

function initScrollEffects() {
    const header = document.querySelector('.header');
    const scrollIndicator = document.querySelector('.scroll-indicator');

    // Trang gallery va cac bai blog KHONG co 2 phan tu nay.
    // Thieu kiem tra null la moi lan khach cuon chuot lai no mot loi JS.
    if (!header && !scrollIndicator) return;

    window.addEventListener('scroll', function () {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (header) {
            if (scrollTop > 100) {
                header.style.background = 'rgba(139, 0, 0, 0.98)';
                header.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
            } else {
                header.style.background = 'rgba(139, 0, 0, 0.95)';
                header.style.boxShadow = 'none';
            }
        }

        if (scrollIndicator) {
            scrollIndicator.style.opacity = scrollTop > 200 ? '0' : '1';
        }
    });

    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', function () {
            const products = document.querySelector('#products');
            if (products) products.scrollIntoView({ behavior: 'smooth' });
        });
    }
}

// Form tu van / mua buon tren trang chu
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    let clientKey = newClientKey();

    // Tu dong dien ten neu trang duoc mo tu trong Telegram
    const tgUser = tgApp && tgApp.initDataUnsafe ? tgApp.initDataUnsafe.user : null;
    if (tgUser) {
        const nameInput = contactForm.querySelector('input[name="name"]');
        const fullName = `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim();
        if (nameInput && !nameInput.value && fullName) nameInput.value = fullName;
    }

    contactForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const btnHtmlGoc = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';
        }
        triggerHaptic('light');

        const data = new FormData(contactForm);

        try {
            const res = await fetch(CONTACT_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientKey: clientKey,
                    name: data.get('name') || '',
                    phone: data.get('phone') || '',
                    address: data.get('address') || '',
                    need: data.get('need') || 'khac',
                    message: data.get('message') || ''
                })
            });

            const ketQua = await res.json().catch(() => ({}));

            if (res.ok && ketQua.ok) {
                triggerHaptic('success');
                clientKey = newClientKey();
                contactForm.reset();
                thongBaoChoKhach(
                    `🎉 Cảm ơn bạn!\n\n📋 Mã liên hệ: ${ketQua.enquiryId}\n\n` +
                    `Chúng tôi sẽ gọi lại trong giờ làm việc (8:00 - 18:00). ` +
                    `Cần gấp thì gọi ngay ${HOTLINE}.`,
                    'success'
                );
            } else if (ketQua.error) {
                triggerHaptic('warning');
                thongBaoChoKhach('⚠️ ' + ketQua.error, 'warning');
            } else {
                throw new Error('API tra ve loi ' + res.status);
            }
        } catch (err) {
            console.error('Lỗi gửi liên hệ:', err);
            triggerHaptic('error');
            thongBaoChoKhach(
                `❌ Không gửi được do lỗi kết nối.\n\nVui lòng gọi hotline ${HOTLINE} ` +
                `hoặc nhắn Zalo cùng số này, chúng tôi hỗ trợ bạn ngay.`,
                'warning'
            );
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = btnHtmlGoc;
            }
        }
    });
}

function thongBaoChoKhach(message, type) {
    if (tgApp && tgApp.showAlert && tgApp.initData) {
        try {
            tgApp.showAlert(message);
            return;
        } catch (e) { /* roi xuong thong bao thuong */ }
    }
    showNotification(message, type);
}

function initSmoothScroll() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href') || '';
            if (!href.startsWith('#')) return;

            const target = document.getElementById(href.substring(1));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

function animateOnLoad() {
    document.querySelectorAll('.product-card').forEach((card, i) => {
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, i * 200);
    });

    document.querySelectorAll('.testimonial-card').forEach((card, i) => {
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, i * 300 + 500);
    });
}

function showNotification(message, type = 'info') {
    const cu = document.querySelector('.notification');
    if (cu) cu.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    const content = document.createElement('div');
    content.className = 'notification-content';

    // textContent chu khong phai innerHTML: noi dung co the chua chu khach nhap
    const span = document.createElement('span');
    span.className = 'notification-message';
    span.textContent = message;

    const btn = document.createElement('button');
    btn.className = 'notification-close';
    btn.innerHTML = '<i class="fas fa-times"></i>';
    btn.addEventListener('click', () => closeNotification(btn));

    content.appendChild(span);
    content.appendChild(btn);
    notification.appendChild(content);
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => closeNotification(btn), 8000);
}

function closeNotification(button) {
    const notification = button.closest('.notification');
    if (!notification) return;
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
}

function scrollToAbout() {
    const about = document.querySelector('#about');
    if (about) about.scrollIntoView({ behavior: 'smooth' });
}

function callNow() {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'goi_dien_dat_hang', {
            event_category: 'lien_he',
            event_label: 'nut_goi_ngay',
            value: 1
        });
    }
    window.location.href = `tel:${HOTLINE}`;
}

function contactZalo() {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'lien_he_zalo', {
            event_category: 'lien_he',
            event_label: 'nut_zalo',
            value: 1
        });
    }
    window.open(`https://zalo.me/${HOTLINE}`, '_blank');
}

const notificationCSS = `
.notification {
    position: fixed;
    top: 100px;
    right: 20px;
    background: white;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    z-index: 10001;
    transform: translateX(400px);
    opacity: 0;
    transition: all 0.3s ease;
    max-width: 350px;
    word-wrap: break-word;
    white-space: pre-line;
}

.notification.show {
    transform: translateX(0);
    opacity: 1;
}

.notification-success {
    border-left: 5px solid #28a745;
}

.notification-warning {
    border-left: 5px solid #ffc107;
}

.notification-info {
    border-left: 5px solid #17a2b8;
}

.notification-content {
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
}

.notification-message {
    flex: 1;
    line-height: 1.4;
}

.notification-close {
    background: none;
    border: none;
    color: #999;
    cursor: pointer;
    padding: 0;
    font-size: 1rem;
    transition: color 0.3s ease;
}

.notification-close:hover {
    color: #333;
}

.form-lead {
    font-size: 0.9rem;
    line-height: 1.5;
    color: #555;
    background: rgba(255, 107, 53, 0.08);
    border-radius: 10px;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
}

.form-lead a {
    color: #8b0000;
    font-weight: 700;
}

.contact-form select {
    width: 100%;
    padding: 1rem;
    border: 2px solid #eee;
    border-radius: 10px;
    font-size: 1rem;
    font-family: inherit;
    background: white;
    color: #333;
    cursor: pointer;
}

.contact-form select:focus {
    outline: none;
    border-color: #ff6b35;
}
`;

const style = document.createElement('style');
style.textContent = notificationCSS;
document.head.appendChild(style);
