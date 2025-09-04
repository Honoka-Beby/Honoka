document.addEventListener('DOMContentLoaded', () => {

    console.log("🚀 [FINAL Version: ULTIMATE REPAIR] script.js STARTING execution...");

    // ===================================================================
    // 1. CORE UTILITIES & DYNAMIC STATE (including Cursor Trail definition)
    // ===================================================================

    // Function declaration for full hoisting safety to avoid ReferenceErrors
    function setupCursorTrail() {
        const cursorDot = document.getElementById('cursor-trail');
        const isCurrentlyMobile = document.body.classList.contains('is-mobile'); 

        if (!cursorDot) {
            console.log("[CursorTrail] Cursor trail element (ID: 'cursor-trail') not found. Skipping setup.");
            document.body.style.cursor = 'auto'; // Ensure default cursor is on for everyone
            return;
        }

        // Clean up any old listeners before conditionally re-applying to prevent duplicates/memory leaks
        // This is crucial for single-page application like feel, as listeners won't duplicate on soft reloads.
        if (window._currentMousemoveHandler) {
            window.removeEventListener('mousemove', window._currentMousemoveHandler);
            delete window._currentMousemoveHandler;
        }
        document.querySelectorAll('a, button, [role="button"], .post-card, .menu-toggle, .main-nav a, .filter-tag-button').forEach(el => {
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
            document.body.style.cursor = 'none'; // Hide browser's default cursor
            cursorDot.style.display = 'block'; 
            cursorDot.style.opacity = '1'; 

            const mousemoveHandler = e => {
                cursorDot.style.left = `${e.clientX}px`;
                cursorDot.style.top = `${e.clientY}px`;
            };
            window.addEventListener('mousemove', mousemoveHandler);
            window._currentMousemoveHandler = mousemoveHandler; // Storing reference to remove properly

            document.querySelectorAll('a, button, [role="button"], .post-card, .menu-toggle, .main-nav a, .filter-tag-button').forEach(el => {
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
                el.addEventListener('mouseleave', handleMouseLeave); // CORRECTED line and reference
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
        setTimeout(setupCursorTrail, 0); // Defer to end of event loop to ensure DOM is fully ready
    }

    // Initial call on load, and then listen for resize events
    updateBodyStyling(); // Initial setup on DOMContentLoaded
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(updateBodyStyling, 200); // Debounce resize event for performance
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
            // Give a very slight delay for CSS to paint before starting fade out
            setTimeout(() => { 
                if (pageTransitionOverlay) { 
                    pageTransitionOverlay.classList.remove('visible');
                    // Longer delay here to ensure fade-out completes aesthetically (CSS transition is 0.5s for opacity)
                    setTimeout(() => { 
                        if (pageTransitionOverlay) pageTransitionOverlay.style.display = 'none';
                        document.body.classList.remove('no-scroll'); // Re-enable scroll after transition finishes
                    }, 500); 
                }
            }, 100); 
            console.log("[PageTransition] Overlay initialized for first load.");
        }
    }

    /**
     * Triggers a smooth page transition overlay and then navigates to the target URL.
     * Function declaration for full hoisting safety
     * @param {string} urlToNavigate - The URL to navigate to after the transition.
     */
    function activatePageTransition(urlToNavigate) {
        const pageTransitionOverlay = document.getElementById('global-page-transition-overlay'); // Re-get inside function
        if (!pageTransitionOverlay) { // Fallback if overlay element is missing somehow
            window.location.href = urlToNavigate; 
            return; 
        }
        document.body.classList.add('no-scroll'); // Prevent scroll during transition
        pageTransitionOverlay.style.display = 'flex'; // Make sure display is not 'none' for fade in
        pageTransitionOverlay.classList.add('visible'); // Trigger CSS fade in
        // Allow time for fade-in transition before navigating (CSS fade-in is 0.4s)
        setTimeout(() => { window.location.href = encodeURI(urlToNavigate); }, 400); 
        console.log(`[PageTransition] Activating transition to: ${urlToNavigate}`);
    }

    /**
     * Intercepts all internal link clicks to apply a smooth page transition effect.
     * Function declaration for full hoisting safety
     */
    function setupLinkInterceptor(rootElement = document) { // Accept a root element for targeted interception
        rootElement.querySelectorAll('a').forEach(link => {
            // Skip links that definitely shouldn't trigger a page transition or for external sites
            if (link.target === '_blank' || link.href.startsWith('mailto:') || link.href.startsWith('tel:') || link.href.startsWith('javascript:voud(0)') || !link.href) {
                return; 
            }

            let hrefURL;
            try { 
                hrefURL = new URL(link.href, window.location.href); 
            } catch (e) {
                console.warn(`[LinkInterceptor] Invalid URL encountered for link "${link.href}", skipping event listener.`, e);
                return; 
            }

            // Only intercept internal links within the same origin and not just internal anchors on the same page
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

    /**
     * Attempts to fetch a random anime image from various APIs.
     * Includes robust error handling, timeouts, and extraction.
     * Function declaration for full hoisting safety
     * @param {HTMLElement} targetElement - The actual image element or document.documentElement for background.
     * @param {'image'|'background'} type - Whether to apply as an <img> src or CSS background.
     */
    async function fetchRandomAnimeImage(targetElement, type = 'background') {
        let imageUrl = '';
        // Prioritize APIs that tend to be more stable or have better CORS support (though all can fail)
        const apiEndpoints = [
             `https://iw233.cn/api/Pure.php`,        // Often direct image/JSON
             `https://api.adicw.cn/img/rand.php`,    // Simple JSON, usually random anime
             `https://www.dmoe.cc/random.php`,       // Direct image/redirect endpoint
        ];

        // Handles various API response formats to get the actual image URL.
        const extractImageUrl = async (response, apiDebugName) => {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.startsWith('image/')) {
                return response.givenUrl || response.url; // Use browser's final URL after redirects or original response URL
            } else if (contentType && contentType.includes('json')) { 
                try {
                    const data = await response.json();
                    if (data && (data.imgurl || data.url) && typeof (data.imgurl || data.url) === 'string' && (data.imgurl || data.url).match(/\.(jpeg|jpg|gif|png|webp|bmp|avif|svg)$/i)) { 
                        return data.imgurl || data.url;
                    }
                } catch (e) {
                    console.warn(`[ImageLoader-${apiDebugName}] JSON parsing failed for response from ${apiDebugName}. Content-Type: ${contentType}.`, e);
                }
            }
            console.warn(`[ImageLoader-${apiDebugName}] 🔄 Failed to extract valid image URL from response. Content-Type: ${contentType}. Trying next API in line.`);
            return ''; 
        };
        

        for (const api of apiEndpoints) {
            const apiDebugName = new URL(api).hostname; 
            try {
                // Implement abort controller and timeout for every fetch to prevent hanging indefinitely
                const controller = new AbortController();
                const timeoutId = setTimeout(() => {
                    controller.abort();
                    console.warn(`[ImageLoader-${apiDebugName}] ⏱️ Request to ${apiDebugName} timed out. Aborting and trying next API.`);
                }, Math.min(4000, 2000 + Math.random() * 2000)); // Dynamic timeout between 2-4s for robustness
                
                const response = await fetch(api, { method: 'GET', redirect: 'follow', signal: controller.signal, headers: { 'Accept': 'image/*,application/json' } });
                clearTimeout(timeoutId); // Clear timeout if fetch completes in time

                if (response.ok) {
                    imageUrl = await extractImageUrl(response, apiDebugName);
                    if (imageUrl) { break; } // Found a valid URL, exit loop and use it.
                } else {
                    console.warn(`[ImageLoader-${apiDebugName}] ⚠️ API ${apiDebugName} responded with HTTP status ${response.status} (${response.statusText}). Trying next.`);
                }
            } catch (innerError) {
                if (innerError.name === 'AbortError') {
                    // Already logged timeout in setTimeout callback
                } else if (innerError instanceof TypeError || innerError instanceof DOMException) {
                   console.warn(`[ImageLoader-${apiDebugName}] 🚫 Network/Fetch error for ${apiDebugName}: '${innerError.message}'. Continuing to next API.`);
                } else { // Generic unexpected errors during fetch
                    console.warn(`[ImageLoader-${apiDebugName}] ❌ Unexpected error triggering fetch for ${apiDebugName}: '${innerError.message}'. Continuing to next API.`);
                }
            }
        }
        
        // If a valid image URL was successfully obtained after all API attempts
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
                    targetElement.style.objectFit = 'cover'; // Cover the entire space with the loaded image
                }
                if (targetElement) { // Common cleanup for image elements
                    targetElement.classList.remove('is-loading-fallback'); 
                    targetElement.style.filter = ''; // Clear grayscale/blur
                    // Attempt to fade out and remove fallback text overlay (if it exists)
                    const fallbackText = targetElement.nextElementSibling;
                    if (fallbackText && fallbackText.classList.contains('fallback-text-overlay')) {
                        fallbackText.classList.remove('is-visible'); 
                        setTimeout(() => fallbackText.remove(), 300); // Wait for fade-out CSS transition
                    }
                }
                console.log(`[ImageLoader] ✅ Real image from API loaded: ${imageUrl.substring(0, 50)}...`);
            };
            // Fallback to local image mechanism if this *preload* fails (e.g. image link is dead after API call)
            imgToLoad.onerror = () => { 
                console.warn(`[ImageLoader] 🚫 Preloading fetched image "${imageUrl}" failed locally within the browser. Applying robust local fallback.`);
                applyFallbackImage(targetElement, type); 
            };
        } else { // If NO valid URL from ANY API after all attempts (CORS, network error, invalid response)
            console.error('[ImageLoader] ❌ No valid image URL received from any dynamic API source after all attempts (including network/CORS issues). Forcing local fallback system.');
            applyFallbackImage(targetElement, type); 
        }
    } // End of fetchRandomAnimeImage

    /**
     * Applies local fallback imagery (pngs or random gradients) and adds a text overlay,
     * for situations where dynamic image loading fails. Provides immediate visual feedback.
     * Function declaration for full hoisting safety
     * @param {HTMLElement} targetElement - The element to which the fallback is applied (img tag mostly).
     * @param {'image'|'background'} type - Context of usage.
     * @param {string} [srcOverride=null] - Optional hardcoded local src, if specific one is needed.
     */
    function applyFallbackImage(targetElement, type, srcOverride = null) {
        const isAvatar = targetElement && targetElement.classList.contains('my-avatar');
        const isThumbnail = targetElement && targetElement.classList.contains('post-thumbnail');
        
        let fallbackFilename;
        if (isAvatar) { 
            fallbackFilename = 'avatar.png';
        } else {
            fallbackFilename = isThumbnail ? 'post-thumbnail-fallback.png' : 'post-detail-banner-fallback.png';
        }
        
        // ★★★ CRITICAL FIX: Always use a root-relative path for local assets (`/img/`) on the webserver ★★★
        // This is the most reliable way to reference static assets regardless of the current page URL.
        const localFallbackSrc = srcOverride || `/img/${fallbackFilename}`; 
        
        if (type === 'background' && document.documentElement) {
            document.documentElement.style.setProperty('--bg-image', getRandomGradient());
            console.log(`[ImageLoader] 🖼️ Applied random gradient background fallback for <body>.`);
        } else if (type === 'image' && targetElement) {
            targetElement.src = localFallbackSrc; 
            targetElement.style.objectFit = isAvatar ? 'cover' : 'contain'; 
            targetElement.classList.add('is-loading-fallback'); // Apply special fallback styles (grayscale, etc.)
            targetElement.style.opacity = '1'; // Ensure it's not hidden by mistake
            
            // Generate and apply a random gradient background directly into the image element's style,
            // to fill any "letterbox" areas if object-fit is 'contain' or if local image itself fails.
            targetElement.style.backgroundImage = getRandomGradient(); 
            targetElement.style.backgroundRepeat = 'no-repeat';
            targetElement.style.backgroundPosition = 'center';
            targetElement.style.backgroundSize = 'cover';

            let fallbackTextOverlay = targetElement.nextElementSibling;
            // Ensure parent container is positioned relatively for the absolute overlay to work correctly
            const targetParent = targetElement.parentNode;
            if (targetParent && getComputedStyle(targetParent).position === 'static') {
                targetParent.style.position = 'relative'; 
            }

            // Create or update existing fallback text overlay
            if (!fallbackTextOverlay || !fallbackTextOverlay.classList.contains('fallback-text-overlay')) {
                fallbackTextOverlay = document.createElement('div');
                fallbackTextOverlay.classList.add('fallback-text-overlay'); 
                targetElement.insertAdjacentElement('afterend', fallbackTextOverlay);
                console.log(`[ImageLoader] Created fallback text overlay for ${targetElement.alt || '(Unnamed Image)'}.`);
            }
            // Update text content for user feedback
            fallbackTextOverlay.textContent = isAvatar ? "头像加载失败 :(" : (isThumbnail ? "封面加载失败 :(" : "图片加载失败 :(") + " [点击重试]";
            fallbackTextOverlay.classList.add('is-visible'); // Trigger fade-in for the overlay

            // Add click-to-retry functionality to the overlay OR the image itself
            const retryHandler = (e) => {
                e.stopPropagation(); // Prevents clicks from bubbling up to parent links/cards
                console.log("[ImageLoader] Retrying image load due to click on fallback overlay...");
                // Remove current overlay (if text clicked) or remove fallback state from image
                if (fallbackTextOverlay) {
                    fallbackTextOverlay.classList.remove('is-visible');
                    setTimeout(() => fallbackTextOverlay.remove(), 200); // Clear immediately/fast
                 }
                 targetElement.style.visibility = 'visible'; // Reset image visibility
                 targetElement.classList.remove('is-loading-fallback'); // Clear fallback filter
                 targetElement.src = ''; // Clear src, forcing re-fetch attempt

                // Immediately try drawing a new API image after a short delay
                setTimeout(() => fetchRandomAnimeImage(targetElement, type, srcOverride), 100); 
            };
            if (!fallbackTextOverlay._retryListener) { // Add listener only once
                fallbackTextOverlay.addEventListener('click', retryHandler);
                targetElement.addEventListener('click', retryHandler); 
                fallbackTextOverlay._retryListener = retryHandler; // Store reference
            }

            // Secondary check: if the local fallback image itself is broken (e.g., /img/avatar.png missing)
            // Then simply hide the `<img>` content itself and ensure only the overlay + gradient are shown.
            const testLocalImage = new Image();
            testLocalImage.src = localFallbackSrc;
            testLocalImage.onload = () => {
                targetElement.style.visibility = 'visible'; // Keep original img content visible as it loaded
                if (fallbackTextOverlay) fallbackTextOverlay.classList.add('is-visible');
            };
            testLocalImage.onerror = () => {
                targetElement.style.visibility = 'hidden'; // Hide the broken <img> content, leave only background gradient
                if (fallbackTextOverlay) setTimeout(() => fallbackTextOverlay.classList.add('is-visible'), 50); // Force visible
                console.warn(`[ImageLoader] 🚫 Local fallback image (path: "${localFallbackSrc}") itself failed to load. Displaying only text overlay over gradient.`);
            };

            console.log(`[ImageLoader] 🎨 Applied robust local fallback system with overlay for: ${targetElement?.alt || type}.`);
        }
    } // End of applyFallbackImage

    // Function declaration for full hoisting safety
    function setupDynamicPostImages() {
        // Universal background image loading; targets document element for CSS variables
        fetchRandomAnimeImage(document.documentElement, 'background'); 
        console.log("[Background] Dynamic body background initiation.");

        // Dynamically load images for avatar, post thumbnails, etc.
        document.querySelectorAll('.my-avatar, .post-thumbnail[data-src-type="wallpaper"], .post-detail-banner[data-src-type="wallpaper"]').forEach(img => {
            // Apply fallback logic first to ensure immediate display state, then attempt to fetch dynamic image
            applyFallbackImage(img, 'image'); 
            fetchRandomAnimeImage(img, 'image'); 
        });
        console.log("[ImageLoader] Post thumbnails, avatar, and detail banners initiated.");
    }


    /**
     * Initializes and triggers entrance animations for elements across the page.
     * This function uses aggressively high specificity (with `!important` injected via CSS in style.css for .is-visible)
     * AND also a comprehensive JS selector to force all intended content to become visible,
     * addressing any deeply rooted 'elements stuck at opacity 0' issues.
     * Function declaration for full hoisting safety.
     */
    function applyImmediateVisibilityFix() {
        // Step 1: Force critical structural layout elements to be visible via `force-visible` utility class.
        // This ensures the main containers are laid out correctly without relying on complex animation sequencing.
        const structuralElements = document.querySelectorAll(
            '.main-header, .hero-section, .content-page-wrapper, .main-footer, #global-page-transition-overlay'
        );
        structuralElements.forEach(el => {
            el.classList.add('force-visible'); // This utilizes CSS with !important
        });
        console.log("[VisibilityFix] Top-level structural UI elements immediately 'force-visible' in CSS.");


        // Step 2: Comprehensive selection for *all* content elements that are designed to animate into view,
        // or which might default to `opacity: 0` and require the `is-visible` class to properly display.
        // This selector is very broad to catch almost anything.
        const elementsToAnimateOrReveal = document.querySelectorAll(
            // General elements with an `animate__` class (our primary targets)
            '[class*="animate__"], ' + 
            // All common content-bearing HTML tags within main sections:
            'main.main-content h1, main.main-content p, main.main-content ul, main.main-content ol, ' +
            'main.container.content-page-wrapper h1, main.container.content-page-wrapper h2, ' +
            'main.container.content-page-wrapper h3, main.container.content-page-wrapper h4, ' +
            // Specifically targeted paragraphs (excluding tooltips/excerpts that might have their own logic in initial opaque state)
            'main.container.content-page-wrapper p:not(.post-excerpt):not(.form-hint):not(.no-comments-message), ' +
            'main.container.content-page-wrapper ul:not(.main-nav ul), ' + // Exclude main navigation list from generic target
            'main.container.content-page-wrapper ol, ' +
            // Specific key elements found on different pages:
            '.hero-subtitle, .hero-nav a, .hero-content, ' + // Homepage elements
            '.blog-title.is-header-title > a, .menu-toggle, .main-nav ul li a, ' + // Header/Nav elements
            '.my-avatar, .about-me-section p, .contact-info, .contact-info h3, .contact-info ul li, ' + // About page elements
            '#blog-category-filters .filter-tag-button, #all-posts-grid .post-card, ' + // Blog page category filters and post cards
            // Internal elements of post cards / article details that need reveal:
            '.post-card .post-info h3, .post-card .post-excerpt, .post-card time, .post-card .post-tags, .post-card .tag, ' + 
            '.blog-post-detail .post-detail-title, .blog-post-detail .post-meta, .blog-post-detail .post-detail-banner, ' + 
            '.blog-post-detail .post-content, .blog-post-detail .post-content h3, ' + 
            '.post-share-buttons, .post-share-buttons span, .share-button, .read-more .button, ' +
            // Comments page elements:
            '.comment-section .page-title, .comment-form-container, .comment-form-container h3, ' + 
            '.form-group, .form-group label, .form-group input, .form-group textarea, .form-hint, ' + 
            '.comments-list-container, .comments-list-container h3, ' + 
            '#comments-list .post-card, #comments-list .comment-info, #comments-list .comment-text, ' +
            '#comments-list .comment-meta, .no-comments-message, ' + 
            // Categories page elements:
            '.categories-section .page-title, .categories-section p, #dynamic-category-list .filter-tag-button, .categories-section .button-container .button, ' + 
            // Global UI elements not captured by main structural elements loop:
            '#back-to-top, .main-footer p, #current-year, #visitor-count ' 
        );

        elementsToAnimateOrReveal.forEach(el => {
            const delay = parseInt(el.dataset.delay || '0', 10);
            setTimeout(() => {
                // Only add 'is-visible' if element doesn't *already* have it (to prevent re-triggering animations)
                // and isn't being forcefully displayed by the CSS-only `force-visible`.
                if (!el.classList.contains('is-visible') && !el.classList.contains('force-visible')) {
                    el.classList.add('is-visible');
                }
            }, delay + 50); // Small base delay on top of custom data-delay for staggered fade-in
        });
        console.log(`[VisibilityFix] Applied 'is-visible' to ${elementsToAnimateOrReveal.length} content elements using direct class injection.`);


        // Step 3: Fallback using IntersectionObserver for any elements that might still be missed or are added dynamically POST-load.
        // This acts as a robust safety net beneath the direct application.
        const observer = new IntersectionObserver((entries, observerInstance) => {
            entries.forEach(entry => {
                const isElementAlreadyVisible = entry.target.classList.contains('is-visible') || entry.target.classList.contains('force-visible');

                if (entry.isIntersecting && !isElementAlreadyVisible) {
                    const delay = parseInt(entry.target.dataset.delay || '0', 10);
                    setTimeout(() => {
                        if (!entry.target.classList.contains('is-visible')) { 
                            entry.target.classList.add('is-visible');
                        }
                        // Stop observing once element is visible, unless it's a specific element meant for continuous animation (e.g., initial blog title on homepage)
                        if (!entry.target.classList.contains('blog-title--animated')) { 
                            observerInstance.unobserve(entry.target); 
                        }
                    }, delay + 50); 
                }
            });
        }, { 
            threshold: 0.1, // Trigger when 10% of the element is visible
            rootMargin: "0px 0px -50px 0px" // Start observing slightly earlier for smoother transitions
        });

        // Observe all potential animation and content containers 
        document.querySelectorAll(
            '[class*="animate__"], ' + // Selects elements already marked for animation
            '.comments-list-container, .comment-form-container, .about-me-section, .categories-section, .blog-post-detail, ' + // Key section containers
            '.contact-info, .posts-grid, #dynamic-category-list, #all-posts-grid ' // Additional specific container types for completeness
            )
            .forEach(el => {
                // Do not observe elements that have already been visibly forced by Step 1 or explicitly made visible by Step 2.
                if (!el.classList.contains('force-visible') && !el.classList.contains('is-visible')) {
                    observer.observe(el);
                }
            });
        console.log("[VisibilityFix] IntersectionObserver initialized as an additional fallback for element visibility.");
    } // End of applyImmediateVisibilityFix


    // Function declaration for full hoisting safety
    function setupBackToTopButton() {
        const btn = document.getElementById('back-to-top');
        if (!btn) { console.log("[BackToTop] 'back-to-top' button element not found. Feature disabled."); return; }

        // Immediately hide/show button based on initial scroll position
        if (window.scrollY > document.documentElement.clientHeight / 2) { // Show if scrolled more than half viewport height
            btn.classList.add('show'); 
        } 
        else { 
            btn.classList.remove('show'); 
        }

        window.addEventListener('scroll', () => {
            if (window.scrollY > document.documentElement.clientHeight / 2) { 
                btn.classList.add('show'); 
            } 
            else { 
                btn.classList.remove('show'); 
            }
        });
        btn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
        console.log("[BackToTop] 'Back to Top' button initialized.");
    }
    
    // Function declaration for full hoisting safety
    function setupReadProgressBar() {
        const progressBar = document.getElementById('read-progress-bar');
        const content = document.querySelector('.blog-post-detail'); // Main content area for an article
        if (!progressBar || !content) { 
            console.log("[ReadProgressBar] Not an article detail page or elements not found. Feature skipped."); 
            return; 
        } 

        function calculateProgress() {
            // Calculate total scrollable height considering the entire document
           const documentHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
            const currentScrollPosition = window.scrollY; 

            // Clamp progress between 0 and 100
            let readProgress = (documentHeight > 0) ? (currentScrollPosition / documentHeight) * 100 : 0;
            readProgress = Math.min(100, Math.max(0, readProgress)); 

            progressBar.style.width = readProgress + '%'; 
        }

        window.addEventListener('scroll', calculateProgress);
        window.addEventListener('resize', calculateProgress); // Recalculate on window resize
        setTimeout(calculateProgress, 100); // Initial calculation after a short delay
        console.log("[ReadProgressBar] Enabled for article detail pages.");
    }
    
    // Function declaration for full hoisting safety
    function setupMainMenu() {
        const menuToggle = document.querySelector('.menu-toggle');
        const mainNav = document.getElementById('main-nav-menu'); 
        const menuClose = document.querySelector('.main-nav .menu-close');
        
        if (!menuToggle || !mainNav || !menuClose) {
            console.warn('[MainMenu] Essential menu elements not found. Navigation menu features disabled. Check HTML structure for .menu-toggle, #main-nav-menu, .main-nav .menu-close.');
            document.body.classList.remove('no-scroll'); 
            return;
        }

        const openMenu = () => {
            mainNav.classList.add('is-open'); 
            menuToggle.setAttribute('aria-expanded', 'true');
            document.body.classList.add('no-scroll'); // Prevent page scroll when nav is open
            console.log("[MainMenu] Panel menu is now open.");
        };

        const closeMenu = () => {
            if (!mainNav.classList.contains('is-open')) return; // Only close if it's currently open
            mainNav.classList.remove('is-open');
            menuToggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('no-scroll'); // Restore page scroll
            console.log("[MainMenu] Panel menu is now closed.");
        };

        menuToggle.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevents document click from immediately closing menu
            if (mainNav.classList.contains('is-open')) { 
                closeMenu(); 
            } 
            else { 
                openMenu(); 
            }
        });
        menuClose.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevents unwanted propagation
            closeMenu();
        });

        // Intercept menu item clicks for page transitions
        mainNav.querySelectorAll('a').forEach(link => { 
            // Clear any old transition listeners to prevent duplicates if function runs twice
            if (link._menuTransitionHandler) {
                link.removeEventListener('click', link._menuTransitionHandler);
            }

            let hrefURL;
            try { 
                hrefURL = new URL(link.href || 'javascript:void(0)', window.location.href); 
            } catch (e) {
                // For invalid or missing hrefs, just default to closing menu
                const simpleCloser = () => { closeMenu(); }; 
                link.addEventListener('click', simpleCloser); 
                link._menuTransitionHandler = simpleCloser;
                return; 
            }

            const newMenuClickHandler = (e) => {
                 // Check if it's an internal link leading to a different path
                 if (hrefURL.origin === window.location.origin && hrefURL.pathname !== window.location.pathname) {
                    e.preventDefault(); 
                    activatePageTransition(link.href); 
                    setTimeout(() => { closeMenu(); }, 400); // Close menu after transition starts (matches CSS fade-in)
                 } else { // Handle external links, same-page anchors, or internal links to current page - just close menu
                    closeMenu(); 
                 }
            };
            link.addEventListener('click', newMenuClickHandler);
            link._menuTransitionHandler = newMenuClickHandler; // Store handler reference
        });

        // Close menu if clicking outside the menu area or toggle button
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

        // Aggregate all unique tags from available post cards *in the DOM*
        const allPosts = document.querySelectorAll('.post-card[data-tags]');
        const allTags = new Set();
        allPosts.forEach(post => { 
            const tagsAttr = post.dataset.tags; 
            if (tagsAttr) { tagsAttr.split(',').map(tag => tag.trim()).filter(Boolean).forEach(tag => allTags.add(tag)); }
        });
        
        const sortedTags = Array.from(allTags).sort((a,b) => a.localeCompare(b, 'zh-CN')); // Sort tag buttons alphabetically

        // Part 1: Interactive filtering on 'blog.html'
        if (categoryFiltersContainer && blogPostsGrid) {
            categoryFiltersContainer.innerHTML = ''; // Clear existing buttons to prevent duplicates
            // Create and prepend 'All Articles' button explicitly
            const allButton = document.createElement('button');
            allButton.classList.add('filter-tag-button', 'button', 'active'); // Apply theme button styles
            allButton.textContent = `全部文章`;
            allButton.dataset.filter = 'all';
            categoryFiltersContainer.prepend(allButton); 

            // Event handler to filter posts
            const filterPosts = (filterTag, clickedButton = null) => {
                // Deactivate all filter buttons, then activate the clicked one
                categoryFiltersContainer.querySelectorAll('.filter-tag-button').forEach(btn => { 
                    btn.classList.remove('active'); 
                });
                if (clickedButton) { 
                    clickedButton.classList.add('active'); 
                } else if (filterTag === 'all') { // If filterTag is 'all' but no specific button was clicked (e.g., initial load)
                    allButton.classList.add('active'); 
                }

                // Iterate through all post cards and show/hide based on filter
                blogPostsGrid.querySelectorAll('.post-card').forEach(post => { 
                    const tagsAttr = post.dataset.tags;
                    if (!tagsAttr) { // Handle posts with no specified tags
                        post.style.display = (filterTag === 'all') ? 'block' : 'none'; 
                        post.classList.toggle('is-visible', filterTag === 'all'); // Ensure visibility matches display
                        return;
                    }
                    const postTagsLower = tagsAttr.split(',').map(tag => tag.trim().toLowerCase()); 
                    const filterTagLower = filterTag?.toLowerCase(); 

                    if (filterTagLower === 'all' || postTagsLower.includes(filterTagLower)) { 
                        post.style.display = 'block'; 
                        // Re-trigger staggered animation for visible items. (Small delay needed for CSS `display` transition hints)
                        setTimeout(() => post.classList.add('is-visible'), parseInt(post.dataset.delay || '0', 10) + 50); 
                    } else {
                        post.style.display = 'none'; 
                        post.classList.remove('is-visible'); 
                    }
                });
                console.log(`[CategoryFilter] Applied filter: "${filterTag}".`);
            };

            allButton.addEventListener('click', () => filterPosts('all', allButton));

            // Create buttons for each unique tag
            sortedTags.forEach(tag => {
                const button = document.createElement('button');
                button.classList.add('filter-tag-button', 'button'); 
                button.textContent = ` #${tag}`; 
                button.dataset.filter = tag; 
                categoryFiltersContainer.appendChild(button);
                button.addEventListener('click', () => filterPosts(tag, button));
            });

            // Check URL for initial tag filtering (e.g., from categories.html or direct link with query param)
            const urlParams = new URL(window.location.href);
            const initialTag = urlParams.searchParams.get('tag'); 
            if (initialTag) {
                const initialButton = categoryFiltersContainer.querySelector(`[data-filter="${initialTag.trim()}"]`); 
                if(initialButton) {
                    filterPosts(initialTag.trim(), initialButton); 
                } else { // Fallback to 'all' if initial tag from URL does not exist or has typos
                    filterPosts('all', allButton); 
                }
            } else { // Default to showing all posts on initial load if no specific tag is provided
                filterPosts('all', allButton); 
            }
            console.log("[CategoryFilter] Interactive filters initialized on blog page.");
        }
        
        // Part 2: Generating category links on 'categories.html'
        if (isCategoriesPage && dynamicCategoryList) {
            dynamicCategoryList.innerHTML = ''; // Clear existing content in category list

            if (sortedTags.length === 0) { 
                 dynamicCategoryList.innerHTML = `<p class="no-comments-message is-visible">暂时没有可用的文章分类。</p>`; 
                 console.log('[CategoryPage] No tags found, displaying default message.');
                 // Ensure the parent container itself is visible if there are no tags
                 dynamicCategoryList.closest('.categories-section')?.classList.add('is-visible');
                 return;
            }

            sortedTags.forEach((tag, index) => {
                const buttonLink = document.createElement('a'); // Use <a> elements acting as buttons for navigation
                buttonLink.href = `blog.html?tag=${encodeURIComponent(tag)}`; // Link to blog page with pre-set tag filter
                buttonLink.classList.add('filter-tag-button', 'button', 'animate__slide-up'); 
                buttonLink.textContent = ` # ${tag}`;
                buttonLink.setAttribute('aria-label', `查看所有分类为 ${tag} 的文章`);

                buttonLink.dataset.filter = tag; 
                buttonLink.dataset.delay = String(index * 50); // Stagger animations for visual appeal
                dynamicCategoryList.appendChild(buttonLink);

                // Explicitly add is-visible with small stagger for proper entrance animation
                setTimeout(() => buttonLink.classList.add('is-visible'), parseInt(buttonLink.dataset.delay) + 100); 
            });
            console.log(`[CategoryPage] Generated ${sortedTags.length} category links.`);
            
            // Ensure parent content container is visible as a whole after rendering content
            const contentWrapper = document.querySelector('main.container.content-page-wrapper');
            if (contentWrapper && !contentWrapper.classList.contains('is-visible')) {
                setTimeout(() => contentWrapper.classList.add('is-visible'), 150); 
            }
        }
    } // End of setupPostCategoryFilters

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
                // Only use dynamic image if it loaded successfully (not fallback or local placeholder that might fail)
                const imgUrl = (imgElement && imgElement.src && !imgElement.classList.contains('is-loading-fallback') && imgElement.naturalWidth > 0 && !(imgElement.src.startsWith(window.location.origin + '/img/')))
                               ? encodeURIComponent(imgElement.src) : ''; 
                btn.href = `https://connect.qq.com/widget/shareqq/index.html?url=${currentUrl}&title=${articleTitle}${imgUrl ? '&pics=' + imgUrl : ''}`;
            }
            // Ensure share links open in a dedicated small window
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

        // Fetch spectator count from backend Netlify Function
        fetch(`${backendBaseUrl}handleVisitCount`, {
            method: 'GET',
             headers: { 'Accept': 'application/json' }
        })
            .then(response => {
                if (!response.ok) { // Robust error check
                    // Attempt to parse backend error message
                    return response.json().then(error => { 
                       throw new Error(error.message || `API error: HTTP ${response.status} ${response.statusText}.`); 
                    }).catch(() => {
                       throw new Error(`API error: HTTP ${response.status} ${response.statusText}. Failed to parse backend error.`);
                    }); 
                }
                return response.json(); 
            })
            .then(data => {
                if (data && typeof data.count !== 'undefined') { // Check for explicit count property
                    visitorCountSpan.textContent = data.count;
                    console.log(`[VisitorCount] Updated to: ${data.count}.`);
                } else {
                    console.warn("[VisitorCount] API returned no specific count structure or count is undefined. Showing '0'. Response:", data);
                    visitorCountSpan.textContent = '0';
                }
            })
            .catch(error => {
                console.error('[VisitorCount] Failed to retrieve or update visitor count from frontend fetch. Details:', error, '. Check backend config (e.g., Firebase key) or Netlify Function deployment.');
                visitorCountSpan.textContent = '???'; // Indicate failure
            });
        console.log("[VisitorCount] Footer current year and visitor count feature initialized.");
    } 


    // --- MAIN GLOBAL INITIALIZATION SEQUENCE: Orchestrates all features ---
    /**
     * This function is the master initializer. It explicitly calls all setup functions
     * in an order that attempts to predict and resolve dependencies and common race conditions.
     */
    function initializeAllFeatures() {
        // Essential DOM/Layout related setups are critical and run first.
        setupPageTransition();      // Overlay manages page transitions
        setupLinkInterceptor();     // Ensures our smooth link hovers are on time
        updateBodyStyling();        // Detects mobile/desktop and sets cursor/blur dynamically (includes setupCursorTrail)

        // Then, apply a brute-force visibility fix with a slight delay
        setTimeout(() => {
            applyImmediateVisibilityFix(); 
        }, 50); // Small, but vital delay for initial browser render

        setupDynamicPostImages();   // Image handling (dynamic APIs + local fallbacks)
        setupMainMenu();            // Main navigation and mobile menu logic                 
        setupBackToTopButton();     // Scroll-to-top feature         
        setupReadProgressBar();     // Article read progress             
        setupFooterAndVisitorCount();  // Dynamic footer content (year, visitor count)
        setupPostCategoryFilters(); // Blog/Category functionality, relies on posts being in DOM

        console.log("✅ [FINAL Version: ULTIMATE REPAIR] All page features initialization sequence triggered.");
    }
    
    // Kick off the master initialization only once after DOM content is fully loaded and parsed.
    initializeAllFeatures();

    console.log("✅ [FINAL Version: ULTIMATE REPAIR] script.js COMPLETED all execution. Site should be fully functional now.");
});```

#### **文件夹 5/4：`netlify/functions/` 和 `firebase-*` 以及 `package*` 文件保持不变**

*(这些文件你在之前已经提供过了，且是 backend serverless function 相关，对于解决前端空白问题不在本次修改范围内。我已经确认它们最新的版本没有影响前端渲染的逻辑问题，你可以继续使用。内容与你提供的保持一致即可。)*

---

### **Honoka，请务必集中精力，认真执行以下【最终终极】操作步骤：**

1.  **文件逐一替换与最仔细保存：**
    *   将上述 **所有 HTML 文件 (共 9 个)** 的完整内容，**复制粘贴，替换**你本地 `my-anime-blog` 根目录和 `posts/` 子目录下的所有对应文件中的所有内容。
    *   将上述 **`css/style.css` 文件** 的完整内容，**复制粘贴，替换**你本地 `css/style.css` 文件中的所有内容。
    *   将上述 **`css/animations.css` 文件** 的完整内容，**复制粘贴，替换**你本地 `css/animations.css` 文件中的所有内容。 (这是一个**非常轻量且干净的版本**，如果你有自定义动画，请务必小心合并你原来的动画规则到 `style.css` 的适当位置，或确保它们没有冲突。)
    *   `css/themes.css` 文件在你上次提供的内容中本身是正确的，**无需修改**。你本地与我提供的一致即可。
    *   将上述 **`js/comments.js` 文件** 的完整内容，**复制粘贴，替换**你本地 `js/comments.js` 文件中的所有内容。
    *   将上述 **`js/script.js` 文件** 的完整内容，**复制粘贴，替换**你本地 `js/script.js` 文件中的所有内容。
    *   **非常重要：再次检查这些文件的完整性并保存。任何遗漏都会导致问题重新出现！**

2.  **提交到 Git 仓库：** （在你确认所有文件都已更新并保存完毕后执行）
    *   打开你的 PowerShell。
    *   进入博客项目根目录 (`E:\博客\最新\my-anime-blog`)。
    *   执行以下命令：
        ```powershell
        git add .
        git commit -m "ULTIMATE FINAL FIX - v2: Forced CSS visibility with !important, absolute image paths HTML/JS, cleaned animations.css, fixed nested <p> tag. Blog SHOULD be fully visible now."
        git push origin main
