document.addEventListener('DOMContentLoaded', () => {

    console.log("🚀 [Final Version 3.0] script.js STARTING execution...");

    // ===================================================================
    // 1. CORE UTILITIES & STATE
    // ===================================================================

    let isMobile = window.innerWidth <= 767;

    const updateMobileClass = () => {
        const currentIsMobile = window.innerWidth <= 767;
        if (currentIsMobile !== isMobile) {
            isMobile = currentIsMobile;
            document.body.classList.toggle('is-mobile', isMobile);
        }
    };
    window.addEventListener('resize', updateMobileClass);

    // ===================================================================
    // 2. ULTIMATE VISIBILITY FIX
    // This now runs immediately to prevent any blank page issues.
    // ===================================================================
    const setupCoreVisibility = () => {
        const coreElements = document.querySelectorAll('.main-header, .hero-content, .content-page-wrapper, main.container, .main-footer, .main-content');
        if (coreElements.length > 0) {
            coreElements.forEach(el => {
                el.classList.add('force-visible');
            });
            console.log("[Visibility] Core UI visibility has been forced. Blank page issue SOLVED.");
        }

        const animatedElements = document.querySelectorAll('[class*="animate__"]');
        if (animatedElements.length > 0) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1
            });
            animatedElements.forEach(el => observer.observe(el));
        }
    };
    
    // ===================================================================
    // 3. PAGE TRANSITION LOGIC
    // ===================================================================
    const pageTransitionOverlay = document.getElementById('global-page-transition-overlay');
    
    const initPageTransition = () => {
        if (pageTransitionOverlay) {
            pageTransitionOverlay.classList.remove('visible');
            setTimeout(() => pageTransitionOverlay.style.display = 'none', 500);
        }
        
        document.querySelectorAll('a').forEach(link => {
            const url = new URL(link.href, window.location.origin);
            if (url.hostname === window.location.hostname && !link.href.includes('#') && link.target !== '_blank') {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (pageTransitionOverlay) {
                        pageTransitionOverlay.style.display = 'flex';
                        setTimeout(() => pageTransitionOverlay.classList.add('visible'), 10);
                        setTimeout(() => window.location.href = link.href, 400);
                    } else {
                        window.location.href = link.href;
                    }
                });
            }
        });
    };

    // ===================================================================
    // 4. DYNAMIC IMAGE & CURSOR & OTHER UI
    // ===================================================================
    
    const applyFallbackImage = (imgElement, type) => {
        const fallbackSrc = `/img/post-thumbnail-fallback.png`;
        if (type === 'background') {
            document.documentElement.style.setProperty('--bg-image', 'var(--bg-fallback-color)');
        } else {
            imgElement.src = fallbackSrc;
        }
    };

    const fetchRandomAnimeImage = async (imgElement, type) => {
        try {
            const response = await fetch('https://api.btstu.cn/sjbz/api.php?lx=dongman&format=images');
            if (response.ok && response.url) {
                const img = new Image();
                img.src = response.url;
                img.onload = () => {
                    if (type === 'background') {
                        document.documentElement.style.setProperty('--bg-image', `url('${response.url}')`);
                    } else {
                        imgElement.src = response.url;
                        imgElement.classList.remove('is-loading-fallback');
                    }
                };
                img.onerror = () => applyFallbackImage(imgElement, type);
            } else {
                applyFallbackImage(imgElement, type);
            }
        } catch (error) {
            console.error('[ImageLoader] Failed to fetch random image:', error);
            applyFallbackImage(imgElement, type);
        }
    };

    const setupCursorTrail = () => {
        const cursorDot = document.getElementById('cursor-trail');
        if (cursorDot && !isMobile) {
            document.body.style.cursor = 'none';
            window.addEventListener('mousemove', e => {
                cursorDot.style.left = `${e.clientX}px`;
                cursorDot.style.top = `${e.clientY}px`;
            });
            document.querySelectorAll('a, button, .post-card').forEach(el => {
                el.addEventListener('mouseenter', () => cursorDot.style.transform = 'translate(-50%, -50%) scale(1.5)');
                el.addEventListener('mouseleave', () => cursorDot.style.transform = 'translate(-50%, -50%) scale(1)');
            });
        }
    };

    const setupMainMenu = () => {
        const toggle = document.querySelector('.menu-toggle');
        const nav = document.getElementById('main-nav-menu');
        if (!toggle || !nav) return;

        const closeMenu = () => {
            nav.classList.remove('is-open');
            toggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('no-scroll');
        };

        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            nav.classList.toggle('is-open');
            const isOpen = nav.classList.contains('is-open');
            toggle.setAttribute('aria-expanded', String(isOpen));
            document.body.classList.toggle('no-scroll', isOpen);
        });

        document.addEventListener('click', e => {
            if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) {
                closeMenu();
            }
        });

        nav.querySelector('.menu-close')?.addEventListener('click', closeMenu);
    };

    const setupFooter = () => {
        const yearSpan = document.getElementById('current-year');
        if (yearSpan) yearSpan.textContent = new Date().getFullYear();

        const visitorSpan = document.getElementById('visitor-count');
        if (visitorSpan) {
            fetch('https://honoka1.netlify.app/.netlify/functions/handleVisitCount')
                .then(res => res.json())
                .then(data => {
                    if (data.count) visitorSpan.textContent = data.count;
                })
                .catch(err => console.error("Could not fetch visitor count", err));
        }
    };
    
    // Function to handle all UI initializations
    const initializeUI = () => {
        updateMobileClass();
        fetchRandomAnimeImage(document.body, 'background');
        document.querySelectorAll('.post-thumbnail, .post-detail-banner').forEach(img => {
            if(img) fetchRandomAnimeImage(img, 'image');
        });
        setupCursorTrail();
        setupMainMenu();
        setupFooter();
    };

    // ===================================================================
    // 6. INITIALIZATION SEQUENCE
    // ===================================================================

    // Run critical visibility fix FIRST and synchronously
    setupCoreVisibility();
    
    // Run all other non-critical initializations after
    initPageTransition();
    initializeUI();

    console.log("✅ [Final Version 3.0] script.js FINISHED execution. Site is now fully operational.");
});
