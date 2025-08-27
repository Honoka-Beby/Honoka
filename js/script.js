document.addEventListener('DOMContentLoaded', () => {

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
        setTimeout(() => {
            pageTransitionOverlay.classList.remove('visible');
            setTimeout(() => {
                pageTransitionOverlay.style.display = 'none';
                document.body.classList.remove('no-scroll'); 
            }, 500); // Wait for CSS transition to complete
        }, 100); 
    }

    const activatePageTransition = (urlToNavigate) => {
        if (!pageTransitionOverlay) {
            window.location.href = urlToNavigate; 
            return;
        }
        document.body.classList.add('no-scroll'); 
        pageTransitionOverlay.style.display = 'flex'; 
        pageTransitionOverlay.classList.add('visible');
        
        setTimeout(() => {
            window.location.href = encodeURI(urlToNavigate); // Ensure URL is properly encoded
        }, 400); // Matches CSS transition duration before navigation
    };

    // Intercept all internal link clicks for smooth transitions
    document.querySelectorAll('a').forEach(link => {
        const href = new URL(link.href);
        const currentOrigin = window.location.origin;

        // Only intercept internal links (same origin), non-mailto, non-fragment
        if (href.origin === currentOrigin && !href.protocol.startsWith('mailto:') && href.hash === '' && !href.pathname.endsWith('javascript:void(0)')) {
            link.addEventListener('click', (e) => {
                if (link.target === '_blank') return; // Do not intercept _blank links
                e.preventDefault(); 
                activatePageTransition(link.href);
            });
        }
    });

    // --- Random Anime Wallpaper API for dynamic backgrounds/images ---
    /**
     * Fetches a random anime image from various APIs.
     * @param {HTMLElement} targetElement - The element to apply the image to (body for background, img for src).
     * @param {string} type - 'background' or 'image'
     * @param {object} options - Configuration options.
     * @param {number} options.width - Desired width hint for image API.
     * @param {number} options.height - Desired height hint for image API.
     */
    const fetchRandomAnimeImage = async (targetElement, type = 'background', options = { width: 1920, height: 1080 }) => {
        let imageUrl = '';
        const { width, height } = options; 

        // Helper to extract image URL from various API response formats
        const extractImageUrl = async (response, apiDebugName) => {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.startsWith('image/')) {
                return response.url; // Direct image URL
            } else if (contentType && contentType.includes('json')) { 
                const data = await response.json();
                if (data && (data.imgurl || data.url) && typeof (data.imgurl || data.url) === 'string' && (data.imgurl || data.url).match(/\.(jpeg|jpg|gif|png|webp|bmp|avif)$/i)) { // Added avif
                    return data.imgurl || data.url;
                }
            }
            console.warn(`[ImageLoader] 🔄 ${apiDebugName} failed to extract image URL from response. Content-Type: ${contentType}`);
            return ''; 
        };
        
        // Revised Priority Ordered API Endpoints (focused on high-reliability anime images)
        const apiEndpoints = [
            `https://iw233.cn/api/Pure.php`,                             // 高品质动漫图, 直链
            `https://api.adicw.cn/img/rand`,                            // 有效动漫图, 直链 (优先级更高，经常出动漫图)
            `https://api.btstu.cn/sjbz/api.php?lx=dongman&format=json`, // JSON API 动漫图，稳定备用
            `https://api.unsplash.com/photos/random?orientation=landscape&query=anime,manga,art&client_id=YOUR_UNSPLASH_ACCESS_KEY`, // Unsplash with keywords, requires API_KEY
             `https://random.dog/api/breeds/image`, // Not anime, but general purpose image if anime-specific fail. returns JSON with 'url'
             `https://random.cat/meow` // Another general image fallback
        ];

        // Replace 'YOUR_UNSPLASH_ACCESS_KEY' if you have one. Otherwise, it will just fail.
        // For production, consider rotating API keys or self-hosting a simple proxy.

        for (const api of apiEndpoints) {
            const apiDebugName = api.split('?')[0].replace(/(https?:\/\/|\.php|\/api|\/img|\/rand)/g, '').split('/').filter(Boolean).join('.'); // Cleaned name
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000); // Increased timeout to 8 seconds per API
                
                const fetchOptions = { method: 'GET', redirect: 'follow', signal: controller.signal };
                // Unsplash requires setting the accept header to application/json for direct response rather than redirect
                if (api.includes('unsplash.com/photos/random')) {
                    fetchOptions.headers = { 'Accept': 'application/json' };
                }

                const response = await fetch(api, fetchOptions);
                clearTimeout(timeoutId);

                if (response.ok) {
                    imageUrl = await extractImageUrl(response, apiDebugName);
                    if (imageUrl) {
                        console.log(`[ImageLoader] ✅ API Success (${apiDebugName}): ${imageUrl.substring(0, 50)}...`);
                        break; 
                    }
                } else {
                    console.warn(`[ImageLoader] ⚠️ API ${apiDebugName} responded with status ${response.status}. Trying next.`);
                }
            } catch (innerError) {
                if (innerError.name === 'AbortError') {
                    console.warn(`[ImageLoader] ⏱️ API ${apiDebugName} timed out after 8s. Trying next.`);
                } else if (innerError instanceof TypeError || innerError instanceof DOMException) {
                   console.warn(`[ImageLoader] 🚫 API ${apiDebugName} network/fetch error:`, innerError.message);
                } else {
                    console.warn(`[ImageLoader] ❌ API ${apiDebugName} unexpected error:`, innerError);
                }
            }
        }
        
        // --- Image Preloading and Application ---
        if (imageUrl) {
            const imgToLoad = new Image(); 
            imgToLoad.src = imageUrl;
            imgToLoad.onload = () => {
                if (type === 'background') {
                    document.documentElement.style.setProperty('--bg-image', `url("${imageUrl}")`); // CSS background needs quotes
                } else if (type === 'image') {
                    targetElement.src = imageUrl; 
                    targetElement.style.opacity = '1'; 
                    targetElement.style.objectFit = 'cover'; 
                }
                // Clear all fallback states
                targetElement.classList.remove('is-loading-fallback'); 
                targetElement.style.filter = ''; // Remove any grayscale/blur
                const fallbackText = targetElement.nextElementSibling;
                if (fallbackText && fallbackText.classList.contains('fallback-text-overlay')) {
                    fallbackText.remove();
                }
            };
            imgToLoad.onerror = () => { 
                console.warn(`[ImageLoader] 🚫 Preloaded image (${imageUrl}) failed to render. Applying local fallback.`);
                applyFallbackImage(targetElement, type);
            };
        } else { // No image URL obtained from any API
            console.error('[ImageLoader] ❌ All APIs failed to provide a valid image URL. Forcing local fallback.');
            applyFallbackImage(targetElement, type); 
        }
    };
    
    // --- Helper for fallback images (to avoid repetition) ---
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
            targetElement.style.filter = 'grayscale(100%) brightness(0.7) blur(1px)'; // Apply filter (moved to styles.css now)
            targetElement.style.backgroundImage = getRandomGradient(); // Ensure graphic background for fallback image zone
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

                    // If local fallback image link is itself broken, hide the img and let the text overlay show.
                    const testLocalImage = new Image();
                    testLocalImage.src = localFallbackSrc;
                    testLocalImage.onafterprint = () => { // Onload should be afterprint for Safari workaround, or just test onerror
                        console.log(`[ImageLoader] Local fallback image "${localFallbackSrc}" loaded okay.`);
                        if (targetElement.style.display === 'none') targetElement.style.display = ''; // Show image if it loads fine
                        // Ensure overlay is removed if local fallback image loads OK
                         if (fallbackTextOverlay) fallbackTextOverlay.remove();
                    };
                    testLocalImage.onerror = () => {
                        targetElement.style.display = 'none'; // Completely hides the <img> tag
                        console.warn(`[ImageLoader] 🚫 Local fallback image "${localFallbackSrc}" itself failed to load. Only overlay text visible.`);
                        // Ensure overlay IS visible in this case
                        if (fallbackTextOverlay) fallbackTextOverlay.style.display = 'flex';
                    };
                  
                } else {
                    fallbackTextOverlay.textContent = isThumbnail ? "封面加载失败 :(" : "图片加载失败 :("; // Update if content changed
                    fallbackTextOverlay.style.display = 'flex'; 
                }
            }
            console.log(`[ImageLoader] 🎨 Applied local fallback and overlay for: ${targetElement.alt || 'Unnamed Image'}`);
        }
    };
    
    function getRandomGradient() {
        // Generates more vibrant and distinct gradients for fallbacks
        const h1 = Math.floor(Math.random() * 360);
        const h2 = (h1 + 60 + Math.floor(Math.random() * 60)) % 360; 
        const s = Math.floor(Math.random() * 30) + 70; // High saturation
        const l = Math.floor(Math.random() * 20) + 50; // Medium lightness
        return `linear-gradient(135deg, hsla(${h1}, ${s}%, ${l}%, 0.7), hsla(${h2}, ${s}%, ${l}%, 0.7))`;
    }

    // -- Homepage Animation / Global Background -- //
    fetchRandomAnimeImage(document.body, 'background', { width: 1920, height: 1080 }); 


    // --- Dynamic Article Thumbnail/Banner Images ---
    const setupDynamicPostImages = () => {
        document.querySelectorAll('.post-thumbnail[data-src-type="wallpaper"]').forEach(img => {
            // Apply fallback upfront to minimize visual loading gaps
            applyFallbackImage(img, 'image'); 
            fetchRandomAnimeImage(img, 'image', { width: 500, height: 300 }); 
        });

        const detailBanner = document.querySelector('.post-detail-banner[data-src-type="wallpaper"]');
        if (detailBanner) {
            applyFallbackImage(detailBanner, 'image'); 
            fetchRandomAnimeImage(detailBanner, 'image', { width: 1000, height: 400 }); 
        }
    };

    // --- Intersection Observer for Scroll-Triggered Animations ---
    const setupScrollAnimations = () => {
        const animatedElements = document.querySelectorAll('.animate__fade-in:not(.main-header), .animate__slide-up');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    // Do not unobserve elements whose animations are intended to loop
                    if (!entry.target.closest('.is-homepage-title') && !entry.target.closest('.is-header-title')) { 
                         observer.unobserve(entry.target);
                    }
                } 
            });
        }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }); 

        animatedElements.forEach(el => observer.observe(el));

        // Ensure main header always has its initial fade-in or is visible
        const mainHeader = document.querySelector('.main-header');
        if (mainHeader && !mainHeader.classList.contains('is-visible')) {
            mainHeader.classList.add('is-visible'); 
        }
    };

    // --- Back to Top Button ---
    const setupBackToTopButton = () => {
        const btn = document.getElementById('back-to-top');
        if (!btn) return;

        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) { 
                btn.classList.add('show');
            } else {
                btn.classList.remove('show');
            }
        });

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        if (window.scrollY > 300) { btn.classList.add('show'); } // Set initial visibility
    };
    
    // --- Custom Cursor Trail Effect ---
    const setupCursorTrail = () => {
        const cursorDot = document.getElementById('cursor-trail');
        if (!cursorDot || isMobile) { // Use dynamically updated isMobile
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
                    trail.parentNode.removeChild(trail);
                }
            }, 500); 
        });

        document.querySelectorAll('a, button, input:not([type="submit"]), textarea, .post-card, .menu-toggle, .main-nav a, .filter-tag-button').forEach(el => { // Added .filter-tag-button to hover elements
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

    // --- Read Progress Bar for Article Pages ---
    const setupReadProgressBar = () => {
        const progressBar = document.getElementById('read-progress-bar');
        const content = document.querySelector('.blog-post-detail');

        if (!progressBar || !content) return; 

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

            const scrollRange = documentHeight - windowHeight;
            const currentScrollPosition = window.scrollY; 

            let readProgress = (currentScrollPosition / scrollRange) * 100;
            readProgress = Math.min(100, Math.max(0, readProgress)); 

            progressBar.style.width = readProgress + '%';
        }

        window.addEventListener('scroll', calculateProgress);
        window.addEventListener('resize', calculateProgress); 
        setTimeout(calculateProgress, 500); // Initial call after a brief delay for layout stability
    };
    
    // --- Main Navigation Menu (Mini-Panel) ---
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
            mainNav.classList.add('is-open'); // This applies the slide-in/visibility
            menuToggle.setAttribute('aria-expanded', 'true');
            document.body.classList.add('no-scroll'); // Disable body scroll
            // console.log("[MainMenu] Menu Opened, Scroll Disabled.");
        };

        const closeMenu = () => {
            if (!mainNav.classList.contains('is-open')) return; // Avoid redundant calls
            mainNav.classList.remove('is-open');
            menuToggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('no-scroll'); // Enable body scroll
            // console.log("[MainMenu] Menu Closed, Scroll Enabled.");
        };

        menuToggle.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevents click bubbling to body and closing immediately
            if (mainNav.classList.contains('is-open')) {
                closeMenu();
            } else {
                openMenu();
            }
        });
        menuClose.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevents click bubbling
            closeMenu();
        });

        // Close menu when a navigation link inside it is clicked if it's an internal link
        mainNav.querySelectorAll('a').forEach(link => {
            const href = new URL(link.href);
            const currentOrigin = window.location.origin;

            if (href.origin === currentOrigin && !href.protocol.startsWith('mailto:') && href.hash === '' && !href.pathname.endsWith('javascript:void(0)')) {
                link.addEventListener('click', () => {
                    setTimeout(() => {
                        closeMenu(); 
                    }, 400); // Small delay to let page transition animation start
                });
            } else { 
                link.addEventListener('click', closeMenu);
            }
        });

        // Close menu when clicking outside it, but be careful not to close on menuToggle itself
        document.body.addEventListener('click', (event) => {
            if (mainNav.classList.contains('is-open') && 
                !mainNav.contains(event.target) &&  // Click not inside menu
                !menuToggle.contains(event.target)) { // Click not on menuToggle button
                closeMenu();
                // console.log("[MainMenu] Clicked outside menu (Body), closed.");
            }
        });
    };


    // --- Blog Post Category/Tag Filtering ---
    const setupPostCategoryFilters = () => {
        const categoryFiltersContainer = document.getElementById('blog-category-filters');
        const blogPostsGrid = document.getElementById('all-posts-grid');
        
        if (!categoryFiltersContainer || !blogPostsGrid) {
            // console.log("[CategoryFilter] Not on a page with category filters.");
            // Also generate tags for categories page if it exists
             if (window.location.pathname.endsWith('categories.html')) {
                generateCategoryButtonsForCategoriesPage();
            }
            return;
        }

        const posts = Array.from(blogPostsGrid.children); // Get all post-card elements

        // Collect all unique tags
        const allTags = new Set();
        posts.forEach(post => {
            const tagsAttr = post.dataset.tags; // Assumes tags are comma-separated in data-tags attribute
            if (tagsAttr) {
                tagsAttr.split(',').map(tag => tag.trim()).forEach(tag => allTags.add(tag));
            }
        });

        // Add dynamically generated tag buttons
        const sortedTags = Array.from(allTags).sort(); // Alphabetical sort for consistency
        sortedTags.forEach(tag => {
            const button = document.createElement('button');
            button.classList.add('filter-tag-button');
            button.textContent = ` #${tag}`;
            button.dataset.filter = tag; // Store filter value
            categoryFiltersContainer.appendChild(button);

            button.addEventListener('click', () => filterPosts(tag, button));
        });

        // Function to filter posts
        const filterPosts = (filterTag, clickedButton = null) => {
            // Update active state of buttons
            categoryFiltersContainer.querySelectorAll('.filter-tag-button').forEach(btn => {
                btn.classList.remove('active');
            });
            if (clickedButton) {
                clickedButton.classList.add('active'); // Set clicked button active
            } else {
                 // If no button clicked (e.g., from URL param), activate 'all' button
                const allBtn = categoryFiltersContainer.querySelector('[data-filter="all"]');
                if (filterTag === 'all' && allBtn) {
                     allBtn.classList.add('active');
                }
            }


            posts.forEach(post => {
                const tagsAttr = post.dataset.tags;
                if (!tagsAttr) {
                    post.style.display = (filterTag === 'all') ? 'block' : 'none'; // Always show for 'all' if no tags attribute
                    return;
                }
                const postTags = tagsAttr.split(',').map(tag => tag.trim());

                if (filterTag === 'all' || postTags.includes(filterTag)) {
                    post.style.display = 'block'; // Show
                } else {
                    post.style.display = 'none'; // Hide
                }
            });
            console.log(`[CategoryFilter] Filtering posts by: "${filterTag}"`);
        };

        // Check URL parameter for initial filtering on page load
        const urlParams = new URLSearchParams(window.location.search);
        const initialTag = urlParams.get('tag'); // e.g., ?tag=编程
        if (initialTag) {
            const initialButton = categoryFiltersContainer.querySelector(`[data-filter="${initialTag}"]`);
            filterPosts(initialTag, initialButton);
        } else {
            filterPosts('all', categoryFiltersContainer.querySelector('[data-filter="all"]')); // Default to 'all'
        }

         // Specific function for categories page needs to generate buttons that link to blog.html with query params
        if (window.location.pathname.endsWith('categories.html')) {
            generateCategoryButtonsForCategoriesPage(allTags);
        }
    };

    // New function to generate buttons on categories.html
    const generateCategoryButtonsForCategoriesPage = (allTags) => {
        const dynamicCategoryList = document.getElementById('dynamic-category-list');
        if (!dynamicCategoryList || !allTags) return;

        // Ensure dynamic list is empty before adding
        dynamicCategoryList.innerHTML = ''; 

        // Sort tags before displaying
        const sortedTags = Array.from(allTags).sort();
        
        sortedTags.forEach(tag => {
            const buttonLink = document.createElement('a');
            buttonLink.href = `blog.html?tag=${encodeURIComponent(tag)}`;
            buttonLink.classList.add('filter-tag-button'); // Reuse button style
            buttonLink.textContent = ` #${tag}`;
            // These buttons are links, so they'll use global activatePageTransition
            dynamicCategoryList.appendChild(buttonLink);
        });
        console.log(`[CategoryPage] Generated ${sortedTags.length} category links.`);
    };


    // --- Share buttons for article pages ---
    const setupShareButtons = () => {
        const shareButtons = document.querySelectorAll('.post-share-buttons a.weibo, .post-share-buttons a.qq');
        if (shareButtons.length === 0) return; 

        // Use `window.location.origin + window.location.pathname` for base URL, then add params.
        const currentUrl = encodeURIComponent(window.location.href); 
        const pageTitle = document.title;
        const articleTitle = encodeURIComponent(pageTitle.split(' - ')[0] || "Honoka的小屋"); 

        shareButtons.forEach(btn => {
            if (btn.classList.contains('weibo')) {
                btn.href = `https://service.weibo.com/share/share.php?url=${currentUrl}&title=${articleTitle}`;
            } else if (btn.classList.contains('qq')) {
                const imgElement = document.querySelector('.post-detail-banner');
                const imgUrl = (imgElement && imgElement.src && !imgElement.classList.contains('is-loading-fallback') && !imgElement.src.includes('data:image/')) ? encodeURIComponent(imgElement.src) : '';
                btn.href = `https://connect.qq.com/widget/shareqq/index.html?url=${currentUrl}&title=${articleTitle}${imgUrl ? '&pics=' + imgUrl : ''}`;
            }
        });
    };
    
    // --- Footer dynamic details and Dynamic Blur Adjustment for Body ---
    const setupFooterAndDynamicBlur = () => {
        // Dynamic copyright year
        const currentYearSpan = document.getElementById('current-year');
        if (currentYearSpan) {
            currentYearSpan.textContent = new Date().getFullYear();
        }

        // Simple visitor counter (LocalStorage)
        const visitorCountSpan = document.getElementById('visitor-count');
        if (visitorCountSpan) {
            let visitorCount = parseInt(localStorage.getItem('visitorCount')) || 0;
            visitorCount++;
            localStorage.setItem('visitorCount', visitorCount.toString());
            visitorCountSpan.textContent = visitorCount;
        }

        // Dynamic Background Blur Adjustment for Body (performance/readability)
        const updateBodyBlur = () => {
            const desktopBlur = getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur').trim();
            const mobileBlur = getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur-mobile').trim();

            isMobile = window.innerWidth <= 767; // Re-evaluate isMobile on resize
            if (isMobile) { 
                document.documentElement.style.setProperty('--body-global-blur-value', mobileBlur);
                document.body.classList.add('is-mobile'); // Dynamically add class
            } else {
                document.documentElement.style.setProperty('--body-global-blur-value', desktopBlur);
                document.body.classList.remove('is-mobile'); // Dynamically remove class
            }
        };
        
        document.documentElement.style.setProperty('--body-global-blur-value', getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur').trim()); // Default initial value based on desktop
        updateBodyBlur(); // Apply on load
        window.addEventListener('resize', updateBodyBlur); // Update on window resize
    }


    // --- Initialize all features on DOM Ready ---
    setupDynamicPostImages(); 
    setupScrollAnimations();
    setupBackToTopButton();
    setupCursorTrail();
    setupReadProgressBar();
    setupMainMenu(); 
    setupShareButtons();
    // This function also handles dynamic blur adjust
    setupFooterAndDynamicBlur(); 

    // Handle Category/Tag filters specifically for blog page or generate for categories page
    setupPostCategoryFilters();


    // Debugging current mode
    // console.log(`[System] Initial device type detection: ${isMobile ? 'Mobile' : 'Desktop'}`);
    // if (!document.body.classList.contains('is-mobile') && window.innerWidth <= 767) {
    //    console.warn("[System] 'is-mobile' class mismatch with window.innerWidth, should re-evaluate/refresh.");
    // }
});
