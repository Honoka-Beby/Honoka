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
     * @param {boolean} preferLandscape - Whether to prioritize landscape images.
     */
    const fetchRandomAnimeImage = async (targetElement, type = 'background', preferLandscape = true) => {
        let imageUrl = '';
        const unsplashKeywords = (type === 'image' && preferLandscape) ? 'anime,manga,landscape,art,fantasy,wide' : 'anime,manga,wallpaper';
        const apiEndpoints = [
            // Unsplash for diverse landscape possibility, first in priority
            `https://source.unsplash.com/random/1920x1080/?${unsplashKeywords}`, 
            'https://www.dmoe.cc/random.php',       // Random anime (sometimes landscape, direct image)
            'https://api.adicw.cn/img/rand',          // Random anime (direct image)
            'https://api.btstu.cn/sjbz/api.php?lx=dongman&format=json' // Random anime (JSON)
        ];
        
        for (const api of apiEndpoints) {
            try {
                // Unsplash and direct image APIs (dmoe.cc, adicw.cn) often return an image directly
                if (api.includes('unsplash.com') || api.includes('dmoe.cc') || api.includes('adicw.cn')) {
                    const response = await fetch(api, { method: 'GET', redirect: 'follow' }); // Automatically follow redirects to the final image URL
                    if (response.ok && response.url && response.url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) { // Ensure it's an image URL
                        imageUrl = response.url;
                        console.log(`Using Direct Image API (${api.split('?')[0]}): ${imageUrl.substring(0, 100)}...`);
                        break;
                    }
                } 
                // Handling for JSON-based APIs like BTSTU
                else if (api.includes('btstu.cn')) {
                    const response = await fetch(api);
                    if (response.ok) {
                        const data = await response.json();
                        if (data && data.imgurl && data.imgurl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
                            imageUrl = data.imgurl;
                            console.log(`Using BTSTU API (${api}): ${imageUrl.substring(0, 100)}...`);
                            break;
                        }
                    }
                }
            } catch (innerError) {
                console.warn(`API ${api} failed, trying next:`, innerError);
            }
        }
        
        // --- Image Loading and Application ---
        if (imageUrl) {
            const imgToLoad = new Image();
            imgToLoad.src = imageUrl;
            imgToLoad.onload = () => {
                if (type === 'background') {
                    // Apply to body and transition
                    document.documentElement.style.setProperty('--bg-image', `url(${imageUrl})`);
                } else if (type === 'image') {
                    // Apply to <img> src attribute
                    targetElement.src = imageUrl;
                }
                targetElement.classList.remove('is-loading-fallback'); 
            };
            imgToLoad.onerror = (e) => {
                console.warn(`Image preloading failed for ${imageUrl}, attempting fallback for target. Reason:`, e);
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
            // Determine the correct fallback image path based on element type
            const fallbackSrc = targetElement.dataset.fallbackSrc || 
                                (targetElement.classList.contains('post-thumbnail') ? '../img/post-thumbnail-fallback.png' : 
                                 '../img/post-detail-banner-fallback.png'); // Correct path for posts
            targetElement.src = fallbackSrc;
            targetElement.style.objectFit = 'contain'; 
            targetElement.classList.add('is-loading-fallback'); 
            // Also try to set a simple transparent background if it's an image element
            targetElement.style.backgroundImage = getRandomGradient();
            targetElement.style.backgroundClip = 'padding-box';
            targetElement.style.backgroundSize = 'cover';
        }
    };
    
    function getRandomGradient() {
        const h1 = Math.floor(Math.random() * 360);
        const h2 = (h1 + 60 + Math.floor(Math.random() * 60)) % 360; 
        const s = Math.floor(Math.random() * 30) + 70; 
        const l = Math.floor(Math.random() * 15) + 70; 
        return `linear-gradient(135deg, hsl(${h1}, ${s}%, ${l}%), hsl(${h2}, ${s}%, ${l}%))`;
    }

    // --- Main Body Background (for all pages except homepage's hero section) ---
    // This runs on every page. For homepage, it just sets the body bg that's under hero overlay.
    fetchRandomAnimeImage(document.body, 'background', true); // Prefer landscape for body background

    // --- Homepage Hero Background specifically uses `body` wallpaper now, no separate fetch
    const setupHomepageBackground = () => {
        // Redundant with global body call, intentionally calls it so it refreshes just-in-case 
        // and ensures the homepage always has the newest random wallpaper.
        // The hero_section overlay is handled purely by CSS.
        // It relies on the global fetchRandomAnimeImage for body.
    };

    // --- Dynamic Article Thumbnail/Banner Images ---
    const setupDynamicPostImages = () => {
        // Blog list page thumbnails
        document.querySelectorAll('.post-thumbnail[data-src-type="wallpaper"]').forEach(img => {
            img.dataset.fallbackSrc = img.src; // Store original src as fallback
            fetchRandomAnimeImage(img, 'image', true); // Prefer landscape for thumbnails
        });

        // Article detail page banners
        const detailBanner = document.querySelector('.post-detail-banner[data-src-type="wallpaper"]');
        if (detailBanner) {
            detailBanner.dataset.fallbackSrc = detailBanner.src; // Store original src as fallback
            fetchRandomAnimeImage(detailBanner, 'image', true); // Prefer landscape for banners
        }
    };

    // --- Intersection Observer for Scroll-Triggered Animations ---
    const setupScrollAnimations = () => {
        const animatedElements = document.querySelectorAll('.animate__fade-in:not(.main-header), .animate__slide-up');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    // Only unobserve if not an element that needs to repeatedly animate (e.g. homepage title)
                    if (!entry.target.classList.contains('blog-title--animated')) {
                         observer.unobserve(entry.target);
                    }
                } else {
                    // For homepage title, reset if it goes out of view (e.g., scrolled up and hero visible again)
                     if (entry.target.classList.contains('blog-title--animated') && document.body.classList.contains('is-homepage')) {
                        // Keep it potentially animated
                     }
                }
            });
        }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

        animatedElements.forEach(el => observer.observe(el));

        const mainHeader = document.querySelector('.main-header');
        if (mainHeader) {
            mainHeader.classList.add('is-visible'); // Header always visible
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
        // Disable on mobile devices; if no cursorDot or isMobile, stop
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
            document.body.appendChild(trail);
            trail.style.left = `${e.clientX}px`;
            trail.style.top = `${e.clientY}px`;
            
            setTimeout(() => {
                if (trail.parentNode) {
                    trail.parentNode.removeChild(trail);
                }
            }, 500); 
        });

        document.querySelectorAll('a, button, input:not([type="submit"]), textarea, .post-card').forEach(el => {
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
        const content = document.querySelector('.blog-post-detail .post-content');

        if (!progressBar || !content) return; // Only activate if elements exist

        window.addEventListener('scroll', () => {
            const contentHeight = content.offsetHeight;
            const contentOffsetTop = content.offsetTop;
            const windowHeight = window.innerHeight;
            const scrollFromTop = window.scrollY;

            // Calculate progress more robustly to account for viewport height
            let scrollableHeight = contentHeight - windowHeight;
            let currentScrollPosition = scrollFromTop - contentOffsetTop;
            
            let progress = (currentScrollPosition / scrollableHeight) * 100;
            
            if (progress < 0) progress = 0;
            if (progress > 100) progress = 100;

            progressBar.style.width = progress + '%';
        });
    };
    
    // --- Setup Mobile Menu (Hamburger) ---
    const setupMobileMenu = () => {
        if (!isMobile) return; 

        const menuToggle = document.querySelector('.menu-toggle');
        const mainNav = document.querySelector('.main-nav');
        const menuClose = document.querySelector('.menu-close');
        const mainHeader = document.querySelector('.main-header');
        
        if (!menuToggle || !mainNav || !menuClose || !mainHeader) return;

        // Open menu
        menuToggle.addEventListener('click', () => {
            mainNav.classList.add('is-open');
             document.body.classList.add('no-scroll'); // Disable body scroll
        });

        // Close menu (from close button)
        menuClose.addEventListener('click', () => {
            mainNav.classList.remove('is-open');
            document.body.classList.remove('no-scroll'); // Enable body scroll
        });

        // Close menu when a navigation link is clicked inside the menu
        mainNav.querySelectorAll('a').forEach(link => {
            // Check if link is an internal link that triggers the page transition
            const href = link.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.includes('#')) {
                link.addEventListener('click', () => {
                    // Slight delay to allow page transition to start visually before menu fully closes
                    setTimeout(() => {
                        mainNav.classList.remove('is-open');
                        document.body.classList.remove('no-scroll');
                    }, 400); // Match or slightly exceed page transition duration
                });
            } else { // Handle external links or hash links normally
                link.addEventListener('click', () => {
                    mainNav.classList.remove('is-open');
                    document.body.classList.remove('no-scroll');
                });
            }
        });
    };

    // --- Share buttons for article pages ---
    const setupShareButtons = () => {
        // Collect all share buttons; if on non-post page, this won't find elements
        const shareButtons = document.querySelectorAll('.post-share-buttons a.weibo, .post-share-buttons a.qq');
        if (shareButtons.length === 0) return; // Only run on post pages with share buttons

        const currentUrl = encodeURIComponent(window.location.href);
        const articleTitle = encodeURIComponent(document.title.split(' - ')[0] || "Honoka的小屋"); // Use blog title as fallback

        shareButtons.forEach(btn => {
            if (btn.classList.contains('weibo')) {
                btn.href = `https://service.weibo.com/share/share.php?url=${currentUrl}&title=${articleTitle}`;
            } else if (btn.classList.contains('qq')) {
                // QQ share also supports optional `pics` parameter
                // Requires article's main image URL (not easy to get dynamically without server-side rendered info)
                // For simplicity, we'll omit `pics` for now or use a generic one.
                const imgElement = document.querySelector('.post-detail-banner');
                const imgUrl = imgElement ? encodeURIComponent(imgElement.src) : '';
                btn.href = `https://connect.qq.com/widget/shareqq/index.html?url=${currentUrl}&title=${articleTitle}${imgUrl ? '&pics=' + imgUrl : ''}`;
            }
        });
    };


    // --- Initialize all features on DOM Ready ---
    setupHomepageBackground(); 
    setupDynamicPostImages(); 
    setupScrollAnimations();
    setupBackToTopButton();
    setupCursorTrail();
    setupReadProgressBar(); 
    setupMobileMenu(); // Setup mobile menu logic
    setupShareButtons();
});

