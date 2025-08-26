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

        // Hide overlay after new page loads if it was (re)displayed
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
        pageTransitionOverlay.style.display = 'flex'; 
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
    const fetchRandomAnimeImage = async (targetElement, type = 'background') => {
        let imageUrl = '';
        const apiEndpoints = [
            'https://wallpaper.pics/api/random_wallpaper?category=anime&orientation=landscape', // Higher quality, landscape
            'https://api.paugram.com/wallpaper?source=sina', // Fallback 1: Anime images
            'https://api.btstu.cn/sjbz/api.php?lx=dongman&format=json' // Fallback 2: Anime images
        ];
        
        // Helper to generate a random pastel-like color for fallback gradient
        function getRandomGradient() {
            const h1 = Math.floor(Math.random() * 360);
            const h2 = (h1 + 60 + Math.floor(Math.random() * 60)) % 360; // Slightly different hue
            const s = Math.floor(Math.random() * 30) + 70; // Saturation 70-100%
            const l = Math.floor(Math.random() * 15) + 70; // Lightness 70-85%
            return `linear-gradient(135deg, hsl(${h1}, ${s}%, ${l}%), hsl(${h2}, ${s}%, ${l}%))`;
        }

        // First attempt, use Unsplash with specific keywords for "horizontal anime" images.
        // Unsplash API requires client ID usually. This is a generic public endpoint that might redirect.
        // It provides varied images, may not be strictly anime, but landscape.
        const unsplashKeywordAPI = `https://source.unsplash.com/random/1920x1080/?anime,fantasy,hd-wallpaper,landscape`; 
        apiEndpoints.unshift(unsplashKeywordAPI); // Add it to the front for a try
        

        for (const api of apiEndpoints) {
            try {
                const response = await fetch(api);
                if (response.ok) {
                    // Check if it's the direct image URL (like unsplash or some specific APIs)
                    if (response.redirected && response.url && api.includes('unsplash')) {
                        imageUrl = response.url;
                        console.log(`Using Unsplash keyword API: ${imageUrl}`);
                        break;
                    }

                    const data = await response.json();
                    if (api.includes('wallpaper.pics') && data && data.image) {
                        imageUrl = data.image.url;
                        console.log(`Using wallpaper.pics API (Lanscape): ${imageUrl}`);
                        break;
                    } else if (api.includes('paugram') && data && data.data && data.data.url) {
                        imageUrl = data.data.url;
                        console.log(`Using Paugram API: ${imageUrl}`);
                        break;
                    } else if (api.includes('btstu.cn') && data && data.imgurl) {
                        imageUrl = data.imgurl;
                        console.log(`Using BTSTU API: ${imageUrl}`);
                        break;
                    }
                }
            } catch (innerError) {
                console.warn(`API ${api} failed, trying next.`, innerError);
            }
        }

        if (imageUrl) {
            const img = new Image();
            img.src = imageUrl;
            img.onload = () => {
                if (type === 'background') {
                    // Apply to body via CSS variable
                    document.documentElement.style.setProperty('--bg-image', `url(${imageUrl})`);
                } else if (type === 'image') {
                    // Apply to <img> src attribute
                    targetElement.src = imageUrl;
                }
            };
            img.onerror = () => {
                console.warn(`Preloading image "${imageUrl}" failed, setting fallback.`);
                if (type === 'background') {
                    document.documentElement.style.setProperty('--bg-image', getRandomGradient());
                } else if (type === 'image' && targetElement.dataset.srcType === 'wallpaper') {
                    // For postcards and banners, use a gradient or specific fallback image
                    targetElement.src = targetElement.dataset.fallbackSrc || `img/post-${type}-fallback.png`;
                    targetElement.style.objectFit = 'contain'; // Make sure fallback image is fully visible
                }
            };
        } else {
            console.error('Failed to get any image URL from APIs.');
            if (type === 'background') {
                document.documentElement.style.setProperty('--bg-image', getRandomGradient());
            } else if (type === 'image' && targetElement.dataset.srcType === 'wallpaper') {
                targetElement.src = targetElement.dataset.fallbackSrc || `img/post-${type}-fallback.png`;
                targetElement.style.objectFit = 'contain';
            }
        }
    };

    // --- Main Wallpaper for Body (all pages) ---
    // Make sure this is called on every page load for the body background
    // Unless it's the homepage specifically handling its own hero background.
    if (!document.body.classList.contains('is-homepage')) {
        fetchRandomAnimeImage(document.body, 'background');
    }
    
    // --- Homepage Hero Background (specific for homepage, uses same API) ---
    const setupHomepageBackground = () => {
        const heroSection = document.querySelector('.hero-section');
        if (heroSection && document.body.classList.contains('is-homepage')) {
             fetchRandomAnimeImage(document.body, 'background'); // Set body background explicitly on homepage too
        }
    };

    // --- Dynamic Article Thumbnail/Banner Images ---
    const setupDynamicPostImages = () => {
        // Blog list page thumbnails
        document.querySelectorAll('.post-thumbnail[data-src-type="wallpaper"]').forEach(img => {
            img.dataset.fallbackSrc = img.src; // Store original src as fallback
            fetchRandomAnimeImage(img, 'image');
        });

        // Article detail page banners
        const detailBanner = document.querySelector('.post-detail-banner[data-src-type="wallpaper"]');
        if (detailBanner) {
            detailBanner.dataset.fallbackSrc = detailBanner.src; // Store original src as fallback
            fetchRandomAnimeImage(detailBanner, 'image');
        }
    };

    // --- Intersection Observer for Scroll-Triggered Animations ---
    const setupScrollAnimations = () => {
        const animatedElements = document.querySelectorAll('.animate__fade-in:not(.main-header), .animate__slide-up');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

        animatedElements.forEach(el => observer.observe(el));

        const mainHeader = document.querySelector('.main-header');
        if (mainHeader) {
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
    };
    
    // --- Custom Cursor Trail Effect ---
    const setupCursorTrail = () => {
        const cursorDot = document.getElementById('cursor-trail');
        if (!cursorDot || isMobile) { // Disable on mobile devices based on isMobile flag
            if (cursorDot) cursorDot.style.display = 'none'; // Hide if element exists
            document.body.style.cursor = 'auto'; // Revert to default
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

        document.querySelectorAll('a, button, input[type="text"], textarea, .post-card').forEach(el => {
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
        const content = document.querySelector('.blog-post-detail .post-content');

        if (!progressBar || !content) return; 

        window.addEventListener('scroll', () => {
            const contentHeight = content.offsetHeight;
            const contentOffsetTop = content.offsetTop;
            const windowHeight = window.innerHeight;
            const scrollFromTop = window.scrollY;

            let scrolled = (scrollFromTop - contentOffsetTop + windowHeight / 2) / (contentHeight + windowHeight / 2) * 100;

            if (scrolled < 0) scrolled = 0;
            if (scrolled > 100) scrolled = 100;

            progressBar.style.width = scrolled + '%';
        });
    };
    
    // global share links on post pages so share works immediately when clicked
    const setupShareButtons = () => {
      if (document.querySelector('.post-share-buttons')) {
        const currentUrl = encodeURIComponent(window.location.href);
        const pageTitle = document.title;
        const articleTitle = encodeURIComponent(pageTitle.split(' - ')[0] || pageTitle); // Get only article titie, not blog title

        document.querySelectorAll('.post-share-buttons a.weibo').forEach(btn => {
           btn.href = `https://service.weibo.com/share/share.php?url=${currentUrl}&title=${articleTitle}`;
        });
        document.querySelectorAll('.post-share-buttons a.qq').forEach(btn => {
           btn.href = `https://connect.qq.com/widget/shareqq/index.html?url=${currentUrl}&title=${articleTitle}`;
        });
      }
    };


    // Initialize all features on DOM Ready
    setupHomepageBackground(); // Calls fetchRandomAnimeImage for body bg on homepage
    fetchRandomAnimeImage(document.body, 'background'); // Ensures all pages have a body bg initially
    setupDynamicPostImages(); // Fetches images for post thumbnails and banners
    setupScrollAnimations();
    setupBackToTopButton();
    setupCursorTrail();
    setupReadProgressBar(); // Conditional, will only run on article pages
    setupShareButtons(); // Prepare initial share links
});

