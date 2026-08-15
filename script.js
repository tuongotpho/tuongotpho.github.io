// Trang chu Tuong Ot Bong Ot
//
// File nay KHONG chua bot token va khong goi API nao.
//
// Trang chu chi lam nhiem vu gioi thieu. Moi viec dat hang deu chuyen sang
// app.html, con lien he gap thi goi hotline hoac nhan Zalo.
//
// Gio hang cu va form lien he cu deu da duoc go bo: gio hang chua bao gio
// hoat dong (khong he co nut "them vao gio"), con form lien he thi trung
// lap voi luong dat hang.

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

document.addEventListener('DOMContentLoaded', function () {
    initScrollEffects();
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
