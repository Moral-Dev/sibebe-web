/* SI BEBE v2: menu, motion, Google Sheets content, gallery, forms. */

const SHEET_ID = '1GVZ5HZ4Io8CmyMF4sn4aUIWtQhOvFv81_5r7FTxKYcU';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyg901y3rs68sHDEWoS_1Cv38vc9xNVcy9tR4ofJMg8_HcuV2J5F8E278rL--lQ7uFK/exec';

const ICONS = {
    star: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5L2.5 9.3l6.6-.8z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    photo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="15" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M21 17l-5-5-8 8"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
};

const MONTHS = ['Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни', 'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'];

const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

/* ---------- Menu ---------- */
function initMenu() {
    const header = document.querySelector('.site-header');
    const toggle = document.querySelector('.menu-toggle');
    if (!header || !toggle) return;

    const setTop = () => document.documentElement.style.setProperty('--menu-top', `${Math.round(header.getBoundingClientRect().bottom)}px`);
    const closeSubs = () => document.querySelectorAll('.has-sub.is-open').forEach((item) => {
        item.classList.remove('is-open');
        item.querySelector('.sub-toggle')?.setAttribute('aria-expanded', 'false');
    });
    const setOpen = (open) => {
        if (open) setTop();
        header.classList.toggle('nav-open', open);
        header.classList.remove('is-hidden');
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Затвори меню' : 'Меню');
        document.body.classList.toggle('no-scroll', open);
        if (!open) closeSubs();
    };

    toggle.addEventListener('click', () => setOpen(!header.classList.contains('nav-open')));
    header.querySelectorAll('.nav a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && header.classList.contains('nav-open')) { setOpen(false); toggle.focus(); }
    });
    window.addEventListener('resize', () => {
        if (!header.classList.contains('nav-open')) return;
        if (window.innerWidth > 1180) setOpen(false); else setTop();
    });

    document.querySelectorAll('.sub-toggle').forEach((button) => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const item = button.closest('.has-sub');
            const open = item.classList.toggle('is-open');
            button.setAttribute('aria-expanded', String(open));
        });
    });

    document.addEventListener('click', (event) => {
        if (event.target.closest('.has-sub') || header.classList.contains('nav-open')) return;
        closeSubs();
    });
}

/* ---------- Motion: header, progress, reveal, parallax, counters ---------- */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const REVEAL = [
    ['.section .section-head', ''],
    ['.split-media', 'zoom'],
    ['.split-body > :not(.section-head)', ''],
    ['.card-grid > *, .goals > *, .feature-grid > li, .feature-list > li, .partner-cats > li', ''],
    ['.timeline > li', 'left'],
    ['.steps > li', 'left'],
    ['.day-strip > li', ''],
    ['.quote-grid > *, .quote-body > p', ''],
    ['.feature-block, .philosophy, .age-scale, .price-image, .form-card, .map-head, .map, .filters, .cta-panel', ''],
];

let revealObserver = null;

function observeReveal(root = document) {
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    if (!revealObserver) {
        revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-in');
                revealObserver.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    }
    const mark = (el, kind) => {
        if (el.hasAttribute('data-reveal') || el.closest('.hero, .page-intro')) return;
        el.setAttribute('data-reveal', kind);
        // Stagger siblings that enter together
        const siblings = Array.from(el.parentElement.children).filter((c) => c.hasAttribute('data-reveal'));
        el.style.setProperty('--delay', `${Math.min(siblings.indexOf(el), 6) * 0.09}s`);
        revealObserver.observe(el);
    };
    REVEAL.forEach(([selector, kind]) => root.querySelectorAll(selector).forEach((el) => mark(el, kind)));
    root.querySelectorAll('.review, .event').forEach((el) => mark(el, ''));
}

function splitWords() {
    document.querySelectorAll('[data-split]').forEach((heading) => {
        let index = 0;
        const walk = (node) => {
            Array.from(node.childNodes).forEach((child) => {
                if (child.nodeType === Node.TEXT_NODE) {
                    const parts = child.textContent.split(/(\s+)/);
                    const frag = document.createDocumentFragment();
                    parts.forEach((part) => {
                        if (!part) return;
                        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
                        const span = document.createElement('span');
                        span.className = 'w';
                        span.style.setProperty('--wi', index++);
                        span.textContent = part;
                        frag.appendChild(span);
                    });
                    child.replaceWith(frag);
                } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName.toLowerCase() !== 'svg') {
                    walk(child);
                }
            });
        };
        walk(heading);
        heading.classList.add('is-ready');
    });
}

function addStars() {
    document.querySelectorAll('[data-stars], .footer-stars').forEach((host) => {
        const layer = host.classList.contains('footer-stars') ? host : document.createElement('div');
        if (layer !== host) { layer.className = 'stars-layer'; host.prepend(layer); }
        const count = window.innerWidth < 640 ? 22 : 46;
        for (let i = 0; i < count; i += 1) {
            const star = document.createElement('i');
            star.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;--z:${(Math.random() * 2.6 + 1.4).toFixed(1)}px;--t:${(Math.random() * 3 + 2).toFixed(1)}s;--d:${(Math.random() * -5).toFixed(1)}s`;
            layer.appendChild(star);
        }
    });
}

function countUp(el) {
    const target = parseInt(el.dataset.count, 10);
    if (!target || reduceMotion) return;
    const io = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now) => {
            const t = Math.min((now - start) / 1800, 1);
            el.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 4))));
            if (t < 1) requestAnimationFrame(tick);
        };
        el.textContent = '0';
        requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(el);
}

function initScrollEffects() {
    const header = document.querySelector('.site-header');
    const progress = document.querySelector('.scroll-progress');
    const timelines = Array.from(document.querySelectorAll('.timeline'));
    const decos = reduceMotion ? [] : Array.from(document.querySelectorAll('.deco[data-depth]'));
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
        ticking = false;
        const y = window.scrollY;
        const vh = window.innerHeight;
        const max = document.documentElement.scrollHeight - vh;
        if (progress) progress.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : 0);
        if (header) {
            header.classList.toggle('is-scrolled', y > 20);
            const open = header.classList.contains('nav-open');
            if (!open && y > 400 && y > lastY + 4) header.classList.add('is-hidden');
            else if (y < lastY - 4 || y <= 400) header.classList.remove('is-hidden');
        }
        timelines.forEach((line) => {
            const r = line.getBoundingClientRect();
            const p = Math.min(Math.max((vh * 0.75 - r.top) / r.height, 0), 1);
            line.style.setProperty('--line-progress', p.toFixed(3));
        });
        decos.forEach((deco) => {
            const r = deco.parentElement.getBoundingClientRect();
            if (r.bottom < 0 || r.top > vh) return;
            const offset = Math.max(-60, Math.min(60, (r.top + r.height / 2 - vh / 2) * parseFloat(deco.dataset.depth)));
            deco.style.setProperty('--py', `${offset.toFixed(1)}px`);
        });
        lastY = y;
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
}

/* ---------- "Read more" toggles ---------- */
document.addEventListener('click', (event) => {
    const toggle = event.target.closest('.more-toggle');
    if (!toggle) return;
    const target = document.getElementById(toggle.getAttribute('aria-controls'));
    if (!target) return;
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    target.hidden = !open;
});

/* ---------- Google Sheets ---------- */
const normalize = (value) => String(value ?? '').trim().toLowerCase();

async function fetchSheet(name) {
    const params = new URLSearchParams({ tqx: 'out:json', sheet: name, headers: '1' });
    const response = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?${params}`);
    if (!response.ok) throw new Error(`Sheet request failed: ${response.status}`);
    const text = await response.text();
    if (text.trim().startsWith('<')) throw new Error('Sheet is not public.');
    const json = JSON.parse(text.slice(text.indexOf('(') + 1, text.lastIndexOf(')')));
    const headers = (json.table.cols || []).map((col) => normalize(col.label || col.id));
    return (json.table.rows || []).map((row) => {
        const values = (row.c || []).map((cell) => (cell ? (cell.f ?? cell.v ?? '') : ''));
        const byHeader = {};
        headers.forEach((header, i) => { if (header) byHeader[header] = values[i] ?? ''; });
        return { values, byHeader, headers };
    });
}

const pick = (row, names, fallbackIndex) => {
    for (const name of names) {
        const value = row.byHeader[normalize(name)];
        if (value !== undefined && value !== '') return value;
    }
    return fallbackIndex === undefined ? '' : (row.values[fallbackIndex] ?? '');
};

const driveId = (url) => {
    const match = String(url).match(/\/file\/d\/([\w-]+)/) || String(url).match(/[?&]id=([\w-]+)/);
    return match ? match[1] : '';
};

const isDriveFolder = (url) => /drive\.google\.com\/drive\/folders\//.test(String(url));

const imageUrl = (url, size = 'w1200') => {
    const value = String(url || '').trim();
    if (/drive\.google\.com/.test(value) && !isDriveFolder(value) && driveId(value)) {
        return `https://drive.google.com/thumbnail?id=${encodeURIComponent(driveId(value))}&sz=${size}`;
    }
    return value;
};

const isImageUrl = (url) => /\.(avif|gif|jpe?g|png|svg|webp)(\?.*)?$/i.test(String(url)) || (/drive\.google\.com/.test(String(url)) && !isDriveFolder(url) && Boolean(driveId(url)));

const placeholder = (type) => `<div class="placeholder">${type === 'event' ? ICONS.calendar : ICONS.photo}<span>${type === 'event' ? 'Събитие в SI BEBE' : 'Снимката не е налична'}</span></div>`;

document.addEventListener('error', (event) => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement)) return;
    const box = img.closest('.event-media, .tile');
    if (!box || box.classList.contains('is-missing')) return;
    box.classList.add('is-missing');
    box.insertAdjacentHTML('beforeend', placeholder(box.classList.contains('tile') ? 'photo' : 'event'));
}, true);

/* Reviews */
async function loadReviews() {
    const box = document.querySelector('[data-reviews]');
    if (!box) return;
    try {
        const rows = await fetchSheet('Reviews');
        const reviews = rows.map((row) => ({
            author: String(pick(row, ['Име на автор', 'Автор', 'Author'], 0)).trim(),
            text: String(pick(row, ['Отзив', 'Oтзив', 'Review'], 1)).trim(),
            stars: Math.min(Math.max(parseInt(pick(row, ['Брой звезди', 'Звезди', 'Stars'], 2), 10) || 5, 1), 5),
        })).filter((review) => review.author && review.text);

        box.innerHTML = reviews.length
            ? reviews.map((review) => `
                <article class="review">
                    <div class="stars" aria-label="${review.stars} от 5 звезди">${ICONS.star.repeat(review.stars)}</div>
                    <h3>${escapeHtml(review.author)}</h3>
                    <p>${escapeHtml(review.text)}</p>
                </article>`).join('')
            : '<p class="loading-note">Все още няма публикувани отзиви.</p>';
        observeReveal(box);
    } catch (error) {
        console.error(error);
        box.innerHTML = '<p class="loading-note">Отзивите не могат да бъдат заредени в момента.</p>';
    }
}

/* Events */
const parseDate = (value) => {
    const raw = String(value || '').trim();
    const g = raw.match(/^Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)$/);
    if (g) return new Date(+g[1], +g[2], +g[3], +(g[4] || 0), +(g[5] || 0));
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
};

const formatDate = (date, fallback) => {
    if (!date) return fallback;
    const time = date.getHours() || date.getMinutes()
        ? ` ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
        : '';
    return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}${time}`;
};

async function loadEvents() {
    const section = document.querySelector('[data-events-section]');
    if (!section) return;
    try {
        const rows = await fetchSheet('Events');
        const upcoming = [];
        const past = [];
        rows.forEach((row) => {
            const title = String(pick(row, ['Заглавие', 'Title'], 0)).trim();
            const description = String(pick(row, ['Описание', 'Description'], 1)).trim();
            const url = String(pick(row, ['URL', 'Линк'], 2)).trim();
            const rawDate = pick(row, ['Дата', 'Date'], 3);
            const status = normalize(pick(row, ['Статус', 'Status']));
            if (!title || !rawDate) return;
            const date = parseDate(rawDate);
            const image = isImageUrl(url) ? imageUrl(url) : '';
            const link = url && !image ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">Виж повече</a>` : '';
            const html = `
                <article class="event">
                    <div class="event-media${image ? '' : ' is-missing'}">
                        ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" loading="lazy">` : placeholder('event')}
                    </div>
                    <div class="event-body">
                        <span class="event-date">${escapeHtml(formatDate(date, String(rawDate)))}</span>
                        <h3>${escapeHtml(title)}</h3>
                        <p>${escapeHtml(description)}</p>
                        ${link}
                    </div>
                </article>`;
            const isPast = status ? status === 'past' : (date && date < new Date());
            (isPast ? past : upcoming).push(html);
        });

        const fill = (key, items) => {
            const group = section.querySelector(`[data-events-group="${key}"]`);
            if (!group) return;
            group.hidden = !items.length;
            group.querySelector('.event-row').innerHTML = items.join('');
        };
        fill('upcoming', upcoming);
        fill('past', past);
        section.hidden = !(upcoming.length || past.length);
        observeReveal(section);
    } catch (error) {
        console.error(error);
    }
}

/* Price list image: "Pricing" sheet, column "Ценоразпис".
   Google returns the first sheet when a name does not exist, so the column is checked first. */
async function loadPriceList() {
    const figure = document.querySelector('[data-price-list]');
    if (!figure) return;
    try {
        const rows = await fetchSheet('Pricing');
        if (!rows.length || !rows[0].headers.includes(normalize('Ценоразпис'))) return;
        const url = rows.map((row) => String(row.byHeader[normalize('Ценоразпис')] || '').trim()).find(isImageUrl);
        if (!url) return;
        figure.querySelector('img').src = imageUrl(url, 'w1400');
        figure.querySelector('a').href = imageUrl(url, 'w2400');
    } catch (error) {
        console.warn('Price list from the sheet is not available; showing the local copy.', error);
    }
}

/* ---------- Gallery with categories and lightbox ---------- */
const CATEGORY_PATTERNS = {
    workshops: /работилни|workshop/,
    activities: /занимани|activit/,
    events: /събити|event/,
    interior: /интериор|interior/,
};

const categoryOf = (value) => {
    const text = normalize(value);
    const match = Object.entries(CATEGORY_PATTERNS).find(([, pattern]) => pattern.test(text));
    return match ? match[0] : '';
};

async function loadGallery() {
    const grid = document.querySelector('[data-gallery]');
    if (!grid) return;

    let items = [];
    let visible = [];
    const render = (filter) => {
        visible = filter === 'all' ? items : items.filter((item) => item.category === filter);
        grid.innerHTML = visible.length
            ? visible.map((item, i) => `
                <figure class="tile" style="--i:${Math.min(i, 12)}">
                    <button type="button" data-index="${i}" aria-label="Уголеми снимка ${i + 1} от ${visible.length}">
                        <img src="${escapeHtml(imageUrl(item.url))}" alt="${escapeHtml(item.alt)}" loading="lazy">
                    </button>
                </figure>`).join('')
            : '<p class="loading-note">Все още няма снимки в тази категория.</p>';
    };

    try {
        const rows = await fetchSheet('Gallery');
        items = rows.map((row) => ({
            url: String(pick(row, ['URL', 'Снимка', 'Линк'], 0)).trim(),
            alt: String(pick(row, ['Описание', 'Alt']) || 'Снимка от SI BEBE').trim(),
            category: categoryOf(pick(row, ['Категория', 'Category'])),
        })).filter((item) => item.url && !isDriveFolder(item.url));
        render('all');
    } catch (error) {
        console.error(error);
        grid.innerHTML = '<p class="loading-note">Снимките не могат да бъдат заредени в момента.</p>';
        return;
    }

    document.querySelectorAll('[data-filter]').forEach((button) => {
        button.addEventListener('click', () => {
            document.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
            render(button.dataset.filter);
        });
    });

    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.hidden = true;
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Снимка от галерията');
    lightbox.innerHTML = `
        <button type="button" class="lb-btn lb-close" aria-label="Затвори">${ICONS.close}</button>
        <button type="button" class="lb-btn lb-prev" aria-label="Предишна снимка">${ICONS.prev}</button>
        <figure><img alt=""><figcaption aria-live="polite"></figcaption></figure>
        <button type="button" class="lb-btn lb-next" aria-label="Следваща снимка">${ICONS.next}</button>`;
    document.body.appendChild(lightbox);

    const img = lightbox.querySelector('img');
    const caption = lightbox.querySelector('figcaption');
    const closeBtn = lightbox.querySelector('.lb-close');
    let current = 0;
    let opener = null;
    let touchX = null;

    const show = (index) => {
        if (!visible.length) return;
        current = (index + visible.length) % visible.length;
        img.src = imageUrl(visible[current].url, 'w2000');
        img.alt = visible[current].alt;
        caption.textContent = `${current + 1} / ${visible.length}`;
        lightbox.classList.toggle('is-single', visible.length === 1);
    };
    const open = (index, trigger) => {
        opener = trigger;
        show(index);
        lightbox.hidden = false;
        document.body.classList.add('no-scroll');
        closeBtn.focus();
    };
    const close = () => {
        lightbox.hidden = true;
        document.body.classList.remove('no-scroll');
        if (opener && document.body.contains(opener)) opener.focus();
    };

    grid.addEventListener('click', (event) => {
        const trigger = event.target.closest('[data-index]');
        if (trigger) open(Number(trigger.dataset.index), trigger);
    });
    lightbox.querySelector('.lb-prev').addEventListener('click', () => show(current - 1));
    lightbox.querySelector('.lb-next').addEventListener('click', () => show(current + 1));
    closeBtn.addEventListener('click', close);
    lightbox.addEventListener('click', (event) => { if (event.target === lightbox) close(); });
    document.addEventListener('keydown', (event) => {
        if (lightbox.hidden) return;
        if (event.key === 'Escape') close();
        if (event.key === 'ArrowLeft') show(current - 1);
        if (event.key === 'ArrowRight') show(current + 1);
    });
    lightbox.addEventListener('touchstart', (event) => { touchX = event.touches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', (event) => {
        if (touchX === null) return;
        const dx = event.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 40) show(current + (dx < 0 ? 1 : -1));
        touchX = null;
    });
}

/* ---------- Site-styled dropdown ---------- */
let closeOpenSelect = null;

function enhanceSelect(select) {
    const id = select.id;
    const wrapper = document.createElement('div');
    wrapper.className = 'select';
    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);
    select.classList.add('select-native');
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'select-button';
    button.id = `${id}-button`;
    button.setAttribute('aria-haspopup', 'listbox');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', `${id}-list`);
    button.innerHTML = `<span class="select-value" id="${id}-value"></span>${ICONS.chevron}`;

    const label = document.querySelector(`label[for="${id}"]`);
    if (label) {
        label.id = label.id || `${id}-label`;
        label.htmlFor = button.id;
        button.setAttribute('aria-labelledby', `${label.id} ${id}-value`);
    }

    const list = document.createElement('ul');
    list.className = 'select-list';
    list.id = `${id}-list`;
    list.setAttribute('role', 'listbox');
    list.tabIndex = -1;
    list.hidden = true;
    if (label) list.setAttribute('aria-labelledby', label.id);

    const options = Array.from(select.options).filter((option) => option.value);
    const items = options.map((option, i) => {
        const li = document.createElement('li');
        li.id = `${id}-option-${i}`;
        li.setAttribute('role', 'option');
        li.dataset.value = option.value;
        li.textContent = option.textContent;
        list.appendChild(li);
        return li;
    });
    wrapper.append(button, list);

    const valueEl = button.querySelector('.select-value');
    let active = -1;

    const render = () => {
        const selected = select.selectedOptions[0];
        valueEl.textContent = selected ? selected.textContent : '';
        wrapper.classList.toggle('is-placeholder', !select.value);
        items.forEach((li) => li.setAttribute('aria-selected', String(li.dataset.value === select.value)));
    };
    const setActive = (i) => {
        active = Math.max(0, Math.min(items.length - 1, i));
        items.forEach((li, j) => li.classList.toggle('is-active', j === active));
        list.setAttribute('aria-activedescendant', items[active].id);
    };
    const close = (focus) => {
        if (list.hidden) return;
        list.hidden = true;
        wrapper.classList.remove('is-open');
        button.setAttribute('aria-expanded', 'false');
        if (closeOpenSelect === close) closeOpenSelect = null;
        if (focus) button.focus();
    };
    const open = () => {
        if (closeOpenSelect) closeOpenSelect(false);
        list.hidden = false;
        wrapper.classList.add('is-open');
        button.setAttribute('aria-expanded', 'true');
        closeOpenSelect = close;
        const selected = items.findIndex((li) => li.dataset.value === select.value);
        setActive(selected >= 0 ? selected : 0);
        list.focus();
    };
    const choose = (i) => {
        select.value = items[i].dataset.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        render();
        close(true);
    };

    button.addEventListener('click', () => (list.hidden ? open() : close(true)));
    button.addEventListener('keydown', (event) => {
        if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) { event.preventDefault(); open(); }
    });
    list.addEventListener('keydown', (event) => {
        const keys = { ArrowDown: () => setActive(active + 1), ArrowUp: () => setActive(active - 1), Home: () => setActive(0), End: () => setActive(items.length - 1), Enter: () => choose(active), ' ': () => choose(active), Escape: () => close(true) };
        if (keys[event.key]) { event.preventDefault(); keys[event.key](); }
        if (event.key === 'Tab') close(false);
    });
    items.forEach((li, i) => {
        li.addEventListener('click', () => choose(i));
        li.addEventListener('mousemove', () => { if (active !== i) setActive(i); });
    });
    select.form?.addEventListener('reset', () => setTimeout(render));
    render();
}

document.addEventListener('click', (event) => {
    if (closeOpenSelect && !event.target.closest('.select')) closeOpenSelect(false);
});

/* ---------- Forms ---------- */
const MESSAGES = {
    required: 'Моля, попълнете това поле.',
    select: 'Моля, изберете от списъка.',
    email: 'Моля, въведете валиден имейл адрес.',
};

const fieldMessage = (field) => {
    if (field.validity.valueMissing) return field.tagName === 'SELECT' ? MESSAGES.select : MESSAGES.required;
    if (field.validity.typeMismatch) return MESSAGES.email;
    return '';
};

function validateField(container) {
    const fields = Array.from(container.querySelectorAll('input, select'));
    let message = '';
    fields.forEach((field) => {
        const msg = fieldMessage(field);
        field.classList.toggle('is-invalid', Boolean(msg));
        field.setAttribute('aria-invalid', String(Boolean(msg)));
        field.closest('.select')?.classList.toggle('is-invalid', Boolean(msg));
        if (msg && !message) message = msg;
    });
    let error = container.querySelector(':scope > .field-error');
    if (message) {
        if (!error) {
            error = document.createElement('p');
            error.className = 'field-error';
            error.id = `err-${Math.random().toString(36).slice(2, 8)}`;
            container.appendChild(error);
        }
        error.textContent = message;
        fields.forEach((field) => field.setAttribute('aria-describedby', error.id));
    } else if (error) {
        error.remove();
        fields.forEach((field) => field.removeAttribute('aria-describedby'));
    }
    container.classList.toggle('has-error', Boolean(message));
    return !message;
}

function showStatus(form, state, message) {
    let status = form.querySelector('.form-status');
    if (!status) {
        status = document.createElement('p');
        status.className = 'form-status';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        form.appendChild(status);
    }
    status.dataset.state = state;
    status.textContent = message;
    status.hidden = false;
}

function initForm(form) {
    form.querySelectorAll('select').forEach(enhanceSelect);

    form.addEventListener('input', (event) => {
        const container = event.target.closest('.field');
        if (container?.classList.contains('has-error')) validateField(container);
        form.querySelector('.form-status')?.setAttribute('hidden', '');
    });
    form.addEventListener('change', (event) => {
        const container = event.target.closest('.field');
        if (container?.classList.contains('has-error')) validateField(container);
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const invalid = Array.from(form.querySelectorAll('.field')).filter((container) => !validateField(container));
        if (invalid.length) {
            const first = invalid[0].querySelector('.is-invalid');
            (first?.closest('.select')?.querySelector('.select-button') || first)?.focus();
            return;
        }

        const submit = form.querySelector('[type="submit"]');
        submit.disabled = true;
        const data = new FormData(form);
        data.append('sheet', form.dataset.sheet);
        data.append('submitted_at', new Date().toISOString());
        if (form.dataset.sheet === 'Partners') {
            data.append('full_name', [data.get('first_name'), data.get('last_name')].filter(Boolean).join(' '));
        }

        try {
            await fetch(APPS_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: data });
            form.reset();
            showStatus(form, 'success', 'Благодарим Ви! Ще се свържем с Вас скоро.');
        } catch (error) {
            console.error(error);
            showStatus(form, 'error', 'Възникна грешка. Моля, опитайте отново.');
        } finally {
            submit.disabled = false;
        }
    });
}

/* ---------- Copy contacts ---------- */
function initCopy() {
    document.querySelectorAll('[data-copy]').forEach((button) => {
        button.addEventListener('click', async () => {
            const value = button.dataset.copy;
            try {
                await navigator.clipboard.writeText(value);
            } catch (error) {
                return;
            }
            const original = button.textContent;
            button.textContent = 'Копирано';
            setTimeout(() => { button.textContent = original; }, 1200);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    splitWords();
    initMenu();
    initScrollEffects();
    observeReveal();
    addStars();
    document.querySelectorAll('[data-count]').forEach(countUp);
    initCopy();
    document.querySelectorAll('form[data-sheet]').forEach(initForm);
    loadReviews();
    loadEvents();
    loadGallery();
    loadPriceList();
});
