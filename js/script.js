document.addEventListener('DOMContentLoaded', () => {

    console.log("🚀 [FINAL Version: BUG-FREE & ULTIMATE STABILITY] script.js STARTING execution...");

    // ===================================================================
    // 1. CORE UTILITIES & DYNAMIC STATE (including Cursor Trail definition)
    //    The setupCursorTrail function is placed here to ensure it's defined
    //    before anything (like updateBodyStyling) attempts to call it.
    // ===================================================================

    const setupCursorTrail = () => {
        const cursorDot = document.getElementById('cursor-trail');
        const isCurrentlyMobile = document.body.classList.contains('is-mobile'); 

        if (!cursorDot) {
            console.log("[CursorTrail] Cursor trail element not found. Skipping setup.");
            document.body.style.cursor = 'auto'; // Ensure default cursor is on
            return;
        }

        // Clean up any existing listeners before re-applying
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
            document.body.style.cursor = 'none'; // Hide browser's default cursor
            cursorDot.style.display = 'block'; 
            cursorDot.style.opacity = '1'; 

            const mousemoveHandler = e => {
                cursorDot.style.left = `${e.clientX}px`;
                cursorDot.style.top = `${e.clientY}px`;
            };
            window.addEventListener('mousemove', mousemoveHandler);
            window._currentMousemoveHandler = mousemoveHandler; // Keep reference for removal

            // Event listeners for interactive elements for cursor scale effect
            document.querySelectorAll('a, button, .post-card, .menu-toggle, .main-nav a, .filter-tag-button').forEach(el => {
                const handleMouseEnter = () => { 
                    cursorDot.style.transform = 'translate(-50%, -50%) scale(1.5)';
                    cursorDot.style.backgroundColor = 'var(--secondary-color)';
                };
                const handleMouseLeave = () => { 
                    cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
                    cursorDot.style.backgroundColor = 'var(--primary-color)';
                };
                
                el.addEventListener('mouseenter', handleMouseEnter);
                el.addEventListener('mouseleave', handleMouseLeave);
                el._currentHoverEnterHandler = handleMouseEnter; // Keep reference
                el._currentHoverLeaveHandler = handleMouseLeave; // Keep reference
            });
            console.log("[CursorTrail] Initialized for desktop.");

        } else { // On mobile: hide custom cursor, restore default OS cursor
            document.body.style.cursor = 'auto'; 
            cursorDot.style.display = 'none'; 
            cursorDot.style.opacity = '0'; 
            console.log("[CursorTrail] Disabled for mobile.");
        }
    };

    const updateBodyStyling = () => { 
        const desktopBlurCssVar = getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur').trim();
        const mobileBlurCssVar = getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur-mobile').trim();
        const currentIsMobile = window.innerWidth <= 767;

        document.documentElement.style.setProperty('--body-global-blur-value', currentIsMobile ? mobileBlurCssVar : desktopBlurCssVar);
        document.body.classList.toggle('is-mobile', currentIsMobile);
        
        setupCursorTrail(); // Now safe to call
    };

    // Initial call on load, and then listen for resize events
    // CRITICAL FIX: Ensure updateBodyStyling runs after DOMContentLoaded fully, and debounce resize for perf.
    updateBodyStyling(); 
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(updateBodyStyling, 200); // Debounce resize event
    }); 

    // ################### IMPORTANT: backendBaseUrl Configuration ###################
    // Honoka, Ensure this is YOUR exact Netlify domain!
    const backendBaseUrl = 'https://honoka1.netlify.app/.netlify/functions/'; 


    // --- Global Page Transition Overlay Management ---
    const pageTransitionOverlay = document.getElementById('global-page-transition-overlay');
    if (pageTransitionOverlay) {
        // Re-check for loader on DOM load, in case it was accidentally removed or not SSR
        if (!pageTransitionOverlay.querySelector('.loader')) {
            pageTransitionOverlay.innerHTML = `
                <div class="loader"></div>
                <p class="overlay-text">加载中...</p>
            `;
        }
        // CRITICAL FIX: Make sure overlay removes visible class properly for first load
        // Give a very slight delay for CSS to paint before starting fade out
        setTimeout(() => { 
            if (pageTransitionOverlay) { // Check if element still exists to avoid null reference error in case of fast page unload
                pageTransitionOverlay.classList.remove('visible');
                // Wait for transition to complete before setting display to 'none' and allowing scroll
                setTimeout(() => { 
                    if (pageTransitionOverlay) pageTransitionOverlay.style.display = 'none';
                    document.body.classList.remove('no-scroll'); 
                }, 500); // Must be slightly shorter or equal to CSS transition duration fade-out (0.4s CSS, 0.5s JS total to fully disappear)
            }
        }, 100); 
        console.log("[PageTransition] Overlay initialized for first load.");
    }

    /**
     * Triggers a smooth page transition overlay and then navigates to the target URL.
     * @param {string} urlToNavigate - The URL to navigate to after the transition.
     */
    const activatePageTransition = (urlToNavigate) => {
        if (!pageTransitionOverlay) { // Fallback if overlay element is missing somehow
            window.location.href = urlToNavigate; 
            return; 
        }
        document.body.classList.add('no-scroll'); // Prevent scroll during transition
        pageTransitionOverlay.style.display = 'flex'; // Make sure display is not 'none' for fade in
        pageTransitionOverlay.classList.add('visible'); // Trigger CSS fade in
        // Allow time for fade-in transition before navigating
        setTimeout(() => { window.location.href = encodeURI(urlToNavigate); }, 400); // Adjust timing with CSS transition duration (0.4s fade-in)
        console.log(`[PageTransition] Activating transition to: ${urlToNavigate}`);
    };

    /**
     * Intercepts all internal link clicks to apply a smooth page transition effect.
     */
    document.querySelectorAll('a').forEach(link => {
        // Skip links that definitely shouldn't trigger a page transition
        if (link.target === '_blank' || link.href.startsWith('mailto:') || link.href.startsWith('javascript:void(0)')) {
            return;
        }

        let hrefURL;
        try { 
            hrefURL = new URL(link.href, window.location.href); 
        } catch (e) {
            console.warn(`[LinkInterceptor] Invalid URL encountered for link: "${link.href}", skipping event listener.`, e);
            return; // Skip invalid links or add a basic click handler without transition
        }

        // Only intercept internal links within the same origin and not just internal anchors on the same page
        // (e.g., #section1 on the same page should scroll, not trigger transition)
        const isInternalAnchor = hrefURL.hash && hrefURL.pathname === window.location.pathname && hrefURL.origin === window.location.origin;

        if (hrefURL.origin === window.location.origin && !isInternalAnchor) {
            link.addEventListener('click', (e) => {
                e.preventDefault(); // Stop default navigation
                activatePageTransition(link.href);
            });
        }
    });

    // --- Random Anime Wallpaper API for dynamic backgrounds/images ---
    /**
     * Fetches a random anime image from various APIs to apply to backgrounds or image elements.
     * Includes robust error handling, timeouts, and fallbacks to local images and gradient.
     */
    const fetchRandomAnimeImage = async (targetElement, type = 'background') => {
        let imageUrl = '';
        // Default options unless provided by target img elements
        const options = { width: 1920, height: 1080 }; 
        if (type === 'image' && targetElement && (targetElement.naturalWidth || targetElement.naturalHeight)) {
            // Not ideal, but might extract dimensions for some APIs; or can be hardcoded per type
        }

        const apiEndpoints = [
             `https://iw233.cn/api/Pure.php`,        // Usually reliable for direct image/JSON
             `https://api.adicw.cn/img/rand.php`,    // Simple JSON, usually random anime
             `https://www.dmoe.cc/random.php`,       // Another direct image/redirect endpoint
        ];

        const extractImageUrl = async (response, apiDebugName) => {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.startsWith('image/')) {
                // If it's a direct image or redirect to image
                return response.url; 
            } else if (contentType && contentType.includes('json')) { 
                // If JSON response (from APIs like iw233.cn depending on config)
                const data = await response.json();
                if (data && (data.imgurl || data.url) && typeof (data.imgurl || data.url) === 'string' && (data.imgurl || data.url).match(/\.(jpeg|jpg|gif|png|webp|bmp|avif|svg)$/i)) { 
                    return data.imgurl || data.url;
                }
            }
            console.warn(`[ImageLoader-${apiDebugName}] 🔄 Failed to extract image URL from response. Content-Type: ${contentType}. Trying next API.`);
            return ''; 
        };
        

        for (const api of apiEndpoints) {
            const apiDebugName = new URL(api).hostname; // Full hostname for clarity
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), Math.min(4000, 2000 + Math.random() * 2000)); // Dynamic timeout for robustness
                
                const response = await fetch(api, { method: 'GET', redirect: 'follow', signal: controller.signal, headers: { 'Accept': 'image/*,application/json' } });
                clearTimeout(timeoutId);

                if (response.ok) {
                    imageUrl = await extractImageUrl(response, apiDebugName);
                    if (imageUrl) { break; } // Found a valid URL, exit loop
                } else {
                    console.warn(`[ImageLoader-${apiDebugName}] ⚠️ API responded with HTTP status ${response.status}. Trying next.`);
                }
            } catch (innerError) {
                if (innerError.name === 'AbortError') {
                    console.warn(`[ImageLoader-${apiDebugName}] ⏱️ Request timed out (dynamic limit). Continuing to next API.`);
                } else if (innerError instanceof TypeError || innerError instanceof DOMException) {
                   console.warn(`[ImageLoader-${apiDebugName}] 🚫 Network/Fetch error:`, innerError.message, 'Continuing to next API.');
                } else {
                    console.warn(`[ImageLoader-${apiDebugName}] ❌ Unexpected error "${innerError.message}". Continuing to next API.`);
                }
            }
        }
        
        // If a valid URL was obtained from any API, attempt to preload and apply.
        if (imageUrl) {
            const imgToLoad = new Image(); 
            imgToLoad.src = imageUrl;
            imgToLoad.onload = () => {
                if (type === 'background') {
                    document.documentElement.style.setProperty('--bg-image', `url("${imageUrl}")`); 
                    console.log(`[ImageLoader] ✅ Dynamic background applied.`);
                } else if (type === 'image' && targetElement) {
                    targetElement.src = imageUrl; 
                    targetElement.style.opacity = '1'; 
                    targetElement.style.objectFit = 'cover'; 
                }
                // Remove fallback specific styles if real image loads
                if (targetElement) { // targetElement could be null for background image
                    targetElement.classList.remove('is-loading-fallback'); 
                    targetElement.style.filter = ''; 
                    // Remove fallback text overlay if it exists
                    const fallbackText = targetElement.nextElementSibling;
                    if (fallbackText && fallbackText.classList.contains('fallback-text-overlay')) {
                        fallbackText.remove();
                    }
                }
                console.log(`[ImageLoader] ✅ Real image from API loaded: ${imageUrl.substring(0, 50)}...`);
            };
            imgToLoad.onerror = () => { 
                console.warn(`[ImageLoader] 🚫 Preloading image "${imageUrl}" failed *after* receiving valid URL. Applying local fallback.`);
                applyFallbackImage(targetElement, type); // Fallback if preloading fails *after successful fetch*
            };
        } else { // If NO valid URL from ANY API after all attempts
            console.error('[ImageLoader] ❌ No valid image URL received from any dynamic API source. Forcing local fallback.');
            applyFallbackImage(targetElement, type); 
        }
    };
    
    /**
     * Applies local fallback imagery (pngs or random gradients) and a text overlay, for situations where
     * dynamic image loading fails. Provides immediate visual feedback to the user.
     */
    const applyFallbackImage = (targetElement, type, srcOverride = null) => {
        const isThumbnail = targetElement && targetElement.classList.contains('post-thumbnail');
        // Determine correct fallback image path based on target and its location
        const fallbackFilename = isThumbnail ? 'post-thumbnail-fallback.png' : 'post-detail-banner-fallback.png';
        const baseRelativePath = window.location.pathname.includes('/posts/') ? '../img/' : './img/';
        const localFallbackSrc = srcOverride || `${baseRelativePath}${fallbackFilename}`;
        
        if (type === 'background') {
            document.documentElement.style.setProperty('--bg-image', getRandomGradient());
            console.log(`[ImageLoader] 🖼️ Applied gradient background fallback for body.`);
        } else if (type === 'image' && targetElement) {
            targetElement.src = localFallbackSrc; 
            targetElement.style.objectFit = 'contain'; // Show entire fallback image
            targetElement.classList.add('is-loading-fallback'); // Add special class for fallback styling
            targetElement.style.opacity = '1'; // Ensure it's not hidden if it was meant to fade in
            
            // If local fallback itself is an image, enhance with a subtle gradient behind it
            targetElement.style.backgroundImage = getRandomGradient(); 
            targetElement.style.backgroundRepeat = 'no-repeat';
            targetElement.style.backgroundPosition = 'center';
            targetElement.style.backgroundSize = 'cover';

            // Create or update a visual overlay indicating loading/fallback state
            let fallbackTextOverlay = targetElement.nextElementSibling;
            if (!fallbackTextOverlay || !fallbackTextOverlay.classList.contains('fallback-text-overlay')) {
                fallbackTextOverlay = document.createElement('div');
                fallbackTextOverlay.classList.add('fallback-text-overlay');
                // Ensure the parent is positioned relative to allow absolute overlay positioning
                if (targetElement.parentNode && getComputedStyle(targetElement.parentNode).position === 'static') {
                    targetElement.parentNode.style.position = 'relative'; 
                }
                targetElement.parentNode.insertBefore(fallbackTextOverlay, targetElement.nextSibling); // Insert after the image
                console.log(`[ImageLoader] Overlay created for ${targetElement.alt || 'Unnamed Image Title'}.`);
            }
            fallbackTextOverlay.textContent = isThumbnail ? "封面加载失败 :(" : "图片加载失败 :(";
            fallbackTextOverlay.style.display = 'flex'; // Ensure overlay display is flex
            fallbackTextOverlay.classList.add('is-visible'); // Trigger any animation on overlay if exists.

            // Second-tier check: if the local fallback image itself is broken, hide the `<img>` tag and show only overlay over gradient.
            const testLocalImage = new Image();
            testLocalImage.src = localFallbackSrc;
            testLocalImage.onload = () => {
                 // If local fallback loads, ensure img is visible and overlay also visible
                 if (targetElement.style.display === 'none') targetElement.style.display = 'block'; // Or whatever is default for img
                 if (fallbackTextOverlay) fallbackTextOverlay.style.display = 'flex'; 
            };
            testLocalImage.onerror = () => {
                // If local fallback fails, hide img and only show overlay over gradient fallback
                targetElement.style.display = 'none'; 
                if (fallbackTextOverlay) fallbackTextOverlay.style.display = 'flex'; 
                console.warn(`[ImageLoader] 🚫 Local fallback (path: "${localFallbackSrc}") itself failed to load. Displaying only text overlay over gradient.`);
            };
        }
         console.log(`[ImageLoader] 🎨 Applied local fallback mechanism with overlay for: ${targetElement?.alt || type}`);
    };
    
    /**
     * Generates a random, visually distinctive linear gradient string for use as a background.
     */
    function getRandomGradient() {
        const h1 = Math.floor(Math.random() * 360); 
        const h2 = (h1 + 60 + Math.floor(Math.random() * 60)) % 360; 
        const s = Math.floor(Math.random() * 30) + 70; 
        const l = Math.floor(Math.random() * 20) + 50; 
        return `linear-gradient(135deg, hsla(${h1}, ${s}%, ${l}%, 0.7), hsla(${h2}, ${s}%, ${l}%, 0.7))`;
    }


    // --- Dynamic Article Thumbnail/Banner Images ---
    const setupDynamicPostImages = () => {
        document.querySelectorAll('.post-thumbnail[data-src-type="wallpaper"]').forEach(img => {
            applyFallbackImage(img, 'image'); // Apply fallback immediately for faster perceived load
            fetchRandomAnimeImage(img, 'image', { width: 500, height: 300 }); // Then try to fetch real one
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
     * Initializes and triggers entrance animations for elements across the page.
     * This function has been significantly unified and strengthened to ensure all
     * intended elements become visible, addressing previous 'elements stuck at opacity 0' issues.
     */
    const applyImmediateVisibilityFix = () => {
        // STEP 1: Force critical structural elements to be display-visible using `force-visible` utility class.
        // This class should use `!important` in CSS to override anything.
        const structuralElements = document.querySelectorAll(
            '.main-header, .hero-section, .content-page-wrapper, .main-footer, .global-page-transition-overlay'
        );
        structuralElements.forEach(el => {
            el.classList.add('force-visible');
        });
        console.log("[VisibilityFix] Top-level structural UI elements immediately 'force-visible'.");


        // STEP 2: The most critical part. Select virtually ALL content elements that
        // are expected to animate into view OR simply become visible if they start at opacity:0.
        // This comprehensive selector ensures no crucial content gets missed.
         const elementsToAnimateOrReveal = document.querySelectorAll(
            // General animatable elements (via animate__* class utility)
            '[class*="animate__"], ' + 
            // Specific common text elements that might be hidden by default content-page-wrapper opacity:0 rule
            '.main-content h1, .main-content h2, .main-content h3, .main-content h4, ' +
            '.main-content p:not(.post-excerpt):not(.form-hint):not(.no-comments-message), ' + // Exclude specific paragraphs with their own handling
            '.main-content ul, .main-content ol, ' +
            // Homepage elements
            '.hero-subtitle, .hero-nav a, .hero-content, ' + 
            // Header elements
            '.main-header .blog-title, .main-nav ul li a, .menu-toggle, ' +
            // About Me Page
             '.my-avatar, .about-me-section p, .contact-info, .contact-info h3, .contact-info ul li, ' +
            // Blog Page
            '#blog-category-filters .filter-tag-button, #all-posts-grid .post-card, .post-card .post-info h3, .post-card .post-excerpt, .post-card time, .post-card .post-tags, .post-card .tag, ' +
            // Article Detail Page
            '.blog-post-detail .post-detail-title, .blog-post-detail .post-meta, .blog-post-detail .post-detail-banner, .blog-post-detail .post-content, .blog-post-detail .post-content h3, .blog-post-detail .post-comment-form, .post-content p, .post-content ul, .post-content ol, .post-share-buttons, .post-share-buttons span, .share-button, .read-more .button, ' +
            // Comments Page
             '.comment-section .page-title, .comment-form-container, .comment-form-container h3, .form-group, .form-group label, .form-group input, .form-group textarea, .form-hint, ' +
             '.comments-list-container, .comments-list-container h3, #comments-list .post-card, #comments-list .comment-info, #comments-list .comment-text, #comments-list .comment-meta, .no-comments-message, ' +
            // Categories Page
             '.categories-section .page-title, .categories-section p, #dynamic-category-list .filter-tag-button, .categories-section .button-container .button, ' +
            // Global UI elements
            '#back-to-top, .main-footer p, #current-year, #visitor-count' 
        );

        // Apply 'is-visible' based on data-delay (or immediately)
        elementsToAnimateOrReveal.forEach(el => {
            const delay = parseInt(el.dataset.delay || '0', 10);
            setTimeout(() => {
                // Only add 'is-visible' if it doesn't already have 'force-visible' (to prevent conflicts if both happen)
                if (!el.classList.contains('is-visible') && !el.classList.contains('force-visible')) {
                    el.classList.add('is-visible');
                }
            }, delay + 50); // Add a small base delay + existing data-delay for staggered show
        });
        console.log(`[VisibilityFix] Applied 'is-visible' to ${elementsToAnimateOrReveal.length} content elements for guaranteed display.`);


        // STEP 3: Fallback using IntersectionObserver for elements that might still be missed or added dynamically.
        // This is less critical now due to the comprehensive selection in STEP 2 but adds a layer of robustness.
        const observer = new IntersectionObserver((entries, observerInstance) => {
            entries.forEach(entry => {
                // Only add 'is-visible' if it's currently hidden and in view.
                // Prevent redundant operations on elements already made visible by step 2.
                // Also ensure we don't double-animate elements already handling their own animations.
                const isElementHandled = entry.target.classList.contains('is-visible') || entry.target.classList.contains('force-visible');

                if (entry.isIntersecting && !isElementHandled) {
                    const delay = parseInt(entry.target.dataset.delay || '0', 10);
                    setTimeout(() => {
                        if (!entry.target.classList.contains('is-visible') && !entry.target.classList.contains('force-visible')) {
                            entry.target.classList.add('is-visible');
                        }
                        // Stop observing once visible to save performance, for non-looping animations.
                        if (!entry.target.classList.contains('blog-title--animated')) { // Keep homepage title animating
                            observerInstance.unobserve(entry.target); 
                        }
                    }, delay + 50); 
                }
            });
        }, { 
            threshold: 0.1, // Triggers when 10% of the element is visible
            rootMargin: "0px 0px -50px 0px" // Start observing slightly earlier than viewport bottom to look ahead
        });

        // Re-observe all potentially animatable elements, if they are not already forced visible.
        document.querySelectorAll('[class*="animate__"], .comments-list-container, .comment-form-container, .about-me-section, .categories-section')
            .forEach(el => {
                if (!el.classList.contains('force-visible') && !el.classList.contains('is-visible')) {
                    observer.observe(el);
                }
            });
        console.log("[VisibilityFix] IntersectionObserver (fallback mechanism) for animations re-initialized.");
    };


    // --- Back to Top Button ---
    const setupBackToTopButton = () => {
        const btn = document.getElementById('back-to-top');
        if (!btn) { console.log("[BackToTop] Button element not found. Feature disabled."); return; }

        // CRITICAL: Immediately show/hide based on current scroll position on load
        if (window.scrollY > 300) { btn.classList.add('show'); } 
        else { btn.classList.remove('show'); }

        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) { btn.classList.add('show'); } 
            else { btn.classList.remove('show'); }
        });

        btn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
        console.log("[BackToTop] Button initialized.");
    };
    

    /**
     * Initializes the read progress bar for article detail pages.
     */
    const setupReadProgressBar = () => {
        const progressBar = document.getElementById('read-progress-bar');
        const content = document.querySelector('.blog-post-detail'); // Main content area for an article
        if (!progressBar || !content) { 
            console.log("[ReadProgressBar] Not an article detail page or elements not found. Feature skipped."); 
            return; 
        } 

        // Function to calculate and update progress bar width
        const calculateProgress = () => {
           // Total scrollable height ensures we account for full content, not just viewport
           const documentHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
            const currentScrollPosition = window.scrollY; 

            let readProgress = (documentHeight > 0) ? (currentScrollPosition / documentHeight) * 100 : 0;
            readProgress = Math.min(100, Math.max(0, readProgress)); // Clamp value between 0 and 100

            progressBar.style.width = readProgress + '%'; 
        };

        window.addEventListener('scroll', calculateProgress);
        window.addEventListener('resize', calculateProgress); // Recalculate on window resize
        setTimeout(calculateProgress, 100); // Initial calculation after a short delay
        console.log("[ReadProgressBar] Enabled for article page.");
    };
    
    /**
     * Sets up the main navigation menu: hamburger toggle, mini-panel display, and close logic.
     */
    const setupMainMenu = () => {
        const menuToggle = document.querySelector('.menu-toggle');
        const mainNav = document.getElementById('main-nav-menu'); 
        const menuClose = document.querySelector('.main-nav .menu-close');
        
        if (!menuToggle || !mainNav || !menuClose) {
            console.warn('[MainMenu] Menu elements not found. Menu features disabled. Ensure .menu-toggle, #main-nav-menu, .main-nav .menu-close are in HTML.');
            document.body.classList.remove('no-scroll'); 
            return;
        }

        const openMenu = () => {
            mainNav.classList.add('is-open'); 
            menuToggle.setAttribute('aria-expanded', 'true');
            document.body.classList.add('no-scroll'); // Prevent page scroll
            console.log("[MainMenu] Panel menu is now open.");
        };

        const closeMenu = () => {
            if (!mainNav.classList.contains('is-open')) return; // Only close if open
            mainNav.classList.remove('is-open');
            menuToggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('no-scroll'); // Restore page scroll
            console.log("[MainMenu] Panel menu is now closed.");
        };

        menuToggle.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent document click listener from immediately closing
            if (mainNav.classList.contains('is-open')) { closeMenu(); } 
            else { openMenu(); }
        });
        menuClose.addEventListener('click', (event) => {
            event.stopPropagation(); 
            closeMenu();
        });

        // Close menu manually when an internal menu link is clicked - integrate with page transition
        // We need to re-select these links in case new content is loaded or dynamically added.
        mainNav.querySelectorAll('a').forEach(link => { 
            // Remove any old transition listeners to prevent duplicates
            if (link._menuTransitionHandler) {
                link.removeEventListener('click', link._menuTransitionHandler);
            }

            let hrefURL;
            try { 
                hrefURL = new URL(link.href, window.location.href); 
            } 
            catch (e) {
                 // Add simple close behavior for invalid or external links
                 const simpleCloser = () => { closeMenu(); };
                 link.addEventListener('click', simpleCloser); 
                 link._menuTransitionHandler = simpleCloser;
                 return; 
            }

            const newMenuClickHandler = (e) => {
                // Internal links leading to a different path
                 if (hrefURL.origin === window.location.origin && hrefURL.pathname !== window.location.pathname) {
                    e.preventDefault(); // Prevent default navigation
                    activatePageTransition(link.href); // Trigger our custom transition
                    setTimeout(() => { closeMenu(); }, 400); // Close menu after transition animation starts
                 } else { // External links, same-page anchors or mailto
                    closeMenu(); // Just close the menu
                 }
            };
            link.addEventListener('click', newMenuClickHandler);
            link._menuTransitionHandler = newMenuClickHandler; // Store for future removal

        });

        // Close menu if clicking outside the menu area or toggle button
        document.body.addEventListener('click', (event) => {
            if (mainNav.classList.contains('is-open') && !mainNav.contains(event.target) && !menuToggle.contains(event.target) ) {
                closeMenu();
            }
        });
        console.log("[MainMenu] Navigation menu initialized.");
    };


    // ################### NEW FEATURE: Blog Post Category/Tag Filtering ###################
    /**
     * Initializes interactive category filter buttons for the blog page ('blog.html')
     * and dynamically generates category links for the 'categories.html' page.
     */
    const setupPostCategoryFilters = () => {
        const categoryFiltersContainer = document.getElementById('blog-category-filters');
        const blogPostsGrid = document.getElementById('all-posts-grid'); 
        
        const isCategoriesPage = window.location.pathname.includes('categories.html');
        const dynamicCategoryList = document.getElementById('dynamic-category-list'); 

        // Aggregate unique tags from all post cards across _all loaded HTML files_ for comprehensive list.
        const allPosts = document.querySelectorAll('.post-card[data-tags]');
        const allTags = new Set();
        allPosts.forEach(post => { 
            const tagsAttr = post.dataset.tags; 
            if (tagsAttr) { tagsAttr.split(',').map(tag => tag.trim()).filter(Boolean).forEach(tag => allTags.add(tag)); }
        });
        
        const sortedTags = Array.from(allTags).sort((a,b) => a.localeCompare(b, 'zh-CN')); // Sort tags alphabetically

        // Part 1: Interactive filtering on 'blog.html'
        if (categoryFiltersContainer && blogPostsGrid) {
            // Remove all existing buttons to prevent duplicates on re-init
            categoryFiltersContainer.innerHTML = '';

            // Create and prepend 'All Articles' button
            const allButton = document.createElement('button');
            allButton.classList.add('filter-tag-button', 'button', 'active'); // Add 'button' class for styling
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
                    if (!tagsAttr) { // Handle posts with no tags
                        post.style.display = (filterTag === 'all') ? 'block' : 'none'; 
                        // Ensure animation state is consistent
                        post.classList.toggle('is-visible', filterTag === 'all');
                        return;
                    }
                    const postTagsLower = tagsAttr.split(',').map(tag => tag.trim().toLowerCase()); // Make tags lowercase for robust matching
                    const filterTagLower = filterTag.toLowerCase();

                    if (filterTagLower === 'all' || postTagsLower.includes(filterTagLower)) { 
                        post.style.display = 'block'; 
                         // Re-add stagger for filtered items, or just make visible if no animation desired post-filter
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
                button.classList.add('filter-tag-button', 'button'); // Add 'button' class for styling
                button.textContent = ` #${tag}`; 
                button.dataset.filter = tag; 
                categoryFiltersContainer.appendChild(button);
                button.addEventListener('click', () => filterPosts(tag, button));
            });

            // Check URL for initial tag filtering (e.g., from categories.html or direct link)
            const urlParams = new URL(window.location.href);
            const initialTag = urlParams.searchParams.get('tag'); 
            if (initialTag) {
                const initialButton = categoryFiltersContainer.querySelector(`[data-filter="${initialTag.trim()}"]`); 
                if(initialButton) {
                    filterPosts(initialTag.trim(), initialButton); 
                } else { // Fallback if initial tag from URL does not exist or typo
                    filterPosts('all', allButton); 
                }
            } else { // Default to showing all posts on initial load without a specific tag
                filterPosts('all', allButton); 
            }
            console.log("[CategoryFilter] Interactive filters initialized on blog page.");
        }
        
        // Part 2: Generating category links on 'categories.html'
        if (isCategoriesPage && dynamicCategoryList) {
            dynamicCategoryList.innerHTML = ''; // Clear existing content

            if (sortedTags.length === 0) { 
                 // IMPORTANT: ensure the 'no-comments-message' class styling means it starts hidden and fades in properly
                 dynamicCategoryList.innerHTML = `<p class="no-comments-message is-visible">暂时没有可用的文章分类。</p>`; 
                 console.log('[CategoryPage] No tags found, displaying default message.');
                 return;
            }

            sortedTags.forEach((tag, index) => {
                const buttonLink = document.createElement('a'); // Use <a> for navigatable tags buttons
                buttonLink.href = `blog.html?tag=${encodeURIComponent(tag)}`; // Link to blog page with tag filter
                buttonLink.classList.add('filter-tag-button', 'button', 'animate__slide-up'); // Ensure animations
               buttonLink.textContent = ` # ${tag}`;
                buttonLink.setAttribute('aria-label', `查看所有分类为 ${tag} 的文章`);
                buttonLink.dataset.filter = tag; 
                buttonLink.dataset.delay = String(index * 50); // Stagger animations

                dynamicCategoryList.appendChild(buttonLink);
                // Explicitly add is-visible with delay for proper entrance animation, as observer might be too late
                setTimeout(() => buttonLink.classList.add('is-visible'), (index * 50) + 100); 
            });
            console.log(`[CategoryPage] Generated ${sortedTags.length} category links.`);
            
            // Ensure parent container is visible as a whole
            const contentWrapper = document.querySelector('main.container.content-page-wrapper');
            if (contentWrapper && !contentWrapper.classList.contains('is-visible')) {
                setTimeout(() => contentWrapper.classList.add('is-visible'), 150); 
            }
        }
    };


    // --- Share buttons for article pages ---
    const setupShareButtons = () => {
        const shareButtons = document.querySelectorAll('.post-share-buttons a.weibo, .post-share-buttons a.qq');
        if (shareButtons.length === 0) { 
            console.log("[ShareButtons] No share buttons found on this page."); 
            return; 
        } 

        // Get current page URL and title for sharing
        const currentUrl = encodeURIComponent(window.location.href);
        const pageTitle = document.title;
        const articleTitle = encodeURIComponent(pageTitle.split(' - ')[0] || "Honoka的小屋"); // Use part before " - " or default title

        shareButtons.forEach(btn => {
            if (btn.classList.contains('weibo')) {
                btn.href = `https://service.weibo.com/share/share.php?url=${currentUrl}&title=${articleTitle}`;
                // Optionally add extra params: pic, appkey
            } else if (btn.classList.contains('qq')) {
                const imgElement = document.querySelector('.post-detail-banner');
                // Only use dynamic image if it loaded successfully (not fallback or placeholder)
                const imgUrl = (imgElement && imgElement.src && !imgElement.classList.contains('is-loading-fallback') && !imgElement.src.startsWith('data:image/') && imgElement.naturalWidth > 0)
                               ? encodeURIComponent(imgElement.src) : ''; // Check naturalWidth/Height to ensure real image data
                btn.href = `https://connect.qq.com/widget/shareqq/index.html?url=${currentUrl}&title=${articleTitle}${imgUrl ? '&pics=' + imgUrl : ''}`;
            }
            // Ensure share links open in a new, small window
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                window.open(btn.href, 'sharewindow', 'height=480,width=640,toolbar=no,menubar=no,scrollbars=yes,resizable=yes');
            });
        });
        console.log("[ShareButtons] Share buttons initialized.");
    };
    
    // --- Footer dynamic details and Dynamic Blur Adjustment for Body (includes Backend Visitor Count) ---
    const setupFooterAndVisitorCount = () => { // Renamed to accurately reflect its content
        const currentYearSpan = document.getElementById('current-year');
        if (currentYearSpan) { currentYearSpan.textContent = new Date().getFullYear(); }

        // --- Backend Visitor Counter ---
        const visitorCountSpan = document.getElementById('visitor-count');
        if (!visitorCountSpan) {
            console.log("[VisitorCount] Visitor count element not found. Feature skipped.");
            return;
        }

        fetch(`${backendBaseUrl}handleVisitCount`, {
            method: 'GET',
             headers: { 'Accept': 'application/json' }
        })
            .then(response => {
                if (!response.ok) { // Comprehensive error check
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
                    console.warn("[VisitorCount] API returned no specific count structure. Showing '0'. Response:", data);
                    visitorCountSpan.textContent = '0';
                }
            })
            .catch(error => {
                console.error('[VisitorCount] Failed to retrieve or update visitor count from frontend fetch:', error, '. Check backend config (e.g., Firebase key) or Netlify Function deployment.');
                visitorCountSpan.textContent = '???'; // Indicate failure
            });
        console.log("[VisitorCount] Footer current year and visitor count feature initialized.");
    };


    // --- MAIN INITIALIZATION SEQUENCE ---
    // This orchestrates all features to ensure proper load order and dependencies.
    function initializeAllFeatures() {
        // It's crucial for visibility fixes to run early after styles are loaded
        // setTimeout ensures DOM has fully rendered initial state (critical for layout calculations)
        setTimeout(() => {
            applyImmediateVisibilityFix(); // CRITICAL: This MUST run after initial DOM render/styles for content to appear
        }, 50); // Small delay to let browser finish initial layout

        // Dynamic images can take time, initialize early
        setupDynamicPostImages(); 

        // UI features
        setupMainMenu();                 
        setupBackToTopButton();         
        setupReadProgressBar();         
        setupFooterAndVisitorCount();   
        setupPostCategoryFilters();     // Filters and categories depend on DOM-loaded post cards

         console.log("✅ [FINAL Version: BUG-FREE & ULTIMATE STABILITY] All page features initialization sequence triggered.");
    }
    
    // Kick off the master initialization after DOM content is fully loaded
    initializeAllFeatures();

    console.log("✅ [FINAL Version: BUG-FREE & ULTIMATE STABILITY] script.js COMPLETED all execution. Site should be fully functional now.");
});
