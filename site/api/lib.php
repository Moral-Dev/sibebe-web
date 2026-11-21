<?php
/* SI BEBE – shared helpers for the public API and the admin panel. */

declare(strict_types=1);

const RETENTION_DAYS = 365;          // Form submissions are deleted after one year (privacy policy)
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const UPLOAD_DIR = __DIR__ . '/../uploads';
const GALLERY_CATEGORIES = [
    'workshops' => 'Тематични работилнички',
    'activities' => 'Занимания',
    'events' => 'Събития',
    'interior' => 'Интериор',
];
// While this file exists only logged-in admins see the site (see gate.php and .htaccess)
const MAINTENANCE_FLAG = __DIR__ . '/../maintenance.flag';
const CHILD_AGES = ['0–6 месеца', '6–12 месеца', '12–24 месеца', '24–36 месеца'];

/* Admin session, shared by the admin panel and the on-page editor (api/edit.php). */
function is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
}

function start_admin_session(): void
{
    $https = is_https();
    // Own session folder outside the public site, so shared-hosting cleanup does not log the admin out mid-edit
    $dir = dirname(__DIR__, 2) . '/sibebe_sessions';
    if ((is_dir($dir) || @mkdir($dir, 0700)) && is_writable($dir)) {
        session_save_path($dir);
    }
    ini_set('session.gc_maxlifetime', '28800');
    // An older version kept the session under /admin only; drop that cookie so it cannot shadow this one
    if (isset($_COOKIE['sibebe_admin'])) {
        setcookie('sibebe_admin', '', ['expires' => time() - 3600, 'path' => '/admin']);
    }
    session_name('sibebe_session');
    session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => $https, 'httponly' => true, 'samesite' => 'Strict']);
    session_start();
    // A deleted admin must not keep working with an old session
    if (!empty($_SESSION['admin']) && config()) {
        try {
            $stmt = db()->prepare('SELECT 1 FROM admins WHERE username = ?');
            $stmt->execute([$_SESSION['admin']]);
            if (!$stmt->fetchColumn()) {
                $_SESSION = [];
            }
        } catch (Throwable $e) {
            // database down: leave the session alone, the page shows its own error
        }
    }
}

/* Readable marker so the public pages only ask about edit mode when someone has logged in on this browser. */
function set_editor_marker(bool $on): void
{
    $https = is_https();
    setcookie('sibebe_editor', $on ? '1' : '', ['expires' => $on ? 0 : time() - 3600, 'path' => '/', 'secure' => $https, 'httponly' => false, 'samesite' => 'Strict']);
}

function config(): array
{
    static $config = null;
    if ($config === null) {
        $file = __DIR__ . '/config.php';
        $config = is_file($file) ? require $file : [];
    }
    return $config;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $c = config();
        if (!$c) {
            throw new RuntimeException('Not configured');
        }
        $pdo = connect_db($c['db_host'], $c['db_name'], $c['db_user'], $c['db_pass']);
    }
    return $pdo;
}

date_default_timezone_set('Europe/Sofia');

function connect_db(string $host, string $name, string $user, string $pass): PDO
{
    $pdo = new PDO("mysql:host={$host};dbname={$name};charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    // Dates in the database follow Bulgarian time, like PHP
    $pdo->exec("SET time_zone = '" . (new DateTime())->format('P') . "'");
    return $pdo;
}

function schema(): array
{
    return [
        "CREATE TABLE IF NOT EXISTS admins (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(60) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        "CREATE TABLE IF NOT EXISTS bookings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            parent_first_name VARCHAR(100) NOT NULL,
            parent_last_name VARCHAR(100) NOT NULL,
            email VARCHAR(190) NOT NULL,
            phone VARCHAR(40) NOT NULL,
            child_first_name VARCHAR(100) NOT NULL,
            child_last_name VARCHAR(100) NOT NULL,
            child_age VARCHAR(40) NOT NULL,
            status ENUM('new','handled') NOT NULL DEFAULT 'new',
            note TEXT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX (status), INDEX (updated_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        "CREATE TABLE IF NOT EXISTS partners (
            id INT AUTO_INCREMENT PRIMARY KEY,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            company VARCHAR(190) NOT NULL,
            email VARCHAR(190) NOT NULL,
            phone VARCHAR(40) NOT NULL,
            status ENUM('new','handled') NOT NULL DEFAULT 'new',
            note TEXT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX (status), INDEX (updated_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        "CREATE TABLE IF NOT EXISTS reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            author VARCHAR(120) NOT NULL,
            text TEXT NOT NULL,
            stars TINYINT NOT NULL DEFAULT 5,
            visible TINYINT(1) NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        "CREATE TABLE IF NOT EXISTS gallery (
            id INT AUTO_INCREMENT PRIMARY KEY,
            file VARCHAR(190) NOT NULL,
            alt VARCHAR(190) NOT NULL DEFAULT '',
            category VARCHAR(30) NOT NULL DEFAULT '',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        "CREATE TABLE IF NOT EXISTS events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(190) NOT NULL,
            description TEXT NOT NULL,
            event_date DATETIME NOT NULL,
            image VARCHAR(190) NULL,
            link VARCHAR(500) NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX (event_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        "CREATE TABLE IF NOT EXISTS settings (
            name VARCHAR(60) PRIMARY KEY,
            value TEXT NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        "CREATE TABLE IF NOT EXISTS hits (
            id INT AUTO_INCREMENT PRIMARY KEY,
            kind VARCHAR(20) NOT NULL,
            ip_hash CHAR(64) NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX (kind, ip_hash, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
    ];
}

/* Delete what the privacy policy promises to delete. Runs on submits and admin visits. */
function purge_old_data(): void
{
    $pdo = db();
    foreach (['bookings', 'partners'] as $table) {
        $pdo->exec("DELETE FROM {$table} WHERE updated_at < (NOW() - INTERVAL " . RETENTION_DAYS . " DAY)");
    }
    $pdo->exec("DELETE FROM hits WHERE created_at < (NOW() - INTERVAL 1 DAY)");
}

/* Rate limiting without storing IP addresses: only a salted hash, kept for one day. */
function ip_hash(): string
{
    $salt = config()['secret'] ?? 'sibebe';
    return hash('sha256', $salt . '|' . ($_SERVER['REMOTE_ADDR'] ?? ''));
}

function too_many(string $kind, int $limit, int $minutes): bool
{
    $stmt = db()->prepare("SELECT COUNT(*) FROM hits WHERE kind = ? AND ip_hash = ? AND created_at > (NOW() - INTERVAL {$minutes} MINUTE)");
    $stmt->execute([$kind, ip_hash()]);
    return (int) $stmt->fetchColumn() >= $limit;
}

function record_hit(string $kind): void
{
    db()->prepare("INSERT INTO hits (kind, ip_hash) VALUES (?, ?)")->execute([$kind, ip_hash()]);
}

function clear_hits(string $kind): void
{
    db()->prepare("DELETE FROM hits WHERE kind = ? AND ip_hash = ?")->execute([$kind, ip_hash()]);
}

function setting(string $name, ?string $default = null): ?string
{
    $stmt = db()->prepare("SELECT value FROM settings WHERE name = ?");
    $stmt->execute([$name]);
    $value = $stmt->fetchColumn();
    return $value === false ? $default : $value;
}

function set_setting(string $name, string $value): void
{
    db()->prepare("INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)")->execute([$name, $value]);
}

/* Where new-request e-mails go: set in the admin panel, falls back to the address from the first setup. */
function notify_emails(): array
{
    $raw = setting('notify_email', config()['notify_email'] ?? '');
    $list = array_filter(array_map('trim', preg_split('/[,;\s]+/', (string) $raw)));
    return array_values(array_filter($list, fn ($e) => filter_var($e, FILTER_VALIDATE_EMAIL)));
}

/* Sender address: noreply@ the site's domain, so mail providers trust it. */
function notify_sender(): string
{
    $host = strtolower(preg_replace('/[^a-z0-9.-]/i', '', preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? 'sibebe.bg')));
    $host = preg_replace('/^www\./', '', $host);
    return 'noreply@' . (filter_var($host, FILTER_VALIDATE_IP) || $host === 'localhost' || $host === '' ? 'sibebe.bg' : $host);
}

function send_notification(string $subject, string $body, string $replyTo = ''): bool
{
    $to = notify_emails();
    if (!$to) {
        return false;
    }
    $from = notify_sender();
    $name = '=?UTF-8?B?' . base64_encode('Sí bebé') . '?=';
    $headers = "From: {$name} <{$from}>\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit";
    if ($replyTo !== '' && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) {
        $headers .= "\r\nReply-To: {$replyTo}";
    }
    // -f sets the envelope sender to the same domain as From, so SPF/DMARC pass and the mail stays out of spam
    return @mail(implode(', ', $to), '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers, '-f' . $from);
}

/* True when PHP dropped the whole form because it was over post_max_size. */
function post_too_large(): bool
{
    return $_SERVER['REQUEST_METHOD'] === 'POST' && empty($_POST) && empty($_FILES) && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0;
}

function json_out($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function clean($value, int $max = 190): string
{
    $value = trim(preg_replace('/\s+/u', ' ', is_string($value) ? $value : ''));
    return mb_substr($value, 0, $max);
}

/* Like clean(), but keeps paragraphs: for reviews and event descriptions. */
function clean_text($value, int $max = 2000): string
{
    $value = str_replace(["\r\n", "\r"], "\n", is_string($value) ? $value : '');
    $value = preg_replace('/[^\S\n]+/u', ' ', $value);
    $value = preg_replace('/ *\n */', "\n", $value);
    $value = trim(preg_replace('/\n{3,}/', "\n\n", $value));
    return mb_substr($value, 0, $max);
}

function h(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

/* Checks an uploaded file and returns getimagesize() info. */
function check_upload(array $file): array
{
    $error = $file['error'] ?? UPLOAD_ERR_NO_FILE;
    if (in_array($error, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) {
        throw new RuntimeException('Снимката е твърде голяма. Максимумът е 12 MB.');
    }
    if ($error === UPLOAD_ERR_NO_FILE) {
        throw new RuntimeException('Не е избрана снимка.');
    }
    if ($error !== UPLOAD_ERR_OK) {
        throw new RuntimeException('Снимката не беше качена. Опитайте отново.');
    }
    if ($file['size'] > MAX_UPLOAD_BYTES) {
        throw new RuntimeException('Файлът е по-голям от 12 MB.');
    }
    $info = @getimagesize($file['tmp_name']);
    if (!$info || !in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) {
        throw new RuntimeException('Позволени са само снимки JPG, PNG или WEBP.');
    }
    if ($info[0] * $info[1] > 40000000) {
        throw new RuntimeException('Снимката е с твърде голяма резолюция (над 40 мегапиксела). Намалете я и опитайте отново.');
    }
    return $info;
}

/* Loads, turns upright and shrinks a photo with GD. Re-encoding also strips camera data such as GPS. Null without GD. */
function resized_image(array $file, array $info, int $maxSide)
{
    if (!function_exists('imagecreatetruecolor')) {
        return null;
    }
    @ini_set('memory_limit', '256M'); // large phone photos need room while they are decoded
    $src = match ($info[2]) {
        IMAGETYPE_JPEG => @imagecreatefromjpeg($file['tmp_name']),
        IMAGETYPE_PNG => @imagecreatefrompng($file['tmp_name']),
        IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($file['tmp_name']) : false,
        default => false,
    };
    if (!$src) {
        return null;
    }
    if ($info[2] === IMAGETYPE_JPEG && function_exists('exif_read_data')) {
        $exif = @exif_read_data($file['tmp_name']);
        $rotate = [3 => 180, 6 => -90, 8 => 90][$exif['Orientation'] ?? 1] ?? 0;
        if ($rotate) {
            $src = imagerotate($src, $rotate, 0);
        }
    }
    [$w, $h] = [imagesx($src), imagesy($src)];
    $scale = min(1, $maxSide / max($w, $h));
    $nw = (int) round($w * $scale);
    $nh = (int) round($h * $scale);
    $dst = imagecreatetruecolor($nw, $nh);
    imagealphablending($dst, false);
    imagesavealpha($dst, true);
    imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
    return $dst;
}

/* Saves an uploaded image under /uploads with a random name. */
function save_upload(array $file, int $maxSide = 1800): string
{
    $info = check_upload($file);
    if (!is_dir(UPLOAD_DIR)) {
        mkdir(UPLOAD_DIR, 0755, true);
    }
    $name = date('Ymd') . '-' . bin2hex(random_bytes(6));
    $img = resized_image($file, $info, $maxSide);
    if ($img) {
        if (function_exists('imagewebp') && imagewebp($img, UPLOAD_DIR . "/{$name}.webp", 82)) {
            return "uploads/{$name}.webp";
        }
        if (imagejpeg($img, UPLOAD_DIR . "/{$name}.jpg", 85)) {
            return "uploads/{$name}.jpg";
        }
    }
    $ext = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp'][$info[2]];
    if (!move_uploaded_file($file['tmp_name'], UPLOAD_DIR . "/{$name}.{$ext}")) {
        throw new RuntimeException('Файлът не можа да бъде записан.');
    }
    return "uploads/{$name}.{$ext}";
}

/* Replaceable site photos (see api/slots.php). */
function slots(): array
{
    return require __DIR__ . '/slots.php';
}

/* Writes a new photo over a slot file, keeping its name so the pages need no change. */
function save_slot(array $file, string $slot): void
{
    $slots = slots();
    if (!isset($slots[$slot])) {
        throw new RuntimeException('Непознато място за снимка.');
    }
    $info = check_upload($file);
    $target = __DIR__ . '/../' . $slots[$slot]['file'];
    $ext = pathinfo($target, PATHINFO_EXTENSION);
    $tmp = $target . '.tmp';
    $img = resized_image($file, $info, match ($slot) { 'price-list' => 2400, 'share' => 1200, 'logo' => 600, default => 1800 });
    $ok = false;
    if ($img) {
        $ok = $ext === 'webp' && function_exists('imagewebp') ? imagewebp($img, $tmp, 84) : imagejpeg($img, $tmp, 86);
    } elseif (($ext === 'webp' && $info[2] === IMAGETYPE_WEBP) || ($ext === 'jpg' && $info[2] === IMAGETYPE_JPEG)) {
        $ok = move_uploaded_file($file['tmp_name'], $tmp);
    } else {
        throw new RuntimeException('Сървърът не може да преобразува този формат. Качете снимка във формат ' . strtoupper($ext) . '.');
    }
    if (!$ok || !rename($tmp, $target)) {
        @unlink($tmp);
        throw new RuntimeException('Снимката не можа да бъде записана.');
    }
    set_setting('slot:' . $slot, date('c'));
}

function reset_slot(string $slot): void
{
    $slots = slots();
    if (!isset($slots[$slot])) {
        return;
    }
    if (!copy(__DIR__ . '/../' . $slots[$slot]['default'], __DIR__ . '/../' . $slots[$slot]['file'])) {
        throw new RuntimeException('Оригиналната снимка не можа да бъде върната.');
    }
    db()->prepare("DELETE FROM settings WHERE name = ?")->execute(['slot:' . $slot]);
}

function delete_upload(?string $path): void
{
    if ($path && preg_match('#^uploads/[\w.-]+$#', $path)) {
        @unlink(__DIR__ . '/../' . $path);
    }
}
