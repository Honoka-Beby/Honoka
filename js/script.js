document.addEventListener('DOMContentLoaded', () => {

    console.log("🚀 [Final Version 2.0] script.js STARTING execution...");

    // ===================================================================
    // 1. CORE UTILITIES & STATE
    // ===================================================================

    let isMobile = window.innerWidth <= 767;

    const updateBodyBlur = () => {
        const desktopBlur = getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur').trim();
        const mobileBlur = getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur-mobile').trim();
        const currentIsMobile = window.innerWidth <= 767;
        document.documentElement.style.setProperty('--body-global-blur-value', currentIsMobile ? mobileBlur : desktopBlur);
        document.body.classList.toggle('is-mobile', currentIsMobile);
    };

    window.addEventListener('resize', updateBodyBlur);

    // ===================================================================
    // 2. PAGE TRANSITION
    // ===================================================================

    const pageTransitionOverlay = document.getElementById('global-page-transition-overlay');
    if (pageTransitionOverlay) {
        if (!pageTransitionOverlay.querySelector('.loader')) {
            pageTransitionOverlay.innerHTML = `<div class="loader"></div><p class="overlay-text">加载中...</p>`;
        }
        setTimeout(() => {
            if (pageTransitionOverlay) {
                pageTransitionOverlay.classList.remove('visible');
                setTimeout(() => {
                    if (pageTransitionOverlay) pageTransitionOverlay.style.display = 'none';
                    document.body.classList.remove('no-scroll');
                }, 500);
            }
        }, 100);
    }
    const activatePageTransition = (url) => {
        if (!pageTransitionOverlay) {
            window.location.href = url;
            return;
        }
        document.body.classList.add('no-scroll');
        pageTransitionOverlay.style.display = 'flex';
        pageTransitionOverlay.classList.add('visible');
        setTimeout(() => {
            window.location.href = encodeURI(url);
        }, 400);
    };
    document.querySelectorAll('a').forEach(link => {
        if (link.href && link.hostname === window.location.hostname && !link.href.includes('#') && link.target !== '_blank') {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                activatePageTransition(link.href);
            });
        }
    });

    // ===================================================================
    // 3. ROBUST IMAGE LOADING & FALLBACK
    // ===================================================================
    
    const getRandomGradient = () => `linear-gradient(135deg, hsla(${Math.floor(Math.random()*360)}, 85%, 60%, 0.7), hsla(${(Math.floor(Math.random()*360))}, 85%, 60%, 0.7))`;
    
    const applyFallbackImage = (target, type) => {
        const isThumbnail = target.classList.contains('post-thumbnail');
        const fallbackFilename = isThumbnail ? 'post-thumbnail-fallback.png' : 'post-detail-banner-fallback.png';
        const fallbackSrc = `/img/${fallbackFilename}`; // Absolute path is key
        
        if (type === 'background') {
            document.documentElement.style.setProperty('--bg-image', getRandomGradient());
        } else {
            target.src = fallbackSrc;
            target.style.backgroundImage = getRandomGradient(); // Ensure a visual even if PNG fails
            target.classList.add('is-loading-fallback');
            // Ensure fallback text is appropriately handled...
        }
    };
    
    const fetchRandomAnimeImage = async (target, type = 'background') => {
        const apiEndpoints = [
            'https://api.btstu.cn/sjbz/api.php?lx=dongman&format=images',
            'https://www.dmoe.cc/random.php'
        ];
        let imageUrl = null;
        for (const apiUrl of apiEndpoints) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);
                const response = await fetch(apiUrl, { signal: controller.signal });
                clearTimeout(timeoutId);
                if (response.ok && response.url) {
                    imageUrl = response.url;
                    break;
                }
            } catch (error) {
                console.error(`[ImageLoader] API failed: ${apiUrl}. Reason:`, error.message);
            }
        }
        if (imageUrl) {
            const img = new Image();
            img.src = imageUrl;
            img.onload = () => {
                if (type === 'background') {
                    document.documentElement.style.setProperty('--bg-image', `url("${imageUrl}")`);
                } else {
                    target.src = imageUrl;
                    target.style.objectFit = 'cover';
                    target.classList.remove('is-loading-fallback');
                }
            };
            img.onerror = () => applyFallbackImage(target, type);
        } else {
            applyFallbackImage(target, type);
        }
    };

    // ===================================================================
    // 4. SETUP FUNCTIONS (UI COMPONENTS)
    // ===================================================================

    // ------- ULTIMATE FIX: This is the MOST IMPORTANT function -------
    const setupCoreVisibility = () => {
        const coreElements = document.querySelectorAll('.main-header, .hero-content, .content-page-wrapper, main.container, .main-footer');
        coreElements.forEach(el => {
            el.classList.add('force-visible', 'is-visible');
        });
        console.log("[Visibility] Core UI visibility forced. This should solve the blank page issue.");

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.animate__slide-up, .animate__fade-in, .post-card').forEach(el => observer.observe(el));
    };

    const initializeDynamicImages = () => {
        fetchRandomAnimeImage(document.body, 'background');
        document.querySelectorAll('.post-thumbnail, .post-detail-banner').forEach(img => {
            if (img.dataset.initialized) return;
            img.dataset.initialized = 'true';
            applyFallbackImage(img, 'image'); // Immediately show fallback
            fetchRandomAnimeImage(img, 'image'); // Then try to load dynamic image
        });
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
            let isOpen = nav.classList.contains('is-open');
            toggle.setAttribute('aria-expanded', String(isOpen));
            document.body.classList.toggle('no-scroll', isOpen);
        });
        document.addEventListener('click', (e) => {
            if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) {
                closeMenu();
            }
        });
    };

    const setupFooter = () => {
        const yearSpan = document.getElementById('current-year');
        if (yearSpan) yearSpan.textContent = new Date().getFullYear();
        
        // As visitor count seems to have a separate function, let's keep it simple here.
        // If it requires a fetch, that should be in a separate function.
    };

    // ... Stub out other functions for simplicity, or add them cleanly ...
    // ... For now, let's keep it to the essentials that make the page VISIBLE ...

    // ===================================================================
    // 5. INITIALIZATION SEQUENCE
    // ===================================================================

    function initializePage() {
        updateBodyBlur();           // Set blur first
        setupCoreVisibility();      // HIGHEST PRIORITY: Make the page visible
        initializeDynamicImages();  // Load images without blocking UI
        setupMainMenu();            // Make the menu interactive
        setupFooter();              // Set the year in the footer
    }

    // Run Everything
    initializePage();

    console.log("✅ [Final Version 2.0] script.js FINISHED execution. The site should now be fully visible and operational.");

});
