"""Generates the static pages of Sí bebé v2. Texts are taken word for word from the content document."""
import os
import re

OUT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ICON = {
    'users':   '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2c2.8.4 5 2.8 5 5.8"/>',
    'heart':   '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    'leaf':    '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z"/><path d="M5 19l7-7"/>',
    'moon':    '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    'sprout':  '<path d="M12 21V11"/><path d="M12 11c0-4 3-6 7-6 0 4-3 6-7 6z"/><path d="M12 14c0-3-2-5-6-5 0 3 2 5 6 5z"/>',
    'move':    '<circle cx="13" cy="4.5" r="1.8"/><path d="M9 21l2.5-6 3 2.5V21"/><path d="M6.5 12.5l3.5-3.5 4 1 3 4"/>',
    'chat':    '<path d="M4 5h11v8H8l-4 3z"/><path d="M15 9h5v8l-3-2h-6v-2"/>',
    'wave':    '<path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/>',
    'shield':  '<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
    'sparkle': '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.5 2.5M15.2 15.2l2.5 2.5M6.3 17.7l2.5-2.5M15.2 8.8l2.5-2.5"/>',
    'speech':  '<path d="M4 5h16v10H9l-5 4z"/><path d="M9 10h.01M12 10h.01M15 10h.01"/>',
    'drop':    '<path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z"/>',
    'music':   '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    'ball':    '<circle cx="12" cy="12" r="9"/><path d="M3.5 9.5c5 1 12 1 17 0M3.5 14.5c5-1 12-1 17 0"/>',
    'palette': '<path d="M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><path d="M7.5 11h.01M10 7.5h.01M14.5 7.5h.01"/>',
    'clock':   '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    'box':     '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    'cake':    '<path d="M4 21h16v-8H4z"/><path d="M4 16c2 1.5 4 1.5 6 0s4-1.5 6 0 2 1 4 0"/><path d="M12 13V9M12 6v.01"/>',
    'pulse':   '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
    'blocks':  '<rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/><rect x="8.5" y="4" width="7" height="7" rx="1"/>',
    'doc':     '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
    'camera':  '<path d="M3 8h4l2-3h6l2 3h4v11H3z"/><circle cx="12" cy="13" r="3.5"/>',
    'calendar':'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    'expert':  '<path d="M6 3v6a4 4 0 0 0 8 0V3"/><path d="M10 13v3a4 4 0 0 0 8 0v-2"/><circle cx="18" cy="12" r="2"/>',
    'book':    '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8 7h7M8 11h7"/>',
    'medical': '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M12 9v5M9.5 11.5h5"/>',
    'edu':     '<path d="M3 9l9-5 9 5-9 5z"/><path d="M7 11.5V16c3 2 7 2 10 0v-4.5"/>',
    'star':    '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>',
    'media':   '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M10 9.5v5l4.5-2.5z"/>',
    'corp':    '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M10 21v-4h4v4"/>',
    'pin':     '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    'phone':   '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.8.7a2 2 0 0 1 1.8 2z"/>',
    'mail':    '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    'share':   '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>',
    'facebook':'<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    'instagram':'<rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.4A4 4 0 1 1 12.6 8 4 4 0 0 1 16 11.4z"/><path d="M17.5 6.5h.01"/>',
    'menu':    '<path d="M4 7h16M4 12h16M4 17h16"/>',
    'chevron': '<path d="M6 9l6 6 6-6"/>',
    'arrow':   '<path d="M5 12h14M13 6l6 6-6 6"/>',
}


def svg(name, size=None, width=1.6):
    s = f' width="{size}" height="{size}"' if size else ''
    return f'<svg viewBox="0 0 24 24"{s} fill="none" stroke="currentColor" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICON[name]}</svg>'


def icon(name, cls=''):
    return f'<span class="icon {cls}">{svg(name)}</span>'


# Decorative shapes (soft nursery motifs). Positioned with inline custom properties.
SHAPES = {
    'star':   ('0 0 24 24', '<path d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>'),
    'cloud':  ('0 0 32 20', '<path d="M8.5 19h16a6.5 6.5 0 0 0 .9-12.94A8.5 8.5 0 0 0 9.1 5.2 7 7 0 0 0 8.5 19z" fill="currentColor"/>'),
    'circle': ('0 0 24 24', '<circle cx="12" cy="12" r="11" fill="currentColor"/>'),
    'ring':   ('0 0 24 24', '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="3.2"/>'),
    'heart':  ('0 0 24 24', '<path d="M12 21s-8.5-5.3-8.5-11.6A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.5 2.8C20.5 15.7 12 21 12 21z" fill="currentColor"/>'),
    'moon':   ('0 0 24 24', '<path d="M20.5 14.6A9 9 0 0 1 9.4 3.5a9 9 0 1 0 11.1 11.1z" fill="currentColor"/>'),
    'squiggle': ('0 0 60 16', '<path d="M2 8c5-7 9-7 14 0s9 7 14 0 9-7 14 0 9 7 14 0" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>'),
    'stars':  ('0 0 40 40', '<g transform="translate(2.6 2.08) scale(0.95)"><path d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></g><g transform="translate(23.8 18.1) scale(0.6)"><path d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></g><g transform="translate(6.96 28.17) scale(0.42)"><path d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></g>'),
}


def deco(kind, style, depth=0.06):
    box, inner = SHAPES[kind]
    return f'<span class="deco deco--{kind}" style="{style}" data-depth="{depth}" aria-hidden="true"><svg viewBox="{box}">{inner}</svg></span>'


_split_count = [0]
SPLIT_DECOS = [
    [('moon', 'top:-4%;right:6%;--s:42px;--c:var(--butter-500);--dur:7s'), ('ring', 'bottom:4%;left:-4%;--s:64px;--c:var(--peach-500);--dur:9s'), ('stars', 'bottom:-6%;right:-2%;--s:84px;--c:var(--butter-500);--dur:11s')],
    [('cloud', 'top:2%;left:-8%;--s:92px;--c:var(--sky-300);--dur:10s'), ('heart', 'bottom:8%;right:-3%;--s:40px;--c:var(--peach-500);--dur:6s'), ('stars', 'top:-6%;right:4%;--s:76px;--c:var(--butter-500);--dur:12s')],
    [('moon', 'top:-2%;left:4%;--s:44px;--c:var(--butter-500);--dur:8s'), ('ring', 'bottom:-4%;right:8%;--s:58px;--c:var(--mint-500);--dur:9s'), ('squiggle', 'bottom:12%;left:-10%;--s:90px;--c:var(--sky-500);--dur:10s')],
]


def split_deco():
    """Rotating set of shapes around a photo, so neighbouring sections look different."""
    items = SPLIT_DECOS[_split_count[0] % len(SPLIT_DECOS)]
    _split_count[0] += 1
    return ''.join(deco(k, s, 0.08) for k, s in items)


PHONES = [('0879919779', '0879 919 779'), ('0882915978', '0882 915 978')]
EMAIL = 'sibebe.bg@gmail.com'
FACEBOOK = 'https://www.facebook.com/profile.php?id=61555541437681'
INSTAGRAM = 'https://www.instagram.com/sibebe_babyandparents_care/'
ADDRESS = 'гр. Варна, ул. „Братя Миладинови“ 68'
HOURS = 'Понеделник – Петък (7:30–18:30), Събота и Неделя 9:00–17:00'
MAP_Q = '%D1%83%D0%BB.+%D0%91%D1%80%D0%B0%D1%82%D1%8F+%D0%9C%D0%B8%D0%BB%D0%B0%D0%B4%D0%B8%D0%BD%D0%BE%D0%B2%D0%B8+68%2C+%D0%92%D0%B0%D1%80%D0%BD%D0%B0'

BABY_SECTIONS = [
    ('expertise', 'Експертност и спокойствие'),
    ('pillars', 'Четирите стълба'),
    ('development', 'Какво правим'),
    ('activities', 'Дейност'),
    ('services', 'Услуги'),
    ('age-groups', 'Възрастови групи'),
    ('adaptation', 'Адаптация'),
    ('environment', 'Среда и хигиена'),
    ('daily-routine', 'Дневен режим'),
    ('pricing', 'График и ценоразпис'),
]

NAV = [
    ('index', 'index.html', 'Начало'),
    ('about', 'about.html', 'За нас'),
    ('baby-center', 'baby-center.html', 'Бебешки център'),
    ('academy', 'academy.html', 'Академия за родители'),
    ('partners', 'partners.html', 'Партньори'),
    ('gallery', 'gallery.html', 'Галерия'),
    ('shop', 'shop.html', 'Магазин'),
    ('contact', 'contact.html', 'Контакти'),
]


def header(active):
    items = []
    for key, href, label in NAV:
        current = ' aria-current="page"' if key == active else ''
        if key == 'baby-center':
            subs = '\n'.join(f'                            <li><a href="baby-center.html#{h}">{t}</a></li>' for h, t in BABY_SECTIONS)
            items.append(f'''                    <li class="has-sub">
                        <div class="has-sub-head">
                            <a class="nav-link" href="{href}"{current}>{label}</a>
                            <button type="button" class="sub-toggle" aria-expanded="false" aria-controls="sub-baby" aria-label="Покажи разделите">{svg('chevron', 16, 2.5)}</button>
                        </div>
                        <ul class="sub-menu" id="sub-baby">
{subs}
                        </ul>
                    </li>''')
        else:
            items.append(f'                    <li><a class="nav-link" href="{href}"{current}>{label}</a></li>')
    items.append('                    <li class="nav-cta"><a class="btn" href="contact.html#booking">Запиши час</a></li>')
    return f'''    <header class="site-header">
        <div class="container">
            <a class="brand" href="index.html" aria-label="Sí bebé, начало"><img src="media/logo.webp" alt="Sí bebé" width="56" height="56"></a>
            <nav class="nav" id="site-nav" aria-label="Главно меню">
                <ul class="nav-list">
{chr(10).join(items)}
                </ul>
            </nav>
            <a class="btn header-cta" href="contact.html#booking">Запиши час</a>
            <button type="button" class="menu-toggle" aria-expanded="false" aria-controls="site-nav" aria-label="Меню"><span></span><span></span><span></span></button>
        </div>
    </header>'''


def footer():
    phones = '\n'.join(f'                        <li><a href="tel:{n}">{svg("phone", 16, 2)} {d}</a></li>' for n, d in PHONES)
    links = '\n'.join(f'                        <li><a href="{href}">{label}</a></li>' for _, href, label in NAV)
    return f'''    <footer class="site-footer">
        <span class="footer-stars" aria-hidden="true"></span>
        <div class="container footer-grid">
            <div class="footer-brand">
                <a class="footer-logo" href="index.html" aria-label="Sí bebé, начало"><img src="media/logo.webp" alt="Sí bebé" width="72" height="72" loading="lazy"></a>
                <p>Център за ранна грижа и развитие</p>
                <div class="footer-socials">
                    <a href="{FACEBOOK}" target="_blank" rel="noopener" aria-label="Facebook">{svg('facebook', 20, 1.8)}</a>
                    <a href="{INSTAGRAM}" target="_blank" rel="noopener" aria-label="Instagram">{svg('instagram', 20, 1.8)}</a>
                    <a href="mailto:{EMAIL}" aria-label="Имейл">{svg('mail', 20, 1.8)}</a>
                </div>
            </div>
            <nav class="footer-col" aria-label="Страници">
                <ul class="footer-links">
{links}
                </ul>
            </nav>
            <div class="footer-col">
                <h3>Адрес</h3>
                <p>{ADDRESS}</p>
                <h3>Работно време</h3>
                <p>Понеделник – Петък (7:30–18:30)<br>Събота и Неделя 9:00–17:00</p>
            </div>
            <div class="footer-col">
                <h3>Телефони</h3>
                <ul class="footer-phones">
{phones}
                </ul>
                <a class="btn btn--light" href="contact.html#booking">Запиши час</a>
            </div>
        </div>
        <div class="container footer-bottom">
            <p>&copy; 2024 Sí bebé. Всички права запазени. <a href="privacy.html">Политика за поверителност</a></p>
        </div>
    </footer>'''


SITE_URL = 'https://sibebe.bg'


def asset_version(path):
    """Short content hash, so browsers fetch the new file after every change."""
    import hashlib
    with open(os.path.join(OUT, path), 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()[:8]


# The handwritten "Sí bebé" on the home page, in the spirit of the logo lettering
SCRIPT_PRELOAD = '\n    <link rel="preload" href="assets/fonts/allura-latin-400.woff2" as="font" type="font/woff2" crossorigin>'


def page(key, title, description, body):
    url = f'{SITE_URL}/' if key == 'index' else f'{SITE_URL}/{key}'
    return f'''<!DOCTYPE html>
<html lang="bg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>{title}</title>
    <meta name="description" content="{description}">
    <link rel="canonical" href="{url}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Sí bebé">
    <meta property="og:locale" content="bg_BG">
    <meta property="og:url" content="{url}">
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{description}">
    <meta property="og:image" content="{SITE_URL}/media/share.jpg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="theme-color" content="#FFF8F1">
    <link rel="icon" type="image/png" href="assets/img/favicon.png">
    <link rel="stylesheet" href="assets/css/fonts.css">
    <link rel="stylesheet" href="assets/css/style.css?v={asset_version('assets/css/style.css')}">
    <link rel="preload" href="assets/fonts/nunito-cyrillic-TMnFcQIG.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="assets/fonts/onest-cyrillic-oEoeyxMI.woff2" as="font" type="font/woff2" crossorigin>{SCRIPT_PRELOAD if key == 'index' else ''}
    <script>
        // Entrance animations play once per visit; later pages and refreshes show content straight away
        (function (d) {{
            d.classList.add('js');
            try {{
                if (sessionStorage.getItem('sibebe-seen')) d.classList.add('is-return');
                sessionStorage.setItem('sibebe-seen', '1');
            }} catch (e) {{}}
        }})(document.documentElement);
    </script>
</head>
<body>
    <div class="scroll-progress" aria-hidden="true"></div>
{header(key)}
    <main>
{body}
    </main>
{footer()}
    <script src="assets/js/site.js?v={asset_version('assets/js/site.js')}"></script>
</body>
</html>
'''


def more(uid, key, rest):
    """First sentence always visible, the rest behind "Прочети още"."""
    if not rest:
        return f'<p class="key">{key}</p>'
    return f'''<p class="key">{key}</p>
                        <p class="more" id="{uid}" hidden>{rest}</p>
                        <button type="button" class="more-toggle" aria-expanded="false" aria-controls="{uid}"><span class="when-closed">Прочети още</span><span class="when-open">Скрий</span>{svg('chevron', 14, 2.5)}</button>'''


def split_first(text):
    i = text.find('. ')
    return (text, '') if i < 0 else (text[:i + 1], text[i + 2:])


def cta_band():
    return f'''        <section class="section cta-section">
            <div class="container">
                <div class="cta-panel">
                    {deco('cloud', 'top:-14px;right:30%;--s:110px;--c:#fff;--dur:12s', 0.04)}
                    {deco('star', 'bottom:16%;right:30%;--s:30px;--c:var(--butter-500);--dur:6s', 0.1)}
                    {deco('heart', 'top:18%;left:52%;--s:24px;--c:var(--peach-500);--dur:7s', 0.12)}
                    <div class="cta-text">
                        <h2>Запишете час онлайн</h2>
                        <p>{svg('pin', 18, 2)} {ADDRESS}</p>
                        <p>{svg('clock', 18, 2)} {HOURS}</p>
                    </div>
                    <div class="btn-row">
                        <a class="btn" href="contact.html#booking">Запиши час {svg('arrow', 18, 2.2)}</a>
                        <a class="btn btn--ghost" href="contact.html">Контакти</a>
                    </div>
                </div>
            </div>
        </section>'''


def intro(h1, slot, alt, subtitle='', lead='', eyebrow='', extra=''):
    parts = []
    if eyebrow:
        parts.append(f'<span class="eyebrow">{eyebrow}</span>')
    parts.append(f'<h1>{h1}</h1>')
    if subtitle:
        parts.append(f'<p class="subtitle">{subtitle}</p>')
    if lead:
        parts.append(lead)
    if extra:
        parts.append(extra)
    inner = '\n                    '.join(parts)
    return f'''        <section class="page-intro">
            {INTRO_DECO}
            <div class="container">
                <div class="intro-text">
                    {inner}
                </div>
                <div class="intro-media">
                    <div class="blob blob--back" aria-hidden="true"></div>
                    <div class="blob"><img src="media/{slot}.webp" alt="{alt}" width="360" height="450"></div>
                </div>
            </div>
        </section>'''


INTRO_DECO = ''.join([
    deco('moon', 'top:18%;left:3%;--s:34px;--c:var(--butter-500);--dur:7s', 0.15),
    deco('cloud', 'top:24%;right:40%;--s:86px;--c:#fff;--dur:11s', 0.08),
    deco('ring', 'bottom:12%;left:44%;--s:44px;--c:var(--peach-500);--dur:9s', 0.12),
    deco('stars', 'bottom:8%;right:4%;--s:80px;--c:var(--butter-500);--dur:12s', 0.05),
])


MARQUEE_WORDS = ['Сетива', 'Двигателни умения', 'Езиково обогатяване', 'Социална интелигентност', 'Сензорни игри', 'Музикални занимания', 'Гимнастика за бебета', 'Арт ателиета']


def marquee():
    star = SHAPES['star']
    sep = f'<svg class="marquee-star" viewBox="{star[0]}" aria-hidden="true">{star[1]}</svg>'
    words = ''.join(f'<span>{w}</span>{sep}' for w in MARQUEE_WORDS)
    return f'''        <div class="marquee">
            <div class="marquee-track">
                <div class="marquee-group">{words}</div>
                <div class="marquee-group" aria-hidden="true">{words}</div>
            </div>
        </div>'''


# ---------------- Content from the document ----------------
EXPERTISE = [('users', 'Малки групи', 'Гарантираме качествена връзка между детето и възрастния.'),
             ('heart', 'Постоянен екип', 'Сигурността на детето зависи от познатите лица. При нас стабилността на екипа е приоритет.'),
             ('leaf', 'Минимализъм', 'Пространството ни е проектирано с естествени материали и меки тонове. Премахваме визуалния хаос, за да стимулираме естественото внимание без стрес.')]
EXPERTISE_TEXT = 'Sí bebé не е просто място за гледане на деца. Вярваме, че ранното детство изисква баланс между професионална подкрепа и домашна предвидимост. Взаимстваме стандарти от водещи международни практики, където фокусът е изместен от "забавлението" към "преживяването".'

PILLARS = [('moon', 'Биологичен ритъм, не график', 'Поетапно въвеждаме дейностите и разписанието на активностите на центъра. Адаптираме деня спрямо индивидуалните нужди на всяко дете от сън, храна и близост. Когато биологичният ритъм се уважава, нервната система остава спокойна.'),
           ('heart', 'Емоционална интелигентност', 'Отнасяме се към бебето като към личност с право на глас и собствено темпо. Изграждаме доверие, което е основа за бъдещата му увереност.'),
           ('move', 'Двигателна и сетивна свобода', 'Насърчаваме детето да открива света чрез движение и сетивни игри – от първото обръщане до увереното ходене.'),
           ('chat', 'Партньорство и прозрачност', 'Ние сме вашата подкрепа. Споделяме реалните етапи от развитието на детето ви, за да тръгвате на работа  и вършите вашите задачи със спокойствие.'.replace('  ', ' '))]

ROUTINE = [('08:00 – 09:30', 'Прием, гимнастика, йога, свободни игри', False),
           ('09:30 – 10:30', 'Специализирано занимание (музика/сензорика/арт занимания/ролеви игри и други).', True),
           ('10:30 – 11:00', 'Здравословна закуска.', False),
           ('11:00 – 12:30', 'Игри на открито или гимнастика.', False),
           ('13:00 – 15:30', 'Време за почивка.', False),
           ('15:30 – 16:30', 'Свободни дейности', False),
           ('16:30 – 17:30', 'Специализирано занимание (музика/сензорика/спорт/театър)', True),
           ('17:30 – 18:30', 'Свободни игри', False)]


def build_home():
    facts = '\n'.join(f'''                    <article class="card">
                        {icon(ic, 'icon--sage' if i == 2 else '')}
                        <h3>{t}</h3>
                        <p>{x}</p>
                    </article>''' for i, (ic, t, x) in enumerate(EXPERTISE))
    pillars = '\n'.join(f'''                    <li>
                        {icon(ic, 'icon--gold')}
                        <div>
                            <h3>{t}</h3>
                        {more(f'home-pillar-{i}', *split_first(x))}
                        </div>
                    </li>''' for i, (ic, t, x) in enumerate(PILLARS, 1))
    day_items = [ROUTINE[0], ROUTINE[1], ROUTINE[3], ROUTINE[4], ROUTINE[6]]
    day = '\n'.join(f'                    <li><time>{tm.split(" – ")[0]}</time><span>{tx}</span></li>' for tm, tx, _ in day_items)
    body = f'''        <section class="hero">
            {deco('moon', 'top:12%;left:2%;--s:40px;--c:var(--butter-500);--dur:7s', 0.2)}
            {deco('cloud', 'top:7%;left:40%;--s:110px;--c:#fff;--dur:12s', 0.1)}
            {deco('heart', 'bottom:18%;left:38%;--s:28px;--c:var(--peach-500);--dur:6s', 0.25)}
            {deco('ring', 'bottom:10%;left:6%;--s:52px;--c:var(--mint-500);--dur:9s', 0.15)}
            <div class="container">
                <div class="hero-text">
                    <h1><span class="brand-word"><span class="brand-script">Sí bebé</span> -<svg class="brand-squiggle" viewBox="0 0 200 16" preserveAspectRatio="none" aria-hidden="true"><path d="M3 10c18-8 30-8 48 0s30 8 48 0 30-8 48 0 30 8 48 0"/></svg></span> всяко начало е изпълнено с обич и открития.</h1>
                    <p class="lead">Добре дошли в нашето защитено пространство за най-малките. Тук бебетата опознават света чрез сетивата си, а родителите откриват подкрепа и споделеност. Съчетаваме грижата на семейството с експертизата на специалистите.</p>
                    <div class="btn-row">
                        <a class="btn" href="contact.html#booking">Запиши час {svg('arrow', 18, 2.2)}</a>
                        <a class="btn btn--ghost" href="baby-center.html">Бебешки център</a>
                    </div>
                </div>
                <div class="hero-media">
                    <div class="blob blob--back" aria-hidden="true"></div>
                    <div class="blob blob--hero"><img src="media/home-hero.webp" alt="Бебе играе с дървена играчка на килима" width="460" height="575" fetchpriority="high"></div>
                    {deco('stars', 'top:-4%;right:-2%;--s:96px;--c:var(--butter-500);--dur:12s', 0.06)}
                    <div class="hero-badge">{icon('heart')}<div><strong>0–36 месеца</strong><span>Център за ранна грижа и развитие</span></div></div>
                </div>
            </div>
        </section>

{marquee()}

        <section class="section section--white">
            <div class="container">
                <div class="section-head">
                    <h2>Експертност и спокойствие</h2>
                    <p class="lead">Sí bebé не е просто място за гледане на деца. Вярваме, че ранното детство изисква баланс между професионална подкрепа и домашна предвидимост.</p>
                </div>
                <div class="card-grid card-grid--3">
{facts}
                </div>
            </div>
        </section>

        <section class="section section--mist">
            <div class="container split">
                <div class="split-media">
                    {split_deco()}
                    <div class="blob"><img src="media/home-pillars.webp" alt="Деца играят с дървени играчки в светла занималня" loading="lazy" width="440" height="528"></div>
                </div>
                <div class="split-body">
                    <div class="section-head"><h2>Четирите стълба на Sí&nbsp;bebé</h2></div>
                    <ul class="feature-list">
{pillars}
                    </ul>
                    <div><a class="btn btn--ghost" href="baby-center.html">Бебешки център</a></div>
                </div>
            </div>
        </section>

        <section class="section">
            <div class="container">
                <div class="section-head">
                    <span class="eyebrow">Пример за нашия ден</span>
                    <h2>Дневен режим</h2>
                </div>
                <ol class="day-strip">
{day}
                </ol>
                <p style="margin-top: 36px;"><a class="btn btn--ghost" href="baby-center.html#daily-routine">Целият дневен режим</a></p>
            </div>
        </section>

        <section class="section section--peach">
            <div class="container">
                <div class="section-head"><h2>Отзиви от родители</h2></div>
                <div class="reviews" data-reviews><p class="loading-note">Зареждане...</p></div>
            </div>
        </section>

        <section class="section section--white" data-events-section hidden>
            <div class="container">
                <div class="events-group" data-events-group="upcoming" hidden>
                    <h2>Предстоящи събития</h2>
                    <div class="event-row"></div>
                </div>
                <div class="events-group" data-events-group="past" hidden>
                    <h2>Минали събития</h2>
                    <div class="event-row"></div>
                </div>
            </div>
        </section>

{cta_band()}'''
    return page('index', 'Sí bebé - всяко начало е изпълнено с обич и открития',
                'Почасово гледане на бебета и деца от 0 до 36 месеца във Варна. Малки групи, постоянен екип и спокойна среда за най-малките.', body)


def build_about():
    goals = [('wave', 'Устойчиво развитие на нервната система', 'Целта ни е да защитим децата от претоварване. Постигаме го чрез среда с контролирана стимулация, естествени материали и меки тонове. Избягваме силните изкуствени стимули, за да подпомогнем способността на детето да опознава света спокойно.'),
             ('sprout', 'Изграждане на вътрешна увереност', 'Ние целим всяко дете да изгради трайно доверие в себе си и в света около него. Това се постига чрез малки групи, постоянен персонал и плавна, индивидуална адаптация, която изключва стреса от раздялата.'),
             ('moon', 'Индивидуален биологичен подход', 'В Sí bebé целим пълно синхронизиране на грижата с физиологията на бебето. Ние не налагаме изкуствени графици; нашата цел е да следваме индивидуалния ритъм на сън, хранене и активност на всяко дете.'),
             ('chat', 'Партньорство, базирано на прозрачност', 'Стремим се към пълна яснота в комуникацията с родителите. Нашата цел е да предоставяме детайлна обратна връзка за всеки етап от развитието на детето, превръщайки се в стабилна опора за семейството.'),
             ('shield', 'Високи хигиенни стандарти', 'Поддържаме микроклимат, който минимизира здравните рискове. Това включва безупречна дезинфекция, пречистване на въздуха и използване на материали, които осигуряват чиста и здравословна среда.')]
    goals_html = '\n'.join(f'''                    <article class="card">
                        {icon(ic, 'icon--sage')}
                        <h3>{t}</h3>
                        {more(f'goal-{i}', *split_first(x))}
                    </article>''' for i, (ic, t, x) in enumerate(goals, 1))
    team = [('blocks', 'Специалисти по ранно детско развитие и педагози', 'Специалисти, които превръщат всяко преживяване във възможност детето да открие света и собствените си заложби.'),
            ('medical', 'Медицински персонал', 'Безопасността, физическото здраве и благополучие са основата, върху която градим всичко останало.'),
            ('speech', 'Терапевтичен панел', 'Програмата ни е подсилена от работата на логопед и ерготерапевт, които следят за правилното езиково и моторно развитие, помагайки на всяко дете да разгърне пълния си потенциал в правилния момент.')]
    team_html = '\n'.join(f'''                    <article class="card">
                        {icon(ic)}
                        <h3>{t}</h3>
                        <p>{x}</p>
                    </article>''' for ic, t, x in team)
    body = f'''{intro('За нас', 'about-intro', 'Бебе играе с дървена играчка на килима', subtitle='Стандарт в ранната грижа')}

        <section class="section section--white">
            <div class="container split split--reverse">
                <div class="split-media">
                    {split_deco()}
                    <div class="blob"><img src="media/about-mission.webp" alt="Възпитателка играе с две малки деца на масичка с дървени играчки" loading="lazy" width="440" height="528"></div>
                </div>
                <div class="split-body">
                    <span class="eyebrow">Мисия</span>
                    <p class="mission-lead">Мисията на Sí bebé е да създаде <mark>нов стандарт в ранната грижа</mark>, където биологичните нужди и емоционалното спокойствие на детето са приоритет.</p>
                    <span class="chip">0–36 месеца</span>
                    <div class="prose">
                        <p>Ние се ангажираме да съхраним <strong>естествения ритъм на децата</strong> в периода на тяхното най-интензивно развитие (0–36 месеца).</p>
                        <p>Чрез съчетаване на експерти ранно детско развитие и защитена среда, ние осигуряваме <strong>плавен преход от семейния уют към първите социални стъпки</strong>. Нашата задача е да бъдем <strong>доверен партньор на родителите</strong>, предоставяйки им сигурност, че детето им е в пространство, което уважава неговата индивидуалност и подкрепя развитието на неговата нервна система.</p>
                    </div>
                </div>
            </div>
        </section>

        <section class="section section--night" data-stars>
            <div class="container">
                <div class="section-head">
                    <span class="eyebrow">Визия</span>
                    <h2>Щастливо детство чрез качество и уважение</h2>
                </div>
                <div class="quote-grid">
                    <blockquote class="big-quote">Успехът не се измерва с външна стимулация, а с вътрешното спокойствие и увереност на всяко дете.</blockquote>
                    <div class="stat"><b data-count="1000">1000</b><span>Качествената основа в първите 1000 дни е ключът към здравословното развитие на бъдещото поколение.</span></div>
                </div>
                <div class="quote-body">
                    <p>Визията ни е Sí bebé да бъде <strong>еталон за професионална ранна грижа</strong> – място, в което успехът не се измерва с външна стимулация, а с вътрешното спокойствие и увереност на всяко дете.</p>
                    <p>Стремим се да изградим <strong>общност от информирани родители и специалисти</strong>, които разбират, че качествената основа в първите 1000 дни е ключът към здравословното развитие на бъдещото поколение.</p>
                    <p>Искаме Sí bebé да бъде символ на стандарт, в който <strong>човешкото присъствие, вниманието към детайла и безупречната етика</strong> формират средата на бъдещето.</p>
                </div>
            </div>
        </section>

        <section class="section">
            <div class="container">
                <div class="section-head">
                    <span class="eyebrow">Цели</span>
                    <h2>Стълбове на професионалната грижа</h2>
                </div>
                <div class="goals">
{goals_html}
                </div>
            </div>
        </section>

        <section class="section section--mint">
            <div class="container">
                <div class="section-head">
                    <span class="eyebrow">Екип</span>
                    <h2>Експертна грижа с мисъл за бъдещето</h2>
                    <p class="lead">Вярваме, че ранното детско развитие изисква повече от просто внимание – то изисква научен подход, опитна ръка и топло сърце. Затова зад концепцията на нашия център стои екип от доказани специалисти, които обединяват усилията си в името на най-ценното: физическото и емоционално здраве на вашето дете.</p>
                </div>
                <div class="feature-block">
                    {icon('star', 'icon--gold')}
                    <div>
                        <h3>Лидерство с експертиза</h3>
                        <p>Начело на нашия екип е основател с научна степен „Доктор по детска психология“. Това гарантира, че всяка методика, игра и програма в центъра е съобразена с най-съвременните психо-емоционални нужди на малките откриватели. Ние не просто наблюдаваме децата – ние разбираме техния вътрешен свят.</p>
                    </div>
                </div>
                <div class="section-head" style="margin-top: 64px;">
                    <h2>Мултидисциплинарен подход</h2>
                    <p class="lead">За пълноценното развитие на децата се грижи подбран състав от професионалисти:</p>
                </div>
                <div class="card-grid card-grid--3">
{team_html}
                </div>
                <blockquote class="philosophy" style="margin-top: 80px;">
                    <h3>Нашата обща философия</h3>
                    <p>Ние не сме просто служители, а партньори на семейството. Тук ще откриете хора, които изслушват, съветват и обгръщат детето ви със среда, в която то се чувства сигурно, разбрано и обичано.</p>
                </blockquote>
            </div>
        </section>

        <section class="section section--peach">
            <div class="container">
                <div class="section-head"><h2>Отзиви от родители</h2></div>
                <div class="reviews" data-reviews><p class="loading-note">Зареждане...</p></div>
            </div>
        </section>'''
    return page('about', 'За нас | Sí bebé', 'Мисия, визия и екип на Sí bebé. Ранна грижа, водена от доктор по детска психология.', body)


def build_baby():
    chips = '\n'.join(f'                        <a href="#{h}">{t}</a>' for h, t in BABY_SECTIONS)
    lead = '''<p class="lead">Ние сме тясно специализиран бебешки център за почасово гледане на бебета и деца от 0 до 36 месеца.</p>
                    <p class="lead">В Sí bebé осигуряваме среда, която поставя основите на здравословното развитие и емоционалната стабилност. Избираме ниската сензорна стимулация и високата емоционална наличност, за да изградим здрава нервна система и вътрешна увереност у всяко дете.</p>'''
    extra = f'''<nav class="chip-nav" aria-label="Раздели на страницата">
{chips}
                    </nav>'''
    expertise = '\n'.join(f'''                        <li>
                            {icon(ic, 'icon--sage')}
                            <div><h3>{t}</h3><p>{x}</p></div>
                        </li>''' for ic, t, x in EXPERTISE)
    pillars = '\n'.join(f'''                    <article class="card">
                        {icon(ic, 'icon--gold')}
                        <h3>{t}</h3>
                        <p>{x}</p>
                    </article>''' for ic, t, x in PILLARS)
    development = [('sparkle', 'Сетива', 'Работа с естествени материали, светлина и музика.'),
                   ('move', 'Двигателни умения', 'Подкрепа на грубата и фината моторика в защитена среда.'),
                   ('speech', 'Езиково обогатяване', 'Четене, приказки и постоянна комуникация лице в лице.'),
                   ('users', 'Социална интелигентност', 'Първи стъпки в общуването с връстници.')]
    activities = [('drop', 'Сензорни игри', 'Изследване на текстури (пясък, вода, багрила и др.), които развиват невронните връзки.'),
                  ('music', 'Музикални занимания', 'Ритъм, песни и първи срещи с инструментите.'),
                  ('ball', 'Гимнастика за бебета', 'Укрепване на мускулатурата и координацията чрез забавни упражнения.'),
                  ('palette', 'Арт ателиета', 'Първи стъпки в творчеството с безопасни материали.')]
    services = [('clock', 'Гледане на дете', 'Почасово (за вашето свободно време), полудневно и целодневно (с включени занимания).'),
                ('box', 'Абонаментни програми', 'Гъвкави пакети за редовни посещения на преференциални цени.'),
                ('calendar', 'Тематични работилници', 'Уикенд събития за цялото семейство.'),
                ('heart', 'Мама и бебе', 'Специални класове за заздравяване на връзката и споделен опит.'),
                ('cake', 'Бебешки рожден ден', 'Организираме първите празници с внимание към детайла и нуждите на малките.'),
                ('chat', 'Консултации', 'Индивидуални срещи с логопед или детски психолог.')]
    ages = [('0–6 месеца', 'Нежни стимули, масаж и визуално проследяване.'),
            ('6–12 месеца', 'Пълзене, седене и опознаване на предмети.'),
            ('12–24 месеца', 'Първи стъпки, прохождане и езиково развитие.'),
            ('24–36 месеца', 'Социални игри и подготовка за детска градина.')]
    environment = [('shield', 'Хигиена', 'Осигуряваме безкомпромисна чистота и здравословен микроклимат чрез висок клас дезинфекция и системи за пречистване на въздуха.'),
                   ('pulse', 'Здраве', 'Ежедневен медицински филтър; хипоалергенна среда'),
                   ('blocks', 'Материална база', 'Всеки детайл в интериора и играчките е подбран с мисъл за сетивното здраве, ергономията и безопасността на децата.'),
                   ('doc', 'Регламенти', 'Центърът е проектиран и оперира в пълно съответствие с всички нормативни изисквания и разпоредби на българското законодателство.'),
                   ('camera', 'Видеонаблюдение', 'Центърът е с контролиран пропускателен режим и е оборудван с камери във всяко помещение.')]
    feat = lambda items, cls='': '\n'.join(f'''                    <li>
                        {icon(ic, cls)}
                        <h3>{t}</h3>
                        <p>{x}</p>
                    </li>''' for ic, t, x in items)
    cards = lambda items, cls='': '\n'.join(f'''                    <article class="card">
                        {icon(ic, cls)}
                        <h3>{t}</h3>
                        <p>{x}</p>
                    </article>''' for ic, t, x in items)
    age_cards = '\n'.join(f'''                    <article class="card"><h3>{t}</h3><p>{x}</p></article>''' for t, x in ages)
    steps = [('Постепенност', 'Престоят се увеличава стъпка по стъпка.'),
             ('Присъствие', 'Родителят е част от процеса в началото, докато се изгради връзка на доверие с екипа.'),
             ('Индивидуален план', 'Няма натиск и прибързване. Изчакваме детето да ни покаже, че се чувства сигурно.')]
    steps_html = '\n'.join(f'                        <li><div><h3>{t}</h3><p>{x}</p></div></li>' for t, x in steps)
    focus_attr = ' class="is-focus"'
    routine = '\n'.join(f'                    <li{focus_attr if f else ""}><time>{tm}</time><span>{tx}</span></li>' for tm, tx, f in ROUTINE)
    body = f'''{intro('Sí bebé – Център за ранна грижа и развитие (0–36 месеца)', 'baby-intro', 'Деца играят с дървени играчки в светла занималня', eyebrow='Бебешки център', subtitle='Мислим за емоциите, развитието и спокойствието на всяко дете.', lead=lead, extra=extra)}

        <section class="section section--white" id="expertise">
            <div class="container split split--reverse">
                <div class="split-media">
                    {split_deco()}
                    <div class="blob"><img src="media/baby-expertise.webp" alt="Бебе играе с дървена играчка на килима" loading="lazy" width="440" height="528"></div>
                </div>
                <div class="split-body">
                    <div class="section-head"><h2>Експертност и спокойствие</h2></div>
                    <p>{EXPERTISE_TEXT}</p>
                    <ul class="feature-list">
{expertise}
                    </ul>
                </div>
            </div>
        </section>

        <section class="section section--mist" id="pillars">
            <div class="container">
                <div class="section-head"><h2>Четирите стълба на Sí&nbsp;bebé</h2></div>
                <div class="card-grid card-grid--2">
{pillars}
                </div>
            </div>
        </section>

        <section class="section" id="development">
            <div class="container">
                <div class="section-head">
                    <span class="eyebrow">Посоки на развитие</span>
                    <h2>Какво правим</h2>
                </div>
                <ul class="feature-grid">
{feat(development, 'icon--sage')}
                </ul>
            </div>
        </section>

        <section class="section section--night" id="activities" data-stars>
            <div class="container">
                <div class="section-head">
                    <h2>Дейност</h2>
                    <p class="lead">Ние вярваме в ученето чрез преживяване. Нашите активности включват:</p>
                </div>
                <ul class="feature-grid">
{feat(activities)}
                </ul>
            </div>
        </section>

        <section class="section section--white" id="services">
            <div class="container">
                <div class="section-head"><h2>Услуги</h2></div>
                <div class="card-grid card-grid--3">
{cards(services)}
                </div>
            </div>
        </section>

        <section class="section section--sky" id="age-groups">
            <div class="container">
                <div class="section-head">
                    <h2>Възрастови групи</h2>
                    <p class="lead">Програмите ни са адаптирани към специфичните нужди на всяка възраст:</p>
                </div>
                <div class="age-scale" aria-hidden="true">
                    <div class="age-bar"><span></span><span></span><span></span><span></span></div>
                    <div class="age-ticks"><span>0</span><span>6</span><span>12</span><span><span>24</span><span>36 мес.</span></span></div>
                </div>
                <div class="card-grid age-cards">
{age_cards}
                </div>
            </div>
        </section>

        <section class="section" id="adaptation">
            <div class="container split">
                <div class="split-media">
                    {split_deco()}
                    <div class="blob"><img src="media/baby-adaptation.webp" alt="Възпитателка играе с две малки деца на масичка с дървени играчки" loading="lazy" width="440" height="528"></div>
                </div>
                <div class="split-body">
                    <div class="section-head">
                        <span class="eyebrow">Преход без стрес</span>
                        <h2>Адаптация</h2>
                    </div>
                    <p>При нас преходът не е по часовник, а по готовност. Предлагаме специализирани „преходни часове“ с присъствие на родителя, докато детето изгради доверие към екипа и новата среда. Така процесът на отделяне протича естествено, без стрес и при пълен емоционален комфорт.</p>
                    <ol class="steps">
{steps_html}
                    </ol>
                </div>
            </div>
        </section>

        <section class="section section--mint" id="environment">
            <div class="container">
                <div class="section-head">
                    <span class="eyebrow">Безопасност и стандарти</span>
                    <h2>Среда и хигиена</h2>
                    <p class="lead">Сигурността е наш приоритет</p>
                </div>
                <ul class="feature-grid feature-grid--3">
{feat(environment, 'icon--sage')}
                </ul>
            </div>
        </section>

        <section class="section section--mist" id="daily-routine">
            <div class="container">
                <div class="section-head">
                    <span class="eyebrow">Пример за нашия ден</span>
                    <h2>Дневен режим</h2>
                </div>
                <ol class="timeline">
{routine}
                </ol>
            </div>
        </section>

        <section class="section" id="pricing">
            <div class="container">
                <div class="section-head section-head--center"><h2>График и ценоразпис</h2></div>
                <figure class="price-image">
                    <a href="media/price-list.webp" target="_blank" rel="noopener"><img src="media/price-list.webp" alt="Ценоразпис на Sí bebé" width="1024" height="1536" loading="lazy"></a>
                </figure>
                <p style="text-align: center; margin-top: 36px;"><a class="btn" href="contact.html#booking">Запиши час</a></p>
            </div>
        </section>'''
    return page('baby-center', 'Бебешки център | Sí bebé', 'Дейности, услуги, възрастови групи, адаптация и дневен режим в Sí bebé – център за ранна грижа за деца от 0 до 36 месеца във Варна.', body)


def build_academy():
    items = [('calendar', 'Събития', 'Предстоящи и минали лекции и семинари.'),
             ('heart', 'Психологическа подкрепа', 'Групови и индивидуални сесии за преодоляване на следродилна депресия или родителски стрес.'),
             ('expert', 'Срещи с експерти', 'Педиатри, консултанти по сън и захранване.'),
             ('chat', 'Родителска общност', 'Дискусионен клуб за обмен на опит.'),
             ('book', 'Блог', 'Статии на тема здраве, възпитание и игри у дома.')]
    cards = '\n'.join(f'''                    <article class="card">
                        {icon(ic, 'icon--gold' if i % 2 else 'icon--sage')}
                        <h3>{t}</h3>
                        <p>{x}</p>
                    </article>''' for i, (ic, t, x) in enumerate(items))
    body = f'''{intro('Академия за родители', 'academy-intro', 'Възпитателка играе с две малки деца на масичка с дървени играчки', subtitle='Вашето място за въпроси и отговори', lead='<p class="lead">Тук не сте сами в предизвикателствата на родителството.</p>')}

        <section class="section section--white">
            <div class="container">
                <div class="goals">
{cards}
                </div>
            </div>
        </section>

{cta_band()}'''
    return page('academy', 'Академия за родители | Sí bebé', 'Лекции, семинари, психологическа подкрепа и срещи с педиатри и консултанти по сън и захранване за родители във Варна.', body)


def form_field(label, inner, fid):
    return f'''                        <div class="field">
                            <label for="{fid}">{label} <span>*</span></label>
{inner}
                        </div>'''


def build_partners():
    cats = [('medical', 'Медицински'), ('edu', 'Образователни'), ('star', 'Бранд'), ('media', 'Медийни'), ('corp', 'Корпоративни')]
    cats_html = '\n'.join(f'                    <li>{icon(ic, "icon--sage" if i % 2 else "icon--gold")}<h3>{t}</h3></li>' for i, (ic, t) in enumerate(cats))
    fields = '\n'.join([
        form_field('Име и фамилия', '''                            <div class="field-row">
                                <input id="p-first" type="text" name="first_name" placeholder="Име" autocomplete="given-name" required>
                                <input type="text" name="last_name" placeholder="Фамилия" aria-label="Фамилия" autocomplete="family-name" required>
                            </div>''', 'p-first'),
        form_field('Име на компания', '                            <input id="p-company" type="text" name="company" placeholder="Име на компания" autocomplete="organization" required>', 'p-company'),
        form_field('Имейл', '                            <input id="p-email" type="email" name="email" placeholder="Имейл" autocomplete="email" required>', 'p-email'),
        form_field('Телефон', '                            <input id="p-phone" type="tel" name="phone" placeholder="+359" autocomplete="tel" required>', 'p-phone'),
    ])
    body = f'''{intro('Заедно предлагаме най-доброто.', 'partners-intro', 'Деца играят с дървени играчки в светла занималня', eyebrow='Партньори')}

        <section class="section section--white">
            <div class="container">
                <h2 class="visually-hidden">Партньори</h2>
                <ul class="partner-cats">
{cats_html}
                </ul>
            </div>
        </section>

        <section class="section section--peach form-band">
            <div class="container">
                <div class="section-head">
                    <h2>Стани наш партньор</h2>
                    <p class="lead">Вярвате в нашата кауза? Попълнете формата по-долу и нека работим заедно.</p>
                </div>
                <div class="form-card">
                    <form class="form" data-form="partner" novalidate>
                        <div class="hp" aria-hidden="true"><label>Уебсайт <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
{fields}
                        <div class="field field--consent">
                            <label class="consent"><input type="checkbox" name="privacy_ack" value="Да" required> <span>Запознат/а съм с <a href="privacy.html" target="_blank" data-privacy-dialog>Политиката за поверителност</a>.</span></label>
                        </div>
                        <button type="submit" class="btn">Изпрати</button>
                    </form>
                </div>
            </div>
        </section>'''
    return page('partners', 'Партньори | Sí bebé', 'Медицински, образователни, бранд, медийни и корпоративни партньори на Sí bebé. Станете наш партньор.', body)


def build_gallery():
    filters = [('all', 'Всички'), ('workshops', 'Тематични работилнички'), ('activities', 'Занимания'), ('events', 'Събития'), ('interior', 'Интериор')]
    f_html = '\n'.join(f'                    <button type="button" class="filter" data-filter="{k}" aria-pressed="{"true" if k == "all" else "false"}">{t}</button>' for k, t in filters)
    body = f'''{intro('Галерия', 'gallery-intro', 'Деца играят с дървени играчки в светла занималня', subtitle='Разгледайте магията в снимки')}

        <section class="section section--white">
            <div class="container">
                <div class="filters" role="group" aria-label="Категории снимки">
{f_html}
                </div>
                <div class="mosaic" data-gallery><p class="loading-note">Зареждане...</p></div>
            </div>
        </section>

{cta_band()}'''
    return page('gallery', 'Галерия | Sí bebé', 'Снимки от работилнички, занимания, събития и интериора на бебешки център Sí bebé във Варна.', body)


def build_shop():
    body = f'''{intro('Магазин', 'shop-intro', 'Бебе играе с дървена играчка на килима', subtitle='В процес на изграждане', lead='<p class="lead">Скоро тук ще намерите подбрани играчки и помагала за вашето бебе.</p>')}

{cta_band()}'''
    return page('shop', 'Магазин | Sí bebé', 'Скоро тук ще намерите подбрани играчки и помагала за вашето бебе от Sí bebé.', body)


def build_contact():
    contact_items = f'''<ul class="contact-list">
                        <li>{icon('pin', 'icon--gold')}<div><h3>Адрес</h3><p>{ADDRESS}</p></div></li>
                        <li>{icon('phone', 'icon--gold')}<div><h3>Телефони</h3><p><a class="contact-link" href="tel:+359879919779">0879 919 779</a> ; <a class="contact-link" href="tel:+359882915978">0882 915 978</a></p></div></li>
                        <li>{icon('mail', 'icon--gold')}<div><h3>Имейл</h3><p><button type="button" class="copy" data-copy="{EMAIL}">{EMAIL}</button></p></div></li>
                        <li>{icon('clock', 'icon--gold')}<div><h3>Работно време</h3><p>Понеделник – Петък (7:30–18:30)<br>Събота и Неделя 9:00–17:00</p></div></li>
                        <li>{icon('share', 'icon--gold')}<div><h3>Социални мрежи</h3><div class="socials"><a href="{FACEBOOK}" target="_blank" rel="noopener" aria-label="Facebook">{svg('facebook', 20, 1.8)}</a><a href="{INSTAGRAM}" target="_blank" rel="noopener" aria-label="Instagram">{svg('instagram', 20, 1.8)}</a><a href="mailto:{EMAIL}" aria-label="Имейл">{svg('mail', 20, 1.8)}</a></div></div></li>
                    </ul>'''
    fields = '\n'.join([
        form_field('Име на родител', '''                            <div class="field-row">
                                <input id="b-parent" type="text" name="parent_first_name" placeholder="Име" autocomplete="given-name" required>
                                <input type="text" name="parent_last_name" placeholder="Фамилия" aria-label="Фамилия на родителя" autocomplete="family-name" required>
                            </div>''', 'b-parent'),
        form_field('Имейл', '                            <input id="b-email" type="email" name="email" placeholder="Имейл" autocomplete="email" required>', 'b-email'),
        form_field('Телефон', '                            <input id="b-phone" type="tel" name="phone" placeholder="+359" autocomplete="tel" required>', 'b-phone'),
        form_field('Име на дете', '''                            <div class="field-row">
                                <input id="b-child" type="text" name="child_first_name" placeholder="Име" required>
                                <input type="text" name="child_last_name" placeholder="Фамилия" aria-label="Фамилия на детето" required>
                            </div>''', 'b-child'),
        form_field('Възраст на дете', '''                            <select id="b-age" name="child_age" required>
                                <option value="">--- Избери ---</option>
                                <option value="0–6 месеца">0–6 месеца</option>
                                <option value="6–12 месеца">6–12 месеца</option>
                                <option value="12–24 месеца">12–24 месеца</option>
                                <option value="24–36 месеца">24–36 месеца</option>
                            </select>''', 'b-age'),
    ])
    body = f'''        <section class="page-intro page-intro--contact">
            {INTRO_DECO}
            <div class="container">
                <div class="intro-text">
                    <h1>Контакти</h1>
                    {contact_items}
                </div>
                <div class="intro-media">
                    <div class="blob blob--back" aria-hidden="true"></div>
                    <div class="blob"><img src="media/contact-intro.webp" alt="Възпитателка играе с две малки деца на масичка с дървени играчки" width="360" height="450"></div>
                </div>
            </div>
        </section>

        <section class="section section--mint form-band">
            <div class="container">
                <div class="section-head">
                    <h2>Запишете час онлайн</h2>
                    <p class="lead">{HOURS}</p>
                </div>
                <div class="form-card" id="booking">
                    <h2>Запиши час</h2>
                    <form class="form" data-form="booking" novalidate>
                        <div class="hp" aria-hidden="true"><label>Уебсайт <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
{fields}
                        <div class="field field--consent">
                            <label class="consent"><input type="checkbox" name="privacy_ack" value="Да" required> <span>Запознат/а съм с <a href="privacy.html" target="_blank" data-privacy-dialog>Политиката за поверителност</a>.</span></label>
                        </div>
                        <button type="submit" class="btn">Запиши се</button>
                    </form>
                </div>
            </div>
        </section>

        <section class="section section--white">
            <div class="container">
                <div class="map-head">
                    <h2>{ADDRESS}</h2>
                    <a class="btn btn--ghost" href="https://www.google.com/maps/dir/?api=1&amp;destination={MAP_Q}" target="_blank" rel="noopener">Упътване</a>
                </div>
                <div class="map"><iframe src="https://www.google.com/maps?q={MAP_Q}&amp;output=embed" title="Карта: {ADDRESS}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>
            </div>
        </section>'''
    return page('contact', 'Контакти | Sí bebé', 'Sí bebé, ул. „Братя Миладинови“ 68, Варна. Телефони 0879 919 779 и 0882 915 978. Запишете час онлайн.', body)


def build_privacy():
    text = open(os.path.join(OUT, 'tools', 'privacy.html')).read().strip()
    body = f'''        <section class="page-intro page-intro--legal">
            <div class="container">
                <div class="intro-text">
                    <h1>Политика за поверителност</h1>
                </div>
            </div>
        </section>

        <section class="section section--white">
            <div class="container">
                <article class="legal">
{text}
                </article>
            </div>
        </section>'''
    return page('privacy', 'Политика за поверителност | Sí bebé', 'Как Sí bebé обработва личните данни от формите на сайта, какви бисквитки използва и какви са вашите права.', body)


def build_404():
    body = f'''        <section class="page-intro page-intro--legal">
            {INTRO_DECO}
            <div class="container">
                <div class="intro-text">
                    <h1>Страницата не е намерена</h1>
                    <p class="lead">Връзката може да е стара или адресът да е изписан грешно.</p>
                    <div class="btn-row">
                        <a class="btn" href="/">Начало {svg('arrow', 18, 2.2)}</a>
                        <a class="btn btn--ghost" href="/contact.html">Контакти</a>
                    </div>
                </div>
            </div>
        </section>'''
    html = page('404', 'Страницата не е намерена | Sí bebé', 'Страницата не е намерена.', body)
    # Served for any missing URL, so links must work from every folder depth
    html = html.replace('<link rel="canonical" href="https://sibebe.bg/404.html">\n    ', '<meta name="robots" content="noindex">\n    ')
    return re.sub(r'(href|src)="(?!https?:|/|#|mailto:|tel:)', r'\1="/', html)


PAGES = {
    'index.html': build_home,
    'about.html': build_about,
    'baby-center.html': build_baby,
    'academy.html': build_academy,
    'partners.html': build_partners,
    'gallery.html': build_gallery,
    'shop.html': build_shop,
    'contact.html': build_contact,
    'privacy.html': build_privacy,
    '404.html': build_404,
}

# Every photo on the site has its own slot. The admin panel replaces the file in /media.
SLOTS = [
    ('logo', 'Лого', 'Логото в менюто и футъра (квадратно, с прозрачен фон)', 'logo-purple.webp'),
    ('home-hero', 'Начало', 'Голямата снимка горе', 'hero-bg.webp'),
    ('home-pillars', 'Начало', 'Четирите стълба', 'vission.webp'),
    ('about-intro', 'За нас', 'Снимка горе', 'hero-bg.webp'),
    ('about-mission', 'За нас', 'Мисия', 'missions.webp'),
    ('baby-intro', 'Бебешки център', 'Снимка горе', 'vission.webp'),
    ('baby-expertise', 'Бебешки център', 'Експертност и спокойствие', 'hero-bg.webp'),
    ('baby-adaptation', 'Бебешки център', 'Адаптация', 'missions.webp'),
    ('price-list', 'Бебешки център', 'Ценоразпис', 'price-list.webp'),
    ('academy-intro', 'Академия за родители', 'Снимка горе', 'missions.webp'),
    ('partners-intro', 'Партньори', 'Снимка горе', 'vission.webp'),
    ('gallery-intro', 'Галерия', 'Снимка горе', 'vission.webp'),
    ('shop-intro', 'Магазин', 'Снимка горе', 'hero-bg.webp'),
    ('contact-intro', 'Контакти', 'Снимка горе', 'missions.webp'),
    ('share', 'Споделяне', 'Снимка при споделяне във Facebook и Viber (1200 × 630)', 'og-image.jpg'),
]


def write_slots():
    import shutil
    media = os.path.join(OUT, 'media')
    os.makedirs(media, exist_ok=True)
    rows = []
    for slot, page_name, label, default in SLOTS:
        ext = default.rsplit('.', 1)[1]
        target = os.path.join(media, f'{slot}.{ext}')
        if not os.path.exists(target):
            shutil.copyfile(os.path.join(OUT, 'assets', 'img', default), target)
        rows.append(f"    '{slot}' => ['page' => '{page_name}', 'label' => '{label}', 'file' => 'media/{slot}.{ext}', 'default' => 'assets/img/{default}'],")
    with open(os.path.join(OUT, 'api', 'slots.php'), 'w') as f:
        f.write("<?php\n// Generated by tools/build.py: every replaceable photo on the site.\nreturn [\n" + '\n'.join(rows) + "\n];\n")


write_slots()

def clean_links(html):
    """Internal links without .html: about.html -> about, index.html -> ./ (the server maps them back)."""
    html = re.sub(r'href="(/?)index\.html"', lambda m: 'href="' + (m.group(1) or './') + '"', html)
    return re.sub(r'href="(/?[a-z0-9-]+)\.html(#[^"]*)?"', lambda m: f'href="{m.group(1)}{m.group(2) or ""}"', html)


# ---------- Texts an admin can edit on the page ----------
# Every heading, paragraph and list item that holds only text (plus bold/italic/links/line breaks)
# gets data-edit="<key>". The key is a hash of the original text, so the same sentence on several
# pages (footer, booking band) is edited once everywhere. render.php swaps in the saved versions.
import hashlib

EDIT_TAGS = 'h1|h2|h3|h4|p|li|figcaption'
BLOCKING = r'h[1-6]|p|li|div|ul|ol|section|article|figure|form|nav|header|footer|main|svg|span|button|label|select|input|img|textarea|iframe|blockquote|table|dialog|picture|video'
EDITABLE = re.compile(
    r'<(' + EDIT_TAGS + r')((?:\s[^>]*)?)>((?:(?!</?(?:' + BLOCKING + r')\b)[\s\S])*?)</\1>')
NO_EDIT_ZONES = re.compile(r'<head>[\s\S]*?</head>|<form\b[\s\S]*?</form>')

# Buttons and contact links: only their words are editable, so the label is wrapped in a span.
# data-edit-kind tells the server what it holds: a phone (the tel: link follows it), an e-mail
# (mailto: link and the copy button follow it) or a plain button label.
ONE_SVG = r'<svg\b(?:(?!</svg>)[\s\S])*</svg>'  # a single icon, never running into the next element
LABEL_FIRST = re.compile(r'<(a|button)(\s[^>]*)>(\s*)([^<]*[^\s<])(\s*)(' + ONE_SVG + r')?(\s*)</\1>')
ICON_FIRST = re.compile(r'<(a|button)(\s[^>]*)>(\s*' + ONE_SVG + r'\s*)([^<]*[^\s<])(\s*)</\1>')
TOGGLE_LABEL = re.compile(r'<span class="(when-closed|when-open)">([^<]+)</span>')


def label_kind(tag, attrs, text):
    if re.search(r'\bhref="tel:', attrs):
        return 'tel'
    if re.search(r'\bhref="mailto:', attrs) or (re.search(r'\bdata-copy="', attrs) and '@' in text):
        return 'email'
    if tag == 'button' or re.search(r'\bclass="[^"]*\bbtn\b', attrs):
        return 'label'
    return None


def edit_span(kind, text):
    return f'<span data-edit="{text_key(kind + ":" + text)}" data-edit-kind="{kind}">{text}</span>'


def mark_controls(html):
    def label_first(m):
        tag, attrs, sp1, text, sp2, icon, sp3 = m.groups()
        kind = label_kind(tag, attrs, text)
        if not kind or 'data-edit' in attrs:
            return m.group(0)
        return f'<{tag}{attrs}>{sp1}{edit_span(kind, text)}{sp2}{icon or ""}{sp3}</{tag}>'

    def icon_first(m):
        tag, attrs, icon, text, sp = m.groups()
        kind = label_kind(tag, attrs, text)
        if not kind or 'data-edit' in attrs:
            return m.group(0)
        return f'<{tag}{attrs}>{icon}{edit_span(kind, text)}{sp}</{tag}>'

    html = LABEL_FIRST.sub(label_first, html)
    html = ICON_FIRST.sub(icon_first, html)
    return TOGGLE_LABEL.sub(lambda m: f'<span class="{m.group(1)}" data-edit="{text_key("label:" + m.group(2))}" data-edit-kind="label">{m.group(2)}</span>', html)


def text_key(inner):
    return hashlib.sha1(re.sub(r'\s+', ' ', inner).strip().encode('utf-8')).hexdigest()[:12]


def mark_editable(html):
    head, sep, body = html.partition('</head>')
    html = head + sep + mark_controls(body)
    zones = []

    def hide(m):
        zones.append(m.group(0))
        return f'\x00{len(zones) - 1}\x00'

    html = NO_EDIT_ZONES.sub(hide, html)

    def mark(m):
        tag, attrs, inner = m.group(1), m.group(2), m.group(3)
        if not inner.strip() or 'loading-note' in attrs or 'data-edit' in attrs or 'data-edit' in inner or '\x00' in inner:
            return m.group(0)
        if re.fullmatch(r'\s*<a\b[^>]*>[^<]*</a>\s*', inner):  # menu and phone links stay links
            return m.group(0)
        return f'<{tag}{attrs} data-edit="{text_key(inner)}">{inner}</{tag}>'

    html = EDITABLE.sub(mark, html)
    return re.sub(r'\x00(\d+)\x00', lambda m: zones[int(m.group(1))], html)


for name, fn in PAGES.items():
    with open(os.path.join(OUT, name), 'w') as f:
        f.write(mark_editable(clean_links(fn())))
print('built', ', '.join(PAGES))
