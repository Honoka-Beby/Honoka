document.addEventListener('DOMContentLoaded', () => {
    // --- CRITICAL FIX START: Correctly define containsAny on DOMTokenList.prototype ---
    // The error "Illegal Invocation" can occur when trying to define or access properties on a prototype
    // in a way that loses the correct 'this' context, or by defining on the wrong prototype.
    // The method 'containsAny' is intended for use on 'element.classList' which returns a DOMTokenList.
    // Therefore, the new method must be added to DOMTokenList.prototype.
    if (typeof DOMTokenList !== 'undefined' && !DOMTokenList.prototype.containsAny) {
        DOMTokenList.prototype.containsAny = function(classNames) {
            // 'this' inside this function will correctly refer to the DOMTokenList instance.
            for (let i = 0; i < classNames.length; i++) {
                // `this.contains` is a native method of DOMTokenList.
                if (this.contains(classNames[i])) {
                    return true;
                }
            }
            return false;
        };
    }
    // --- CRITICAL FIX END ---

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
        // Make sure overlay removes visible class properly for first load
        setTimeout(() => {
            if (pageTransitionOverlay) {
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
        setTimeout(() => {
            window.location.href = encodeURI(urlToNavigate);
        }, 400); // Adjust timing with CSS transition duration
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
    const fetchRandomAnimeImage = async (targetElement, type = 'background', options = {
        width: 1920,
        height: 1080
    }) => {
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
        const apiEndpoints = [
            `https://iw233.cn/api/Pure.php`,
            `https://api.adicw.cn/img/rand.php`,
        ];

        for (const api of apiEndpoints) {
            const apiDebugName = new URL(api).hostname.split('.').slice(-2).join('.');
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4000); // 4-second timeout for each API call

                const response = await fetch(api, {
                    method: 'GET',
                    redirect: 'follow',
                    signal: controller.signal,
                    headers: {
                        'Accept': 'image/*,application/json'
                    }
                });
                clearTimeout(timeoutId);

                if (response.ok) {
                    imageUrl = await extractImageUrl(response, apiDebugName);
                    if (imageUrl) {
                        break;
                    } // Found a valid URL, exit loop
                } else {
                    console.warn(`[ImageLoader-${apiDebugName}] ⚠️ API responded with HTTP status ${response.status}. Trying next.`);
                }
            } catch (innerError) {
                if (innerError.name === 'AbortError') {
                    console.warn(`[ImageLoader-${apiDebugName}] ⏱️ Request timed out (4s limit). Applying local fallback.`);
                } else if (innerError instanceof TypeError || innerError instanceof DOMException) {
                    console.warn(`[ImageLoader-${apiDebugName}] 🚫 Network/Fetch error:`, innerError.message, ' Applying local fallback.');
                } else {
                    console.warn(`[ImageLoader-${apiDebugName}] ❌ Unexpected error "${innerError.message}". Applying local fallback.`);
                }
                applyFallbackImage(targetElement, type);
                return;
            }
        }

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
        } else {
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
        const fallbackFilename = isThumbnail ? 'post-thumbnail-fallback.png' : 'post-detail-banner-fallback.png';
        const baseRelativePath = window.location.pathname.includes('/posts/') ? '../img/' : './img/';
        const localFallbackSrc = srcOverride || `${baseRelativePath}${fallbackFilename}`;

        if (type === 'background') {
            document.documentElement.style.setProperty('--bg-image', getRandomGradient());
            console.log(`[ImageLoader] 🖼️ Applied gradient background fallback for body.`);
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
    fetchRandomAnimeImage(document.body, 'background');
    console.log("[Background] Dynamic body background initiated.");

    // --- Dynamic Article Thumbnail/Banner Images ---
    const setupDynamicPostImages = () => {
        document.querySelectorAll('.post-thumbnail[data-src-type="wallpaper"]').forEach(img => {
            applyFallbackImage(img, 'image');
            fetchRandomAnimeImage(img, 'image', {
                width: 500,
                height: 300
            });
        });
        console.log("[ImageLoader] Post thumbnails initiated.");

        const detailBanner = document.querySelector('.post-detail-banner[data-src-type="wallpaper"]');
        if (detailBanner) {
            applyFallbackImage(detailBanner, 'image');
            fetchRandomAnimeImage(detailBanner, 'image', {
                width: 1000,
                height: 400
            });
            console.log("[ImageLoader] Post detail banner initiated.");
        }
    };

    /**
     * Initializes elements with entrance (fade-in, slide-up) animations if they are in viewport.
     */
    const setupScrollAnimations = () => {
        const observer = new IntersectionObserver((entries, observerInstance) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('is-visible')) {
                    const delay = parseInt(entry.target.dataset.delay || '0');
                    setTimeout(() => {
                        entry.target.classList.add('is-visible');
						// Using the correctly defined containsAny method on DOMTokenList
                        if (entry.target.classList.containsAny(['animate__fade-in', 'animate__slide-up'])) {
                            observerInstance.unobserve(entry.target);
                        }
                    }, delay);
                }
            });
        }, {
            threshold: 0.1
        });

        document.querySelectorAll('.animate__fade-in, .animate__slide-up').forEach(el => observer.observe(el));
        
        // Manual triggers for critical elements that might not be in viewport on load.
        // This ensures the main hero content on the homepage and headers always appear.
        const header = document.querySelector('.main-header');
        if (header) {
            setTimeout(() => header.classList.add('is-visible'), 50);
        }
        
        const heroContent = document.querySelector('.hero-content, .content-page-wrapper');
        if (heroContent) {
           setTimeout(() => {
                heroContent.classList.add('is-visible');
                // Animate child elements within the hero section or content pages with cascade effect
                heroContent.querySelectorAll('[data-delay]').forEach(child => {
                    const childDelay = parseInt(child.dataset.delay) || 0;
                    setTimeout(() => child.classList.add('is-visible'), childDelay);
                });
            }, 100);
        }

        const footer = document.querySelector('.main-footer');
        if (footer) {
            setTimeout(() => footer.classList.add('is-visible'), 500);
        }
    };

    // --- Back to Top Button ---
    const setupBackToTopButton = () => {
        const btn = document.getElementById('back-to-top');
        if (!btn) {
            return;
        }
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                btn.classList.add('show');
            } else {
                btn.classList.remove('show');
            }
        });
        btn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        if (window.scrollY > 300) {
            btn.classList.add('show');
        }
    };

    // --- Custom Cursor Trail Effect for Desktop ---
    const setupCursorTrail = () => {
        const cursorDot = document.getElementById('cursor-trail');
        if (!cursorDot || isMobile) {
            if (cursorDot) cursorDot.style.display = 'none';
            document.body.style.cursor = 'auto';
            return;
        }
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
                    try {
                        trail.parentNode.removeChild(trail);
                    } catch (e) {
                        // ignore error
                    }
                }
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
    };

    // --- Read Progress Bar ---
    const setupReadProgressBar = () => {
        const progressBar = document.getElementById('read-progress-bar');
        if (!progressBar) return;
        const calculateProgress = () => {
            const documentHeight = document.documentElement.scrollHeight;
            const windowHeight = window.innerHeight;
            const scrollRange = documentHeight - windowHeight;
            const currentScroll = window.scrollY;
            let progress = (currentScroll / scrollRange) * 100;
            progressBar.style.width = `${Math.min(100, progress)}%`;
        };
        window.addEventListener('scroll', calculateProgress);
    };

    // --- Main Navigation Menu ---
        const setupMainMenu = () => {
        const menuToggle = document.querySelector('.menu-toggle');
        const mainNav = document.getElementById('main-nav-menu'); 
        const menuClose = document.querySelector('.main-nav .menu-close');

        if (!menuToggle || !mainNav || !menuClose) return;

        const openMenu = () => {
            mainNav.classList.add('is-open'); 
            menuToggle.setAttribute('aria-expanded', 'true');
            if(isMobile) document.body.classList.add('no-scroll');
        };
        const closeMenu = () => {
            mainNav.classList.remove('is-open');
            menuToggle.setAttribute('aria-expanded', 'false');
            if(isMobile) document.body.classList.remove('no-scroll');
        };

        menuToggle.addEventListener('click', (e) => { e.stopPropagation(); mainNav.classList.contains('is-open') ? closeMenu() : openMenu(); });
        menuClose.addEventListener('click', (e) => { e.stopPropagation(); closeMenu(); });
        mainNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setTimeout(closeMenu, 400)));
        document.body.addEventListener('click', (e) => { if (mainNav.classList.contains('is-open') && !mainNav.contains(e.target) && !menuToggle.contains(e.target)) closeMenu(); });
    };

    // --- Blog Post Category/Tag Filtering ---
    const setupPostCategoryFilters = () => {
        const allTags = new Set();
        document.querySelectorAll('.post-card[data-tags]').forEach(post => post.dataset.tags.split(',').forEach(tag => allTags.add(tag.trim())));

        const createFilterButtons = (container) => {
            if (!container) return;
            const sortedTags = Array.from(allTags).sort();
            sortedTags.forEach(tag => {
                const btn = document.createElement('button');
                btn.className = 'filter-tag-button';
                btn.dataset.filter = tag;
                btn.textContent = `#${tag}`;
                container.appendChild(btn);
            });
        };
        
        const filterPosts = (filter) => {
            document.querySelectorAll('#all-posts-grid .post-card').forEach(post => {
                const tags = post.dataset.tags ? post.dataset.tags.split(',').map(t => t.trim()) : [];
                post.style.display = (filter === 'all' || tags.includes(filter)) ? '' : 'none';
            });
            document.querySelectorAll('#blog-category-filters .filter-tag-button').forEach(btn => 
                btn.classList.toggle('active', btn.dataset.filter === filter)
        )};

        const filtersContainer = document.getElementById('blog-category-filters');
        createFilterButtons(filtersContainer);
        if (filtersContainer) {
            filtersContainer.addEventListener('click', e => {
                if (e.target.matches('.filter-tag-button')) filterPosts(e.target.dataset.filter);
            });
           const initialTag = new URLSearchParams(window.location.search).get('tag');
           filterPosts(initialTag || 'all');
        }

        const dynamicList = document.getElementById('dynamic-category-list');
        if (dynamicList) {               
            dynamicList.innerHTML = Array.from(allTags).sort().map((tag, i) =>
                `<a href="blog.html?tag=${encodeURIComponent(tag)}" class="filter-tag-button animate__slide-up" data-delay="${i*50}"># ${tag}</a>`
            ).join('');
             setTimeout(() => dynamicList.querySelectorAll('a').forEach(a => a.classList.add('is-visible')), 100);
        }
    };
    
    // --- Share buttons ---
    const setupShareButtons = () => {
        document.querySelectorAll('.post-share-buttons a').forEach(btn => {
            const url = encodeURIComponent(window.location.href);
            const title = encodeURIComponent(document.title.split(' - ')[0]);
            if(btn.classList.contains('weibo')) btn.href = `https://service.weibo.com/share/share.php?url=${url}&title=${title}`;
            if(btn.classList.contains('qq')) btn.href = `https://connect.qq.com/widget/shareqq/index.html?url=${url}&title=${title}`;
        });
    };

    // --- Footer dynamic details and Dynamic Blur ---
    const setupFooterAndDynamicBlur = () => {
        const currentYearSpan = document.getElementById('current-year');
        if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();

        const visitorCountSpan = document.getElementById('visitor-count');
        if (visitorCountSpan) {
            fetch(`${backendBaseUrl}handleVisitCount`)
                .then(res => res.json())
                .then(data => { visitorCountSpan.textContent = data.count; })
                .catch(() => { visitorCountSpan.textContent = '???'; });
        }
        // updateBodyBlur is defined at top level for resize listener
        updateBodyBlur();
    };


    // --- Global Feature Initialization Point ---
    setupDynamicPostImages();
    setupCursorTrail();
    setupScrollAnimations();
    setupBackToTopButton();
    setupReadProgressBar();
    setupMainMenu();
    setupShareButtons();
    setupFooterAndDynamicBlur();
    setupPostCategoryFilters();

    console.log("✅ script.js FINISHED execution.");
});
