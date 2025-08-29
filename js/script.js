document.addEventListener('DOMContentLoaded', () => {
    // CRITICAL FIX: 将 HTMLElement.prototype.classList.containsAny 移动到顶部定义，确保所有函数在调用前都可以访问。
    if (!HTMLElement.prototype.classList.containsAny) { // Add a check to prevent re-defining if it exists (e.g. from extensions)
        HTMLElement.prototype.classList.containsAny = function(classNames) {
            for (let i = 0; i < classNames.length; i++) {
                if (this.classList.contains(classNames[i])) {
                    return true;
                }
            }
            return false;
        };
    }

    console.log("🚀 script.js STARTING execution...");

    let isMobile = window.innerWidth <= 767; 
    const updateIsMobileClass = () => {
        isMobile = window.innerWidth <= 767;
        document.body.classList.toggle('is-mobile', isMobile); 
        // Also update blur immediately on resize
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
        // CRITICAL FIX: Make sure overlay removes visible class properly for first load
        setTimeout(() => { 
            if (pageTransitionOverlay) { // Check if element still exists to avoid null reference error in case of fast page unload
                pageTransitionOverlay.classList.remove('visible');
                // Wait for transition to complete before setting display to 'none' and allowing scroll
                setTimeout(() => { 
                    if (pageTransitionOverlay) pageTransitionOverlay.style.display = 'none';
                    document.body.classList.remove('no-scroll'); 
                }, 500); // Must be slightly shorter or equal to CSS transition duration fade-out
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
        pageTransitionOverlay.style.display = 'flex'; // Make sure it's visible for fade in
        pageTransitionOverlay.classList.add('visible'); // Trigger CSS fade in
        // Allow time for fade-in transition before navigating
        setTimeout(() => { window.location.href = encodeURI(urlToNavigate); }, 400); // Adjust timing with CSS transition duration
        console.log(`[PageTransition] Activating transition to: ${urlToNavigate}`);
    };

    /**
     * Intercepts all internal link clicks to apply a smooth page transition effect.
     */
    document.querySelectorAll('a').forEach(link => {
        let hrefURL;
        try { 
            hrefURL = new URL(link.href, window.location.href); 
        } catch (e) {
            console.warn(`[LinkInterceptor] Invalid URL encountered for link: "${link.href}"`, e);
            return; // Skip invalid links
        }

        // Only intercept internal links that don't target a new tab, mailto, or page anchors.
        if (hrefURL.origin === window.location.origin && 
            hrefURL.protocol !== 'mailto:' && 
            (!hrefURL.hash || hrefURL.pathname !== window.location.pathname) && // Allow hash links to current page to work normally
            !link.getAttribute('href').startsWith('javascript:void(0)')) {
            
            link.addEventListener('click', (e) => {
                if (link.target === '_blank') { // Let target="_blank" links open in new tab normally
                    return; 
                } 
                e.preventDefault(); // Stop default navigation
                activatePageTransition(link.href);
            });
        }
    });

    // ################### IMPORTANT: backendBaseUrl Configuration ###################
    // Honoka, Ensure this is YOUR exact Netlify domain!
    const backendBaseUrl = 'https://honoka1.netlify.app/.netlify/functions/'; 


    // --- Random Anime Wallpaper API for dynamic backgrounds/images ---
    /**
     * Fetches a random anime image from various APIs to apply to backgrounds or image elements.
     * Includes robust error handling, timeouts, and fallbacks to local images and gradient.
     */
    const fetchRandomAnimeImage = async (targetElement, type = 'background', options = { width: 1920, height: 1080 }) => {
        let imageUrl = '';

        const extractImageUrl = async (response, apiDebugName) => {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.startsWith('image/')) {
                // If it's a direct image URL, use URL from response or passed by API
                return response.givenUrl || response.url; 
            } else if (contentType && contentType.includes('json')) { 
                // If JSON response (from APIs like thatpic.cn, waifu.pics etc.)
                const data = await response.json();
                // Check if JSON contains a valid image URL field (e.g., imgurl or url)
                if (data && (data.imgurl || data.url) && typeof (data.imgurl || data.url) === 'string' && (data.imgurl || data.url).match(/\.(jpeg|jpg|gif|png|webp|bmp|avif)$/i)) { 
                    return data.imgurl || data.url;
                }
            }
            console.warn(`[ImageLoader-${apiDebugName}] 🔄 Failed to extract image URL from response. Content-Type: ${contentType}. Trying next API.`);
            return ''; 
        };
        
        // Tuned API Endpoints: Prioritized for stability and anime-specificity.
        // Re-ordered to place more reliable/direct image APIs first.
        const apiEndpoints = [
            `https://iw233.cn/api/Pure.php`,        // Direct image or simple JSON
            `https://api.adicw.cn/img/rand.php`,    // Alternative endpoint, may contain anime or general images.
            // Other potentially reliable API could be tested and added here
        ];

        for (const api of apiEndpoints) {
            const apiDebugName = new URL(api).hostname.split('.').slice(-2).join('.'); 
            try {
                const controller = new AbortController();
                // Significantly shorten timeout for image APIs. If slow, fallback quicker.
                const timeoutId = setTimeout(() => controller.abort(), 4000); // 4-second timeout for each API call
                
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
                    console.warn(`[ImageLoader-${apiDebugName}] ⏱️ Request timed out (4s limit). Applying local fallback. `);
                } else if (innerError instanceof TypeError || innerError instanceof DOMException) {
                   console.warn(`[ImageLoader-${apiDebugName}] 🚫 Network/Fetch error:`, innerError.message, ' Applying local fallback.');
                } else {
                    console.warn(`[ImageLoader-${apiDebugName}] ❌ Unexpected error "${innerError.message}". Applying local fallback.`);
                }
                applyFallbackImage(targetElement, type); // Apply fallback immediately on error/timeout
                return; // Early exit in case of fetch error; no need to try other APIs IF caught by error boundary
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
                } else if (type === 'image') {
                    targetElement.src = imageUrl; 
                    targetElement.style.opacity = '1'; 
                    targetElement.style.objectFit = 'cover'; 
                }
                // Remove fallback specific styles if real image loads
                targetElement.classList.remove('is-loading-fallback'); 
                targetElement.style.filter = ''; 
                // Remove fallback text overlay if it exists
                const fallbackText = targetElement.nextElementSibling;
                if (fallbackText && fallbackText.classList.contains('fallback-text-overlay')) {
                    fallbackText.remove();
                }
                console.log(`[ImageLoader] ✅ Real image from API loaded: ${imageUrl.substring(0, 50)}...`);
            };
            imgToLoad.onerror = () => { 
                console.warn(`[ImageLoader] 🚫 Preloading image "${imageUrl.substring(0, 50)}..." failed after receiving valid URL. Applying local fallback.`);
                applyFallbackImage(targetElement, type); // Fallback if preloading fails *after successful fetch*
            };
        } else { // If NO valid URL from ANY API after all attempts
            console.error('[ImageLoader] ❌ No valid image URL received from any online API. Forcing local fallback.');
            applyFallbackImage(targetElement, type); 
        }
    };
    
    /**
     * Applies local fallback imagery (pngs or random gradients) and a text overlay, for situations where
     * dynamic image loading fails. Provides immediate visual feedback to the user.
     */
    const applyFallbackImage = (targetElement, type, srcOverride = null) => {
        const isThumbnail = targetElement.classList.contains('post-thumbnail');
        // Determine correct fallback image path based on target and its location
        const fallbackFilename = isThumbnail ? 'post-thumbnail-fallback.png' : 'post-detail-banner-fallback.png';
        const baseRelativePath = window.location.pathname.includes('/posts/') ? '../img/' : './img/';
        const localFallbackSrc = srcOverride || `${baseRelativePath}${fallbackFilename}`;
        
        if (type === 'background') {
            document.documentElement.style.setProperty('--bg-image', getRandomGradient());
            console.log(`[ImageLoader] 🖼️ Applied gradient background fallback for body.`);
        } else if (type === 'image') {
            targetElement.src = localFallbackSrc; 
            targetElement.style.objectFit = 'contain'; // Show entire fallback image
            targetElement.classList.add('is-loading-fallback'); // Add special class for fallback styling
            targetElement.style.opacity = '1'; // Ensure it's not hidden if it was meant to fade in
            
            // Apply a direct random gradient background to the image element itself 
            // This is a robust fallback even if the local image path is broken!
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
                     // Ensure parent is positioned to correctly place absolute overlay
                    if (targetElement.parentNode && getComputedStyle(targetElement.parentNode).position === 'static') {
                        targetElement.parentNode.style.position = 'relative'; 
                    }
                    targetElement.parentNode.insertBefore(fallbackTextOverlay, targetElement.nextSibling); // Insert after the image
                    console.log(`[ImageLoader] Overlay created for ${targetElement.alt || 'Unnamed Image Title'}.`);

                    // Second-tier check: if the local fallback image itself is broken, hide the `<img>` tag and show only overlay over gradient.
                    const testLocalImage = new Image();
                    testLocalImage.src = localFallbackSrc;
                    testLocalImage.onload = () => {
                         // If local fallback loads, ensure img is visible and overlay also visible
                         if (targetElement.style.display === 'none') targetElement.style.display = ''; 
                         if (fallbackTextOverlay) fallbackTextOverlay.style.display = 'flex'; 
                    };
                    testLocalImage.onerror = () => {
                        // If local fallback fails, hide img and only show overlay over gradient fallback
                        targetElement.style.display = 'none'; 
                        if (fallbackTextOverlay) fallbackTextOverlay.style.display = 'flex'; 
                        console.warn(`[ImageLoader] 🚫 Local fallback (path: "${localFallbackSrc}") itself failed to load. Displaying only text overlay over gradient.`);
                    };
                } else {
                    fallbackTextOverlay.textContent = isThumbnail ? "封面加载失败 :(" : "图片加载失败 :("; 
                    fallbackTextOverlay.style.display = 'flex'; 
                }
            }
             console.log(`[ImageLoader] 🎨 Applied local fallback mechanism with overlay for: ${targetElement.alt || type}`);
        }
    };
    
    /**
     * Generates a random, visually distinctive linear gradient string for use as a background.
     */
    function getRandomGradient() {
        // Adjust these values to get preferred visual "dreamy" range
        const h1 = Math.floor(Math.random() * 360); // Hue 1 (0-360)
        const h2 = (h1 + 60 + Math.floor(Math.random() * 60)) % 360; // Hue 2, offset from h1
        const s = Math.floor(Math.random() * 30) + 70; // Saturation (70-99%)
        const l = Math.floor(Math.random() * 20) + 50; // Lightness (50-69%)
        return `linear-gradient(135deg, hsla(${h1}, ${s}%, ${l}%, 0.7), hsla(${h2}, ${s}%, ${l}%, 0.7))`;
    }

    // --- Global Background Image Setup (for Body) ---
    fetchRandomAnimeImage(document.body, 'background'); // { width: 1920, height: 1080 } already default
    console.log("[Background] Dynamic body background initiated.");


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
     * Initializes elements with entrance (fade-in, slide-up) animations if they are in viewport.
     * Includes more robust manual triggers for critical homepage/header elements.
     */
    const setupScrollAnimations = () => {
        // Observer for generic elements with `animate__` classes except for hero section elements handled separately
        const animatedElements = document.querySelectorAll('.animate__fade-in:not(.hero-content):not(.hero-subtitle):not(.hero-nav), .animate__slide-up:not(.hero-content):not(.hero-subtitle):not(.hero-nav)');
        console.log(`[Animations] Found ${animatedElements.length} scroll-animated generic elements to observe.`);

        const observer = new IntersectionObserver((entries, observerInstance) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('is-visible')) {
                    const delay = parseInt(entry.target.dataset.delay || '0');
                    setTimeout(() => { 
                        entry.target.classList.add('is-visible');
                         // For elements that are not designated for looping animation (like homepage title)
                        const isLooper = entry.target.closest('.is-homepage-title') || entry.target.closest('.is-header-title');
                        if (!isLooper && entry.target.classList.containsAny(['animate__fade-in', 'animate__slide-up'])) { 
                            observerInstance.unobserve(entry.target); // Unobserve once animated, if not a looping element
                        }
                        
                        // For paragraphs and lists inside standard content wrappers on non-homepage pages, trigger their entrance
                        // Ensure it's not already handled by another animate class to avoid double-triggers
                        if (!document.body.classList.contains('is-homepage') && entry.target.closest('main.container.content-page-wrapper')) {
                            entry.target.querySelectorAll('p:not(.post-excerpt):not(.form-hint):not(.no-comments-message):not([class*="animate__"]), ul:not([class*="animate__"]), ol:not([class*="animate__"])').forEach((child, index) => {
                                if(!child.classList.contains('is-visible')){
                                    // Apply cascading delay for a smooth flow-in
                                    child.style.transitionDelay = `${(index * 50) + 100}ms`; 
                                    child.classList.add('is-visible');
                                    // Clear the dynamically set delay after the animation to ensure normal responsiveness
                                    setTimeout(() => child.style.transitionDelay = '', (index * 50) + 100 + 500); // 500ms is example transition duration
                                }
                            });
                        }
                    }, delay);
                } 
            });
        }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }); // Adjusted rootMargin

        animatedElements.forEach(el => observer.observe(el));

        // Force visibility for the main header early
        const header = document.querySelector('.main-header');
        if (header && !header.classList.contains('is-visible')) {
            setTimeout(() => header.classList.add('is-visible'), 50); 
            console.log("[Animations] Main header force-visible.");
        }

        // Force visibility for the main content wrapper on non-homepage pages
        const contentWrapper = document.querySelector('main.container.content-page-wrapper');
        if (contentWrapper && !document.body.classList.contains('is-homepage') && !contentWrapper.classList.contains('is-visible')) {
            setTimeout(() => contentWrapper.classList.add('is-visible'), 150); // A slight delay after header
            console.log("[Animations] Main content wrapper force-fade-in ensured.");
        }

        // ---------- FORCE FIX FOR HOMEPAGE SUBTITLE & NAV BUTTONS NOT SHOWING ----------
        // These are outside the observer generally, or need explicit triggers
        if (document.body.classList.contains('is-homepage')) {
            const heroContent = document.querySelector('.hero-content'); 
            if (heroContent && !heroContent.classList.contains('is-visible')) {
                setTimeout(() => heroContent.classList.add('is-visible'), 100);
            }
            const homepageAnimElements = document.querySelectorAll('.hero-subtitle[data-delay], .hero-nav[data-delay]');
            homepageAnimElements.forEach(el => {
                if (!el.classList.contains('is-visible')) { // Only animate if not already visible
                    const delay = parseInt(el.dataset.delay || '0');
                    // Add delay starting after parent heroContent appears.
                    setTimeout(() => {
                        el.classList.add('is-visible'); 
                        console.log(`[Animations] Homepage element force-animated: ${el.tagName} (delay: ${delay}ms)`);
                    }, delay + (heroContent ? 150 : 0)); 
                }
            });
            console.log("[Animations] Homepage core elements visibility ensured with explicit JS triggers.");
        }
        else { // For non-homepage content, animate sections directly if they haven't been in view
            document.querySelectorAll('.about-me-section, .comment-section, .categories-section').forEach(section => {
                if(!section.classList.contains('is-visible')) {
                    const delay = parseInt(section.dataset.delay || '0');
                    setTimeout(() => {
                        section.classList.add('is-visible'); 
                        // Also trigger animations for children with data-delay within these sections
                        section.querySelectorAll('[data-delay]:not(.is-visible)').forEach(child => { 
                            if (child !== section && !child.classList.contains('is-visible')) {
                                const childDelay = parseInt(child.dataset.delay || '0'); 
                                child.style.transitionDelay = `${delay + 100 + childDelay}ms`; 
                                setTimeout(() => { 
                                    child.classList.add('is-visible'); 
                                    setTimeout(() => child.style.transitionDelay = '', delay + 100 + childDelay + 500); 
                                }, delay + 100 + childDelay);
                            }
                        });
                    }, delay + 100); 
                }
            });
        }
        // Force avatar, contact info, post content visible once their respective parents are visible
        document.querySelectorAll('.my-avatar, .contact-info, .post-content, .post-share-buttons, .read-more, .post-detail-title, .post-meta, .post-detail-banner').forEach(el => {
            const delay = parseInt(el.dataset.delay || '0');
            setTimeout(() => { 
                if (!el.classList.contains('is-visible')) { 
                    el.classList.add('is-visible'); 
                }
            }, delay + 200); // Slight extra delay for content elements
        });
    };


    // --- Back to Top Button ---
    const setupBackToTopButton = () => {
        const btn = document.getElementById('back-to-top');
        if (!btn) { console.log("[BackToTop] Button element not found. Feature disabled."); return; }

        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) { btn.classList.add('show'); } 
            else { btn.classList.remove('show'); }
        });

        btn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
        // Initial check for 'show' class in case page is loaded below 300px scroll
        if (window.scrollY > 300) { btn.classList.add('show'); }
        console.log("[BackToTop] Button initialized.");
    };
    
    // --- Custom Cursor Trail Effect for Desktop ---
    const setupCursorTrail = () => {
        const cursorDot = document.getElementById('cursor-trail');
        if (!cursorDot || isMobile) { 
            if (cursorDot) cursorDot.style.display = 'none'; // Hide if on mobile or element missing
            document.body.style.cursor = 'auto'; // Revert to default cursor
            console.log(`[CursorTrail] Disabled for ${isMobile ? 'mobile' : 'missing element/compatibility'}.`);
            return;
        }
        
        try {
            window.addEventListener('mousemove', e => {
                // Main cursor dot follows mouse
                cursorDot.style.left = `${e.clientX}px`;
                cursorDot.style.top = `${e.clientY}px`;

                // Create and animate a trail dot
                let trail = document.createElement('div');
                trail.className = 'cursor-trail-dot';
                document.body.appendChild(trail); 
                trail.style.left = `${e.clientX}px`;
                trail.style.top = `${e.clientY}px`;
                
                // Remove trail dot after its animation
                setTimeout(() => { 
                    if (trail.parentNode) { trail.parentNode.removeChild(trail); }
                }, 500); // Matches CSS animation duration
            });

            // Interactive hover effects for clickable elements
            document.querySelectorAll('a, button, input:not([type="submit"]), textarea, .post-card, .menu-toggle, .main-nav a, .filter-tag-button').forEach(el => { 
                el.onmouseenter = () => { 
                    cursorDot.style.transform = 'translate(-50%,-50%) scale(1.5)'; // Enlarge and change color
                    cursorDot.style.backgroundColor = 'var(--secondary-color)';
                };
                el.onmouseleave = () => { 
                    cursorDot.style.transform = 'translate(-50%,-50%) scale(1)'; // Revert size and color
                    cursorDot.style.backgroundColor = 'var(--primary-color)';
                };
            });
            setTimeout(() => cursorDot.style.opacity = '1', 100); // Initial fade in for cursor
            console.log("[CursorTrail] Initialized for desktop.");
        } catch (error) {
            console.error("[CursorTrail] Error during initialization:", error);
            document.body.style.cursor = 'auto'; 
            if (cursorDot) cursorDot.style.display = 'none'; 
        }
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
           // Total scrollable height of the document
           const documentHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight);
            const windowHeight = window.innerHeight;
            const scrollRange = documentHeight - windowHeight; // Total scroll distance available
            const currentScrollPosition = window.scrollY; 

            // Calculate progress as a percentage
            let readProgress = (currentScrollPosition / scrollRange) * 100;
            readProgress = Math.min(100, Math.max(0, readProgress)); // Clamp value between 0 and 100

            progressBar.style.width = readProgress + '%'; 
        }

        window.addEventListener('scroll', calculateProgress);
        window.addEventListener('resize', calculateProgress); // Recalculate on window resize
        setTimeout(calculateProgress, 500); // Initial calculation after a short delay
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

        // Close menu manually when an internal menu link is clicked
        mainNav.querySelectorAll('input:not([type="submit"]), textarea, a').forEach(link => { // Include input/textarea if dynamically added
            let hrefURL;
            try { 
                hrefURL = new URL(link.href || 'javascript:void(0)', window.location.href); // Handle links without href
            } 
            catch (e) {
                 link.addEventListener('click', closeMenu); // If link has invalid URL, fallback to just close menu
                 return; 
            }
            // For internal links that use page transitions, delay menu close slightly to match transition
            if (hrefURL.origin === window.location.origin && hrefURL.protocol !== 'mailto:' && hrefURL.hash === '') {
                link.addEventListener('click', () => { setTimeout(() => { closeMenu(); }, 400); });
            } else { // For external or hash links (same-page links)
                link.addEventListener('click', closeMenu); 
            } 
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
        // This ensures categories are exhaustive even if user enters URL directly without navigating from home
        const allTags = new Set();
        // Use a broader selector if post-cards exist on other pages as well, or restrict to blog page with `document.querySelector('#all-posts-grid .post-card')`
        document.querySelectorAll('.post-card').forEach(post => { 
            const tagsAttr = post.dataset.tags; 
            if (tagsAttr) { tagsAttr.split(',').map(tag => tag.trim()).forEach(tag => allTags.add(tag)); }
        });
        
        // Part 1: Interactive filtering on 'blog.html'
        // This logic will run only if the elements exist on the current page.
        if (categoryFiltersContainer && blogPostsGrid) {
            let allButton = categoryFiltersContainer.querySelector('[data-filter="all"]');
             if (!allButton) { // Create 'All Articles' button if not already present
                allButton = document.createElement('button');
                allButton.classList.add('filter-tag-button');
                allButton.textContent = `全部文章`;
                allButton.dataset.filter = 'all';
                categoryFiltersContainer.prepend(allButton); 
            }
            allButton.addEventListener('click', () => filterPosts('all', allButton));

            const sortedTags = Array.from(allTags).sort((a,b) => a.localeCompare(b, 'zh-CN')); // Sort tags alphabetically
            sortedTags.forEach(tag => {
                if (!categoryFiltersContainer.querySelector(`[data-filter="${tag}"]`)) { // Add button if it doesn't exist
                    const button = document.createElement('button');
                    button.classList.add('filter-tag-button');
                    button.textContent = ` #${tag}`; 
                    button.dataset.filter = tag; 
                    categoryFiltersContainer.appendChild(button);
                    button.addEventListener('click', () => filterPosts(tag, button));
                }
            });

            // Function to perform filtering
            const filterPosts = (filterTag, clickedButton = null) => {
                // Deactivate all filter buttons, then activate the clicked one
                categoryFiltersContainer.querySelectorAll('.filter-tag-button').forEach(btn => { btn.classList.remove('active'); });
                if (clickedButton) { clickedButton.classList.add('active'); } 
                else if (filterTag === 'all' && allButton) { allButton.classList.add('active'); } // If filter 'all' is called without a button, activate the 'all' button

                blogPostsGrid.querySelectorAll('.post-card').forEach(post => { 
                    const tagsAttr = post.dataset.tags;
                    if (!tagsAttr) { // Handle posts with no tags
                        post.style.display = (filterTag === 'all') ? 'block' : 'none'; 
                        return;
                    }
                    const postTags = tagsAttr.split(',').map(tag => tag.trim()); // Split tags string into an array

                    if (filterTag === 'all' || postTags.includes(filterTag)) { 
                        post.style.display = 'block'; 
                    } else {
                        post.style.display = 'none'; 
                    }
                });
                console.log(`[CategoryFilter] Applied filter: "${filterTag}".`);
            };

            // Check URL for initial tag filtering when loaded from categories.html or direct link
            const urlParams = new URLSearchParams(window.location.search);
            const initialTag = urlParams.get('tag'); 
            if (initialTag) {
                const initialButton = categoryFiltersContainer.querySelector(`[data-filter="${initialTag.trim()}"]`); 
                if(initialButton) {
                    filterPosts(initialTag.trim(), initialButton); 
                } else { // If initial tag from URL does not exist, filter all
                    filterPosts('all', allButton); 
                }
            } else { // Default to showing all posts
                filterPosts('all', allButton); 
            }
            console.log("[CategoryFilter] Interactive filters initialized on blog page.");
        }
        
        // Part 2: Generating category links on 'categories.html'
        if (isCategoriesPage && dynamicCategoryList) {

            dynamicCategoryList.innerHTML = ''; // Clear existing content

            const sortedTags = Array.from(allTags).sort((a,b) => a.localeCompare(b, 'zh-CN')); // Sort tags alphabetically
            if (sortedTags.length === 0) { 
                 dynamicCategoryList.innerHTML = `<p class="no-comments-message is-visible">暂时没有可用的文章分类。</p>`; 
                 return;
            }

            sortedTags.forEach((tag, index) => {
                const buttonLink = document.createElement('a'); // Use <a> for navigatable buttons
                buttonLink.href = `blog.html?tag=${encodeURIComponent(tag)}`; // Link to blog page with tag filter
                buttonLink.classList.add('filter-tag-button', 'animate__slide-up'); // Ensure animations
                buttonLink.textContent = ` # ${tag}`;
                            buttonLink.setAttribute('aria-label', `查看所有分类为 ${tag} 的文章`);

                buttonLink.dataset.filter = tag; 
                buttonLink.dataset.delay = String(index * 50); // Stagger animations
                dynamicCategoryList.appendChild(buttonLink);
                // Explicitly add is-visible with delay for proper entrance animation, as observer might be too late
                setTimeout(() => buttonLink.classList.add('is-visible'), (index * 50) + 100); 
            });
            console.log(`[CategoryPage] Generated ${sortedTags.length} category links.`);
             // Ensure parent content container is also visible for animations
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
            } else if (btn.classList.contains('qq')) {
                // Get article banner image for QQ share if available
                const imgElement = document.querySelector('.post-detail-banner');
                const imgUrl = (imgElement && imgElement.src && !imgElement.classList.contains('is-loading-fallback') && !imgElement.src.startsWith('data:image/')) 
                               ? encodeURIComponent(imgElement.src) : '';
                btn.href = `https://connect.qq.com/widget/shareqq/index.html?url=${currentUrl}&title=${articleTitle}${imgUrl ? '&pics=' + imgUrl : ''}`;
            }
        });
        console.log("[ShareButtons] Share buttons initialized.");
    };
    
    // --- Footer dynamic details and Dynamic Blur Adjustment for Body (includes Backend Visitor Count) ---
    const setupFooterAndDynamicBlur = () => {
        // Set current year in footer
        const currentYearSpan = document.getElementById('current-year');
        if (currentYearSpan) { currentYearSpan.textContent = new Date().getFullYear(); }

        // --- Backend Visitor Counter ---
        const visitorCountSpan = document.getElementById('visitor-count');
        if (visitorCountSpan) {
            fetch(`${backendBaseUrl}handleVisitCount`, {
                method: 'GET',
                 headers: { 'Accept': 'application/json' }
            })
                .then(response => {
                    if (!response.ok && response.status !== 500) { // Handle non-500 HTTP errors
                        return response.json().then(error => { throw new Error(error.message || `HTTP ${response.status}.`); }).catch(() => {
                           throw new Error(`HTTP ${response.status}: Failed to parse error response.`);
                        }); 
                    }
                    if (!response.ok && response.status === 500) { // Handle explicit 500 errors from backend functions
                         return response.json().then(error => { // Always try to parse JSON, even for 500
                             console.error('[VisitorCount] Backend 500 error response:', error);
                             throw new Error(error.message || error.error || 'Server Internal Error while fetching count.');
                         }).catch(err => { 
                            console.error('[VisitorCount] Backend 500 error (cannot parse JSON or other issue):', err);
                            throw new Error(`HTTP ${response.status}: Failed to parse response.`);
                         });
                    }
                    return response.json(); // If OK (status 200)
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
                    console.error('[VisitorCount] Failed to retrieve or update visitor count from frontend fetch:', error, '. You likely have a backend configuration error (e.g., Firebase key) or Netlify Function deployment problem.');
                    visitorCountSpan.textContent = '???'; // Indicate failure
                });
        }
        // Dynamic Background Blur Adjustment based on device type
        const updateBodyBlur = () => {
            const desktopBlur = getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur').trim();
            const mobileBlur = getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur-mobile').trim(); 
            isMobile = window.innerWidth <= 767; 
            document.documentElement.style.setProperty('--body-global-blur-value', isMobile ? mobileBlur : desktopBlur);
            document.body.classList.toggle('is-mobile', isMobile); // Add/remove 'is-mobile' class for CSS targeting
        };
        
        // Initial setup for blur
        document.documentElement.style.setProperty('--body-global-blur-value', getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur').trim());
        updateBodyBlur(); // Apply initial blur based on window size
        console.log("[Blur] Dynamic background blur feature initialized.");

        // Force footer visibility
        const footer = document.querySelector('.main-footer');
        if(footer && !footer.classList.contains('is-visible')){
            setTimeout(() => footer.classList.add('is-visible'), 500); 
            console.log("[Footer] Force-visibity ensured.");
        }
    }


    // --- Global Feature Initialization Point ---
    // Note: Order matters for dependencies.
    setupDynamicPostImages(); // Affects backgrounds, so it may need to happen early
    setupCursorTrail(); // Cursor trail needs immediate attention (desktop-only feature)
    setupScrollAnimations(); // Sets up all entrance animations globally
    setupBackToTopButton(); // Back-to-top can be independent
    setupReadProgressBar(); // Read progress bar is page-specific but depends on scroll
    setupMainMenu(); // Menu setup should happen early to be interactive
    setupShareButtons(); // Share buttons are loaded on article pages
    setupFooterAndDynamicBlur(); // Footer elements and blur adjustment; blur might get overridden later, needs to be after others.
    setupPostCategoryFilters(); // This should be able to run at any time after DOM is ready

    console.log("✅ script.js FINISHED execution.");
});
