document.addEventListener('DOMContentLoaded', () => {
    // 之前修复的 containsAny 方法，保持不变，功能完好
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

    const activatePageTransition = (urlToNavigate) => {
        if (!pageTransitionOverlay) {
            window.location.href = urlToNavigate;
            return;
        }
        document.body.classList.add('no-scroll');
        pageTransitionOverlay.style.display = 'flex';
        pageTransitionOverlay.classList.add('visible');
        setTimeout(() => { window.location.href = encodeURI(urlToNavigate); }, 400);
    };

    document.querySelectorAll('a').forEach(link => {
        let hrefURL;
        try { hrefURL = new URL(link.href, window.location.href); } catch (e) { return; }
        if (hrefURL.origin === window.location.origin && hrefURL.protocol !== 'mailto:' && (!hrefURL.hash || hrefURL.pathname !== window.location.pathname) && !link.getAttribute('href').startsWith('javascript:void(0)')) {
            link.addEventListener('click', (e) => {
                if (link.target === '_blank') return;
                e.preventDefault();
                activatePageTransition(link.href);
            });
        }
    });

    const backendBaseUrl = 'https://honoka1.netlify.app/.netlify/functions/';

    // ########## ULTIMATE FIX 1: Robust Image Fetching & Fallback ##########
    
    // 生成一个漂亮的渐变色，作为最底层的后备方案
    const getRandomGradient = () => {
        const h1 = Math.floor(Math.random() * 360);
        const h2 = (h1 + 60 + Math.floor(Math.random() * 60)) % 360;
        return `linear-gradient(135deg, hsla(${h1}, 85%, 60%, 0.7), hsla(${h2}, 85%, 60%, 0.7))`;
    };

    // 极端情况下的备用函数，确保网站有内容，即使API和本地图片都失败
    const applyFallbackImage = (targetElement, type) => {
        const isThumbnail = targetElement.classList.contains('post-thumbnail');
        const fallbackFilename = isThumbnail ? 'post-thumbnail-fallback.png' : 'post-detail-banner-fallback.png';
        const absoluteBasePath = '/img/'; // 始终使用绝对路径
        const localFallbackSrc = `${absoluteBasePath}${fallbackFilename}`;

        if (type === 'background') {
            document.documentElement.style.setProperty('--bg-image', getRandomGradient());
            console.log("[Fallback] Applied gradient background for body.");
        } else { // type === 'image'
            targetElement.src = localFallbackSrc;
            targetElement.style.objectFit = 'contain';
            targetElement.classList.add('is-loading-fallback');
            targetElement.style.opacity = '1';
            // 关键：为<img>元素本身添加渐变背景，即使本地备用图片404，也能看到一个漂亮的色块
            targetElement.style.backgroundImage = getRandomGradient();

            let fallbackText = targetElement.nextElementSibling;
            if (!fallbackText || !fallbackText.classList.contains('fallback-text-overlay')) {
                fallbackText = document.createElement('div');
                fallbackText.className = 'fallback-text-overlay';
                 if (targetElement.parentNode && getComputedStyle(targetElement.parentNode).position === 'static'){
                    targetElement.parentNode.style.position = 'relative';
                }
                targetElement.insertAdjacentElement('afterend', fallbackText);
            }
            fallbackText.textContent = isThumbnail ? "封面加载失败 :(" : "图片加载失败 :(";
            console.log(`[Fallback] Applied local fallback for an image element.`);
        }
    };
    
    // 全新重构的图片获取函数
    const fetchRandomAnimeImage = async (targetElement, type = 'background') => {
        // 更新为更稳定、更多样的API列表
        const apiEndpoints = [
            'https://api.btstu.cn/sjbz/api.php?lx=dongman&format=images', // 非常稳定的API
            'https://www.dmoe.cc/random.php',
            'https://api.lolicon.app/setu/v2?r18=0&size=original' // JSON格式API
        ];

        let imageUrl = null;

        for (const apiUrl of apiEndpoints) {
            console.log(`[ImageLoader] Attempting to fetch from ${apiUrl}`);
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000); // 延长超时时间到8秒

                const response = await fetch(apiUrl, { signal: controller.signal });
                clearTimeout(timeoutId);

                if (!response.ok) {
                    console.warn(`[ImageLoader] API ${apiUrl} responded with status ${response.status}.`);
                    continue; // 继续尝试下一个API
                }

                // 检查响应类型
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    if (data && data.data && data.data.length > 0 && data.data[0].urls && data.data[0].urls.original) {
                       imageUrl = data.data[0].urls.original; // 从JSON中提取URL
                    }
                } else if (contentType && contentType.startsWith('image/')) {
                    // 如果响应是直接的图片，最终的URL就是图片地址
                    imageUrl = response.url;
                }

                if (imageUrl) {
                    console.log(`[ImageLoader] ✅ Success! Found image URL: ${imageUrl}`);
                    break; // 找到图片，跳出循环
                }
            } catch (error) {
                console.error(`[ImageLoader] ❌ Failed to fetch from ${apiUrl}. Error:`, error.message);
                // 不在这里调用fallback，循环会继续尝试下一个API
            }
        }

        // 循环结束后，我们决定是使用API图片还是启用后备方案
        if (imageUrl) {
            const img = new Image();
            img.src = imageUrl;
            img.onload = () => {
                const targetSrc = `url("${imageUrl}")`;
                if (type === 'background') document.documentElement.style.setProperty('--bg-image', targetSrc);
                else {
                    targetElement.src = imageUrl;
                    targetElement.style.objectFit = 'cover';
                    targetElement.classList.remove('is-loading-fallback');
                    const fallbackText = targetElement.nextElementSibling;
                    if (fallbackText?.classList.contains('fallback-text-overlay')) fallbackText.remove();
                }
                console.log(`[ImageLoader] Image successfully loaded and applied.`);
            };
            img.onerror = () => {
                console.error(`[ImageLoader] Image URL ${imageUrl} valid but failed to load. Applying fallback.`);
                applyFallbackImage(targetElement, type);
            };
        } else {
            console.error(`[ImageLoader] ALL APIs failed. Applying final fallback.`);
            applyFallbackImage(targetElement, type); // 所有API都失败了，启用后备
        }
    };

    // ########## ULTIMATE FIX 2: Force Render Core UI Elements ##########

    const setupAnimationsAndInteractions = () => {
        // 关键修复：不再等待任何东西，立即强制显示核心UI，确保网站骨架永远存在
        const header = document.querySelector('.main-header');
        const contentWrapper = document.querySelector('.hero-content, .content-page-wrapper, main.container');
        const footer = document.querySelector('.main-footer');

        if(header) setTimeout(() => header.classList.add('is-visible'), 50);
        if(contentWrapper) setTimeout(() => contentWrapper.classList.add('is-visible'), 100);
        if(footer) setTimeout(() => footer.classList.add('is-visible'), 250);

        console.log("[Visibility] Core UI elements visibility forced.");

        // IntersectionObserver现在只负责“额外”的动画，不影响核心内容的显示
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const delay = parseInt(entry.target.dataset.delay || '0');
                    setTimeout(() => entry.target.classList.add('is-visible'), delay);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        // 只观察那些不是核心布局的动画元素
        document.querySelectorAll('.animate__slide-up:not(.main-header):not(.hero-content):not(.content-page-wrapper):not(main.container), .animate__fade-in:not(.main-header):not(.hero-content):not(.content-page-wrapper):not(main.container)')
            .forEach(el => observer.observe(el));
    };


    const initializeDynamicImages = () => {
        fetchRandomAnimeImage(document.body, 'background');
        document.querySelectorAll('.post-thumbnail, .post-detail-banner').forEach(img => {
            if (img.dataset.initialized) return;
            img.dataset.initialized = 'true';
            // 首先显示备用图片，然后再去尝试加载动态图片
            applyFallbackImage(img, 'image');
            fetchRandomAnimeImage(img, 'image');
        });
    };
    
    // 其他功能函数保持不变，它们本身没有问题
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
        const filtersContainer = document.getElementById('blog-category-filters');
        if (!filtersContainer) return;
        const allTags = new Set([...document.querySelectorAll('.post-card[data-tags]')].flatMap(p => p.dataset.tags.split(',').map(tag => tag.trim()).filter(Boolean)));
        const sortedTags = [...allTags].sort((a,b) => a.localeCompare(b, 'zh-CN'));
        
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

        const dynamicListContainer = document.getElementById('dynamic-category-list');
        if (dynamicListContainer) { dynamicListContainer.innerHTML = sortedTags.map((tag, i) => `<a href="blog.html?tag=${encodeURIComponent(tag)}" class="filter-tag-button animate__slide-up" data-delay="${i * 50}"># ${tag}</a>`).join(''); }
    };
    
    const setupFooter = () => {
        const yearSpan = document.getElementById('current-year');
        if (yearSpan) yearSpan.textContent = new Date().getFullYear();
        const visitorSpan = document.getElementById('visitor-count');
        if (visitorSpan) { fetch(`${backendBaseUrl}handleVisitCount`).then(res => res.json()).then(data => { visitorSpan.textContent = data.count || '??'; }).catch(() => { visitorSpan.textContent = '???'; }); }
        updateBodyBlur();
    };

    // 初始化所有功能
    function initializePage() {
        setupAnimationsAndInteractions(); // 优先执行，确保UI可见
        initializeDynamicImages();        // 然后加载图片，不会阻塞UI
        setupBackToTopButton();
        setupCursorTrail();
        setupReadProgressBar();
        setupMainMenu();
        setupPostCategoryFilters();
        setupFooter();
    }
    
    initializePage(); // 执行初始化

    console.log("✅ script.js FINISHED execution. Site should be fully functional now.");
});
