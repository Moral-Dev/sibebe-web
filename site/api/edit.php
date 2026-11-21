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
                'prev' => is_file(slot_prev_path($key)),
            ];
        }
        $texts = [];
        $textPrev = [];
        foreach (db()->query("SELECT name FROM settings WHERE name LIKE 'text:%' OR name LIKE 'textprev:%'") as $row) {
            if (str_starts_with($row['name'], 'textprev:')) {
                $textPrev[] = substr($row['name'], 9);
            } else {
                $texts[] = substr($row['name'], 5);
            }
        }
        // The cache file can go missing (e.g. after moving servers); the database is the source
        if ($texts && !isset(text_overrides()['texts'][$texts[0]])) {
            rebuild_text_cache();
        }
        json_out(['editor' => true, 'user' => $_SESSION['admin'], 'csrf' => $_SESSION['csrf'], 'slots' => $slots, 'texts' => $texts, 'textPrev' => $textPrev]);
    }

    if (!hash_equals($_SESSION['csrf'], (string) ($_POST['csrf'] ?? ''))) {
        json_out(['ok' => false, 'error' => 'Сесията е изтекла. Презаредете страницата.'], 400);
    }
    $action = (string) ($_POST['action'] ?? '');

    // Texts on the page
    if (in_array($action, ['text_save', 'text_reset', 'text_undo'], true)) {
        $key = (string) ($_POST['key'] ?? '');
        $original = original_text($key);
        if ($original === null) {
            json_out(['ok' => false, 'error' => 'Този текст не може да бъде редактиран.'], 400);
        }
        if ($action === 'text_undo') {
            $prev = previous_text($key);
            if ($prev === false) {
                json_out(['ok' => false, 'error' => 'Няма предишен текст.'], 422);
            }
            $target = $prev;
        } elseif ($action === 'text_reset') {
            $target = null;
        } else {
            $kind = text_kind($key);
            $target = $kind !== '' ? clean_plain_text((string) ($_POST['html'] ?? ''), $kind) : clean_text_html((string) ($_POST['html'] ?? ''));
            if (strip_tags($target) === '') {
                json_out(['ok' => false, 'error' => 'Текстът не може да е празен.'], 422);
            }
            $same = fn ($a) => html_entity_decode((string) $a, ENT_QUOTES, 'UTF-8');
            if ($same($target) === $same(clean_text_html($original))) {
                $target = null; // typed back the original: no saved version needed
            }
            if ($same($target ?? $original) === $same(current_text($key) ?? $original)) {
                json_out(['ok' => true, 'html' => $target ?? $original, 'changed' => current_text($key) !== null, 'prev' => previous_text($key) !== false]);
            }
        }
        set_text($key, $target);
        json_out(['ok' => true, 'html' => $target ?? $original, 'changed' => $target !== null, 'prev' => true]);
    }

    $slot = (string) ($_POST['slot'] ?? '');
    if (!isset(slots()[$slot])) {
        json_out(['ok' => false, 'error' => 'Непознато място за снимка.'], 400);
    }

    if ($action === 'reset') {
        reset_slot($slot);
        $changed = false;
    } elseif ($action === 'undo') {
        undo_slot($slot);
        $changed = setting('slot:' . $slot) !== null;
    } else {
        save_slot($_FILES['image'] ?? [], $slot);
        $changed = true;
    }
    $file = slots()[$slot]['file'];
    json_out(['ok' => true, 'url' => $file . '?v=' . substr(md5_file(__DIR__ . '/../' . $file), 0, 10), 'changed' => $changed, 'prev' => is_file(slot_prev_path($slot))]);
} catch (RuntimeException $e) {
    json_out(['ok' => false, 'error' => $e->getMessage()], 422);
} catch (Throwable $e) {
    error_log('SI BEBE edit: ' . $e->getMessage());
    json_out(['ok' => false, 'error' => 'Възникна грешка. Опитайте отново.'], 500);
}
