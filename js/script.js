document.addEventListener('DOMContentLoaded', () => {
    // Debugging: Log script start
    console.log("🚀 script.js STARTING execution...");

    // Helper: Determine if device is mobile based on initial screen width. Updates dynamically on resize.
    let isMobile = window.innerWidth <= 767; 
    const updateIsMobileClass = () => {
        isMobile = window.innerWidth <= 767;
        if (isMobile) {
            document.body.classList.add('is-mobile');
        } else {
            document.body.classList.remove('is-mobile');
        }
    };
    updateIsMobileClass(); // Initial check
    window.addEventListener('resize', updateIsMobileClass); // Update on resize


    // --- Global Page Transition Overlay Management ---
    const pageTransitionOverlay = document.getElementById('global-page-transition-overlay');
    if (pageTransitionOverlay) {
        // Prepare overlay content if not already present
        if (!pageTransitionOverlay.querySelector('.loader')) {
            pageTransitionOverlay.innerHTML = `
                <div class="loader"></div>
                <p class="overlay-text">加载中...</p>
            `;
        }
        // Initially hide overlay after page loads
        setTimeout(() => { // Small delay to ensure overlay is already 'visible' before starting to hide
            if (pageTransitionOverlay) { // Check if element still exists
                pageTransitionOverlay.classList.remove('visible');
                setTimeout(() => { // Wait for visual transition (0.5s CSS) to fully complete
                    // Only hide if the overlay is actually there, preventing errors on hot-reloads etc.
                    if (pageTransitionOverlay) pageTransitionOverlay.style.display = 'none';
                    // Re-enable body scroll, important if a prior page navigation had disabled it
                    document.body.classList.remove('no-scroll'); 
                }, 500); 
            }
        }, 100); 
        console.log("[PageTransition] Page transition overlay initialized.");
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
        document.body.classList.add('no-scroll'); 
        pageTransitionOverlay.style.display = 'flex'; // Ensure it's rendered visually
        pageTransitionOverlay.classList.add('visible'); // Trigger CSS fade-in

        setTimeout(() => {
            // Once the fade-in animation completes (0.4s), perform the navigation
            window.location.href = encodeURI(urlToNavigate); // Ensure URL is properly encoded
        }, 400); // Matches CSS transition duration before actual navigation
        console.log(`[PageTransition] Activating transition to: ${urlToNavigate}`);
    };

    // Intercept all internal link clicks for smooth page transitions
    document.querySelectorAll('a').forEach(link => {
        // Attempt to create a URL object from the href, relative to current document (robustness)
        let hrefURL;
        try {
            hrefURL = new URL(link.href, window.location.href); 
        } catch (e) {
            console.warn(`[LinkInterceptor] Invalid URL encountered for link: ${link.href}`, e);
            return; // Skip invalid links
        }
        const currentOrigin = window.location.origin;

        // Conditions for an "internal link" to intercept:
        // 1. Same origin (is part of our own domain)
        // 2. Not a mailto: link
        // 3. Not an anchor/hash link (like #section1), as these ideally scroll rather than reload
        // 4. Not a explicit 'javascript:void(0)' or empty external (target_blank handled separately)
        if (hrefURL.origin === currentOrigin && 
            hrefURL.protocol !== 'mailto:' && 
            hrefURL.hash === '' && 
            !link.getAttribute('href').startsWith('javascript:void(0)')) {
            
            link.addEventListener('click', (e) => {
                // If link has target="_blank", it's intended to open in a new tab, so don't intercept transition.
                if (link.target === '_blank') {
                    console.log(`[LinkInterceptor] Skipping _blank link: ${link.href}`);
                    return; 
                }
                e.preventDefault(); // Prevent default browser navigation
                // Proceed with our custom page transition
                activatePageTransition(link.href);
            });
            // console.log(`[LinkInterceptor] Intercepted link: ${link.href}`);
        }
    });

    // ################### NEW: Backend API Endpoints & Fetching ###################
    // !!! IMPORTANT: Replace with YOUR ACTUAL NETLIFY SITE'S DOMAIN !!!
    // The base URL for your Netlify Functions, deployed as part of your Netlify site.
    // Example: https://your-netlify-site-name.netlify.app/.netlify/functions/
    const backendBaseUrl = 'https://honoka1.netlify.app/.netlify/functions/'; // <-- Honoika, Please confirm this is YOUR correct domain!


    // --- Random Anime Wallpaper API for dynamic backgrounds/images ---
    /**
     * Fetches a random anime image from various APIs.
     * Includes robust error handling, timeouts, and fallbacks to local images.
     * @param {HTMLElement} targetElement - The element to apply the image to (document.body for background, <img> for src).
     * @param {string} type - 'background' or 'image'.
     * @param {object} options - Configuration options (e.g., width, height hints for APIs).
     */
    const fetchRandomAnimeImage = async (targetElement, type = 'background', options = { width: 1920, height: 1080 }) => {
        let imageUrl = '';
        const { width, height } = options; 

        // Helper to extract a valid image URL from diverse API response formats
        const extractImageUrl = async (response, apiDebugName) => {
            const contentType = response.headers.get('content-type');
             // console.log(`[ImageLoader] API ${apiDebugName} Content-Type: ${contentType}`);
            if (contentType && contentType.startsWith('image/')) {
                return response.givenUrl || response.url; // Direct image URL received from fetch
            } else if (contentType && contentType.includes('json')) { 
                const data = await response.json();
                if (data && (data.imgurl || data.url) && typeof (data.imgurl || data.url) === 'string' && (data.imgurl || data.url).match(/\.(jpeg|jpg|gif|png|webp|bmp|avif)$/i)) { // Supported image formats
                    return data.imgurl || data.url; // Image URL found within JSON
                }
            }
            console.warn(`[ImageLoader] 🔄 ${apiDebugName} failed to extract image URL from response. Content-Type: ${contentType}`);
            return ''; 
        };
        
        // Priority Ordered Image APIs: Focused on fast, reliable, and anime-specific sources
        // Removed less reliable APIs found problematic in previous iterations (random.dog, picsum, generic Unsplash).
        const apiEndpoints = [
            `https://iw233.cn/api/Pure.php`,                             // Known to be effective for anime imagery.
            `https://api.adicw.cn/img/rand`,                            // Often returns good anime images.
            `https://api.btstu.cn/sjbz/api.php?lx=dongman&format=json`, // General anime API, JSON response.
            // Further APIs could be added here following testing for stability and desired content.
        ];

        // Loop through APIs until a successful image URL is obtained
        for (const api of apiEndpoints) {
            const apiDebugName = new URL(api).hostname.split('.').slice(-2).join('.'); // Clean hostname for logging
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout per API request
                
                const fetchOptions = { method: 'GET', redirect: 'follow', signal: controller.signal };
                // Specify expected content-types to help with server negotiation
                fetchOptions.headers = { 'Accept': 'image/*,application/json' };

                 // Using direct `api` as both the URL to fetch and pass to extractImageUrl for more clarity
                const response = await fetch(api, fetchOptions);
                clearTimeout(timeoutId); // Clear timeout if fetch completes within time

                if (response.ok) {
                    imageUrl = await extractImageUrl(response, apiDebugName);
                    if (imageUrl) {
                        // console.log(`[ImageLoader] ✅ API Success (${apiDebugName}): ${imageUrl.substring(0, 50)}...`);
                        break; // Exit loop on first successful image URL
                    }
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
        
        // --- Image Preloading and Application ---
        if (imageUrl) { // If an imageUrl was successfully obtained from any API
            const imgToLoad = new Image(); 
            imgToLoad.src = imageUrl;
            imgToLoad.onload = () => {
                if (type === 'background') {
                    document.documentElement.style.setProperty('--bg-image', `url("${imageUrl}")`); 
                    // console.log(`[ImageLoader] ✅ Applied dynamic background image: ${imageUrl.substring(0, 50)}...`);
                } else if (type === 'image') {
                    targetElement.src = imageUrl; 
                    targetElement.style.opacity = '1'; 
                    targetElement.style.objectFit = 'cover'; // Restore cover sizing for actual image
                }
                // Clear any fallback states/styles that might have been applied earlier
                targetElement.classList.remove('is-loading-fallback'); 
                targetElement.style.filter = ''; // Remove CSS filters (grayscale, blur)
                const fallbackText = targetElement.nextElementSibling; // The potential fallback text overlay div
                if (fallbackText && fallbackText.classList.contains('fallback-text-overlay')) {
                    fallbackText.remove(); // Remove the overlay div
                }
                // console.log(`[ImageLoader] ✅ Real image loaded successfully for ${targetElement.alt || 'background'}.`);
            };
            imgToLoad.onerror = () => { 
                // If the obtained imageUrl ITSELF fails during preload (bad URL or broken image file)
                console.warn(`[ImageLoader] 🚫 Preloaded valid Image URL (${imageUrl.substring(0, 50)}...) failed to render. Applying local fallback.`);
                applyFallbackImage(targetElement, type); // Fallback to local image
            };
        } else { // If NO valid imageUrl was obtained from ANY API after all attempts
            console.error('[ImageLoader] ❌ All online APIs failed to provide a valid image URL. Forcing initial local fallback.');
            applyFallbackImage(targetElement, type); // Directly apply local fallback
        }
    };
    
    /**
     * Applies a local fallback image, a random gradient background, and a text overlay to target image elements.
     * This provides immediate visual feedback if dynamic image loading fails.
     * @param {HTMLElement} targetElement - The <img> element or document.body to apply fallback to.
     * @param {string} type - 'background' or 'image'.
     * @param {string|null} srcOverride - Optional, specific local path for the fallback image (e.g., if different than default).
     */
    const applyFallbackImage = (targetElement, type, srcOverride = null) => {
        const isThumbnail = targetElement.classList.contains('post-thumbnail');
        const fallbackSuffix = isThumbnail ? 'post-thumbnail-fallback.png' : 'post-detail-banner-fallback.png';
        const baseRelativePath = window.location.pathname.includes('/posts/') ? '../img/' : './img/';
        const localFallbackSrc = srcOverride || `${baseRelativePath}${fallbackSuffix}`;
        
        if (type === 'background') {
            document.documentElement.style.setProperty('--bg-image', getRandomGradient());
            console.log(`[ImageLoader] 🖼️ Applied gradient background fallback.`);
        } else if (type === 'image') {
            targetElement.src = localFallbackSrc; // Set src to the local fallback image file
            targetElement.style.objectFit = 'contain'; // Ensure fallback image fits within boundaries
            targetElement.classList.add('is-loading-fallback'); // Add class for CSS filters/styles
            targetElement.style.opacity = '1'; // Ensure <img> element is visible

            // Apply a unique random gradient background directly to the image element
            targetElement.style.backgroundImage = getRandomGradient(); 
            // Position and size this gradient background to cover the element
            targetElement.style.backgroundRepeat = 'no-repeat';
            targetElement.style.backgroundPosition = 'center';
            targetElement.style.backgroundSize = 'cover';

            // Create or update a text overlay element for explicit user feedback
            let fallbackTextOverlay = targetElement.nextElementSibling;
            if (targetElement.tagName === 'IMG') { // Only modify <img> specific behavior
                if (!fallbackTextOverlay || !fallbackTextOverlay.classList.contains('fallback-text-overlay')) {
                    fallbackTextOverlay = document.createElement('div');
                    fallbackTextOverlay.classList.add('fallback-text-overlay');
                    fallbackTextOverlay.textContent = isThumbnail ? "封面加载失败 :(" : "图片加载失败 :(";
                     // Ensure parent element (e.g., .post-card a, or .blog-post-detail) is positioned relative
                    if (targetElement.parentNode && getComputedStyle(targetElement.parentNode).position === 'static') {
                        targetElement.parentNode.style.position = 'relative'; 
                    }
                    targetElement.parentNode.insertBefore(fallbackTextOverlay, targetElement.nextSibling); // Insert overlay after the <img> tag
                    console.log(`[ImageLoader] Overlay created for ${targetElement.alt || 'Unnamed Image Title'}.`);

                    // Secondary check: If the local fallback image itself cannot load, hide the <img> element completely.
                    // This relies solely on the gradient background and text overlay for visual feedback.
                    const testLocalImage = new Image();
                    testLocalImage.src = localFallbackSrc;
                    testLocalImage.onload = () => {
                         // If local image loads, keep overlay and image
                          if (targetElement.style.display === 'none') targetElement.style.display = ''; 
                         if (fallbackTextOverlay) fallbackTextOverlay.style.display = 'flex'; // Ensure overlay is visible over loaded local img
                         // console.log(`[ImageLoader] Local fallback image "${localFallbackSrc}" loaded okay.`);
                    };
                    testLocalImage.onerror = () => {
                        targetElement.style.display = 'none'; // Hide the `<img>` tag if its `src` (even local fallback) is broken
                        if (fallbackTextOverlay) fallbackTextOverlay.style.display = 'flex'; // Ensure text overlay remains visible
                        console.warn(`[ImageLoader] 🚫 Local fallback "${localFallbackSrc}" itself failed to load. Showing only text overlay over gradient.`);
                    };
                  
                } else {
                    fallbackTextOverlay.textContent = isThumbnail ? "封面加载失败 :(" : "图片加载失败 :("; // Update current text
                    fallbackTextOverlay.style.display = 'flex'; // Ensure it's showing
                    // console.log(`[ImageLoader] Updated existing overlay for ${targetElement.alt || 'Unnamed Image Title'}.`);
                }
            }
            console.log(`[ImageLoader] 🎨 Applied local fallback mechanism for: ${targetElement.alt || type}`);
        }
    };
    
    /**
     * Generates a random vibrant linear gradient string for fallback backgrounds.
     * HSL values are chosen for aesthetic warmth and distinction.
     * @returns {string} CSS `linear-gradient` string.
     */
    function getRandomGradient() {
        const h1 = Math.floor(Math.random() * 360); // First hue (0-359)
        const h2 = (h1 + 60 + Math.floor(Math.random() * 60)) % 360; // Second hue, offset for variation (60-119 degrees apart)
        const s = Math.floor(Math.random() * 30) + 70; // High saturation (70-99%) for vibrancy
        const l = Math.floor(Math.random() * 20) + 50; // Medium lightness (50-69%)
        return `linear-gradient(135deg, hsla(${h1}, ${s}%, ${l}%, 0.7), hsla(${h2}, ${s}%, ${l}%, 0.7))`;
    }


    // --- Global Background Image Setup (for Body) ---
    fetchRandomAnimeImage(document.body, 'background', { width: 1920, height: 1080 }); // Always fetches a random background for the body
    console.log("[Background] Dynamic background initiated.");


    // --- Dynamic Article Thumbnail/Banner Images ---
    const setupDynamicPostImages = () => {
        document.querySelectorAll('.post-thumbnail[data-src-type="wallpaper"]').forEach(img => {
            // Apply fallback upfront to minimize visual loading gaps
            applyFallbackImage(img, 'image'); 
            fetchRandomAnimeImage(img, 'image', { width: 500, height: 300 }); // Fetches source for smaller thumbnails
        });
        console.log("[ImageLoader] Post thumbnails initiated.");

        const detailBanner = document.querySelector('.post-detail-banner[data-src-type="wallpaper"]');
        if (detailBanner) {
            applyFallbackImage(detailBanner, 'image'); 
            fetchRandomAnimeImage(detailBanner, 'image', { width: 1000, height: 400 }); // Fetches source for larger banners
            console.log("[ImageLoader] Post detail banner initiated.");
        }
    };

    /**
     * Initializes elements with entrance animations, respecting `data-delay` attributes.
     * This function now explicitly applies `is-visible` based on delays for critical homepage elements.
     */
    const setupScrollAnimations = () => {
        // Elements that should animate on scroll/view (excluding specific homepage elements now handled differently)
        const animatedElements = document.querySelectorAll('.animate__fade-in:not(.main-header):not(.hero-subtitle):not(.hero-nav), .animate__slide-up:not(.hero-subtitle):not(.hero-nav)');
        console.log(`[Animations] Found ${animatedElements.length} scroll-animated elements.`);

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                     // Check for data-delay on elements (excluding homepage top elements)
                    const delay = parseInt(entry.target.dataset.delay || '0');
                    setTimeout(() => { // Apply animations after specified delay
                        const isLooper = entry.target.closest('.is-homepage-title') || entry.target.closest('.is-header-title');
                        if (isLooper && entry.target.classList.contains('is-visible')) {
                           // For looping elements, ensure they get 'is-visible' if somehow missed and are animated by their own CSS.
                           // Their main animation is CSS driven, so once they are 'visible' via JS or CSS, let CSS handle loops.
                        } else if (!entry.target.classList.contains('is-visible')) { // Only add if not already visible
                            entry.target.classList.add('is-visible');
                            if (!isLooper) { // Only unobserve non-looping animations after they become visible once
                                observer.unobserve(entry.target);
                                // console.log(`[Animations] Element observed & animated: ${entry.target.tagName} with classList: ${Array.from(entry.target.classList).join(', ')}`);
                            }
                        } 
                    }, delay);
                } 
            });
        }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }); // rootMargin makes animation trigger earlier

        animatedElements.forEach(el => observer.observe(el));

        // Ensure main header always has its initial fade-in or is visible on load without delay
        const mainHeader = document.querySelector('.main-header');
        if (mainHeader && !mainHeader.classList.contains('is-visible')) {
            mainHeader.classList.add('is-visible'); 
            // console.log("[Animations] Main header instantly visible.");
        }

        // ---------- FIX FOR HOMEPAGE BUTTONS/SUBTITLE NOT SHOWING ----------
        // For homepage specific core elements (subtitle and nav links), directly apply 'is-visible' with data-delay
        // These elements were likely missed by IntersectionObserver if they are initially "above" the rootMargin or due to initial render state.
        if (document.body.classList.contains('is-homepage')) {
            const homepageAnimatedCoreElements = document.querySelectorAll('.hero-subtitle.animate__slide-up, .hero-nav.animate__slide-up');
            homepageAnimatedCoreElements.forEach(el => {
                const delay = parseInt(el.dataset.delay || '0');
                setTimeout(() => {
                    if (el && !el.classList.contains('is-visible')) {
                        el.classList.add('is-visible');
                        // console.log(`[Animations] HomePage core element forced visible with delay ${delay}ms: ${el.tagName} with classList: ${Array.from(el.classList).join(', ')}`);
                    }
                }, delay + 50); // Add a small extra buffer to ensure parent fadeIn occurs first
            });
             console.log("[Animations] Homepage core elements (`hero-subtitle`, `hero-nav`) scheduled for visibility.");
        }
    };


    // --- Back to Top Button ---
    const setupBackToTopButton = () => {
        const btn = document.getElementById('back-to-top');
        if (!btn) { console.log("[BackToTop] Button element not found."); return; }

        // Show/hide button based on scroll position
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) { 
                btn.classList.add('show');
            } else {
                btn.classList.remove('show');
            }
        });

        // Smooth scroll to top when button is clicked
        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        // Set initial visibility on load if already scrolled down
        if (window.scrollY > 300) { btn.classList.add('show'); }
        console.log("[BackToTop] Button initialized.");
    };
    
    // --- Custom Cursor Trail Effect ---
    const setupCursorTrail = () => {
        const cursorDot = document.getElementById('cursor-trail');
        // Disable on mobile devices or if cursorDot element is missing
        if (!cursorDot || isMobile) { // Use dynamically updated isMobile from global closure
            if (cursorDot) cursorDot.style.display = 'none'; // Ensure main cursor dot is hidden
             // only set cursor to auto if not on a touch device and it was hidden (to restore default)
            if (!isMobile) document.body.style.cursor = 'auto'; // Restore default pointer
            console.log(`[CursorTrail] Disabled for ${isMobile ? 'mobile' : 'missing element'}.`);
            return;
        }
        
        // Desktop-only cursor trail functionality: tracks mouse movement and spawns smaller dots
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
                    if (trail.parentNode) {
                        trail.parentNode.removeChild(trail);
                    }
                }, 500); // Remove trail dots after their CSS animation finishes
            });

            // Hover effects for various interactive elements to change the main cursor's appearance
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
            
            setTimeout(() => cursorDot.style.opacity = '1', 100); // Initial fade-in of main cursor dot
            console.log("[CursorTrail] Initialized for desktop.");
        } catch (error) {
            console.error("[CursorTrail] Error during initialization:", error);
            document.body.style.cursor = 'auto'; // Ensure normal cursor if custom fails
            if (cursorDot) cursorDot.style.display = 'none'; // Hide custom cursor
        }
    };

    // --- Read Progress Bar for Article Pages ---
    const setupReadProgressBar = () => {
        const progressBar = document.getElementById('read-progress-bar');
        const content = document.querySelector('.blog-post-detail'); // Article content area
        if (!progressBar || !content) { console.log("[ReadProgressBar] Not an article page or elements not found."); return; } 

        // Calculates overall document scroll progress
        const calculateProgress = () => {
           const documentHeight = Math.max(
                document.body.scrollHeight, 
                document.documentElement.scrollHeight, 
                document.body.offsetHeight, 
                document.documentElement.offsetHeight, 
                document.body.clientHeight, 
                document.documentElement.clientHeight
            );
            const windowHeight = window.innerHeight;

            const scrollRange = documentHeight - windowHeight; // Total scrollable height
            const currentScrollPosition = window.scrollY; // Current scroll from top

            let readProgress = (currentScrollPosition / scrollRange) * 100;
            readProgress = Math.min(100, Math.max(0, readProgress)); // Clamp value between 0 and 100

            progressBar.style.width = readProgress + '%';
        }

        window.addEventListener('scroll', calculateProgress);
        window.addEventListener('resize', calculateProgress); 
        setTimeout(calculateProgress, 500); // Initial call after a brief delay for layout stability
        console.log("[ReadProgressBar] Enabled for article page.");
    };
    
    /**
     * Sets up the main navigation menu: hamburger toggle, mini-panel display, and close logic.
     * Includes disabling body scroll when menu is open and closing via outside clicks/internal links.
     */
    const setupMainMenu = () => {
        const menuToggle = document.querySelector('.menu-toggle');
        const mainNav = document.getElementById('main-nav-menu'); 
        const menuClose = document.querySelector('.main-nav .menu-close');
        
        if (!menuToggle || !mainNav || !menuClose) {
            console.warn('[MainMenu] Menu (toggle, nav, or close button) elements not found. Main menu features disabled.');
            document.body.classList.remove('no-scroll'); // Ensure scroll is enabled if menu can't function
            return;
        }

        const openMenu = () => {
            mainNav.classList.add('is-open'); // This applies the CSS slide-in/visibility
            menuToggle.setAttribute('aria-expanded', 'true'); // Accessible state
            document.body.classList.add('no-scroll'); // Disable body scroll
            console.log("[MainMenu] Menu is now open.");
        };

        const closeMenu = () => {
            if (!mainNav.classList.contains('is-open')) return; // Avoid redundant closures
            mainNav.classList.remove('is-open');
            menuToggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('no-scroll'); // Re-enable body scroll
            console.log("[MainMenu] Menu is now closed.");
        };

        // Toggle mechanism for the hamburger icon
        menuToggle.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevents click from bubbling to body and immediately closing menu
            if (mainNav.classList.contains('is-open')) {
                closeMenu();
            } else {
                openMenu();
            }
        });
        // Separate event for the 'X' close button within the menu panel
        menuClose.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevents click bubbling
            closeMenu();
        });

        // Close menu when an internal navigation link within the menu is clicked
        mainNav.querySelectorAll('a').forEach(link => {
            let hrefURL;
            try { hrefURL = new URL(link.href, window.location.href); } 
            catch (e) {
                 console.warn(`[MainMenu] Invalid menu link encountered: ${link.href}`, e);
                 // If invalid, let it handle as a non-intercepted link. Or fall-through to close.
                 link.addEventListener('click', closeMenu); // still attempt to close if it's external or weird.
                 return; 
            }
            const currentOrigin = window.location.origin;

            if (hrefURL.origin === currentOrigin && !hrefURL.protocol.startsWith('mailto:') && hrefURL.hash === '') {
                link.addEventListener('click', () => {
                    setTimeout(() => {
                        closeMenu(); 
                    }, 400); // Small delay to allow page transition to start visually fade out
                });
            } else { // Handle external links or hash links by just closing the menu directly
                link.addEventListener('click', closeMenu);
            }
        });

        // Close menu when clicking anywhere on the document body *outside* the menu or its toggle button
        document.body.addEventListener('click', (event) => {
            // Check if menu is open AND click target is neither the menu panel NOR the toggle button
            if (mainNav.classList.contains('is-open') && 
                !mainNav.contains(event.target) &&  
                !menuToggle.contains(event.target)) {
                closeMenu();
                // console.log("[MainMenu] Clicked outside menu, closed.");
            }
        });
        console.log("[MainMenu] Navigation menu initialized.");
    };


    // ################### NEW FEATURE: Blog Post Category/Tag Filtering ###################
    /**
     * Initializes interactive category filter buttons for the blog page ('blog.html').
     * It dynamically generates these buttons based on `data-tags` attributes of posts.
     * Also, for the dedicated 'categories.html' page, it generates simple links to blog.html with tag filters.
     */
    const setupPostCategoryFilters = () => {
        // Elements from blog.html
        const categoryFiltersContainer = document.getElementById('blog-category-filters');
        const blogPostsGrid = document.getElementById('all-posts-grid');
        
        // Element from categories.html
        const isCategoriesPage = window.location.pathname.includes('categories.html');
        const dynamicCategoryList = document.getElementById('dynamic-category-list'); 

        // If on blog.html, but main containers are missing, log and skip interactive filters.
        if(window.location.pathname.includes('blog.html') && (!categoryFiltersContainer || !blogPostsGrid)){
             console.warn("[CategoryFilter] Blog page but filters/posts container missing. Interactive filters disabled.");
        }

        // Gather all unique tags from all post cards, whether on blog.html or categories.html
        const allTags = new Set();
        // Assuming post cards are consistently within <div class="posts-grid" id="all-posts-grid"> or similar
        const allPostCards = document.querySelectorAll('.post-card'); // Query all possible post cards on the page
        allPostCards.forEach(post => { // Loop through all found post cards
            const tagsAttr = post.dataset.tags; // Retrieve tags from data-tags HTML attribute (e.g., "tag1, tag2")
            if (tagsAttr) {
                // Split, trim, and add each tag to the Set (Set naturally handles uniqueness)
                tagsAttr.split(',').map(tag => tag.trim()).forEach(tag => allTags.add(tag));
            }
        });
        // Console log for debugging tags gathered
        // console.log("[CategoryFilter] Collected Raw Tags:", Array.from(allTags).sort());

        // For `blog.html`: Generate interactive filter buttons and handle click filtering
        if (categoryFiltersContainer && blogPostsGrid) {
            // Ensure "All Articles" button exists at the start
            let allButton = categoryFiltersContainer.querySelector('[data-filter="all"]');
             if (!allButton) { // Create if it doesn't exist
                allButton = document.createElement('button');
                allButton.classList.add('filter-tag-button');
                allButton.textContent = `全部文章`;
                allButton.dataset.filter = 'all';
                categoryFiltersContainer.prepend(allButton); // Insert at the beginning
            }
            allButton.addEventListener('click', () => filterPosts('all', allButton)); // Add event listener

            // Dynamically create tag filter buttons
            const sortedTags = Array.from(allTags).sort((a,b) => a.localeCompare(b, 'zh-CN')); // Sort for consistent order
            sortedTags.forEach(tag => {
                // Only add if not already present (prevents duplicates on re-runs)
                if (!categoryFiltersContainer.querySelector(`[data-filter="${tag}"]`)) { 
                    const button = document.createElement('button');
                    button.classList.add('filter-tag-button');
                    button.textContent = ` #${tag}`; // Display with a hash prefix
                    button.dataset.filter = tag; 
                    categoryFiltersContainer.appendChild(button);
                    button.addEventListener('click', () => filterPosts(tag, button));
                }
            });

            // Filtering logic for posts on the blog page
            const filterPosts = (filterTag, clickedButton = null) => {
                // Deactivate all buttons first
                categoryFiltersContainer.querySelectorAll('.filter-tag-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                // Activate the clicked button, or the 'All Articles' button if 'all' is selected
                if (clickedButton) {
                    clickedButton.classList.add('active'); 
                } else if (filterTag === 'all' && allButton) {
                    allButton.classList.add('active');
                }

                allPostCards.forEach(post => { // Now use `allPostCards` to iterate on all for filtering
                    const tagsAttr = post.dataset.tags;
                    if (!tagsAttr) { // If a post has no tags, show it only if 'all' is selected
                        post.style.display = (filterTag === 'all') ? 'block' : 'none'; 
                        return;
                    }
                    const postTags = tagsAttr.split(',').map(tag => tag.trim());

                    // Show post if 'all' filter is active or if post contains the selected tag
                    if (filterTag === 'all' || postTags.includes(filterTag)) {
                        post.style.display = 'block'; 
                    } else {
                        post.style.display = 'none'; 
                    }
                });
                // console.log(`[CategoryFilter] Applied filter: "${filterTag}"`);
            };

            // Initial filtering based on URL parameter (e.g., navigating from categories.html)
            const urlParams = new URLSearchParams(window.location.search);
            const initialTag = urlParams.get('tag'); 
            if (initialTag) {
                const initialButton = categoryFiltersContainer.querySelector(`[data-filter="${initialTag}"]`);
                filterPosts(initialTag, initialButton); // Filter and highlight the button
            } else {
                filterPosts('all', allButton); // Default to 'all' posts
            }
             console.log("[CategoryFilter] Interactive filters initialized on blog page.");
        }
        
        // For `categories.html`: Generate static links instead of interactive buttons
        if (isCategoriesPage && dynamicCategoryList) {
            dynamicCategoryList.innerHTML = ''; // Clear previous content

            const sortedTags = Array.from(allTags).sort((a,b) => a.localeCompare(b, 'zh-CN'));
            
            if (sortedTags.length === 0) { // If no tags found just show a message
                 dynamicCategoryList.innerHTML = `<p class="no-comments-message">暂时没有可用的文章分类。</p>`;
                 console.log("[CategoryPage] No tags found.");
                 return;
            }

            sortedTags.forEach(tag => {
                const buttonLink = document.createElement('a');
                // Link navigates to `blog.html` with a URL parameter for filtering
                buttonLink.href = `blog.html?tag=${encodeURIComponent(tag)}`; 
                buttonLink.classList.add('filter-tag-button'); // Reuse styling
                // Check if current button's tag is in URL (e.g. if we came back from blog.html via back button)
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get('tag') === tag) {
                    // buttonLink.classList.add('active'); // You might want active state also visually on categories page
                }
                buttonLink.textContent = ` # ${tag}`;
                buttonLink.dataset.filter = tag; 
                dynamicCategoryList.appendChild(buttonLink);
            });
            console.log(`[CategoryPage] Generated ${sortedTags.length} category links...`);
        }
    };


    // --- Share buttons for article pages ---
    /**
     * Sets up social media share links for blog posts.
     * Dynamically constructs URLs based on current page title and URL.
     */
    const setupShareButtons = () => {
        const shareButtons = document.querySelectorAll('.post-share-buttons a.weibo, .post-share-buttons a.qq');
        if (shareButtons.length === 0) { console.log("[ShareButtons] No share buttons found on this page."); return; } 

        const currentUrl = encodeURIComponent(window.location.href);
        const pageTitle = document.title;
        const articleTitle = encodeURIComponent(pageTitle.split(' - ')[0] || "Honoka的小屋"); // Use part before first ' - ' or default 

        shareButtons.forEach(btn => {
            if (btn.classList.contains('weibo')) {
                btn.href = `https://service.weibo.com/share/share.php?url=${currentUrl}&title=${articleTitle}`;
            } else if (btn.classList.contains('qq')) {
                const imgElement = document.querySelector('.post-detail-banner');
                // Only include image URL in share if it's a real image that loaded successfully, not a fallback or data URL.
                const imgUrl = (imgElement && imgElement.src && !imgElement.classList.contains('is-loading-fallback') && !imgElement.src.startsWith('data:image/')) 
                               ? encodeURIComponent(imgElement.src) 
                               : ''; // Empty string if no valid sharable image
                btn.href = `https://connect.qq.com/widget/shareqq/index.html?url=${currentUrl}&title=${articleTitle}${imgUrl ? '&pics=' + imgUrl : ''}`;
            }
            // console.log(`[ShareButtons] Configured share link for: ${btn.classList}`);
        });
        console.log("[ShareButtons] Initialized.");
    };
    
    /**
     * Manages footer details (dynamic copyright year, backend visitor count)
     * and dynamically adjusts body background blur based on device type (mobile/desktop).
     */
    const setupFooterAndDynamicBlur = () => {
        // Dynamic copyright year
        const currentYearSpan = document.getElementById('current-year');
        if (currentYearSpan) {
            currentYearSpan.textContent = new Date().getFullYear();
            // console.log("[Footer] Copyright year updated.");
        }

        // --- NEW: Backend Visitor Counter ---
        // Fetches updated visitor count from a Netlify Function.
        const visitorCountSpan = document.getElementById('visitor-count');
        if (visitorCountSpan) {
            // Call Netlify Function on page load
            fetch(`${backendBaseUrl}handleVisitCount`, {
                method: 'GET',
                 headers: {
                    'Accept': 'application/json',
                    // The 'Access-Control-Allow-Origin' header is for the *response*, not the request.
                    // Request headers would go here if your backend functions required a specific origin or other custom headers for incoming requests.
                    // For standard GET, no special request headers are often needed.
                 }
            })
                .then(response => {
                    if (!response.ok) { // If HTTP status is not 2xx
                        console.error(`[VisitorCount] Backend responded with HTTP status: ${response.status}`);
                        // Try to parse JSON error message if provided by function
                        return response.json().then(error => { 
                            throw new Error(error.message || `HTTP status ${response.status} from visit count function.`); 
                        });
                    }
                    return response.json(); // Parse successful JSON response
                })
                .then(data => {
                    // Update the displayed count; fallback to 0 if data.count is unexpected
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
                    visitorCountSpan.textContent = '???'; // On error, display clear placeholder
                });
        }

        // Dynamic Background Blur Adjustment for Body (performance/readability)
        /**
         * Adjusts the `backdrop-filter` blur intensity on the `body::before` pseudo-element.
         * Uses CSS custom properties and 'isMobile' flag to apply different blur levels for
         * desktop vs. mobile devices to optimize for performance and legibility.
         */
        const updateBodyBlur = () => {
            // Retrieve blur values from CSS custom properties defined in css/themes.css
            const desktopBlur = getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur').trim();
            const mobileBlur = getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur-mobile').trim();

            isMobile = window.innerWidth <= 767; // Re-evaluate global 'isMobile' flag on each resize
            if (isMobile) { 
                // Set the mutable CSS variable for global blur to the mobile-specific value
                document.documentElement.style.setProperty('--body-global-blur-value', mobileBlur);
                document.body.classList.add('is-mobile'); // Keep 'is-mobile' class on body for responsive CSS styling
            } else {
                document.documentElement.style.setProperty('--body-global-blur-value', desktopBlur);
                document.body.classList.remove('is-mobile'); 
            }
            // console.log(`[Blur] Body blur set to: ${getComputedStyle(document.documentElement).getPropertyValue('--body-global-blur-value')} (isMobile: ${isMobile}).`);
        };
        
        // Initial setup for the global blur variable. Default to desktop value until first resize/evaluation.
        document.documentElement.style.setProperty('--body-global-blur-value', getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur').trim());
        updateBodyBlur(); // Apply blur settings on first page load
        window.addEventListener('resize', updateBodyBlur); // Update blur dynamically on window resize events
        console.log("[Blur] Dynamic background blur feature initialized.");
    }


    // --- Global Feature Initialization Point ---
    // Ensure the order of initialization respects dependencies and desired visual sequencing.
    setupDynamicPostImages(); 
    setupScrollAnimations();
    setupCursorTrail(); // Now initialized much earlier.
    setupBackToTopButton();
    setupReadProgressBar();
    setupMainMenu(); 
    setupShareButtons();
    setupFooterAndDynamicBlur(); 

    // Category/Tag filtering is for blog.html and categories.html, so it runs on relevant pages.
    setupPostCategoryFilters();

    // Debugging: Log script end
    console.log("✅ script.js FINISHED execution.");
});
