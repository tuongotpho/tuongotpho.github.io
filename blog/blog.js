// Blog JavaScript - Shared functionality

// Copy link to clipboard
function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Đã sao chép liên kết!');
    });
}

// Share to Facebook
function shareToFacebook() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
}

// Share to Twitter
function shareToTwitter() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, '_blank', 'width=600,height=400');
}

// Smooth scroll to top
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Reading progress bar
function initReadingProgress() {
    const progressBar = document.createElement('div');
    progressBar.id = 'reading-progress';
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 4px;
        background: linear-gradient(90deg, #ff5733, #ff7e5f, #feb47b);
        z-index: 9999;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (scrollTop / docHeight) * 100;
        progressBar.style.width = progress + '%';
    });
}

// Muc luc tu dong.
// Cac bai dai 6-10 phut doc co 5-8 muc lon nhung khong co cach nao nhay
// nhanh - khach phai cuon mo. Muc luc duoc sinh tu chinh cac the H2 nen
// khong phai sua tay tung bai, va khong bao gio lech voi noi dung.
function initTableOfContents() {
    const than = document.querySelector('.article-body');
    if (!than) return;

    const muc = [...than.querySelectorAll('h2')];
    if (muc.length < 4) return; // bai ngan thi muc luc chi tho^ them

    const khongDau = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const ds = document.createElement('nav');
    ds.className = 'article-toc';
    ds.setAttribute('aria-label', 'Mục lục bài viết');

    let html = '<button type="button" class="article-toc-title" aria-expanded="true">'
        + '<span><i class="fas fa-list-ul"></i> Nội dung bài viết</span>'
        + '<i class="fas fa-chevron-up article-toc-caret"></i></button><ol class="article-toc-list">';

    muc.forEach((h, i) => {
        const chu = h.textContent.trim();
        if (!h.id) h.id = 'muc-' + (khongDau(chu) || i);
        html += `<li><a href="#${h.id}">${chu}</a></li>`;
    });
    ds.innerHTML = html + '</ol>';

    // Dat ngay sau doan mo dau de nguoi doc thay bo cuc truoc khi doc sau
    const doanDau = than.querySelector('p');
    if (doanDau && doanDau.nextSibling) than.insertBefore(ds, doanDau.nextSibling);
    else than.insertBefore(ds, than.firstChild);

    const nut = ds.querySelector('.article-toc-title');
    nut.addEventListener('click', () => {
        const dangMo = ds.classList.toggle('closed') === false;
        nut.setAttribute('aria-expanded', String(dangMo));
    });

    // Tren dien thoai thi thu gon san cho do chiem man hinh
    if (window.matchMedia('(max-width: 768px)').matches) {
        ds.classList.add('closed');
        nut.setAttribute('aria-expanded', 'false');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initReadingProgress();
    initTableOfContents();
    
    // Add animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.blog-card, .chili-type-card, .heat-item, .info-box').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Contact functions (same as main page)
function callNow() {
    window.location.href = 'tel:0982722036';
}

function contactZalo() {
    window.open('https://zalo.me/0982722036', '_blank');
}
