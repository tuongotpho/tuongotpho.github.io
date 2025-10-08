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

        // Form submission tracking
        const contactForm = document.querySelector('.contact-form form');
        if (contactForm) {
            contactForm.addEventListener('submit', function() {
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
                header.style.background = 'rgba(44, 62, 80, 0.95)'; /* Màu dark đậm hơn khi cuộn */
                header.style.backdropFilter = 'blur(10px)';
            } else {
                header.style.background = 'var(--dark)'; /* Màu dark mặc định */
                header.style.backdropFilter = 'none';
            }
            
            lastScroll = currentScroll;
        });