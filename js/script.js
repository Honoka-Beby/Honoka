document.addEventListener('DOMContentLoaded', () => {
    // 之前修复的 containsAny 方法，保持不变
    if (typeof DOMTokenList !== 'undefined' && !DOMTokenList.prototype.containsAny) {
        DOMTokenList.prototype.containsAny = function(classNames) {
            for (let i = 0; i < classNames.length; i++) {
                if (this.contains(classNames[i])) {
                    return true;
                }
            }
            return false;
        };
    }

    console.log("🚀 script.js STARTING execution...");

    let isMobile = window.innerWidth <= 767;

    const updateBodyBlur = () => {
        const desktopBlur = getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur').trim();
        const mobileBlur = getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur-mobile').trim();
        const currentIsMobile = window.innerWidth <= 767;
        document.documentElement.style.setProperty('--body-global-blur-value', currentIsMobile ? mobileBlur : desktopBlur);
        document.body.classList.toggle('is-mobile', currentIsMobile);
    };

    const updateIsMobileClass = () => {
        isMobile = window.innerWidth <= 767;
        document.body.classList.toggle('is-mobile', isMobile);
        updateBodyBlur();
    };

    updateIsMobileClass();
    window.addEventListener('resize', updateIsMobileClass);


    // --- Global Page Transition Overlay Management ---
    const pageTransitionOverlay = document.getElementById('global-page-transition-overlay');
    if (pageTransitionOverlay) {
        if (!pageTransitionOverlay.querySelector('.loader')) {
            pageTransitionOverlay.innerHTML = `
                <div class="loader"></div>
                <p class="overlay-text">加载中...</p>
            `;
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
        console.log("[PageTransition] Overlay initialized for first load.");
    }

    const activatePageTransition = (urlToNavigate) => {
        if (!pageTransitionOverlay) {
            window.location.href = urlToNavigate;
            return;
        }
        document.body.classList.add('no-scroll');
        pageTransitionOverlay.style.display = 'flex';
        pageTransitionOverlay.classList.add('visible');
        setTimeout(() => {
            window.location.href = encodeURI(urlToNavigate);
        }, 400);
        console.log(`[PageTransition] Activating transition to: ${urlToNavigate}`);
    };

    document.querySelectorAll('a').forEach(link => {
        let hrefURL;
        try {
            hrefURL = new URL(link.href, window.location.href);
        } catch (e) {
            return;
        }
        if (hrefURL.origin === window.location.origin && hrefURL.protocol !== 'mailto:' && (!hrefURL.hash || hrefURL.pathname !== window.location.pathname) && !link.getAttribute('href').startsWith('javascript:void(0)')) {
            link.addEventListener('click', (e) => {
                if (link.target === '_blank') return;
                e.preventDefault();
                activatePageTransition(link.href);
            });
        }
    });

    const backendBaseUrl = 'https://honoka1.netlify.app/.netlify/functions/';

    // --- Random Anime Wallpaper API ---
    const fetchRandomAnimeImage = async (targetElement, type = 'background') => {
        let imageUrl = '';
        // 最终修复：增加一个更稳定的API，并调整顺序
        const apiEndpoints = [
            `https://api.yujn.cn/api/acg.php?type=image`, // 新增的、更稳定的API
            `https://iw233.cn/api/Pure.php`,
            `https://api.adicw.cn/img/rand.php`
        ];

        const extractImageUrl = async (response) => {
            if (!response || !response.url) return '';
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.startsWith('image/')) {
                return response.url;
            }
             // Forcing no-cors means we can't inspect the body, so we rely on the final response URL being the image.
             if(response.type === 'opaque') {
                return response.url;
             }
            return '';
        };

        for (const api of apiEndpoints) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4000);
                // 最终修复：添加 mode: 'no-cors' 来解决CORS跨域问题
                const response = await fetch(api, { signal: controller.signal, mode: 'no-cors' });
                clearTimeout(timeoutId);

                // 对于 'no-cors' 请求, response.ok is always false, so we check response.type
                imageUrl = await extractImageUrl(response);
                if (imageUrl) break;
            } catch (error) {
                console.warn(`[ImageLoader] API error for ${api}: ${error.message}`);
            }
        }

        if (imageUrl) {
            const img = new Image();
            img.src = imageUrl;
            img.onload = () => {
                if (type === 'background') {
                    document.documentElement.style.setProperty('--bg-image', `url("${imageUrl}")`);
                } else {
                    targetElement.src = imageUrl;
                    targetElement.style.objectFit = 'cover';
                    targetElement.classList.remove('is-loading-fallback');
                    targetElement.style.opacity = '1';
                    const fallbackText = targetElement.nextElementSibling;
                    if (fallbackText && fallbackText.classList.contains('fallback-text-overlay')) {
                        fallbackText.remove();
                    }
                }
            };
            img.onerror = () => applyFallbackImage(targetElement, type);
        } else {
            applyFallbackImage(targetElement, type);
        }
    };

    const applyFallbackImage = (targetElement, type) => {
        const isThumbnail = targetElement.classList.contains('post-thumbnail');
        const fallbackFilename = isThumbnail ? 'post-thumbnail-fallback.png' : 'post-detail-banner-fallback.png';
        // 最终修复：使用绝对路径，确保在任何页面都能正确找到图片
        const baseRelativePath = '/img/';
        const localFallbackSrc = `${baseRelativePath}${fallbackFilename}`;

        if (type === 'background') {
            document.documentElement.style.setProperty('--bg-image', getRandomGradient());
        } else {
            targetElement.src = localFallbackSrc;
            targetElement.style.objectFit = 'contain';
            targetElement.classList.add('is-loading-fallback');
            targetElement.style.opacity = '1';
            targetElement.style.backgroundImage = getRandomGradient();

            let fallbackText = targetElement.nextElementSibling;
            if (!fallbackText || !fallbackText.classList.contains('fallback-text-overlay')) {
                fallbackText = document.createElement('div');
                fallbackText.className = 'fallback-text-overlay';
                if (targetElement.parentNode.style.position === 'static'){
                    targetElement.parentNode.style.position = 'relative';
                }
                targetElement.insertAdjacentElement('afterend', fallbackText);
            }
            fallbackText.textContent = isThumbnail ? "封面加载失败 :(" : "图片加载失败 :(";
        }
    };

    const getRandomGradient = () => {
        const h1 = Math.floor(Math.random() * 360);
        const h2 = (h1 + 60 + Math.floor(Math.random() * 60)) % 360;
        return `linear-gradient(135deg, hsla(${h1}, 85%, 60%, 0.7), hsla(${h2}, 85%, 60%, 0.7))`;
    };

    fetchRandomAnimeImage(document.body, 'background');

    const initializeDynamicImages = () => {
        document.querySelectorAll('.post-thumbnail, .post-detail-banner').forEach(img => {
            if (img.dataset.initialized) return; // 防止重复初始化
            img.dataset.initialized = 'true';
            applyFallbackImage(img, 'image');
            fetchRandomAnimeImage(img, 'image');
        });
    }

    // --- Animations and Interactions ---
    const setupAnimationsAndInteractions = () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const delay = parseInt(entry.target.dataset.delay || '0');
                    setTimeout(() => {
                        entry.target.classList.add('is-visible');
                    }, delay);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.animate__fade-in, .animate__slide-up').forEach(el => observer.observe(el));

        const mainContent = document.querySelector('.hero-content, .content-page-wrapper');
        if (mainContent) {
           setTimeout(() => {
                mainContent.classList.add('is-visible');
                mainContent.querySelectorAll('[data-delay]').forEach(child => {
                    const childDelay = parseInt(child.dataset.delay) || 0;
                    setTimeout(() => child.classList.add('is-visible'), childDelay);
                });
            }, 100);
        }

        const footer = document.querySelector('.main-footer');
        if (footer) setTimeout(() => footer.classList.add('is-visible'), 500);
    };

    const setupBackToTopButton = () => {
        const btn = document.getElementById('back-to-top');
        if (!btn) return;
        window.addEventListener('scroll', () => { btn.classList.toggle('show', window.scrollY > 300); });
        btn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
        btn.classList.toggle('show', window.scrollY > 300);
    };

    const setupCursorTrail = () => {
        const cursorDot = document.getElementById('cursor-trail');
        if (!cursorDot || isMobile) { if (cursorDot) cursorDot.style.display = 'none'; document.body.style.cursor = 'auto'; return; }
        window.addEventListener('mousemove', e => { cursorDot.style.left = `${e.clientX}px`; cursorDot.style.top = `${e.clientY}px`; });
        document.querySelectorAll('a, button, input, textarea, .post-card').forEach(el => {
            el.addEventListener('mouseenter', () => { cursorDot.style.transform = 'translate(-50%, -50%) scale(1.5)'; cursorDot.style.backgroundColor = 'var(--secondary-color)'; });
            el.addEventListener('mouseleave', () => { cursorDot.style.transform = 'translate(-50%, -50%) scale(1)'; cursorDot.style.backgroundColor = 'var(--primary-color)'; });
        });
    };

    const setupReadProgressBar = () => {
        const bar = document.getElementById('read-progress-bar');
        if (!bar) return;
        window.addEventListener('scroll', () => {
            const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (scrollableHeight <= 0) return;
            const progress = (window.scrollY / scrollableHeight) * 100;
            bar.style.width = `${Math.min(100, Math.max(0,progress))}%`;
        });
    };

    const setupMainMenu = () => {
        const toggle = document.querySelector('.menu-toggle');
        const nav = document.getElementById('main-nav-menu');
        if (!toggle || !nav) return;
        const closeMenu = () => { nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); document.body.classList.remove('no-scroll'); };
        toggle.addEventListener('click', e => { e.stopPropagation(); nav.classList.toggle('is-open'); toggle.setAttribute('aria-expanded', nav.classList.contains('is-open')); document.body.classList.toggle('no-scroll', nav.classList.contains('is-open')); });
        document.addEventListener('click', e => { if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) closeMenu(); });
    };

    const setupPostCategoryFilters = () => {
        const allTags = new Set([...document.querySelectorAll('.post-card[data-tags]')].flatMap(p => p.dataset.tags.split(',').map(tag => tag.trim()).filter(Boolean)));
        const sortedTags = [...allTags].sort((a,b) => a.localeCompare(b, 'zh-CN'));
        const filtersContainer = document.getElementById('blog-category-filters');
        
        if (filtersContainer) {
            filtersContainer.innerHTML = `<button class="filter-tag-button active" data-filter="all">全部文章</button>`;
            sortedTags.forEach(tag => { filtersContainer.innerHTML += `<button class="filter-tag-button" data-filter="${tag}">#${tag}</button>`; });

            filtersContainer.addEventListener('click', e => {
                if (e.target.matches('.filter-tag-button')) {
                    const filter = e.target.dataset.filter;
                    document.querySelectorAll('#all-posts-grid .post-card').forEach(post => post.style.display = (filter === 'all' || (post.dataset.tags && post.dataset.tags.split(',').map(t => t.trim()).includes(filter))) ? '' : 'none');
                    [...filtersContainer.children].forEach(b => b.classList.toggle('active', b === e.target));
                }
            });

            const initialTag = new URLSearchParams(window.location.search).get('tag');
            const initialBtn = filtersContainer.querySelector(`[data-filter="${initialTag || 'all'}"]`);
            if (initialBtn) initialBtn.click();
        }

        const dynamicListContainer = document.getElementById('dynamic-category-list');
        if (dynamicListContainer) { dynamicListContainer.innerHTML = sortedTags.map((tag, i) => `<a href="blog.html?tag=${encodeURIComponent(tag)}" class="filter-tag-button animate__slide-up" data-delay="${i * 50}"># ${tag}</a>`).join(''); }
    };
    
    // --- Footer and Final Setups ---
    const setupFooter = () => {
        const yearSpan = document.getElementById('current-year');
        if (yearSpan) yearSpan.textContent = new Date().getFullYear();
        const visitorSpan = document.getElementById('visitor-count');
        if (visitorSpan) { fetch(`${backendBaseUrl}handleVisitCount`).then(res => res.json()).then(data => { visitorSpan.textContent = data.count || '??'; }).catch(() => { visitorSpan.textContent = '???'; }); }
        updateBodyBlur();
    };

    const initPage = () => {
        initializeDynamicImages();
        setupAnimationsAndInteractions();
        setupBackToTopButton();
        setupCursorTrail();
        setupReadProgressBar();
        setupMainMenu();
        setupPostCategoryFilters();
        setupFooter();
    }
    
    // Initial page load
    initPage();

    console.log("✅ script.js FINISHED execution.");
});
