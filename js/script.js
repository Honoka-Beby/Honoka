document.addEventListener('DOMContentLoaded', () => {

    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if(isMobile) {
        document.body.classList.add('is-mobile');
    }

    // --- Global Page Transition Overlay Management ---
    const pageTransitionOverlay = document.getElementById('global-page-transition-overlay');
    if (pageTransitionOverlay) {
        // Prepare overlay content
        pageTransitionOverlay.innerHTML = `
            <div class="loader"></div>
            <p class="overlay-text">加载中...</p>
        `;

        // Hide overlay after new page loads
        // Using a slight delay to ensure the page is fully rendered before hiding
        // And giving a subtle fade-out transition.
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
        pageTransitionOverlay.style.display = 'flex'; // Ensure it's visible property before adding class
        pageTransitionOverlay.classList.add('visible');
        
        // After fade-in transition (0.4s CSS), navigate
        setTimeout(() => {
            window.location.href = urlToNavigate;
        }, 400); // Matches CSS transition duration
    };

    // Intercept all internal link clicks for smooth transitions
    document.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.includes('#') && !isMobile) {
            // Apply transition only to standard internal page links
            link.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default link behavior
                activatePageTransition(href);
            });
        }
    });

    // --- Random Anime Wallpaper API for Homepage ---
    const setupHomepageBackground = async () => {
        const heroSection = document.querySelector('.hero-section');
        if (!heroSection || !document.body.classList.contains('is-homepage')) {
            return; // Only proceed if on the homepage and .hero-section exists
        }

        try {
            let imageUrl;
            const apiEndpoints = [
                'https://api.paugram.com/wallpaper?source=sina', // 动漫图片质量高
                'https://api.btstu.cn/sjbz/api.php?lx=dongman&format=json', // 备用动漫图片
                'https://source.unsplash.com/random/1920x1080/?anime,fantasy' // 通用动漫/幻想图片 (可能非纯动漫)
            ];

            for (const api of apiEndpoints) {
                try {
                    const response = await fetch(api);
                    if (response.ok) {
                        const data = await response.json();
                        // Adjusting for different API response structures
                        if (api.includes('paugram') && data && data.data && data.data.url) {
                            console.log("Using Paugram API:", data.data.url);
                            imageUrl = data.data.url;
                            break;
                        } else if (api.includes('btstu.cn') && data && data.imgurl) {
                             console.log("Using BTSTU API:", data.imgurl);
                            imageUrl = data.imgurl;
                            break;
                        } else if(api.includes('unsplash') && response.url) { // unsplash directly gives image URL on redirect
                            console.log("Using Unsplash API:", response.url);
                            imageUrl = response.url;
                            break;
                        }
                    }
                } catch (innerError) {
                    console.warn(`API ${api} failed, trying next.`, innerError);
                }
            }

            if (imageUrl) {
                // Preload image for smoother transition
                const img = new Image();
                img.src = imageUrl;
                img.onload = () => {
                    heroSection.style.backgroundImage = `url(${imageUrl})`;
                };
                img.onerror = () => {
                    console.warn("Wallpaper preloading failed, setting directly without transition.");
                    heroSection.style.backgroundImage = `url(${imageUrl})`;
                };
            } else {
                throw new Error("No valid image URL found from any API.");
            }
        
        } catch (error) {
            console.error('Failed to fetch any wallpaper:', error);
            // Fallback background in case all APIs fail
            heroSection.style.backgroundColor = 'var(--bg-color)'; 
            heroSection.style.backgroundImage = `linear-gradient(135deg, ${getRandomColor()}, ${getRandomColor()});`;
            heroSection.style.transition = 'background-image 5s ease-in-out';
        }
    };
    
    // Helper to generate a random pastel-like color for fallback gradient
    function getRandomColor() {
        const h = Math.floor(Math.random() * 360);
        const s = Math.floor(Math.random() * 30) + 70; // Saturation 70-100%
        const l = Math.floor(Math.random() * 15) + 70; // Lightness 70-85%
        return `hsl(${h}, ${s}%, ${l}%)`;
    }

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

        // Ensure header is visible regardless of scroll animation setup
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
        if (!cursorDot || isMobile) { // Disable on mobile devices
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

        if (!progressBar || !content) return; // Only activate on article detail pages

        window.addEventListener('scroll', () => {
            const contentHeight = content.offsetHeight;
            const contentOffsetTop = content.offsetTop;
            const windowHeight = window.innerHeight;
            const scrollFromTop = window.scrollY;

            // Calculate how far scrolled within the content area
            let scrolled = (scrollFromTop + windowHeight - contentOffsetTop) / contentHeight * 100;
            
            if (scrolled < 0) scrolled = 0;
            if (scrolled > 100) scrolled = 100;

            progressBar.style.width = scrolled + '%';
        });
    };


    // Initialize all features on DOM Ready
    setupHomepageBackground();
    setupScrollAnimations();
    setupBackToTopButton();
    setupCursorTrail();
    setupReadProgressBar(); // Conditional, will only run on article pages
});
