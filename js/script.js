document.addEventListener('DOMContentLoaded', () => {

    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if(isMobile) {
        document.body.classList.add('is-mobile');
    }

    // --- Global Page Transition Overlay Management ---
    const pageTransitionOverlay = document.getElementById('global-page-transition-overlay');
    if (pageTransitionOverlay) {
        // Prepare overlay content (if not already present from HTML)
        if (!pageTransitionOverlay.querySelector('.loader')) {
            pageTransitionOverlay.innerHTML = `
                <div class="loader"></div>
                <p class="overlay-text">加载中...</p>
            `;
        }
        // Initially hide overlay after page loads
        // Using a slight delay to ensure the page is fully rendered before hiding
        setTimeout(() => {
            pageTransitionOverlay.classList.remove('visible');
            setTimeout(() => {
                pageTransitionOverlay.style.display = 'none';
                document.body.classList.remove('no-scroll'); // Re-enable body scroll if it was disabled
            }, 500); // Match CSS transition duration
        }, 100); 
    }

    const activatePageTransition = (urlToNavigate) => {
        if (!pageTransitionOverlay) {
            window.location.href = urlToNavigate; // Fallback if overlay is missing
            return;
        }
        document.body.classList.add('no-scroll'); // 禁用滚动
        pageTransitionOverlay.style.display = 'flex'; // Make sure overlay is ready to be shown
        pageTransitionOverlay.classList.add('visible');
        
        // After fade-in transition (0.4s CSS), navigate
        setTimeout(() => {
            window.location.href = urlToNavigate;
        }, 400); // Matches CSS transition duration
    };

    // Intercept all internal link clicks for smooth transitions
    document.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');
        // Check if it's an internal, non-fragment link, and not a mailto
        if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.includes('#')) {
            link.addEventListener('click', (e) => {
                e.preventDefault(); 
                activatePageTransition(href);
            });
        }
    });

    // --- Random Anime Wallpaper API for dynamic backgrounds/images ---
    /**
     * Fetches a random anime image from various APIs.
     * @param {HTMLElement} targetElement - The element to apply the image to (body for background, img for src).
     * @param {string} type - 'background' or 'image'
     * @param {object} options - Configuration options.
     * @param {boolean} options.preferLandscape - Whether to prioritize landscape images.
     * @param {number} options.width - Desired width for image (for Unsplash mostly).
     * @param {number} options.height - Desired height for image (for for image dimension hints, not strict).
     */
    const fetchRandomAnimeImage = async (targetElement, type = 'background', options = { preferLandscape: true, width: 1920, height: 1080 }) => {
        let imageUrl = '';
        const { preferLandscape, width, height } = options;
        
        const unsplashKeywords = (type === 'image' && preferLandscape) ? 'anime,manga,landscape,art,fantasy,wide' : 'anime,manga,wallpaper';
        // Ordered by perceived reliability and suitability for landscape anime
        const apiEndpoints = [
            `https://random.dog/${width}x${height}/?query=${unsplashKeywords}`, // Unsplash proxy might be more reliable
            `https://source.unsplash.com/random/${width}x${height}/?${unsplashKeywords}`, /* Unsplash for diverse landscape possibilities */
            'https://iw233.cn/api/Pure.php',               /* Direct image API, often landscape anime. */
            'https://api.adicw.cn/img/rand',               /* Direct image API, mixed portrait/landscape */
            'https://api.btstu.cn/sjbz/api.php?lx=dongman&format=json' /* JSON API by bts.tu.cn for anime images */
        ];
        
        for (const api of apiEndpoints) {
            try {
                // Try fetching from the API with a timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 seconds timeout for each API
                const response = await fetch(api, { method: 'GET', redirect: 'follow', signal: controller.signal });
                clearTimeout(timeoutId);

                if (response.ok) {
                    const contentType = response.headers.get('content-type');
                    // Check for direct image content-type
                     if (contentType && contentType.startsWith('image/')) {
                        imageUrl = response.url; // The actual final image URL after redirects
                        console.log(`Using Direct Image API (${api.split('?')[0]}): ${imageUrl ? imageUrl.substring(0, 50) + '...' : 'Invalid URL'}`);
                        if (imageUrl) break;
                    } 
                    // Handle JSON-based APIs specifically
                    else if (api.includes('btstu.cn')) { // If it's the btstu API, it returns JSON
                        const data = await response.json();
                        if (data && data.imgurl && typeof data.imgurl === 'string' && data.imgurl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
                            imageUrl = data.imgurl;
                            console.log(`Using BTSTU API (${api}): ${imageUrl.substring(0, 50)}...`);
                            break;
                            
                        }
                    } else {
                        console.warn(`API ${api} did not return expected image or JSON. Content-Type: ${contentType}`);
                    }
                } else {
                    console.warn(`API ${api} responded with status ${response.status}. Trying next.`);
                }
            } catch (innerError) {
                if (innerError.name === 'AbortError') {
                    console.warn(`API ${api} timed out after 6s, trying next.`);
                } else {
                    console.warn(`API ${api} fetch error:`, innerError);
                }
            }
        }
        
        // --- Image Loading and Application ---
        if (imageUrl) {
            const imgToLoad = new Image(); // Use Image object for preloading
            imgToLoad.src = imageUrl;
            imgToLoad.onload = () => {
                if (type === 'background') {
                    document.documentElement.style.setProperty('--bg-image', `url(${imageUrl})`);
                } else if (type === 'image') {
                    targetElement.src = imageUrl; // Set current img's src
                    targetElement.style.opacity = '1'; // Ensure visibility
                }
                targetElement.classList.remove('is-loading-fallback'); 
                // Any fallback text/div that was added will be removed
                const fallbackText = targetElement.nextElementSibling;
                if (fallbackText && fallbackText.classList.contains('fallback-text-overlay')) {
                    fallbackText.remove();
                }
            };
            imgToLoad.onerror = (e) => { // If the preloaded image fails after getting URL
                console.warn(`Preloaded image (${imageUrl}) failed to render. Applying fallback.`);
                applyFallbackImage(targetElement, type);
            };
        } else { // No image URL obtained from any API
            console.error('Failed to obtain any image URL from APIs after all attempts. Applying fallback.');
            applyFallbackImage(targetElement, type);
        }
    };
    
    // --- Helper for fallback images (to avoid repetition) ---
    const applyFallbackImage = (targetElement, type) => {
        if (type === 'background') {
             // For body background, apply a dynamic gradient
            document.documentElement.style.setProperty('--bg-image', getRandomGradient());
        } else if (type === 'image') {
            const isThumbnail = targetElement.classList.contains('post-thumbnail');
            const fallbackSuffix = isThumbnail ? 'post-thumbnail-fallback.png' : 'post-detail-banner-fallback.png';
            // Determine the correct relative path based on current page URL
            const baseRelativePath = window.location.pathname.includes('/posts/') ? '../img/' : './img/';
            const localFallbackSrc = `${baseRelativePath}${fallbackSuffix}`;
            
            // Set the src to local fallback. Even if it's broken, it points locally.
            targetElement.src = localFallbackSrc; 
            targetElement.style.objectFit = 'contain'; // Make sure the fallback image (if it exists) is fully visible
            targetElement.classList.add('is-loading-fallback'); 
            targetElement.style.opacity = '1'; // Ensure the img element itself is visible
            
            // Add a text overlay for a clear user message, possibly overlaying the fallback image
            let fallbackTextOverlay = targetElement.querySelector('.fallback-text-overlay');
            if (targetElement.tagName === 'IMG') { // Only for actual <img> elements
                if (!fallbackTextOverlay && targetElement.parentNode) {
                    fallbackTextOverlay = document.createElement('div');
                    fallbackTextOverlay.classList.add('fallback-text-overlay');
                    fallbackTextOverlay.textContent = isThumbnail ? "封面加载失败 :(" : "图片加载失败 :(";
                    targetElement.parentNode.style.position = 'relative'; // Ensure parent allows absolute positioning
                    targetElement.parentNode.insertBefore(fallbackTextOverlay, targetElement.nextSibling);
                } else if (fallbackTextOverlay) {
                    fallbackTextOverlay.textContent = isThumbnail ? "封面加载失败 :(" : "图片加载失败 :(";
                    fallbackTextOverlay.style.display = 'flex'; // Ensure visible
                }
                // Also apply a background gradient on the image element itself, so even a missing local file gets color
                targetElement.style.backgroundImage = getRandomGradient();
                targetElement.style.backgroundRepeat = 'no-repeat';
                targetElement.style.backgroundPosition = 'center';
                targetElement.style.backgroundSize = 'cover';
                console.log(`Applied fallback styling and text for: ${targetElement.alt}`);

            } else {
                 console.error('Fallback logic called on a non-IMG element with type image.');
            }
        }
    };
    
    function getRandomGradient() {
        const h1 = Math.floor(Math.random() * 360);
        const h2 = (h1 + 60 + Math.floor(Math.random() * 60)) % 360; 
        const s = Math.floor(Math.random() * 50) + 50; 
        const l = Math.floor(Math.random() * 20) + 60; 
        return `linear-gradient(135deg, hsla(${h1}, ${s}%, ${l}%, 0.7), hsla(${h2}, ${s}%, ${l}%, 0.7))`;
    }


    // --- Main Body Background (for all pages) ---
    fetchRandomAnimeImage(document.body, 'background', { preferLandscape: true, width: 1920, height: 1080 }); // Always set body background

    const setupHomepageBackground = () => {
         // Placeholder as body background is handled globally
    };

    // --- Dynamic Article Thumbnail/Banner Images ---
    const setupDynamicPostImages = () => {
        document.querySelectorAll('.post-thumbnail[data-src-type="wallpaper"]').forEach(img => {
            applyFallbackImage(img, 'image'); // Immediately apply fallback state for instant UI feedback
            fetchRandomAnimeImage(img, 'image', { preferLandscape: true, width: 500, height: 300 }); 
        });

        const detailBanner = document.querySelector('.post-detail-banner[data-src-type="wallpaper"]');
        if (detailBanner) {
            applyFallbackImage(detailBanner, 'image'); // Immediately apply fallback state
            fetchRandomAnimeImage(detailBanner, 'image', { preferLandscape: true, width: 1000, height: 400 }); 
        }
    };

    // --- Intersection Observer for Scroll-Triggered Animations ---
    const setupScrollAnimations = () => {
        const animatedElements = document.querySelectorAll('.animate__fade-in:not(.main-header), .animate__slide-up');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    // Only unobserve non-homepage-title and non-header-title. These are CSS-animated indefinitely.
                    if (!entry.target.classList.contains('is-homepage-title') && !entry.target.classList.contains('is-header-title')) {
                         observer.unobserve(entry.target);
                    }
                } 
            });
        }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

        animatedElements.forEach(el => observer.observe(el));

        const mainHeader = document.querySelector('.main-header');
        if (mainHeader) {
            setTimeout(() => {
                // To ensure header has visible animation
                mainHeader.classList.add(isMobile ? 'animate__fade-in': 'is-visible'); 
            }, 50); 
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
    };
    
    // --- Custom Cursor Trail Effect ---
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
                    trail.parentNode.removeChild(trail);
                }
            }, 500); 
        });

        document.querySelectorAll('a, button, input:not([type="submit"]), textarea, .post-card, .menu-toggle').forEach(el => {
            el.onmouseenter = () => { // Hover effects for cursor
                cursorDot.style.transform = 'translate(-50%,-50%) scale(1.5)';
                cursorDot.style.backgroundColor = 'var(--secondary-color)';
            };
            el.onmouseleave = () => { // Revert hover effects for cursor
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
            const scrollFromTop = window.scrollY;

            let totalScrollableHeight = documentHeight - windowHeight;
            let currentReadProgress = (scrollFromTop / totalScrollableHeight) * 100;
            
            currentReadProgress = Math.min(100, Math.max(0, currentReadProgress)); // Clamp between 0 and 100

            progressBar.style.width = currentReadProgress + '%';
        }

        window.addEventListener('scroll', calculateProgress);
        window.addEventListener('resize', calculateProgress); 
        calculateProgress(); // Initial call
        setTimeout(calculateProgress, 500); // Small delay to calc after layout done
    };
    
    // --- Setup Main Navigation Menu (Unified Hamburger for Desktop/Mobile) ---
    const setupMainMenu = () => {
        const menuToggle = document.querySelector('.menu-toggle');
        const mainNav = document.getElementById('main-nav-menu'); 
        const menuClose = document.querySelector('.main-nav .menu-close');
        
        if (!menuToggle || !mainNav || !menuClose) {
            console.warn('Menu elements not found, main menu features disabled.');
            document.body.classList.remove('no-scroll');
            return;
        }

        // --- Open Menu ---
        menuToggle.addEventListener('click', () => {
            mainNav.classList.add('is-open');
            menuToggle.setAttribute('aria-expanded', 'true');
            document.body.classList.add('no-scroll'); 
        });

        // --- Close Menu ---
        const closeMenu = () => {
            mainNav.classList.remove('is-open');
            menuToggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('no-scroll');
        };

        menuClose.addEventListener('click', closeMenu);

        // Close menu when a navigation link is clicked inside the menu
        mainNav.querySelectorAll('a').forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.includes('#')) {
                link.addEventListener('click', () => {
                    setTimeout(() => {
                        closeMenu(); 
                    }, 400); 
                });
            } else { 
                link.addEventListener('click', closeMenu);
            }
        });
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
                const imgUrl = imgElement && imgElement.src && !imgElement.classList.contains('is-loading-fallback') ? encodeURIComponent(imgElement.src) : '';
                btn.href = `https://connect.qq.com/widget/shareqq/index.html?url=${currentUrl}&title=${articleTitle}${imgUrl ? '&pics=' + imgUrl : ''}`;
            }
        });
    };
    
    // --- Footer dynamic details ---
    const setupFooterDetails = () => {
        const currentYearSpan = document.getElementById('current-year');
        if (currentYearSpan) {
            currentYearSpan.textContent = new Date().getFullYear();
        }

        const visitorCountSpan = document.getElementById('visitor-count');
        if (visitorCountSpan) {
            let visitorCount = parseInt(localStorage.getItem('visitorCount')) || 0;
            visitorCount++;
            localStorage.setItem('visitorCount', visitorCount.toString());
            visitorCountSpan.textContent = visitorCount;
        }
    }


    // --- Initialize all features on DOM Ready ---
    setupHomepageBackground(); 
    setupDynamicPostImages(); 
    setupScrollAnimations();
    setupBackToTopButton();
    setupCursorTrail();
    setupReadProgressBar();
    setupMainMenu(); 
    setupShareButtons();
    setupFooterDetails(); 

    // Initial check for body blur based on mobile state and responsive updates
    const updateBodyBlur = () => {
        const mobileBlur = getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur-mobile').trim();
        const desktopBlur = getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur').trim();

        if (window.innerWidth <= 767) { 
            document.documentElement.style.setProperty('--body-global-blur-value', mobileBlur); // Use a global variable to store actual blur
        } else {
            document.documentElement.style.setProperty('--body-global-blur-value', desktopBlur);
        }
    };
    document.documentElement.style.setProperty('--body-global-blur-value', '3px'); // Default
    updateBodyBlur(); // Apply on load
    window.addEventListener('resize', updateBodyBlur); 
});
