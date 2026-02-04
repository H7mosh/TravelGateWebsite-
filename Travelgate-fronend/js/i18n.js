/**
 * Travelgate Internationalization (i18n) Module - FIXED VERSION
 * Handles language loading, text updates, and RTL support
 */

// Global object to store current language data
window.i18nData = null;

// Default language
const DEFAULT_LANG = 'en';

// Storage key for language preference
const STORAGE_KEY = 'travelgate-lang';

// RTL languages
const RTL_LANGUAGES = ['ar', 'ku'];

console.log('[i18n] Module loaded');

/**
 * Gets the current language from localStorage or returns default
 * @returns {string} Language code (en, ar, ku)
 */
function getCurrentLanguage() {
    // Always default to English if no language is saved
    const savedLang = localStorage.getItem(STORAGE_KEY);
    return savedLang || DEFAULT_LANG;
}

/**
 * Saves the selected language to localStorage
 * @param {string} langCode - The language code to save
 */
function saveLanguage(langCode) {
    localStorage.setItem(STORAGE_KEY, langCode);
}

/**
 * Sets the document direction and language attribute
 * @param {string} langCode - The language code
 */
function setDocumentDirection(langCode) {
    const isRTL = RTL_LANGUAGES.includes(langCode);
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', langCode);
    
    // Add or remove RTL class for additional styling hooks
    if (isRTL) {
        document.body.classList.add('rtl');
    } else {
        document.body.classList.remove('rtl');
    }
}

/**
 * Gets a nested value from an object using dot notation
 * @param {object} obj - The object to traverse
 * @param {string} path - Dot-separated path (e.g., "hero.title")
 * @returns {*} The value at the path or undefined
 */
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
}

/**
 * Updates all elements with data-i18n attribute
 */
function updateTexts() {
    console.log('[i18n] updateTexts called');
    if (!window.i18nData) return;
    
    const elements = document.querySelectorAll('[data-i18n]');
    console.log(`[i18n] Found ${elements.length} elements with data-i18n`);
    
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const value = getNestedValue(window.i18nData, key);
        
        if (value !== undefined) {
            if (element.hasAttribute('placeholder')) {
                element.setAttribute('placeholder', value);
            } else {
                element.textContent = value;
            }
        }
    });
    
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        const value = getNestedValue(window.i18nData, key);
        if (value !== undefined) {
            element.setAttribute('placeholder', value);
        }
    });
}

/**
 * Renders the services section
 */
function renderServices() {
    console.log('[i18n] renderServices called');
    if (!window.i18nData || !window.i18nData.services) {
        console.log('[i18n] No services data');
        return;
    }
    
    const container = document.getElementById('services-list');
    if (!container) {
        console.log('[i18n] services-list container not found');
        return;
    }
    
    container.innerHTML = '';
    const items = window.i18nData.services.items;
    
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'service-card';
        card.innerHTML = `
            <div class="service-icon">${item.icon || '🌍'}</div>
            <h3 class="service-name">${item.name}</h3>
            <p class="service-description">${item.description}</p>
        `;
        container.appendChild(card);
    });
    console.log(`[i18n] Rendered ${items.length} services`);
}

/**
 * Renders the Why Us section
 */
function renderWhyUs() {
    console.log('[i18n] renderWhyUs called');
    if (!window.i18nData || !window.i18nData.whyUs) return;
    
    const container = document.getElementById('why-us-list');
    if (!container) return;
    
    container.innerHTML = '';
    const points = window.i18nData.whyUs.points;
    
    const ul = document.createElement('ul');
    ul.className = 'why-us-list';
    
    points.forEach(point => {
        const li = document.createElement('li');
        li.className = 'why-us-item';
        li.innerHTML = `
            <span class="check-icon">✓</span>
            <span class="point-text">${point}</span>
        `;
        ul.appendChild(li);
    });
    
    container.appendChild(ul);
    console.log(`[i18n] Rendered ${points.length} why-us points`);
}

/**
 * Renders the about stats section
 */
function renderAboutStats() {
    console.log('[i18n] renderAboutStats called');
    if (!window.i18nData || !window.i18nData.about || !window.i18nData.about.stats) return;
    
    const container = document.getElementById('about-stats');
    if (!container) return;
    
    const stats = window.i18nData.about.stats;
    
    container.innerHTML = `
        <div class="stat-item">
            <span class="stat-number">${stats.years}</span>
            <span class="stat-label">${stats.yearsLabel}</span>
        </div>
        <div class="stat-item">
            <span class="stat-number">${stats.destinations}</span>
            <span class="stat-label">${stats.destinationsLabel}</span>
        </div>
        <div class="stat-item">
            <span class="stat-number">${stats.clients}</span>
            <span class="stat-label">${stats.clientsLabel}</span>
        </div>
    `;
}

/**
 * Renders the hotels section - DISABLED - hotel-reservation.js handles this
 */
function renderHotels() {
    // Skip - hotel-reservation.js handles this with hotels.json
    // The language JSON also has a "hotels" section but we ignore it
    console.log('[i18n] renderHotels skipped - handled by hotel-reservation.js');
    return; // Exit immediately
}

/**
 * Renders the visa countries section
 */
function renderVisaCountries() {
    console.log('[i18n] renderVisaCountries called');
    
    const container = document.getElementById('visa-list');
    console.log('[i18n] visa-list container:', container);
    console.log('[i18n] i18nData exists:', !!window.i18nData);
    console.log('[i18n] visaCountries exists:', !!window.i18nData?.visaCountries);
    
    if (!container) {
        console.error('[i18n] visa-list container not found in DOM!');
        return;
    }
    
    if (!window.i18nData || !window.i18nData.visaCountries) {
        console.error('[i18n] No visaCountries data!');
        return;
    }
    
    container.innerHTML = '';
    const items = window.i18nData.visaCountries.items;
    console.log(`[i18n] Rendering ${items.length} visa countries`);
    
    items.forEach((item, index) => {
        console.log(`[i18n] Creating visa card ${index + 1}:`, item.country);
        const card = document.createElement('article');
        card.className = 'card';
        
        card.innerHTML = `
            <div class="card-image">
                <img src="${item.image}" alt="${item.country}" loading="lazy">
            </div>
            <div class="card-body">
                <h3 class="card-title">${item.country}</h3>
                <p class="card-meta">${item.type}</p>
                <p class="card-text">${item.note}</p>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    console.log(`[i18n] ✓ Rendered ${items.length} visa countries successfully`);
}

/**
 * Renders the groups section - DISABLED - group-tours.js handles this
 */
function renderGroups() {
    // Skip - group-tours.js handles this with group.json
    // The language JSON also has a "groups" section but we ignore it
    console.log('[i18n] renderGroups skipped - handled by group-tours.js');
    return; // Exit immediately
}

/**
 * Updates the language switcher to show active state
 */
function updateLanguageSwitcher(langCode) {
    const buttons = document.querySelectorAll('.lang-btn');
    buttons.forEach(btn => {
        if (btn.getAttribute('data-lang') === langCode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/**
 * Main function to load a language
 */
async function loadLanguage(langCode) {
    console.log(`[i18n] Loading language: ${langCode}`);
    
    try {
        const jsonPath = `assets/data-${langCode}.json`;
        console.log(`[i18n] Fetching: ${jsonPath}`);
        
        const response = await fetch(jsonPath);
        
        if (!response.ok) {
            throw new Error(`Failed to load language file: ${jsonPath}`);
        }
        
        window.i18nData = await response.json();
        console.log('[i18n] ✓ Data loaded successfully');
        console.log('[i18n] Data structure:', Object.keys(window.i18nData));
        
        saveLanguage(langCode);
        setDocumentDirection(langCode);
        
        // Render each section with error handling
        try { updateTexts(); } catch (e) { console.error('[i18n] Error in updateTexts:', e); }
        try { renderServices(); } catch (e) { console.error('[i18n] Error in renderServices:', e); }
        try { renderWhyUs(); } catch (e) { console.error('[i18n] Error in renderWhyUs:', e); }
        try { renderAboutStats(); } catch (e) { console.error('[i18n] Error in renderAboutStats:', e); }
        try { renderHotels(); } catch (e) { console.error('[i18n] Error in renderHotels:', e); }
        try { renderVisaCountries(); } catch (e) { console.error('[i18n] Error in renderVisaCountries:', e); }
        try { renderGroups(); } catch (e) { console.error('[i18n] Error in renderGroups:', e); }
        
        updateLanguageSwitcher(langCode);
        
        if (window.i18nData.site && window.i18nData.site.title) {
            document.title = window.i18nData.site.title + ' - ' + window.i18nData.site.tagline;
        }
        
        console.log('[i18n] ✓ Language loaded and rendered successfully');
        
    } catch (error) {
        console.error('[i18n] ✗ Error loading language:', error);
        if (langCode !== DEFAULT_LANG) {
            console.log('[i18n] Falling back to default language');
            loadLanguage(DEFAULT_LANG);
        }
    }
}

/**
 * Initializes the language switcher event listeners
 */
function initLanguageSwitcher() {
    const buttons = document.querySelectorAll('.lang-btn');
    console.log(`[i18n] Initializing ${buttons.length} language buttons`);
    
    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const lang = button.getAttribute('data-lang');
            if (lang) {
                console.log(`[i18n] Language button clicked: ${lang}`);
                loadLanguage(lang);
            }
        });
    });
}

/**
 * Initialize i18n on page load
 */
function initI18n() {
    console.log('[i18n] Initializing i18n system');
    // Get saved language or default to English
    let savedLang = localStorage.getItem(STORAGE_KEY);
    
    // If no language is saved, default to English
    if (!savedLang) {
        savedLang = DEFAULT_LANG;
        // Save English as default
        saveLanguage(DEFAULT_LANG);
    }
    
    console.log(`[i18n] Using language: ${savedLang}`);
    
    initLanguageSwitcher();
    loadLanguage(savedLang);
}

// Export functions
window.i18n = {
    loadLanguage,
    getCurrentLanguage,
    initI18n
};

console.log('[i18n] Module ready');