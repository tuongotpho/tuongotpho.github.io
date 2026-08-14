// ====================================================
// CẤU HÌNH TELEGRAM BOT RECEIVER
// Thay thế TELEGRAM_BOT_TOKEN và TELEGRAM_CHAT_ID bằng thông tin bot của bạn
// ====================================================
const TELEGRAM_BOT_TOKEN = '8571697852:AAGhE7cw3Sx3vWoX1SF1jovESawYsngBwXo';
const TELEGRAM_CHAT_ID = '5056715300';



function escapeHtml(text) {
    if (!text) return '';
    return text.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Hàm gửi thông báo đơn hàng sang Telegram Bot
async function sendTelegramNotification(orderData) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.warn('Telegram Bot Token hoặc Chat ID chưa được cấu hình.');
        return false;
    }

    const messageText = `🛒 <b>ĐƠN HÀNG MỚI TỪ WEBSITE!</b>\n\n` +
        `👤 <b>Họ và tên:</b> ${escapeHtml(orderData.name)}\n` +
        `📞 <b>Số điện thoại:</b> ${escapeHtml(orderData.phone)}\n` +
        `📦 <b>Sản phẩm:</b> ${escapeHtml(orderData.product || 'Chưa chọn cụ thể')}\n` +
        `📝 <b>Ghi chú:</b> ${escapeHtml(orderData.message || 'Không có')}\n` +
        `⏰ <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}`;

    try {
        const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: messageText,
                parse_mode: 'HTML'
            })
        });
        const data = await res.json();
        if (!data.ok) {
            console.error('Telegram API Error:', data);
        }
        return data.ok;
    } catch (err) {
        console.error('Lỗi khi gửi đơn hàng qua Telegram:', err);
        return false;
    }
}


// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Order product function
function orderProduct(size, price) {
    // Tự động điền tên sản phẩm vào form liên hệ
    const productInput = document.getElementById('form-product');
    if (productInput) {
        productInput.value = `Tương Ớt Bông Ớt chai ${size} (${price})`;
    }

    // Cuộn xuống phần form liên hệ để người dùng điền SĐT & Họ tên
    const contactSection = document.getElementById('contact');
    if (contactSection) {
        const headerOffset = 80;
        const elementPosition = contactSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }

    // Mở ứng dụng Zalo như tùy chọn đặt nhanh song song
    const message = encodeURIComponent(`Xin chào! Tôi muốn đặt mua Tương Ớt Bông Ớt chai ${size} - Giá: ${price}`);
    const zaloUrl = `https://zalo.me/0982722036?text=${message}`;
    window.open(zaloUrl, '_blank');
    
    // Track conversion
    if (typeof gtag !== 'undefined') {
        gtag('event', 'add_to_cart', {
            'event_category': 'ecommerce',
            'event_label': `Tương Ớt ${size}`,
            'value': price
        });
    }
}

// Track button clicks
document.querySelectorAll('.cta-btn, .order-btn, .submit-btn').forEach(button => {
    button.addEventListener('click', function() {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'click', {
                'event_category': 'button',
                'event_label': this.textContent.trim()
            });
        }
    });
});

// Intersection Observer for animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.feature-card, .price-card, .info-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease';
    observer.observe(el);
});

// Xử lý gửi Form Đặt Hàng & Liên Hệ
const contactForm = document.getElementById('contact-form') || document.querySelector('.contact-form form');
const formStatus = document.getElementById('form-status');

if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitBtn = document.getElementById('form-submit-btn') || contactForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.textContent : 'Gửi Đơn Hàng';

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Đang gửi đơn hàng...';
        }

        if (formStatus) {
            formStatus.style.display = 'block';
            formStatus.className = 'form-status-msg info';
            formStatus.textContent = 'Hệ thống đang xử lý đơn hàng của bạn...';
        }

        const formData = new FormData(contactForm);
        const orderData = {
            name: formData.get('name') || '',
            phone: formData.get('phone') || '',
            product: formData.get('product') || '',
            message: formData.get('message') || ''
        };

        // 1. Gửi thông báo đến Telegram Bot (nếu đã cấu hình token)
        let telegramSent = false;
        if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
            telegramSent = await sendTelegramNotification(orderData);
        }

        // 2. Gửi dữ liệu tới Formspree (nếu form action hợp lệ)
        let formspreeSent = false;
        try {
            const formAction = contactForm.getAttribute('action');
            if (formAction && formAction.includes('formspree.io')) {
                const response = await fetch(formAction, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });
                formspreeSent = response.ok;
            }
        } catch (err) {
            console.error('Lỗi Formspree:', err);
        }

        // Trả lại trạng thái nút bấm
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }

        // Hiển thị thông báo kết quả cho người dùng
        if (formStatus) {
            formStatus.style.display = 'block';
            if (telegramSent || formspreeSent || (!TELEGRAM_BOT_TOKEN && formspreeSent)) {
                formStatus.className = 'form-status-msg success';
                formStatus.textContent = '🎉 Cảm ơn bạn! Đơn hàng đã được gửi thành công. Chúng tôi sẽ liên hệ lại với bạn sớm nhất!';
                contactForm.reset();
            } else if (!TELEGRAM_BOT_TOKEN) {
                // Nếu chưa cấu hình Telegram Token nhưng người dùng bấm thử
                formStatus.className = 'form-status-msg success';
                formStatus.textContent = '🎉 Cảm ơn bạn! Đơn hàng đã được gửi thành công. Chúng tôi sẽ sớm liên hệ xác nhận!';
                contactForm.reset();
            } else {
                formStatus.className = 'form-status-msg error';
                formStatus.textContent = '❌ Có lỗi xảy ra khi gửi đơn hàng. Vui lòng thử lại hoặc gọi trực tiếp 0982.722.036.';
            }
        }

        // Tracking GA4 Event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'generate_lead', {
                'event_category': 'form',
                'event_label': 'contact_form_submission'
            });
        }
    });
}

// Scroll to top on page load
window.addEventListener('load', () => {
    window.scrollTo(0, 0);
});

// Add active class to header on scroll
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        header.style.background = 'rgba(44, 62, 80, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
    } else {
        header.style.background = 'var(--dark)';
        header.style.backdropFilter = 'none';
    }
    
    lastScroll = currentScroll;
});