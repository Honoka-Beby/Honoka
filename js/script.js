document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Switching Logic ---
    const themeToggler = document.getElementById('theme-toggler');
    const themeDropdown = document.querySelector('.theme-dropdown');
    const body = document.body;

    // Load saved theme or default to 'default'
    const savedTheme = localStorage.getItem('blogTheme') || 'default';
    body.classList.add(`theme-${savedTheme}`);

    themeToggler.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent default link behavior
        e.stopPropagation(); // Stop propagation to prevent immediate closing from body click
        themeDropdown.classList.toggle('menu-hidden');
        themeDropdown.classList.toggle('menu-visible');
    });

    themeDropdown.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI') {
            const newTheme = e.target.dataset.themeName;
            
            // Remove all existing theme classes
            body.className = body.className.replace(/theme-[a-z-]+/g, ''); 
            
            // Add the new theme class
            body.classList.add(`theme-${newTheme}`);
            localStorage.setItem('blogTheme', newTheme);
            
            // Close the dropdown
            themeDropdown.classList.remove('menu-visible');
            themeDropdown.classList.add('menu-hidden');
        }
    });

    // Close the dropdown if clicking anywhere else on the document
    document.addEventListener('click', (e) => {
        if (!themeToggler.contains(e.target) && !themeDropdown.contains(e.target)) {
            themeDropdown.classList.remove('menu-visible');
            themeDropdown.classList.add('menu-hidden');
        }
    });


    // --- Scroll-Triggered Animations ---
    const faders = document.querySelectorAll('.animate__fade-in, .animate__fade-up, .animate__pop-in');

    const appearOptions = {
        threshold: 0.2, // Element is 20% in view
        rootMargin: "0px 0px -50px 0px" // Start animating it a bit before it reaches viewport bottom
    };

    const appearOnScroll = new IntersectionObserver((entries, appearOnScroll) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            }
            entry.target.classList.add('is-visible');
            appearOnScroll.unobserve(entry.target); // Stop observing once it's visible
        });
    }, appearOptions);

    faders.forEach(fader => {
        appearOnScroll.observe(fader);
    });

    // --- Special animation for header and top elements on page load ---
    // These elements should animate immediately, not wait for scroll
    document.querySelector('.main-header').classList.add('is-visible');
    const blogTitle = document.querySelector('.blog-title');
    if (blogTitle && window.location.pathname.endsWith('index.html') || window.location.pathname === '/'){ // Only animate on index page
        setTimeout(() => blogTitle.classList.add('is-visible'), 100);
    }

    if (document.querySelector('.my-avatar')) {
        setTimeout(() => document.querySelector('.my-avatar').classList.add('is-visible'), 200);
    }
    if (document.querySelector('.page-title')) {
        setTimeout(() => document.querySelector('.page-title').classList.add('is-visible'), 300);
    }


});
