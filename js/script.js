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
    // This value is used by frontend to fetch Netlify Functions from the same domain.
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
            if (link.target === '_blank' || link.href.startsWith('mailto:') || link.href.startsWith('tel:') || link.href.startsWith('javascript:void(0)') || !link.href) {
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
                console.log("[ImageLoader] Retrying image load due to click on fallback overlay or image itself...");
                // Remove current overlay (if text clicked) or remove fallback state from image
                if (fallbackTextOverlay) { // Fades out then removes
                    fallbackTextOverlay.classList.remove('is-visible');
                    setTimeout(() => fallbackTextOverlay.remove(), 200); 
                 }
                // Reset image's visual state to prevent artifacts from previous failed load before re-attempt
                targetElement.style.visibility = 'visible'; 
                targetElement.classList.remove('is-loading-fallback'); 
                targetElement.src = ''; // Clear src to force a fresh re-fetch attempt

                // Immediately try drawing a new API image after a short delay to allow DOM render refresh
                setTimeout(() => fetchRandomAnimeImage(targetElement, type, srcOverride), 100); 
            };
            // Attach retry listener to both the image and the overlay for a larger hit area
            if (!fallbackTextOverlay._retryListener) { // Ensure listener is only added once
                fallbackTextOverlay.addEventListener('click', retryHandler);
                targetElement.addEventListener('click', retryHandler); 
                fallbackTextOverlay._retryListener = retryHandler; // Store reference for cleanup if needed in future
            }

            // Secondary check: if the local fallback image itself is broken (e.g., /img/avatar.png missing or corrupted)
            // In this cascade failure, we simply hide the `<img>` content itself and ensure only the overlay + gradient are shown.
            const testLocalImage = new Image();
            testLocalImage.src = localFallbackSrc;
            testLocalImage.onload = () => { // If local fallback image loads, show the `<img>` again
                targetElement.style.visibility = 'visible'; 
                if (fallbackTextOverlay) fallbackTextOverlay.classList.add('is-visible');
            };
            testLocalImage.onerror = () => { // If local fallback image 404s/fails, hide `<img>` completely
                targetElement.style.visibility = 'hidden'; 
                if (fallbackTextOverlay) setTimeout(() => fallbackTextOverlay.classList.add('is-visible'), 50); // Ensure overlay takes over
                console.warn(`[ImageLoader] 🚫 Local fallback image (path: "${localFallbackSrc}") itself failed to load. Displaying only text overlay over generated gradient.`);
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
        // Queries all elements that are either `.my-avatar` or have `data-src-type="wallpaper"` (for thumbs/banners)
        document.querySelectorAll('.my-avatar, .post-thumbnail[data-src-type="wallpaper"], .post-detail-banner[data-src-type="wallpaper"]').forEach(img => {
            // Apply fallback logic first to ensure immediate display state, then attempt to fetch dynamic image
            applyFallbackImage(img, 'image'); 
            fetchRandomAnimeImage(img, 'image'); // Try to fetch a new dynamic image
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
        // This selector is very broad to catch almost anything that visually holds content.
        const elementsToAnimateOrReveal = document.querySelectorAll(
            // General elements marked with an `animate__` class (our primary targets for animation)
            '[class*="animate__"], ' + 
            // All common content-bearing HTML tags within main sections and their wrappers:
            'main.main-content h1, main.main-content p, main.main-content ul, main.main-content ol, ' +
            'main.container.content-page-wrapper h1, main.container.content-page-wrapper h2, ' +
            'main.container.content-page-wrapper h3, main.container.content-page-wrapper h4, ' +
            // Specifically targeted paragraphs (excluding tooltips/excerpts that might have their own specific display logic, e.g., initially opaque)
            'main.container.content-page-wrapper p:not(.post-excerpt):not(.form-hint):not(.no-comments-message), ' +
            'main.container.content-page-wrapper ul:not(.main-nav ul), ' + // Exclude the main navigation list from generic target to prevent conflicts
            'main.container.content-page-wrapper ol, ' +
            // Also explicitly target individual list items if they might be hidden independently
            'main.container.content-page-wrapper ul li, main.container.content-page-wrapper ol li, ' +
            // Specific key elements found on different pages that must always reveal:
            '.hero-subtitle, .hero-nav a, .hero-content, ' + // Homepage specific elements like slogan, nav links, and the hero content block itself
            '.blog-title.is-header-title > a, .menu-toggle, .main-nav ul li a, ' + // Header/Navigation elements, including the menu toggle and individual nav items
            '.my-avatar, .about-me-section p, .contact-info, .contact-info h3, .contact-info ul li, ' + // About page elements (avatar, paragraphs, contact box, and its internal elements)
            '#blog-category-filters .filter-tag-button, #all-posts-grid .post-card, ' + // Blog page category filters and individual post cards
            // Internal elements of post cards and article details that typically animate or need forced reveal:
            '.post-card .post-info h3, .post-card .post-excerpt, .post-card time, .post-card .post-tags, .post-card .tag, ' + 
            '.blog-post-detail .post-detail-title, .blog-post-detail .post-meta, .blog-post-detail .post-detail-banner, ' + 
            '.blog-post-detail .post-content, .blog-post-detail .post-content h3, ' + 
               // Footer navigation & other elements
            '.post-share-buttons, .post-share-buttons span, .share-button, .read-more .button, ' +
            // Comments page elements, including the entire container, form, and individual comments/messages:
            '.comment-section .page-title, .comment-form-container, .comment-form-container h3, ' + 
            // Form-specific elements like labels, inputs, textareas, and helper hints
            '.form-group, .form-group label, .form-group input, .form-group textarea, .form-hint, ' + 
            '.comments-list-container, .comments-list-container h3, ' + 
            '#comments-list .post-card, #comments-list .comment-info, #comments-list .comment-text, ' +
            '#comments-list .comment-meta, .no-comments-message, ' + 
            // Categories page elements:
            '.categories-section .page-title, .categories-section p, #dynamic-category-list .filter-tag-button, .categories-section .button-container .button, ' + 
            // Global utility UI elements generally found at the bottom or corners of the page:
            '#back-to-top, .main-footer p, #current-year, #visitor-count ' 
        );

        elementsToAnimateOrReveal.forEach(el => {
            const delay = parseInt(el.dataset.delay || '0', 10);
            setTimeout(() => {
                // Only add 'is-visible' if element doesn't *already* have it (to prevent re-triggering animations prematurely)
                // and isn't being forcefully displayed by the CSS-only `force-visible` utility class.
                if (!el.classList.contains('is-visible') && !el.classList.contains('force-visible')) {
                    el.classList.add('is-visible');
                }
            }, delay + 50); // A small, consistent base delay on top of data-delay for staggered fade-in effect
        });
        console.log(`[VisibilityFix] Applied 'is-visible' to ${elementsToAnimateOrReveal.length} content elements using direct class injection.`);


        // Step 3: Fallback using IntersectionObserver for any elements that might still be missed by direct selection 
        // or are loaded/injected dynamically POST-initial-load. This acts as an additional robust safety net.
        const observer = new IntersectionObserver((entries, observerInstance) => {
            entries.forEach(entry => {
                const isElementAlreadyVisible = entry.target.classList.contains('is-visible') || entry.target.classList.contains('force-visible');

                if (entry.isIntersecting && !isElementAlreadyVisible) {
                    const delay = parseInt(entry.target.dataset.delay || '0', 10);
                    // Add 'is-visible' after small delay to allow for staged animations.
                    setTimeout(() => {
                        if (!entry.target.classList.contains('is-visible')) { // Double-check before adding
                            entry.target.classList.add('is-visible');
                        }
                        // Stop observing once the element is visible, unless it's a specific element designed for continuous animation (e.g., the rotating blog title on the homepage)
                        if (!entry.target.classList.contains('blog-title--animated')) { 
                            observerInstance.unobserve(entry.target); // Optimize: stop observing static elements
                        }
                    }, delay + 50); 
                }
            });
        }, { 
            threshold: 0.1, // Trigger when 10% of the element is visible in the viewport
            rootMargin: "0px 0px -50px 0px" // Start observing slightly earlier for smoother transitions (e.g., when 50px towards the bottom edge)
        });

        // Apply the IntersectionObserver to all potential animation and content containers.
        // This is a broad selection to ensure dynamic elements or those missed by direct injection are eventually covered.
        document.querySelectorAll(
            '[class*="animate__"], ' + // Elements explicitly marked for animation (e.g., fade-in, slide-up)
            // Major content containers for various pages:
            '.comments-list-container, .comment-form-container, .about-me-section, .categories-section, .blog-post-detail, ' + 
            // Additional specific container types for completeness and robustness:
            '.contact-info, .posts-grid, #dynamic-category-list, #all-posts-grid ' 
            )
            .forEach(el => {
                // Ensure we don't re-observe elements that have already been visibly forced by Step 1 or made visible by Step 2.
                if (!el.classList.contains('force-visible') && !el.classList.contains('is-visible')) {
                    observer.observe(el);
                }
            });
        console.log("[VisibilityFix] IntersectionObserver initialized as an additional self-healing fallback for element visibility.");
    } // End of applyImmediateVisibilityFix


    // Function declaration for full hoisting safety
    function setupBackToTopButton() {
        const btn = document.getElementById('back-to-top');
        if (!btn) { console.log("[BackToTop] 'back-to-top' button element not found. Feature disabled."); return; }

        // Immediately hide/show button based on initial scroll position
        // Show if scrolled down more than half the viewport height.
        if (window.scrollY > document.documentElement.clientHeight / 2) { 
            btn.classList.add('show'); // Apply 'show' class to make it visible
        } 
        else { 
            btn.classList.remove('show'); // Hide it
        }

        // Add scroll event listener to dynamically show/hide the button
        window.addEventListener('scroll', () => {
            if (window.scrollY > document.documentElement.clientHeight / 2) { 
                btn.classList.add('show'); 
            } 
            else { 
                btn.classList.remove('show'); 
            }
        });
        // Add click listener for smooth scroll to top
        btn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
        console.log("[BackToTop] 'Back to Top' button initialized.");
    }
    
    // Function declaration for full hoisting safety
    function setupReadProgressBar() {
        const progressBar = document.getElementById('read-progress-bar');
        const content = document.querySelector('.blog-post-detail'); // Main content area for an article detail page
        if (!progressBar || !content) { 
            console.log("[ReadProgressBar] Not an article detail page or elements not found. Feature skipped."); 
            return; 
        } 

        function calculateProgress() {
            // Calculate the total scrollable height of the document beyond the initial viewport
           const documentHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
            const currentScrollPosition = window.scrollY; 

            // Calculate read progress as a percentage and clamp between 0% and 100%
            let readProgress = (documentHeight > 0) ? (currentScrollPosition / documentHeight) * 100 : 0;
            readProgress = Math.min(100, Math.max(0, readProgress)); // Ensure it's between 0 and 100

            progressBar.style.width = readProgress + '%'; // Apply percentage width to the progress bar
        }

        window.addEventListener('scroll', calculateProgress);
        window.addEventListener('resize', calculateProgress); // Recalculate on window resize to adjust for layout changes
        setTimeout(calculateProgress, 100); // Initial calculation after a short delay to ensure DOM is fully rendered
        console.log("[ReadProgressBar] Enabled for article detail pages.");
    }
    
    // Function declaration for full hoisting safety
    function setupMainMenu() {
        const menuToggle = document.querySelector('.menu-toggle');
        const mainNav = document.getElementById('main-nav-menu'); 
        const menuClose = document.querySelector('.main-nav .menu-close');
        
        if (!menuToggle || !mainNav || !menuClose) {
            console.warn('[MainMenu] Essential menu elements not found. Navigation menu features disabled. Check HTML structure for .menu-toggle, #main-nav-menu, .main-nav .menu-close.');
            document.body.classList.remove('no-scroll'); // Ensure scrolling is restored if menu fails
            return;
        }

        const openMenu = () => {
            mainNav.classList.add('is-open'); // Apply CSS class to open menu
            menuToggle.setAttribute('aria-expanded', 'true'); // Update ARIA attribute for accessibility
            document.body.classList.add('no-scroll'); // Prevent background page scroll when navigation is open
            console.log("[MainMenu] Panel menu is now open.");
        };

        const closeMenu = () => {
            if (!mainNav.classList.contains('is-open')) return; // Only close if it's currently open to avoid redundant operations
            mainNav.classList.remove('is-open');
            menuToggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('no-scroll'); // Restore background page scrolling
            console.log("[MainMenu] Panel menu is now closed.");
        };

        // Toggle menu on button click
        menuToggle.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevents the click from bubbling up to the document body and immediately closing the menu
            if (mainNav.classList.contains('is-open')) { 
                closeMenu(); 
            } 
            else { 
                openMenu(); 
            }
        });
        // Close menu exclusively via the dedicated close button
        menuClose.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent unwanted propagation
            closeMenu();
        });

        // Intercept menu item clicks for page transitions
        mainNav.querySelectorAll('a').forEach(link => { 
            // Clear any old transition listeners first to prevent duplicates if this setup function is called multiple times
            if (link._menuTransitionHandler) {
                link.removeEventListener('click', link._menuTransitionHandler);
            }

            let hrefURL;
            try { 
                hrefURL = new URL(link.href || 'javascript:void(0)', window.location.href); // Safely parse the URL
            } catch (e) {
                // If URL parsing fails (e.g., malformed href), gracefully fallback to just closing the menu
                const simpleCloser = () => { closeMenu(); }; 
                link.addEventListener('click', simpleCloser); 
                link._menuTransitionHandler = simpleCloser; // Store reference
                console.warn(`[MainMenu] Invalid menu link URL "${link.href}", defaulting to menu close on click.`);
                return; 
            }

            // Define the new click handler for menu links
            const newMenuClickHandler = (e) => {
                 // Check if it's an internal link leading to a *different* path (i.e., not just a hash on the current page)
                 if (hrefURL.origin === window.location.origin && hrefURL.pathname !== window.location.pathname) {
                    e.preventDefault(); // Prevent default browser navigation for internal links
                    activatePageTransition(link.href); // Trigger our custom page transition
                    // Close menu swiftly after initiating the page transition
                    setTimeout(() => { closeMenu(); }, 400); // Matches CSS transition duration roughly
                 } else { // For external links, same-page anchors, or internal links to the current page, just close the menu gracefully
                    closeMenu(); 
                 }
            };
            link.addEventListener('click', newMenuClickHandler);
            link._menuTransitionHandler = newMenuClickHandler; // Store handler reference for future removal
        });

        // Close menu if clicking anywhere outside the menu area or the toggle button itself
        document.body.addEventListener('click', (event) => {
            // Check if the click occurred while the menu is open AND was outside both the menu panel AND the menu toggle button
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
        // Retrieve `dynamicCategoryList` potentially created in initial HTML or empty if not present.
        const dynamicCategoryList = document.getElementById('dynamic-category-list'); 

        // Aggregate all unique tags from available post cards *currently in the DOM*
        const allPosts = document.querySelectorAll('.post-card[data-tags]');
        const allTags = new Set(); // Use a Set to automatically store unique tags
        allPosts.forEach(post => { 
            const tagsAttr = post.dataset.tags; 
            if (tagsAttr) { // Ensure there are tags to process
                // Split by comma, trim whitespace, filter out empty strings, and add to the Set
                tagsAttr.split(',').map(tag => tag.trim()).filter(Boolean).forEach(tag => allTags.add(tag)); 
            }
        });
        
        // Convert Set to Array and sort tags alphabetically for consistent display order
        const sortedTags = Array.from(allTags).sort((a,b) => a.localeCompare(b, 'zh-CN')); 

        // Part 1: Interactive filtering on the 'blog.html' page
        if (categoryFiltersContainer && blogPostsGrid) {
            categoryFiltersContainer.innerHTML = ''; // Clear existing buttons to prevent duplicates on re-initialization
            // Create and prepend an 'All Articles' button explicitly
            const allButton = document.createElement('button');
            allButton.classList.add('filter-tag-button', 'button', 'active'); // Apply theme button styles, default to active
            allButton.textContent = `全部文章`;
            allButton.dataset.filter = 'all'; // Custom data attribute for filtering
            categoryFiltersContainer.prepend(allButton); // '全部文章' button first

            // Event handler function to filter posts based on a given tag
            const filterPosts = (filterTag, clickedButton = null) => {
                // Deactivate all filter buttons, then activate the clicked one
                categoryFiltersContainer.querySelectorAll('.filter-tag-button').forEach(btn => { 
                    btn.classList.remove('active'); 
                });
                if (clickedButton) { // If a specific button was clicked, make it active
                    clickedButton.classList.add('active'); 
                } else if (filterTag === 'all') { // If filterTag is 'all' but no specific button explicitly clicked (e.g., initial page load)
                    allButton.classList.add('active'); 
                }

                // Iterate through all post cards within the grid and show/hide based on the filter
                blogPostsGrid.querySelectorAll('.post-card').forEach(post => { 
                    const tagsAttr = post.dataset.tags;
                    if (!tagsAttr) { // Handle posts that legitimately have no specified tags
                        post.style.display = (filterTag === 'all') ? 'block' : 'none'; 
                        post.classList.toggle('is-visible', filterTag === 'all'); // Ensure visibility matches display state
                        return; // Done with this post
                    }
                    // Process post's tags for comparison
                    const postTagsLower = tagsAttr.split(',').map(tag => tag.trim().toLowerCase()); 
                    const filterTagLower = filterTag?.toLowerCase(); // Ensure filter tag is lowercase and safely accessed

                    // Show post if filter is 'all' or if post's tags include the filter tag
                    if (filterTagLower === 'all' || postTagsLower.includes(filterTagLower)) { 
                        post.style.display = 'flex'; // Use flex to maintain card layout
                        // Re-trigger staggered animation for visible items. (Small delay needed for CSS display transitions)
                        setTimeout(() => post.classList.add('is-visible'), parseInt(post.dataset.delay || '0', 10) + 50); 
                    } else {
                        post.style.display = 'none'; // Hide the post
                        post.classList.remove('is-visible'); // Remove visibility class (for animation/transitions)
                    }
                });
                console.log(`[CategoryFilter] Applied filter: "${filterTag}".`);
            };

            // Add event listener for the 'All Articles' button
            allButton.addEventListener('click', () => filterPosts('all', allButton));

            // Create buttons for each unique tag found and attach filtering logic
            sortedTags.forEach(tag => {
                const button = document.createElement('button');
                button.classList.add('filter-tag-button', 'button'); 
                button.textContent = ` #${tag}`; 
                button.dataset.filter = tag; 
                categoryFiltersContainer.appendChild(button);
                button.addEventListener('click', () => filterPosts(tag, button));
            });

            // Check URL for an initial tag query parameter (e.g., from categories.html or a direct blog link)
            const urlParams = new URL(window.location.href);
            const initialTag = urlParams.searchParams.get('tag'); 
            if (initialTag) {
                const initialButton = categoryFiltersContainer.querySelector(`[data-filter="${initialTag.trim()}"]`); 
                if(initialButton) {
                    filterPosts(initialTag.trim(), initialButton); // Apply filter based on URL parameter
                } else { // Fallback to 'all' if the initial tag from URL does not exist or has typos
                    filterPosts('all', allButton); 
                }
            } else { // Default to showing all posts on initial page load if no specific tag is provided
                filterPosts('all', allButton); 
            }
            console.log("[CategoryFilter] Interactive filters initialized on blog page.");
        }
        
        // Part 2: Generating category navigation links on 'categories.html'
        if (isCategoriesPage && dynamicCategoryList) {
            dynamicCategoryList.innerHTML = ''; // Clear existing content in the dynamic category list container

            if (sortedTags.length === 0) { // If no tags found (e.g., no posts or badly structured data)
                 dynamicCategoryList.innerHTML = `<p class="no-comments-message is-visible">暂时没有可用的文章分类。</p>`; 
                 console.log('[CategoryPage] No tags found, displaying default message.');
                 // Ensure the parent container itself is visible, especially if no content generated
                 dynamicCategoryList.closest('.categories-section')?.classList.add('is-visible');
                 return; // No tagsMeans no categories to display.
            }

            // Create an <a> element styled as a button for each unique tag, linking to blog.html with a pre-set tag filter
            sortedTags.forEach((tag, index) => {
                const buttonLink = document.createElement('a'); 
                buttonLink.href = `blog.html?tag=${encodeURIComponent(tag)}`; // Link to blog page with pre-set tag filter
                buttonLink.classList.add('filter-tag-button', 'button', 'animate__slide-up'); // Apply button styling and an animation class
                buttonLink.textContent = ` # ${tag}`; // Display hash and tag name
                buttonLink.setAttribute('aria-label', `查看所有分类为 ${tag} 的文章`); // Accessibility improvement

                buttonLink.dataset.filter = tag; // Store tag name as data attribute
                buttonLink.dataset.delay = String(index * 50); // Set a staggered delay for animations
                dynamicCategoryList.appendChild(buttonLink); // Add to DOM

                // Explicitly apply 'is-visible' class with small stagger for proper entrance animation from base `opacity: 0`
                setTimeout(() => buttonLink.classList.add('is-visible'), parseInt(buttonLink.dataset.delay) + 100); 
            });
            console.log(`[CategoryPage] Generated ${sortedTags.length} category links.`);
            
            // Ensure the main content container for categories is visible once its dynamic content is rendered
            const contentWrapper = document.querySelector('main.container.content-page-wrapper');
            if (contentWrapper && !contentWrapper.classList.contains('is-visible')) {
                setTimeout(() => contentWrapper.classList.add('is-visible'), 150); 
            }
        }
    } // End of setupPostCategoryFilters

    // Function declaration for full hoisting safety
    function setupShareButtons() {
        // Targets specific share buttons for Weibo and QQ
        const shareButtons = document.querySelectorAll('.post-share-buttons a.weibo, .post-share-buttons a.qq');
        if (shareButtons.length === 0) { 
            console.log("[ShareButtons] No share buttons found on this page."); 
            return; 
        } 

        const currentUrl = encodeURIComponent(window.location.href); // URL of the current page for sharing
        const pageTitle = document.title;
        // Extract a clean article title, defaulting to blog name if none found in title
        const articleTitle = encodeURIComponent(pageTitle.split(' - ')[0] || "Honoka的小屋"); 

        shareButtons.forEach(btn => {
            if (btn.classList.contains('weibo')) {
                // Construct Weibo share URL
                btn.href = `https://service.weibo.com/share/share.php?url=${currentUrl}&title=${articleTitle}`;
            } else if (btn.classList.contains('qq')) {
                const imgElement = document.querySelector('.post-detail-banner'); // Get the main article image
                // Only include dynamic image URL in QQ share if it successfully loaded and is not a local fallback.
                const imgUrl = (imgElement && imgElement.src && 
                                !imgElement.classList.contains('is-loading-fallback') && 
                                imgElement.naturalWidth > 0 && 
                                !(imgElement.src.startsWith(window.location.origin + '/img/'))) // Also ensure it's not our local fallback
                               ? encodeURIComponent(imgElement.src) : ''; 
                // Construct QQ share URL with optional image
                btn.href = `https://connect.qq.com/widget/shareqq/index.html?url=${currentUrl}&title=${articleTitle}${imgUrl ? '&pics=' + imgUrl : ''}`;
            }
            // Ensure share links open in a dedicated small pop-up window for better user experience
            btn.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default link navigation
                window.open(btn.href, 'sharewindow', 'height=480,width=640,toolbar=no,menubar=no,scrollbars=yes,resizable=yes');
            });
        });
        console.log("[ShareButtons] Share buttons initialized.");
    } 
    
    // Function declaration for full hoisting safety
    function setupFooterAndVisitorCount() { 
        const currentYearSpan = document.getElementById('current-year');
        if (currentYearSpan) { // Update dynamic year in the footer
            currentYearSpan.textContent = new Date().getFullYear(); 
        }

        const visitorCountSpan = document.getElementById('visitor-count');
        if (!visitorCountSpan) {
            console.log("[VisitorCount] Visitor count element not found (ID: 'visitor-count'). Feature skipped.");
            return;
        }

        // Fetch Spectator count from backend Netlify Function
        fetch(`${backendBaseUrl}handleVisitCount`, {
            method: 'GET',
             headers: { 'Accept': 'application/json' }
        })
            .then(response => {
                if (!response.ok) { // Robust error check for HTTP status
                    // Attempt to parse a rich backend error message from the response body for better debugging
                    return response.json().then(error => { 
                       throw new Error(error.message || `API error: HTTP ${response.status} ${response.statusText}.`); 
                    }).catch(() => {
                       // If body is not JSON or parsing fails, create a generic error message
                       throw new Error(`API error: HTTP ${response.status} ${response.statusText}. Failed to parse backend error response.`);
                    }); 
                }
                return response.json(); // Parse successful JSON response
            })
            .then(data => {
                if (data && typeof data.count !== 'undefined') { // Verify `count` property exists and is defined
                    visitorCountSpan.textContent = data.count; // Update displayed count
                    console.log(`[VisitorCount] Updated to: ${data.count}.`);
                } else {
                    console.warn("[VisitorCount] API returned no specific count structure or 'count' is undefined. Showing '0'. Full response:", data);
                    visitorCountSpan.textContent = '0'; // Default to '0' on ambiguous response
                }
            })
            .catch(error => {
                console.error('[VisitorCount] Failed to retrieve or update visitor count from frontend fetch. Details:', error, '. Please check backend configuration (e.g., Firebase private key) or Netlify Function deployment status in Netlify dashboard.');
                visitorCountSpan.textContent = '???'; // Indicate a definitive failure to fetch count
            });
        console.log("[VisitorCount] Footer current year and visitor count feature initialized.");
    } 


    // --- MAIN GLOBAL INITIALIZATION SEQUENCE: Orchestrates all features ---
    /**
     * This function is the master initializer. It explicitly calls all setup functions
     * in an order that attempts to predict and resolve dependencies and common race conditions,
     * ensuring a smooth and complete initialization of all client-side features.
     */
    function initializeAllFeatures() {
        // Essential DOM & Layout related setups are critical and should run very early.
        setupPageTransition();      // Overlay manages page transitions (must be before links are clicked)
        setupLinkInterceptor();     // Intercepts all internal anchor clicks for smooth transitions
        updateBodyStyling();        // Detects mobile/desktop, sets dynamic CSS variables, and initializes cursor trail.

        // After initial setup, apply a brute-force visibility fix to ensure all content elements are rendered
        // This is crucial to override potential CSS `opacity: 0` defaults that might persist in certain rendering paths.
        setTimeout(() => {
            applyImmediateVisibilityFix(); 
        }, 50); // A small, but vital delay for initial browser render pass on elements.

        // Other UI and content features are initialized here. Order is important for some inter-dependencies.
        setupDynamicPostImages();   // Handles dynamic image fetching (API + local fallbacks) for background, avatars, post thumbnails/banners.
        setupMainMenu();            // Initializes main navigation, mobile menu toggle, and menu closing logic.                 
        setupBackToTopButton();     // Sets up the scroll-to-top button functionality.         
        setupReadProgressBar();     // Activates the article read progress bar (only on detail pages).             
        setupFooterAndVisitorCount();  // Manages dynamic content in the footer like current year and visitor count.
        setupPostCategoryFilters(); // Initializes category filters for the blog page and dynamic category listings.

        console.log("✅ [FINAL Version: ULTIMATE REPAIR] All page features initialization sequence triggered.");
    }
    
    // Kick off the master initialization function securely only once after the DOM content is fully loaded and parsed.
    initializeAllFeatures();

    console.log("✅ [FINAL Version: ULTIMATE REPAIR] script.js COMPLETED all execution. Site should be fully functional now.");
});
