document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    const currentPathSegment = currentPath.split('/').pop().replace(/\.html$/, '');
    // Handle both / and /home as 'home' page
    const currentPage = (currentPath === '/' || currentPath.endsWith('/home') || currentPath.endsWith('/index.html')) ? 'home' : currentPathSegment;
    const navItems = [
        { href: '/home', key: 'nav.home', label: 'Начало', activePages: ['home'] },
        { href: '/about', key: 'nav.about', label: 'За нас', activePages: ['about'] },
        { href: '/baby-center', key: 'nav.baby_center', label: 'Бебешки център', activePages: ['baby-center'] },
        { href: '/academy', key: 'nav.academy', label: 'Академия за родители', activePages: ['academy'] },
        { href: '/partners', key: 'nav.partners', label: 'Партньори', activePages: ['partners'] },
        { href: '/gallery', key: 'nav.gallery', label: 'Галерия', activePages: ['gallery'] },
        { href: '/shop', key: 'nav.shop', label: 'Магазин', activePages: ['shop'] },
        { href: '/contact', key: 'nav.contact', label: 'Контакти', activePages: ['contact'] },
    ];

    const renderLayout = () => {
        try {
            const headerMount = document.getElementById('site-header');
            const footerMount = document.getElementById('site-footer');

            if (headerMount) {
                const navHtml = navItems.map(item => `
                        <li><a href="${item.href}"${(item.activePages || [item.href]).includes(currentPage) ? ' class="active"' : ''} data-key="${item.key}">${item.label}</a></li>
                `).join('');

                headerMount.outerHTML = `
        <div class="top-bar">
            <div class="container top-bar-container">
                <div class="top-bar-left">
                    <a href="tel:0879919779"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> 0879 919 779</a>
                    <a href="tel:0886646207"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> 088 664 6207</a>
                </div>
                <div class="top-bar-right">
                    <a href="https://www.facebook.com/profile.php?id=61555541437681" target="_blank" aria-label="Facebook">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                    </a>
                    <a href="https://www.instagram.com/sibebe_babyandparents_care/" target="_blank" aria-label="Instagram">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                    </a>
                    <a href="mailto:sibebe.bg@gmail.com" aria-label="Email">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    </a>
                </div>
            </div>
        </div>
        <header>
            <div class="container">
                <nav>
                    <div class="logo">
                        <a href="/home">
                            <img src="/assets/icons/logo-purple.png" alt="SI BEBE">
                        </a>
                    </div>
                    <ul class="nav-links">
    ${navHtml}
                        <li class="nav-lang">
                            <select id="lang-switch" class="lang-switch">
                                <option value="bg">🇧🇬 BG</option>
                                <option value="en">🇬🇧 EN</option>
                            </select>
                        </li>
                    </ul>
                    <div class="nav-actions">
                        <a href="/contact#booking" class="btn" data-key="nav.book_now">Запиши час</a>
                    </div>
                    <button class="menu-toggle" type="button" aria-label="Отвори меню" aria-expanded="false">
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </nav>
            </div>
        </header>`;
            }

            if (footerMount) {
                footerMount.outerHTML = `
        <footer>
            <div class="container">
                <div class="footer-bottom">
                    <div class="footer-phones">
                        <a href="tel:0879919779"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> 0879 919 779</a>
                        <a href="tel:0886646207"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> 088 664 6207</a>
                    </div>
                    <p class="footer-copyright">&copy; 2026 SI BEBE. All rights reserved.</p>
                    <div class="footer-social">
                        <a href="https://www.facebook.com/profile.php?id=61555541437681" target="_blank" aria-label="Facebook">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                        </a>
                        <a href="https://www.instagram.com/sibebe_babyandparents_care/" target="_blank" aria-label="Instagram">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                        </a>
                        <a href="mailto:sibebe.bg@gmail.com" aria-label="Email">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        </a>
                    </div>
                </div>
            </div>
        </footer>`;
            }
        } catch (err) {
            console.error('Error rendering layout:', err);
        }
    };

    renderLayout();

    const topBar = document.querySelector('.top-bar');
    const header = document.querySelector('header');
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        if (!topBar) return;
        
        if (window.scrollY > lastScrollY && window.scrollY > 50) {
            // Scrolling down
            topBar.classList.add('top-bar-hidden');
            if (header) header.style.top = '0';
        } else {
            // Scrolling up
            topBar.classList.remove('top-bar-hidden');
            if (header) header.style.top = ''; // Reset to value from CSS
        }
        lastScrollY = window.scrollY;
    });

    if (header && menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            const isOpen = header.classList.toggle('nav-open');
            menuToggle.setAttribute('aria-expanded', String(isOpen));
        });

        navLinks.addEventListener('click', (event) => {
            if (event.target.closest('a')) {
                header.classList.remove('nav-open');
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    const langSwitch = document.getElementById('lang-switch');
    if (!langSwitch) {
        console.warn('Language switch element not found (yet). It should be rendered by renderLayout.');
    }
    let currentLang = localStorage.getItem('lang') || 'bg';

    const updateContent = (lang) => {
        fetch('/assets/lang.json')
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                const texts = data[lang];
                if (!texts) return;
                document.querySelectorAll('[data-key]').forEach(elem => {
                    const key = elem.getAttribute('data-key');
                    const keys = key.split('.');
                    
                    let value = texts;
                    keys.forEach(k => {
                        if (value && value[k]) {
                            value = value[k];
                        } else {
                            value = null;
                        }
                    });

                    if (value && typeof value === 'string') {
                        elem.innerHTML = value;
                    }
                });
                document.documentElement.lang = lang === 'bg' ? 'bg-BG' : 'en-US';
            })
            .catch(err => console.error('Error loading language file:', err));
    };

    if (langSwitch) {
        langSwitch.addEventListener('change', (e) => {
            currentLang = e.target.value;
            localStorage.setItem('lang', currentLang);
            updateContent(currentLang);
        });

        langSwitch.value = currentLang;
    }
    updateContent(currentLang);
});

const HERO_CLOUD_DIVIDER_HTML = `
    <div class="hero-cloud-divider" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 283.5 27.8" preserveAspectRatio="xMidYMax slice">
            <path class="shape-fill" d="M265.8 3.5c-10.9 0-15.9 6.2-15.9 6.2s-3.6-3.5-9.2-.9c-9.1 4.1-4.4 13.4-4.4 13.4s-1.2.2-1.9.9c-.6.7-.5 1.9-.5 1.9s-1-.5-2.3-.2c-1.3.3-1.6 1.4-1.6 1.4s.4-3.4-1.5-5c-3.9-3.4-8.3-.2-8.3-.2s-.6-.7-.9-.9c-.4-.2-1.2-.2-1.2-.2s-4.4-3.6-11.5-2.6-10.4 7.9-10.4 7.9-.5-3.3-3.9-4.9c-4.8-2.4-7.4 0-7.4 0s2.4-4.1-1.9-6.4-6.2 1.2-6.2 1.2-.9-.5-2.1-.5-2.3 1.1-2.3 1.1.1-.7-1.1-1.1c-1.2-.4-2 0-2 0s3.6-6.8-3.5-8.9c-6-1.8-7.9 2.6-8.4 4-.1-.3-.4-.7-.9-1.1-1-.7-1.3-.5-1.3-.5s1-4-1.7-5.2c-2.7-1.2-4.2 1.1-4.2 1.1s-3.1-1-5.7 1.4-2.1 5.5-2.1 5.5-.9 0-2.1.7-1.4 1.7-1.4 1.7-1.7-1.2-4.3-1.2c-2.6 0-4.5 1.2-4.5 1.2s-.7-1.5-2.8-2.4c-2.1-.9-4 0-4 0s2.6-5.9-4.7-9c-7.3-3.1-12.6 3.3-12.6 3.3s-.9 0-1.9.2c-.9.2-1.5.9-1.5.9S99.4 3 94.9 3.9c-4.5.9-5.7 5.7-5.7 5.7s-2.8-5-12.3-3.9-11.1 6-11.1 6-1.2-1.4-4-.7c-.8.2-1.3.5-1.8.9-.9-2.1-2.7-4.9-6.2-4.4-3.2.4-4 2.2-4 2.2s-.5-.7-1.2-.7h-1.4s-.5-.9-1.7-1.4-2.4 0-2.4 0-2.4-1.2-4.7 0-3.1 4.1-3.1 4.1-1.7-1.4-3.6-.7c-1.9.7-1.9 2.8-1.9 2.8s-.5-.5-1.7-.2c-1.2.2-1.4.7-1.4.7s-.7-2.3-2.8-2.8c-2.1-.5-4.3.2-4.3.2s-1.7-5-11.1-6c-3.8-.4-6.6.2-8.5 1v21.2h283.5V11.1c-.9.2-1.6.4-1.6.4s-5.2-8-16.1-8z"></path>
        </svg>
    </div>
`;

function initHeroCloudDividers() {
    document.querySelectorAll('main > .hero, main > .page-header').forEach((heroSection) => {
        const nextSection = heroSection.nextElementSibling;
        if (!nextSection || nextSection.tagName.toLowerCase() !== 'section') return;
        if (nextSection.querySelector(':scope > .hero-cloud-divider')) return;

        nextSection.classList.add('section-with-hero-cloud');
        nextSection.insertAdjacentHTML('afterbegin', HERO_CLOUD_DIVIDER_HTML);
    });
}

const GOOGLE_SHEET_ID = '1GVZ5HZ4Io8CmyMF4sn4aUIWtQhOvFv81_5r7FTxKYcU';

const SHEETS = {
    reviews: 'Reviews',
    gallery: 'Gallery',
    events: 'Events',
};

const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const getCellValue = (cell) => {
    if (!cell) return '';
    return cell.f ?? cell.v ?? '';
};

const normalizeHeader = (value) => String(value ?? '').trim().toLowerCase();

const getRowValue = (row, aliases, fallbackIndex) => {
    for (const alias of aliases) {
        const value = row.byHeader[normalizeHeader(alias)];
        if (value !== undefined && value !== '') return value;
    }

    return row.values[fallbackIndex] ?? '';
};

const parseGoogleSheetResponse = (responseText) => {
    if (responseText.trim().startsWith('<')) {
        throw new Error('Google Sheet is not public or published to web.');
    }

    const jsonStart = responseText.indexOf('(');
    const jsonEnd = responseText.lastIndexOf(')');
    if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('Unexpected Google Sheet response format.');
    }

    const json = JSON.parse(responseText.slice(jsonStart + 1, jsonEnd));
    const headers = (json.table.cols || []).map((col) => normalizeHeader(col.label || col.id));

    return (json.table.rows || []).map((row) => {
        const values = (row.c || []).map(getCellValue);
        const byHeader = {};

        headers.forEach((header, index) => {
            if (header) byHeader[header] = values[index] ?? '';
        });

        return { values, byHeader };
    });
};

async function fetchGoogleSheetRows(sheetName) {
    if (!GOOGLE_SHEET_ID || GOOGLE_SHEET_ID.includes('YOUR_SHEET_ID')) {
        throw new Error('Google Sheet ID is not configured.');
    }

    const params = new URLSearchParams({
        tqx: 'out:json',
        sheet: sheetName,
        headers: '1',
    });
    const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Google Sheet request failed with status ${response.status}.`);
    }

    return parseGoogleSheetResponse(await response.text());
}

const setGridMessage = (container, message) => {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center;">${escapeHtml(message)}</p>`;
};

const parseStars = (value) => {
    const stars = Number.parseInt(value, 10);
    if (Number.isNaN(stars)) return 5;
    return Math.min(Math.max(stars, 1), 5);
};

const renderStars = (count) => '⭐'.repeat(count);

const getGoogleDriveId = (url, type) => {
    const value = String(url || '').trim();
    const patterns = type === 'folder'
        ? [/\/folders\/([a-zA-Z0-9_-]+)/, /[?&]id=([a-zA-Z0-9_-]+)/]
        : [/\/file\/d\/([a-zA-Z0-9_-]+)/, /[?&]id=([a-zA-Z0-9_-]+)/, /\/d\/([a-zA-Z0-9_-]+)/];

    for (const pattern of patterns) {
        const match = value.match(pattern);
        if (match) return match[1];
    }

    return '';
};

const isGoogleDriveFolderUrl = (url) => /drive\.google\.com\/drive\/folders\//.test(String(url || ''));

const getGalleryImageUrl = (url) => {
    const value = String(url || '').trim();
    if (!value) return '';

    if (/drive\.google\.com/.test(value) && !isGoogleDriveFolderUrl(value)) {
        const fileId = getGoogleDriveId(value, 'file');
        if (fileId) return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1200`;
    }

    return value;
};

const isLikelyImageUrl = (url) => {
    const value = String(url || '').trim();
    return /\.(avif|gif|jpe?g|png|svg|webp)(\?.*)?$/i.test(value);
};

const parseEventDate = (value) => {
    const rawValue = String(value || '').trim();
    const googleDateMatch = rawValue.match(/^Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)$/);

    if (googleDateMatch) {
        const [, year, month, day, hours = '0', minutes = '0', seconds = '0'] = googleDateMatch;
        return new Date(Number(year), Number(month), Number(day), Number(hours), Number(minutes), Number(seconds));
    }

    const parsedDate = new Date(rawValue);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const formatEventDate = (date, fallback) => {
    if (!date) return fallback;

    const monthNames = [
        'Януари',
        'Февруари',
        'Март',
        'Април',
        'Май',
        'Юни',
        'Юли',
        'Август',
        'Септември',
        'Октомври',
        'Ноември',
        'Декември',
    ];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day} ${month} ${year} ${hours}:${minutes}`;
};

function updateReviewScrollButtons() {
    const reviewsContainer = document.getElementById('reviews-container');
    const prevButton = document.querySelector('[data-reviews-scroll="prev"]');
    const nextButton = document.querySelector('[data-reviews-scroll="next"]');

    if (!reviewsContainer || !prevButton || !nextButton) return;

    const itemsCount = reviewsContainer.querySelectorAll('.review-card').length;
    reviewsContainer.classList.toggle('is-single-item', itemsCount === 1);

    const maxScrollLeft = reviewsContainer.scrollWidth - reviewsContainer.clientWidth;
    const shouldHideButtons = itemsCount <= 1 || maxScrollLeft <= 1;
    prevButton.hidden = shouldHideButtons;
    nextButton.hidden = shouldHideButtons;
    prevButton.disabled = reviewsContainer.scrollLeft <= 1;
    nextButton.disabled = reviewsContainer.scrollLeft >= maxScrollLeft - 1;
}

function initReviewScrollControls() {
    const reviewsContainer = document.getElementById('reviews-container');
    const buttons = document.querySelectorAll('[data-reviews-scroll]');

    if (!reviewsContainer || !buttons.length) return;

    buttons.forEach((button) => {
        button.addEventListener('click', () => {
            const direction = button.getAttribute('data-reviews-scroll') === 'prev' ? -1 : 1;
            const firstCard = reviewsContainer.querySelector('.review-card');
            const gap = Number.parseFloat(getComputedStyle(reviewsContainer).columnGap) || 0;
            const scrollAmount = firstCard ? firstCard.offsetWidth + gap : Math.min(400, reviewsContainer.clientWidth * 0.85);

            reviewsContainer.scrollBy({
                left: direction * scrollAmount,
                behavior: 'smooth',
            });
        });
    });

    reviewsContainer.addEventListener('scroll', updateReviewScrollButtons);
    window.addEventListener('resize', updateReviewScrollButtons);
    updateReviewScrollButtons();
}

function updateEventScrollButtons(carousel) {
    const eventsContainer = carousel.querySelector('.events-row');
    const prevButton = carousel.querySelector('[data-events-scroll="prev"]');
    const nextButton = carousel.querySelector('[data-events-scroll="next"]');

    if (!eventsContainer || !prevButton || !nextButton) return;

    const itemsCount = eventsContainer.querySelectorAll('.event-card').length;
    eventsContainer.classList.toggle('is-single-item', itemsCount === 1);

    const maxScrollLeft = eventsContainer.scrollWidth - eventsContainer.clientWidth;
    const shouldHideButtons = itemsCount <= 1 || maxScrollLeft <= 1;
    prevButton.hidden = shouldHideButtons;
    nextButton.hidden = shouldHideButtons;
    prevButton.disabled = eventsContainer.scrollLeft <= 1;
    nextButton.disabled = eventsContainer.scrollLeft >= maxScrollLeft - 1;
}

function updateAllEventScrollButtons() {
    document.querySelectorAll('.events-carousel').forEach(updateEventScrollButtons);
}

function initEventScrollControls() {
    document.querySelectorAll('.events-carousel').forEach((carousel) => {
        const eventsContainer = carousel.querySelector('.events-row');
        const buttons = carousel.querySelectorAll('[data-events-scroll]');

        if (!eventsContainer || !buttons.length) return;

        buttons.forEach((button) => {
            button.addEventListener('click', () => {
                const direction = button.getAttribute('data-events-scroll') === 'prev' ? -1 : 1;
                const firstCard = eventsContainer.querySelector('.event-card');
                const gap = Number.parseFloat(getComputedStyle(eventsContainer).columnGap) || 0;
                const scrollAmount = firstCard ? firstCard.offsetWidth + gap : Math.min(400, eventsContainer.clientWidth * 0.85);

                eventsContainer.scrollBy({
                    left: direction * scrollAmount,
                    behavior: 'smooth',
                });
            });
        });

        eventsContainer.addEventListener('scroll', () => updateEventScrollButtons(carousel));
        updateEventScrollButtons(carousel);
    });

    window.addEventListener('resize', updateAllEventScrollButtons);
}

// Google Sheets Integration for Reviews
async function fetchReviews() {
    const reviewsContainer = document.getElementById('reviews-container');
    if (!reviewsContainer) return;
    
    try {
        const rows = await fetchGoogleSheetRows(SHEETS.reviews);
        const reviews = rows.map((row) => {
            const author = getRowValue(row, ['Име на автор', 'Автор', 'Author', 'Name'], 0);
            const text = getRowValue(row, ['Отзив', 'Текст на отзива', 'Review', 'Text'], 1);
            const stars = parseStars(getRowValue(row, ['Брой звезди', 'Звезди', 'Stars', 'Rating'], 2));

            return {
                author: String(author).trim(),
                text: String(text).trim(),
                stars,
            };
        }).filter((review) => review.author && review.text);

        if (!reviews.length) {
            setGridMessage(reviewsContainer, 'Все още няма публикувани отзиви.');
            return;
        }

        reviewsContainer.innerHTML = reviews.map((review) => `
            <article class="review-card">
                <span class="stars" aria-label="${review.stars} от 5 звезди">${renderStars(review.stars)}</span>
                <h4>${escapeHtml(review.author)}</h4>
                <p>${escapeHtml(review.text)}</p>
            </article>
        `).join('');
        updateReviewScrollButtons();
    } catch (e) {
        console.error('Error fetching reviews:', e);
        setGridMessage(reviewsContainer, 'Отзивите не могат да бъдат заредени в момента.');
        updateReviewScrollButtons();
    }
}

// Google Sheets Integration for Gallery
async function fetchGallery() {
    const galleryContainer = document.getElementById('gallery-container');
    if (!galleryContainer) return;

    try {
        const rows = await fetchGoogleSheetRows(SHEETS.gallery);

        const galleryItems = rows.map((row) => {
            const url = getRowValue(row, ['URL', 'Image URL', 'Снимка', 'Линк'], 0);
            const altText = getRowValue(row, ['Описание', 'Alt текст', 'Alt', 'Title'], 1) || 'SI BEBE Gallery';

            return {
                url: String(url).trim(),
                altText: String(altText).trim(),
            };
        }).filter((item) => item.url && !isGoogleDriveFolderUrl(item.url));

        if (!galleryItems.length) {
            setGridMessage(galleryContainer, 'Добавете линкове към отделни снимки в Gallery таблицата.');
            return;
        }

        galleryContainer.innerHTML = galleryItems.map((item) => {
            const imgUrl = getGalleryImageUrl(item.url);
            return `
                <figure class="gallery-item">
                    <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(item.altText)}" loading="lazy">
                </figure>
            `;
        }).join('');
    } catch (e) {
        console.error("Error fetching gallery:", e);
        setGridMessage(galleryContainer, 'Снимките не могат да бъдат заредени в момента.');
    }
}

// Google Sheets Integration for Events
async function fetchEvents() {
    const eventsSection = document.getElementById('events');
    const upcomingSection = document.getElementById('upcoming-events-section');
    const pastSection = document.getElementById('past-events-section');
    const upcomingContainer = document.getElementById('events-container');
    const pastContainer = document.getElementById('past-events-container');
    if (!upcomingContainer) return;
    if (eventsSection) eventsSection.hidden = true;
    if (upcomingSection) upcomingSection.hidden = true;
    if (pastSection) pastSection.hidden = true;

    try {
        const rows = await fetchGoogleSheetRows(SHEETS.events);

        upcomingContainer.innerHTML = '';
        if (pastContainer) pastContainer.innerHTML = '';
        let eventsCount = 0;
        let upcomingCount = 0;
        let pastCount = 0;

        rows.forEach(row => {
            const title = String(getRowValue(row, ['Заглавие', 'Title', 'Event'], 0)).trim();
            const description = String(getRowValue(row, ['Описание', 'Description'], 1)).trim();
            const url = String(getRowValue(row, ['URL', 'Линк', 'Event URL'], 2)).trim();
            const date = getRowValue(row, ['Дата', 'Date'], 3);
            const status = String(getRowValue(row, ['Статус', 'Status'], 4)).trim().toLowerCase();

            if (!title || !date) return;
            eventsCount += 1;

            const eventDate = parseEventDate(date);
            const resolvedStatus = status || (eventDate && eventDate < new Date() ? 'past' : 'upcoming');
            const displayDate = formatEventDate(eventDate, String(date));
            const image = isLikelyImageUrl(url) ? getGalleryImageUrl(url) : '/images/missions.png';
            const eventLinkHtml = url && !isLikelyImageUrl(url)
                ? `<a href="${escapeHtml(url)}" class="event-link" target="_blank" rel="noopener">Виж повече</a>`
                : '';

            const eventHtml = `
                <div class="card event-card">
                    <div class="event-image" style="height: 200px; margin-bottom: 20px; border-radius: 10px; overflow: hidden;">
                        <img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div class="event-content">
                        <span class="event-date" style="color: var(--secondary-color); font-weight: 700; font-size: 0.9rem;">${escapeHtml(displayDate)}</span>
                        <h4 style="margin: 10px 0;">${escapeHtml(title)}</h4>
                        <p style="font-size: 0.95rem;">${escapeHtml(description)}</p>
                        ${eventLinkHtml}
                    </div>
                </div>
            `;

            if (resolvedStatus === 'past') {
                if (pastContainer) {
                    pastContainer.innerHTML += eventHtml;
                    pastCount += 1;
                }
            } else {
                upcomingContainer.innerHTML += eventHtml;
                upcomingCount += 1;
            }
        });

        if (eventsCount === 0) {
            updateAllEventScrollButtons();
            return;
        }

        if (eventsSection) eventsSection.hidden = false;
        if (upcomingSection) upcomingSection.hidden = upcomingCount === 0;
        if (pastSection) pastSection.hidden = pastCount === 0;
        updateAllEventScrollButtons();
    } catch (e) {
        console.error("Error fetching events:", e);
        updateAllEventScrollButtons();
    }
}

const GOOGLE_APPS_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';

async function submitGoogleSheetForm(form, sheetName, successMessage) {
    const formData = new FormData(form);
    formData.append('sheet', sheetName);
    formData.append('submitted_at', new Date().toISOString());

    if (!GOOGLE_APPS_SCRIPT_URL || GOOGLE_APPS_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
        console.log(`${sheetName} form data to send:`, Object.fromEntries(formData.entries()));
        alert('Формата е готова, но Google Apps Script URL още не е настроен.');
        return;
    }

    await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: formData,
    });

    alert(successMessage);
    form.reset();
}

// Simple Booking Form Integration
function initBookingForm() {
    const form = document.getElementById('booking-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await submitGoogleSheetForm(form, 'Bookings', 'Благодарим Ви! Ще се свържем с Вас скоро.');
            } catch (error) {
                console.error('Error submitting booking form:', error);
                alert('Възникна грешка. Моля, опитайте отново.');
            }
        });
    }
}

function initPartnerForm() {
    const form = document.getElementById('partner-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await submitGoogleSheetForm(form, 'Partners', 'Благодарим Ви! Ще се свържем с Вас скоро.');
            } catch (error) {
                console.error('Error submitting partner form:', error);
                alert('Възникна грешка. Моля, опитайте отново.');
            }
        });
    }
}

async function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
        return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
}

function initCopyContacts() {
    document.querySelectorAll('[data-copy]').forEach((element) => {
        element.addEventListener('click', async () => {
            const value = element.getAttribute('data-copy');
            if (!value) return;

            try {
                await copyText(value);
                const originalText = element.textContent;
                element.textContent = 'Копирано';
                setTimeout(() => {
                    element.textContent = originalText;
                }, 1200);
            } catch (error) {
                console.error('Error copying text:', error);
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initHeroCloudDividers();
    initReviewScrollControls();
    initEventScrollControls();
    fetchReviews();
    fetchGallery();
    fetchEvents();
    initBookingForm();
    initPartnerForm();
    initCopyContacts();
});
