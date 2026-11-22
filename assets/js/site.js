/* Sí bebé v2: menu, motion, content from the site API, gallery, forms. */

// Content and forms are served by the site's own PHP API (api/content.php, api/submit.php)
const API = 'api/';

const ICONS = {
    star: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5L2.5 9.3l6.6-.8z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    photo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="15" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M21 17l-5-5-8 8"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5M8 7h8M8 11h6"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
};

const MONTHS = ['януари', 'февруари', 'март', 'април', 'май', 'юни', 'юли', 'август', 'септември', 'октомври', 'ноември', 'декември'];

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
    // Close the menu only for links within this page; for another page the new page simply replaces it,
    // so the closing animation is never frozen half-way while the browser switches pages
    header.querySelectorAll('.nav a').forEach((link) => link.addEventListener('click', () => {
        const target = new URL(link.href, location.href);
        if (target.pathname === location.pathname) setOpen(false);
    }));
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && header.classList.contains('nav-open')) { setOpen(false); toggle.focus(); }
    });
    window.addEventListener('resize', () => {
        if (!header.classList.contains('nav-open')) return;
        if (window.innerWidth > 1240) setOpen(false); else setTop();
    });

    // On desktop the menu also opens on hover, so the arrow must be able to close it too
    const hoverMenu = window.matchMedia('(hover: hover) and (min-width: 1181px)');
    document.querySelectorAll('.sub-toggle').forEach((button) => {
        const item = button.closest('.has-sub');
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const shown = item.classList.contains('is-open') || (hoverMenu.matches && !item.classList.contains('is-closed'));
            item.classList.toggle('is-open', !shown);
            item.classList.toggle('is-closed', shown);
            button.setAttribute('aria-expanded', String(!shown));
        });
        item.addEventListener('mouseleave', () => {
            if (!hoverMenu.matches) return;
            if (item.contains(document.activeElement)) document.activeElement.blur();
            item.classList.remove('is-closed', 'is-open');
            button.setAttribute('aria-expanded', 'false');
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
    const fold = window.innerHeight;
    const mark = (el, kind) => {
        if (el.hasAttribute('data-reveal') || el.closest('.hero, .page-intro')) return;
        // Already on screen when the page opens: leave it visible (hiding it now would make it blink)
        if (el.getBoundingClientRect().top < fold) return;
        el.setAttribute('data-reveal', kind);
        // Stagger siblings that enter together
        const siblings = Array.from(el.parentElement.children).filter((c) => c.hasAttribute('data-reveal'));
        el.style.setProperty('--delay', `${Math.min(siblings.indexOf(el), 6) * 0.09}s`);
        revealObserver.observe(el);
    };
    REVEAL.forEach(([selector, kind]) => root.querySelectorAll(selector).forEach((el) => mark(el, kind)));
    // Card rows appear as one piece: cards off to the side would otherwise stay hidden
    if (root.matches?.('.reviews, .event-row')) mark(root, '');
    root.querySelectorAll('.event-row').forEach((el) => mark(el, ''));
}

function addStars() {
    document.querySelectorAll('[data-stars], .footer-stars').forEach((host) => {
        const layer = host.classList.contains('footer-stars') ? host : document.createElement('div');
        if (layer !== host) { layer.className = 'stars-layer'; host.prepend(layer); }
        // Three groups that fade on their own beat: looks random, costs three animations instead of dozens
        const groups = [['3.1s', '0s'], ['4.3s', '-1.6s'], ['2.6s', '-3.2s']].map(([t, d]) => {
            const group = document.createElement('div');
            group.className = 'star-group';
            group.style.cssText = `--t:${t};--d:${d}`;
            layer.appendChild(group);
            return group;
        });
        const count = window.innerWidth < 640 ? 15 : 24;
        for (let i = 0; i < count; i += 1) {
            const star = document.createElement('i');
            star.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;--z:${(Math.random() * 2.4 + 1.6).toFixed(1)}px`;
            groups[i % 3].appendChild(star);
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

/* ---------- Content from the site's own database ---------- */
async function fetchContent(type) {
    const response = await fetch(`${API}content.php?type=${encodeURIComponent(type)}`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Content request failed: ${response.status}`);
    return response.json();
}

const PLACEHOLDERS = { event: [ICONS.calendar, 'Събитие в Sí bebé'], article: [ICONS.book, 'Статия от Sí bebé'], photo: [ICONS.photo, 'Снимката не е налична'] };
const placeholder = (type) => {
    const [svg, text] = PLACEHOLDERS[type] || PLACEHOLDERS.photo;
    return `<div class="placeholder">${svg}<span>${text}</span></div>`;
};

document.addEventListener('error', (event) => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement)) return;
    const box = img.closest('.event-media, .tile');
    if (!box || box.classList.contains('is-missing')) return;
    box.classList.add('is-missing');
    box.insertAdjacentHTML('beforeend', placeholder(box.classList.contains('tile') ? 'photo' : box.closest('.article') ? 'article' : 'event'));
}, true);

/* Reviews */
async function loadReviews() {
    const box = document.querySelector('[data-reviews]');
    if (!box) return;
    try {
        const reviews = (await fetchContent('reviews')).map((review) => ({
            author: String(review.author || '').trim(),
            text: String(review.text || '').trim(),
            stars: Math.min(Math.max(parseInt(review.stars, 10) || 5, 1), 5),
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
        initCardRow(box, '.review', 'отзиви');
        clampCards(box, '.review > p');
    } catch (error) {
        console.error(error);
        box.innerHTML = '<p class="loading-note">Отзивите не могат да бъдат заредени в момента.</p>';
    }
}

/* Long review texts and event descriptions are cut to a few lines; "Прочети още" opens the whole
   card in a window, so one long text never stretches every card in the row */
let cardDialog = null;

function openCard(card) {
    if (!cardDialog) {
        cardDialog = document.createElement('dialog');
        cardDialog.className = 'policy-dialog card-dialog';
        cardDialog.setAttribute('aria-labelledby', 'card-dialog-title');
        cardDialog.innerHTML = `
            <div class="policy-head">
                <div class="card-dialog-head">
                    <img class="card-dialog-face" alt="" hidden>
                    <div><div class="card-dialog-meta"></div><h2 id="card-dialog-title"></h2><div class="card-dialog-role"></div></div>
                </div>
                <button type="button" class="policy-close" aria-label="Затвори">${ICONS.close}</button>
            </div>
            <div class="policy-body" tabindex="-1">
                <img class="card-dialog-img" alt="" hidden>
                <p></p>
                <div class="card-dialog-link"></div>
            </div>`;
        document.body.appendChild(cardDialog);
        const close = () => cardDialog.close();
        cardDialog.querySelector('.policy-close').addEventListener('click', close);
        cardDialog.addEventListener('click', (event) => { if (event.target === cardDialog) close(); });
        cardDialog.addEventListener('close', () => document.body.classList.remove('no-scroll'));
    }
    const meta = card.querySelector('.stars, .event-date');
    const role = card.querySelector('.person-role');
    cardDialog.querySelector('.card-dialog-role').replaceChildren(...(role ? [role.cloneNode(true)] : []));
    const face = cardDialog.querySelector('.card-dialog-face');
    const photo = card.querySelector('.person-photo img');
    face.hidden = !photo;
    if (photo) face.src = photo.currentSrc || photo.src;
    cardDialog.querySelector('.card-dialog-meta').replaceChildren(...(meta ? [meta.cloneNode(true)] : []));
    cardDialog.querySelector('h2').textContent = card.querySelector('h3').textContent;
    cardDialog.querySelector('.policy-body p').textContent = card.querySelector('.review > p, .event-body > p, .person-bio').textContent;
    const img = cardDialog.querySelector('.card-dialog-img');
    const source = card.querySelector('.event-media img');
    img.hidden = !source;
    if (source) img.src = source.currentSrc || source.src;
    const link = card.querySelector('.event-body > a');
    cardDialog.querySelector('.card-dialog-link').replaceChildren(...(link ? [link.cloneNode(true)] : []));
    cardDialog.showModal();
    document.body.classList.add('no-scroll');
    const body = cardDialog.querySelector('.policy-body');
    body.scrollTop = 0;
    body.focus({ preventScroll: true });
}

function clampCards(box, textSelector) {
    const canOpen = typeof HTMLDialogElement === 'function';
    const check = () => box.querySelectorAll(textSelector).forEach((text) => {
        let more = text.nextElementSibling?.matches('.card-more') ? text.nextElementSibling : null;
        if (more?.getAttribute('aria-expanded') === 'true') return;
        text.classList.add('is-clamped');
        const long = text.scrollHeight > text.clientHeight + 2;
        text.classList.toggle('is-clamped', long);
        if (long && !more) {
            more = document.createElement('button');
            more.type = 'button';
            more.className = 'card-more';
            more.textContent = 'Прочети още';
            if (!canOpen) more.setAttribute('aria-expanded', 'false');
            more.addEventListener('click', () => {
                if (canOpen) return openCard(text.closest('.review, .event, .person'));
                const open = more.getAttribute('aria-expanded') !== 'true';
                more.setAttribute('aria-expanded', String(open));
                more.textContent = open ? 'Скрий' : 'Прочети още';
                text.classList.toggle('is-clamped', !open);
            });
            text.after(more);
        } else if (!long && more) {
            more.remove();
        }
    });
    // Re-check whenever the row changes size: window resize, fonts loading, or a hidden section being shown
    let timer;
    const later = () => { clearTimeout(timer); timer = setTimeout(check, 100); };
    if ('ResizeObserver' in window) new ResizeObserver(later).observe(box);
    else window.addEventListener('resize', later);
    check();
    document.fonts?.ready.then(check);
}

/* Cards stay on one row; arrows appear only when they do not all fit */
function initCardRow(box, cardSelector, label) {
    if (box.parentElement.classList.contains('card-row-wrap')) return;
    const wrap = document.createElement('div');
    wrap.className = 'card-row-wrap';
    box.before(wrap);
    wrap.append(box);
    const nav = document.createElement('div');
    nav.className = 'card-row-nav';
    nav.innerHTML = `<button type="button" aria-label="Предишни ${label}">${ICONS.prev}</button><button type="button" aria-label="Следващи ${label}">${ICONS.next}</button>`;
    wrap.append(nav);
    const [prev, next] = nav.querySelectorAll('button');
    const step = () => {
        const card = box.querySelector(cardSelector);
        return card ? card.offsetWidth + parseFloat(getComputedStyle(box).columnGap || 0) : box.clientWidth;
    };
    const update = () => {
        const max = box.scrollWidth - box.clientWidth;
        nav.hidden = max <= 2;
        prev.disabled = box.scrollLeft <= 2;
        next.disabled = box.scrollLeft >= max - 2;
    };
    prev.addEventListener('click', () => box.scrollBy({ left: -step() }));
    next.addEventListener('click', () => box.scrollBy({ left: step() }));
    box.addEventListener('scroll', update, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(update).observe(box);
    else window.addEventListener('resize', update);
    update();
}

/* Team on the About page: shown only when the admin has added people */
async function loadTeam() {
    const block = document.querySelector('[data-team]');
    if (!block) return;
    try {
        const people = (await fetchContent('team')).filter((person) => person.name);
        if (!people.length) return;
        const initial = (name) => escapeHtml(name.trim().charAt(0).toUpperCase());
        block.querySelector('[data-team-list]').innerHTML = people.map((person) => `
            <article class="person">
                <div class="person-photo">${person.photo
                    ? `<img src="${escapeHtml(person.photo)}" alt="${escapeHtml(person.name)}" loading="lazy" width="320" height="320">`
                    : `<span aria-hidden="true">${initial(person.name)}</span>`}</div>
                <h3>${escapeHtml(person.name)}</h3>
                ${person.role ? `<p class="person-role">${escapeHtml(person.role)}</p>` : ''}
                ${person.bio ? `<p class="person-bio">${escapeHtml(person.bio)}</p>` : ''}
            </article>`).join('');
        block.hidden = false;
        observeReveal(block);
        const list = block.querySelector('[data-team-list]');
        initCardRow(list, '.person', 'хора от екипа');
        clampCards(list, '.person-bio');
    } catch (error) {
        console.error(error);
    }
}

/* Events */
const formatDate = (date) => {
    const time = date.getHours() || date.getMinutes()
        ? `, ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} ч.`
        : '';
    return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()} г.${time}`;
};

async function loadEvents() {
    const section = document.querySelector('[data-events-section]');
    if (!section) return;
    try {
        const upcoming = [];
        const past = [];
        (await fetchContent('events')).forEach((event) => {
            const title = String(event.title || '').trim();
            if (!title || !event.date) return;
            const date = new Date(event.date);
            const description = String(event.description || '').trim();
            const image = event.image || '';
            const link = event.link ? `<a href="${escapeHtml(event.link)}" target="_blank" rel="noopener">Виж повече</a>` : '';
            const html = `
                <article class="event">
                    <div class="event-media${image ? '' : ' is-missing'}">
                        ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" loading="lazy">` : placeholder('event')}
                    </div>
                    <div class="event-body">
                        <span class="event-date">${escapeHtml(formatDate(date))}</span>
                        <h3>${escapeHtml(title)}</h3>
                        <p>${escapeHtml(description)}</p>
                        ${link}
                    </div>
                </article>`;
            (event.past ? past : upcoming).push(html);
        });

        const fill = (key, items) => {
            const group = section.querySelector(`[data-events-group="${key}"]`);
            if (!group) return;
            group.hidden = !items.length;
            const row = group.querySelector('.event-row');
            row.innerHTML = items.join('');
            if (items.length) {
                initCardRow(row, '.event', 'събития');
                clampCards(row, '.event-body > p');
            }
        };
        fill('upcoming', upcoming.reverse()); // nearest first (the list comes newest first)
        fill('past', past);
        section.hidden = !(upcoming.length || past.length);
        observeReveal(section);
    } catch (error) {
        console.error(error);
    }
}

/* Articles on the Academy page: shown only when the admin has added some */
async function loadArticles() {
    const section = document.querySelector('[data-articles-section]');
    if (!section) return;
    try {
        const articles = (await fetchContent('articles')).filter((article) => String(article.title || '').trim());
        if (!articles.length) return;
        const row = section.querySelector('[data-articles]');
        row.innerHTML = articles.map((article) => {
            const title = String(article.title).trim();
            const link = /^https?:\/\//i.test(article.link || '')
                ? `<a href="${escapeHtml(article.link)}" target="_blank" rel="noopener">Прочети статията</a>` : '';
            return `
                <article class="event article">
                    <div class="event-media${article.image ? '' : ' is-missing'}">
                        ${article.image ? `<img src="${escapeHtml(article.image)}" alt="${escapeHtml(title)}" loading="lazy">` : placeholder('article')}
                    </div>
                    <div class="event-body">
                        <h3>${escapeHtml(title)}</h3>
                        <p>${escapeHtml(String(article.description || '').trim())}</p>
                        ${link}
                    </div>
                </article>`;
        }).join('');
        section.hidden = false;
        initCardRow(row, '.event', 'статии');
        clampCards(row, '.event-body > p');
        observeReveal(section);
    } catch (error) {
        console.error(error);
    }
}

/* ---------- Gallery with categories and lightbox ---------- */
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
                        <img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.alt)}" loading="lazy">
                    </button>
                </figure>`).join('')
            : '<p class="loading-note">Все още няма снимки в тази категория.</p>';
    };

    try {
        // Categories come from the admin panel; only those with photos get a button
        const [photos, categories] = await Promise.all([fetchContent('gallery'), fetchContent('categories').catch(() => [])]);
        const used = new Set(photos.map((item) => item.category).filter(Boolean));
        const filters = document.querySelector('[data-gallery-filters]');
        if (filters) {
            filters.insertAdjacentHTML('beforeend', categories.filter((cat) => used.has(cat.key)).map((cat) =>
                `<button type="button" class="filter" data-filter="${escapeHtml(cat.key)}" aria-pressed="false">${escapeHtml(cat.label)}</button>`).join(''));
            filters.hidden = filters.querySelectorAll('[data-filter]').length < 2;
        }
        items = photos.map((item) => ({
            url: String(item.url || '').trim(),
            alt: String(item.alt || 'Снимка от Sí bebé').trim(),
            category: item.category || '',
        })).filter((item) => item.url);
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
        img.src = visible[current].url;
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
    consent: 'Моля, потвърдете, че сте се запознали с Политиката за поверителност.',
};

const fieldMessage = (field) => {
    if (field.type === 'checkbox' && field.validity.valueMissing) return MESSAGES.consent;
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
        submit.classList.add('is-loading');
        const data = new FormData(form);
        data.append('form', form.dataset.form);

        try {
            const response = await fetch(`${API}submit.php`, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.ok) {
                // Mark the fields the server did not accept, e.g. a mistyped e-mail
                (result.fields || []).forEach((name) => {
                    const input = form.querySelector(`[name="${CSS.escape(name)}"]`);
                    input?.classList.add('is-invalid');
                    input?.closest('.field')?.classList.add('has-error');
                });
                throw new Error(result.error || `Submit failed: ${response.status}`);
            }
            form.reset();
            form.querySelector('.form-status')?.setAttribute('hidden', '');
            showFormSuccess(form, 'Благодарим Ви! Ще се свържем с Вас скоро.');
        } catch (error) {
            console.error(error);
            const known = /[А-Яа-я]/.test(error.message) ? error.message : 'Възникна грешка. Моля, опитайте отново или ни се обадете.';
            showStatus(form, 'error', known);
            shakeButton(submit);
        } finally {
            submit.disabled = false;
            submit.classList.remove('is-loading');
        }
    });
}

/* ---------- Submit animation: spinner on the button, then a success panel ---------- */
function showFormSuccess(form, message) {
    const host = form.parentElement;
    host.querySelector('.form-success')?.remove();
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    const panel = document.createElement('div');
    panel.className = 'form-success';
    panel.setAttribute('role', 'status');
    panel.setAttribute('aria-live', 'polite');
    const confetti = Array.from({ length: 12 }, (_, i) => `<i style="--a:${i * 30}deg;--c:${i % 4}"></i>`).join('');
    panel.innerHTML = `
        <div class="form-success-icon">
            <span class="form-success-confetti" aria-hidden="true">${confetti}</span>
            <svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="23"/><path d="M15.5 27l7 7 14-15"/></svg>
        </div>
        <p></p>
        <button type="button" class="btn">Добре</button>`;
    panel.querySelector('p').textContent = message;
    host.appendChild(panel);
    const close = () => {
        if (!panel.isConnected) return;
        panel.classList.add('is-leaving');
        setTimeout(() => panel.remove(), 400);
    };
    panel.querySelector('button').addEventListener('click', close);
    panel.querySelector('button').focus({ preventScroll: true });
    setTimeout(close, 8000);
}

function shakeButton(button) {
    if (!button) return;
    button.classList.remove('is-error');
    void button.offsetWidth;
    button.classList.add('is-error');
}

/* Own confirm dialog for the editor (instead of the browser's) */
let askBox = null;
function ask(message) {
    return new Promise((resolve) => {
        if (!askBox) {
            askBox = document.createElement('div');
            askBox.className = 'edit-ask';
            askBox.innerHTML = `<div class="edit-ask-card" role="alertdialog" aria-modal="true" aria-labelledby="edit-ask-text">
                <p id="edit-ask-text"></p>
                <div class="edit-ask-actions"><button type="button" class="btn btn--ghost" data-ask="no">Отказ</button><button type="button" class="btn" data-ask="yes">Да</button></div>
            </div>`;
            document.body.appendChild(askBox);
        }
        askBox.querySelector('p').textContent = message;
        const yes = askBox.querySelector('[data-ask="yes"]');
        const no = askBox.querySelector('[data-ask="no"]');
        const done = (answer) => {
            askBox.classList.remove('is-open');
            document.removeEventListener('keydown', onKey, true);
            resolve(answer);
        };
        const onKey = (event) => {
            if (event.key === 'Escape') { event.preventDefault(); done(false); }
            if (event.key === 'Tab') { event.preventDefault(); (document.activeElement === yes ? no : yes).focus(); }
        };
        yes.onclick = () => done(true);
        no.onclick = () => done(false);
        askBox.onclick = (event) => { if (event.target === askBox) done(false); };
        document.addEventListener('keydown', onKey, true);
        askBox.classList.add('is-open');
        yes.focus();
    });
}

/* ---------- On-page editor for photos and texts (only for a logged-in admin) ---------- */
async function initEditor() {
    if (!document.cookie.split('; ').includes('sibebe_editor=1')) return;
    let state;
    try {
        state = await (await fetch(`${API}edit.php`, { headers: { Accept: 'application/json' } })).json();
    } catch (error) {
        return;
    }
    if (!state || !state.editor) return;

    const root = document.documentElement;
    root.classList.add('is-editing');
    const slotOf = (img) => {
        const match = (img.getAttribute('src') || '').match(/(?:^|\/)media\/([\w-]+)\.(?:webp|jpg)/);
        return match && state.slots[match[1]] ? match[1] : null;
    };

    const bar = document.createElement('div');
    bar.className = 'edit-bar';
    bar.innerHTML = `
        <span class="edit-bar-dot" aria-hidden="true"></span>
        <span class="edit-bar-text"><b>Режим на редакция</b><span> Кликнете върху текст, за да го промените, или посочете снимка.</span></span>
        <button type="button" data-edit-toggle aria-pressed="false">Скрий бутоните</button>
        <a href="admin/">Админ панел</a>`;
    document.body.appendChild(bar);
    bar.querySelector('[data-edit-toggle]').addEventListener('click', (event) => {
        const hidden = root.classList.toggle('edit-hidden');
        event.currentTarget.textContent = hidden ? 'Покажи бутоните' : 'Скрий бутоните';
        event.currentTarget.setAttribute('aria-pressed', String(hidden));
    });

    const toast = document.createElement('div');
    toast.className = 'edit-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
    let toastTimer = null;
    const say = (message, isError = false) => {
        toast.textContent = message;
        toast.classList.toggle('is-error', isError);
        toast.classList.add('is-on');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('is-on'), 3200);
    };

    const picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = 'image/jpeg,image/png,image/webp';
    picker.hidden = true;
    document.body.appendChild(picker);
    let pending = null;

    document.querySelectorAll('img').forEach((img) => {
        const slot = slotOf(img);
        if (!slot) return;
        const host = img.parentElement;
        host.classList.add('edit-host');
        const tools = document.createElement('div');
        tools.className = 'edit-tools';
        tools.dataset.slot = slot;
        tools.innerHTML = `
            <button type="button" class="edit-btn" data-action="change" title="${escapeHtml(state.slots[slot].label)}">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg><span>Смени</span>
            </button>
            <button type="button" class="edit-btn edit-btn--ghost" data-action="undo"${state.slots[slot].prev ? '' : ' hidden'} title="Върни предишната снимка"><span>Предишната</span></button>
            <button type="button" class="edit-btn edit-btn--ghost" data-action="reset"${state.slots[slot].changed ? '' : ' hidden'} title="Върни оригиналната снимка"><span>Оригинала</span></button>`;
        host.appendChild(tools);
    });

    const send = async (slot, action, file) => {
        const groups = document.querySelectorAll(`.edit-tools[data-slot="${slot}"]`);
        groups.forEach((group) => group.classList.add('is-busy'));
        const data = new FormData();
        data.append('csrf', state.csrf);
        data.append('slot', slot);
        data.append('action', action);
        if (file) data.append('image', file);
        try {
            const response = await fetch(`${API}edit.php`, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.ok) throw new Error(result.error || 'Снимката не беше запазена.');
            document.querySelectorAll('img').forEach((img) => { if (slotOf(img) === slot) img.src = result.url; });
            document.querySelectorAll(`a[href^="${state.slots[slot].file}"]`).forEach((link) => { link.href = result.url; });
            state.slots[slot].changed = result.changed;
            state.slots[slot].prev = result.prev;
            groups.forEach((group) => {
                group.querySelector('[data-action="reset"]').hidden = !result.changed;
                group.querySelector('[data-action="undo"]').hidden = !result.prev;
            });
            say({ reset: 'Върната е оригиналната снимка.', undo: 'Върната е предишната снимка.' }[action] || 'Снимката е запазена.');
        } catch (error) {
            say(error.message, true);
        } finally {
            groups.forEach((group) => group.classList.remove('is-busy'));
        }
    };

    // Capture phase: the logo and the price list sit inside links
    document.addEventListener('click', (event) => {
        const button = event.target.closest('.edit-tools button');
        if (!button) return;
        event.preventDefault();
        event.stopPropagation();
        const slot = button.closest('.edit-tools').dataset.slot;
        if (button.dataset.action === 'change') {
            pending = slot;
            picker.click();
        } else if (button.dataset.action === 'undo') {
            send(slot, 'undo');
        } else {
            ask('Да върна ли оригиналната снимка?').then((yes) => { if (yes) send(slot, 'reset'); });
        }
    }, true);
    picker.addEventListener('change', () => {
        if (picker.files[0] && pending) send(pending, 'change', picker.files[0]);
        picker.value = '';
    });

    initTextEditor(state, say);
}

/* 0879 919 779 -> +359879919779, the same rule as the server */
const phoneHref = (text) => {
    let digits = text.replace(/[^\d+]/g, '');
    if (digits.startsWith('00')) digits = `+${digits.slice(2)}`;
    else if (digits.startsWith('0')) digits = `+359${digits.slice(1)}`;
    return digits;
};

/* Texts: click a highlighted text, type, then Save. Same text on other pages changes with it. */
function initTextEditor(state, say) {
    const root = document.documentElement;
    const changed = new Set(state.texts || []);
    const withPrev = new Set(state.textPrev || []);
    const nodes = (key) => document.querySelectorAll(`[data-edit="${key}"]`);
    document.querySelectorAll('[data-edit]').forEach((el) => el.classList.add('edit-text'));

    const bar = document.createElement('div');
    bar.className = 'edit-textbar';
    bar.hidden = true;
    bar.innerHTML = `
        <button type="button" class="edit-btn" data-text="save">Запази</button>
        <button type="button" class="edit-btn edit-btn--ghost" data-text="cancel">Отказ</button>
        <button type="button" class="edit-btn edit-btn--ghost" data-text="undo">Предишния</button>
        <button type="button" class="edit-btn edit-btn--ghost" data-text="reset">Оригинала</button>`;
    document.body.appendChild(bar);

    let current = null;
    let before = '';
    const place = () => {
        if (!current) return;
        const box = current.getBoundingClientRect();
        const height = bar.offsetHeight;
        const top = box.top - height - 10 < 8 ? box.bottom + 10 : box.top - height - 10;
        bar.style.top = `${Math.round(top)}px`;
        bar.style.left = `${Math.round(Math.min(Math.max(box.left, 8), window.innerWidth - bar.offsetWidth - 8))}px`;
    };
    const finish = () => {
        current.contentEditable = 'false';
        current.classList.remove('is-text-editing');
        current = null;
        bar.hidden = true;
    };
    const cancel = () => {
        current.innerHTML = before;
        finish();
    };
    const start = async (el) => {
        if (current && current.innerHTML !== before && !(await ask('Да отхвърля ли промените по текста?'))) return;
        if (current) cancel();
        current = el;
        before = el.innerHTML;
        el.contentEditable = 'true';
        el.classList.add('is-text-editing');
        bar.hidden = false;
        bar.querySelector('[data-text="reset"]').hidden = !changed.has(el.dataset.edit);
        bar.querySelector('[data-text="undo"]').hidden = !withPrev.has(el.dataset.edit);
        el.focus({ preventScroll: true });
        place();
        requestAnimationFrame(place);
    };
    const save = async (action) => {
        const el = current;
        const key = el.dataset.edit;
        bar.classList.add('is-busy');
        const data = new FormData();
        data.append('csrf', state.csrf);
        data.append('action', action);
        data.append('key', key);
        data.append('html', el.innerHTML);
        try {
            const response = await fetch(`${API}edit.php`, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.ok) throw new Error(result.error || 'Текстът не беше запазен.');
            finish();
            nodes(key).forEach((node) => {
                node.innerHTML = result.html;
                const text = node.textContent.trim();
                const link = node.closest('a[href^="tel:"], a[href^="mailto:"]');
                if (link && node.dataset.editKind === 'tel') link.href = `tel:${phoneHref(text)}`;
                if (link && node.dataset.editKind === 'email') link.href = `mailto:${text}`;
                const copy = node.closest('[data-copy]');
                if (copy && node.dataset.editKind === 'email') copy.dataset.copy = text;
            });
            if (result.changed) changed.add(key); else changed.delete(key);
            if (result.prev) withPrev.add(key); else withPrev.delete(key);
            say({ text_reset: 'Върнат е оригиналният текст.', text_undo: 'Върнат е предишният текст.' }[action] || 'Текстът е запазен.');
        } catch (error) {
            say(error.message, true);
        } finally {
            bar.classList.remove('is-busy');
        }
    };

    bar.addEventListener('mousedown', (event) => event.preventDefault()); // keep the caret in the text
    bar.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button || !current || bar.classList.contains('is-busy')) return;
        if (button.dataset.text === 'save') save('text_save');
        else if (button.dataset.text === 'cancel') cancel();
        else if (button.dataset.text === 'undo') save('text_undo');
        else ask('Да върна ли оригиналния текст?').then((yes) => { if (yes) save('text_reset'); });
    });

    // Capture phase, so links and "read more" buttons around a text do not fire while editing
    document.addEventListener('click', (event) => {
        if (root.classList.contains('edit-hidden') || event.target.closest('.edit-textbar, .edit-bar, .edit-tools')) return;
        const el = event.target.closest('[data-edit]');
        if (el && el === current) {
            event.preventDefault(); // a label inside a link or button must not open or submit it
            return;
        }
        if (!el) return;
        event.preventDefault();
        event.stopPropagation();
        start(el);
    }, true);

    document.addEventListener('keydown', (event) => {
        if (!current || !current.contains(event.target)) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            cancel();
        } else if (event.key === 'Enter' && event.shiftKey) {
            event.preventDefault();
            document.execCommand('insertLineBreak');
        } else if (event.key === 'Enter') {
            event.preventDefault();
            save('text_save');
        }
    });
    // Pasted text comes in plain, without the formatting of the page it was copied from
    document.addEventListener('paste', (event) => {
        if (!current || !current.contains(event.target)) return;
        event.preventDefault();
        document.execCommand('insertText', false, (event.clipboardData || window.clipboardData).getData('text/plain'));
    });
    window.addEventListener('scroll', place, { passive: true });
    window.addEventListener('resize', place);
    window.addEventListener('beforeunload', (event) => {
        if (current && current.innerHTML !== before) event.preventDefault();
    });
}

/* ---------- Privacy policy in a dialog (keeps what was typed in the form) ---------- */
function initPrivacyDialog() {
    const links = document.querySelectorAll('[data-privacy-dialog]');
    if (!links.length || typeof HTMLDialogElement !== 'function') return;
    let dialog = null;
    let activeCheckbox = null;

    const build = async () => {
        dialog = document.createElement('dialog');
        dialog.className = 'policy-dialog';
        dialog.setAttribute('aria-labelledby', 'policy-title');
        dialog.innerHTML = `
            <div class="policy-head">
                <h2 id="policy-title">Политика за поверителност</h2>
                <button type="button" class="policy-close" aria-label="Затвори">${ICONS.close}</button>
            </div>
            <div class="policy-body legal" tabindex="-1"><p class="loading-note">Зареждане...</p></div>
            <div class="policy-foot">
                <button type="button" class="btn btn--ghost" data-policy-close>Затвори</button>
                <button type="button" class="btn" data-policy-accept>Запознат/а съм</button>
            </div>`;
        document.body.appendChild(dialog);
        const close = () => dialog.close();
        dialog.querySelector('.policy-close').addEventListener('click', close);
        dialog.querySelector('[data-policy-close]').addEventListener('click', close);
        dialog.querySelector('[data-policy-accept]').addEventListener('click', () => {
            if (activeCheckbox) {
                activeCheckbox.checked = true;
                activeCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
            close();
        });
        dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });
        dialog.addEventListener('close', () => document.body.classList.remove('no-scroll'));
        try {
            const response = await fetch('privacy');
            if (!response.ok) throw new Error(`Privacy page: ${response.status}`);
            const article = new DOMParser().parseFromString(await response.text(), 'text/html').querySelector('.legal');
            if (!article) throw new Error('Privacy text not found');
            dialog.querySelector('.policy-body').innerHTML = article.innerHTML;
        } catch (error) {
            dialog.querySelector('.policy-body').innerHTML = '<p><a href="privacy" target="_blank">Отворете политиката в нов раздел</a></p>';
        }
    };

    links.forEach((link) => {
        link.addEventListener('click', async (event) => {
            event.preventDefault();
            activeCheckbox = link.closest('label')?.querySelector('input[type="checkbox"]') || null;
            if (!dialog) await build();
            dialog.showModal();
            document.body.classList.add('no-scroll');
            const body = dialog.querySelector('.policy-body');
            body.scrollTop = 0;
            body.focus({ preventScroll: true });
        });
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

/* ---------- Animations rest while their part of the page is off screen ---------- */
function initAnimationPausing() {
    if (!('IntersectionObserver' in window)) return;
    const parts = document.querySelectorAll('main > section, main > .marquee, main > div, .site-footer');
    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => entry.target.classList.toggle('anim-paused', !entry.isIntersecting));
    }, { rootMargin: '120px 0px' });
    parts.forEach((part) => io.observe(part));
}

/* ---------- Photos: soft shimmer while loading, then fade in ---------- */
function initImageLoading() {
    const watch = (img) => {
        if (img.dataset.imgWatch) return;
        img.dataset.imgWatch = '1';
        if (img.complete) return;
        // The logo only fades in; the shimmer box would look odd around a small round logo
        const logo = Boolean(img.closest('.brand, .footer-logo'));
        const show = logo ? 'logo-show' : 'img-show';
        if (!logo) img.classList.add('img-wait');
        img.addEventListener('load', () => {
            img.classList.remove('img-wait');
            if (reduceMotion) return;
            img.classList.add(show);
            img.addEventListener('animationend', (event) => {
                if (event.animationName === show) img.classList.remove(show);
            });
        }, { once: true });
        img.addEventListener('error', () => img.classList.remove('img-wait'), { once: true });
    };
    document.querySelectorAll('img').forEach(watch);
    // Gallery, events and other photos added later by the page
    new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (node.tagName === 'IMG') watch(node);
        else node.querySelectorAll('img').forEach(watch);
    }))).observe(document.body, { childList: true, subtree: true });
}

document.addEventListener('DOMContentLoaded', () => {
    initImageLoading();
    initAnimationPausing();
    initMenu();
    initScrollEffects();
    observeReveal();
    addStars();
    document.querySelectorAll('[data-count]').forEach(countUp);
    initCopy();
    document.querySelectorAll('form[data-form]').forEach(initForm);
    loadReviews();
    loadArticles();
    loadEvents();
    loadTeam();
    loadGallery();
    initEditor();
    initPrivacyDialog();
});
