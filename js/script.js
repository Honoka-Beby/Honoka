document.addEventListener('DOMContentLoaded', () => {
    // CRITICAL FIX: 将 HTMLElement.prototype.classList.containsAny 移动到顶部定义，确保所有函数在调用前都可以访问。
    HTMLElement.prototype.classList.containsAny = function(classNames) {
        for (let i = 0; i < classNames.length; i++) {
            if (this.classList.contains(classNames[i])) {
                return true;
            }
        }
        return false;
    };

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
        setTimeout(() => { 
            if (pageTransitionOverlay) { 
                pageTransitionOverlay.classList.remove('visible');
                setTimeout(() => { 
                    if (pageTransitionOverlay) pageTransitionOverlay.style.display = 'none';
                    document.body.classList.remove('no-scroll'); 
                }, 500); 
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
        pageTransitionOverlay.style.display = 'flex'; 
        pageTransitionOverlay.classList.add('visible'); 
        setTimeout(() => { window.location.href = encodeURI(urlToNavigate); }, 400); 
        console.log(`[PageTransition] Activating transition to: ${urlToNavigate}`);
    };

    /**
     * Intercepts all internal link clicks to apply a smooth page transition.
     */
    document.querySelectorAll('a').forEach(link => {
        let hrefURL;
        try { 
            hrefURL = new URL(link.href, window.location.href); 
        } catch (e) {
            console.warn(`[LinkInterceptor] Invalid URL encountered for link: "${link.href}"`, e);
            return; 
        }

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

    // ################### IMPORTANT: backendBaseUrl Configuration ###################
    const backendBaseUrl = 'https://honoka1.netlify.app/.netlify/functions/'; // Honoka, Ensure this is YOUR exact Netlify domain!


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
                return response.givenUrl || response.url; 
            } else if (contentType && contentType.includes('json')) { 
                const data = await response.json();
                if (data && (data.imgurl || data.url) && typeof (data.imgurl || data.url) === 'string' && (data.imgurl || data.url).match(/\.(jpeg|jpg|gif|png|webp|bmp|avif)$/i)) { 
                    return data.imgurl || data.url;
                }
            }
            console.warn(`[ImageLoader-${apiDebugName}] 🔄 Failed to extract image URL from response. Content-Type: ${contentType}. Trying next API.`);
            return ''; 
        };
        
        // Tuned API Endpoints: Prioritized for stability and anime-specificity.
        // Removed `rand` due to persistent 404, keeping `Pure.php` first for anime specific images.
        const apiEndpoints = [
            `https://iw233.cn/api/Pure.php`,                             
            `https://api.adicw.cn/img/rand.php`, // Alternative endpoint, may contain anime or general images.
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

PRIVATE
                if (response.ok) {
                    imageUrl = await extractImageUrl(response, apiDebugName);
                    if (imageUrl) { break; } 
                } else {
                    console.warn(`[ImageLoader-${apiDebugName}] ⚠️ API responded with HTTP status ${response.status}. Trying next.`);
                }
            } catch (innerError) {
                if (innerError.name === 'AbortError') {
                    console.warn(`[ImageLoader-${apiDebugName}] ⏱️ Request timed out (4s limit). Applying local fallback. `);
                    applyFallbackImage(targetElement, type); // Instant fallback if timeout
                    return; // Early exit on timeout.
                } else if (innerError instanceof TypeError || innerError instanceof DOMException) {
                   console.warn(`[ImageLoader-${apiDebugName}] 🚫 Network/Fetch error:`, innerError.message, ' Applying local fallback.');
                   applyFallbackImage(targetElement, type); // Instant fallback on network error
                   return; // Early exit on error.
                } else {
                    console.warn(`[ImageLoader-${apiDebugName}] ❌ Unexpected error "${innerError.message}". Applying local fallback.`);
                    applyFallbackImage(targetElement, type); // Instant fallback on unexpected error
                    return; // Early exit.
                }
            }
        }
        
        // If a valid URL was obtained, attempt to preload and apply.
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
                targetElement.classList.remove('is-loading-fallback'); 
                targetElement.style.filter = ''; 
                const fallbackText = targetElement.nextElementSibling;
                if (fallbackText && fallbackText.classList.contains('fallback-text-overlay')) {
                    fallbackText.remove();
                }
                console.log(`[ImageLoader] ✅ Real image from API loaded: ${imageUrl.substring(0, 50)}...`);
            };
            imgToLoad.onerror = () => { 
                console.warn(`[ImageLoader] 🚫 Preloading image "${imageUrl.substring(0, 50)}..." failed after receiving valid URL. Applying local fallback.`);
                applyFallbackImage(targetElement, type); 
            };
        } else { // If NO valid URL from ANY API after all attempts (no timeout/error, just empty data)
            console.error('[ImageLoader] ❌ No valid image URL received from any online API. Forcing local fallback.');
            applyFallbackImage(targetElement, type); // Direct application of local fallback
        }
    };
    
    /**
     * Applies local fallback imagery (pngs or random gradients) and a text overlay, for situations where
     * dynamic image loading fails. Provides immediate visual feedback to the user.
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
                    const testLocalImage = new Image();
                    testLocalImage.src = localFallbackSrc;
                    testLocalImage.onload = () => {
                         if (targetElement.style.display === 'none') targetElement.style.display = ''; 
                         if (fallbackTextOverlay) fallbackTextOverlay.style.display = 'flex'; 
                    };
                    testLocalImage.onerror = () => {
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
        const h1 = Math.floor(Math.random() * 360); 
        const h2 = (h1 + 60 + Math.floor(Math.random() * 60)) % 360; 
        const s = Math.floor(Math.random() * 30) + 70; 
        const l = Math.floor(Math.random() * 20) + 50; 
        return `linear-gradient(135deg, hsla(${h1}, ${s}%, ${l}%, 0.7), hsla(${h2}, ${s}%, ${l}%, 0.7))`;
    }

    // --- Global Background Image Setup (for Body) ---
    fetchRandomAnimeImage(document.body, 'background'); // { width: 1920, height: 1080 } already default
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
     * Includes a more robust manual trigger for critical homepage elements.
     */
    const setupScrollAnimations = () => {
        const animatedElements = document.querySelectorAll('.animate__fade-in:not(.hero-content):not(.hero-subtitle):not(.hero-nav), .animate__slide-up:not(.hero-content):not(.hero-subtitle):not(.hero-nav)');
        console.log(`[Animations] Found ${animatedElements.length} scroll-animated generic elements to observe.`);

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('is-visible')) {
                    const delay = parseInt(entry.target.dataset.delay || '0');
                    setTimeout(() => { 
                        entry.target.classList.add('is-visible');
                        const isLooper = entry.target.closest('.is-homepage-title') || entry.target.closest('.is-header-title');
                        // CRITICAL FIX: classList.containsAny 现在应该可以正常工作，因为它已被提前定义
                        if (!isLooper && entry.target.classList.containsAny(['animate__fade-in', 'animate__slide-up'])) { 
                            observer.unobserve(entry.target);
                        }
                        // For paragraphs and lists inside content, also ensure visibility a bit after their parent becomes visible.
                        if (entry.target.closest('main.container.content-page-wrapper')) {
                            entry.target.querySelectorAll('p:not(.post-excerpt):not(.form-hint):not(.no-comments-message), ul, ol').forEach((child, index) => {
                                if(!child.classList.contains('is-visible')){
                                    setTimeout(()=> child.classList.add('is-visible'), index * 50 + 100);
                                }
                            });
                        }
                    }, delay);
                } 
            });
        }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }); 

        animatedElements.forEach(el => observer.observe(el));

        const header = document.querySelector('.main-header');
        if (header && !header.classList.contains('is-visible')) {
            setTimeout(() => header.classList.add('is-visible'), 50); 
            console.log("[Animations] Main header force-visible.");
        }

        const contentWrapper = document.querySelector('main.container.content-page-wrapper');
        // Only trigger `is-visible` on the content wrapper for non-homepage. Homepage `hero-content` is individual.
        if (contentWrapper && !document.body.classList.contains('is-homepage') && !contentWrapper.classList.contains('is-visible')) {
            setTimeout(() => contentWrapper.classList.// CRITICAL FIX: ensure this is set to is-visible consistently
            add('is-visible'), 150); 
            console.log("[Animations] Main content wrapper force-fade-in ensured.");
        }


        // ---------- FIX FOR HOMEPAGE SUBTITLE & NAV BUTTONS NOT SHOWING ----------
        if (document.body.classList.contains('is-homepage')) {
            const heroContent = document.querySelector('.hero-content'); 
            if (heroContent && !heroContent.classList.contains('is-visible')) {
                setTimeout(() => heroContent.classList.add('is-visible'), 100);
            }

            const homepageAnimElements = document.querySelectorAll('.hero-subtitle[data-delay], .hero-nav[data-delay]');
            homepageAnimElements.forEach(el => {
                if (!el.classList.contains('is-visible')) { 
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
        else { // For non-homepage content, animate sections directly
            document.querySelectorAll('.about-me-section, .comment-section, .categories-section').forEach(section => {
                if(!section.classList.contains('is-visible')) {
                    const delay = parseInt(section.dataset.delay || '0');
                     setTimeout(() => section.classList.add('is-visible'), delay + 100); // Small general delay
                     // Also handle children if any specific delays are present
                     section.querySelectorAll('[data-delay]').forEach(child => {
                        if (child !== section && !child.classList.contains('is-visible')) {
                            const childDelay = parseInt(child.dataset.delay || '0'); // Get delay relative to parent's animation start
                            setTimeout(() => child.classList.add('is-visible'), delay + 100 + childDelay);
                        }
                    });
                }
            });
        }
        // Force avatar, contact info, post content visible
        document.querySelectorAll('.my-avatar, .contact-info, .post-content, .post-share-buttons, .read-more, .post-detail-title, .post-meta, .post-detail-banner').forEach(el => {
            // Apply delay if the element explicitly asks for it via data-delay.
            const delay = parseInt(el.dataset.delay || '0');
            setTimeout(() => { if (!el.classList.contains('is-visible')) { el.classList.add('is-visible'); }}, delay + 200); // Slight delay for content
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
        if (window.scrollY > 300) { btn.classList.add('show'); }
        console.log("[BackToTop] Button initialized.");
    };
    
    // --- Custom Cursor Trail Effect for Desktop ---
    const setupCursorTrail = () => {
        const cursorDot = document.getElementById('cursor-trail');
        if (!cursorDot || isMobile) { 
            if (cursorDot) cursorDot.style.display = 'none'; 
            document.body.style.cursor = 'auto'; 
            console.log(`[CursorTrail] Disabled for ${isMobile ? 'mobile' : 'missing element/compatibility'}.`);
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

    /**
     * Initializes the read progress bar for article detail pages.
     */
    const setupReadProgressBar = () => {
        const progressBar = document.getElementById('read-progress-bar');
        const content = document.querySelector('.blog-post-detail'); 
        if (!progressBar || !content) { console.log("[ReadProgressBar] Not an article page or elements not found. Feature skipped."); return; } 

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
    
    /**
     * Sets up the main navigation menu: hamburger toggle, mini-panel display, and close logic.
     */
    const setupMainMenu = () => {
        const menuToggle = document.querySelector('.menu-toggle');
        const mainNav = document.getElementById('main-nav-menu'); 
        const menuClose = document.querySelector('.main-nav .menu-close');
        
        if (!menuToggle || !mainNav || !menuClose) {
            console.warn('[MainMenu] Menu elements not found. Menu features disabled.');
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
                 link.addEventListener('click', closeMenu); 
                 return; 
            }
            if (hrefURL.origin === window.location.origin && hrefURL.protocol !== 'mailto:' && hrefURL.hash === '') {
                // For internal links that trigger transitions, delay menu close slightly
                link.addEventListener('click', () => { setTimeout(() => { closeMenu(); }, 400); });
            } else { link.addEventListener('click', closeMenu); } 
        });

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
        const allTags = new Set();
        const allPostCards = document.querySelectorAll('.post-card'); 
        allPostCards.forEach(post => { 
            const tagsAttr = post.dataset.tags; 
            if (tagsAttr) { tagsAttr.split(',').map(tag => tag.trim()).forEach(tag => allTags.add(tag)); }
        });
        
        // Part 1: Interactive filtering on 'blog.html'
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

                allPostCards.forEach(post => { 
                    const tagsAttr = post.dataset.tags;
                    if (!tagsAttr) { 
                        post.style.display = (filterTag === 'all') ? 'block' : 'none'; 
                        return;
                    }
                    const postTags = tagsAttr.split(',').map(tag => tag.trim());

                    if (filterTag === 'all' || postTags.includes(filterTag)) { 
                        post.style.display = 'block'; 
                    } else {
                        post.style.display = 'none'; 
                    }
                });
                console.log(`[CategoryFilter] Applied filter: "${filterTag}".`);
            };

            const urlParams = new URLSearchParams(window.location.search);
            const initialTag = urlParams.get('tag'); 
            if (initialTag) {
                const initialButton = categoryFiltersContainer.querySelector(`[data-filter="${initialTag.trim()}"]`); 
                filterPosts(initialTag.trim(), initialButton); 
            } else { 
                filterPosts('all', allButton); 
            }
            console.log("[CategoryFilter] Interactive filters initialized on blog page.");
        }
        
        // Part 2: Generating category links on 'categories.html'
        if (isCategoriesPage && dynamicCategoryList) {
            dynamicCategoryList.innerHTML = ''; 

            const sortedTags = Array.from(allTags).sort((a,b) => a.localeCompare(b, 'zh-CN')); 
            if (sortedTags.length === 0) { 
                 dynamicCategoryList.innerHTML = `<p class="no-comments-message is-visible">暂时没有可用的文章分类。</p>`; 
                 return;
            }

            sortedTags.forEach((tag, index) => {
                const buttonLink = document.createElement('a'); 
                buttonLink.href = `blog.html?tag=${encodeURIComponent(tag)}`; 
                buttonLink.classList.add('filter-tag-button', 'animate__slide-up'); 
                buttonLink.textContent = ` # ${tag}`;
                buttonLink.dataset.filter = tag; 
                buttonLink.dataset.delay = String(index * 50); 
                dynamicCategoryList.appendChild(buttonLink);
                setTimeout(() => buttonLink.classList.add('is-visible'), (index * 50) + 100); 
            });
            console.log(`[CategoryPage] Generated ${sortedTags.length} category links.`);
        }
    };


    // --- Share buttons for article pages ---
    const setupShareButtons = () => {
        const shareButtons = document.querySelectorAll('.post-share-buttons a.weibo, .post-share-buttons a.qq');
        if (shareButtons.length === 0) { console.log("[ShareButtons] No share buttons found on this page."); return; } 

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
                    // console.log("[VisitorCount] Raw response check:", response); // Debugging response status
                    if (!response.ok) { 
                        return response.json().then(error => { throw new Error(error.message || `HTTP ${response.status}.`); }).catch(() => {
                           throw new Error(`HTTP ${response.status}: Failed to parse error response.`);
                        }); 
                    }
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
                    console.error('[VisitorCount] Failed to retrieve or update visitor count FROM FRONTEND fetch:', error, '. You likely have a configuration error in your Firebase Admin SDK setup in Netlify Functions.');
                    visitorCountSpan.textContent = '???'; 
                });
        }
        // Dynamic Background Blur Adjustment
        const updateBodyBlur = () => {
            const desktopBlur = getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur').trim();
            const mobileBlur = getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur-mobile').trim(); 
            isMobile = window.innerWidth <= 767; 
            document.documentElement.style.setProperty('--body-global-blur-value', isMobile ? mobileBlur : desktopBlur);
            document.body.classList.toggle('is-mobile', isMobile); 
        };
        
        document.documentElement.style.setProperty('--body-global-blur-value', getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur').trim());
        // Only run updateBodyBlur here, the resize listener above will handle subsequent changes
        updateBodyBlur(); 
        console.log("[Blur] Dynamic background blur feature initialized.");

        const footer = document.querySelector('.main-footer');
        if(footer && !footer.classList.contains('is-visible')){
            setTimeout(() => footer.classList.add('is-visible'), 500); 
            console.log("[Footer] Force-visibity ensured.");
        }
    }


    // --- Global Feature Initialization Point ---
    // Note: Order matters for dependencies. Cursor trail (desktop-only feature) needs immediate attention if applicable.
    setupDynamicPostImages(); 
    setupCursorTrail(); 
    setupScrollAnimations(); 
    setupBackToTopButton();
    setupReadProgressBar();
    setupMainMenu(); 
    setupShareButtons();
    setupFooterAndDynamicBlur(); // Important to call AFTER `updateBodyBlur` is set up.
    setupPostCategoryFilters();

    // The HTMLElement.prototype.classList.containsAny definition has been moved to the top.
    // So this line is no longer necessary here.

    console.log("✅ script.js FINISHED execution.");
});
