document.addEventListener('DOMContentLoaded', () => {

    console.log("🚀 [Final Version 5.0 - Ultimate Stability] script.js STARTING execution...");

    // ===================================================================
    // 1. CORE UTILITIES & DYNAMIC STATE
    // ===================================================================

    // Function to update body classes based on screen size and handle blur
    const updateBodyStyling = () => {
        const desktopBlurCssVar = getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur').trim();
        const mobileBlurCssVar = getComputedStyle(document.documentElement).getPropertyValue('--body-backdrop-blur-mobile').trim();
        const currentIsMobile = window.innerWidth <= 767;

        document.documentElement.style.setProperty('--body-global-blur-value', currentIsMobile ? mobileBlurCssVar : desktopBlurCssVar);
        document.body.classList.toggle('is-mobile', currentIsMobile); // This updates the `is-mobile` class on the <body>
        
        // ★★★ FIX: Re-evaluate cursor visibility immediately after body class is updated ★★★
        setupCursorTrail(); // Call again to ensure cursor adjusts to the new `is-mobile` state
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
        if (link.hostname === window.location.hostname && !link.href.includes('#') && link.target !== '_blank' && !link.href.startsWith('javascript:')) {
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
        const fallbackFilename = isThumbnail ? 'post-thumbnail-fallback.png' : 'post-detail-banner-fallback.png';
        const fallbackSrc = `/img/${fallbackFilename}`; // Absolute path for local fallback images
        
        if (type === 'background') {
            document.documentElement.style.setProperty('--bg-image', getRandomGradient()); // Apply an aesthetic gradient directly
            // Removed redundant `background-color` or solid color fallback for `--bg-image` because it's now gradient or URL.
        } else if (imgElement) {
            imgElement.src = fallbackSrc; 
            imgElement.style.objectFit = 'contain'; // Ensure fallback image is fully visible
            imgElement.style.backgroundImage = getRandomGradient(); // Apply gradient beneath fallback image as an ultimate visual cue
            imgElement.classList.add('is-loading-fallback'); // Mark element as loading/fallback state

            // Handle the visual "fallback text overlay" for image elements
            let fallbackTextOverlay = imgElement.nextElementSibling;
            if (!fallbackTextOverlay || !fallbackTextOverlay.classList.contains('fallback-text-overlay')) {
                fallbackTextOverlay = document.createElement('div');
                fallbackTextOverlay.className = 'fallback-text-overlay';
                if (imgElement.parentNode && getComputedStyle(imgElement.parentNode).position === 'static'){
                    imgElement.parentNode.style.position = 'relative'; // Parent needs `position` for absolute child
                }
                imgElement.insertAdjacentElement('afterend', fallbackTextOverlay);
            }
            fallbackTextOverlay.textContent = isThumbnail ? "封面加载失败 :(" : "图片加载失败 :(";
        }
    };
    
    const fetchRandomAnimeImage = async (imgElement, type = 'background') => {
        // Prioritize more reliable/secure API for dynamic images
        const apiEndpoints = [
            'https://api.btstu.cn/sjbz/api.php?lx=dongman&format=images', // Stable
            'https://www.dmoe.cc/random.php', // Another good option
            // 'https://api.lolicon.app/setu/v2?r18=0&size=original' // If we decide to use JSON-based API, needs different parsing
        ];
        let imageUrl = null;

        for (const apiUrl of apiEndpoints) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000); // Increased timeout to 8 seconds
                const response = await fetch(apiUrl, { signal: controller.signal });
                clearTimeout(timeoutId); // Clear timeout to prevent abort if response is quick

                if (!response.ok) {
                    console.warn(`[ImageLoader] API ${apiUrl} responded with status ${response.status}. Trying next API.`);
                    continue; // Skip to next API if not OK
                }

                // Check content type to see if it's a direct image or JSON
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    // Assuming 'lolicon' type API structure or similar
                    if (data && data.data?.[0]?.urls?.original) { 
                        imageUrl = data.data[0].urls.original;
                    } else if (data && data.imgurl) { // Basic check for simple JSON responses
                        imageUrl = data.imgurl;
                    }
                } else if (contentType && contentType.startsWith('image/')) {
                    // If the response itself is an image, its URL is already the image URL
                    imageUrl = response.url;
                }

                if (imageUrl) {
                    console.log(`[ImageLoader] ✅ Found image from ${apiUrl}: ${imageUrl}`);
                    break; // Successfully got an image URL, break from loop
                }
            } catch (error) {
                console.warn(`[ImageLoader] Failed to fetch image from ${apiUrl}. Error:`, error.message);
                // Continue to the next API on catastrophic network fail or abort
            }
        }

        // After trying all APIs, decide what to do
        if (imageUrl) {
            const tempImg = new Image();
            tempImg.src = imageUrl;
            tempImg.onload = () => {
                if (type === 'background') {
                    document.documentElement.style.setProperty('--bg-image', `url('${imageUrl}')`);
                } else if (imgElement) {
                    imgElement.src = imageUrl;
                    imgElement.style.objectFit = 'cover'; // Restore cover sizing for real image
                    imgElement.style.backgroundImage = ''; // Remove fallback gradient
                    imgElement.classList.remove('is-loading-fallback');
                    // Remove fallback text overlay when real image loads
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
            applyFallbackImage(imgElement, type); // Call fallback if all APIs fail
        }
    };

    // Orchestrates fetching background and content images
    const initializeDynamicImages = () => {
        fetchRandomAnimeImage(null, 'background'); // Target null for global background
        document.querySelectorAll('.post-thumbnail, .post-detail-banner').forEach(img => {
            if (!img.dataset.initialized) {
                img.dataset.initialized = 'true'; // Mark as processed
                applyFallbackImage(img, 'image'); // Immediately show local fallback for quick feedback
                fetchRandomAnimeImage(img, 'image'); // Then attempt to load dynamic image
            }
        });
    };

    // ===========================================
    // 5. OTHER UI COMPONENT INITIALIZATIONS
    // ===========================================

    // ★★★ FIX: Modified setupCursorTrail to be robust with dynamic mobile status ★★★
    const setupCursorTrail = () => {
        const cursorDot = document.getElementById('cursor-trail');
        // Always get the *current* mobile status from the body class, which is updated on resize.
        const isCurrentlyMobile = document.body.classList.contains('is-mobile'); 

        if (cursorDot) {
            if (!isCurrentlyMobile) {
                document.body.style.cursor = 'none'; // Hide browser's default cursor
                cursorDot.style.display = 'block'; // Ensure custom cursor dot is visible
                // Remove existing mousemove listener before adding
                window.removeEventListener('mousemove', cursorDot.mousemoveHandler); 
                // Add listener with a persistent handler for easy removal
                cursorDot.mousemoveHandler = e => { selector._original_element.style.left = `${e.clientX}px`; selector._original_element.style.top = `${e.clientY}px`; };
                window.addEventListener('mousemove', cursorDot.mousemoveHandler); 

                // Event listeners for interactive elements for cursor scale effect
                document.querySelectorAll('a, button, .post-card').forEach(el => {
                    // Prevent duplicate listeners
                    el.removeEventListener('mouseenter', cursorDot.handleMouseEnter);
                    el.removeEventListener('mouseleave', cursorDot.handleMouseLeave);
                    
                    cursorDot.handleMouseEnter = () => cursorDot.style.transform = 'translate(-50%, -50%) scale(1.5)';
                    cursorDot.handleMouseLeave = () => cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';

                    el.addEventListener('mouseenter', cursorDot.handleMouseEnter);
                    el.addEventListener('mouseleave', cursorDot.handleMouseLeave);
                });
                cursorDot.style.opacity = '1'; // Ensure default custom cursor has opacity
            } else {
                document.body.style.cursor = 'auto'; // Show default cursor on mobile devices
                cursorDot.style.display = 'none'; // Hide custom cursor
                 cursorDot.style.opacity = '0'; 

                // Remove mousemove listener if in mobile mode
                window.removeEventListener('mousemove', cursorDot.mousemoveHandler);
            }
        }
    };
    
    // Function for back-to-top button
    const setupBackToTopButton = () => {
        const btn = document.getElementById('back-to-top');
        if (!btn) return;
        btn.classList.toggle('show', window.scrollY > 300); // Set initial state
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
            e.stopPropagation(); // Stop click from bubbling to document and closing nav
            nav.classList.toggle('is-open');
            const isOpen = nav.classList.contains('is-open');
            toggle.setAttribute('aria-expanded', String(isOpen));
            document.body.classList.toggle('no-scroll', isOpen);
        });

        // Close menu if click outside of it
        document.addEventListener('click', e => {
            if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) {
                closeMenu();
            }
        });

        // Close button inside the menu itself
        nav.querySelector('.menu-close')?.addEventListener('click', closeMenu);
    };

    // Function for dynamic category filters (on blog.html) and dynamic list (on categories.html)
    const setupPostCategoryFilters = () => {
        const blogFiltersContainer = document.getElementById('blog-category-filters'); // For blog.html
        const dynamicCategoryList = document.getElementById('dynamic-category-list'); // For categories.html
        // We'll gather tags from `data-tags` attributes on post-cards in `blog.html`
        const postCards = document.querySelectorAll('#all-posts-grid .post-card');

        // Only proceed if one of the relevant containers exists
        if (!blogFiltersContainer && !dynamicCategoryList) return;

        const allTags = new Set();
        // Collect all unique tags from existing post cards
        postCards.forEach(p => {
            p.dataset.tags?.split(',').map(tag => tag.trim()).filter(Boolean).forEach(tag => allTags.add(tag));
        });
        const sortedTags = [...allTags].sort((a,b) => a.localeCompare(b, 'zh-CN')); // Sort tags alphabetically

        if (blogFiltersContainer) { // If on blog.html, create filter buttons
            let filterButtonsHTML = `<button class="filter-tag-button button active" data-filter="all">全部文章</button>`;
            sortedTags.forEach(tag => { 
                filterButtonsHTML += `<button class="filter-tag-button button" data-filter="${tag}">#${tag}</button>`; 
            });
            blogFiltersContainer.innerHTML = filterButtonsHTML;

            // Attach event listeners for filter functionality
            blogFiltersContainer.addEventListener('click', e => {
                const targetButton = e.target.closest('.filter-tag-button');
                if (targetButton) {
                    const filter = targetButton.dataset.filter;
                    postCards.forEach(card => {
                        // FIX: Use `card.dataset.tags` not `card.tags` and ensure proper filtering logic
                        const cardTags = card.dataset.tags?.split(',').map(t => t.trim()) || [];
                        if (filter === 'all' || cardTags.includes(filter)) {
                            card.style.display = ''; // Show
                        } else {
                            card.style.display = 'none'; // Hide
                        }
                    });
                    // Update active state of filter buttons
                    document.querySelectorAll('.filter-tag-button').forEach(btn => btn.classList.remove('active'));
                    targetButton.classList.add('active');
                }
            });
            // Apply initial filter if 'tag' query parameter exists in URL
            const initialTag = new URLSearchParams(window.location.search).get('tag');
            blogFiltersContainer.querySelector(`[data-filter="${initialTag || 'all'}"]`)?.click();
        }

        if (dynamicCategoryList) { // If on categories.html, create dynamic category list
            dynamicCategoryList.innerHTML = sortedTags.map((tag, i) => 
                // All category links go to blog.html with the filter tag as a query parameter
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
                .then(res => res.json())
                .then(data => {
                    if (data.count) visitorSpan.textContent = data.count;
                })
                .catch(err => {
                    console.error("[Footer] Failed to fetch visitor count:", err);
                    visitorSpan.textContent = '???'; // Show placeholder on error
                });
        }
    };
    
    // ===================================================================
    // 6. MASTER INITIALIZATION FUNCTION
    // This orchestrates all features to ensure proper load order.
    // ===================================================================

    function initializeAllFeatures() {
        initializeDynamicImages();        // Load images (background & thumbnails)
        setupCursorTrail();               // Initialize/update custom cursor behavior
        setupMainMenu();                  // Enable hamburger menu interactions
        setupFooter();                    // Populate footer details
        setupReadProgressBar();           // Activate read progress bar
        setupBackToTopButton();           // Enable scroll-to-top button
        setupPostCategoryFilters();       // Setup blog categories and filters
        // Any other non-critical, page-specific feature initializations can go here safely.
        
        console.log("✅ [Final Version 5.0] All page features initialized.");
    }
    
    // Once everything non-critical finishes, we call the master initializer
    initializeAllFeatures();

    console.log("✅ [Final Version 5.0 - Ultimate Stability] script.js COMPLETED all execution. Site should be fully functional now.");
});

