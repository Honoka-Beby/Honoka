document.addEventListener('DOMContentLoaded', () => {

    // --- Random Anime Wallpaper API for Homepage ---
    const setupHomepageBackground = async () => {
        if (document.body.classList.contains('is-homepage')) {
            try {
                // 这个API可能不稳定，可以换成其他，如 https://api.btstu.cn/sjbz/api.php?lx=dongman&format=json
                const response = await fetch('https://api.paugram.com/wallpaper?source=sina');
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                if (data && data.data && data.data.url) {
                    const heroSection = document.querySelector('.hero-section');
                    // Preload image for smoother transition
                    const img = new Image();
                    img.src = data.data.url;
                    img.onload = () => {
                        heroSection.style.backgroundImage = `url(${data.data.url})`;
                    };
                }
            } catch (error) {
                console.error('Failed to fetch wallpaper:', error);
                // Fallback background in case API fails
                document.querySelector('.hero-section').style.backgroundColor = '#1a1625';

            }
        }
    };

    // --- Scroll-Triggered Animations ---
    const setupScrollAnimations = () => {
        const animatedElements = document.querySelectorAll('.animate__fade-in, .animate__slide-up');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        animatedElements.forEach(el => observer.observe(el));
    };

    // --- Back to Top Button ---
    const setupBackToTopButton = () => {
        const btn = document.getElementById('back-to-top');
        if (!btn) return;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                btn.classList.add('show');
            } else {
                btn.classList.remove('show');
            }
        });

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    };
    
    // --- Custom Cursor Trail Effect ---
    const setupCursorTrail = () => {
        const cursorDot = document.getElementById('cursor-trail');
        if (!cursorDot) return;
        
        window.addEventListener('mousemove', e => {
            cursorDot.style.left = `${e.clientX}px`;
            cursorDot.style.top = `${e.clientY}px`;

            let trail = document.createElement('div');
            trail.className = 'cursor-trail-dot';
            document.body.appendChild(trail);
            trail.style.left = `${e.clientX}px`;
            trail.style.top = `${e.clientY}px`;
            
            setTimeout(() => {
                trail.style.opacity = '0';
                setTimeout(() => {
                   if (trail.parentNode) {
                        trail.parentNode.removeChild(trail);
                   }
                }, 500);
            }, 10);
        });

        document.querySelectorAll('a, button, input').forEach(el => {
            el.onmouseenter = () => cursorDot.style.transform = 'translate(-50%,-50%) scale(1.5)';
            el.onmouseleave = () => cursorDot.style.transform = 'translate(-50%,-50%) scale(1)';
        });
    };

    // Initialize all features
    setupHomepageBackground();
    setupScrollAnimations();
    setupBackToTopButton();
    setupCursorTrail();
});
