document.addEventListener('DOMContentLoaded', () => {

    const isMobile = window.innerWidth <= 767; // Use initial screen width to determine mobile
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
        setTimeout(() => {
            pageTransitionOverlay.classList.remove('visible');
            setTimeout(() => {
                pageTransitionOverlay.style.display = 'none';
                document.body.classList.remove('no-scroll'); 
            }, 500); 
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
        }, 400); 
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
     * @param {number} options.width - Desired width for image hint.
     * @param {number} options.height - Desired height for image hint.
     */
    const fetchRandomAnimeImage = async (targetElement, type = 'background', options = { preferLandscape: true, width: 1920, height: 1080 }) => {
        let imageUrl = '';
        const { preferLandscape, width, height } = options; 

        // Aggressive image matching for different API response structures
        const extractImageUrl = async (response, api) => {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.startsWith('image/')) {
                return response.url; 
            } else if (contentType && contentType.includes('json')) { 
                const data = await response.json();
                if (data && (data.imgurl || data.url) && typeof (data.imgurl || data.url) === 'string' && (data.imgurl || data.url).match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
                    return data.imgurl || data.url;
                }
            }
            return ''; 
        };
        
        // Priority Ordered API Endpoints (prioritizing direct high-quality URLs)
        const apiEndpoints = [
            `https://iw233.cn/api/Pure.php`,                             
             `https://api.adicw.cn/img/rand`,                            
            `https://api.btstu.cn/sjbz/api.php?lx=dongman&format=json`, 
            `https://source.unsplash.com/random/${width}x${height}/?anime,manga,${preferLandscape ? 'landscape,art,fantasy,wide' : 'portrait,art'}`,
            `https://random.dog/${width}x${height}/?query=anime,manga,${preferLandscape ? 'landscape' : 'portrait'}`, 
        ];
        
        for (const api of apiEndpoints) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 6000); 
                const response = await fetch(api, { method: 'GET', redirect: 'follow', signal: controller.signal, headers: {'accept': 'image/*,application/json'} });
                clearTimeout(timeoutId);

                if (response.ok) {
                    imageUrl = await extractImageUrl(response, api);
                    if (imageUrl) {
                        console.log(`🖼️ API Success (${api.split('?')[0]}): ${imageUrl.substring(0, 50)}...`);
                        break; 
                    }
                } else {
                    console.warn(`⚠️ API ${api.split('?')[0]} responded with status ${response.status}. Trying next.`);
                }
            } catch (innerError) {
                if (innerError.name === 'AbortError') {
                    console.warn(`⏱️ API ${api.split('?')[0]} timed out after 6s. Trying next.`);
                } else if (innerError instanceof TypeError) {
                   console.warn(`🚫 API ${api.split('?')[0]} network error:`, innerError.message);
                } else {
                    console.warn(`❌ API ${api.split('?')[0]} failed:`, innerError);
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
                    targetElement.style.opacity = '1';
                    targetElement.style.objectFit = 'cover'; 
                }
                targetElement.classList.remove('is-loading-fallback'); 
                const fallbackText = targetElement.nextElementSibling; // Might be a sibling div
                if (fallbackText && fallbackText.classList.contains('fallback-text-overlay')) {
                    fallbackText.remove();
                }
            };
            imgToLoad.onerror = () => { 
                console.warn(`🚫 Image preload failed for URL (${imageUrl}). Applying fallback.`);
                 applyFallbackImage(targetElement, type); // Call fallback if preload fails
            };
        } else {
            console.error('❌ All APIs failed to provide a valid image URL. Manual fallback enforced.');
            applyFallbackImage(targetElement, type); 
        }
    };
    
    // --- Helper for fallback images (to avoid repetition) ---
    const applyFallbackImage = (targetElement, type) => {
        const isThumbnail = targetElement.classList.contains('post-thumbnail');
        const fallbackSuffix = isThumbnail ? 'post-thumbnail-fallback.png' : 'post-detail-banner-fallback.png';
        const baseRelativePath = window.location.pathname.includes('/posts/') ? '../img/' : './img/';
        const localFallbackSrc = `${baseRelativePath}${fallbackSuffix}`;
        
        if (type === 'background') {
            document.documentElement.style.setProperty('--bg-image', getRandomGradient());
        } else if (type === 'image') {
            // Set the src to local fallback. Attempt to load local image.
            targetElement.src = localFallbackSrc; 
            targetElement.style.objectFit = 'contain'; 
            targetElement.classList.add('is-loading-fallback'); 
            targetElement.style.opacity = '1'; 
            targetElement.style.backgroundImage = getRandomGradient(); // As a base background
            targetElement.style.backgroundRepeat = 'no-repeat';
            targetElement.style.backgroundPosition = 'center';
            targetElement.style.backgroundSize = 'cover';
            targetElement.style.filter = 'grayscale(100%) brightness(0.6) blur(1px)'; 

            // Create or update text overlay
            let fallbackTextOverlay = targetElement.nextElementSibling;
            if (targetElement.tagName === 'IMG') { 
                if (!fallbackTextOverlay || !fallbackTextOverlay.classList.contains('fallback-text-overlay')) {
                    fallbackTextOverlay = document.createElement('div');
                    fallbackTextOverlay.classList.add('fallback-text-overlay');
                    if (targetElement.parentNode && getComputedStyle(targetElement.parentNode).position === 'static') {
                        targetElement.parentNode.style.position = 'relative'; 
                    }
                    targetElement.parentNode.insertBefore(fallbackTextOverlay, targetElement.nextSibling);

                }
                fallbackTextOverlay.textContent = isThumbnail ? "封面加载失败 :(" : "图片加载失败 :(";
                fallbackTextOverlay.style.display = 'flex'; // Ensure visible

                // Optional: Listen for local image load error, if it's broken too.
                const localImgTest = new Image();
                localImgTest.src = localFallbackSrc;
                localImgTest.onerror = () => {
                    console.warn(`Local fallback image ${localFallbackSrc} also failed to load. Displaying text overlay only.`);
                    // If local image fails, make the img tag completely transparent
                    targetElement.src = "data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20%2F%3E"; // Transparent 1x1 GIF to prevent browser broken image icon
                    targetElement.style.opacity = '0.01'; // make almost transparent, so fallback text is visible on gradient
                };
            }
            console.log(`⚡  Applied robust fallback for ${targetElement.alt}`);
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
    fetchRandomAnimeImage(document.body, 'background', { preferLandscape: true, width: 1920, height: 1080 }); 

    const setupHomepageBackground = () => {}; 

    // --- Dynamic Article Thumbnail/Banner Images ---
    const setupDynamicPostImages = () => {
        document.querySelectorAll('.post-thumbnail[data-src-type="wallpaper"]').forEach(img => {
            applyFallbackImage(img, 'image'); // Immediately apply fallback state
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
        const animatedElements = document.querySelectorAll('.animate__fade-in:not(.main-header), .animate__slide-up');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
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
           let documentHeight = Math.max(
                document.body.scrollHeight, 
                document.documentElement.scrollHeight, 
                document.body.offsetHeight, 
                document.documentElement.offsetHeight, 
                document.body.clientHeight, 
                document.documentElement.clientHeight
            );
            let windowHeight = window.innerHeight;

            let scrollRange = documentHeight - windowHeight;
            let currentScrollPosition = window.scrollY; 

            let readProgress = (currentScrollPosition / scrollRange) * 100;
            readProgress = Math.min(100, Math.max(0, readProgress)); 

            progressBar.style.width = readProgress + '%';
        }

        window.addEventListener('scroll', calculateProgress);
        window.addEventListener('resize', calculateProgress); 
        setTimeout(calculateProgress, 500); 
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

        const positionMenu = () => {
            const toggleRect = menuToggle.getBoundingClientRect();
            // Align menu top right corner with the toggle's bottom left corner + some offset
            mainNav.style.top = `${toggleRect.bottom + 10}px`; // 距离 toggle 底部 10px
            mainNav.style.right = `${window.innerWidth - toggleRect.right}px`; // 保持右侧对齐，减去 toggle 的宽度
            // 确保菜单不超出左侧屏幕
            if (toggleRect.right - mainNav.offsetWidth < 0) {
                 mainNav.style.left = '10px'; //距离左边10px
                 mainNav.style.right = 'auto';
            }
        };

        const openMenu = () => {
            positionMenu(); // Position menu before opening
            mainNav.classList.add('is-open');
            menuToggle.setAttribute('aria-expanded', 'true');
            document.body.classList.add('no-scroll'); 
        };

        const closeMenu = () => {
            mainNav.classList.remove('is-open');
            menuToggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('no-scroll');
        };

        menuToggle.addEventListener('click', () => {
            mainNav.classList.contains('is-open') ? closeMenu() : openMenu();
        });

        menuClose.addEventListener('click', closeMenu);

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
        window.addEventListener('resize', positionMenu); // Reposition on resize
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

    // Initial check for body blur based on state and responsive updates
    const updateBodyBlur = () => {
        const bodyElement = document.body;
        const bodyBeforePseudo = getComputedStyle(bodyElement, '::before');
        // Ensure --body-global-blur-value is properly used to apply blur dynamically
         const targetBlur = window.innerWidth <= 767 ? 
                             getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur-mobile').trim() :
                             getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur').trim();
        
        bodyElement.style.setProperty('--body-global-blur-value', targetBlur);
        bodyElement.style.setProperty('--body-backdrop-blur', targetBlur); // Direct override of the CSS var
        console.log("--body-backdrop-blur set to:", targetBlur);

    };
    
    updateBodyBlur(); // Apply on load
    window.addEventListener('resize', updateBodyBlur); 
});
