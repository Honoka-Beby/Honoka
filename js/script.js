document.addEventListener('DOMContentLoaded', () => {

    const isMobile = window.innerWidth <= 767; // Use initial screen width
    // Add is-mobile class to body initially
    if(isMobile) { 
        document.body.classList.add('is-mobile'); 
        // console.log("Detected mobile: is-mobile class added.");
    } else {
        document.body.classList.remove('is-mobile');
    }

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
            window.location.href = urlToNavigate;
        }, 400); // Matches CSS transition duration before navigation
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
     * @param {number} options.width - Desired width for image hint (Unsplash, etc.).
     * @param {number} options.height - Desired height for image hint.
     */
    const fetchRandomAnimeImage = async (targetElement, type = 'background', options = { preferLandscape: true, width: 1920, height: 1080 }) => {
        let imageUrl = '';
        const { width, height } = options; 

        // Aggressive image URL extraction based on Content-Type
        const extractImageUrl = async (response, apiDebugName) => {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.startsWith('image/')) {
                return response.url; // Direct image URL
            } else if (contentType && contentType.includes('json')) { 
                const data = await response.json();
                if (data && (data.imgurl || data.url) && typeof (data.imgurl || data.url) === 'string' && (data.imgurl || data.url).match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i)) {
                    return data.imgurl || data.url;
                }
            }
            console.warn(`🔄 ${apiDebugName} failed to extract image URL from response. Content-Type: ${contentType}`);
            return ''; 
        };
        
        // Priority Ordered API Endpoints (prioritizing high-quality direct image URLs)
        const apiEndpoints = [
            `https://iw233.cn/api/Pure.php`,                             // 高品质动漫图, 直链
            `https://api.adicw.cn/img/rand`,                            // 有效动漫图, 直链
             `https://random.image.cat/random-cats-image/?imageSize=${width}x${height}`, // 替代 Unsplash 的一个图片源
            `https://api.btstu.cn/sjbz/api.php?lx=dongman&format=json`, // JSON API 动漫图，良好备用
            `https://picsum.photos/${width}/${height}` //通用随机图 (作为通用背景图的备用可能，低优先级用于动漫特定图片)
           // `https://source.unsplash.com/random/${width}x${height}/?anime,manga,landscape,art,fantasy`, // Unsplash可能返回非动漫，谨慎使用
        ];
        
        for (const api of apiEndpoints) {
            const apiDebugName = api.split('?')[0].replace(/(https?:\/\/|\.php|\/api|\/img|\/rand)/g, '').split('/').filter(Boolean).join('.');
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 Secs Timeout per API
                const response = await fetch(api, { method: 'GET', redirect: 'follow', signal: controller.signal, headers: {'accept': 'image/*,application/json'} });
                clearTimeout(timeoutId);

                if (response.ok) {
                    imageUrl = await extractImageUrl(response, apiDebugName);
                    if (imageUrl) {
                        console.log(`✅ API Success (${apiDebugName}): ${imageUrl.substring(0, 50)}...`);
                        break; 
                    }
                } else {
                    console.warn(`⚠️ API ${apiDebugName} responded with status ${response.status}. Trying next.`);
                }
            } catch (innerError) {
                if (innerError.name === 'AbortError') {
                    console.warn(`⏱️ API ${apiDebugName} timed out after 6s. Trying next.`);
                } else if (innerError instanceof TypeError || innerError instanceof DOMException) {
                   console.warn(`🚫 API ${apiDebugName} fetch/network error:`, innerError.message);
                } else {
                    console.warn(`❌ API ${apiDebugName} unexpected error:`, innerError);
                }
            }
        }
        
        // --- Image Preloading and Application ---
        if (imageUrl) {
            const imgToLoad = new Image(); 
            imgToLoad.src = imageUrl;
            imgToLoad.onload = () => {
                if (type === 'background') {
                    document.documentElement.style.setProperty('--bg-image', `url(${imageUrl})`);
                } else if (type === 'image') {
                    targetElement.src = imageUrl; 
                    targetElement.style.opacity = '1'; 
                    targetElement.style.objectFit = 'cover'; 
                }
                targetElement.classList.remove('is-loading-fallback'); 
                const fallbackText = targetElement.nextElementSibling;
                if (fallbackText && fallbackText.classList.contains('fallback-text-overlay')) {
                    fallbackText.remove();
                }
            };
            imgToLoad.onerror = () => { 
                console.warn(`🚫 Preloaded image (${imageUrl}) failed to render. Applying local fallback.`);
                applyFallbackImage(targetElement, type);
            };
        } else { // No image URL obtained from any API
            console.error('❌ All APIs failed to provide a valid image URL. Forcing local fallback.');
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
            console.log(`🖼️ Applied gradient background fallback.`);
        } else if (type === 'image') {
            targetElement.src = localFallbackSrc; 
            targetElement.style.objectFit = 'contain'; 
            targetElement.classList.add('is-loading-fallback'); 
            targetElement.style.opacity = '1'; 
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

                    // If fallback image is broken itself, hide the img and let the ::after background show.
                    targetElement.onerror = () => {
                        targetElement.style.display = 'none'; // Hide the img if local fallback fails
                        // console.warn(`Local fallback image "${localFallbackSrc}" itself failed to load. Displaying text via overlay div.`);
                    };
                    targetElement.onload = () => { // If it recovers or loads the local image
                        if (targetElement.style.display === 'none') targetElement.style.display = ''; // Show image if it loads fine after all
                    };
                } else {
                    fallbackTextOverlay.textContent = isThumbnail ? "封面加载失败 :(" : "图片加载失败 :(";
                    fallbackTextOverlay.style.display = 'flex'; 
                }
               targetElement.style.filter = 'grayscale(100%) brightness(0.7) blur(1px)'; // General effect for fallback image
            }
            console.log(`🎨 Applied local fallback and overlay for: ${targetElement.alt || 'Unnamed Image'}`);
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

    const setupHomepageBackground = () => {}; // Placeholder for consistency

    // --- Dynamic Article Thumbnail/Banner Images ---
    const setupDynamicPostImages = () => {
        document.querySelectorAll('.post-thumbnail[data-src-type="wallpaper"]').forEach(img => {
            // Apply fallback upfront to minimize visual loading gaps
            applyFallbackImage(img, 'image'); 
            fetchRandomAnimeImage(img, 'image', { preferLandscape: true, width: 500, height: 300 }); 
        });

        const detailBanner = document.querySelector('.post-detail-banner[data-src-type="wallpaper"]');
        if (detailBanner) {
            applyFallbackImage(detailBanner, 'image'); 
            fetchRandomAnimeImage(detailBanner, 'image', { preferLandscape: true, width: 1000, height: 400 }); 
        }
    };

    // --- Intersection Observer for Scroll-Triggered Animations ---
    const setupScrollAnimations = () => {
        const animatedElements = document.querySelectorAll('.animate__fade-in:not(.main-header), .animate__slide-up'); // Exclude main-header, it has its own subtle reveal
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    // Do not unobserve elements whose animations are intended to loop (homepage/header titles)
                    if (!entry.target.closest('.is-homepage-title') && !entry.target.closest('.is-header-title')) { 
                         observer.unobserve(entry.target);
                    }
                } 
            });
        }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }); // Start earlier

        animatedElements.forEach(el => observer.observe(el));

        // Ensure main header always has its initial fade-in or is visible, just once
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

        // Scroll to top animation
        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        // Set initial visibility on load too
        if (window.scrollY > 300) { btn.classList.add('show'); }
    };
    
    // --- Custom Cursor Trail Effect ---
    const setupCursorTrail = () => {
        const cursorDot = document.getElementById('cursor-trail');
        // Disable on mobile devices or if cursorDot element is missing
        if (!cursorDot || isMobile) { 
            if (cursorDot) cursorDot.style.display = 'none'; // Ensure main cursor dot is hidden
            document.body.style.cursor = 'auto'; // Restore default pointer
            return;
        }
        
        // Desktop-only cursor trail functionality
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

        // Hover effects for interactive elements
        document.querySelectorAll('a, button, input:not([type="submit"]), textarea, .post-card, .menu-toggle, .main-nav a').forEach(el => {
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
        const content = document.querySelector('.blog-post-detail');

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
            const scrollFromTop = window.scrollY;

            let totalScrollableHeight = documentHeight - windowHeight;
            let readProgress = (scrollFromTop / totalScrollableHeight) * 100;
            readProgress = Math.min(100, Math.max(0, readProgress)); // Clamp between 0 and 100

            progressBar.style.width = readProgress + '%';
        }

        window.addEventListener('scroll', calculateProgress);
        window.addEventListener('resize', calculateProgress); 
        setTimeout(calculateProgress, 500); // Initial call after a brief delay for layout stability
    };
    
    // --- Setup Main Navigation Menu (Unified Hamburger for Desktop/Mobile with Mini-Panel) ---
    const setupMainMenu = () => {
        const menuToggle = document.querySelector('.menu-toggle');
        const mainNav = document.getElementById('main-nav-menu'); 
        const menuClose = document.querySelector('.main-nav .menu-close');
        
        if (!menuToggle || !mainNav || !menuClose) {
            console.warn('Menu (toggle, nav, or close button) not found. Main menu features disabled.');
            // Ensure no-scroll is off if menu cannot be controlled
            document.body.classList.remove('no-scroll');
            return;
        }

        const openMenu = () => {
            mainNav.classList.add('is-open');
            menuToggle.setAttribute('aria-expanded', 'true');
            // Disable body scroll when menu is open
            document.body.classList.add('no-scroll'); 
            // console.log("Menu Opened, Scroll Disabled.");
        };

        const closeMenu = () => {
            mainNav.classList.remove('is-open');
            menuToggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('no-scroll');
            // console.log("Menu Closed, Scroll Enabled.");
        };

        menuToggle.addEventListener('click', openMenu);
        menuClose.addEventListener('click', closeMenu);

        // Close menu when a navigation link inside it is clicked if it's an internal link
        mainNav.querySelectorAll('a').forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.includes('#')) {
                link.addEventListener('click', () => {
                    setTimeout(() => {
                        closeMenu(); 
                    }, 400); // Small delay to let page transition animation start
                });
            } else { // Handle external links or hash links normally when clicked
                link.addEventListener('click', closeMenu);
            }
        });

        // Close menu when clicking outside it (on large screens only for panel menu)
        // Add a click listener to the body, but don't close if clique target is button or within menu
        document.body.addEventListener('click', (event) => {
            // Only close if menu is open, AND if click is outside all menu related elements
            if (mainNav.classList.contains('is-open') && 
                !menuToggle.contains(event.target) && 
                !mainNav.contains(event.target)) {
                closeMenu();
                // console.log("Clicked outside menu, closed.");
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
    
    // --- Footer dynamic details --- [Enhanced with dynamic blur value]
    const setupFooterDetails = () => {
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
    
    // --- Dynamic Background Blur Adjustment for Body (performance/readability) ---
    const updateBodyBlur = () => {
        const desktopBlur = getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur').trim();
        const mobileBlur = getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur-mobile').trim();

        // Sets `--body-global-blur-value` based on actual window width
        if (window.innerWidth <= 767) { 
            document.documentElement.style.setProperty('--body-global-blur-value', mobileBlur);
            document.body.classList.add('is-mobile'); // Dynamically add mobile class to body
        } else {
            document.documentElement.style.setProperty('--body-global-blur-value', desktopBlur);
            document.body.classList.remove('is-mobile'); // Dynamically remove mobile class
        }
    };
    
    document.documentElement.style.setProperty('--body-global-blur-value', '3px'); // Default initial value
    updateBodyBlur(); // Apply on first load
    window.addEventListener('resize', updateBodyBlur); // Update on window resize
});
