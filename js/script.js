document.addEventListener('DOMContentLoaded', () => {

    console.log("🚀 [FINAL Version: MEGA-FIX & ULTIMATE STABILITY] script.js STARTING execution...");

    // ===================================================================
    // 1. CORE UTILITIES & DYNAMIC STATE (including Cursor Trail definition)
    // ===================================================================

    // Function declaration for full hoisting safety to avoid ReferenceErrors
    function setupCursorTrail() {
        const cursorDot = document.getElementById('cursor-trail');
        const isCurrentlyMobile = document.body.classList.contains('is-mobile'); 

        if (!cursorDot) {
            console.log("[CursorTrail] Cursor trail element (ID: 'cursor-trail') not found. Skipping setup.");
            document.body.style.cursor = 'auto'; 
            return;
        }

        // Clean up any old listeners before conditionally re-applying to prevent duplicates/memory leaks
        if (window._currentMousemoveHandler) {
            window.removeEventListener('mousemove', window._currentMousemoveHandler);
            delete window._currentMousemoveHandler;
        }
        document.querySelectorAll('a, button, .post-card, .menu-toggle, .main-nav a, .filter-tag-button').forEach(el => {
            if (el._currentHoverEnterHandler) {
                el.removeEventListener('mouseenter', el._currentHoverEnterHandler);
                delete el._currentHoverEnterHandler;
            }
            if (el._currentHoverLeaveHandler) {
                el.removeEventListener('mouseleave', el._currentHoverLeaveHandler);
                delete el._currentHoverLeaveHandler;
            }
        });

        if (!isCurrentlyMobile) {
            document.body.style.cursor = 'none'; 
            cursorDot.style.display = 'block'; 
            cursorDot.style.opacity = '1'; 

            const mousemoveHandler = e => {
                cursorDot.style.left = `${e.clientX}px`;
                cursorDot.style.top = `${e.clientY}px`;
            };
            window.addEventListener('mousemove', mousemoveHandler);
            window._currentMousemoveHandler = mousemoveHandler; // Storing reference

            document.querySelectorAll('a, button, .post-card, .menu-toggle, .main-nav a, .filter-tag-button').forEach(el => {
                const handleMouseEnter = () => { 
                    cursorDot.style.transform = 'translate(-50%, -50%) scale(1.5)';
                    cursorDot.style.backgroundColor = 'var(--secondary-color)'; 
                };
                // ★★★ CRITICAL FIX: Corrected typo from 'handleLeaveHandler' to 'handleMouseLeave' ★★★
                const handleMouseLeave = () => { 
                    cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
                    cursorDot.style.backgroundColor = 'var(--primary-color)';   
                };
                
                el.addEventListener('mouseenter', handleMouseEnter);
                el.addEventListener('mouseleave', handleMouseLeave); // CORRECTED line
                el._currentHoverEnterHandler = handleMouseEnter; 
                el._currentHoverLeaveHandler = handleMouseLeave; 
            });
            console.log("[CursorTrail] Initialized for desktop browsing.");

        } else { // On mobile devices, disable custom cursor
            document.body.style.cursor = 'auto'; 
            cursorDot.style.display = 'none'; 
            cursorDot.style.opacity = '0'; 
            console.log("[CursorTrail] Disabled because device is mobile.");
        }
    } // End of setupCursorTrail function

    // Function declaration for full hoisting safety
    function updateBodyStyling() { 
        const desktopBlurCssVar = getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur').trim();
        const mobileBlurCssVar = getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur-mobile').trim();
        const currentIsMobile = window.innerWidth <= 767;

        document.documentElement.style.setProperty('--body-global-blur-value', currentIsMobile ? mobileBlurCssVar : desktopBlurCssVar);
        document.body.classList.toggle('is-mobile', currentIsMobile);
        
        // Ensure cursor setup runs AFTER is-mobile class is applied and after a microtask for accuracy
        setTimeout(setupCursorTrail, 0); 
    }

    // Initial call on load, and then listen for resize events
    updateBodyStyling(); // Initial setup on DOMContentLoaded
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(updateBodyStyling, 200); // Debounce resize event
    }); 

    // ################### IMPORTANT: backendBaseUrl Configuration ###################
    const backendBaseUrl = 'https://honoka1.netlify.app/.netlify/functions/'; 


    // --- Global Page Transition Overlay Management --- // Function declaration for full hoisting safety
    function setupPageTransition() {
        const pageTransitionOverlay = document.getElementById('global-page-transition-overlay');
        if (pageTransitionOverlay) {
            if (!pageTransitionOverlay.querySelector('.loader')) {
                pageTransitionOverlay.innerHTML = `<div class="loader"></div><p class="overlay-text">加载中...</p>`;
            }
            setTimeout(() => { 
                if (pageTransitionOverlay) { 
                    pageTransitionOverlay.classList.remove('visible');
                    // Longer delay here to ensure fade-out completes aesthetically
                    setTimeout(() => { 
                        if (pageTransitionOverlay) pageTransitionOverlay.style.display = 'none';
                        document.body.classList.remove('no-scroll'); 
                    }, 500); 
                }
            }, 100); 
            console.log("[PageTransition] Overlay initialized for first load.");
        }
    }

    /**
     * Triggers a smooth page transition overlay and then navigates to the target URL.
     * Function declaration for full hoisting safety
     */
    function activatePageTransition(urlToNavigate) {
        const pageTransitionOverlay = document.getElementById('global-page-transition-overlay'); // Re-get inside function
        if (!pageTransitionOverlay) { 
            window.location.href = urlToNavigate; 
            return; 
        }
        document.body.classList.add('no-scroll'); 
        pageTransitionOverlay.style.display = 'flex'; 
        pageTransitionOverlay.classList.add('visible'); 
        setTimeout(() => { window.location.href = encodeURI(urlToNavigate); }, 400); 
        console.log(`[PageTransition] Activating transition to: ${urlToNavigate}`);
    }

    /**
     * Intercepts all internal link clicks to apply a smooth page transition effect.
     * Function declaration for full hoisting safety
     */
    function setupLinkInterceptor() {
        document.querySelectorAll('a').forEach(link => {
            if (link.target === '_blank' || link.href.startsWith('mailto:') || link.href.startsWith('javascript:void(0)')) {
                return; // Skip these links for transition
            }

            let hrefURL;
            try { 
                hrefURL = new URL(link.href, window.location.href); 
            } catch (e) {
                console.warn(`[LinkInterceptor] Invalid URL encountered for link "${link.href}", skipping event listener.`, e);
                return; 
            }

            const isInternalAnchor = hrefURL.hash && hrefURL.pathname === window.location.pathname && hrefURL.origin === window.location.origin;

            if (hrefURL.origin === window.location.origin && !isInternalAnchor) {
                link.addEventListener('click', (e) => {
                    e.preventDefault(); 
                    activatePageTransition(link.href);
                });
            }
        });
        console.log("[LinkInterceptor] Internal link click interception initialized.");
    }


    // --- Dynamic Image Loading & Fallback ---
    // Function declaration for full hoisting safety
    function getRandomGradient() {
        const h1 = Math.floor(Math.random() * 360); 
        const h2 = (h1 + 60 + Math.floor(Math.random() * 60)) % 360; 
        const s = Math.floor(Math.random() * 30) + 70; 
        const l = Math.floor(Math.random() * 20) + 50; 
        return `linear-gradient(135deg, hsla(${h1}, ${s}%, ${l}%, 0.7), hsla(${h2}, ${s}%, ${l}%, 0.7))`;
    }

    // Function declaration for full hoisting safety
    async function fetchRandomAnimeImage(targetElement, type = 'background') {
        let imageUrl = '';
        const apiEndpoints = [
             `https://iw233.cn/api/Pure.php`,        
             `https://api.adicw.cn/img/rand.php`,    
             `https://www.dmoe.cc/random.php`,       
        ];

        const extractImageUrl = async (response, apiDebugName) => {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.startsWith('image/')) {
                return response.givenUrl || response.url; // Use givenUrl if available, else response.url
            } else if (contentType && contentType.includes('json')) { 
                try {
                    const data = await response.json();
                    if (data && (data.imgurl || data.url) && typeof (data.imgurl || data.url) === 'string' && (data.imgurl || data.url).match(/\.(jpeg|jpg|gif|png|webp|bmp|avif|svg)$/i)) { 
                        return data.imgurl || data.url;
                    }
                } catch (e) {
                    console.warn(`[ImageLoader-${apiDebugName}] JSON parsing failed. Content-Type: ${contentType}.`, e);
                }
            }
            console.warn(`[ImageLoader-${apiDebugName}] 🔄 Could not extract image URL from response (Content-Type: ${contentType}). Trying next API.`);
            return ''; 
        };
        

        for (const api of apiEndpoints) {
            const apiDebugName = new URL(api).hostname; 
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), Math.min(4000, 2000 + Math.random() * 2000)); 
                
                const response = await fetch(api, { method: 'GET', redirect: 'follow', signal: controller.signal, headers: { 'Accept': 'image/*,application/json' } });
                clearTimeout(timeoutId);

                if (response.ok) {
                    imageUrl = await extractImageUrl(response, apiDebugName);
                    if (imageUrl) { break; } 
                } else {
                    console.warn(`[ImageLoader-${apiDebugName}] ⚠️ API responded with HTTP status ${response.status}. Trying next.`);
                }
            } catch (innerError) {
                if (innerError.name === 'AbortError') {
                    console.warn(`[ImageLoader-${apiDebugName}] ⏱️ Request timed out. Continuing to next API.`);
                } else if (innerError instanceof TypeError || innerError instanceof DOMException) {
                   console.warn(`[ImageLoader-${apiDebugName}] 🚫 Network/Fetch error: '${innerError.message}'. Continuing to next API.`);
                } else {
                    console.warn(`[ImageLoader-${apiDebugName}] ❌ Unexpected error triggering fetch: '${innerError.message}'. Continuing to next API.`);
                }
            }
        }
        
        if (imageUrl) {
            const imgToLoad = new Image(); 
            imgToLoad.src = imageUrl;
            imgToLoad.onload = () => {
                if (type === 'background' && document.documentElement) {
                    document.documentElement.style.setProperty('--bg-image', `url("${imageUrl}")`); 
                    console.log(`[ImageLoader] ✅ Dynamic background applied: ${imageUrl.substring(0, 50)}...`);
                } else if (type === 'image' && targetElement) {
                    targetElement.src = imageUrl; 
                    targetElement.style.opacity = '1'; 
                    targetElement.style.objectFit = 'cover'; 
                }
                if (targetElement) { // targetElement exists
                    targetElement.classList.remove('is-loading-fallback'); 
                    targetElement.style.filter = ''; 
                    const fallbackText = targetElement.nextElementSibling;
                    if (fallbackText && fallbackText.classList.contains('fallback-text-overlay')) {
                        fallbackText.classList.remove('is-visible'); 
                        setTimeout(() => fallbackText.remove(), 300); 
                    }
                }
                console.log(`[ImageLoader] ✅ Real image from API loaded: ${imageUrl.substring(0, 50)}...`);
            };
            // Use local fallback if preloading fails *after* receiving a valid URL
            imgToLoad.onerror = () => { 
                console.warn(`[ImageLoader] 🚫 Preloading image "${imageUrl}" failed *after* receiving valid URL. Applying local fallback.`);
                applyFallbackImage(targetElement, type); 
            };
        } else { 
            console.error('[ImageLoader] ❌ No valid image URL received from any dynamic API source after all attempts. Forcing local fallback.');
            applyFallbackImage(targetElement, type); 
        }
    } // End of fetchRandomAnimeImage

    // Function declaration for full hoisting safety
    function applyFallbackImage(targetElement, type, srcOverride = null) {
        const isAvatar = targetElement && targetElement.classList.contains('my-avatar');
        const isThumbnail = targetElement && targetElement.classList.contains('post-thumbnail');
        
        // Define fallback filename based on context
        let fallbackFilename;
        if (isAvatar) { // Special avatar fallback
            fallbackFilename = 'avatar.png';
        } else {
            fallbackFilename = isThumbnail ? 'post-thumbnail-fallback.png' : 'post-detail-banner-fallback.png';
        }
        
        // ★★★ CRITICAL FIX: Always use root-relative path for local assets on the webserver ★★★
        const localFallbackSrc = srcOverride || `/img/${fallbackFilename}`; 
        
        if (type === 'background' && document.documentElement) {
            document.documentElement.style.setProperty('--bg-image', getRandomGradient());
            console.log(`[ImageLoader] 🖼️ Applied gradient background fallback for body.`);
        } else if (type === 'image' && targetElement) {
            targetElement.src = localFallbackSrc; 
            targetElement.style.objectFit = isAvatar ? 'cover' : 'contain'; // Avatar still covers, others contain
            targetElement.classList.add('is-loading-fallback'); 
            targetElement.style.opacity = '1'; 
            
            // Ensure the image element itself always has a base gradient for robustness
            targetElement.style.backgroundImage = getRandomGradient(); 
            targetElement.style.backgroundRepeat = 'no-repeat';
            targetElement.style.backgroundPosition = 'center';
            targetElement.style.backgroundSize = 'cover';

            let fallbackTextOverlay = targetElement.nextElementSibling;
            const parentPositionedRelative = targetElement.parentNode && getComputedStyle(targetElement.parentNode).position === 'static';

            if (!fallbackTextOverlay || !fallbackTextOverlay.classList.contains('fallback-text-overlay')) {
                fallbackTextOverlay = document.createElement('div');
                fallbackTextOverlay.classList.add('fallback-text-overlay'); 
                if (parentPositionedRelative) {
                    targetElement.parentNode.style.position = 'relative'; 
                }
                targetElement.insertAdjacentElement('afterend', fallbackTextOverlay);
                console.log(`[ImageLoader] Fallback overlay created for ${targetElement.alt || '(Unnamed Image)'}.`);
            }
            // Always set text content and make it visible for feedback
            fallbackTextOverlay.textContent = isAvatar ? "头像加载失败 :(" : (isThumbnail ? "封面加载失败 :(" : "图片加载失败 :(");
            
            // Immediately add 'is-visible' to the overlay for a quick fade-in
            setTimeout(() => fallbackTextOverlay.classList.add('is-visible'), 50); 
            

            // Secondary check: if the local fallback image itself is broken, hide the `<img>` tag picture, only show overlay + gradient.
            const testLocalImage = new Image();
            testLocalImage.src = localFallbackSrc;
            testLocalImage.onload = () => {
                targetElement.style.visibility = 'visible'; 
                if (fallbackTextOverlay) fallbackTextOverlay.classList.add('is-visible');
            };
            testLocalImage.onerror = () => {
                targetElement.style.visibility = 'hidden'; // Hide the `<img>` content, leave background gradient
                if (fallbackTextOverlay) setTimeout(() => fallbackTextOverlay.classList.add('is-visible'), 50); // Ensure visible
                console.warn(`[ImageLoader] 🚫 Local fallback image (path: "${localFallbackSrc}") itself failed to load. Displaying only text overlay over gradient.`);
            };

            console.log(`[ImageLoader] 🎨 Applied local fallback mechanism with overlay for: ${targetElement?.alt || type}.`);
        }
    } // End of applyFallbackImage

    // Function declaration for full hoisting safety
    function setupDynamicPostImages() {
        fetchRandomAnimeImage(document.documentElement, 'background'); 

        // ★★★ CRITICAL FIX: Include .my-avatar for dynamic loading if present ★★★
        document.querySelectorAll('.my-avatar, .post-thumbnail[data-src-type="wallpaper"]').forEach(img => {
            if (img.dataset.srcType === 'wallpaper' || img.classList.contains('my-avatar')) { // explicit check
                applyFallbackImage(img, 'image'); 
                fetchRandomAnimeImage(img, 'image'); 
            }
        });
        console.log("[ImageLoader] Post thumbnails and avatar initiated.");

        const detailBanner = document.querySelector('.post-detail-banner[data-src-type="wallpaper"]');
        if (detailBanner) {
            applyFallbackImage(detailBanner, 'image'); 
            fetchRandomAnimeImage(detailBanner, 'image'); // Try to fetch a new one
            console.log("[ImageLoader] Post detail banner initiated.");
        }
    }


    /**
     * Initializes and triggers entrance animations for elements across the page.
     * This function now unifies all content visibility, ensuring everything appears.
     * Function declaration for full hoisting safety
     */
    function applyImmediateVisibilityFix() {
        // STEP 1: Force critical structural elements to be display-visible immediately (lowest level CSS override)
        // This is a direct style override to ensure layout containers are present.
        const structuralElements = document.querySelectorAll(
            '.main-header, .hero-section, .content-page-wrapper, .main-footer, #global-page-transition-overlay'
        );
        structuralElements.forEach(el => {
            el.classList.add('force-visible'); 
        });
        console.log("[VisibilityFix] Top-level structural UI elements immediately 'force-visible' in CSS.");


        // STEP 2: The most comprehensive selector for all content elements that are designed to animate
        // or that start at `opacity: 0` and need `is-visible` to properly display.
        const elementsToAnimateOrReveal = document.querySelectorAll(
            // Everything that explicitly has an `animate__` class.
            '[class*="animate__"], ' + 
            // Generic content elements within the main section and content wrappers that might start hidden
            'main.main-content h1, main.main-content p, main.main-content ul, main.main-content ol, ' +
            'main.container.content-page-wrapper h1, main.container.content-page-wrapper h2, ' +
            'main.container.content-page-wrapper h3, main.container.content-page-wrapper h4, ' +
            'main.container.content-page-wrapper p:not(.post-excerpt):not(.form-hint):not(.no-comments-message), ' +
            'main.container.content-page-wrapper ul:not(.main-nav ul), ' + // Exclude main navigation menus
            'main.container.content-page-wrapper ol, ' +
            // Specific elements across different pages that need explicit visibility
            '.hero-subtitle, .hero-nav a, .hero-content, ' + // Homepage specific
            '.blog-title.is-header-title > a, .menu-toggle, .main-nav ul li a, ' + // Header & Navigation
            '.my-avatar, .about-me-section p, .contact-info, .contact-info h3, .contact-info ul li, ' + // About page
            '#blog-category-filters .filter-tag-button, #all-posts-grid .post-card, ' + // Blog filters & post cards
            '.post-card .post-info h3, .post-card .post-excerpt, .post-card time, .post-card .post-tags, .post-card .tag, ' + // Inside post cards
            '.blog-post-detail .post-detail-title, .blog-post-detail .post-meta, .blog-post-detail .post-detail-banner, ' + // Article details
            '.blog-post-detail .post-content, .blog-post-detail .post-content h3, ' + // Article content
            '.post-share-buttons, .post-share-buttons span, .share-button, .read-more .button, ' + // Engagement buttons
            '.comment-section .page-title, .comment-form-container, .comment-form-container h3, ' + // Comments page specific
            // Form elements need explicit show:
            '.form-group, .form-group label, .form-group input, .form-group textarea, .form-hint, ' + 
            '.comments-list-container, .comments-list-container h3, ' + // Comments list elements
            '#comments-list .post-card, #comments-list .comment-info, #comments-list .comment-text, ' +
            '#comments-list .comment-meta, .no-comments-message, ' + 
            // Categories page
            '.categories-section .page-title, .categories-section p, #dynamic-category-list .filter-tag-button, .categories-section .button-container .button, ' + 
            // Global utility UI
            '#back-to-top, .main-footer p, #current-year, #visitor-count ' 
        );

        elementsToAnimateOrReveal.forEach(el => {
            const delay = parseInt(el.dataset.delay || '0', 10);
            setTimeout(() => {
                // Ensure 'is-visible' is added only if not already present or forced
                if (!el.classList.contains('is-visible') && !el.classList.contains('force-visible')) {
                    el.classList.add('is-visible');
                }
            }, delay + 50); // Small base delay for smoother initial render
        });
        console.log(`[VisibilityFix] Applied 'is-visible' to ${elementsToAnimateOrReveal.length} content elements for guaranteed display.`);

        // STEP 3: Fallback IntersectionObserver for dynamically added elements or missed items.
        // It's a safety net, less critical with comprehensive STEP 2.
        const observer = new IntersectionObserver((entries, observerInstance) => {
            entries.forEach(entry => {
                const isElementAlreadyVisible = entry.target.classList.contains('is-visible') || entry.target.classList.contains('force-visible');

                if (entry.isIntersecting && !isElementAlreadyVisible) {
                    const delay = parseInt(entry.target.dataset.delay || '0', 10);
                    setTimeout(() => {
                        if (!entry.target.classList.contains('is-visible')) { 
                            entry.target.classList.add('is-visible');
                        }
                        // Unobserve once visible, unless it's the rotating blog title (continuous animation)
                        if (!entry.target.classList.contains('blog-title--animated')) { 
                            observerInstance.unobserve(entry.target); 
                        }
                    }, delay + 50); 
                }
            });
        }, { 
            threshold: 0.1, 
            rootMargin: "0px 0px -50px 0px" 
        });

        document.querySelectorAll(
            '[class*="animate__"], ' + 
            '.comments-list-container, .comment-form-container, .about-me-section, .categories-section, .blog-post-detail'
            )
            .forEach(el => {
                if (!el.classList.contains('force-visible') && !el.classList.contains('is-visible')) {
                    observer.observe(el);
                }
            });
        console.log("[VisibilityFix] IntersectionObserver re-initialized as additional fallback.");
    } // End of applyImmediateVisibilityFix


    // Function declaration for full hoisting safety
    function setupBackToTopButton() {
        const btn = document.getElementById('back-to-top');
        if (!btn) { console.log("[BackToTop] 'back-to-top' button element not found. Feature disabled."); return; }

        if (window.scrollY > 300) { btn.classList.add('show'); } 
        else { btn.classList.remove('show'); }

        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) { btn.classList.add('show'); } 
            else { btn.classList.remove('show'); }
        });
        btn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
        console.log("[BackToTop] Button initialized.");
    }
    
    // Function declaration for full hoisting safety
    function setupReadProgressBar() {
        const progressBar = document.getElementById('read-progress-bar');
        const content = document.querySelector('.blog-post-detail'); 
        if (!progressBar || !content) { 
            console.log("[ReadProgressBar] Not an article detail page or elements not found. Feature skipped."); 
            return; 
        } 

        function calculateProgress() {
           const documentHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
            const currentScrollPosition = window.scrollY; 

            let readProgress = (documentHeight > 0) ? (currentScrollPosition / documentHeight) * 100 : 0;
            readProgress = Math.min(100, Math.max(0, readProgress)); 

            progressBar.style.width = readProgress + '%'; 
        }

        window.addEventListener('scroll', calculateProgress);
        window.addEventListener('resize', calculateProgress); 
        setTimeout(calculateProgress, 100); 
        console.log("[ReadProgressBar] Enabled for article page.");
    }
    
    // Function declaration for full hoisting safety
    function setupMainMenu() {
        const menuToggle = document.querySelector('.menu-toggle');
        const mainNav = document.getElementById('main-nav-menu'); 
        const menuClose = document.querySelector('.main-nav .menu-close');
        
        if (!menuToggle || !mainNav || !menuClose) {
            console.warn('[MainMenu] Menu elements not found. Features disabled. Check HTML.');
            document.body.classList.remove('no-scroll'); 
            return;
        }

        const openMenu = () => {
            mainNav.classList.add('is-open'); 
            menuToggle.setAttribute('aria-expanded', 'true');
            document.body.classList.add('no-scroll'); 
            console.log("[MainMenu] Panel menu is now open.");
        };

        const closeMenu = () => {
            if (!mainNav.classList.contains('is-open')) return; 
            mainNav.classList.remove('is-open');
            menuToggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('no-scroll'); 
            console.log("[MainMenu] Panel menu is now closed.");
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
            if (link._menuTransitionHandler) { // Remove old listeners
                link.removeEventListener('click', link._menuTransitionHandler);
            }

            let hrefURL;
            try { 
                hrefURL = new URL(link.href || 'javascript:void(0)', window.location.href); 
            } catch (e) {
                const simpleCloser = () => { closeMenu(); }; 
                link.addEventListener('click', simpleCloser); 
                link._menuTransitionHandler = simpleCloser;
                return; 
            }

            const newMenuClickHandler = (e) => {
                 if (hrefURL.origin === window.location.origin && hrefURL.pathname !== window.location.pathname) {
                    e.preventDefault(); 
                    activatePageTransition(link.href); 
                    setTimeout(() => { closeMenu(); }, 400); 
                 } else { 
                    closeMenu(); 
                 }
            };
            link.addEventListener('click', newMenuClickHandler);
            link._menuTransitionHandler = newMenuClickHandler; 
        });

        document.body.addEventListener('click', (event) => {
            if (mainNav.classList.contains('is-open') && !mainNav.contains(event.target) && !menuToggle.contains(event.target) ) {
                closeMenu();
            }
        });
        console.log("[MainMenu] Navigation menu initialized.");
    } 


    // Function declaration for full hoisting safety
    function setupPostCategoryFilters() {
        const categoryFiltersContainer = document.getElementById('blog-category-filters');
        const blogPostsGrid = document.getElementById('all-posts-grid'); 
        
        const isCategoriesPage = window.location.pathname.includes('categories.html');
        const dynamicCategoryList = document.getElementById('dynamic-category-list'); 

        const allPosts = document.querySelectorAll('.post-card[data-tags]');
        const allTags = new Set();
        allPosts.forEach(post => { 
            const tagsAttr = post.dataset.tags; 
            if (tagsAttr) { tagsAttr.split(',').map(tag => tag.trim()).filter(Boolean).forEach(tag => allTags.add(tag)); }
        });
        
        const sortedTags = Array.from(allTags).sort((a,b) => a.localeCompare(b, 'zh-CN')); 

        if (categoryFiltersContainer && blogPostsGrid) {
            categoryFiltersContainer.innerHTML = ''; 
            const allButton = document.createElement('button');
            allButton.classList.add('filter-tag-button', 'button', 'active'); 
            allButton.textContent = `全部文章`;
            allButton.dataset.filter = 'all';
            categoryFiltersContainer.prepend(allButton); 

            const filterPosts = (filterTag, clickedButton = null) => {
                categoryFiltersContainer.querySelectorAll('.filter-tag-button').forEach(btn => { 
                    btn.classList.remove('active'); 
                });
                if (clickedButton) { 
                    clickedButton.classList.add('active'); 
                } else if (filterTag === 'all') { 
                    allButton.classList.add('active'); 
                }

                blogPostsGrid.querySelectorAll('.post-card').forEach(post => { 
                    const tagsAttr = post.dataset.tags;
                    if (!tagsAttr) { 
                        post.style.display = (filterTag === 'all') ? 'block' : 'none'; 
                        post.classList.toggle('is-visible', filterTag === 'all');
                        return;
                    }
                    const postTagsLower = tagsAttr.split(',').map(tag => tag.trim().toLowerCase()); 
                    const filterTagLower = filterTag?.toLowerCase(); 

                    if (filterTagLower === 'all' || postTagsLower.includes(filterTagLower)) { 
                        post.style.display = 'block'; 
                        setTimeout(() => post.classList.add('is-visible'), parseInt(post.dataset.delay || '0', 10)); 
                    } else {
                        post.style.display = 'none'; 
                        post.classList.remove('is-visible'); 
                    }
                });
                console.log(`[CategoryFilter] Applied filter: "${filterTag}".`);
            };

            allButton.addEventListener('click', () => filterPosts('all', allButton));

            sortedTags.forEach(tag => {
                const button = document.createElement('button');
                button.classList.add('filter-tag-button', 'button'); 
                button.textContent = ` #${tag}`; 
                button.dataset.filter = tag; 
                categoryFiltersContainer.appendChild(button);
                button.addEventListener('click', () => filterPosts(tag, button));
            });

            const urlParams = new URL(window.location.href);
            const initialTag = urlParams.searchParams.get('tag'); 
            if (initialTag) {
                const initialButton = categoryFiltersContainer.querySelector(`[data-filter="${initialTag.trim()}"]`); 
                if(initialButton) {
                    filterPosts(initialTag.trim(), initialButton); 
                } else { 
                    filterPosts('all', allButton); 
                }
            } else { 
                filterPosts('all', allButton); 
            }
            console.log("[CategoryFilter] Interactive filters initialized on blog page.");
        }
        
        if (isCategoriesPage && dynamicCategoryList) {
            dynamicCategoryList.innerHTML = ''; 

            if (sortedTags.length === 0) { 
                 dynamicCategoryList.innerHTML = `<p class="no-comments-message is-visible">暂时没有可用的文章分类。</p>`; 
                 console.log('[CategoryPage] No tags found, displaying default message.');
                 return;
            }

            sortedTags.forEach((tag, index) => {
                const buttonLink = document.createElement('a'); 
                buttonLink.href = `blog.html?tag=${encodeURIComponent(tag)}`; 
                buttonLink.classList.add('filter-tag-button', 'button', 'animate__slide-up'); 
                buttonLink.textContent = ` # ${tag}`;
                buttonLink.setAttribute('aria-label', `查看所有分类为 ${tag} 的文章`);

                buttonLink.dataset.filter = tag; 
                buttonLink.dataset.delay = String(index * 50); 
                dynamicCategoryList.appendChild(buttonLink);
                setTimeout(() => buttonLink.classList.add('is-visible'), (index * 50) + 100); 
            });
            console.log(`[CategoryPage] Generated ${sortedTags.length} category links.`);
            
            const contentWrapper = document.querySelector('main.container.content-page-wrapper');
            if (contentWrapper && !contentWrapper.classList.contains('is-visible')) {
                setTimeout(() => contentWrapper.classList.add('is-visible'), 150); 
            }
        }
    } 

    // Function declaration for full hoisting safety
    function setupShareButtons() {
        const shareButtons = document.querySelectorAll('.post-share-buttons a.weibo, .post-share-buttons a.qq');
        if (shareButtons.length === 0) { 
            console.log("[ShareButtons] No share buttons found on this page."); 
            return; 
        } 

        const currentUrl = encodeURIComponent(window.location.href);
        const pageTitle = document.title;
        const articleTitle = encodeURIComponent(pageTitle.split(' - ')[0] || "Honoka的小屋"); 

        shareButtons.forEach(btn => {
            if (btn.classList.contains('weibo')) {
                btn.href = `https://service.weibo.com/share/share.php?url=${currentUrl}&title=${articleTitle}`;
            } else if (btn.classList.contains('qq')) {
                const imgElement = document.querySelector('.post-detail-banner');
                const imgUrl = (imgElement && imgElement.src && !imgElement.classList.contains('is-loading-fallback') && imgElement.naturalWidth > 0)
                               ? encodeURIComponent(imgElement.src) : ''; 
                btn.href = `https://connect.qq.com/widget/shareqq/index.html?url=${currentUrl}&title=${articleTitle}${imgUrl ? '&pics=' + imgUrl : ''}`;
            }
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                window.open(btn.href, 'sharewindow', 'height=480,width=640,toolbar=no,menubar=no,scrollbars=yes,resizable=yes');
            });
        });
        console.log("[ShareButtons] Share buttons initialized.");
    } 
    
    // Function declaration for full hoisting safety
    function setupFooterAndVisitorCount() { 
        const currentYearSpan = document.getElementById('current-year');
        if (currentYearSpan) { currentYearSpan.textContent = new Date().getFullYear(); }

        const visitorCountSpan = document.getElementById('visitor-count');
        if (!visitorCountSpan) {
            console.log("[VisitorCount] Visitor count element not found (ID: 'visitor-count'). Feature skipped.");
            return;
        }

        fetch(`${backendBaseUrl}handleVisitCount`, {
            method: 'GET',
             headers: { 'Accept': 'application/json' }
        })
            .then(response => {
                if (!response.ok) { 
                    return response.json().then(error => { 
                       throw new Error(error.message || `API error: HTTP ${response.status} ${response.statusText}.`); 
                    }).catch(() => {
                       throw new Error(`API error: HTTP ${response.status} ${response.statusText}. Failed to parse backend error.`);
                    }); 
                }
                return response.json(); 
            })
            .then(data => {
                if (data && typeof data.count !== 'undefined') {
                    visitorCountSpan.textContent = data.count;
                    console.log(`[VisitorCount] Updated to: ${data.count}.`);
                } else {
                    console.warn("[VisitorCount] API returned no specific count structure. Showing '0'. Response:", data);
                    visitorCountSpan.textContent = '0';
                }
            })
            .catch(error => {
                console.error('[VisitorCount] Failed to retrieve or update visitor count from frontend fetch. Details:', error, '. Check backend config (e.g., Firebase key) or Netlify Function deployment.');
                visitorCountSpan.textContent = '???'; 
            });
        console.log("[VisitorCount] Footer current year and visitor count feature initialized.");
    } 


    // --- MAIN GLOBAL INITIALIZATION SEQUENCE ---
    function initializeAllFeatures() {
        // Critical initializations should happen as soon as possible after DOM parsing
        setupPageTransition(); // Before any links are clicked
        setupLinkInterceptor(); // Before page renders properly and users can click
        updateBodyStyling(); // Sets up mobile class and calls setupCursorTrail

        // Key UI/Content Features can follow. Call `applyImmediateVisibilityFix` early with a small delay.
        setTimeout(() => {
            applyImmediateVisibilityFix(); 
        }, 50); 

        setupDynamicPostImages(); 

        setupMainMenu();                 
        setupBackToTopButton();         
        setupReadProgressBar();         
        setupFooterAndVisitorCount();   
        setupPostCategoryFilters();     // Filters and categories depend on DOM-loaded post cards

        console.log("✅ [FINAL Version: MEGA-FIX & ULTIMATE STABILITY] All page features initialization sequence triggered.");
    }
    
    initializeAllFeatures();

    console.log("✅ [FINAL Version: MEGA-FIX & ULTIMATE STABILITY] script.js COMPLETED all execution. Site should be fully functional now.");
});
