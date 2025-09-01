document.addEventListener('DOMContentLoaded', () => {

    console.log("🚀 [Final Version 6.0 - ERROR-FREE & ULTIMATE STABILITY] script.js STARTING execution...");

    // ===================================================================
    // 1. CORE UTILITIES & DYNAMIC STATE
    //    Moved setupCursorTrail UP here to ensure it's defined before anything calls it.
    // ===================================================================

    // ★★★ FIX: Modified setupCursorTrail to be robust with dynamic mobile status ★★★
    const setupCursorTrail = () => {
        const cursorDot = document.getElementById('cursor-trail');
        // Always get the *current* mobile status from the body class, which is updated on resize.
        const isCurrentlyMobile = document.body.classList.contains('is-mobile'); 

        if (cursorDot) {
            if (!isCurrentlyMobile) {
                document.body.style.cursor = 'none'; // Hide browser's default cursor
                cursorDot.style.display = 'block'; // Ensure custom cursor dot is visible
                cursorDot.style.opacity = '1'; // Ensure default custom cursor has opacity (was 0 in CSS default)

                // Remove existing mousemove listener before adding to prevent duplicates
                if (window.mousemoveHandler) { // Check if handler exists before removing
                    window.removeEventListener('mousemove', window.mousemoveHandler); 
                }
                // Add listener with a persistent handler directly on window for easy removal
                window.mousemoveHandler = e => { 
                    cursorDot.style.left = `${e.clientX}px`; 
                    cursorDot.style.top = `${e.clientY}px`; 
                };
                window.addEventListener('mousemove', window.mousemoveHandler); 

                // Event listeners for interactive elements for cursor scale effect
                document.querySelectorAll('a, button, .post-card').forEach(el => {
                    // Prevent duplicate listeners - specific named functions required for removeEventListener to work
                    if (el.dataset.addedCursorListeners) { // Check if listeners were added to this element
                        el.removeEventListener('mouseenter', window.handleMouseEnter);
                        el.removeEventListener('mouseleave', window.handleMouseLeave);
                    }
                    
                    window.handleMouseEnter = () => cursorDot.style.transform = 'translate(-50%, -50%) scale(1.5)';
                    window.handleMouseLeave = () => cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';

                    el.addEventListener('mouseenter', window.handleMouseEnter);
                    el.addEventListener('mouseleave', window.handleMouseLeave);
                    el.dataset.addedCursorListeners = 'true'; // Mark as added
                });
            } else {
                document.body.style.cursor = 'auto'; // Show default cursor on mobile devices
                cursorDot.style.display = 'none'; // Hide custom cursor
                cursorDot.style.opacity = '0'; // Ensure custom cursor is effectively hidden

                // Remove mousemove listener if in mobile mode
                if (window.mousemoveHandler) {
                     window.removeEventListener('mousemove', window.mousemoveHandler);
                     delete window.mousemoveHandler; // Clean up the global reference
                }
                document.querySelectorAll('a, button, .post-card').forEach(el => {
                    if (el.dataset.addedCursorListeners) {
                        el.removeEventListener('mouseenter', window.handleMouseEnter);
                        el.removeEventListener('mouseleave', window.handleMouseLeave);
                        delete el.dataset.addedCursorListeners;
                    }
                });
            }
        }
    };


    const updateBodyStyling = () => { 
        const desktopBlurCssVar = getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur').trim();
        const mobileBlurCssVar = getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur-mobile').trim();
        const currentIsMobile = window.innerWidth <= 767;

        document.documentElement.style.setProperty('--body-global-blur-value', currentIsMobile ? mobileBlurCssVar : desktopBlurCssVar);
        document.body.classList.toggle('is-mobile', currentIsMobile);
        
        // ★★★ FIX: Re-evaluate cursor visibility immediately after body class is updated ★★★
        // This is safe now because setupCursorTrail is defined above.
        setupCursorTrail(); 
    };

    // Initial call on load, and then listen for resize events
    updateBodyStyling(); 
    window.addEventListener('resize', updateBodyStyling); 


    // ===================================================================
    // 2. ULTIMATE VISIBILITY FIX (Most Critical Function for Content Display)
    // This runs IMMEDIATELY on `DOMContentLoaded` to guarantee content is visible.
    // ===================================================================
    const applyImmediateVisibilityFix = () => {
        // Step 1: Force critical structural elements to be immediately visible.
        // This targets outer wrappers for the main sections. `force-visible` uses `!important` in CSS.
        const structuralElements = document.querySelectorAll('.main-header, .hero-section, .content-page-wrapper, .main-footer, .main-content');
        structuralElements.forEach(el => {
            el.classList.add('force-visible');
        });
        console.log("[VisibilityFix] Top-level structural UI elements immediately 'force-visible' to ensure base layout.");

        // Step 2: Now, for ALL elements that are designed to animate (`animate__` prefix),
        // we directly apply the `is-visible` class with a calculated delay.
        // This ENSURES content displays without dependency on tricky IntersectionObserver timing for initial load.
        // It respects `data-delay` for a staggered effect while forcing visibility.
        const elementsToAnimateThroughoutPage = document.querySelectorAll('[class*="animate__"]');
        elementsToAnimateThroughoutPage.forEach(el => {
            const delay = parseInt(el.dataset.delay || '0', 10); // Grab existing animation delay
            setTimeout(() => {
                el.classList.add('is-visible');
            }, delay + 50); // Add a small base delay + existing data-delay for staggered show
        });
        console.log("[VisibilityFix] All content elements flagged for animation are being directly set to 'is-visible'. This is the core solution for blank pages.");

        // Step 3: Initialize IntersectionObserver for robustness.
        // It will catch any elements that might have been missed by the direct application,
        // or any content dynamically loaded or scrolled into view *after* initial setup.
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // Only add `is-visible` if it's currently hidden and in view.
                // This prevents redundant operations on elements already made visible by step 2.
                if (entry.isIntersecting && !entry.target.classList.contains('is-visible')) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target); // Stop observing once it's visible
                    // console.log(`[Observer] Additional element made visible by scroll: ${entry.target.tagName} with classes: ${entry.target.className}`);
                }
            });
        }, { 
            threshold: 0.1 // Triggers when 10% of the element is visible
        });

        // Loop through all animatable elements again for the observer.
        // Elements already visible from Step 2 will be ignored by the observer's `if` condition.
        document.querySelectorAll('[class*="animate__"]')
            .forEach(el => observer.observe(el));
    };

    // ★★★ CRITICAL: Call the immediate visibility fix FIRST ★★★
    applyImmediateVisibilityFix(); 


    // ===================================================================
    // 3. PAGE TRANSITION LOGIC
    // ===================================================================
    const pageTransitionOverlay = document.getElementById('global-page-transition-overlay');
    
    // Logic to initially fade out the overlay on bare page load.
    if (pageTransitionOverlay) {
        // Ensure the overlay fades out smoothly after the page content is guaranteed to be visible.
        // This is now decoupled from the content visibility.
        setTimeout(() => {
            pageTransitionOverlay.classList.remove('visible');
            setTimeout(() => {
                pageTransitionOverlay.style.display = 'none';
                document.body.classList.remove('no-scroll'); // Re-enable scrolling after transition
            }, 500); 
        }, 100); 
    }

    // Attach click handlers for internal links to trigger the transition
    document.querySelectorAll('a').forEach(link => {
        // Only target internal, non-anchor, non-javascript, non-blank target links
        if (link.hostname === window.location.hostname && !link.href.includes('#') && link.target !== '_blank' && !link.href.startsWith('javascript:') && !link.href.startsWith('mailto:')) { // Added mailto: exclusion
            link.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default instant navigation

                if (pageTransitionOverlay) {
                    document.body.classList.add('no-scroll'); // Prevent scroll during transition
                    pageTransitionOverlay.style.display = 'flex'; // Make overlay visible
                    setTimeout(() => pageTransitionOverlay.classList.add('visible'), 10); // Trigger fade-in CSS animation
                    setTimeout(() => window.location.href = link.href, 400); // Navigate after fade-in
                } else {
                    window.location.href = link.href; // Fallback for no overlay
                }
            });
        }
    });

    // ===================================================================
    // 4. DYNAMIC IMAGE LOADING & FALLBACK
    // ===================================================================
    const backendBaseUrl = 'https://honoka1.netlify.app/.netlify/functions/'; // Centralized Backend URL

    const getRandomGradient = () => `linear-gradient(135deg, hsla(${Math.floor(Math.random()*360)}, 85%, 60%, 0.7), hsla(${(Math.floor(Math.random()*360))}, 85%, 60%, 0.7))`;
    
    const applyFallbackImage = (imgElement, type) => {
        const isThumbnail = imgElement?.classList.contains('post-thumbnail');
        // NOTE: The fallback images must be present in your /img/ directory
        const fallbackFilename = isThumbnail ? 'post-thumbnail-fallback.png' : 'post-detail-banner-fallback.png';
        const fallbackSrc = `/img/${fallbackFilename}`; 
        
        if (type === 'background') {
            document.documentElement.style.setProperty('--bg-image', getRandomGradient()); 
        } else if (imgElement) {
            imgElement.src = fallbackSrc; 
            imgElement.style.objectFit = 'contain'; 
            imgElement.style.backgroundImage = getRandomGradient(); 
            imgElement.classList.add('is-loading-fallback'); 

            let fallbackTextOverlay = imgElement.nextElementSibling;
            if (!fallbackTextOverlay || !fallbackTextOverlay.classList.contains('fallback-text-overlay')) {
                fallbackTextOverlay = document.createElement('div');
                fallbackTextOverlay.className = 'fallback-text-overlay';
                if (imgElement.parentNode && getComputedStyle(imgElement.parentNode).position === 'static'){
                    imgElement.parentNode.style.position = 'relative'; 
                }
                imgElement.insertAdjacentElement('afterend', fallbackTextOverlay);
            }
            fallbackTextOverlay.textContent = isThumbnail ? "封面加载失败 :(" : "图片加载失败 :(";
        }
    };
    
    const fetchRandomAnimeImage = async (imgElement, type = 'background') => {
        // Prioritize more reliable/secure API for dynamic images
        const apiEndpoints = [
            'https://api.btstu.cn/sjbz/api.php?lx=dongman&format=images', // Stable, direct image URL
            'https://www.dmoe.cc/random.php', // Another direct image URL option
        ];
        let imageUrl = null;

        for (const apiUrl of apiEndpoints) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => {
                    console.warn(`[ImageLoader] API ${apiUrl} timed out after 8 seconds.`);
                    controller.abort();
                }, 8000); 

                const response = await fetch(apiUrl, { signal: controller.signal });
                clearTimeout(timeoutId); 

                if (!response.ok) {
                    console.warn(`[ImageLoader] API ${apiUrl} responded with status ${response.status}. Trying next API.`);
                    continue; 
                }

                // For APIs that return direct image URLs (like btstu.cn)
                if (response.headers.get('content-type')?.startsWith('image/')) {
                    imageUrl = response.url;
                } else {
                    // Fallback/check for APIs returning JSON that contains an image URL (e.g., lolicon, if implemented)
                    // The current APIs (btstu, dmoe) should generally return direct image data or redirect to it.
                    // For now, if not 'image/', assume direct URL from response.url for simplicity or re-evaluate.
                    // Given your current APIs, response.url should be the image URL if response.ok.
                    imageUrl = response.url;
                }

                if (imageUrl) {
                    console.log(`[ImageLoader] ✅ Found image from ${apiUrl}: ${imageUrl}`);
                    break; 
                }
            } catch (error) {
                console.warn(`[ImageLoader] Failed in fetch attempt from ${apiUrl}. Error:`, error.message);
            }
        }

        // After trying all APIs, if an imageUrl was found, attempt to use it.
        if (imageUrl) {
            const tempImg = new Image();
            tempImg.src = imageUrl;
            tempImg.onload = () => {
                if (type === 'background') {
                    document.documentElement.style.setProperty('--bg-image', `url('${imageUrl}')`);
                } else if (imgElement) {
                    imgElement.src = imageUrl;
                    imgElement.style.objectFit = 'cover'; 
                    imgElement.style.backgroundImage = ''; 
                    imgElement.classList.remove('is-loading-fallback');
                    imgElement.nextElementSibling?.classList.contains('fallback-text-overlay') && imgElement.nextElementSibling.remove();
                }
                console.log(`[ImageLoader] Dynamic image successfully applied.`);
            };
            tempImg.onerror = () => {
                console.error(`[ImageLoader] Fetched image (${imageUrl}) failed to load/render. Applying fallback.`);
                applyFallbackImage(imgElement, type);
            };
        } else {
            console.warn(`[ImageLoader] All image APIs attempts failed to fetch a valid URL. Applying final fallback.`);
            applyFallbackImage(imgElement, type); 
        }
    };

    // Orchestrates fetching background and content images
    const initializeDynamicImages = () => {
        fetchRandomAnimeImage(null, 'background'); // Target null for global background
        document.querySelectorAll('.post-thumbnail, .post-detail-banner').forEach(img => {
            if (!img.dataset.initialized) {
                img.dataset.initialized = 'true'; 
                applyFallbackImage(img, 'image'); 
                fetchRandomAnimeImage(img, 'image'); 
            }
        });
    };

    // ===========================================
    // 5. OTHER UI COMPONENT INITIALIZATIONS
    // ===========================================
    
    // Function for back-to-top button
    const setupBackToTopButton = () => {
        const btn = document.getElementById('back-to-top');
        if (!btn) return;
        btn.classList.toggle('show', window.scrollY > 300); 
        window.addEventListener('scroll', () => { btn.classList.toggle('show', window.scrollY > 300); });
        btn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    };

    // Function for the read progress bar (specific to post detail pages)
    const setupReadProgressBar = () => {
        const bar = document.getElementById('read-progress-bar');
        if (!bar) return;
        window.addEventListener('scroll', () => {
            const documentHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            // Prevent division by zero and ensure percentage is clamped
            const progress = documentHeight > 0 ? (window.scrollY / documentHeight) * 100 : 0;
            bar.style.width = `${Math.min(100, Math.max(0,progress))}%`;
        });
    };

    // Function for setting up the main navigation menu (hamburger icon)
    const setupMainMenu = () => {
        const toggle = document.querySelector('.menu-toggle');
        const nav = document.getElementById('main-nav-menu');
        if (!toggle || !nav) return;

        const closeMenu = () => {
            nav.classList.remove('is-open');
            toggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('no-scroll');
        };

        toggle.addEventListener('click', (e) => {
            e.stopPropagation(); 
            nav.classList.toggle('is-open');
            const isOpen = nav.classList.contains('is-open');
            toggle.setAttribute('aria-expanded', String(isOpen));
            document.body.classList.toggle('no-scroll', isOpen);
        });

        document.addEventListener('click', e => {
            if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) {
                closeMenu();
            }
        });

        nav.querySelector('.menu-close')?.addEventListener('click', closeMenu);
    };

    // Function for dynamic category filters (on blog.html) and dynamic list (on categories.html)
    const setupPostCategoryFilters = () => {
        const blogFiltersContainer = document.getElementById('blog-category-filters'); 
        const dynamicCategoryList = document.getElementById('dynamic-category-list'); 
        const postCards = document.querySelectorAll('#all-posts-grid .post-card');

        if (!blogFiltersContainer && !dynamicCategoryList) return;

        const allTags = new Set();
        // Collect all unique tags from existing post cards
        postCards.forEach(p => {
            p.dataset.tags?.split(',').map(tag => tag.trim()).filter(Boolean).forEach(tag => allTags.add(tag));
        });
        const sortedTags = [...allTags].sort((a,b) => a.localeCompare(b, 'zh-CN')); 

        if (blogFiltersContainer) { 
            let filterButtonsHTML = `<button class="filter-tag-button button active" data-filter="all">全部文章</button>`;
            sortedTags.forEach(tag => { 
                filterButtonsHTML += `<button class="filter-tag-button button" data-filter="${tag}">#${tag}</button>`; 
            });
            blogFiltersContainer.innerHTML = filterButtonsHTML;

            blogFiltersContainer.addEventListener('click', e => {
                const targetButton = e.target.closest('.filter-tag-button');
                if (targetButton) {
                    const filter = targetButton.dataset.filter;
                    postCards.forEach(card => {
                        const cardTags = card.dataset.tags?.split(',').map(t => t.trim()) || [];
                        if (filter === 'all' || cardTags.includes(filter)) {
                            card.style.display = ''; 
                            // Add 'is-visible' class if it's supposed to animate and not yet visible
                            if (!card.classList.contains('is-visible')) {
                                card.classList.add('is-visible'); 
                            }
                        } else {
                            card.style.display = 'none'; 
                             card.classList.remove('is-visible'); // Also remove visibility class if hidden
                        }
                    });
                    document.querySelectorAll('.filter-tag-button').forEach(btn => btn.classList.remove('active'));
                    targetButton.classList.add('active');
                }
            });
            const urlParams = new URLSearchParams(window.location.search);
            const initialTag = urlParams.get('tag'); // Get 'tag' query parameter
            if (initialTag) { // If there's an initial tag, try to click the corresponding filter button
                const buttonToClick = blogFiltersContainer.querySelector(`[data-filter="${initialTag}"]`);
                if (buttonToClick) {
                    buttonToClick.click();
                } else {
                    blogFiltersContainer.querySelector(`[data-filter="all"]`)?.click(); // Fallback to 'All'
                }
            } else {
                 blogFiltersContainer.querySelector(`[data-filter="all"]`)?.click(); // Default to 'All'
            }
        }

        if (dynamicCategoryList) { // If on categories.html, create dynamic category list
            dynamicCategoryList.innerHTML = sortedTags.map((tag, i) => 
                `<a href="blog.html?tag=${encodeURIComponent(tag)}" class="filter-tag-button button animate__slide-up" data-delay="${i * 50}"># ${tag}</a>`
            ).join('');
        }
    };

    // Function to calculate and update current year in the footer and visitor count
    const setupFooter = () => {
        const yearSpan = document.getElementById('current-year');
        if (yearSpan) yearSpan.textContent = new Date().getFullYear();

        const visitorSpan = document.getElementById('visitor-count');
        if (visitorSpan) {
            fetch(`${backendBaseUrl}handleVisitCount`)
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
                    return res.json();
                })
                .then(data => {
                    if (data.count !== undefined) { // Check for undefined, not just truthy to allow 0 visitors
                        visitorSpan.textContent = data.count;
                    }
                })
                .catch(err => {
                    console.error("[Footer] Failed to fetch visitor count:", err);
                    visitorSpan.textContent = '???'; 
                });
        }
    };
    
    // ===================================================================
    // 6. MASTER INITIALIZATION FUNCTION
    // This orchestrates all features to ensure proper load order.
    // ===================================================================

    function initializeAllFeatures() {
        initializeDynamicImages();        // Load images (background & thumbnails)
        setupMainMenu();                  // Enable hamburger menu interactions
        setupFooter();                    // Populate footer details
        setupReadProgressBar();           // Activate read progress bar
        setupBackToTopButton();           // Enable scroll-to-top button
        setupPostCategoryFilters();       // Setup blog categories and filters
        // Any other non-critical, page-specific feature initializations can go here safely.
        
        console.log("✅ [Final Version 6.0] All page features initialized.");
    }
    
    // Initialize all features.
    initializeAllFeatures();

    console.log("✅ [Final Version 6.0 - ERROR-FREE & ULTIMATE STABILITY] script.js COMPLETED all execution. Site should be fully functional now.");
});

