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
            `https://source.unsplash.com/random/${width}x${height}/?${unsplashKeywords}`, /* Unsplash for diverse landscape possibility */
            'https://iw233.cn/api/Pure.php',               /* Direct image API, often landscape anime. */
            'https://api.adicw.cn/img/rand',               /* Direct image API, mixed portrait/landscape */
            'https://api.btstu.cn/sjbz/api.php?lx=dongman&format=json' /* JSON API, fallback for mixed orientation */
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
                        imageUrl = response.url;
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
            imgToLoad.onerror = (e) => { // If preloading of the fetched image fails
                console.warn(`Preloaded image (${imageUrl}) failed to load. Applying fallback.`);
                applyFallbackImage(targetElement, type);
            };
        } else {
            console.error('Failed to get any image URL from APIs after all attempts. Applying fallback.');
            applyFallbackImage(targetElement, type);
        }
    };
    
    // --- Helper for fallback images (to avoid repetition) ---
    const applyFallbackImage = (targetElement, type) => {
        if (type === 'background') {
             // Set a dynamic gradient background directly to --bg-image CSS variable
            document.documentElement.style.setProperty('--bg-image', getRandomGradient());
        } else if (type === 'image') {
            const fallbackSuffix = targetElement.classList.contains('post-thumbnail') ? 'post-thumbnail-fallback.png' : 'post-detail-banner-fallback.png';
            const baseRelativePath = targetElement.src.includes('img/') ? 'img/' : '../img/'; // Determine ./img/ or ../img/
            const localFallbackSrc = `${baseRelativePath}${fallbackSuffix}`;
            
            targetElement.src = localFallbackSrc; // Set src to the local fallback
            targetElement.style.objectFit = 'contain'; 
            targetElement.classList.add('is-loading-fallback'); 
            console.log(`Using local fallback image: ${localFallbackSrc}`);

            // Optionally, add a gradient background as a visual improvement if even the local image might fail/be transparent
            if(window.getComputedStyle(targetElement).backgroundImage === 'none') { // Only add if no other background is present
                targetElement.style.backgroundImage = getRandomGradient();
                targetElement.style.backgroundRepeat = 'no-repeat';
                targetElement.style.backgroundPosition = 'center';
                targetElement.style.backgroundSize = 'cover';
                console.log('Added gradient overlay for local fallback image.');
            }
        }
    };
    
    function getRandomGradient() {
        // Generate more vibrant colors specific for fallback gradients
        const h1 = Math.floor(Math.random() * 360);
        const h2 = (h1 + 60 + Math.floor(Math.random() * 60)) % 360; 
        const s = Math.floor(Math.random() * 50) + 50; // Saturation 50-100%
        const l = Math.floor(Math.random() * 20) + 60; // Lightness 60-80%
        return `linear-gradient(135deg, hsl(${h1}, ${s}%, ${l}%), hsl(${h2}, ${s}%, ${l}%))`;
    }

    // --- Main Body Background (for all pages) ---
    fetchRandomAnimeImage(document.body, 'background', { preferLandscape: true, width: 1920, height: 1080 }); // Always set body background

    // --- Homepage Hero Background (just placeholder on homepage init)---
    const setupHomepageBackground = () => {
         // This function now primarily just acts as a placeholder as body background is handled above for all pages.
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
                    // We only unobserve non-homepage-title and non-header-title elements
                    // Homepage and Header titles' animations are handled by CSS infinite animations.
                    if (!entry.target.classList.contains('is-homepage-title') && !entry.target.classList.contains('is-header-title')) {
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
            const contentRect = content.getBoundingClientRect();
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

            // Calculate progress to fill bar as user scrolls through the entire content portion visually
            // This version calculates progress relative to full document scrollable height
            let totalScrollableHeight = documentHeight - windowHeight;
            let currentReadProgress = Math.min(100, (scrollFromTop / totalScrollableHeight) * 100);
            
            // Or - if only within the article bounds:
            // let articleStart = contentRect.top + window.scrollY;
            // let articleEnd = contentRect.bottom + window.scrollY;
            // let effectiveScroll = scrollFromTop - articleStart;
            // let effectiveReach = articleEnd - articleStart - windowHeight;
            // let progress = Math.min(100, Math.max(0, (effectiveScroll / effectiveReach) * 100));


            progressBar.style.width = currentReadProgress + '%';
        });

        // Ensure progress bar updates correctly on initial load
        setTimeout(setupReadProgressBar, 100); 
    };
    
    // --- Setup Main Navigation Menu (Unified Hamburger for Desktop/Mobile) ---
    const setupMainMenu = () => {
        const menuToggle = document.querySelector('.menu-toggle');
        const mainNav = document.getElementById('main-nav-menu'); 
        const menuClose = document.querySelector('.main-nav .menu-close');
        
        if (!menuToggle || !mainNav || !menuClose) {
            console.warn('Menu elements not found, main menu features disabled.');
            // Even if elements not found, might need to reset no-scroll if previous state was bad
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
                    }, 400); // Wait for page transition and menu close animation
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
    setupHomepageBackground(); 
    setupDynamicPostImages(); 
    setupScrollAnimations();
    setupBackToTopButton();
    setupCursorTrail();
    setupReadProgressBar(); 
    setupMainMenu(); 
    setupShareButtons();
    setupFooterDetails(); 
});
