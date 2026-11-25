# Sí bebé – уебсайт

Сайтът на https://sibebe.bg. Целият код е в папка `site/`.

- `site/tools/build.py` генерира HTML страниците (`python3 site/tools/build.py`).
- `site/api/` – PHP за формите, съдържанието от админ панела и базата данни.
- `site/admin/` – админ панелът (`/admin/`).

## Качване

При push в `main` GitHub Actions (`.github/workflows/build-superhosting.yml`) изгражда сайта и го публикува в клона `superhosting`.
Сървърът на SuperHosting сам изтегля този клон (cron в cPanel) и копира файловете в `public_html`.
Кой билд е на сървъра: https://sibebe.bg/build.txt
