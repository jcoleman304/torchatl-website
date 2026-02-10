// TORCH ATL - Public Website Scripts
// ====================================

// Add loading class immediately
document.body.classList.add('loading');

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all components
    initNavigation();
    initSmoothScroll();
    initScrollEffects();
    initInquiryForm();
    initPreloader();
    initSuiteSlideshow();
});

// Preloader
function initPreloader() {
    const preloader = document.getElementById('preloader');

    // Hide preloader after animation
    setTimeout(() => {
        if (preloader) {
            preloader.classList.add('hidden');
            document.body.classList.remove('loading');
        }
    }, 2000);

    // Fallback in case of slow load
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (preloader && !preloader.classList.contains('hidden')) {
                preloader.classList.add('hidden');
                document.body.classList.remove('loading');
            }
        }, 500);
    });
}

// Navigation
function initNavigation() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Mobile menu toggle
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu on link click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Scroll effect for navbar
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });
}

// Smooth scrolling for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');

            // Skip if just "#" or has onclick handler
            if (href === '#' || this.hasAttribute('onclick')) {
                return;
            }

            e.preventDefault();
            const target = document.querySelector(href);

            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Scroll-triggered animations
function initScrollEffects() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Add fade-in class to elements
    const animateElements = document.querySelectorAll(
        '.section-header, .about-content, .about-features, .estate-card, .suites-content, .suites-features, .tier, .inquire-content, .inquire-form-container, .quote'
    );

    animateElements.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });

    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        .fade-in {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .fade-in.visible {
            opacity: 1;
            transform: translateY(0);
        }
        .estate-card.fade-in,
        .tier.fade-in {
            transition-delay: calc(var(--index, 0) * 0.1s);
        }
    `;
    document.head.appendChild(style);

    // Add stagger delay to cards
    document.querySelectorAll('.estate-card').forEach((card, index) => {
        card.style.setProperty('--index', index);
    });

    document.querySelectorAll('.tier').forEach((tier, index) => {
        tier.style.setProperty('--index', index);
    });

    // Counter animation for stats
    initCounters();
}

// Counter Animation
function initCounters() {
    const counters = document.querySelectorAll('.stat-number[data-target]');

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                entry.target.classList.add('counted');
                animateCounter(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => counterObserver.observe(counter));
}

function animateCounter(element) {
    const target = parseInt(element.dataset.target);
    const duration = 2000;
    const start = 0;
    const startTime = performance.now();

    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (target - start) * easeOut);

        element.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target;
        }
    }

    requestAnimationFrame(updateCounter);
}

// Inquiry Form Handling
function initInquiryForm() {
    const form = document.getElementById('inquire-form');

    if (form) {
        form.addEventListener('submit', handleInquiry);
    }
}

// Handle inquiry form submission
function handleInquiry(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Validate required fields
    if (!data.name || !data.email || !data.role) {
        showNotification('Please fill in all required fields.', 'error');
        return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        showNotification('Please enter a valid email address.', 'error');
        return;
    }

    // Store inquiry (in production, this would send to backend)
    storeInquiry(data);

    // Show success modal
    showSuccessModal();

    // Reset form
    form.reset();
}

// Store inquiry locally (demo purposes)
function storeInquiry(data) {
    const inquiries = JSON.parse(localStorage.getItem('torch_inquiries') || '[]');

    inquiries.push({
        ...data,
        timestamp: new Date().toISOString(),
        status: 'pending'
    });

    localStorage.setItem('torch_inquiries', JSON.stringify(inquiries));

    console.log('[TORCH] Inquiry stored:', data);
}

// Show success modal
function showSuccessModal() {
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Close modal
function closeModal() {
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close modal on outside click
document.addEventListener('click', (e) => {
    const modal = document.getElementById('success-modal');
    if (modal && e.target === modal) {
        closeModal();
    }
});

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeLoginModal();
    }
});

// ==========================================
// Member Login System
// ==========================================

// Member credentials (synced with Member Portal)
const MEMBER_CREDENTIALS = {
    'joi@torchatl.com': { accessCode: 'JOI2026', name: 'Joi Coleman' },
    'dke@torchatl.com': { accessCode: 'DKE2026', name: 'DKE' },
    'derrick@example.com': { accessCode: 'TORCH2026', name: 'Derrick Milano' },
    'member@torch.com': { accessCode: 'DEMO2026', name: 'Demo Member' }
};

// Show login modal
function showLoginModal(event) {
    if (event) event.preventDefault();

    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus email input
        setTimeout(() => {
            const emailInput = document.getElementById('login-email');
            if (emailInput) emailInput.focus();
        }, 100);
    }

    // Close mobile menu if open
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (navToggle && navMenu) {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
    }
}

// Close login modal
function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';

        // Clear form
        const form = document.getElementById('website-login-form');
        if (form) form.reset();

        // Clear error
        const errorEl = document.getElementById('login-error');
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.classList.remove('visible');
        }
    }
}

// Handle member login
function handleMemberLogin(event) {
    event.preventDefault();

    const email = document.getElementById('login-email').value.toLowerCase().trim();
    const accessCode = document.getElementById('login-code').value.trim();
    const errorEl = document.getElementById('login-error');

    // Clear previous error
    errorEl.textContent = '';
    errorEl.classList.remove('visible');

    // Check credentials
    const member = MEMBER_CREDENTIALS[email];

    if (!member) {
        errorEl.textContent = 'Email not found. Please check your email or request membership.';
        errorEl.classList.add('visible');
        return;
    }

    if (member.accessCode !== accessCode) {
        errorEl.textContent = 'Invalid access code. Please try again.';
        errorEl.classList.add('visible');
        return;
    }

    // Success! Store login session and redirect to member portal
    localStorage.setItem('torch_current_member', email);
    localStorage.setItem('torch_login_timestamp', Date.now().toString());

    console.log('[TORCH] Login successful:', member.name);

    // Redirect to member portal
    window.location.href = 'portal/index.html';
}

// Close login modal on outside click
document.addEventListener('click', (e) => {
    const loginModal = document.getElementById('login-modal');
    if (loginModal && e.target === loginModal) {
        closeLoginModal();
    }
});

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#333'};
        color: white;
        padding: 16px 24px;
        font-size: 0.875rem;
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Auto remove
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Add notification animations
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(notificationStyles);

// Parallax effect for hero (subtle)
window.addEventListener('scroll', () => {
    const hero = document.querySelector('.hero-content');
    if (hero && window.pageYOffset < window.innerHeight) {
        const scroll = window.pageYOffset;
        hero.style.transform = `translateY(${scroll * 0.3}px)`;
        hero.style.opacity = 1 - (scroll / window.innerHeight);
    }
});

// Preload effect
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// Suite background slideshow
function initSuiteSlideshow() {
    const images = document.querySelectorAll('.suites-bg-img');
    if (images.length < 2) return;

    let current = 0;
    images[current].classList.add('active');

    setInterval(() => {
        const prev = current;
        current = (current + 1) % images.length;
        images[prev].classList.remove('active');
        images[prev].classList.add('fade-out');
        images[current].classList.remove('fade-out');
        images[current].classList.add('active');
        setTimeout(() => {
            images[prev].classList.remove('fade-out');
        }, 1500);
    }, 6000);
}

console.log('[TORCH ATL] Website initialized');
