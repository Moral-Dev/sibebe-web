<?php
/* Serves every page: puts in the texts edited on the site, and while maintenance.flag exists
   shows the "coming soon" page to everyone except logged-in admins. */

declare(strict_types=1);
require __DIR__ . '/api/lib.php';

$page = (string) ($_GET['page'] ?? '');
if (!preg_match('/^[a-z0-9-]*$/', $page) || $page === 'maintenance') {
    $page = '404';
}

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache');

if (is_file(MAINTENANCE_FLAG)) {
    // Only look for a session when the browser has one, so visitors do not get session files
    $admin = false;
    if (!empty($_COOKIE['sibebe_session'])) {
        start_admin_session();
        $admin = !empty($_SESSION['admin']);
        session_write_close();
    }
    if (!$admin) {
        // 503 tells search engines the site is coming back, so nothing gets indexed meanwhile
        http_response_code(503);
        header('Retry-After: 86400');
        header('X-Robots-Tag: noindex');
        header('Cache-Control: no-store');
        readfile(__DIR__ . '/maintenance.html');
        exit;
    }
    header('Cache-Control: no-store');
}

$file = __DIR__ . '/' . ($page === '' ? 'index' : $page) . '.html';
if (!is_file($file) || $page === '404') {
    http_response_code(404);
    $file = __DIR__ . '/404.html';
}
echo apply_text_overrides((string) file_get_contents($file), text_overrides());
