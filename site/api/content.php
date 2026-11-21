<?php
/* Public content for the site: reviews, gallery, events, price list. GET ?type=... */

declare(strict_types=1);
require __DIR__ . '/lib.php';

try {
    $type = $_GET['type'] ?? '';
    $pdo = db();
    switch ($type) {
        case 'reviews':
            $rows = $pdo->query("SELECT author, text, stars FROM reviews WHERE visible = 1 ORDER BY created_at DESC, id DESC")->fetchAll();
            foreach ($rows as &$row) {
                $row['stars'] = (int) $row['stars'];
            }
            json_out($rows);

        case 'gallery':
            json_out($pdo->query("SELECT file AS url, alt, category FROM gallery ORDER BY created_at DESC, id DESC")->fetchAll());

        case 'events':
            $rows = $pdo->query("SELECT title, description, event_date, image, link FROM events ORDER BY event_date DESC")->fetchAll();
            $now = new DateTimeImmutable();
            json_out(array_map(fn ($row) => [
                'title' => $row['title'],
                'description' => $row['description'],
                'date' => (new DateTimeImmutable($row['event_date']))->format('c'),
                'image' => $row['image'],
                'link' => $row['link'],
                'past' => new DateTimeImmutable($row['event_date']) < $now,
            ], $rows));

        default:
            json_out(['error' => 'Unknown type'], 400);
    }
} catch (Throwable $e) {
    error_log('SI BEBE content: ' . $e->getMessage());
    json_out(['error' => 'Unavailable'], 503);
}
