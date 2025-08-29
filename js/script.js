document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 script.js STARTING execution...");

    let isMobile = window.innerWidth <= 767; 
    const updateIsMobileClass = () => {
        isMobile = window.innerWidth <= 767;
        document.body.classList.toggle('is-mobile', isMobile); // Use toggle for robustness
    };
    updateIsMobileClass(); 
    // Event listener for resize *after* initial definition, ensures it's attached only once.
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
        // Initially hide overlay after page loads, with a guaranteed slight delay.
        setTimeout(() => { 
            if (pageTransitionOverlay) { 
                pageTransitionOverlay.classList.remove('visible');
                // Ensure scroll is re-enabled _after_ the visual transition completes.
                setTimeout(() => { 
                    if (pageTransitionOverlay) pageTransitionOverlay.style.display = 'none';
                    document.body.classList.remove('no-scroll'); 
                }, 500); // Matches CSS transition duration
            }
        }, 100); 
        console.log("[PageTransition] Overlay initialized.");
    }

    /**
     * Triggers a smooth page transition overlay and then navigates to the target URL.
     * @param {string} urlToNavigate - The URL to navigate to after the transition.
     */
    const activatePageTransition = (urlToNavigate) => {
        if (!pageTransitionOverlay) { window.location.href = urlToNavigate; return; }
        document.body.classList.add('no-scroll'); 
        pageTransitionOverlay.style.display = 'flex'; // Make sure overlay is a flex container
        pageTransitionOverlay.classList.add('visible'); // Trigger CSS fade-in
        setTimeout(() => { window.location.href = encodeURI(urlToNavigate); }, 400); // Navigate after CSS transition
        console.log(`[PageTransition] Activating transition to: ${urlToNavigate}`);
    };

    /**
     * Intercepts all internal link clicks to apply a smooth page transition.
     */
    document.querySelectorAll('a').forEach(link => {
        let hrefURL;
        try { // Robust parsing of URLs
            hrefURL = new URL(link.href, window.location.href); 
        } catch (e) {
            console.warn(`[LinkInterceptor] Invalid URL encountered for link: "${link.href}"`, e);
            return; // Skip and log invalid links
        }

        // Conditions to intercept: same origin, not mailto, not fragment (#hash), not a javascript:void(0) link
        if (hrefURL.origin === window.location.origin && 
            hrefURL.protocol !== 'mailto:' && 
            hrefURL.hash === '' && 
            !link.getAttribute('href').startsWith('javascript:void(0)')) {
            
            link.addEventListener('click', (e) => {
                if (link.target === '_blank') { return; } // Exclude target="_blank"
                e.preventDefault(); 
                activatePageTransition(link.href);
            });
        }
    });

    // ################### IMPORTANT: backendBaseUrl Configuration ###################
    // !!! Replace with YOUR ACTUAL NETLIFY SITE'S DOMAIN !!!
    // This value must exactly match your deployed Netlify frontend domain.
    // Example: 'https://honoka1.netlify.app/.netlify/functions/' (if your site is honoka1.netlify.app)
    const backendBaseUrl = 'https://honoka1.netlify.app/.netlify/functions/'; // <-- Honoika, Please confirm this is YOUR correct domain!


    // --- Random Anime Wallpaper API for dynamic backgrounds/images ---
    /**
     * Fetches a random anime image from various APIs to apply to backgrounds or image elements.
     * Includes robust error handling, timeouts, and fallbacks to local images and gradient.
     * @param {HTMLElement} targetElement - The DOM element to receive the image (e.g., document.body or an `<img>`).
     * @param {string} type - 'background' to set `body.background-image`, or 'image' to set `img.src`.
     * @param {object} options - Optional parameters like width & height hints for certain APIs.
     */
    const fetchRandomAnimeImage = async (targetElement, type = 'background', options = { width: 1920, height: 1080 }) => {
        let imageUrl = '';
        const { width, height } = options; 

        // Helper: Extracts a valid image URL from diverse JSON API responses.
        const extractImageUrl = async (response, apiDebugName) => {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.startsWith('image/')) {
                return response.givenUrl || response.url; // Direct image URL
            } else if (contentType && contentType.includes('json')) { 
                const data = await response.json();
                if (data && (data.imgurl || data.url) && typeof (data.imgurl || data.url) === 'string' && (data.imgurl || data.url).match(/\.(jpeg|jpg|gif|png|webp|bmp|avif)$/i)) { 
                    return data.imgurl || data.url;
                }
            }
            console.warn(`[ImageLoader-${apiDebugName}] 🔄 Failed to extract image URL from response. Content-Type: ${contentType}. Trying next API if available.`);
            return ''; 
        };
        
        // Tuned API Endpoints: Prioritized for stability and anime-specificity based on previous tests.
        // Removed APIs that consistently failed or were too slow in previous iterations.
        const apiEndpoints = [
            `https://iw233.cn/api/Pure.php`,                             // Known as a high-quality, reliable anime image source.
            `https://api.adicw.cn/img/rand`,                            // Another generally stable source for anime images.
            // Further APIs can be added here if stability/variety is an issue, after individual testing.
        ];

        // Sequential fetching from APIs
        for (const api of apiEndpoints) {
            const apiDebugName = new URL(api).hostname.split('.').slice(-2).join('.'); 
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout for each API call
                
                const response = await fetch(api, { method: 'GET', redirect: 'follow', signal: controller.signal, headers: { 'Accept': 'image/*,application/json' } });
                clearTimeout(timeoutId);

                if (response.ok) {
                    imageUrl = await extractImageUrl(response, apiDebugName);
                    if (imageUrl) { break; } // Success: Found image, break loop
                } else {
                    console.warn(`[ImageLoader-${apiDebugName}] ⚠️ API responded with HTTP status ${response.status}. Trying next.`);
                }
            } catch (innerError) {
                if (innerError.name === 'AbortError') {
                    console.warn(`[ImageLoader-${apiDebugName}] ⏱️ Request timed out (8s limit). Trying next.`);
                } else if (innerError instanceof TypeError || innerError instanceof DOMException) {
                   console.warn(`[ImageLoader-${apiDebugName}] 🚫 Network/Fetch error:`, innerError.message);
                } else {
                    console.warn(`[ImageLoader-${apiDebugName}] ❌ Unexpected error:`, innerError);
                }
            }
        }
        
        // --- Image Preloading and Application Logic ---
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
                    targetElement.style.objectFit = 'cover'; // Normal sizing for a loaded image
                }
                // Clear any fallback styles/elements when the real image successfully loads
                targetElement.classList.remove('is-loading-fallback'); 
                targetElement.style.filter = ''; 
                const fallbackText = targetElement.nextElementSibling;
                if (fallbackText && fallbackText.classList.contains('fallback-text-overlay')) {
                    fallbackText.remove();
                }
            };
            imgToLoad.onerror = () => { 
                console.warn(`[ImageLoader] 🚫 Preloading image "${imageUrl.substring(0, 50)}..." failed (corrupted or invalid URL after fetch). Applying local fallback.`);
                applyFallbackImage(targetElement, type); 
            };
        } else { // No valid URL received from any API
            console.error('[ImageLoader] ❌ All online APIs failed to provide a valid image URL. Forcing initial local fallback.');
            applyFallbackImage(targetElement, 'image'); // Ensure 'image' fallback applies when directly on an img element
        }
    };
    
    /**
     * Applies local fallback imagery (pngs or random gradients) and a text overlay, for situations where
     * dynamic image loading fails. Provides immediate visual feedback to the user.
     * @param {HTMLElement} targetElement - The DOM element (e.g., an `<img>`) to apply fallback styles/content to.
     * @param {string} type - 'background' (for `--bg-image` CSS var) or 'image' (for `<img>` src).
     * @param {string|null} srcOverride - Optional direct path to a specific local fallback image.
     */
    const applyFallbackImage = (targetElement, type, srcOverride = null) => {
        const isThumbnail = targetElement.classList.contains('post-thumbnail');
        const fallbackSuffix = isThumbnail ? 'post-thumbnail-fallback.png' : 'post-detail-banner-fallback.png';
        const baseRelativePath = window.location.pathname.includes('/posts/') ? '../img/' : './img/';
        const localFallbackSrc = srcOverride || `${baseRelativePath}${fallbackSuffix}`;
        
        if (type === 'background') {
            document.documentElement.style.setProperty('--bg-image', getRandomGradient());
            console.log(`[ImageLoader] 🖼️ Applied gradient background fallback for body.`);
        } else if (type === 'image') {
            targetElement.src = localFallbackSrc; 
            targetElement.style.objectFit = 'contain'; 
            targetElement.classList.add('is-loading-fallback'); 
            targetElement.style.opacity = '1'; 
            
            // As a robust fallback, also apply a random gradient background directly to the image element
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

                    // Second-tier check: if the local fallback image itself is broken, hide the `<img>` tag and show only overlay over gradient.
                    // This handles situations where img/post-thumbnail-fallback.png might be missing or corrupted.
                    const testLocalImage = new Image();
                    testLocalImage.src = localFallbackSrc;
                    testLocalImage.onload = () => {
                         if (targetElement.style.display === 'none') targetElement.style.display = ''; 
                         if (fallbackTextOverlay) fallbackTextOverlay.style.display = 'flex'; 
                        //  console.log(`[ImageLoader] Local fallback image "${localFallbackSrc}" loaded okay.`);
                    };
                    testLocalImage.onerror = () => {
                        targetElement.style.display = 'none'; 
                        if (fallbackTextOverlay) fallbackTextOverlay.style.display = 'flex'; 
                        console.warn(`[ImageLoader] 🚫 Local fallback (path: "${localFallbackSrc}") itself failed to load. Displaying only text overlay over gradient.`);
                    };
                  
                } else {
                    fallbackTextOverlay.textContent = isThumbnail ? "封面加载失败 :(" : "图片加载失败 :("; 
                    fallbackTextOverlay.style.display = 'flex'; 
                    // console.log(`[ImageLoader] Updated existing overlay for ${targetElement.alt || 'Unnamed Image Title'}.`);
                }
            }
             console.log(`[ImageLoader] 🎨 Applied local fallback mechanism with overlay for: ${targetElement.alt || type}`);
        }
    };
    
    /**
     * Generates a random, visually distinctive linear gradient string for use as a background.
     * HSL color space is used for vibrant and good-looking combinations.
     * @returns {string} A CSS `linear-gradient` value.
     */
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
     * Initializes elements with entrance (fade-in, slide-up) animations if they are in viewport.
     * Includes a more robust manual trigger for critical homepage elements, reducing reliance on IO.
     * Ensures CSS `is-visible` classes are applied to enable transitions.
     */
    const setupScrollAnimations = () => {
        // Selector for all elements that need entrance animation (generalized)
        const animatedElements = document.querySelectorAll('.animate__fade-in:not(.hero-content):not(.hero-subtitle):not(.hero-nav), .animate__slide-up:not(.hero-content):not(.hero-subtitle):not(.hero-nav)');
        console.log(`[Animations] Found ${animatedElements.length} scroll-animated generic elements to observe.`);

        // Intersection Observer for off-screen elements that come into view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // To avoid redundant animations if CSS already makes it visible or other JS has handled it.
                if (entry.isIntersecting && !entry.target.classList.contains('is-visible')) {
                    const delay = parseInt(entry.target.dataset.delay || '0');
                    setTimeout(() => { // Apply animation after a potential delay
                        // Mark as visible and unobserve if it's a one-time animation
                        entry.target.classList.add('is-visible');
                        // console.log(`[Animations] Element animated via IO: ${entry.target.tagName} (#${entry.target.id || ''}.${Array.from(entry.target.classList).filter(c => !c.startsWith('animate__')).join('.')})`);
                        
                        // Prevent unobserving always-on animated items (like header title)
                        const isLooper = entry.target.closest('.is-homepage-title') || entry.target.closest('.is-header-title');
                        if (!isLooper && entry.target.classList.containsAny(['animate__fade-in', 'animate__slide-up'])) { // Check if it's a transition controlled by us
                            observer.unobserve(entry.target);
                        }
                    }, delay);
                } 
            });
        }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }); // `rootMargin` to trigger animations slightly earlier

        animatedElements.forEach(el => observer.observe(el));


        // CRITICAL FIX: Ensure main layout components and homepage elements are _always_ visibly guaranteed.
        // We ensure critical components become visible even if IO fails or is delayed.
        const header = document.querySelector('.main-header');
        if (header && !header.classList.contains('is-visible')) {
            setTimeout(() => header.classList.add('is-visible'), 50); // Small initial delay for header fade-in
            console.log("[Animations] Main header force-visible.");
        }

        const contentWrapper = document.querySelector('main.container.content-page-wrapper');
        if (contentWrapper && !contentWrapper.classList.contains('is-visible')) {
            // Apply a slight delay to the main content container's fade-in if it exist without is-homepage class
            setTimeout(() => contentWrapper.classList.add('is-visible'), 150); 
            console.log("[Animations] Main content wrapper force-fade-in ensured.");
        }


        // ---------- FIX FOR HOMEPAGE SUBTITLE & NAV BUTTONS NOT SHOWING ----------
        // Specifically for the homepage hero section's direct children.
        // These are guaranteed to be in view, so we trigger their 'is-visible' directly with their specified data-delay.
        if (document.body.classList.contains('is-homepage')) {
            const heroContent = document.querySelector('.hero-content'); // Main wrapper for homepage content
            if (heroContent && !heroContent.classList.contains('is-visible')) {
                setTimeout(() => heroContent.classList.add('is-visible'), 100);
            }

            const homepageAnimElements = document.querySelectorAll('.hero-subtitle[data-delay], .hero-nav[data-delay]');
            homepageAnimElements.forEach(el => {
                if (!el.classList.contains('is-visible')) { // Only animate if not already visible (e.g., from initial static CSS)
                    const delay = parseInt(el.dataset.delay || '0');
                    setTimeout(() => {
                        el.classList.add('is-visible'); // Add the magic class
                       console.log(`[Animations] Homepage element force-animated: ${el.tagName} (delay: ${delay}ms)`);
                    }, delay + (heroContent ? 150 : 0)); // Extra buffer if parent has its own animation too
                }
            });
            console.log("[Animations] Homepage core elements visibility ensured with explicit JS triggers.");
        }
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
        if (window.scrollY > 300) { btn.classList.add('show'); }
        console.log("[BackToTop] Button initialized.");
    };
    
    // --- Custom Cursor Trail Effect for Desktop ---
    const setupCursorTrail = () => {
        const cursorDot = document.getElementById('cursor-trail');
        if (!cursorDot || isMobile) { 
            if (cursorDot) cursorDot.style.display = 'none'; 
            document.body.style.cursor = 'auto'; // Ensure fallback to default system cursor on mobile or if element missing
            console.log(`[CursorTrail] Disabled for ${isMobile ? 'mobile' : 'missing element'} or browser compatibility mode.`);
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
            // Initial opacity set high after setup
            setTimeout(() => cursorDot.style.opacity = '1', 100); 
            console.log("[CursorTrail] Initialized for desktop.");
        } catch (error) {
            console.error("[CursorTrail] Error during initialization:", error);
            document.body.style.cursor = 'auto'; 
            if (cursorDot) cursorDot.style.display = 'none'; 
        }
    };

    /**
     * Initializes the read progress bar for article detail pages.
     * Uses scroll events to update a visual progress bar fixed at the top of the viewport.
     */
    const setupReadProgressBar = () => {
        const progressBar = document.getElementById('read-progress-bar');
        const content = document.querySelector('.blog-post-detail'); 
        if (!progressBar || !content) { console.log("[ReadProgressBar] Not an article page or elements not found. Feature skipped."); return; } 

        const calculateProgress = () => {
           const documentHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight);
            const windowHeight = window.innerHeight;
            const scrollRange = documentHeight - windowHeight; // Total distance user can scroll
            const currentScrollPosition = window.scrollY; 

            let readProgress = (currentScrollPosition / scrollRange) * 100;
            readProgress = Math.min(100, Math.max(0, readProgress)); // Clamp value between 0 and 100

            progressBar.style.width = readProgress + '%'; // Update width based on progress
        }

        window.addEventListener('scroll', calculateProgress);
        window.addEventListener('resize', calculateProgress); 
        setTimeout(calculateProgress, 500); // Initial calculation after a slight delay
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
            console.warn('[MainMenu] Menu (toggle, nav/panel, or close button) elements not found. Menu features disabled.');
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
            let hrefURL;
            try { hrefURL = new URL(link.href, window.location.href); } 
            catch (e) {
                 link.addEventListener('click', closeMenu); // Fallback to just close menu for malformed/external links
                 return; 
            }
            if (hrefURL.origin === window.location.origin && hrefURL.protocol !== 'mailto:' && hrefURL.hash === '') {
                // For internal links that trigger transitions, delay menu close slightly
                link.addEventListener('click', () => { setTimeout(() => { closeMenu(); }, 400); });
            } else { link.addEventListener('click', closeMenu); } // Direct close for external/hash links
        });

        // Close menu on clicks outside
        document.body.addEventListener('click', (event) => {
            if (mainNav.classList.contains('is-open') && !mainNav.contains(event.target) && !menuToggle.contains(event.target) ) {
                closeMenu();
                // console.log("[MainMenu] Click detected outside menu (body). Shutting down menu.");
            }
        });
        console.log("[MainMenu] Navigation menu initialized.");
    };


    // ################### NEW FEATURE: Blog Post Category/Tag Filtering ###################
    /**
     * Initializes interactive category filter buttons for the blog page ('blog.html')
     * and dynamically generates category links for the 'categories.html' page.
     * This function now queries for all existing post cards on _any_ page to get a comprehensive list of tags.
     */
    const setupPostCategoryFilters = () => {
        const categoryFiltersContainer = document.getElementById('blog-category-filters');
        const blogPostsGrid = document.getElementById('all-posts-grid'); // Where posts are listed on blog.html
        
        const isCategoriesPage = window.location.pathname.includes('categories.html');
        const dynamicCategoryList = document.getElementById('dynamic-category-list'); // For tags on categories.html

        // If on blog.html, but filter/grid containers are absent (e.g., in a development view without full content), log and skip interactive features.
        if (window.location.pathname.includes('blog.html') && (!categoryFiltersContainer || !blogPostsGrid)) {
             console.log("[CategoryFilter] Blog page with missing filter/grid containers. Interactive tag filters skipped.");
        }

        // Aggregate unique tags from all post cards across _all loaded HTML files_ for comprehensive list.
        const allTags = new Set();
        const allPostCards = document.querySelectorAll('.post-card'); // Select all elements with 'post-card' class.
        allPostCards.forEach(post => { 
            const tagsAttr = post.dataset.tags; // Expected format: "tag1, tag2, tag3"
            if (tagsAttr) { // If 'data-tags' attribute exists, parse it.
                tagsAttr.split(',').map(tag => tag.trim()).forEach(tag => allTags.add(tag)); // Add each trimmed tag.
            }
        });
        // Console logging the collected tags for debugging purposes.
        // console.log("[CategoryFilter] Collected All Unique Tags:", Array.from(allTags).sort());

        // Part 1: Interactive filtering on 'blog.html'
        if (categoryFiltersContainer && blogPostsGrid) {
            // Ensure the "All Articles" button is present and functional.
            let allButton = categoryFiltersContainer.querySelector('[data-filter="all"]');
             if (!allButton) { 
                allButton = document.createElement('button');
                allButton.classList.add('filter-tag-button');
                allButton.textContent = `全部文章`;
                allButton.dataset.filter = 'all';
                categoryFiltersContainer.prepend(allButton); // Add to the start
            }
            allButton.addEventListener('click', () => filterPosts('all', allButton));

            // Dynamically generate individual tag filter buttons.
            const sortedTags = Array.from(allTags).sort((a,b) => a.localeCompare(b, 'zh-CN')); // Sort tags alphabetically.
            sortedTags.forEach(tag => {
                // Avoid creating duplicate buttons if they already exist (e.g., from static HTML or prior runs).
                if (!categoryFiltersContainer.querySelector(`[data-filter="${tag}"]`)) { 
                    const button = document.createElement('button');
                    button.classList.add('filter-tag-button');
                    button.textContent = ` #${tag}`; 
                    button.dataset.filter = tag; 
                    categoryFiltersContainer.appendChild(button); // Add to the container
                    button.addEventListener('click', () => filterPosts(tag, button)); // Attach click handler
                }
            });

            // Core function to actually filter blog posts based on a selected tag.
            const filterPosts = (filterTag, clickedButton = null) => {
                categoryFiltersContainer.querySelectorAll('.filter-tag-button').forEach(btn => { btn.classList.remove('active'); });
                if (clickedButton) { 
                    clickedButton.classList.add('active'); // Highlight clicked button
                } else if (filterTag === 'all' && allButton) { 
                    allButton.classList.add('active'); // Default to 'All Articles' if no specific filter button clicked
                }

                allPostCards.forEach(post => { // Iterate through all collected post cards to show/hide.
                    const tagsAttr = post.dataset.tags;
                    if (!tagsAttr) { 
                        post.style.display = (filterTag === 'all') ? 'block' : 'none'; // Posts without tags only show for 'all'.
                        return;
                    }
                    const postTags = tagsAttr.split(',').map(tag => tag.trim());

                    if (filterTag === 'all' || postTags.includes(filterTag)) { // Match filter or show all.
                        post.style.display = 'block'; 
                    } else {
                        post.style.display = 'none'; 
                    }
                });
                console.log(`[CategoryFilter] Applied filter: "${filterTag}"`);
            };

            // Initial filtering applied on page load, usually when navigating via a tag link from 'categories.html'.
            const urlParams = new URLSearchParams(window.location.search);
            const initialTag = urlParams.get('tag'); // Check for a 'tag' URL parameter.
            if (initialTag) {
                const initialButton = categoryFiltersContainer.querySelector(`[data-filter="${initialTag.trim()}"]`); // Find corresponding button.
                filterPosts(initialTag.trim(), initialButton); // Apply filter and activate button.
            } else { 
                filterPosts('all', allButton); // If no tag in URL, default to show all posts.
            }
            console.log("[CategoryFilter] Interactive filters initialized on blog page.");
        }
        
        // Part 2: Generating category links on 'categories.html'
        if (isCategoriesPage && dynamicCategoryList) {
            dynamicCategoryList.innerHTML = ''; 

            const sortedTags = Array.from(allTags).sort((a,b) => a.localeCompare(b, 'zh-CN')); // Sorted for presentation.
            if (sortedTags.length === 0) { 
                 dynamicCategoryList.innerHTML = `<p class="no-comments-message is-visible">暂时没有可用的文章分类。</p>`; // Message if no tags.
                 return;
            }

            sortedTags.forEach((tag, index) => {
                const buttonLink = document.createElement('a'); // Anchor tag for navigation.
                buttonLink.href = `blog.html?tag=${encodeURIComponent(tag)}`; // Target blog.html with filter param.
                buttonLink.classList.add('filter-tag-button', 'animate__slide-up'); // Use button styles & entrance animation.
                buttonLink.textContent = ` # ${tag}`;
                buttonLink.dataset.filter = tag; 
                buttonLink.dataset.delay = String(index * 50); // Small sequential delay (CSS will handle the rest)
                dynamicCategoryList.appendChild(buttonLink);
                // Force visibility for consistency, the CSS will handle delay
                setTimeout(() => buttonLink.classList.add('is-visible'), (index * 50) + 100); 
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

        // --- Backend Visitor Counter ---
        const visitorCountSpan = document.getElementById('visitor-count');
        if (visitorCountSpan) {
            fetch(`${backendBaseUrl}handleVisitCount`, {
                method: 'GET',
                 headers: { 'Accept': 'application/json' }
            })
                .then(response => {
                    if (!response.ok) { return response.json().then(error => { throw new Error(error.message || `HTTP ${response.status}.`); }); }
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
                    console.error('[VisitorCount] Failed to retrieve or update visitor count:', error);
                    visitorCountSpan.textContent = '???'; 
                });
        }
        // Dynamic Background Blur Adjustment
        const updateBodyBlur = () => {
            const desktopBlur = getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur').trim();
            const mobileBlur = getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur-mobile').trim(); // Ensure this variable exists in themes.css
            isMobile = window.innerWidth <= 767; 
            document.documentElement.style.setProperty('--body-global-blur-value', isMobile ? mobileBlur : desktopBlur);
            document.body.classList.toggle('is-mobile', isMobile); // Toggle based on isMobile
        };
        
        document.documentElement.style.setProperty('--body-global-blur-value', getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur').trim());
        updateBodyBlur(); 
        window.addEventListener('resize', updateBodyBlur); 
        console.log("[Blur] Dynamic background blur feature initialized.");

        // Force footer to be visible after all checks, as it's the last element of content.
        const footer = document.querySelector('.main-footer');
        if(footer && !footer.classList.contains('is-visible')){
            setTimeout(() => footer.classList.add('is-visible'), 500); // Give it a slight delay
            console.log("[Footer] Force-visibity ensured.");
        }
    }


    // --- Global Feature Initialization Point ---
    // Note: Order matters for dependencies. Cursor trail (desktop-only feature) needs immediate attention if applicable.
    setupDynamicPostImages(); 
    setupCursorTrail(); // Init early for responsiveness
    setupScrollAnimations(); // Critically handles element visibility.
    setupBackToTopButton();
    setupReadProgressBar();
    setupMainMenu(); 
    setupShareButtons();
    // This calls fetch for visitor count and also sets up dynamic blur & footer visibility.
    setupFooterAndDynamicBlur(); 
    setupPostCategoryFilters();

    console.log("✅ script.js FINISHED execution.");
});
