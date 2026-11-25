<?php
/* Receives the booking and partner forms and stores them in the database. */

declare(strict_types=1);
require __DIR__ . '/lib.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['ok' => false, 'error' => 'Method not allowed'], 405);
}

// Only accept posts from this site
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$siteHost = preg_replace('/:\d+$/', '', strtolower($_SERVER['HTTP_HOST'] ?? ''));
if ($origin !== '' && strtolower((string) parse_url($origin, PHP_URL_HOST)) !== $siteHost) {
    json_out(['ok' => false, 'error' => 'Forbidden'], 403);
}

// Hidden field that people never see; bots fill it in
if (!empty($_POST['website'])) {
    json_out(['ok' => true]);
}

// The form must come from a page served by this site, and take a person at least a few seconds
$age = form_token_age($_POST['ft'] ?? null);
if ($age === null || $age > FORM_MAX_SECONDS) {
    json_out(['ok' => false, 'error' => 'Моля, презаредете страницата и изпратете формата отново.'], 400);
}
if ($age < FORM_MIN_SECONDS) {
    json_out(['ok' => true]); // too fast for a person: answer as if saved, store nothing
}

$form = is_string($_POST['form'] ?? null) ? $_POST['form'] : '';
$errors = [];
$required = function (string $key, int $max = 100) use (&$errors): string {
    $value = clean($_POST[$key] ?? '', $max);
    if ($value === '') {
        $errors[] = $key;
    }
    return $value;
};

try {
    if (too_many('submit', 5, 60)) {
        json_out(['ok' => false, 'error' => 'Твърде много заявки. Моля, опитайте по-късно или ни се обадете.'], 429);
    }
    if (!is_string($_POST['privacy_ack'] ?? null) || $_POST['privacy_ack'] !== 'Да') {
        $errors[] = 'privacy_ack';
    }
    $email = $required('email', 190);
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'email';
    }

    if ($form === 'booking') {
        $data = [
            'parent_first_name' => $required('parent_first_name'),
            'parent_last_name' => $required('parent_last_name'),
            'email' => $email,
            'phone' => $required('phone', 40),
            'child_first_name' => $required('child_first_name'),
            'child_last_name' => $required('child_last_name'),
            'child_age' => $required('child_age', 40),
        ];
        if (!in_array($data['child_age'], CHILD_AGES, true)) {
            $errors[] = 'child_age';
        }
        $table = 'bookings';
        $subject = 'Нова заявка за час – ' . $data['parent_first_name'] . ' ' . $data['parent_last_name'];
        $lines = [
            'Родител' => $data['parent_first_name'] . ' ' . $data['parent_last_name'],
            'Телефон' => $data['phone'],
            'Имейл' => $data['email'],
            'Дете' => $data['child_first_name'] . ' ' . $data['child_last_name'],
            'Възраст' => $data['child_age'],
        ];
    } elseif ($form === 'partner') {
        $data = [
            'first_name' => $required('first_name'),
            'last_name' => $required('last_name'),
            'company' => $required('company', 190),
            'email' => $email,
            'phone' => $required('phone', 40),
        ];
        $table = 'partners';
        $subject = 'Нова заявка за партньорство – ' . $data['company'];
        $lines = [
            'Име' => $data['first_name'] . ' ' . $data['last_name'],
            'Компания' => $data['company'],
            'Телефон' => $data['phone'],
            'Имейл' => $data['email'],
        ];
    } else {
        json_out(['ok' => false, 'error' => 'Unknown form'], 400);
    }

    if ($errors) {
        json_out(['ok' => false, 'error' => 'Моля, попълнете всички задължителни полета.', 'fields' => array_values(array_unique($errors))], 422);
    }

    $columns = implode(', ', array_keys($data));
    $marks = implode(', ', array_fill(0, count($data), '?'));
    db()->prepare("INSERT INTO {$table} ({$columns}) VALUES ({$marks})")->execute(array_values($data));
    $newId = (int) db()->lastInsertId();
    record_hit('submit');
    purge_old_data();
    notify($subject, $lines, $email, $table, $newId);

    json_out(['ok' => true]);
} catch (Throwable $e) {
    error_log('SI BEBE submit: ' . $e->getMessage());
    json_out(['ok' => false, 'error' => 'Възникна грешка. Моля, опитайте отново.'], 500);
}

/* E-mail to the centre. Contains only what the visitor typed, with a link to the admin panel. */
function notify(string $subject, array $lines, string $replyTo, string $table, int $id): void
{
    $host = preg_replace('/[^a-z0-9.:-]/i', '', $_SERVER['HTTP_HOST'] ?? 'sibebe.bg');
    $body = '';
    foreach ($lines as $label => $value) {
        $body .= $label . ': ' . str_replace(["\r", "\n"], ' ', $value) . "\n";
    }
    // Straight to this request in the admin panel (after logging in, if needed)
    $body .= "\nОтвори заявката: https://{$host}/admin/?p={$table}&entry={$id}\n";
    $body .= "Всички заявки: https://{$host}/admin/?p={$table}\n";
    send_notification(str_replace(["\r", "\n"], ' ', $subject), $body, $replyTo);
}
