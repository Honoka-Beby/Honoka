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
        const href = new URL(link.href); // Parse URL relative to document
        const currentOrigin = window.location.origin;

        // Condition for internal links: same origin, non-mailto, non-fragment(hash) links
        // Exclude specific script usage links, like "javascript:void(0)"
        if (href.origin === currentOrigin && !href.protocol.startsWith('mailto:') && href.hash === '' && !href.pathname.endsWith('javascript:void(0)')) {
            link.addEventListener('click', (e) => {
                if (link.target === '_blank') return; // Do not intercept _blank links
                e.preventDefault(); 
                activatePageTransition(link.href);
            });
        }
    });

    // ################### NEW: Backend API Endpoints & Fetching ###################
    // !!! IMPORTANT: Replace with your actual Netlify Functions URLs !!!
    // Make sure your Netlify Functions URLs are correct. 
    // They will typically be: https://YOUR_NETLIFY_SITE_NAME.netlify.app/.netlify/functions/FUNCTION_NAME
    // Honoka's current Netlify domain from screenshot is honoka1.netlify.app
    const backendBaseUrl = 'https://honoka1.netlify.app/.netlify/functions/'; // Replace with your base function URL


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
            // console.warn(`[ImageLoader] 🔄 ${apiDebugName} failed to extract image URL from response. Content-Type: ${contentType}`);
            return ''; 
        };
        
        // Revised Priority Ordered API Endpoints (focused on high-reliability anime images)
        // Disabling unreliable APIs based on your net panel screenshot
        const apiEndpoints = [
            `https://iw233.cn/api/Pure.php`,                             // 高品质动漫图, 直链 (Strongly recommended for reliability)
            `https://api.adicw.cn/img/rand`,                            // 有效动漫图, 直链 (Frequently works well for anime)
            // `https://random.image.cat/random-cats-image/?imageSize=${width}x${height}`, // General image, not specific to anime

            `https://api.btstu.cn/sjbz/api.php?lx=dongman&format=json`, // JSON API 动漫图，稳定备用。
            // Unsplash needs API Key, otherwise it fails often. Commenting out or replace client_id.
            // `https://api.unsplash.com/photos/random?orientation=landscape&query=anime,manga,art&client_id=YOUR_UNSPLASH_ACCESS_KEY`,
            // `https://random.dog/api/breeds/image`,                   // Not anime, but general purpose image if anime-specific fail. returns JSON with 'url'
            // `https://random.cat/meow`                                 // Another general image fallback
             // `https://dd-api.mewx.me/img/Pure.php`, // Another often reliable image API for anime (consider adding)
             // `https://unsplash.com/photos/random?query=anime,manga,wallpaper&orientation=landscape/200x200`
        ];

        for (const api of apiEndpoints) {
            // Generic name for debugging console logs
            const apiDebugName = new URL(api).hostname.split('.').slice(-2).join('.'); 
            try {
                const controller = new AbortController();
                // Increased timeout to 8 seconds per API to allow more time for slower APIs.
                const timeoutId = setTimeout(() => controller.abort(), 8000); 
                
                const fetchOptions = { method: 'GET', redirect: 'follow', signal: controller.signal };
                // Specific headers/options for certain APIs if needed (e.g. Unsplash for JSON response)
                if (api.includes('unsplash.com/photos/random')) {
                    fetchOptions.headers = { 'Accept': 'application/json' };
                }

                const response = await fetch(api, fetchOptions);
                clearTimeout(timeoutId);

                if (response.ok) {
                    imageUrl = await extractImageUrl(response, apiDebugName);
                    if (imageUrl) {
                        // console.log(`[ImageLoader] ✅ API Success (${apiDebugName}): ${imageUrl.substring(0, 50)}...`);
                        break; // Found a valid image
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
                    // Update CSS custom property for the body background image
                    document.documentElement.style.setProperty('--bg-image', `url("${imageUrl}")`); 
                    // console.log(`[ImageLoader] ✅ Applied dynamic background image: ${imageUrl.substring(0, 50)}...`);
                } else if (type === 'image') {
                    targetElement.src = imageUrl; 
                    targetElement.style.opacity = '1'; 
                    targetElement.style.objectFit = 'cover'; 
                }
                // Clear all fallback states once real image loads
                targetElement.classList.remove('is-loading-fallback'); 
                targetElement.style.filter = ''; // Remove any grayscale/blur filter
                // Remove fallback text overlay element if it was present
                const fallbackText = targetElement.nextElementSibling;
                if (fallbackText && fallbackText.classList.contains('fallback-text-overlay')) {
                    fallbackText.remove();
                }
            };
            imgToLoad.onerror = () => { 
                console.warn(`[ImageLoader] 🚫 Preloaded image (${imageUrl.substring(0, 50)}...) failed to render (empty/broken). Applying local fallback.`);
                applyFallbackImage(targetElement, type); // Apply local fallback if preloading the fetched URL fails
            };
        } else { // No image URL obtained from any API after all attempts
            console.error('[ImageLoader] ❌ All online APIs failed to provide a valid image URL. Forcing local fallback.');
            applyFallbackImage(targetElement, type); // Apply local fallback directly if no URL was found
        }
    };
    
    // --- Helper for applying fallback images/styles (to avoid repetition) ---
    /**
     * Applies local fallback image and text overlay, also setting CSS for visual feedback.
     * @param {HTMLElement} targetElement - The image element to apply fallback to.
     * @param {string} type - 'background' or 'image'.
     * @param {string|null} srcOverride - Optional direct path to a specific local fallback image.
     */
    const applyFallbackImage = (targetElement, type, srcOverride = null) => {
        const isThumbnail = targetElement.classList.contains('post-thumbnail');
        const fallbackSuffix = isThumbnail ? 'post-thumbnail-fallback.png' : 'post-detail-banner-fallback.png';
        // Determine the correct relative path based on current page URL for local assets
        const baseRelativePath = window.location.pathname.includes('/posts/') ? '../img/' : './img/';
        const localFallbackSrc = srcOverride || `${baseRelativePath}${fallbackSuffix}`;
        
        if (type === 'background') {
            document.documentElement.style.setProperty('--bg-image', getRandomGradient());
            // console.log(`[ImageLoader] 🖼️ Applied gradient background fallback.`);
        } else if (type === 'image') {
            targetElement.src = localFallbackSrc; // Set src to the local fallback image file
            targetElement.style.objectFit = 'contain'; // Scale fallback image to fit without cropping
            targetElement.classList.add('is-loading-fallback'); // Add class for CSS to apply filter etc.
            targetElement.style.opacity = '1'; // Ensure the img element itsel f is visible
            
            // Apply a dynamic gradient background directly to the image element
            targetElement.style.backgroundImage = getRandomGradient(); 
            // Position and size this gradient background
            targetElement.style.backgroundRepeat = 'no-repeat';
            targetElement.style.backgroundPosition = 'center';
            targetElement.style.backgroundSize = 'cover';

            // Create/update a text overlay for clear feedback to the user
            let fallbackTextOverlay = targetElement.nextElementSibling;
            if (targetElement.tagName === 'IMG') {
                if (!fallbackTextOverlay || !fallbackTextOverlay.classList.contains('fallback-text-overlay')) {
                    fallbackTextOverlay = document.createElement('div');
                    fallbackTextOverlay.classList.add('fallback-text-overlay');
                    fallbackTextOverlay.textContent = isThumbnail ? "封面加载失败 :(" : "图片加载失败 :(";
                    // Ensure the parent element is positioned to correctly place the absolute overlay
                    if (targetElement.parentNode && getComputedStyle(targetElement.parentNode).position === 'static') {
                        targetElement.parentNode.style.position = 'relative'; 
                    }
                    targetElement.parentNode.insertBefore(fallbackTextOverlay, targetElement.nextSibling); // Insert after img
                } else {
                    fallbackTextOverlay.textContent = isThumbnail ? "封面加载失败 :(" : "图片加载失败 :("; // Update text if needed
                    fallbackTextOverlay.style.display = 'flex'; // Ensure it's rendered
                }

                // Small trick: Test if the local fallback image itself loads, if not, hide <img> purely
                const testLocalImage = new Image();
                testLocalImage.src = localFallbackSrc;
                testLocalImage.onload = () => {
                    if (targetElement.style.display === 'none') targetElement.style.display = ''; // Show image if it loads fine now
                    if (fallbackTextOverlay) fallbackTextOverlay.style.display = 'flex'; // Keep overlay
                };
                testLocalImage.onerror = () => {
                    targetElement.style.display = 'none'; // Hide the `<img>` element if its `src` (even local fallback) is broken
                    if (fallbackTextOverlay) fallbackTextOverlay.style.display = 'flex'; // Ensure overlay is visible over the gradient background then
                    console.warn(`[ImageLoader] 🚫 Local fallback image "${localFallbackSrc}" itself failed to load. Showing only text overlay over gradient.`);
                };
            }
            // console.log(`[ImageLoader] 🎨 Applied local fallback and overlay for: ${targetElement.alt || 'Unnamed Image Title'}`);
        }
    };
    
    // Generates a random vibrant linear gradient for fallback backgrounds
    function getRandomGradient() {
        const h1 = Math.floor(Math.random() * 360);
        const h2 = (h1 + 60 + Math.floor(Math.random() * 60)) % 360; // Second hue distinct from first
        const s = Math.floor(Math.random() * 30) + 70; // High saturation for vibrancy (70-99%)
        const l = Math.floor(Math.random() * 20) + 50; // Medium lightness (50-69%)
        return `linear-gradient(135deg, hsla(${h1}, ${s}%, ${l}%, 0.7), hsla(${h2}, ${s}%, ${l}%, 0.7))`;
    }


    // --- Global Background Image Setup (for Body) ---
    fetchRandomAnimeImage(document.body, 'background', { width: 1920, height: 1080 }); // Always fetches a random background for the body


    // --- Dynamic Article Thumbnail/Banner Images ---
    const setupDynamicPostImages = () => {
        document.querySelectorAll('.post-thumbnail[data-src-type="wallpaper"]').forEach(img => {
            // Apply fallback upfront to minimize visual loading gaps
            applyFallbackImage(img, 'image'); 
            fetchRandomAnimeImage(img, 'image', { width: 500, height: 300 }); // Fetches source for smaller thumbnails
        });

        const detailBanner = document.querySelector('.post-detail-banner[data-src-type="wallpaper"]');
        if (detailBanner) {
            applyFallbackImage(detailBanner, 'image'); 
            fetchRandomAnimeImage(detailBanner, 'image', { width: 1000, height: 400 }); // Fetches source for larger banners
        }
    };

    // --- Intersection Observer for Scroll-Triggered Animations ---
    /**
     * Sets up Intersection Observer to trigger entrance animations for elements with specific classes.
     * Elements with 'is-visible' or elements that trigger looping animations (like titles) are skipped.
     */
    const setupScrollAnimations = () => {
        // Select elements scheduled for animate__fade-in or animate__slide-up
        const animatedElements = document.querySelectorAll('.animate__fade-in, .animate__slide-up');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Check if animation has already been applied or specific looping elements
                    const isLooper = entry.target.closest('.is-homepage-title') || entry.target.closest('.is-header-title');
                    if (isLooper && entry.target.classList.contains('is-visible')) {
                         // Don't apply to looping animations again, but keep visible. These are CSS driven.
                    } else if (!entry.target.classList.contains('is-visible')) {
                        // Apply animation and mark as visible
                        entry.target.classList.add('is-visible');
                        if (!isLooper) { // Only unobserve non-looping animations after they become visible once
                            observer.unobserve(entry.target);
                        }
                    } 
                } 
            });
        }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }); // `rootMargin` makes animation trigger earlier

        animatedElements.forEach(el => observer.observe(el));

        // Ensure main header always has its initial fade-in or is visible on load
        const mainHeader = document.querySelector('.main-header');
        if (mainHeader && !mainHeader.classList.contains('is-visible')) {
            mainHeader.classList.add('is-visible'); 
        }
    };

    // --- Back to Top Button ---
    const setupBackToTopButton = () => {
        const btn = document.getElementById('back-to-top');
        if (!btn) return;

        // Show/hide based on scroll position
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) { 
                btn.classList.add('show');
            } else {
                btn.classList.remove('show');
            }
        });

        // Event listener for smooth scroll to top
        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        // Set initial visibility on load
        if (window.scrollY > 300) { btn.classList.add('show'); }
        // console.log("[BackToTop] Initial check for visibility.");
    };
    
    // --- Custom Cursor Trail Effect ---
    const setupCursorTrail = () => {
        const cursorDot = document.getElementById('cursor-trail');
        // Disable on mobile devices or if cursorDot element is missing
        if (!cursorDot || isMobile) { // Use dynamically updated isMobile
            if (cursorDot) cursorDot.style.display = 'none'; // Ensure main cursor dot is hidden
            document.body.style.cursor = 'auto'; // Restore default pointer
            return;
        }
        
        // Desktop-only cursor trail functionality: tracks mouse and adds temporary dots
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

        // Hover effects for various interactive elements to change cursor's appearance
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
    };

    // --- Read Progress Bar for Article Pages ---
    const setupReadProgressBar = () => {
        const progressBar = document.getElementById('read-progress-bar');
        const content = document.querySelector('.blog-post-detail'); // Article content area

        if (!progressBar || !content) return; 

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
        // console.log("[ReadProgressBar] Enabled for article page.");
    };
    
    // --- Main Navigation Menu (Mini-Panel UI) ---
    const setupMainMenu = () => {
        const menuToggle = document.querySelector('.menu-toggle');
        const mainNav = document.getElementById('main-nav-menu'); 
        const menuClose = document.querySelector('.main-nav .menu-close');
        
        if (!menuToggle || !mainNav || !menuClose) {
            console.warn('[MainMenu] Menu (toggle, nav, or close button) elements not found. Main menu features disabled.');
            document.body.classList.remove('no-scroll');
            return;
        }

        const openMenu = () => {
            mainNav.classList.add('is-open'); 
            menuToggle.setAttribute('aria-expanded', 'true');
            document.body.classList.add('no-scroll'); // Disable body scroll when menu is open
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

        // Close menu on clicks outside, but exclude toggle button and menu content itself
        document.body.addEventListener('click', (event) => {
            if (mainNav.classList.contains('is-open') && 
                !mainNav.contains(event.target) &&  // Click not inside the menu panel
                !menuToggle.contains(event.target) && // Click not on the hamburger toggle button
                event.target.id !== 'goback') { // Exclude if you have a go-back button or similar
                closeMenu();
                // console.log("[MainMenu] Clicked outside menu, closed.");
            }
        });
    };


    // ################### NEW FEATURE: Blog Post Category/Tag Filtering ###################
    /**
     * Initializes category filter buttons for blog posts and handles filtering logic.
     * It also dynamically generates category links for the dedicated categories.html page.
     */
    const setupPostCategoryFilters = () => {
        const categoryFiltersContainer = document.getElementById('blog-category-filters');
        const blogPostsGrid = document.getElementById('all-posts-grid');
        const isCategoriesPage = window.location.pathname.includes('categories.html');
        const dynamicCategoryList = document.getElementById('dynamic-category-list'); // For categories.html

        if(window.location.pathname.includes('blog.html') && (!categoryFiltersContainer || !blogPostsGrid)){
             console.warn("[CategoryFilter] Blog posts/filters container not found, filter feature won't work on this type.");
        }


        const posts = Array.from(blogPostsGrid ? blogPostsGrid.children : []); // Get all post-card elements

        // Collect all unique tags from existing posts (both direct blog.html and categories.html will use this)
        const allTags = new Set();
        posts.forEach(post => {
            const tagsAttr = post.dataset.tags; 
            if (tagsAttr) {
                tagsAttr.split(',').map(tag => tag.trim()).forEach(tag => allTags.add(tag));
            }
        });

        // For `blog.html`: Generate interactive filter buttons
        if (categoryFiltersContainer && blogPostsGrid) {
            // First, ensure "All Posts" button exists
            let allButton = categoryFiltersContainer.querySelector('[data-filter="all"]');
             if (!allButton) {
                allButton = document.createElement('button');
                allButton.classList.add('filter-tag-button');
                allButton.textContent = `全部文章`;
                allButton.dataset.filter = 'all';
                categoryFiltersContainer.appendChild(allButton);
                allButton.addEventListener('click', () => filterPosts('all', allButton));
            }
            
            // Generate tag buttons
            const sortedTags = Array.from(allTags).sort((a,b) => a.localeCompare(b, 'zh-CN')); // Sort Chinese characters
            sortedTags.forEach(tag => {
                const button = document.createElement('button');
                button.classList.add('filter-tag-button');
                // Display text with a hash to visually represent as tag
                button.textContent = ` #${tag}`; 
                button.dataset.filter = tag; // Store filter value
                categoryFiltersContainer.appendChild(button);

                button.addEventListener('click', () => filterPosts(tag, button));
            });

            // Function to filter posts on blog.html
            const filterPosts = (filterTag, clickedButton = null) => {
                // Update active state of buttons
                categoryFiltersContainer.querySelectorAll('.filter-tag-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                if (clickedButton) {
                    clickedButton.classList.add('active'); // Set clicked button active
                } else if (filterTag === 'all' && allButton) {
                    allButton.classList.add('active'); // Default activate 'all'
                }

                posts.forEach(post => {
                    const tagsAttr = post.dataset.tags;
                    if (!tagsAttr) {
                        post.style.display = (filterTag === 'all') ? 'block' : 'none'; 
                        return;
                    }
                    const postTags = tagsAttr.split(',').map(tag => tag.trim());

                    if (filterTag === 'all' || postTags.includes(filterTag)) {
                        post.style.display = 'block'; // Show post
                    } else {
                        post.style.display = 'none'; // Hide post
                    }
                });
                // console.log(`[CategoryFilter] Filtering posts by: "${filterTag}"`);
            };

            // Check URL parameter for initial filtering on `blog.html` page load
            const urlParams = new URLSearchParams(window.location.search);
            const initialTag = urlParams.get('tag'); // e.g., ?tag=编程
            if (initialTag) {
                // Find and activate the corresponding button
                const initialButton = categoryFiltersContainer.querySelector(`[data-filter="${initialTag}"]`);
                filterPosts(initialTag, initialButton);
            } else {
                // Default to 'all' posts if no tag param
                filterPosts('all', allButton); 
            }
        }
        
        // For `categories.html`: Generate category links only
        if (isCategoriesPage && dynamicCategoryList) {
            dynamicCategoryList.innerHTML = ''; // Clear existing content

            const sortedTags = Array.from(allTags).sort((a,b) => a.localeCompare(b, 'zh-CN'));
            
            if (sortedTags.length === 0) {
                 dynamicCategoryList.innerHTML = `<p class="no-comments-message">暂时没有可用的文章分类。</p>`;
                 return;
            }

            sortedTags.forEach(tag => {
                const buttonLink = document.createElement('a');
                // Link format for `categories.html` will navigate to `blog.html?tag=CATEGORY_NAME`
                buttonLink.href = `blog.html?tag=${encodeURIComponent(tag)}`; 
                buttonLink.classList.add('filter-tag-button'); // Reuse button styling from main CSS
                buttonLink.textContent = ` # ${tag}`;
                 buttonLink.dataset.filter = tag; // Use data-filter to potentially highlight if needed
                dynamicCategoryList.appendChild(buttonLink);
            });
            // console.log(`[CategoryPage] Generated ${sortedTags.length} category links...`);
        }
    };


    // --- Share buttons for article pages ---
    const setupShareButtons = () => {
        const shareButtons = document.querySelectorAll('.post-share-buttons a.weibo, .post-share-buttons a.qq');
        if (shareButtons.length === 0) return; 

        const currentUrl = encodeURIComponent(window.location.href);
        const pageTitle = document.title;
        const articleTitle = encodeURIComponent(pageTitle.split(' - ')[0] || "Honoka的小屋"); 

        shareButtons.forEach(btn => {
            if (btn.classList.contains('weibo')) {
                btn.href = `https://service.weibo.com/share/share.php?url=${currentUrl}&title=${articleTitle}`;
            } else if (btn.classList.contains('qq')) {
                const imgElement = document.querySelector('.post-detail-banner');
                // Only include img if it loaded properly and is not a base64 encoded temporary image
                const imgUrl = (imgElement && imgElement.src && !imgElement.classList.contains('is-loading-fallback') && !imgElement.src.startsWith('data:image/')) 
                               ? encodeURIComponent(imgElement.src) 
                               : '';
                btn.href = `https://connect.qq.com/widget/shareqq/index.html?url=${currentUrl}&title=${articleTitle}${imgUrl ? '&pics=' + imgUrl : ''}`;
            }
        });
        // console.log("[ShareButtons] Initialized.");
    };
    
    // --- Footer dynamic details and Dynamic Blur Adjustment for Body (includes Backend Visitor Count) ---
    const setupFooterAndDynamicBlur = () => {
        // Dynamic copyright year
        const currentYearSpan = document.getElementById('current-year');
        if (currentYearSpan) {
            currentYearSpan.textContent = new Date().getFullYear();
            // console.log("[Footer] Copyright year updated.");
        }

        // --- NEW: Backend Visitor Counter ---
        const visitorCountSpan = document.getElementById('visitor-count');
        if (visitorCountSpan) {
            fetch(`${backendBaseUrl}handleVisitCount`) // Calls Netlify Function to increment and get count
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(error => { throw new Error(error.message || `HTTP error! status: ${response.status}`); });
                    }
                    return response.json();
                })
                .then(data => {
                    visitorCountSpan.textContent = data.count || 0;
                    // console.log(`[VisitorCount] Updated to: ${data.count}`);
                })
                .catch(error => {
                    console.error('Failed to update visitor count from backend:', error);
                    visitorCountSpan.textContent = '???'; // Fallback display
                });
        }

        // Dynamic Background Blur Adjustment for Body (performance/readability)
        const updateBodyBlur = () => {
            // Get blur values from CSS variables
            const desktopBlur = getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur').trim();
            const mobileBlur = getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur-mobile').trim();

            isMobile = window.innerWidth <= 767; // Re-evaluate isMobile on resize
            if (isMobile) { 
                // Set the mutable CSS variable based on mobile status 
                document.documentElement.style.setProperty('--body-global-blur-value', mobileBlur);
                document.body.classList.add('is-mobile'); 
            } else {
                document.documentElement.style.setProperty('--body-global-blur-value', desktopBlur);
                document.body.classList.remove('is-mobile'); 
            }
            // console.log(`[Blur] Body blur set to: ${getComputedStyle(document.documentElement).getPropertyValue('--body-global-blur-value')} (isMobile: ${isMobile})`);
        };
        
        // Initial setup for blur variable. Default to desktop until first resize/eval.
        document.documentElement.style.setProperty('--body-global-blur-value', getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur').trim());
        updateBodyBlur(); // Apply on first load
        window.addEventListener('resize', updateBodyBlur); // Update dynamically on window resize
    }


    // --- Initialize all features on DOM Ready ---
    setupRandomAnimeImage(document.documentElement.style, 'initial-background'); // Global CSS var for background
    setupDynamicPostImages(); 
    setupScrollAnimations();
    setupBackToTopButton();
    setupCursorTrail();
    setupReadProgressBar();
    setupMainMenu(); 
    setupShareButtons();
    setupFooterAndDynamicBlur(); 

    setupPostCategoryFilters(); // For both blog.html and categories.html

});
