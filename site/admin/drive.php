<?php
/* Gallery import from a shared Google Drive folder, one photo per request so long imports never time out.
   POST action=list (link) -> photos to import; POST action=import (id, category, alt) -> stores one photo. */

declare(strict_types=1);
require __DIR__ . '/../api/lib.php';

start_admin_session();
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

if (empty($_SESSION['admin'])) {
    json_out(['ok' => false, 'error' => 'Сесията изтече. Влезте отново.'], 401);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !hash_equals($_SESSION['csrf'] ?? '', (string) ($_POST['csrf'] ?? ''))) {
    json_out(['ok' => false, 'error' => 'Страницата беше отворена твърде дълго. Презаредете я.'], 400);
}
session_write_close(); // let several imports run without waiting for each other's session lock

try {
    $action = (string) ($_POST['action'] ?? '');

    if ($action === 'list') {
        $ids = drive_ids((string) ($_POST['link'] ?? ''));
        if (!$ids['folders'] && !$ids['files']) {
            json_out(['ok' => false, 'error' => 'Поставете линк към папка или снимка от Google Drive.'], 422);
        }
        $photos = [];
        $skipped = [];
        foreach ($ids['folders'] as $folder) {
            foreach (drive_folder_files($folder) as $file) {
                if (!preg_match('/\.(jpe?g|png|webp)$/i', $file['name'])) {
                    $skipped[] = $file['name'];
                    continue;
                }
                $photos[$file['id']] = $file;
            }
        }
        foreach ($ids['files'] as $id) {
            $photos[$id] ??= ['id' => $id, 'name' => 'снимка'];
        }
        // Photos imported before are left out, so the same folder can be imported again for new photos only
        $already = 0;
        foreach (array_keys($photos) as $id) {
            if (setting('drive:' . $id) !== null) {
                unset($photos[$id]);
                $already++;
            }
        }
        json_out(['ok' => true, 'photos' => array_values($photos), 'already' => $already, 'skipped' => $skipped]);
    }

    if ($action === 'import') {
        $id = (string) ($_POST['id'] ?? '');
        $category = array_key_exists($_POST['category'] ?? '', gallery_categories()) ? $_POST['category'] : '';
        $alt = clean($_POST['alt'] ?? '', 190) ?: 'Снимка от Sí bebé';
        if (setting('drive:' . $id) !== null) {
            json_out(['ok' => true, 'skipped' => true]);
        }
        $path = import_drive_photo($id);
        db()->prepare("INSERT INTO gallery (file, alt, category) VALUES (?, ?, ?)")->execute([$path, $alt, $category]);
        set_setting('drive:' . $id, $path);
        json_out(['ok' => true]);
    }

    json_out(['ok' => false, 'error' => 'Непозната заявка.'], 400);
} catch (RuntimeException $e) {
    json_out(['ok' => false, 'error' => $e->getMessage()], 422);
} catch (Throwable $e) {
    error_log('SI BEBE drive: ' . $e->getMessage());
    json_out(['ok' => false, 'error' => 'Възникна грешка. Опитайте отново.'], 500);
}
