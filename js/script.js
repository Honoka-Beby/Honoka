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
        // Apply transition only to standard internal page links that are not fragments (#)
        // And not external links, as transitions are only client-side.
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
     * @param {number} options.height - Desired height for image (for Unsplash mostly).
     */
    const fetchRandomAnimeImage = async (targetElement, type = 'background', options = { preferLandscape: true, width: 1920, height: 1080 }) => {
        let imageUrl = '';
        const { preferLandscape, width, height } = options;
        
        const unsplashKeywords = (type === 'image' && preferLandscape) ? 'anime,manga,landscape,art,fantasy,wide' : 'anime,manga,wallpaper';
        // Ordered by perceived reliability and suitability for landscape anime
        const apiEndpoints = [
            `https://source.unsplash.com/random/${width}x${height}/?${unsplashKeywords}`, // Unsplash for diverse landscape possibility 
            'https://iw233.cn/api/Pure.php',               // Direct image API, often landscape anime. NEW!
            'https://www.dmoe.cc/random.php',              // Direct image API, usually landscape anime
            'https://api.adicw.cn/img/rand',               // Direct image API, mixed portrait/landscape
            'https://api.btstu.cn/sjbz/api.php?lx=dongman&format=json' // JSON API, fallback for mixed orientation
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
                    // Check if it's a direct image URL (most of the top APIs)
                     if (contentType && contentType.startsWith('image/')) {
                        // For iw233.cn, the URL might sometimes be redirect, sometimes direct image
                        imageUrl = response.url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? response.url : 
                                   (response.redirected ? response.url : ''); // Use redirected URL if available and is image
                        if(!imageUrl && api.includes('iw233.cn') || api.includes('dmoe.cc') || api.includes('adicw.cn')){
                             // For these, assume the response.url *is* the image if contentType matches.
                             imageUrl = response.url;
                        }
                        console.log(`Using Direct Image API (${api.split('?')[0]}): ${imageUrl ? imageUrl.substring(0, 50) + '...' : 'Invalid URL'}`);
                        if (imageUrl) break;
                    } 
                    // Handle JSON-based APIs specifically
                    else if (api.includes('btstu.cn')) {
                        const data = await response.json();
                        if (data && data.imgurl && typeof data.imgurl === 'string' && data.imgurl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
                            imageUrl = data.imgurl;
                            console.log(`Using BTSTU API (${api}): ${imageUrl.substring(0, 50)}...`);
                            break;
                            
                        }
                    }
                }
            } catch (innerError) {
                if (innerError.name === 'AbortError') {
                    console.warn(`API ${api} timed out after 6s, trying next.`);
                } else {
                    console.warn(`API ${api} failed, trying next:`, innerError);
                }
            }
        }
        
        // --- Image Loading and Application ---
        if (imageUrl) {
            const imgToLoad = new Image();
            imgToLoad.src = imageUrl;
            imgToLoad.onload = () => {
                if (type === 'background') {
                    document.documentElement.style.setProperty('--bg-image', `url(${imageUrl})`);
                } else if (type === 'image') {
                    targetElement.src = imageUrl;
                }
                targetElement.classList.remove('is-loading-fallback'); 
            };
            imgToLoad.onerror = (e) => {
                console.warn(`Image preloading failed for ${imageUrl}, trying fallback. Reason:`, e);
                applyFallbackImage(targetElement, type);
            };
        } else {
            console.error('Failed to get any image URL from APIs after all attempts.');
            applyFallbackImage(targetElement, type);
        }
    };
    
    // --- Helper for fallback images (to avoid repetition) ---
    const applyFallbackImage = (targetElement, type) => {
        if (type === 'background') {
             // Set a dynamic gradient background directly to --bg-image CSS variable
            document.documentElement.style.setProperty('--bg-image', getRandomGradient());
        } else if (type === 'image') {
            const pathPrefix = (targetElement.closest('body').classList.contains('is-homepage')) ? 'img/' : '../img/';
            const fallbackSrc = targetElement.dataset.fallbackSrc || 
                                (targetElement.classList.contains('post-thumbnail') ? `${pathPrefix}post-thumbnail-fallback.png` : 
                                 targetElement.classList.contains('post-detail-banner') ? `${pathPrefix}post-detail-banner-fallback.png` : '');
            
            if (fallbackSrc) {
                targetElement.src = fallbackSrc;
                targetElement.style.objectFit = 'contain'; 
                targetElement.classList.add('is-loading-fallback'); 
            } else {
                // If specific fallback image not found, use a gradient directly on the image element
                targetElement.src = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221%22%20height%3D%221%22%3E%3C%2Fsvg%3E'; // Transparent 1x1 SVG
                targetElement.style.backgroundImage = getRandomGradient();
                targetElement.style.backgroundClip = 'padding-box';
                targetElement.style.backgroundSize = 'cover';
                targetElement.classList.add('is-loading-fallback'); 
            }
        }
    };
    
    function getRandomGradient() {
        const h1 = Math.floor(Math.random() * 360);
        const h2 = (h1 + 60 + Math.floor(Math.random() * 60)) % 360; 
        const s = Math.floor(Math.random() * 30) + 70; 
        const l = Math.floor(Math.random() * 15) + 70; 
        return `linear-gradient(135deg, hsl(${h1}, ${s}%, ${l}%), hsl(${h2}, ${s}%, ${l}%))`;
    }

    // --- Main Body Background (for all pages) ---
    fetchRandomAnimeImage(document.body, 'background', { preferLandscape: true, width: 1920, height: 1080 }); // Always set body background

    // --- Homepage Hero Background (just placeholder on homepage init)---
    const setupHomepageBackground = () => {
         // The hero section's visual background (image) is now tied to the body's global background-image, fixed as per CSS.
         // This function now primarily ensures body background is set, which is handled above.
    };

    // --- Dynamic Article Thumbnail/Banner Images ---
    const setupDynamicPostImages = () => {
        // Blog list page thumbnails
        document.querySelectorAll('.post-thumbnail[data-src-type="wallpaper"]').forEach(img => {
            fetchRandomAnimeImage(img, 'image', { preferLandscape: true, width: 500, height: 300 }); // Smaller landscape images for thumbnails
        });

        // Article detail page banners
        const detailBanner = document.querySelector('.post-detail-banner[data-src-type="wallpaper"]');
        if (detailBanner) {
            fetchRandomAnimeImage(detailBanner, 'image', { preferLandscape: true, width: 1000, height: 400 }); // Larger landscape images for banners
        }
    };

    // --- Intersection Observer for Scroll-Triggered Animations ---
    const setupScrollAnimations = () => {
        const animatedElements = document.querySelectorAll('.animate__fade-in:not(.main-header), .animate__slide-up');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    // We only unobserve non-homepage-title elements to allow homepage title to restart animation (CSS-driven)
                    if (!document.body.classList.contains('is-homepage') || !entry.target.closest('.blog-title--animated')) {
                         observer.unobserve(entry.target);
                    }
                } 
            });
        }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

        animatedElements.forEach(el => observer.observe(el));

        const mainHeader = document.querySelector('.main-header');
        if (mainHeader) {
            // Apply a slight delay to header animation to make it smoother
            setTimeout(() => {
                mainHeader.classList.add('is-visible'); 
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
        // Disable on mobile devices; if no cursorDot or isMobile, nothing happens
        if (!cursorDot || isMobile) { 
            if (cursorDot) cursorDot.style.display = 'none'; 
            document.body.style.cursor = 'auto'; 
            return;
        }
        
        // desktop only cursor trail
        window.addEventListener('mousemove', e => {
            cursorDot.style.left = `${e.clientX}px`;
            cursorDot.style.top = `${e.clientY}px`;

            let trail = document.createElement('div');
            trail.className = 'cursor-trail-dot';
            document.body.appendChild(trail); // Add to HTML
            trail.style.left = `${e.clientX}px`;
            trail.style.top = `${e.clientY}px`;
            
            setTimeout(() => { // Remove after animation
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
        
        setTimeout(() => cursorDot.style.opacity = '1', 100); // Initial fade-in of main cursor dot
    };

    // --- Read Progress Bar for Article Pages ---
    const setupReadProgressBar = () => {
        const progressBar = document.getElementById('read-progress-bar');
        const content = document.querySelector('.blog-post-detail'); /* Progress based on full article wrapper now */

        if (!progressBar || !content) return; // Only activate if elements exist

        window.addEventListener('scroll', () => {
            const contentHeight = content.offsetHeight;
            const contentOffsetTop = content.offsetTop;
            const windowHeight = window.innerHeight;
            const scrollFromTop = window.scrollY;

            // Calculate progress to fill bar as user scrolls past content
            let scrolled = (scrollFromTop - contentOffsetTop);
            let scrollRange = contentHeight - windowHeight; // How much user typically needs to scroll

            if (scrollRange <= 0) scrollRange = 1; // Prevent division by zero or negative if content is shorter than viewport or equal

            let progress = (scrolled / scrollRange) * 100;
            
            if (progress < 0) progress = 0;
            if (progress > 100) progress = 100;

            progressBar.style.width = progress + '%';
        });

        // Ensure progress bar updates correctly on initial load
        setTimeout(setupReadProgressBar, 100); 
    };
    
    // --- Setup Main Navigation Menu (Unified Hamburger for Desktop/Mobile) ---
    const setupMainMenu = () => {
        const menuToggle = document.querySelector('.menu-toggle');
        const mainNav = document.getElementById('main-nav-menu'); // Use ID for main navigation
        const menuClose = document.querySelector('.main-nav .menu-close');
        
        if (!menuToggle || !mainNav || !menuClose) {
            console.warn('Menu elements not found, main menu features disabled.');
            return;
        }

        // --- Open Menu ---
        menuToggle.addEventListener('click', () => {
            mainNav.classList.add('is-open');
            menuToggle.setAttribute('aria-expanded', 'true');
            // Disable body scroll when menu is open
            document.body.classList.add('no-scroll'); 
        });

        // --- Close Menu ---
        const closeMenu = () => {
            mainNav.classList.remove('is-open');
            menuToggle.setAttribute('aria-expanded', 'false');
            // Enable body scroll when menu is closed
            document.body.classList.remove('no-scroll'); 
        };

        menuClose.addEventListener('click', closeMenu);

        // Close menu when a navigation link is clicked inside the menu
        mainNav.querySelectorAll('a').forEach(link => {
            // Check if link is an internal link that triggers the page transition
            const href = link.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.includes('#')) {
                link.addEventListener('click', () => {
                    // Slight delay to allow page transition to start visually before menu fully closes
                    setTimeout(() => {
                        closeMenu(); // Call universal close menu function
                    }, 400); // Match or slightly exceed page transition duration (0.3s nav + 0.4s page)
                });
            } else { // Handle external links or hash links normally
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
        /** Dynamic copyright year */
        const currentYearSpan = document.getElementById('current-year');
        if (currentYearSpan) {
            currentYearSpan.textContent = new Date().getFullYear();
        }

        /** Simple visitor counter (LocalStorage) */
        const visitorCountSpan = document.getElementById('visitor-count');
        if (visitorCountSpan) {
            let visitorCount = parseInt(localStorage.getItem('visitorCount')) || 0;
            visitorCount++;
            localStorage.setItem('visitorCount', visitorCount.toString());
            visitorCountSpan.textContent = visitorCount;
        }
    }


    // --- Initialize all features on DOM Ready ---
    setupHomepageBackground(); // Homepage specific setup
    setupDynamicPostImages(); // Fetches images for post thumbnails and banners
    setupScrollAnimations();
    setupBackToTopButton();
    setupCursorTrail();
    setupReadProgressBar(); 
    setupMainMenu(); // Setup of unified hamburger menu
    setupShareButtons();
    setupFooterDetails(); // Setup footer dynamic content
});

