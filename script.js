// Khởi tạo các biến toàn cục
let cart = [];
let cartTotal = 0;

// Hàm khởi tạo khi trang web tải xong
document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo các tính năng
    initScrollEffects();
    initCart();
    initContactForm();
    initSmoothScroll();

    // Hiển thị animation khi tải trang
    animateOnLoad();
});

// Hàm khởi tạo hiệu ứng cuộn
function initScrollEffects() {
    const header = document.querySelector('.header');
    const scrollIndicator = document.querySelector('.scroll-indicator');

    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Hiệu ứng header khi cuộn
        if (scrollTop > 100) {
            header.style.background = 'rgba(139, 0, 0, 0.98)';
            header.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
        } else {
            header.style.background = 'rgba(139, 0, 0, 0.95)';
            header.style.boxShadow = 'none';
        }

        // Ẩn scroll indicator khi cuộn xuống
        if (scrollTop > 200) {
            scrollIndicator.style.opacity = '0';
        } else {
            scrollIndicator.style.opacity = '1';
        }
    });

    // Click scroll indicator để cuộn xuống
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', function() {
            document.querySelector('#products').scrollIntoView({
                behavior: 'smooth'
            });
        });
    }
}

// Hàm khởi tạo giỏ hàng
function initCart() {
    // Tải giỏ hàng từ localStorage nếu có
    const savedCart = localStorage.getItem('chiliSauceCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartDisplay();
    }
}

// Hàm khởi tạo form liên hệ
function initContactForm() {
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Lấy dữ liệu từ form
            const formData = new FormData(contactForm);
            const name = formData.get('name');
            const email = formData.get('email');
            const phone = formData.get('phone');
            const message = formData.get('message');

            // Hiển thị thông báo thành công
            showNotification(`Cảm ơn ${name}! Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.`, 'success');

            // Reset form
            contactForm.reset();

            // Lưu thông tin liên hệ (trong thực tế sẽ gửi đến server)
            saveContactInfo({ name, email, phone, message });
        });
    }
}

// Hàm khởi tạo smooth scroll cho navigation
function initSmoothScroll() {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');

            if (href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

// Hàm animation khi tải trang
function animateOnLoad() {
    // Animation cho các sản phẩm
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 200);
    });

    // Animation cho các testimonial
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    testimonialCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 300 + 500);
    });
}

// Hàm thêm sản phẩm vào giỏ hàng
function addToCart(productName, price) {
    // Tìm sản phẩm trong giỏ hàng
    const existingProduct = cart.find(item => item.name === productName);

    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        cart.push({
            name: productName,
            price: price,
            quantity: 1
        });
    }

    // Cập nhật tổng tiền
    cartTotal += price;

    // Lưu giỏ hàng vào localStorage
    localStorage.setItem('chiliSauceCart', JSON.stringify(cart));

    // Cập nhật hiển thị giỏ hàng
    updateCartDisplay();

    // Hiển thị thông báo
    showNotification(`${productName} đã được thêm vào giỏ hàng!`, 'success');

    // Hiệu ứng rung cho nút thêm vào giỏ
    const buttons = document.querySelectorAll('.btn-buy');
    buttons.forEach(btn => {
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btn.style.transform = 'scale(1)';
        }, 150);
    });
}

// Hàm cập nhật hiển thị giỏ hàng
function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const cartTotalElement = document.getElementById('cartTotal');

    if (cart.length === 0) {
        cartItems.innerHTML = '<p>Giỏ hàng trống</p>';
        cartTotalElement.textContent = '0';
        return;
    }

    let cartHTML = '';
    cart.forEach((item, index) => {
        cartHTML += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>₫${item.price.toLocaleString()}</p>
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
                    <button class="remove-btn" onclick="removeFromCart(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });

    cartItems.innerHTML = cartHTML;
    cartTotalElement.textContent = cartTotal.toLocaleString();
}

// Hàm cập nhật số lượng sản phẩm
function updateQuantity(index, change) {
    const item = cart[index];

    if (change === -1 && item.quantity === 1) {
        removeFromCart(index);
        return;
    }

    item.quantity += change;
    cartTotal += change * item.price;

    localStorage.setItem('chiliSauceCart', JSON.stringify(cart));
    updateCartDisplay();

    showNotification('Số lượng đã được cập nhật!', 'info');
}

// Hàm xóa sản phẩm khỏi giỏ hàng
function removeFromCart(index) {
    const item = cart[index];
    cartTotal -= item.price * item.quantity;
    cart.splice(index, 1);

    localStorage.setItem('chiliSauceCart', JSON.stringify(cart));
    updateCartDisplay();

    showNotification('Sản phẩm đã được xóa khỏi giỏ hàng!', 'warning');
}

// Hàm mở giỏ hàng
function openCart() {
    document.getElementById('cartModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Hàm đóng giỏ hàng
function closeCart() {
    document.getElementById('cartModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Hàm thanh toán
function checkout() {
    if (cart.length === 0) {
        showNotification('Giỏ hàng của bạn đang trống!', 'warning');
        return;
    }

    // Hiển thị thông tin thanh toán
    let orderSummary = '📋 ĐƠN HÀNG CỦA BẠN:\n\n';
    cart.forEach(item => {
        orderSummary += `• ${item.name} x ${item.quantity} = ₫${(item.price * item.quantity).toLocaleString()}\n`;
    });
    orderSummary += `\n💰 TỔNG CỘNG: ₫${cartTotal.toLocaleString()}`;
    orderSummary += '\n\n📞 Chúng tôi sẽ liên hệ với bạn để xác nhận đơn hàng!';

    showNotification(orderSummary, 'success');

    // Reset giỏ hàng sau khi thanh toán
    cart = [];
    cartTotal = 0;
    localStorage.removeItem('chiliSauceCart');
    updateCartDisplay();
    closeCart();
}

// Hàm hiển thị thông báo
function showNotification(message, type = 'info') {
    // Xóa thông báo cũ
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Tạo thông báo mới
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="closeNotification(this)">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // Thêm vào body
    document.body.appendChild(notification);

    // Hiển thị thông báo
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Tự động ẩn sau 5 giây
    setTimeout(() => {
        closeNotification(notification.querySelector('.notification-close'));
    }, 5000);
}

// Hàm đóng thông báo
function closeNotification(button) {
    const notification = button.closest('.notification');
    notification.classList.remove('show');
    setTimeout(() => {
        notification.remove();
    }, 300);
}

// Hàm cuộn đến phần sản phẩm
function scrollToProducts() {
    document.querySelector('#products').scrollIntoView({
        behavior: 'smooth'
    });
}

// Hàm cuộn đến phần giới thiệu
function scrollToAbout() {
    document.querySelector('#about').scrollIntoView({
        behavior: 'smooth'
    });
}

// Hàm lưu thông tin liên hệ
function saveContactInfo(contactInfo) {
    // Lấy danh sách liên hệ đã lưu
    let contacts = JSON.parse(localStorage.getItem('chiliSauceContacts') || '[]');

    // Thêm liên hệ mới
    contacts.push({
        ...contactInfo,
        date: new Date().toISOString(),
        id: Date.now()
    });

    // Lưu lại
    localStorage.setItem('chiliSauceContacts', JSON.stringify(contacts));
}

// Hàm hiển thị số lượng sản phẩm trong giỏ hàng trên header
function updateCartCount() {
    // Có thể thêm counter vào header nếu cần
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

    // Cập nhật title của trang với số lượng giỏ hàng
    if (cartCount > 0) {
        document.title = `Tương Ớt Siêu Cay (${cartCount})`;
    } else {
        document.title = 'Tương Ớt Siêu Cay Nguyên Chất - Đốt Cháy Vị Giác!';
    }
}

// Cập nhật số lượng giỏ hàng mỗi giây
setInterval(updateCartCount, 1000);

// Thêm CSS cho notification
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

.cart-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
    border-bottom: 1px solid #eee;
}

.cart-item:last-child {
    border-bottom: none;
}

.cart-item-info h4 {
    margin-bottom: 0.3rem;
    color: #8b0000;
}

.cart-item-info p {
    color: #666;
    font-size: 0.9rem;
}

.cart-item-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.quantity-btn {
    width: 30px;
    height: 30px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
}

.quantity-btn:hover {
    background: #ff6b35;
    color: white;
    border-color: #ff6b35;
}

.quantity {
    margin: 0 0.5rem;
    min-width: 20px;
    text-align: center;
}

.remove-btn {
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
}

.remove-btn:hover {
    background: #c82333;
    transform: scale(1.1);
}

/* Khởi tạo trạng thái ban đầu cho các elements */
document.addEventListener('DOMContentLoaded', function() {
    // Ẩn các product cards ban đầu để animation
    const productCards = document.querySelectorAll('.product-card');
    const testimonialCards = document.querySelectorAll('.testimonial-card');

    productCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.5s ease';
    });

    testimonialCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.5s ease';
    });
});
`;

// Thêm CSS vào head của document
const style = document.createElement('style');
style.textContent = notificationCSS;
document.head.appendChild(style);