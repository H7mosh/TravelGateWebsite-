/**
 * Travelgate Main JavaScript
 * Handles UI interactions, smooth scrolling, and form handling
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the page
    init();
});

/**
 * Main initialization function
 */
function init() {
    // Initialize i18n (language system)
    if (window.i18n && window.i18n.initI18n) {
        window.i18n.initI18n();
    }
    
    // Setup smooth scrolling for navigation links
    setupSmoothScrolling();
    
    // Setup header scroll effect
    setupHeaderScrollEffect();
    
    // Setup mobile menu toggle
    setupMobileMenu();
    
    // Setup contact form
    setupContactForm();
    
    // Setup scroll animations
    setupScrollAnimations();
    
    // Setup scroll progress bar
    setupScrollProgress();
    
    // Add staggered animations to cards
    setupStaggeredAnimations();
    
    // Setup back to top button
    setupBackToTop();
    
    // Load flights on homepage if container exists
    // Note: flights.js should initialize itself, but we check as a backup
    const flightsContainer = document.getElementById('flights-list-home');
    if (flightsContainer) {
        console.log('[Main] Flights container found on homepage');
        console.log('[Main] Checking if flights.js loaded...');
        console.log('[Main] window.loadFlights type:', typeof window.loadFlights);
        console.log('[Main] Scripts loaded:', {
            'flights.js': typeof window.loadFlights !== 'undefined',
            'transfers.js': typeof window.openTransferBookingModal !== 'undefined',
            'group-tours.js': typeof window.openGroupDetailsModal !== 'undefined'
        });
        
        // Flights.js should initialize itself, but if it doesn't, try to help
        if (typeof window.loadFlights === 'function') {
            console.log('[Main] loadFlights is available');
        } else {
            console.warn('[Main] loadFlights not available - flights.js may not have loaded or has an error');
            console.warn('[Main] Check browser console for errors in flights.js');
        }
    }
}

/**
 * Implements smooth scrolling for anchor links
 */
function setupSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Skip if it's just "#" or empty
            if (href === '#' || href === '') return;
            
            const target = document.querySelector(href);
            
            if (target) {
                e.preventDefault();
                
                // Close mobile menu if open
                const nav = document.querySelector('.nav-menu');
                const hamburger = document.querySelector('.hamburger');
                if (nav && nav.classList.contains('active')) {
                    nav.classList.remove('active');
                    if (hamburger) hamburger.classList.remove('active');
                }
                
                // Calculate offset for sticky header
                const headerHeight = document.querySelector('.header')?.offsetHeight || 80;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                // Smooth scroll to target
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Adds a class to header when scrolling
 */
function setupHeaderScrollEffect() {
    const header = document.querySelector('.header');
    if (!header) return;
    
    const scrollThreshold = 50;
    
    function handleScroll() {
        if (window.scrollY > scrollThreshold) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
    
    // Check initial scroll position
    handleScroll();
    
    // Add scroll listener with throttling for performance
    let ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    });
}

/**
 * Setup mobile hamburger menu toggle
 */
function setupMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (!hamburger || !navMenu) return;
    
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });
}

/**
 * Handles contact form submission
 * Currently shows a dummy success message
 */
function setupContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const name = form.querySelector('#name')?.value.trim();
        const email = form.querySelector('#email')?.value.trim();
        const message = form.querySelector('#message')?.value.trim();
        
        // Basic validation
        if (!name || !email || !message) {
            showFormMessage('Please fill in all fields.', 'error');
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showFormMessage('Please enter a valid email address.', 'error');
            return;
        }
        
        // Simulate form submission (no backend yet)
        // In production, this would send data to a server
        
        // Show success message from i18n data
        const successMessage = window.i18nData?.contact?.successMessage || 'Message sent successfully!';
        showFormMessage(successMessage, 'success');
        
        // Reset form
        form.reset();
    });
}

/**
 * Shows a message below the contact form
 * @param {string} message - The message to display
 * @param {string} type - 'success' or 'error'
 */
function showFormMessage(message, type) {
    // Remove any existing message
    const existingMessage = document.querySelector('.form-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `form-message form-message-${type}`;
    messageEl.textContent = message;
    
    // Insert after form
    const form = document.getElementById('contact-form');
    if (form) {
        form.parentNode.insertBefore(messageEl, form.nextSibling);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            messageEl.classList.add('fade-out');
            setTimeout(() => messageEl.remove(), 300);
        }, 5000);
    }
}

/**
 * Setup scroll-triggered animations for sections
 */
function setupScrollAnimations() {
    // Create intersection observer for fade-in animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                // Optionally stop observing after animation
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe sections for animation
    const animatedElements = document.querySelectorAll('.section, .service-card, .stat-item');
    animatedElements.forEach(el => {
        el.classList.add('animate-on-scroll');
        observer.observe(el);
    });
}

/**
 * Utility function to debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Updates active navigation link based on scroll position
 */
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    const headerHeight = document.querySelector('.header')?.offsetHeight || 80;
    
    let currentSection = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - headerHeight - 100;
        const sectionHeight = section.offsetHeight;
        
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            currentSection = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

// Add scroll listener for active nav link highlighting
window.addEventListener('scroll', debounce(updateActiveNavLink, 100));

/**
 * Setup scroll progress bar
 */
function setupScrollProgress() {
    // Create scroll progress elements
    const progressContainer = document.createElement('div');
    progressContainer.className = 'scroll-progress';
    
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress-bar';
    
    progressContainer.appendChild(progressBar);
    document.body.appendChild(progressContainer);
    
    // Update progress on scroll
    function updateScrollProgress() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollPercentage = (scrollTop / scrollHeight) * 100;
        
        progressBar.style.width = scrollPercentage + '%';
        
        // Show/hide based on scroll position
        if (scrollTop > 100) {
            progressContainer.classList.add('visible');
        } else {
            progressContainer.classList.remove('visible');
        }
    }
    
    // Throttled scroll event
    let ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                updateScrollProgress();
                ticking = false;
            });
            ticking = true;
        }
    });
    
    // Initial update
    updateScrollProgress();
}

/**
 * Setup staggered animations for card grids
 */
function setupStaggeredAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const cards = entry.target.querySelectorAll('.card, .hotel-card, .group-card, .service-card, .info-card, .why-us-item, .contact-item');
                
                cards.forEach((card, index) => {
                    setTimeout(() => {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(30px)';
                        card.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
                        
                        requestAnimationFrame(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        });
                    }, index * 100); // Stagger delay
                });
                
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe container sections
    const sections = document.querySelectorAll('#services-list, #hotelCardsContainer, #groups-list, #visa-list, #why-us-list, .contact-info, .cards-grid');
    sections.forEach(section => {
        if (section) observer.observe(section);
    });
}

/**
 * Add parallax effect to hero section
 */
function setupParallax() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const parallaxSpeed = 0.5;
        
        if (hero) {
            hero.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
        }
    });
}

/**
 * Setup back to top button
 */
function setupBackToTop() {
    // Create back to top button
    const backToTopBtn = document.createElement('button');
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.setAttribute('aria-label', 'Back to top');
    document.body.appendChild(backToTopBtn);
    
    // Show/hide based on scroll position
    function toggleBackToTop() {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    }
    
    // Scroll to top on click
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Throttled scroll event
    let ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                toggleBackToTop();
                ticking = false;
            });
            ticking = true;
        }
    });
    
    // Initial check
    toggleBackToTop();
}