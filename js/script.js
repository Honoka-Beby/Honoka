document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 script.js STARTING execution...");

    let isMobile = window.innerWidth <= 767; 
    const updateIsMobileClass = () => {
        isMobile = window.innerWidth <= 767;
        document.body.classList.toggle('is-mobile', isMobile); // Directly toggle class
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
                setTimeout(() => { // Gives CSS transition time to complete
                    if (pageTransitionOverlay) pageTransitionOverlay.style.display = 'none';
                    document.body.classList.remove('no-scroll'); 
                }, 500); 
            }
        }, 100); 
        console.log("[PageTransition] Overlay initialized.");
    }

    const activatePageTransition = (urlToNavigate) => {
        if (!pageTransitionOverlay) { window.location.href = urlToNavigate; return; }
        document.body.classList.add('no-scroll'); 
        pageTransitionOverlay.style.display = 'flex'; 
        pageTransitionOverlay.classList.add('visible'); 
        setTimeout(() => { window.location.href = encodeURI(urlToNavigate); }, 400); 
        console.log(`[PageTransition] Activating transition to: ${urlToNavigate}`);
    };

    document.querySelectorAll('a').forEach(link => {
        let hrefURL;
        try { hrefURL = new URL(link.href, window.location.href); } catch (e) { return; }

        if (hrefURL.origin === window.location.origin && 
            hrefURL.protocol !== 'mailto:' && 
            hrefURL.hash === '' && 
            !link.getAttribute('href').startsWith('javascript:void(0)')) {
            
            link.addEventListener('click', (e) => {
                if (link.target === '_blank') { return; } 
                e.preventDefault(); 
                activatePageTransition(link.href);
            });
        }
    });

    // ################### IMPORTANT: backendBaseUrl Config ###################
    // !!! Replace with YOUR ACTUAL NETLIFY SITE'S DOMAIN !!!
    // Honoka's current Netlify domain from screenshot is honoka1.netlify.app
    const backendBaseUrl = 'https://honoka1.netlify.app/.netlify/functions/'; // <-- Honoika, Please confirm this is YOUR correct domain!


    // --- Random Anime Wallpaper API for dynamic backgrounds/images ---
    const fetchRandomAnimeImage = async (targetElement, type = 'background', options = { width: 1920, height: 1080 }) => {
        let imageUrl = '';
        const { width, height } = options; 

        const extractImageUrl = async (response, apiDebugName) => {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.startsWith('image/')) {
                return response.url; 
            } else if (contentType && contentType.includes('json')) { 
                const data = await response.json();
                if (data && (data.imgurl || data.url) && typeof (data.imgurl || data.url) === 'string' && (data.imgurl || data.url).match(/\.(jpeg|jpg|gif|png|webp|bmp|avif)$/i)) { 
                    return data.imgurl || data.url;
                }
            }
            console.warn(`[ImageLoader] 🔄 ${apiDebugName} failed to extract image URL from response. Content-Type: ${contentType}`);
            return ''; 
        };
        
        // Streamlined and optimized API Endpoints
        const apiEndpoints = [
            `https://iw233.cn/api/Pure.php`,                             // High quality anime images, direct link.
            `https://api.adicw.cn/img/rand`,                            // Effective for anime images, direct link.
        ];

        for (const api of apiEndpoints) {
            const apiDebugName = new URL(api).hostname.split('.').slice(-2).join('.'); 
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000); 
                
                const fetchOptions = { method: 'GET', redirect: 'follow', signal: controller.signal };
                fetchOptions.headers = { 'Accept': 'image/*,application/json' };

                const response = await fetch(api, fetchOptions);
                clearTimeout(timeoutId);

                if (response.ok) {
                    imageUrl = await extractImageUrl(response, apiDebugName);
                    if (imageUrl) { break; }
                } else {
                    console.warn(`[ImageLoader] ⚠️ API ${apiDebugName} responded with HTTP status ${response.status}. Trying next API.`);
                }
            } catch (innerError) {
                if (innerError.name === 'AbortError') {
                    console.warn(`[ImageLoader] ⏱️ API ${apiDebugName} timed out (8s limit). Trying next API.`);
                } else if (innerError instanceof TypeError || innerError instanceof DOMException) {
                   console.warn(`[ImageLoader] 🚫 API ${apiDebugName} network/fetch error:`, innerError.message);
                } else {
                    console.warn(`[ImageLoader] ❌ API ${apiDebugName} encountered an unexpected error:`, innerError);
                }
            }
        }
        
        if (imageUrl) {
            const imgToLoad = new Image(); 
            imgToLoad.src = imageUrl;
            imgToLoad.onload = () => {
                if (type === 'background') { document.documentElement.style.setProperty('--bg-image', `url("${imageUrl}")`); } 
                else if (type === 'image') { targetElement.src = imageUrl; targetElement.style.opacity = '1'; targetElement.style.objectFit = 'cover'; }
                targetElement.classList.remove('is-loading-fallback'); 
                targetElement.style.filter = ''; 
                const fallbackText = targetElement.nextElementSibling;
                if (fallbackText && fallbackText.classList.contains('fallback-text-overlay')) { fallbackText.remove(); }
            };
            imgToLoad.onerror = () => { 
                console.warn(`[ImageLoader] 🚫 Preloaded valid Image URL (${imageUrl.substring(0, 50)}...) failed to render. Applying local fallback.`);
                applyFallbackImage(targetElement, type); 
            };
        } else { 
            console.error('[ImageLoader] ❌ All online APIs failed to provide a valid image URL. Forcing initial local fallback.');
            applyFallbackImage(targetElement, type); 
        }
    };
    
    // --- Helper for applying fallback images/styles ---
    const applyFallbackImage = (targetElement, type, srcOverride = null) => {
        const isThumbnail = targetElement.classList.contains('post-thumbnail');
        const fallbackSuffix = isThumbnail ? 'post-thumbnail-fallback.png' : 'post-detail-banner-fallback.png';
        const baseRelativePath = window.location.pathname.includes('/posts/') ? '../img/' : './img/';
        const localFallbackSrc = srcOverride || `${baseRelativePath}${fallbackSuffix}`;
        
        if (type === 'background') {
            document.documentElement.style.setProperty('--bg-image', getRandomGradient());
            console.log(`[ImageLoader] 🖼️ Applied gradient background fallback.`);
        } else if (type === 'image') {
            targetElement.src = localFallbackSrc; 
            targetElement.style.objectFit = 'contain'; 
            targetElement.classList.add('is-loading-fallback'); 
            targetElement.style.opacity = '1'; 
            
            targetElement.style.backgroundImage = getRandomGradient(); 
            targetElement.style.backgroundRepeat = 'no-repeat';
            targetElement.style.backgroundPosition = 'center';
            targetElement.style.backgroundSize = 'cover';
            let fallbackTextOverlay = targetElement.nextElementSibling;
            if (targetElement.tagName === 'IMG') {
                if (!fallbackTextOverlay || !fallbackTextOverlay.classList.contains('fallback-text-overlay')) {
                    fallbackTextOverlay = document.createElement('div');
                    fallbackTextOverlay.classList.add('fallback-text-overlay');
                    fallbackTextOverlay.textContent = isThumbnail ? "封面加载失败 :(" : "图片加载失败 :(";
                    if (targetElement.parentNode && getComputedStyle(targetElement.parentNode).position === 'static') {
                        targetElement.parentNode.style.position = 'relative'; 
                    }
                    targetElement.parentNode.insertBefore(fallbackTextOverlay, targetElement.nextSibling); 
                    console.log(`[ImageLoader] Overlay created for ${targetElement.alt || 'Unnamed Image Title'}.`);

                    const testLocalImage = new Image();
                    testLocalImage.src = localFallbackSrc;
                    testLocalImage.onload = () => {
                         if (targetElement.style.display === 'none') targetElement.style.display = ''; 
                         if (fallbackTextOverlay) fallbackTextOverlay.style.display = 'flex'; 
                    };
                    testLocalImage.onerror = () => {
                        targetElement.style.display = 'none'; 
                        if (fallbackTextOverlay) fallbackTextOverlay.style.display = 'flex'; 
                        console.warn(`[ImageLoader] 🚫 Local fallback "${localFallbackSrc}" itself failed to load. Showing only text overlay over gradient.`);
                    };
                } else {
                    fallbackTextOverlay.textContent = isThumbnail ? "封面加载失败 :(" : "图片加载失败 :("; 
                    fallbackTextOverlay.style.display = 'flex'; 
                }
            }
            console.log(`[ImageLoader] 🎨 Applied local fallback mechanism for: ${targetElement.alt || type}`);
        }
    };
    
    function getRandomGradient() {
        const h1 = Math.floor(Math.random() * 360);
        const h2 = (h1 + 60 + Math.floor(Math.random() * 60)) % 360; 
        const s = Math.floor(Math.random() * 30) + 70; 
        const l = Math.floor(Math.random() * 20) + 50; 
        return `linear-gradient(135deg, hsla(${h1}, ${s}%, ${l}%, 0.7), hsla(${h2}, ${s}%, ${l}%, 0.7))`;
    }

    // --- Global Background Image Setup (for Body) ---
    fetchRandomAnimeImage(document.body, 'background', { width: 1920, height: 1080 }); 
    console.log("[Background] Dynamic background initiated.");


    // --- Dynamic Article Thumbnail/Banner Images ---
    const setupDynamicPostImages = () => {
        document.querySelectorAll('.post-thumbnail[data-src-type="wallpaper"]').forEach(img => {
            applyFallbackImage(img, 'image'); 
            fetchRandomAnimeImage(img, 'image', { width: 500, height: 300 }); 
        });
        console.log("[ImageLoader] Post thumbnails initiated.");

        const detailBanner = document.querySelector('.post-detail-banner[data-src-type="wallpaper"]');
        if (detailBanner) {
            applyFallbackImage(detailBanner, 'image'); 
            fetchRandomAnimeImage(detailBanner, 'image', { width: 1000, height: 400 }); 
            console.log("[ImageLoader] Post detail banner initiated.");
        }
    };

    /**
     * Initializes elements with entrance animations, respecting `data-delay` attributes.
     * This function now explicitly applies `is-visible` based on delays for critical homepage elements.
     */
    const setupScrollAnimations = () => {
        // Elements that animate on scroll/view
        const animatedElements = document.querySelectorAll('.animate__fade-in, .animate__slide-up');
        console.log(`[Animations] Found ${animatedElements.length} scroll-animated elements.`);

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                        const delay = parseInt(entry.target.dataset.delay || '0');
                        setTimeout(() => { // Apply animations after specified delay
                            // Check using classList.contains() to prevent constant re-adding (important for non-observer based elements)
                            if (!entry.target.classList.contains('is-visible')) { 
                                entry.target.classList.add('is-visible');
                                // Exclude the homepage title, header title for unobserving as they might have specific always-on animations
                                const isLooper = entry.target.closest('.is-homepage-title') || entry.target.closest('.is-header-title');
                                if (!isLooper) { 
                                    observer.unobserve(entry.target);
                                    // console.log(`[Animations] Element animated: ${entry.target.tagName} with classList: ${Array.from(entry.target.classList).join(', ')}`);
                                }
                            }
                        }, delay);
                } 
            });
        }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }); // rootMargin makes animation trigger earlier

        animatedElements.forEach(el => observer.observe(el));

        // Ensure main header and homepage core elements are revealed regardless of IO timing
        if (!document.querySelector('.main-header.is-visible')) {
            document.querySelector('.main-header')?.classList.add('is-visible'); 
            console.log("[Animations] Main header instantly visible.");
        }

        // ---------- FIX FOR HOMEPAGE BUTTONS/SUBTITLE NOT SHOWING ----------
        // For homepage specific core elements (subtitle and nav links), directly apply 'is-visible' with data-delay
        // These are critical elements that must be visible.
        if (document.body.classList.contains('is-homepage')) {
             // Target elements with `animate__slide-up` and a specific delay suffix.
             // This is less about `IntersectionObserver` failing, but simply _guaranteeing_ visibility with a visual delay.
            const homepageSubTitle = document.querySelector('.hero-subtitle');
            if(homepageSubTitle && !homepageSubTitle.classList.contains('is-visible')){
                const delay = parseInt(homepageSubTitle.dataset.delay || '0');
                setTimeout(() => {
                    homepageSubTitle.classList.add('is-visible');
                    homepageSubTitle.style.opacity = '1'; // Ensure direct visibility
                    homepageSubTitle.style.transform = 'translateY(0)';
                }, delay);
                console.log(`[Animations] Homepage subtitle scheduled (delay: ${delay}ms).`);
            }

            const homepageHeroNav = document.querySelector('.hero-nav');
            if(homepageHeroNav && !homepageHeroNav.classList.contains('is-visible')){
                const delay = parseInt(homepageHeroNav.dataset.delay || '0');
                 setTimeout(() => {
                    homepageHeroNav.classList.add('is-visible');
                    homepageHeroNav.style.opacity = '1'; // Ensure direct visibility
                    homepageHeroNav.style.transform = 'translateY(0)';
                }, delay);
                console.log(`[Animations] Homepage navigation scheduled (delay: ${delay}ms).`);
            }
             console.log("[Animations] Homepage core elements visibility ensured.");
        }
    };


    // --- Back to Top Button ---
    const setupBackToTopButton = () => {
        const btn = document.getElementById('back-to-top');
        if (!btn) { return; }

        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) { btn.classList.add('show'); } 
            else { btn.classList.remove('show'); }
        });

        btn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
        if (window.scrollY > 300) { btn.classList.add('show'); }
        console.log("[BackToTop] Button initialized.");
    };
    
    // --- Custom Cursor Trail Effect ---
    const setupCursorTrail = () => {
        const cursorDot = document.getElementById('cursor-trail');
        if (!cursorDot || isMobile) { 
            if (cursorDot) cursorDot.style.display = 'none'; 
            document.body.style.cursor = 'auto'; 
            console.log(`[CursorTrail] Disabled for ${isMobile ? 'mobile' : 'missing element'}.`);
            return;
        }
        
        try {
            window.addEventListener('mousemove', e => {
                cursorDot.style.left = `${e.clientX}px`;
                cursorDot.style.top = `${e.clientY}px`;

                let trail = document.createElement('div');
                trail.className = 'cursor-trail-dot';
                document.body.appendChild(trail); 
                trail.style.left = `${e.clientX}px`;
                trail.style.top = `${e.clientY}px`;
                
                setTimeout(() => { 
                    if (trail.parentNode) { trail.parentNode.removeChild(trail); }
                }, 500); 
            });

            document.querySelectorAll('a, button, input:not([type="submit"]), textarea, .post-card, .menu-toggle, .main-nav a, .filter-tag-button').forEach(el => { 
                el.onmouseenter = () => { 
                    cursorDot.style.transform = 'translate(-50%,-50%) scale(1.5)';
                    cursorDot.style.backgroundColor = 'var(--secondary-color)';
                };
                el.onmouseleave = () => { 
                    cursorDot.style.transform = 'translate(-50%,-50%) scale(1)';
                    cursorDot.style.backgroundColor = 'var(--primary-color)';
                };
            });
            
            setTimeout(() => cursorDot.style.opacity = '1', 100); 
            console.log("[CursorTrail] Initialized for desktop.");
        } catch (error) {
            console.error("[CursorTrail] Error during initialization:", error);
            document.body.style.cursor = 'auto'; 
            if (cursorDot) cursorDot.style.display = 'none'; 
        }
    };

    const setupReadProgressBar = () => {
        const progressBar = document.getElementById('read-progress-bar');
        const content = document.querySelector('.blog-post-detail'); 
        if (!progressBar || !content) { return; } 

        const calculateProgress = () => {
           const documentHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight);
            const windowHeight = window.innerHeight;
            const scrollRange = documentHeight - windowHeight; 
            const currentScrollPosition = window.scrollY; 

            let readProgress = (currentScrollPosition / scrollRange) * 100;
            readProgress = Math.min(100, Math.max(0, readProgress)); 

            progressBar.style.width = readProgress + '%';
        }

        window.addEventListener('scroll', calculateProgress);
        window.addEventListener('resize', calculateProgress); 
        setTimeout(calculateProgress, 500); 
        console.log("[ReadProgressBar] Enabled for article page.");
    };
    
    // --- Main Navigation Menu (Mini-Panel UI) ---
    const setupMainMenu = () => {
        const menuToggle = document.querySelector('.menu-toggle');
        const mainNav = document.getElementById('main-nav-menu'); 
        const menuClose = document.querySelector('.main-nav .menu-close');
        
        if (!menuToggle || !mainNav || !menuClose) {
            console.warn('[MainMenu] Elements not found. Main menu features disabled.');
            document.body.classList.remove('no-scroll'); 
            return;
        }

        const openMenu = () => {
            mainNav.classList.add('is-open'); 
            menuToggle.setAttribute('aria-expanded', 'true');
            document.body.classList.add('no-scroll'); 
            console.log("[MainMenu] Menu is now open.");
        };

        const closeMenu = () => {
            if (!mainNav.classList.contains('is-open')) return; 
            mainNav.classList.remove('is-open');
            menuToggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('no-scroll'); 
            console.log("[MainMenu] Menu is now closed.");
        };

        menuToggle.addEventListener('click', (event) => {
            event.stopPropagation(); 
            if (mainNav.classList.contains('is-open')) { closeMenu(); } 
            else { openMenu(); }
        });
        menuClose.addEventListener('click', (event) => {
            event.stopPropagation(); 
            closeMenu();
        });

        mainNav.querySelectorAll('a').forEach(link => {
            let hrefURL;
            try { hrefURL = new URL(link.href, window.location.href); } 
            catch (e) {
                 link.addEventListener('click', closeMenu); 
                 return; 
            }
            if (hrefURL.origin === window.location.origin && hrefURL.protocol !== 'mailto:' && hrefURL.hash === '') {
                link.addEventListener('click', () => { setTimeout(() => { closeMenu(); }, 400); });
            } else { link.addEventListener('click', closeMenu); }
        });

        // Close menu on clicks outside
        document.body.addEventListener('click', (event) => {
            if (mainNav.classList.contains('is-open') && !mainNav.contains(event.target) && !menuToggle.contains(event.target) ) {
                closeMenu();
            }
        });
        console.log("[MainMenu] Navigation menu initialized.");
    };


    // ################### NEW FEATURE: Blog Post Category/Tag Filtering ###################
    const setupPostCategoryFilters = () => {
        const categoryFiltersContainer = document.getElementById('blog-category-filters');
        const blogPostsGrid = document.getElementById('all-posts-grid');
        const isCategoriesPage = window.location.pathname.includes('categories.html');
        const dynamicCategoryList = document.getElementById('dynamic-category-list'); 

        if(window.location.pathname.includes('blog.html') && (!categoryFiltersContainer || !blogPostsGrid)){
             console.log("[CategoryFilter] Not all containers found for blog page filters. Functionality skipped.");
        }

        const allTags = new Set();
        const allPostCards = document.querySelectorAll('.post-card'); 
        allPostCards.forEach(post => { 
            const tagsAttr = post.dataset.tags; 
            if (tagsAttr) { tagsAttr.split(',').map(tag => tag.trim()).forEach(tag => allTags.add(tag)); }
        });

        if (categoryFiltersContainer && blogPostsGrid) {
            let allButton = categoryFiltersContainer.querySelector('[data-filter="all"]');
             if (!allButton) {
                allButton = document.createElement('button');
                allButton.classList.add('filter-tag-button');
                allButton.textContent = `全部文章`;
                allButton.dataset.filter = 'all';
                categoryFiltersContainer.prepend(allButton); 
            }
            allButton.addEventListener('click', () => filterPosts('all', allButton));

            const sortedTags = Array.from(allTags).sort((a,b) => a.localeCompare(b, 'zh-CN')); 
            sortedTags.forEach(tag => {
                if (!categoryFiltersContainer.querySelector(`[data-filter="${tag}"]`)) { 
                    const button = document.createElement('button');
                    button.classList.add('filter-tag-button');
                    button.textContent = ` #${tag}`; 
                    button.dataset.filter = tag; 
                    categoryFiltersContainer.appendChild(button);
                    button.addEventListener('click', () => filterPosts(tag, button));
                }
            });

            const filterPosts = (filterTag, clickedButton = null) => {
                categoryFiltersContainer.querySelectorAll('.filter-tag-button').forEach(btn => { btn.classList.remove('active'); });
                if (clickedButton) { clickedButton.classList.add('active'); } 
                else if (filterTag === 'all' && allButton) { allButton.classList.add('active'); }

                allPostCards.forEach(post => { // Use allPostCards for filtering
                    const tagsAttr = post.dataset.tags;
                    if (!tagsAttr) { post.style.display = (filterTag === 'all') ? 'block' : 'none'; return; }
                    const postTags = tagsAttr.split(',').map(tag => tag.trim());

                    if (filterTag === 'all' || postTags.includes(filterTag)) { post.style.display = 'block'; } 
                    else { post.style.display = 'none'; }
                });
                console.log(`[CategoryFilter] Applied filter: "${filterTag}"`);
            };

            const urlParams = new URLSearchParams(window.location.search);
            const initialTag = urlParams.get('tag'); 
            if (initialTag) {
                const initialButton = categoryFiltersContainer.querySelector(`[data-filter="${initialTag}"]`);
                filterPosts(initialTag, initialButton); 
            } else { filterPosts('all', allButton); }
            console.log("[CategoryFilter] Interactive filters initialized on blog page.");
        }
        
        if (isCategoriesPage && dynamicCategoryList) {
            dynamicCategoryList.innerHTML = ''; 

            const sortedTags = Array.from(allTags).sort((a,b) => a.localeCompare(b, 'zh-CN'));
            if (sortedTags.length === 0) { 
                 dynamicCategoryList.innerHTML = `<p class="no-comments-message">暂时没有可用的文章分类。</p>`;
                 return;
            }

            sortedTags.forEach(tag => {
                const buttonLink = document.createElement('a');
                buttonLink.href = `blog.html?tag=${encodeURIComponent(tag)}`; 
                buttonLink.classList.add('filter-tag-button'); 
                buttonLink.textContent = ` # ${tag}`;
                buttonLink.dataset.filter = tag; 
                dynamicCategoryList.appendChild(buttonLink);
            });
            console.log(`[CategoryPage] Generated ${sortedTags.length} category links.`);
        }
    };


    // --- Share buttons for article pages ---
    const setupShareButtons = () => {
        const shareButtons = document.querySelectorAll('.post-share-buttons a.weibo, .post-share-buttons a.qq');
        if (shareButtons.length === 0) { return; } 

        const currentUrl = encodeURIComponent(window.location.href);
        const pageTitle = document.title;
        const articleTitle = encodeURIComponent(pageTitle.split(' - ')[0] || "Honoka的小屋"); 

        shareButtons.forEach(btn => {
            if (btn.classList.contains('weibo')) {
                btn.href = `https://service.weibo.com/share/share.php?url=${currentUrl}&title=${articleTitle}`;
            } else if (btn.classList.contains('qq')) {
                const imgElement = document.querySelector('.post-detail-banner');
                const imgUrl = (imgElement && imgElement.src && !imgElement.classList.contains('is-loading-fallback') && !imgElement.src.startsWith('data:image/')) 
                               ? encodeURIComponent(imgElement.src) : '';
                btn.href = `https://connect.qq.com/widget/shareqq/index.html?url=${currentUrl}&title=${articleTitle}${imgUrl ? '&pics=' + imgUrl : ''}`;
            }
        });
        console.log("[ShareButtons] Initialized.");
    };
    
    // --- Footer dynamic details and Dynamic Blur Adjustment for Body (includes Backend Visitor Count) ---
    const setupFooterAndDynamicBlur = () => {
        const currentYearSpan = document.getElementById('current-year');
        if (currentYearSpan) { currentYearSpan.textContent = new Date().getFullYear(); }

        // --- NEW: Backend Visitor Counter ---
        const visitorCountSpan = document.getElementById('visitor-count');
        if (visitorCountSpan) {
            fetch(`${backendBaseUrl}handleVisitCount`, {
                method: 'GET',
                 headers: { 'Accept': 'application/json' }
            })
                .then(response => {
                    if (!response.ok) { return response.json().then(error => { throw new Error(error.message || `HTTP status ${response.status}.`); }); }
                    return response.json();
                })
                .then(data => {
                    if (data && typeof data.count !== 'undefined') {
                        visitorCountSpan.textContent = data.count;
                        console.log(`[VisitorCount] Updated to: ${data.count}.`);
                    } else {
                        console.warn("[VisitorCount] API returned no specific count, showing '0'.", data);
                        visitorCountSpan.textContent = '0';
                    }
                })
                .catch(error => {
                    console.error('[VisitorCount] Failed to retrieve or update visitor count from backend:', error);
                    visitorCountSpan.textContent = '???'; 
                });
        }
        // Dynamic Background Blur Adjustment
        const updateBodyBlur = () => {
            const desktopBlur = getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur').trim();
            const mobileBlur = getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur-mobile').trim();
            isMobile = window.innerWidth <= 767; 
            document.documentElement.style.setProperty('--body-global-blur-value', isMobile ? mobileBlur : desktopBlur);
            document.body.classList.toggle('is-mobile', isMobile); // Toggle based on isMobile
        };
        
        document.documentElement.style.setProperty('--body-global-blur-value', getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur').trim());
        updateBodyBlur(); 
        window.addEventListener('resize', updateBodyBlur); 
        console.log("[Blur] Dynamic background blur feature initialized.");
    }


    // --- Global Feature Initialization Point ---
    setupDynamicPostImages(); 
    setupScrollAnimations();
    setupCursorTrail(); 
    setupBackToTopButton();
    setupReadProgressBar();
    setupMainMenu(); 
    setupShareButtons();
    setupFooterAndDynamicBlur(); 
    setupPostCategoryFilters();

    console.log("✅ script.js FINISHED execution.");
});
