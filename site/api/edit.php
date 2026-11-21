<?php
/* On-page editor: lets a logged-in admin replace site photos while browsing the site. */

declare(strict_types=1);
require __DIR__ . '/lib.php';

start_admin_session();
header('Cache-Control: no-store');

if (empty($_SESSION['admin'])) {
    set_editor_marker(false);
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        json_out(['ok' => false, 'error' => 'Сесията изтече. Влезте отново в админ панела.'], 401);
    }
    json_out(['editor' => false]);
}
if (post_too_large()) {
    json_out(['ok' => false, 'error' => 'Снимката е твърде голяма. Максимумът е 12 MB.'], 413);
}

$_SESSION['csrf'] ??= bin2hex(random_bytes(16));

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $slots = [];
        foreach (slots() as $key => $slot) {
            $slots[$key] = [
                'label' => $slot['page'] . ' – ' . $slot['label'],
                'file' => $slot['file'],
                'changed' => setting('slot:' . $key) !== null,
            ];
        }
        json_out(['editor' => true, 'user' => $_SESSION['admin'], 'csrf' => $_SESSION['csrf'], 'slots' => $slots]);
    }

    if (!hash_equals($_SESSION['csrf'], (string) ($_POST['csrf'] ?? ''))) {
        json_out(['ok' => false, 'error' => 'Сесията е изтекла. Презаредете страницата.'], 400);
    }
    $slot = (string) ($_POST['slot'] ?? '');
    if (!isset(slots()[$slot])) {
        json_out(['ok' => false, 'error' => 'Непознато място за снимка.'], 400);
    }

    if (($_POST['action'] ?? '') === 'reset') {
        reset_slot($slot);
        $changed = false;
    } else {
        save_slot($_FILES['image'] ?? [], $slot);
        $changed = true;
    }
    $file = slots()[$slot]['file'];
    json_out(['ok' => true, 'url' => $file . '?v=' . substr(md5_file(__DIR__ . '/../' . $file), 0, 10), 'changed' => $changed]);
} catch (RuntimeException $e) {
    json_out(['ok' => false, 'error' => $e->getMessage()], 422);
} catch (Throwable $e) {
    error_log('SI BEBE edit: ' . $e->getMessage());
    json_out(['ok' => false, 'error' => 'Възникна грешка. Опитайте отново.'], 500);
}
