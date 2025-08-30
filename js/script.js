document.addEventListener('DOMContentLoaded', () => {
    // 之前修复的 containsAny 方法，保持不变，功能完好
    if (typeof DOMTokenList !== 'undefined' && !DOMTokenList.prototype.containsAny) {
        DOMTokenList.prototype.containsAny = function(classNames) { for (let i = 0; i < classNames.length; i++) { if (this.contains(classNames[i])) return true; } return false; };
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

    const updateIsMobileClass = () => { isMobile = window.innerWidth <= 767; document.body.classList.toggle('is-mobile', isMobile); updateBodyBlur(); };

    updateIsMobileClass();
    window.addEventListener('resize', updateIsMobileClass);

    // Page Transition logic (no changes needed)
    const pageTransitionOverlay = document.getElementById('global-page-transition-overlay');
    if (pageTransitionOverlay) {
        if (!pageTransitionOverlay.querySelector('.loader')) pageTransitionOverlay.innerHTML = `<div class="loader"></div><p class="overlay-text">加载中...</p>`;
        setTimeout(() => { if (pageTransitionOverlay) { pageTransitionOverlay.classList.remove('visible'); setTimeout(() => { if (pageTransitionOverlay) pageTransitionOverlay.style.display = 'none'; document.body.classList.remove('no-scroll'); }, 500); } }, 100);
    }
    const activatePageTransition = (url) => { if (!pageTransitionOverlay) { window.location.href = url; return; } document.body.classList.add('no-scroll'); pageTransitionOverlay.style.display = 'flex'; pageTransitionOverlay.classList.add('visible'); setTimeout(() => { window.location.href = encodeURI(url); }, 400); };
    document.querySelectorAll('a').forEach(link => { let hrefURL; try { hrefURL = new URL(link.href, window.location.href); } catch (e) { return; } if (hrefURL.origin === window.location.origin && hrefURL.protocol !== 'mailto:' && (!hrefURL.hash || hrefURL.pathname !== window.location.pathname) && !link.getAttribute('href').startsWith('javascript:')) link.addEventListener('click', (e) => { if (link.target === '_blank') return; e.preventDefault(); activatePageTransition(link.href); }); });

    const backendBaseUrl = 'https://honoka1.netlify.app/.netlify/functions/';

    // Robust Image Loading & Fallback logic (no major changes from last version, it's already robust)
    const getRandomGradient = () => `linear-gradient(135deg, hsla(${Math.floor(Math.random()*360)}, 85%, 60%, 0.7), hsla(${(Math.floor(Math.random()*360))}, 85%, 60%, 0.7))`;
    const applyFallbackImage = (target, type) => {
        const isThumbnail = target.classList.contains('post-thumbnail');
        const fallbackFilename = isThumbnail ? 'post-thumbnail-fallback.png' : 'post-detail-banner-fallback.png';
        const fallbackSrc = `/img/${fallbackFilename}`; // Always use absolute path
        if (type === 'background') { document.documentElement.style.setProperty('--bg-image', getRandomGradient()); } else {
            target.src = fallbackSrc; target.style.objectFit = 'contain'; target.classList.add('is-loading-fallback'); target.style.opacity = '1'; target.style.backgroundImage = getRandomGradient();
            let fallbackText = target.nextElementSibling;
            if (!fallbackText || !fallbackText.classList.contains('fallback-text-overlay')) {
                fallbackText = document.createElement('div'); fallbackText.className = 'fallback-text-overlay'; if (target.parentNode && getComputedStyle(target.parentNode).position === 'static') target.parentNode.style.position = 'relative'; target.insertAdjacentElement('afterend', fallbackText);
            }
            fallbackText.textContent = isThumbnail ? "封面加载失败 :(" : "图片加载失败 :(";
        }
    };
    const fetchRandomAnimeImage = async (target, type = 'background') => {
        const apiEndpoints = ['https://api.btstu.cn/sjbz/api.php?lx=dongman&format=images', 'https://www.dmoe.cc/random.php', 'https://api.lolicon.app/setu/v2?r18=0&size=original'];
        let imageUrl = null;
        for (const apiUrl of apiEndpoints) {
            try {
                const controller = new AbortController(); const timeoutId = setTimeout(() => controller.abort(), 8000); const response = await fetch(apiUrl, { signal: controller.signal }); clearTimeout(timeoutId);
                if (!response.ok) continue;
                const contentType = response.headers.get('content-type');
                if (contentType?.includes('json')) { const data = await response.json(); if (data?.data?.[0]?.urls?.original) imageUrl = data.data[0].urls.original; } else if (contentType?.startsWith('image/')) { imageUrl = response.url; }
                if (imageUrl) break;
            } catch (error) { console.error(`[ImageLoader] Failed API: ${apiUrl}. Reason:`, error.message); }
        }
        if (imageUrl) {
            const img = new Image(); img.src = imageUrl;
            img.onload = () => { if (type === 'background') document.documentElement.style.setProperty('--bg-image', `url("${imageUrl}")`); else { target.src = imageUrl; target.style.objectFit = 'cover'; target.classList.remove('is-loading-fallback'); target.nextElementSibling?.remove(); } };
            img.onerror = () => applyFallbackImage(target, type);
        } else { applyFallbackImage(target, type); }
    };

    // ########## ULTIMATE FINAL FIX: Force Core UI Visibility ##########
    // This is the most important fix for the blank page issue.
    const setupCoreVisibility = () => {
        // Find all essential layout blocks on ANY page.
        const coreElements = document.querySelectorAll('.main-header, .hero-content, .content-page-wrapper, main.container, .main-footer, .post-grid, .posts-container');

        if (coreElements.length > 0) {
            console.log("[Visibility] Found core elements. Forcing them to be visible NOW.");
            coreElements.forEach(el => {
                // Apply the "sledgehammer" class from style.css
                // And also the original .is-visible for any related JS logic
                el.classList.add('force-visible', 'is-visible');
            });
        } else {
             console.warn("[Visibility] No core UI elements found with the specified selectors. Page might appear blank.");
        }
        
        // The IntersectionObserver will now only handle extra subtle animations for elements that come into view.
        // It's no longer responsible for making the main content appear.
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible'); // Use the original animation class for scroll effects
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        // Observe elements intended for scroll-based animation
        document.querySelectorAll('.animate__slide-up, .animate__fade-in').forEach(el => observer.observe(el));
    };


    // Initialize all other functions as they are
    const initializeDynamicImages = () => { fetchRandomAnimeImage(document.body, 'background'); document.querySelectorAll('.post-thumbnail, .post-detail-banner').forEach(img => { if (img.dataset.initialized) return; img.dataset.initialized = 'true'; applyFallbackImage(img, 'image'); fetchRandomAnimeImage(img, 'image'); }); };
    const setupBackToTopButton = () => { const btn = document.getElementById('back-to-top'); if (btn) { window.addEventListener('scroll', () => { btn.classList.toggle('show', window.scrollY > 300); }); btn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); }); btn.classList.toggle('show', window.scrollY > 300); } };
    const setupCursorTrail = () => { const cursorDot = document.getElementById('cursor-trail'); if (!cursorDot || isMobile) { if (cursorDot) cursorDot.style.display = 'none'; document.body.style.cursor = 'auto'; return; } window.addEventListener('mousemove', e => { cursorDot.style.left = `${e.clientX}px`; cursorDot.style.top = `${e.clientY}px`; }); document.querySelectorAll('a, button, .post-card').forEach(el => { el.addEventListener('mouseenter', () => { cursorDot.style.transform = 'translate(-50%, -50%) scale(1.5)'; }); el.addEventListener('mouseleave', () => { cursorDot.style.transform = 'translate(-50%, -50%) scale(1)'; }); }); };
    const setupReadProgressBar = () => { const bar = document.getElementById('read-progress-bar'); if (bar) window.addEventListener('scroll', () => { const h = document.documentElement; const scrollableHeight = h.scrollHeight - h.clientHeight; bar.style.width = scrollableHeight > 0 ? `${(h.scrollTop / scrollableHeight) * 100}%` : '0%'; }); };
    const setupMainMenu = () => { const toggle = document.querySelector('.menu-toggle'); const nav = document.getElementById('main-nav-menu'); if (toggle && nav) { const closeMenu = () => { nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); document.body.classList.remove('no-scroll'); }; toggle.addEventListener('click', e => { e.stopPropagation(); nav.classList.toggle('is-open'); toggle.setAttribute('aria-expanded', nav.classList.contains('is-open')); document.body.classList.toggle('no-scroll', nav.classList.contains('is-open')); }); document.addEventListener('click', e => { if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) closeMenu(); }); } };
    const setupPostCategoryFilters = () => { const filterContainer = document.getElementById('blog-category-filters'); if(!filterContainer) return; const tags = [...new Set([...document.querySelectorAll('.post-card[data-tags]')].flatMap(p => p.dataset.tags.split(',').map(tag => tag.trim()).filter(Boolean)))].sort((a,b)=>a.localeCompare(b, 'zh-CN')); filterContainer.innerHTML = `<button class="filter-tag-button active" data-filter="all">全部文章</button>` + tags.map(tag =>`<button class="filter-tag-button" data-filter="${tag}">#${tag}</button>`).join(''); filterContainer.addEventListener('click', e => { if(e.target.matches('.filter-tag-button')) { const filter = e.target.dataset.filter; document.querySelectorAll('#all-posts-grid .post-card').forEach(p => p.style.display = (filter === 'all' || p.dataset.tags?.split(',').map(t=>t.trim()).includes(filter)) ? '' : 'none'); [...filterContainer.children].forEach(b=>b.classList.toggle('active', b === e.target)); }}); const initialTag = new URLSearchParams(window.location.search).get('tag'); if(filterContainer.querySelector(`[data-filter="${initialTag || 'all'}"]`)) filterContainer.querySelector(`[data-filter="${initialTag || 'all'}"]`).click(); };
    const setupFooter = () => { document.getElementById('current-year')?.textContent = new Date().getFullYear(); const vs = document.getElementById('visitor-count'); if(vs) fetch(`${backendBaseUrl}handleVisitCount`).then(r => r.json()).then(d => vs.textContent = d.count || '??').catch(() => vs.textContent = '???'); updateBodyBlur(); };
    
    // Final Initialization Sequence
    function initializePage() {
        setupCoreVisibility();      // HIGHEST PRIORITY: Make sure the page skeleton is ALWAYS visible.
        initializeDynamicImages();  // Load pretty pictures, won't block UI anymore.
        setupBackToTopButton();
        setupCursorTrail();
        setupReadProgressBar();
        setupMainMenu();
        setupPostCategoryFilters();
        setupFooter();
    }
    
    initializePage();

    console.log("✅ script.js FINISHED. Core visibility forced. All pages should now display correctly.");
});
