<?php
/* While maintenance.flag exists, .htaccess sends every page here:
   logged-in admins see the real page, everyone else sees maintenance.html. */

declare(strict_types=1);
require __DIR__ . '/api/lib.php';

$page = (string) ($_GET['page'] ?? '');
if (!preg_match('/^[a-z0-9-]*$/', $page)) {
    $page = '404';
}

// Only look for a session when the browser has one, so visitors do not get session files
$admin = false;
if (!empty($_COOKIE['sibebe_session'])) {
    start_admin_session();
    $admin = !empty($_SESSION['admin']);
    session_write_close();
}

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');

if (!$admin) {
    // 503 tells search engines the site is coming back, so nothing gets indexed meanwhile
    http_response_code(503);
    header('Retry-After: 86400');
    header('X-Robots-Tag: noindex');
    readfile(__DIR__ . '/maintenance.html');
    exit;
}

$file = __DIR__ . '/' . ($page === '' ? 'index' : $page) . '.html';
if (!is_file($file)) {
    http_response_code(404);
    $file = __DIR__ . '/404.html';
}
readfile($file);
