<?php
/* Sí bebé – admin panel: bookings, partners, reviews, gallery, events, price list. */

declare(strict_types=1);
require __DIR__ . '/../api/lib.php';

header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');

start_admin_session();

/* ---------- Small helpers ---------- */
function csrf(): string
{
    $_SESSION['csrf'] ??= bin2hex(random_bytes(16));
    return $_SESSION['csrf'];
}
function csrf_field(): string
{
    return '<input type="hidden" name="csrf" value="' . csrf() . '">';
}
function check_csrf(): void
{
    if (post_too_large()) {
        flash('Файловете са твърде големи общо. Качете по-малко снимки наведнъж.', 'error');
        go($_GET['p'] ?? 'dashboard');
    }
    if (!hash_equals($_SESSION['csrf'] ?? '', (string) ($_POST['csrf'] ?? ''))) {
        flash('Страницата беше отворена твърде дълго. Опитайте отново.', 'error');
        go($_GET['p'] ?? 'dashboard');
    }
}
function flash(string $message, string $type = 'ok'): void
{
    $_SESSION['flash'] = [$type, $message];
}
/* Login and setup show messages inside their card instead of the toast area */
function take_flash_error(): string
{
    $flash = $_SESSION['flash'] ?? null;
    unset($_SESSION['flash']);
    return $flash ? $flash[1] : '';
}
function go(string $page, array $query = [], string $anchor = ''): void
{
    header('Location: ?' . http_build_query(['p' => $page] + $query) . ($anchor !== '' ? '#' . $anchor : ''));
    exit;
}
function fmt_date(?string $value, bool $time = true): string
{
    return $value ? date($time ? 'd.m.Y H:i' : 'd.m.Y', strtotime($value)) : '';
}
function icon(string $name): string
{
    $paths = [
        'calendar' => '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
        'users' => '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2c2.8.4 5 2.8 5 5.8"/>',
        'star' => '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>',
        'photo' => '<rect x="3" y="5" width="18" height="15" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M21 17l-5-5-8 8"/>',
        'event' => '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.5 2.5M15.2 15.2l2.5 2.5M6.3 17.7l2.5-2.5M15.2 8.8l2.5-2.5"/>',
        'doc' => '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
        'key' => '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/>',
        'home' => '<path d="M3 11l9-8 9 8v10H3z"/><path d="M9 21v-6h6v6"/>',
        'out' => '<path d="M15 4h4v16h-4M10 17l5-5-5-5M15 12H3"/>',
        'clock' => '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
        'image' => '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.8"/><path d="M21 15l-5-5L5 21"/>',
    ];
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' . ($paths[$name] ?? '') . '</svg>';
}

/* ---------- First run: database settings and the first admin ---------- */
$configured = (bool) config();
$hasAdmin = false;
if ($configured) {
    try {
        $hasAdmin = (int) db()->query("SELECT COUNT(*) FROM admins")->fetchColumn() > 0;
    } catch (Throwable $e) {
        // Missing tables mean setup is unfinished; anything else is the database being down,
        // and then the setup page must not be shown to whoever opens /admin
        if (!($e instanceof PDOException && $e->getCode() === '42S02')) {
            error_log('Sí bebé admin: ' . $e->getMessage());
            http_response_code(503);
            render_head('Временно недостъпно');
            echo '<main class="auth"><div class="auth-card"><img src="../media/logo.webp" alt="Sí bebé" width="72" height="72"><h1>Временно недостъпно</h1><p class="muted">Базата данни не отговаря в момента. Опитайте отново след няколко минути.</p><a class="btn" href="./">Опитай отново</a></div></main>';
            render_foot();
            exit;
        }
    }
}

if (!$hasAdmin) {
    $error = take_flash_error();
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        check_csrf();
        $c = $configured ? config() : [
            'db_host' => clean($_POST['db_host'] ?? 'localhost'),
            'db_name' => clean($_POST['db_name'] ?? ''),
            'db_user' => clean($_POST['db_user'] ?? ''),
            'db_pass' => (string) ($_POST['db_pass'] ?? ''),
            'notify_email' => clean($_POST['notify_email'] ?? ''),
            'secret' => bin2hex(random_bytes(24)),
        ];
        $user = clean($_POST['username'] ?? '', 60);
        $pass = (string) ($_POST['password'] ?? '');
        try {
            if ($user === '' || mb_strlen($pass) < 10) {
                throw new RuntimeException('Въведете потребителско име и парола от поне 10 знака.');
            }
            $pdo = connect_db($c['db_host'], $c['db_name'], $c['db_user'], $c['db_pass']);
            foreach (schema() as $sql) {
                $pdo->exec($sql);
            }
            if (!$configured) {
                $php = "<?php\n// Created by the Sí bebé setup. Keep this file private.\nreturn " . var_export($c, true) . ";\n";
                if (file_put_contents(__DIR__ . '/../api/config.php', $php) === false) {
                    throw new RuntimeException('Файлът api/config.php не може да бъде записан. Проверете правата на папка api.');
                }
                @chmod(__DIR__ . '/../api/config.php', 0600);
            }
            $pdo->prepare("INSERT INTO admins (username, password_hash) VALUES (?, ?)")->execute([$user, password_hash($pass, PASSWORD_DEFAULT)]);
            session_regenerate_id(true);
            $_SESSION['admin'] = $user;
            set_editor_marker(true);
            flash('Готово! Админ панелът е настроен.');
            go('dashboard');
        } catch (PDOException $e) {
            // Say which part is wrong, so the setup can be fixed without guessing
            $code = (int) ($e->errorInfo[1] ?? 0);
            $msg = $e->getMessage();
            if ($code === 1045 || str_contains($msg, '[1045]')) {
                $error = 'Грешен потребител или парола за базата. Проверете ги в cPanel → Manage My Databases.';
            } elseif ($code === 1044 || str_contains($msg, '[1044]')) {
                $error = 'Потребителят няма права за тази база. В cPanel → Add User To Database го добавете с ALL PRIVILEGES.';
            } elseif ($code === 1049 || str_contains($msg, '[1049]')) {
                $error = 'Няма база с това име. Въведете пълното име с представката, например lyfd3tab_site.';
            } elseif ($code === 2002 || str_contains($msg, '[2002]')) {
                $error = 'Сървърът на базата не отговаря. Оставете „localhost“.';
            } else {
                $error = 'Няма връзка с базата данни. Проверете данните.';
            }
            error_log('SI BEBE setup: ' . $msg);
        } catch (Throwable $e) {
            $error = $e->getMessage();
        }
    }
    render_head('Първоначална настройка');
    ?>
    <main class="auth">
        <form class="auth-card" method="post" autocomplete="off">
            <img src="../media/logo.webp" alt="Sí bebé" width="72" height="72">
            <h1>Първоначална настройка</h1>
            <?php if ($error): ?><p class="toast toast--error" role="alert"><?= h($error) ?></p><?php endif; ?>
            <?= csrf_field() ?>
            <?php if (!$configured): ?>
                <p class="muted">Данните за базата са в контролния панел на хостинга, в раздел „MySQL бази данни“.</p>
                <label>Сървър на базата<input name="db_host" value="localhost" required></label>
                <label>Име на базата<input name="db_name" required></label>
                <label>Потребител на базата<input name="db_user" required></label>
                <label>Парола на базата<input name="db_pass" type="password"></label>
                <label>Имейл за известия при нова заявка<input name="notify_email" type="email" placeholder="sibebe.bg@gmail.com"></label>
                <hr>
            <?php endif; ?>
            <label>Потребителско име за админ панела<input name="username" required autocomplete="username"></label>
            <label>Парола (поне 10 знака)<input name="password" type="password" minlength="10" required autocomplete="new-password"></label>
            <button class="btn" type="submit">Запази</button>
        </form>
    </main>
    <?php
    render_foot();
    exit;
}

/* ---------- Login ---------- */
if (isset($_GET['logout'])) {
    $_SESSION = [];
    session_destroy();
    set_editor_marker(false);
    header('Location: ./');
    exit;
}

if (empty($_SESSION['admin'])) {
    $error = take_flash_error();
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        check_csrf();
        if (too_many('login', 5, 15)) {
            $error = 'Твърде много опити. Опитайте отново след 15 минути.';
        } else {
            $stmt = db()->prepare("SELECT username, password_hash FROM admins WHERE username = ?");
            $stmt->execute([clean($_POST['username'] ?? '', 60)]);
            $row = $stmt->fetch();
            if ($row && password_verify((string) ($_POST['password'] ?? ''), $row['password_hash'])) {
                clear_hits('login');
                session_regenerate_id(true);
                $_SESSION['admin'] = $row['username'];
                set_editor_marker(true);
                // Back to the page the link pointed at, e.g. a request opened from the notification e-mail
                $back = array_intersect_key($_GET, array_flip(['p', 'entry', 'view']));
                if (preg_match('/^[a-z]+$/', (string) ($back['p'] ?? ''))) {
                    go($back['p'], array_diff_key($back, ['p' => 1]));
                }
                go('dashboard');
            }
            record_hit('login');
            $error = 'Грешно потребителско име или парола.';
        }
    }
    render_head('Вход');
    ?>
    <main class="auth">
        <form class="auth-card" method="post">
            <img src="../media/logo.webp" alt="Sí bebé" width="72" height="72">
            <h1>Админ панел</h1>
            <?php if ($error): ?><p class="toast toast--error" role="alert"><?= h($error) ?></p><?php endif; ?>
            <?= csrf_field() ?>
            <label>Потребителско име<input name="username" value="<?= h($_POST['username'] ?? '') ?>" required autocomplete="username"<?= empty($_POST['username']) ? ' autofocus' : '' ?>></label>
            <label>Парола<input name="password" type="password" required autocomplete="current-password"></label>
            <button class="btn" type="submit">Вход</button>
        </form>
    </main>
    <?php
    render_foot();
    exit;
}

/* ---------- Logged in ---------- */
purge_old_data();
$pdo = db();
$page = $_GET['p'] ?? 'dashboard';

/* CSV export for Excel */
if (isset($_GET['export']) && in_array($page, ['bookings', 'partners'], true)) {
    $columns = $page === 'bookings'
        ? ['created_at' => 'Дата', 'parent_first_name' => 'Име на родител', 'parent_last_name' => 'Фамилия на родител', 'email' => 'Имейл', 'phone' => 'Телефон', 'child_first_name' => 'Име на дете', 'child_last_name' => 'Фамилия на дете', 'child_age' => 'Възраст', 'status' => 'Статус', 'note' => 'Бележка']
        : ['created_at' => 'Дата', 'first_name' => 'Име', 'last_name' => 'Фамилия', 'company' => 'Компания', 'email' => 'Имейл', 'phone' => 'Телефон', 'status' => 'Статус', 'note' => 'Бележка'];
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="sibebe-' . $page . '-' . date('Y-m-d') . '.csv"');
    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF");
    fputcsv($out, array_values($columns), ';', '"', '');
    foreach ($pdo->query("SELECT * FROM {$page} ORDER BY created_at DESC") as $row) {
        $row['status'] = $row['status'] === 'new' ? 'Нова' : 'Обработена';
        // Stop spreadsheet formulas from running, but leave phone numbers like +359... as they are
        fputcsv($out, array_map(fn ($k) => preg_replace('/^([=@\t\r]|[+\-](?![\d\s]))/', "'$1", (string) $row[$k]), array_keys($columns)), ';', '"', '');
    }
    exit;
}

/* Actions */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    $action = $_POST['action'] ?? '';
    $id = (int) ($_POST['id'] ?? 0);
    try {
        switch ($action) {
            case 'status':
                $table = $_POST['table'] === 'partners' ? 'partners' : 'bookings';
                $status = $_POST['status'] === 'handled' ? 'handled' : 'new';
                $pdo->prepare("UPDATE {$table} SET status = ? WHERE id = ?")->execute([$status, $id]);
                go($table, ['view' => $_POST['view'] ?? 'all']);
            case 'note':
                $table = $_POST['table'] === 'partners' ? 'partners' : 'bookings';
                $pdo->prepare("UPDATE {$table} SET note = ? WHERE id = ?")->execute([clean($_POST['note'] ?? '', 1000), $id]);
                flash('Бележката е запазена.');
                go($table, ['view' => $_POST['view'] ?? 'all']);
            case 'delete_entry':
                $table = $_POST['table'] === 'partners' ? 'partners' : 'bookings';
                $pdo->prepare("DELETE FROM {$table} WHERE id = ?")->execute([$id]);
                flash('Заявката е изтрита.');
                go($table, ['view' => $_POST['view'] ?? 'all']);

            case 'save_review':
                $data = [clean($_POST['author'] ?? '', 120), clean_text($_POST['text'] ?? '', 2000), max(1, min(5, (int) ($_POST['stars'] ?? 5))), isset($_POST['visible']) ? 1 : 0];
                if ($data[0] === '' || $data[1] === '') {
                    throw new RuntimeException('Попълнете име и текст на отзива.');
                }
                if ($id) {
                    $pdo->prepare("UPDATE reviews SET author = ?, text = ?, stars = ?, visible = ? WHERE id = ?")->execute([...$data, $id]);
                } else {
                    $pdo->prepare("INSERT INTO reviews (author, text, stars, visible) VALUES (?, ?, ?, ?)")->execute($data);
                }
                flash('Отзивът е запазен.');
                go('reviews');
            case 'delete_review':
                $pdo->prepare("DELETE FROM reviews WHERE id = ?")->execute([$id]);
                flash('Отзивът е изтрит.');
                go('reviews');

            case 'upload_gallery':
                $files = $_FILES['photos'] ?? null;
                $category = array_key_exists($_POST['category'] ?? '', gallery_categories()) ? $_POST['category'] : '';
                $alt = clean($_POST['alt'] ?? '', 190) ?: 'Снимка от Sí bebé';
                $count = 0;
                $failed = [];
                foreach ((array) ($files['name'] ?? []) as $i => $name) {
                    try {
                        $path = save_upload(['name' => $name, 'tmp_name' => $files['tmp_name'][$i], 'error' => $files['error'][$i], 'size' => $files['size'][$i]]);
                        $pdo->prepare("INSERT INTO gallery (file, alt, category) VALUES (?, ?, ?)")->execute([$path, $alt, $category]);
                        $count++;
                    } catch (RuntimeException $e) {
                        $failed[] = $name . ': ' . $e->getMessage();
                    }
                }
                flash($count ? "Качени снимки: {$count}." . ($failed ? ' Неуспешни: ' . implode('; ', $failed) : '') : 'Няма качени снимки. ' . implode('; ', $failed), $count ? 'ok' : 'error');
                go('gallery');
            case 'cat_add':
                $label = clean($_POST['label'] ?? '', 80);
                if ($label === '') {
                    throw new RuntimeException('Въведете име на категорията.');
                }
                if (in_array(mb_strtolower($label), array_map('mb_strtolower', gallery_categories()), true)) {
                    throw new RuntimeException('Вече има категория „' . $label . '“.');
                }
                $sort = (int) $pdo->query("SELECT COALESCE(MAX(sort), 0) + 1 FROM gallery_categories")->fetchColumn();
                $pdo->prepare("INSERT INTO gallery_categories (slug, label, sort) VALUES (?, ?, ?)")->execute([category_slug($label), $label, $sort]);
                flash('Добавена е категория „' . $label . '“.');
                go('gallery', [], 'cats');
            case 'cat_rename':
                $label = clean($_POST['label'] ?? '', 80);
                $slug = (string) ($_POST['slug'] ?? '');
                if ($label === '' || !isset(gallery_categories()[$slug])) {
                    throw new RuntimeException('Въведете име на категорията.');
                }
                $pdo->prepare("UPDATE gallery_categories SET label = ? WHERE slug = ?")->execute([$label, $slug]);
                flash('Категорията е преименувана на „' . $label . '“.');
                go('gallery', [], 'cats');
            case 'cat_delete':
                $slug = (string) ($_POST['slug'] ?? '');
                $label = gallery_categories()[$slug] ?? '';
                $pdo->prepare("UPDATE gallery SET category = '' WHERE category = ?")->execute([$slug]);
                $pdo->prepare("DELETE FROM gallery_categories WHERE slug = ?")->execute([$slug]);
                flash('Категорията „' . $label . '“ е изтрита. Снимките ѝ остават в галерията без категория.');
                go('gallery', [], 'cats');
            case 'cat_move':
                $slugs = array_keys(gallery_categories());
                $pos = array_search((string) ($_POST['slug'] ?? ''), $slugs, true);
                $to = $pos === false ? false : $pos + (($_POST['dir'] ?? '') === 'up' ? -1 : 1);
                if ($pos !== false && isset($slugs[$to])) {
                    [$slugs[$pos], $slugs[$to]] = [$slugs[$to], $slugs[$pos]];
                }
                $stmt = $pdo->prepare("UPDATE gallery_categories SET sort = ? WHERE slug = ?");
                foreach ($slugs as $i => $slug) {
                    $stmt->execute([$i + 1, $slug]);
                }
                go('gallery', [], 'cats');
            case 'update_photo':
                $category = array_key_exists($_POST['category'] ?? '', gallery_categories()) ? $_POST['category'] : '';
                $pdo->prepare("UPDATE gallery SET alt = ?, category = ? WHERE id = ?")->execute([clean($_POST['alt'] ?? '', 190), $category, $id]);
                flash('Снимката е обновена.');
                go('gallery', gallery_filter_query());
            case 'delete_photo':
                delete_gallery_photos($pdo, [$id]);
                flash('Снимката е изтрита.');
                go('gallery', gallery_filter_query());
            case 'bulk_photos':
                $ids = array_values(array_filter(array_map('intval', (array) ($_POST['ids'] ?? []))));
                if (!$ids) {
                    throw new RuntimeException('Не сте избрали снимки.');
                }
                if (($_POST['op'] ?? '') === 'delete') {
                    delete_gallery_photos($pdo, $ids);
                    flash('Изтрити снимки: ' . count($ids) . '.');
                } else {
                    $category = (string) ($_POST['category'] ?? '');
                    if ($category !== '' && !isset(gallery_categories()[$category])) {
                        throw new RuntimeException('Изберете категория.');
                    }
                    $marks = implode(',', array_fill(0, count($ids), '?'));
                    $pdo->prepare("UPDATE gallery SET category = ? WHERE id IN ({$marks})")->execute(array_merge([$category], $ids));
                    flash('Преместени снимки: ' . count($ids) . ' → ' . ($category === '' ? 'Без категория' : gallery_categories()[$category]) . '.');
                }
                go('gallery', gallery_filter_query());

            case 'save_event':
                $title = clean($_POST['title'] ?? '', 190);
                $description = clean_text($_POST['description'] ?? '', 3000);
                $date = DateTimeImmutable::createFromFormat('Y-m-d\TH:i', (string) ($_POST['event_date'] ?? ''));
                $link = clean($_POST['link'] ?? '', 500);
                if ($title === '' || !$date) {
                    throw new RuntimeException('Попълнете заглавие и дата на събитието.');
                }
                if ($link !== '' && !preg_match('#^https?://#i', $link)) {
                    throw new RuntimeException('Линкът трябва да започва с http:// или https://');
                }
                $image = null;
                if (!empty($_FILES['image']['name'])) {
                    $image = save_upload($_FILES['image']);
                }
                if ($id) {
                    if ($image) {
                        $stmt = $pdo->prepare("SELECT image FROM events WHERE id = ?");
                        $stmt->execute([$id]);
                        delete_upload($stmt->fetchColumn() ?: null);
                        $pdo->prepare("UPDATE events SET image = ? WHERE id = ?")->execute([$image, $id]);
                    }
                    $pdo->prepare("UPDATE events SET title = ?, description = ?, event_date = ?, link = ? WHERE id = ?")->execute([$title, $description, $date->format('Y-m-d H:i:s'), $link ?: null, $id]);
                } else {
                    $pdo->prepare("INSERT INTO events (title, description, event_date, image, link) VALUES (?, ?, ?, ?, ?)")->execute([$title, $description, $date->format('Y-m-d H:i:s'), $image, $link ?: null]);
                }
                flash('Събитието е запазено.');
                go('events');
            case 'delete_event':
                $stmt = $pdo->prepare("SELECT image FROM events WHERE id = ?");
                $stmt->execute([$id]);
                delete_upload($stmt->fetchColumn() ?: null);
                $pdo->prepare("DELETE FROM events WHERE id = ?")->execute([$id]);
                flash('Събитието е изтрито.');
                go('events');

            case 'save_article':
                ensure_articles_table();
                $title = clean($_POST['title'] ?? '', 190);
                $description = clean_text($_POST['description'] ?? '', 3000);
                $link = clean($_POST['link'] ?? '', 500);
                $visible = isset($_POST['visible']) ? 1 : 0;
                if ($title === '') {
                    throw new RuntimeException('Въведете заглавие на статията.');
                }
                if ($link !== '' && !preg_match('#^https?://#i', $link)) {
                    throw new RuntimeException('Линкът трябва да започва с http:// или https://');
                }
                $image = !empty($_FILES['image']['name']) ? save_upload($_FILES['image']) : null;
                if ($id) {
                    if ($image) {
                        $stmt = $pdo->prepare("SELECT image FROM articles WHERE id = ?");
                        $stmt->execute([$id]);
                        delete_upload($stmt->fetchColumn() ?: null);
                        $pdo->prepare("UPDATE articles SET image = ? WHERE id = ?")->execute([$image, $id]);
                    }
                    $pdo->prepare("UPDATE articles SET title = ?, description = ?, link = ?, visible = ? WHERE id = ?")->execute([$title, $description, $link ?: null, $visible, $id]);
                } else {
                    $pdo->prepare("INSERT INTO articles (title, description, image, link, visible) VALUES (?, ?, ?, ?, ?)")->execute([$title, $description, $image, $link ?: null, $visible]);
                }
                flash('Статията е запазена.');
                go('articles');
            case 'delete_article':
                ensure_articles_table();
                $stmt = $pdo->prepare("SELECT image FROM articles WHERE id = ?");
                $stmt->execute([$id]);
                delete_upload($stmt->fetchColumn() ?: null);
                $pdo->prepare("DELETE FROM articles WHERE id = ?")->execute([$id]);
                flash('Статията е изтрита.');
                go('articles');

            case 'save_routine':
                ensure_routine_table();
                $from = routine_time((string) ($_POST['time_from'] ?? ''));
                $toRaw = trim((string) ($_POST['time_to'] ?? ''));
                $to = $toRaw === '' ? '' : routine_time($toRaw);
                $text = routine_text($_POST['text'] ?? '');
                if ($from === '' || ($toRaw !== '' && $to === '')) {
                    throw new RuntimeException('Въведете час във вида 07:30.');
                }
                if ($text === '') {
                    throw new RuntimeException('Въведете какво се случва в този час.');
                }
                $focus = isset($_POST['focus']) ? 1 : 0;
                $home = isset($_POST['on_home']) ? 1 : 0;
                if ($id) {
                    $pdo->prepare("UPDATE routine SET time_from = ?, time_to = ?, text = ?, focus = ?, on_home = ? WHERE id = ?")->execute([$from, $to, $text, $focus, $home, $id]);
                } else {
                    // New rows go in their place by start time
                    $sort = (int) $pdo->query("SELECT COALESCE(MAX(sort), 0) + 1 FROM routine")->fetchColumn();
                    $pdo->prepare("INSERT INTO routine (time_from, time_to, text, focus, on_home, sort) VALUES (?, ?, ?, ?, ?, ?)")->execute([$from, $to, $text, $focus, $home, $sort]);
                    $ids = $pdo->query("SELECT id FROM routine ORDER BY time_from, sort, id")->fetchAll(PDO::FETCH_COLUMN);
                    $stmt = $pdo->prepare("UPDATE routine SET sort = ? WHERE id = ?");
                    foreach ($ids as $i => $rowId) {
                        $stmt->execute([$i + 1, $rowId]);
                    }
                }
                rebuild_routine_cache();
                flash('Дневният режим е запазен.');
                go('routine');
            case 'delete_routine':
                ensure_routine_table();
                $pdo->prepare("DELETE FROM routine WHERE id = ?")->execute([$id]);
                rebuild_routine_cache();
                flash('Редът е изтрит.');
                go('routine');
            case 'move_routine':
                ensure_routine_table();
                $ids = $pdo->query("SELECT id FROM routine ORDER BY sort, id")->fetchAll(PDO::FETCH_COLUMN);
                $pos = array_search($id, array_map('intval', $ids), true);
                $to = $pos === false ? false : $pos + (($_POST['dir'] ?? '') === 'up' ? -1 : 1);
                if ($pos !== false && isset($ids[$to])) {
                    [$ids[$pos], $ids[$to]] = [$ids[$to], $ids[$pos]];
                }
                $stmt = $pdo->prepare("UPDATE routine SET sort = ? WHERE id = ?");
                foreach ($ids as $i => $rowId) {
                    $stmt->execute([$i + 1, $rowId]);
                }
                rebuild_routine_cache();
                go('routine');
            case 'replace_routine':
                ensure_routine_table();
                [$rows, $bad] = parse_routine((string) ($_POST['routine'] ?? ''));
                if ($bad) {
                    throw new RuntimeException('Не разбрах ред ' . implode(', ', $bad) . '. Всеки ред трябва да е във вида: 07:30 - 09:00 - Прием и закуска');
                }
                if (!$rows) {
                    throw new RuntimeException('Поставете поне един ред.');
                }
                // Home page: up to five rows spread over the day; they can be changed afterwards
                $n = count($rows);
                $home = $n <= 5 ? range(0, $n - 1) : array_map(fn ($i) => (int) round($i * ($n - 1) / 4), range(0, 4));
                $pdo->beginTransaction();
                $pdo->exec("DELETE FROM routine");
                $stmt = $pdo->prepare("INSERT INTO routine (time_from, time_to, text, focus, on_home, sort) VALUES (?, ?, ?, 0, ?, ?)");
                foreach ($rows as $i => $row) {
                    $stmt->execute([$row['from'], $row['to'], $row['text'], in_array($i, $home, true) ? 1 : 0, $i + 1]);
                }
                $pdo->commit();
                rebuild_routine_cache();
                flash('Дневният режим е сменен: ' . $n . ' реда.');
                go('routine');

            case 'save_team':
                ensure_team_table();
                $name = clean($_POST['name'] ?? '', 120);
                $role = clean($_POST['role'] ?? '', 160);
                $bio = clean_text($_POST['bio'] ?? '', 3000);
                $visible = isset($_POST['visible']) ? 1 : 0;
                if ($name === '') {
                    throw new RuntimeException('Въведете име.');
                }
                $photo = !empty($_FILES['photo']['name']) ? save_upload($_FILES['photo'], 900) : null;
                if ($id) {
                    if ($photo) {
                        $stmt = $pdo->prepare("SELECT photo FROM team WHERE id = ?");
                        $stmt->execute([$id]);
                        delete_upload($stmt->fetchColumn() ?: null);
                        $pdo->prepare("UPDATE team SET photo = ? WHERE id = ?")->execute([$photo, $id]);
                    } elseif (isset($_POST['remove_photo'])) {
                        $stmt = $pdo->prepare("SELECT photo FROM team WHERE id = ?");
                        $stmt->execute([$id]);
                        delete_upload($stmt->fetchColumn() ?: null);
                        $pdo->prepare("UPDATE team SET photo = NULL WHERE id = ?")->execute([$id]);
                    }
                    $pdo->prepare("UPDATE team SET name = ?, role = ?, bio = ?, visible = ? WHERE id = ?")->execute([$name, $role, $bio, $visible, $id]);
                } else {
                    $sort = (int) $pdo->query("SELECT COALESCE(MAX(sort), 0) + 1 FROM team")->fetchColumn();
                    $pdo->prepare("INSERT INTO team (name, role, bio, photo, sort, visible) VALUES (?, ?, ?, ?, ?, ?)")->execute([$name, $role, $bio, $photo, $sort, $visible]);
                }
                flash('Запазено: ' . $name . '.');
                go('team');
            case 'delete_team':
                ensure_team_table();
                $stmt = $pdo->prepare("SELECT photo FROM team WHERE id = ?");
                $stmt->execute([$id]);
                delete_upload($stmt->fetchColumn() ?: null);
                $pdo->prepare("DELETE FROM team WHERE id = ?")->execute([$id]);
                flash('Човекът е премахнат от екипа.');
                go('team');
            case 'move_team':
                ensure_team_table();
                // Renumber in the current order, then swap with the neighbour
                $ids = $pdo->query("SELECT id FROM team ORDER BY sort, id")->fetchAll(PDO::FETCH_COLUMN);
                $pos = array_search($id, array_map('intval', $ids), true);
                $to = $pos === false ? false : $pos + (($_POST['dir'] ?? '') === 'up' ? -1 : 1);
                if ($pos !== false && isset($ids[$to])) {
                    [$ids[$pos], $ids[$to]] = [$ids[$to], $ids[$pos]];
                }
                $stmt = $pdo->prepare("UPDATE team SET sort = ? WHERE id = ?");
                foreach ($ids as $i => $teamId) {
                    $stmt->execute([$i + 1, $teamId]);
                }
                go('team');

            case 'slot':
                $slot = (string) ($_POST['slot'] ?? '');
                save_slot($_FILES['image'] ?? [], $slot);
                flash('Снимката е сменена: ' . (slots()[$slot]['page'] ?? '') . ' – ' . (slots()[$slot]['label'] ?? ''));
                go('images', ['_' => $slot]);
            case 'slot_reset':
                reset_slot((string) ($_POST['slot'] ?? ''));
                flash('Върната е оригиналната снимка.');
                go('images');
            case 'slot_undo':
                undo_slot((string) ($_POST['slot'] ?? ''));
                flash('Върната е предишната снимка.');
                go('images');

            case 'password':
                $stmt = $pdo->prepare("SELECT password_hash FROM admins WHERE username = ?");
                $stmt->execute([$_SESSION['admin']]);
                if (!password_verify((string) ($_POST['current'] ?? ''), (string) $stmt->fetchColumn())) {
                    throw new RuntimeException('Текущата парола е грешна.');
                }
                $new = (string) ($_POST['new'] ?? '');
                if (mb_strlen($new) < 10 || $new !== ($_POST['repeat'] ?? '')) {
                    throw new RuntimeException('Новата парола трябва да е поне 10 знака и двете полета да съвпадат.');
                }
                $pdo->prepare("UPDATE admins SET password_hash = ? WHERE username = ?")->execute([password_hash($new, PASSWORD_DEFAULT), $_SESSION['admin']]);
                flash('Паролата е сменена.');
                go('account');
            case 'notify':
                $emails = array_filter(array_map('trim', preg_split('/[,;\s]+/', (string) ($_POST['emails'] ?? ''))));
                foreach ($emails as $email) {
                    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                        throw new RuntimeException("Невалиден имейл: {$email}");
                    }
                }
                set_setting('notify_email', implode(', ', $emails));
                flash($emails ? 'Известията ще идват на: ' . implode(', ', $emails) : 'Известията по имейл са изключени.');
                go('account');
            case 'notify_test':
                if (!notify_emails()) {
                    throw new RuntimeException('Първо въведете и запазете имейл за известия.');
                }
                $sent = send_notification('Тестово писмо от Sí bebé', "Това е тестово писмо от админ панела на Sí bebé.\nАко го виждате, известията за нови заявки работят.\n");
                flash($sent ? 'Тестовото писмо е изпратено до ' . implode(', ', notify_emails()) . '. Проверете и папка „Спам“.' : 'Сървърът не успя да изпрати писмото. Свържете се с поддръжката на хостинга.', $sent ? 'ok' : 'error');
                go('account');
            case 'maintenance':
                if (($_POST['hidden'] ?? '') === '1') {
                    if (@file_put_contents(MAINTENANCE_FLAG, "Site hidden from visitors since " . date('c') . "\n") === false) {
                        throw new RuntimeException('Файлът maintenance.flag не може да бъде създаден. Проверете правата на основната папка.');
                    }
                    flash('Сайтът е скрит. Посетителите виждат „Сайтът ни е в процес на обновяване“.');
                } else {
                    if (is_file(MAINTENANCE_FLAG) && !@unlink(MAINTENANCE_FLAG)) {
                        throw new RuntimeException('Файлът maintenance.flag не може да бъде изтрит.');
                    }
                    flash('Сайтът е публикуван и вече се вижда от всички.');
                }
                go($_POST['back'] ?? 'account');
            case 'add_admin':
                $user = clean($_POST['username'] ?? '', 60);
                $pass = (string) ($_POST['password'] ?? '');
                if ($user === '' || mb_strlen($pass) < 10) {
                    throw new RuntimeException('Въведете потребителско име и парола от поне 10 знака.');
                }
                $pdo->prepare("INSERT INTO admins (username, password_hash) VALUES (?, ?)")->execute([$user, password_hash($pass, PASSWORD_DEFAULT)]);
                flash("Добавен е потребител {$user}.");
                go('account');
            case 'delete_admin':
                $pdo->prepare("DELETE FROM admins WHERE id = ? AND username <> ?")->execute([$id, $_SESSION['admin']]);
                flash('Потребителят е изтрит.');
                go('account');
        }
    } catch (PDOException $e) {
        error_log('Sí bebé admin: ' . $e->getMessage());
        flash($e->getCode() === '23000' ? 'Такъв запис вече съществува.' : 'Грешка в базата данни.', 'error');
        go($page);
    } catch (RuntimeException $e) {
        flash($e->getMessage(), 'error');
        go($page, isset($_POST['id']) && $_POST['id'] ? ['edit' => (int) $_POST['id']] : []);
    }
}

/* ---------- Pages ---------- */
$counts = [
    'bookings' => (int) $pdo->query("SELECT COUNT(*) FROM bookings WHERE status = 'new'")->fetchColumn(),
    'partners' => (int) $pdo->query("SELECT COUNT(*) FROM partners WHERE status = 'new'")->fetchColumn(),
];
$nav = [
    'dashboard' => ['Начало', 'home'],
    'bookings' => ['Записвания', 'calendar'],
    'partners' => ['Партньори', 'users'],
    'reviews' => ['Отзиви', 'star'],
    'gallery' => ['Галерия', 'photo'],
    'events' => ['Събития', 'event'],
    'articles' => ['Статии', 'doc'],
    'routine' => ['Дневен режим', 'clock'],
    'team' => ['Екип', 'users'],
    'images' => ['Снимки в сайта', 'image'],
    'account' => ['Профил и настройки', 'key'],
];
if (!isset($nav[$page])) {
    $page = 'dashboard';
}

render_head($nav[$page][0]);
?>
<div class="layout">
    <aside class="sidebar">
        <a class="sidebar-brand" href="?p=dashboard"><img src="../media/logo.webp" alt="" width="44" height="44"><span>Sí bebé<small>Админ панел</small></span></a>
        <nav>
            <?php foreach ($nav as $key => [$label, $ic]): ?>
                <a href="?p=<?= $key ?>"<?= $key === $page ? ' aria-current="page"' : '' ?>><?= icon($ic) ?><span><?= $label ?></span><?php if (!empty($counts[$key])): ?><b class="badge"><?= $counts[$key] ?></b><?php endif; ?></a>
            <?php endforeach; ?>
        </nav>
        <div class="sidebar-foot">
            <a href="../" target="_blank"><?= icon('image') ?>Редактирай сайта ↗</a>
            <a href="?logout=1"><?= icon('out') ?>Изход</a>
        </div>
    </aside>
    <main class="content">
        <?php if (!empty($_SESSION['flash'])): [$type, $msg] = $_SESSION['flash']; unset($_SESSION['flash']); ?>
            <p class="toast toast--<?= $type === 'ok' ? 'ok' : 'error' ?>" role="<?= $type === 'ok' ? 'status' : 'alert' ?>"><?= h($msg) ?></p>
        <?php endif; ?>
        <?php
        switch ($page) {
            case 'dashboard': page_dashboard($pdo, $counts); break;
            case 'bookings': page_entries($pdo, 'bookings'); break;
            case 'partners': page_entries($pdo, 'partners'); break;
            case 'reviews': page_reviews($pdo); break;
            case 'gallery': page_gallery($pdo); break;
            case 'events': page_events($pdo); break;
            case 'articles': page_articles($pdo); break;
            case 'routine': page_routine($pdo); break;
            case 'team': page_team($pdo); break;
            case 'images': page_images(); break;
            case 'account': page_account($pdo); break;
        }
        ?>
    </main>
</div>
<?php
render_foot();

/* ---------- Page renderers ---------- */
function page_dashboard(PDO $pdo, array $counts): void
{
    $stats = [
        ['Нови записвания', $counts['bookings'], 'bookings', 'peach'],
        ['Нови партньори', $counts['partners'], 'partners', 'mint'],
        ['Снимки в галерията', (int) $pdo->query("SELECT COUNT(*) FROM gallery")->fetchColumn(), 'gallery', 'sky'],
        ['Предстоящи събития', (int) $pdo->query("SELECT COUNT(*) FROM events WHERE event_date >= NOW()")->fetchColumn(), 'events', 'butter'],
    ];
    $latest = $pdo->query("SELECT * FROM bookings ORDER BY created_at DESC LIMIT 5")->fetchAll();
    ?>
    <header class="page-head"><h1>Добре дошли, <?= h($_SESSION['admin']) ?></h1></header>
    <?php if (is_file(MAINTENANCE_FLAG)): ?>
        <div class="notice">Сайтът е скрит от посетителите – виждате го само вие, докато сте влезли. <a href="?p=account">Публикувай сайта</a></div>
    <?php endif; ?>
    <div class="stats">
        <?php foreach ($stats as [$label, $n, $link, $tone]): ?>
            <a class="stat stat--<?= $tone ?>" href="?p=<?= $link ?>"><b><?= $n ?></b><span><?= $label ?></span></a>
        <?php endforeach; ?>
    </div>
    <section class="panel">
        <div class="panel-head"><h2>Последни записвания</h2><a href="?p=bookings">Всички →</a></div>
        <?php if (!$latest): ?><p class="muted">Все още няма записвания.</p><?php else: ?>
            <div class="table-wrap"><table>
                <thead><tr><th>Дата</th><th>Родител</th><th>Телефон</th><th>Дете</th><th>Статус</th></tr></thead>
                <tbody>
                <?php foreach ($latest as $r): ?>
                    <tr><td><?= fmt_date($r['created_at']) ?></td><td><?= h($r['parent_first_name'] . ' ' . $r['parent_last_name']) ?></td><td><a href="tel:<?= h($r['phone']) ?>"><?= h($r['phone']) ?></a></td><td><?= h($r['child_first_name']) ?>, <?= h($r['child_age']) ?></td><td><?= status_pill($r['status']) ?></td></tr>
                <?php endforeach; ?>
                </tbody>
            </table></div>
        <?php endif; ?>
    </section>
    <p class="muted small">Заявките се изтриват автоматично 1 година след последната промяна, както е обещано в Политиката за поверителност.</p>
    <?php
}

function status_pill(string $status): string
{
    return $status === 'new' ? '<span class="pill pill--new">Нова</span>' : '<span class="pill">Обработена</span>';
}

function page_entries(PDO $pdo, string $table): void
{
    $target = (int) ($_GET['entry'] ?? 0); // a request opened from the notification e-mail
    $view = !$target && in_array($_GET['view'] ?? '', ['new', 'handled'], true) ? $_GET['view'] : 'all';
    $where = $view === 'all' ? '' : "WHERE status = " . $pdo->quote($view);
    $rows = $pdo->query("SELECT * FROM {$table} {$where} ORDER BY created_at DESC")->fetchAll();
    $title = $table === 'bookings' ? 'Записвания за час' : 'Заявки за партньорство';
    ?>
    <header class="page-head">
        <h1><?= $title ?></h1>
        <a class="btn btn--ghost" href="?p=<?= $table ?>&amp;export=1">Изтегли за Excel</a>
    </header>
    <div class="tabs">
        <?php foreach (['all' => 'Всички', 'new' => 'Нови', 'handled' => 'Обработени'] as $k => $label): ?>
            <a href="?p=<?= $table ?>&amp;view=<?= $k ?>"<?= $k === $view ? ' aria-current="page"' : '' ?>><?= $label ?></a>
        <?php endforeach; ?>
    </div>
    <?php if (!$rows): ?><p class="panel muted">Няма заявки.</p><?php endif; ?>
    <?php if ($target && !in_array($target, array_map('intval', array_column($rows, 'id')), true)): ?>
        <div class="notice">Тази заявка вече не съществува – изтрита е или е по-стара от една година.</div>
    <?php endif; ?>
    <div class="entries">
        <?php foreach ($rows as $r): ?>
            <article class="entry<?= $r['status'] === 'new' ? ' entry--new' : '' ?><?= (int) $r['id'] === $target ? ' is-target' : '' ?>" id="entry-<?= (int) $r['id'] ?>">
                <div class="entry-head">
                    <div>
                        <?php if ($table === 'bookings'): ?>
                            <h3><?= h($r['parent_first_name'] . ' ' . $r['parent_last_name']) ?></h3>
                            <p class="muted">Дете: <strong><?= h($r['child_first_name'] . ' ' . $r['child_last_name']) ?></strong> · <?= h($r['child_age']) ?></p>
                        <?php else: ?>
                            <h3><?= h($r['first_name'] . ' ' . $r['last_name']) ?></h3>
                            <p class="muted"><?= h($r['company']) ?></p>
                        <?php endif; ?>
                    </div>
                    <div class="entry-meta"><?= status_pill($r['status']) ?><span class="muted small"><?= fmt_date($r['created_at']) ?></span></div>
                </div>
                <p class="entry-contacts"><a href="tel:<?= h($r['phone']) ?>"><?= h($r['phone']) ?></a><a href="mailto:<?= h($r['email']) ?>"><?= h($r['email']) ?></a></p>
                <form method="post" class="entry-note">
                    <?= csrf_field() ?><input type="hidden" name="action" value="note"><input type="hidden" name="table" value="<?= $table ?>"><input type="hidden" name="id" value="<?= $r['id'] ?>"><input type="hidden" name="view" value="<?= $view ?>">
                    <input name="note" value="<?= h($r['note']) ?>" placeholder="Бележка (напр. обадих се, записан за понеделник)">
                    <button class="btn btn--small btn--ghost" type="submit">Запази</button>
                </form>
                <div class="entry-actions">
                    <form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="status"><input type="hidden" name="table" value="<?= $table ?>"><input type="hidden" name="id" value="<?= $r['id'] ?>"><input type="hidden" name="view" value="<?= $view ?>">
                        <?php if ($r['status'] === 'new'): ?><input type="hidden" name="status" value="handled"><button class="btn btn--small" type="submit">Маркирай като обработена</button>
                        <?php else: ?><input type="hidden" name="status" value="new"><button class="btn btn--small btn--ghost" type="submit">Върни като нова</button><?php endif; ?>
                    </form>
                    <form method="post" data-confirm="Да изтрия ли заявката?"><?= csrf_field() ?><input type="hidden" name="action" value="delete_entry"><input type="hidden" name="table" value="<?= $table ?>"><input type="hidden" name="id" value="<?= $r['id'] ?>"><input type="hidden" name="view" value="<?= $view ?>">
                        <button class="btn btn--small btn--danger" type="submit">Изтрий</button>
                    </form>
                </div>
            </article>
        <?php endforeach; ?>
    </div>
    <?php
}

function page_reviews(PDO $pdo): void
{
    $edit = null;
    if (!empty($_GET['edit'])) {
        $stmt = $pdo->prepare("SELECT * FROM reviews WHERE id = ?");
        $stmt->execute([(int) $_GET['edit']]);
        $edit = $stmt->fetch() ?: null;
    }
    $rows = $pdo->query("SELECT * FROM reviews ORDER BY created_at DESC, id DESC")->fetchAll();
    ?>
    <header class="page-head"><h1>Отзиви от родители</h1></header>
    <section class="panel">
        <h2><?= $edit ? 'Редакция на отзив' : 'Нов отзив' ?></h2>
        <form method="post" class="form-grid">
            <?= csrf_field() ?><input type="hidden" name="action" value="save_review"><input type="hidden" name="id" value="<?= $edit['id'] ?? '' ?>">
            <label>Име на родителя<input name="author" value="<?= h($edit['author'] ?? '') ?>" required></label>
            <label>Звезди<select name="stars"><?php for ($i = 5; $i >= 1; $i--): ?><option value="<?= $i ?>"<?= (int) ($edit['stars'] ?? 5) === $i ? ' selected' : '' ?>><?= str_repeat('★', $i) ?></option><?php endfor; ?></select></label>
            <label class="span-2">Отзив<textarea name="text" rows="4" required><?= h($edit['text'] ?? '') ?></textarea></label>
            <label class="check"><input type="checkbox" name="visible"<?= ($edit['visible'] ?? 1) ? ' checked' : '' ?>> Показвай на сайта</label>
            <div class="form-actions span-2"><button class="btn" type="submit">Запази</button><?php if ($edit): ?><a class="btn btn--ghost" href="?p=reviews">Откажи</a><?php endif; ?></div>
        </form>
    </section>
    <div class="cards">
        <?php foreach ($rows as $r): ?>
            <article class="card<?= $r['visible'] ? '' : ' card--muted' ?>">
                <div class="stars"><?= str_repeat('★', (int) $r['stars']) ?></div>
                <h3><?= h($r['author']) ?><?= $r['visible'] ? '' : ' <span class="pill">скрит</span>' ?></h3>
                <p><?= nl2br(h($r['text'])) ?></p>
                <div class="card-actions">
                    <a class="btn btn--small btn--ghost" href="?p=reviews&amp;edit=<?= $r['id'] ?>">Редактирай</a>
                    <form method="post" data-confirm="Да изтрия ли отзива?"><?= csrf_field() ?><input type="hidden" name="action" value="delete_review"><input type="hidden" name="id" value="<?= $r['id'] ?>"><button class="btn btn--small btn--danger" type="submit">Изтрий</button></form>
                </div>
            </article>
        <?php endforeach; ?>
    </div>
    <?php
}

/* Keeps the chosen category filter after an action on the gallery page */
function gallery_filter_query(): array
{
    $cat = (string) ($_POST['cat'] ?? '');
    return preg_match('/^[a-z0-9-]{1,30}$/', $cat) ? ['cat' => $cat] : [];
}

/* Deletes photos with their files; a photo deleted this way can be imported from Google Drive again */
function delete_gallery_photos(PDO $pdo, array $ids): void
{
    $marks = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare("SELECT file FROM gallery WHERE id IN ({$marks})");
    $stmt->execute($ids);
    $forget = $pdo->prepare("DELETE FROM settings WHERE name LIKE 'drive:%' AND value = ?");
    foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $file) {
        delete_upload($file);
        $forget->execute([$file]);
    }
    $pdo->prepare("DELETE FROM gallery WHERE id IN ({$marks})")->execute($ids);
}

function category_options(string $selected = ''): string
{
    $html = '<option value="">Без категория</option>';
    foreach (gallery_categories() as $key => $label) {
        $html .= '<option value="' . $key . '"' . ($key === $selected ? ' selected' : '') . '>' . h($label) . '</option>';
    }
    return $html;
}

function page_gallery(PDO $pdo): void
{
    // Filter: all, one category, or photos without a category ("none")
    $filter = (string) ($_GET['cat'] ?? 'all');
    $allCats = gallery_categories();
    if ($filter !== 'all' && $filter !== 'none' && !isset($allCats[$filter])) {
        $filter = 'all';
    }
    if ($filter === 'all') {
        $rows = $pdo->query("SELECT * FROM gallery ORDER BY created_at DESC, id DESC")->fetchAll();
    } else {
        $stmt = $pdo->prepare("SELECT * FROM gallery WHERE category = ? ORDER BY created_at DESC, id DESC");
        $stmt->execute([$filter === 'none' ? '' : $filter]);
        $rows = $stmt->fetchAll();
    }
    $byCat = $pdo->query("SELECT category, COUNT(*) FROM gallery GROUP BY category")->fetchAll(PDO::FETCH_KEY_PAIR);
    $total = array_sum($byCat);
    ?>
    <header class="page-head"><h1>Галерия</h1></header>
    <section class="panel">
        <h2>Качи снимки</h2>
        <form method="post" enctype="multipart/form-data" class="form-grid">
            <?= csrf_field() ?><input type="hidden" name="action" value="upload_gallery">
            <label class="span-2 drop">Снимки (може няколко наведнъж, JPG/PNG/WEBP до 12 MB)<input type="file" name="photos[]" accept="image/jpeg,image/png,image/webp" multiple required></label>
            <label>Категория<select name="category"><?= category_options() ?></select></label>
            <label>Описание (за незрящи и Google)<input name="alt" placeholder="напр. Арт ателие с боички"></label>
            <div class="form-actions span-2"><button class="btn" type="submit">Качи</button></div>
        </form>
    </section>
    <?php
    $cats = gallery_categories();
    $counts = $pdo->query("SELECT category, COUNT(*) FROM gallery GROUP BY category")->fetchAll(PDO::FETCH_KEY_PAIR);
    $slugs = array_keys($cats);
    ?>
    <section class="panel" id="cats">
        <h2>Категории</h2>
        <p class="muted">Категориите са бутоните за филтриране в галерията на сайта. На сайта се показват само тези, в които има снимки.</p>
        <div class="cat-list">
            <?php foreach ($cats as $slug => $label): $i = array_search($slug, $slugs, true); ?>
                <div class="cat-row">
                    <form method="post" class="cat-rename"><?= csrf_field() ?><input type="hidden" name="action" value="cat_rename"><input type="hidden" name="slug" value="<?= h($slug) ?>">
                        <input name="label" value="<?= h($label) ?>" aria-label="Име на категорията" required>
                        <button class="btn btn--small btn--ghost" type="submit">Преименувай</button>
                    </form>
                    <?php $n = (int) ($counts[$slug] ?? 0); ?><span class="cat-count"><?= $n ?> <?= $n === 1 ? 'снимка' : 'снимки' ?></span>
                    <form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="cat_move"><input type="hidden" name="dir" value="up"><input type="hidden" name="slug" value="<?= h($slug) ?>"><button class="btn btn--small btn--ghost" type="submit" title="По-напред"<?= $i === 0 ? ' disabled' : '' ?>>↑</button></form>
                    <form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="cat_move"><input type="hidden" name="dir" value="down"><input type="hidden" name="slug" value="<?= h($slug) ?>"><button class="btn btn--small btn--ghost" type="submit" title="По-назад"<?= $i === count($slugs) - 1 ? ' disabled' : '' ?>>↓</button></form>
                    <form method="post" data-confirm="Да изтрия ли категорията „<?= h($label) ?>“? Снимките ѝ остават без категория."><?= csrf_field() ?><input type="hidden" name="action" value="cat_delete"><input type="hidden" name="slug" value="<?= h($slug) ?>"><button class="btn btn--small btn--danger" type="submit">Изтрий</button></form>
                </div>
            <?php endforeach; ?>
            <?php if (!$cats): ?><p class="muted">Няма категории. Снимките се показват само под „Всички“.</p><?php endif; ?>
        </div>
        <form method="post" class="cat-add"><?= csrf_field() ?><input type="hidden" name="action" value="cat_add">
            <input name="label" placeholder="Нова категория, напр. Рождени дни" aria-label="Нова категория" required>
            <button class="btn btn--small" type="submit">Добави</button>
        </form>
    </section>
    <section class="panel">
        <h2>Внеси от Google Drive</h2>
        <p class="muted">В Google Drive натиснете <strong>Споделяне</strong> на папката и изберете <strong>„Всеки с линка“</strong>. После поставете линка тук. Снимките се изтеглят и записват в сайта; ако внесете същата папка пак, се добавят само новите.</p>
        <form class="form-grid" data-drive data-csrf="<?= h(csrf()) ?>">
            <label class="span-2">Линк към папка (или снимки) в Google Drive<input name="link" required placeholder="https://drive.google.com/drive/folders/..."></label>
            <label>Категория<select name="category"><?= category_options() ?></select></label>
            <label>Описание (за незрящи и Google)<input name="alt" placeholder="напр. Коледно парти 2026"></label>
            <div class="form-actions span-2"><button class="btn" type="submit">Внеси снимките</button></div>
            <div class="drive-progress span-2" hidden><div class="drive-bar"><span></span></div><p class="drive-status"></p></div>
        </form>
    </section>
    <p class="muted small">Снимките се смаляват автоматично и се изчиства информацията от фотоапарата (напр. местоположение).</p>
    <nav class="gal-filter" aria-label="Филтър по категория">
        <a href="?p=gallery" class="<?= $filter === 'all' ? 'is-on' : '' ?>">Всички <b><?= $total ?></b></a>
        <?php foreach ($allCats as $slug => $label): ?>
            <a href="?p=gallery&amp;cat=<?= h($slug) ?>" class="<?= $filter === $slug ? 'is-on' : '' ?>"><?= h($label) ?> <b><?= (int) ($byCat[$slug] ?? 0) ?></b></a>
        <?php endforeach; ?>
        <?php if (!empty($byCat[''])): ?><a href="?p=gallery&amp;cat=none" class="<?= $filter === 'none' ? 'is-on' : '' ?>">Без категория <b><?= (int) $byCat[''] ?></b></a><?php endif; ?>
    </nav>
    <?php if ($rows): ?>
    <form method="post" id="bulk" class="bulk-bar" data-bulk>
        <?= csrf_field() ?><input type="hidden" name="action" value="bulk_photos"><input type="hidden" name="cat" value="<?= h($filter) ?>">
        <label class="check bulk-all"><input type="checkbox" data-bulk-all> Избери всички (<?= count($rows) ?>)</label>
        <span class="bulk-count" data-bulk-count>Няма избрани</span>
        <span class="bulk-actions">
            <select name="category" aria-label="Премести в категория"><?= category_options() ?></select>
            <button class="btn btn--small" type="submit" name="op" value="move" data-bulk-need>Премести</button>
            <button class="btn btn--small btn--danger" type="submit" name="op" value="delete" data-bulk-need>Изтрий избраните</button>
        </span>
    </form>
    <?php else: ?>
        <p class="muted">Няма снимки в тази категория.</p>
    <?php endif; ?>
    <div class="photo-grid">
        <?php foreach ($rows as $r): ?>
            <figure class="photo">
                <label class="photo-pick" title="Избери"><input type="checkbox" name="ids[]" value="<?= $r['id'] ?>" form="bulk" aria-label="Избери снимката"></label>
                <img src="../<?= h($r['file']) ?>" alt="<?= h($r['alt']) ?>" loading="lazy">
                <form method="post" class="photo-edit"><?= csrf_field() ?><input type="hidden" name="action" value="update_photo"><input type="hidden" name="id" value="<?= $r['id'] ?>"><input type="hidden" name="cat" value="<?= h($filter) ?>">
                    <select name="category"><?= category_options($r['category']) ?></select>
                    <input name="alt" value="<?= h($r['alt']) ?>" aria-label="Описание">
                    <button class="btn btn--small btn--ghost" type="submit">Запази</button>
                </form>
                <form method="post" data-confirm="Да изтрия ли снимката?"><?= csrf_field() ?><input type="hidden" name="action" value="delete_photo"><input type="hidden" name="id" value="<?= $r['id'] ?>"><input type="hidden" name="cat" value="<?= h($filter) ?>"><button class="btn btn--small btn--danger" type="submit">Изтрий</button></form>
            </figure>
        <?php endforeach; ?>
    </div>
    <?php
}

function page_team(PDO $pdo): void
{
    ensure_team_table();
    $edit = null;
    if (!empty($_GET['edit'])) {
        $stmt = $pdo->prepare("SELECT * FROM team WHERE id = ?");
        $stmt->execute([(int) $_GET['edit']]);
        $edit = $stmt->fetch() ?: null;
    }
    $rows = $pdo->query("SELECT * FROM team ORDER BY sort, id")->fetchAll();
    ?>
    <header class="page-head"><h1>Екип</h1></header>
    <p class="muted">Хората от екипа се показват на страница „За нас“, в секцията „Екип“, в реда от тази страница.</p>
    <section class="panel">
        <h2><?= $edit ? 'Редакция: ' . h($edit['name']) : 'Нов член на екипа' ?></h2>
        <form method="post" enctype="multipart/form-data" class="form-grid">
            <?= csrf_field() ?><input type="hidden" name="action" value="save_team"><input type="hidden" name="id" value="<?= $edit['id'] ?? '' ?>">
            <label>Име<input name="name" value="<?= h($edit['name'] ?? '') ?>" required placeholder="напр. д-р Мария Иванова"></label>
            <label>Длъжност<input name="role" value="<?= h($edit['role'] ?? '') ?>" placeholder="напр. Детски психолог"></label>
            <label class="span-2">Биография<textarea name="bio" rows="5" placeholder="Няколко изречения за опита и подхода"><?= h($edit['bio'] ?? '') ?></textarea></label>
            <label>Снимка<?= $edit && $edit['photo'] ? ' (оставете празно, за да запазите сегашната)' : '' ?><input type="file" name="photo" accept="image/jpeg,image/png,image/webp"></label>
            <div class="team-form-side">
                <?php if ($edit && $edit['photo']): ?>
                    <div class="team-current"><img src="../<?= h($edit['photo']) ?>" alt=""><label class="check"><input type="checkbox" name="remove_photo"> Махни снимката</label></div>
                <?php endif; ?>
                <label class="check"><input type="checkbox" name="visible"<?= ($edit['visible'] ?? 1) ? ' checked' : '' ?>> Показвай на сайта</label>
            </div>
            <div class="form-actions span-2"><button class="btn" type="submit">Запази</button><?php if ($edit): ?><a class="btn btn--ghost" href="?p=team">Откажи</a><?php endif; ?></div>
        </form>
    </section>
    <?php if (!$rows): ?>
        <p class="muted">Все още няма добавени хора. Докато няма, на сайта не се показва нищо ново.</p>
    <?php endif; ?>
    <div class="team-list">
        <?php foreach ($rows as $i => $r): ?>
            <article class="team-card<?= $r['visible'] ? '' : ' card--muted' ?>">
                <div class="team-photo"><?php if ($r['photo']): ?><img src="../<?= h($r['photo']) ?>" alt=""><?php else: ?><span><?= h(mb_strtoupper(mb_substr($r['name'], 0, 1))) ?></span><?php endif; ?></div>
                <div class="team-body">
                    <h3><?= h($r['name']) ?><?= $r['visible'] ? '' : ' <span class="pill">скрит</span>' ?></h3>
                    <?php if ($r['role']): ?><p class="team-role"><?= h($r['role']) ?></p><?php endif; ?>
                    <?php if ($r['bio']): ?><p class="team-bio"><?= nl2br(h($r['bio'])) ?></p><?php endif; ?>
                    <div class="card-actions">
                        <form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="move_team"><input type="hidden" name="dir" value="up"><input type="hidden" name="id" value="<?= $r['id'] ?>"><button class="btn btn--small btn--ghost" type="submit" title="По-напред"<?= $i === 0 ? ' disabled' : '' ?>>↑</button></form>
                        <form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="move_team"><input type="hidden" name="dir" value="down"><input type="hidden" name="id" value="<?= $r['id'] ?>"><button class="btn btn--small btn--ghost" type="submit" title="По-назад"<?= $i === count($rows) - 1 ? ' disabled' : '' ?>>↓</button></form>
                        <a class="btn btn--small btn--ghost" href="?p=team&amp;edit=<?= $r['id'] ?>">Редактирай</a>
                        <form method="post" data-confirm="Да премахна ли <?= h($r['name']) ?> от екипа?"><?= csrf_field() ?><input type="hidden" name="action" value="delete_team"><input type="hidden" name="id" value="<?= $r['id'] ?>"><button class="btn btn--small btn--danger" type="submit">Изтрий</button></form>
                    </div>
                </div>
            </article>
        <?php endforeach; ?>
    </div>
    <?php
}

function page_events(PDO $pdo): void
{
    $edit = null;
    if (!empty($_GET['edit'])) {
        $stmt = $pdo->prepare("SELECT * FROM events WHERE id = ?");
        $stmt->execute([(int) $_GET['edit']]);
        $edit = $stmt->fetch() ?: null;
    }
    $rows = $pdo->query("SELECT * FROM events ORDER BY event_date DESC")->fetchAll();
    ?>
    <header class="page-head"><h1>Събития</h1></header>
    <section class="panel">
        <h2><?= $edit ? 'Редакция на събитие' : 'Ново събитие' ?></h2>
        <form method="post" enctype="multipart/form-data" class="form-grid">
            <?= csrf_field() ?><input type="hidden" name="action" value="save_event"><input type="hidden" name="id" value="<?= $edit['id'] ?? '' ?>">
            <label>Заглавие<input name="title" value="<?= h($edit['title'] ?? '') ?>" required></label>
            <label>Дата и час<input type="datetime-local" name="event_date" value="<?= $edit ? date('Y-m-d\TH:i', strtotime($edit['event_date'])) : '' ?>" required></label>
            <label class="span-2">Описание<textarea name="description" rows="3"><?= h($edit['description'] ?? '') ?></textarea></label>
            <label>Снимка<?= $edit && $edit['image'] ? ' (оставете празно, за да запазите сегашната)' : '' ?><input type="file" name="image" accept="image/jpeg,image/png,image/webp"></label>
            <label>Линк (по желание)<input type="url" name="link" value="<?= h($edit['link'] ?? '') ?>" placeholder="https://"></label>
            <div class="form-actions span-2"><button class="btn" type="submit">Запази</button><?php if ($edit): ?><a class="btn btn--ghost" href="?p=events">Откажи</a><?php endif; ?></div>
        </form>
        <p class="muted small">Събитията с изминала дата се показват автоматично като „Минали събития“.</p>
    </section>
    <div class="cards">
        <?php foreach ($rows as $r): $past = strtotime($r['event_date']) < time(); ?>
            <article class="card">
                <?php if ($r['image']): ?><img class="card-img" src="../<?= h($r['image']) ?>" alt="" loading="lazy"><?php endif; ?>
                <p class="muted small"><?= fmt_date($r['event_date']) ?> · <?= $past ? 'минало' : '<strong>предстоящо</strong>' ?></p>
                <h3><?= h($r['title']) ?></h3>
                <p><?= nl2br(h($r['description'])) ?></p>
                <div class="card-actions">
                    <a class="btn btn--small btn--ghost" href="?p=events&amp;edit=<?= $r['id'] ?>">Редактирай</a>
                    <form method="post" data-confirm="Да изтрия ли събитието?"><?= csrf_field() ?><input type="hidden" name="action" value="delete_event"><input type="hidden" name="id" value="<?= $r['id'] ?>"><button class="btn btn--small btn--danger" type="submit">Изтрий</button></form>
                </div>
            </article>
        <?php endforeach; ?>
    </div>
    <?php
}

function page_articles(PDO $pdo): void
{
    ensure_articles_table();
    $edit = null;
    if (!empty($_GET['edit'])) {
        $stmt = $pdo->prepare("SELECT * FROM articles WHERE id = ?");
        $stmt->execute([(int) $_GET['edit']]);
        $edit = $stmt->fetch() ?: null;
    }
    $rows = $pdo->query("SELECT * FROM articles ORDER BY created_at DESC, id DESC")->fetchAll();
    ?>
    <header class="page-head"><h1>Статии</h1></header>
    <p class="muted">Статиите се показват на страница „Пространство за родители“, най-новите първи.</p>
    <section class="panel">
        <h2><?= $edit ? 'Редакция на статия' : 'Нова статия' ?></h2>
        <form method="post" enctype="multipart/form-data" class="form-grid">
            <?= csrf_field() ?><input type="hidden" name="action" value="save_article"><input type="hidden" name="id" value="<?= $edit['id'] ?? '' ?>">
            <label>Заглавие<input name="title" value="<?= h($edit['title'] ?? '') ?>" required></label>
            <label>Линк към статията<input type="url" name="link" value="<?= h($edit['link'] ?? '') ?>" placeholder="https://"></label>
            <label class="span-2">Описание<textarea name="description" rows="4" placeholder="Кратко резюме, което да покани родителите да прочетат статията"><?= h($edit['description'] ?? '') ?></textarea></label>
            <label>Снимка<?= $edit && $edit['image'] ? ' (оставете празно, за да запазите сегашната)' : '' ?><input type="file" name="image" accept="image/jpeg,image/png,image/webp"></label>
            <div class="team-form-side">
                <?php if ($edit && $edit['image']): ?><div class="team-current"><img src="../<?= h($edit['image']) ?>" alt=""></div><?php endif; ?>
                <label class="check"><input type="checkbox" name="visible"<?= ($edit['visible'] ?? 1) ? ' checked' : '' ?>> Показвай на сайта</label>
            </div>
            <div class="form-actions span-2"><button class="btn" type="submit">Запази</button><?php if ($edit): ?><a class="btn btn--ghost" href="?p=articles">Откажи</a><?php endif; ?></div>
        </form>
    </section>
    <?php if (!$rows): ?>
        <p class="muted">Все още няма статии. Докато няма, секцията не се показва на сайта.</p>
    <?php endif; ?>
    <div class="cards">
        <?php foreach ($rows as $r): ?>
            <article class="card<?= $r['visible'] ? '' : ' card--muted' ?>">
                <?php if ($r['image']): ?><img class="card-img" src="../<?= h($r['image']) ?>" alt="" loading="lazy"><?php endif; ?>
                <p class="muted small"><?= fmt_date($r['created_at']) ?><?= $r['visible'] ? '' : ' · <span class="pill">скрита</span>' ?></p>
                <h3><?= h($r['title']) ?></h3>
                <?php if ($r['description']): ?><p><?= nl2br(h($r['description'])) ?></p><?php endif; ?>
                <?php if ($r['link']): ?><p class="small"><a href="<?= h($r['link']) ?>" target="_blank" rel="noopener"><?= h(parse_url($r['link'], PHP_URL_HOST) ?: $r['link']) ?> ↗</a></p><?php endif; ?>
                <div class="card-actions">
                    <a class="btn btn--small btn--ghost" href="?p=articles&amp;edit=<?= $r['id'] ?>">Редактирай</a>
                    <form method="post" data-confirm="Да изтрия ли статията?"><?= csrf_field() ?><input type="hidden" name="action" value="delete_article"><input type="hidden" name="id" value="<?= $r['id'] ?>"><button class="btn btn--small btn--danger" type="submit">Изтрий</button></form>
                </div>
            </article>
        <?php endforeach; ?>
    </div>
    <?php
}

function page_routine(PDO $pdo): void
{
    ensure_routine_table();
    $edit = null;
    if (!empty($_GET['edit'])) {
        $stmt = $pdo->prepare("SELECT * FROM routine WHERE id = ?");
        $stmt->execute([(int) $_GET['edit']]);
        $edit = $stmt->fetch() ?: null;
    }
    $rows = $pdo->query("SELECT * FROM routine ORDER BY sort, id")->fetchAll();
    $homeCount = count(array_filter($rows, fn ($r) => $r['on_home']));
    $pasted = implode("\n", array_map(fn ($r) => $r['time_from'] . ($r['time_to'] !== '' ? ' - ' . $r['time_to'] : '') . ' - ' . $r['text'], $rows));
    ?>
    <header class="page-head"><h1>Дневен режим</h1></header>
    <p class="muted">Целият режим се показва в „Бебешки център“. Редовете с отметка „На началната страница“ излизат и на началната страница, само с началния час.</p>
    <section class="panel">
        <h2><?= $edit ? 'Редакция на ред' : 'Нов ред' ?></h2>
        <form method="post" class="form-grid routine-form">
            <?= csrf_field() ?><input type="hidden" name="action" value="save_routine"><input type="hidden" name="id" value="<?= $edit['id'] ?? '' ?>">
            <div class="routine-times">
                <label>От<input name="time_from" value="<?= h($edit['time_from'] ?? '') ?>" placeholder="07:30" inputmode="numeric" maxlength="5" required></label>
                <label>До<input name="time_to" value="<?= h($edit['time_to'] ?? '') ?>" placeholder="09:00" inputmode="numeric" maxlength="5"></label>
            </div>
            <label>Какво се случва<input name="text" value="<?= h($edit['text'] ?? '') ?>" placeholder="напр. Прием и закуска" maxlength="255" required></label>
            <div class="team-form-side span-2">
                <label class="check"><input type="checkbox" name="on_home"<?= ($edit['on_home'] ?? 0) ? ' checked' : '' ?>> На началната страница</label>
                <label class="check"><input type="checkbox" name="focus"<?= ($edit['focus'] ?? 0) ? ' checked' : '' ?>> Открои реда (цветен фон)</label>
            </div>
            <div class="form-actions span-2"><button class="btn" type="submit"><?= $edit ? 'Запази' : 'Добави' ?></button><?php if ($edit): ?><a class="btn btn--ghost" href="?p=routine">Откажи</a><?php endif; ?></div>
        </form>
    </section>
    <?php if ($homeCount > 6): ?>
        <div class="notice">На началната страница има <?= $homeCount ?> реда. Там изглежда най-добре с 4–6.</div>
    <?php endif; ?>
    <?php if ($rows): ?>
        <div class="panel routine-list">
            <?php foreach ($rows as $i => $r): ?>
                <div class="routine-row<?= $r['focus'] ? ' is-focus' : '' ?>">
                    <span class="routine-time"><?= h($r['time_from']) ?><?= $r['time_to'] !== '' ? ' – ' . h($r['time_to']) : '' ?></span>
                    <span class="routine-text"><?= h($r['text']) ?><?php if ($r['on_home']): ?> <span class="pill">начална</span><?php endif; ?></span>
                    <div class="card-actions">
                        <form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="move_routine"><input type="hidden" name="dir" value="up"><input type="hidden" name="id" value="<?= $r['id'] ?>"><button class="btn btn--small btn--ghost" type="submit" title="По-нагоре"<?= $i === 0 ? ' disabled' : '' ?>>↑</button></form>
                        <form method="post"><?= csrf_field() ?><input type="hidden" name="action" value="move_routine"><input type="hidden" name="dir" value="down"><input type="hidden" name="id" value="<?= $r['id'] ?>"><button class="btn btn--small btn--ghost" type="submit" title="По-надолу"<?= $i === count($rows) - 1 ? ' disabled' : '' ?>>↓</button></form>
                        <a class="btn btn--small btn--ghost" href="?p=routine&amp;edit=<?= $r['id'] ?>">Редактирай</a>
                        <form method="post" data-confirm="Да изтрия ли реда „<?= h($r['text']) ?>“?"><?= csrf_field() ?><input type="hidden" name="action" value="delete_routine"><input type="hidden" name="id" value="<?= $r['id'] ?>"><button class="btn btn--small btn--danger" type="submit">Изтрий</button></form>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    <?php else: ?>
        <p class="muted">Няма редове. Докато няма, сайтът показва вградения режим.</p>
    <?php endif; ?>
    <section class="panel">
        <h2>Смени целия режим наведнъж</h2>
        <p class="muted small">Поставете режима, по един ред на час: <strong>07:30 - 09:00 - Прием и закуска</strong>. Сегашните редове се заменят. До 5 реда се избират автоматично за началната страница, после може да ги смените.</p>
        <form method="post" data-confirm="Да заменя ли целия дневен режим с поставения?">
            <?= csrf_field() ?><input type="hidden" name="action" value="replace_routine">
            <label>Режим<textarea name="routine" rows="10" required><?= h($pasted) ?></textarea></label>
            <div class="form-actions"><button class="btn" type="submit">Замени режима</button></div>
        </form>
    </section>
    <?php
}

function page_images(): void
{
    $groups = [];
    foreach (slots() as $key => $slot) {
        $groups[$slot['page']][$key] = $slot;
    }
    ?>
    <header class="page-head"><h1>Снимки в сайта</h1></header>
    <p class="muted">Изберете нова снимка и натиснете „Смени“. Тя се смалява автоматично и веднага се появява в сайта. С „Върни оригинала“ се връща първоначалната снимка.</p>
    <p><a class="btn" href="../" target="_blank">Смени снимките направо в сайта ↗</a></p>
    <?php foreach ($groups as $page => $items): ?>
        <section class="slot-group">
            <h2><?= h($page) ?></h2>
            <div class="slot-grid">
                <?php foreach ($items as $key => $slot):
                    $path = __DIR__ . '/../' . $slot['file'];
                    $changed = setting('slot:' . $key) !== null; ?>
                    <article class="slot" id="slot-<?= h($key) ?>">
                        <a class="slot-img<?= $key === 'price-list' ? ' slot-img--tall' : ($key === 'logo' ? ' slot-img--logo' : '') ?>" href="../<?= h($slot['file']) ?>?v=<?= @filemtime($path) ?>" target="_blank"><img src="../<?= h($slot['file']) ?>?v=<?= @filemtime($path) ?>" alt="" loading="lazy"></a>
                        <div class="slot-body">
                            <h3><?= h($slot['label']) ?><?= $changed ? ' <span class="pill pill--new">сменена</span>' : '' ?></h3>
                            <form method="post" enctype="multipart/form-data" class="slot-form">
                                <?= csrf_field() ?><input type="hidden" name="action" value="slot"><input type="hidden" name="slot" value="<?= h($key) ?>">
                                <input type="file" name="image" accept="image/jpeg,image/png,image/webp" required aria-label="Нова снимка за <?= h($slot['label']) ?>">
                                <button class="btn btn--small" type="submit">Смени</button>
                            </form>
                            <?php if (is_file(slot_prev_path($key))): ?>
                                <form method="post" data-confirm="Да върна ли предишната снимка?"><?= csrf_field() ?><input type="hidden" name="action" value="slot_undo"><input type="hidden" name="slot" value="<?= h($key) ?>"><button class="btn btn--small btn--ghost" type="submit">Върни предишната</button></form>
                            <?php endif; ?>
                            <?php if ($changed): ?>
                                <form method="post" data-confirm="Да върна ли оригиналната снимка?"><?= csrf_field() ?><input type="hidden" name="action" value="slot_reset"><input type="hidden" name="slot" value="<?= h($key) ?>"><button class="btn btn--small btn--ghost" type="submit">Върни оригинала</button></form>
                            <?php endif; ?>
                        </div>
                    </article>
                <?php endforeach; ?>
            </div>
        </section>
    <?php endforeach; ?>
    <?php
}

function page_account(PDO $pdo): void
{
    $admins = $pdo->query("SELECT id, username, created_at FROM admins ORDER BY id")->fetchAll();
    ?>
    <header class="page-head"><h1>Профил и настройки</h1></header>
    <section class="panel">
        <h2>Видимост на сайта</h2>
        <?php if (is_file(MAINTENANCE_FLAG)): ?>
            <p><span class="pill pill--new">Скрит</span> Сайтът се вижда само от влезли админи. Всички останали виждат страницата „Сайтът ни е в процес на обновяване“ с линк към Facebook.</p>
            <form method="post" class="visibility-form" data-confirm="Да публикувам ли сайта за всички?"><?= csrf_field() ?><input type="hidden" name="action" value="maintenance"><input type="hidden" name="hidden" value="0">
                <button class="btn" type="submit">Публикувай сайта за всички</button>
                <a class="btn btn--ghost" href="../maintenance" target="_blank">Виж какво виждат посетителите ↗</a>
            </form>
        <?php else: ?>
            <p><span class="pill pill--live">Публикуван</span> Сайтът се вижда от всички.</p>
            <form method="post" class="visibility-form" data-confirm="Да скрия ли сайта от посетителите?"><?= csrf_field() ?><input type="hidden" name="action" value="maintenance"><input type="hidden" name="hidden" value="1">
                <button class="btn btn--ghost" type="submit">Скрий сайта (страница „в процес на обновяване“)</button>
            </form>
        <?php endif; ?>
    </section>
    <section class="panel">
        <h2>Известия за нови заявки</h2>
        <p class="muted">При всяко ново записване или заявка за партньорство изпращаме писмо на тези имейли. Може няколко, разделени със запетая. Оставете празно, за да спрат известията.</p>
        <form method="post" id="notify-form" class="notify-form">
            <?= csrf_field() ?><input type="hidden" name="action" value="notify">
            <label>Получатели<input name="emails" value="<?= h(implode(', ', notify_emails())) ?>" placeholder="sibebe.bg@gmail.com, kolega@example.com"></label>
        </form>
        <form method="post" id="notify-test"><?= csrf_field() ?><input type="hidden" name="action" value="notify_test"></form>
        <div class="notify-actions">
            <button class="btn" type="submit" form="notify-form">Запази</button>
            <button class="btn btn--ghost" type="submit" form="notify-test">Изпрати тестово писмо</button>
        </div>
        <p class="notify-from muted small">Писмата се изпращат от <strong><?= h(notify_sender()) ?></strong>. Добавете този адрес в контактите си, за да не попадат известията в „Спам“.</p>
    </section>
    <div class="two-col">
        <section class="panel">
            <h2>Смяна на парола</h2>
            <form method="post" class="form-stack">
                <?= csrf_field() ?><input type="hidden" name="action" value="password">
                <label>Текуща парола<input type="password" name="current" required autocomplete="current-password"></label>
                <label>Нова парола (поне 10 знака)<input type="password" name="new" minlength="10" required autocomplete="new-password"></label>
                <label>Повторете новата парола<input type="password" name="repeat" minlength="10" required autocomplete="new-password"></label>
                <button class="btn" type="submit">Смени паролата</button>
            </form>
        </section>
        <section class="panel">
            <h2>Потребители</h2>
            <ul class="user-list">
                <?php foreach ($admins as $a): ?>
                    <li><span><?= h($a['username']) ?><?= $a['username'] === $_SESSION['admin'] ? ' <span class="pill">вие</span>' : '' ?></span>
                        <?php if ($a['username'] !== $_SESSION['admin']): ?><form method="post" data-confirm="Да изтрия ли потребителя?"><?= csrf_field() ?><input type="hidden" name="action" value="delete_admin"><input type="hidden" name="id" value="<?= $a['id'] ?>"><button class="btn btn--small btn--danger" type="submit">Изтрий</button></form><?php endif; ?>
                    </li>
                <?php endforeach; ?>
            </ul>
            <h3>Добави потребител</h3>
            <form method="post" class="form-stack">
                <?= csrf_field() ?><input type="hidden" name="action" value="add_admin">
                <label>Потребителско име<input name="username" required autocomplete="off"></label>
                <label>Парола (поне 10 знака)<input type="password" name="password" minlength="10" required autocomplete="new-password"></label>
                <button class="btn btn--ghost" type="submit">Добави</button>
            </form>
        </section>
    </div>
    <?php
}

function render_head(string $title): void
{
    ?><!DOCTYPE html>
<html lang="bg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title><?= h($title) ?> | Sí bebé админ</title>
    <link rel="icon" type="image/png" href="../assets/img/favicon.png">
    <link rel="stylesheet" href="../assets/css/fonts.css">
    <link rel="stylesheet" href="admin.css?v=<?= @filemtime(__DIR__ . '/admin.css') ?>">
</head>
<body>
<?php
}

function render_foot(): void
{
    ?>
<script src="admin.js?v=<?= @filemtime(__DIR__ . '/admin.js') ?>"></script>
</body>
</html>
<?php
}
