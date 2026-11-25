/* Sí bebé admin panel: own-styled controls instead of the browser's built-in ones
   (toasts, password eye, confirm dialog, dropdowns, file picker, date and time picker, form checks). */
(function () {
    'use strict';

    var MONTHS = ['януари', 'февруари', 'март', 'април', 'май', 'юни', 'юли', 'август', 'септември', 'октомври', 'ноември', 'декември'];
    var MONTHS_TITLE = ['Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни', 'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'];
    var DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
    var ICON = {
        chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
        left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
        right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
        calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
        upload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>',
        check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
    };
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var el = function (tag, cls, html) {
        var node = document.createElement(tag);
        if (cls) node.className = cls;
        if (html != null) node.innerHTML = html;
        return node;
    };

    /* ---------- Toasts ---------- */
    var toast = function (node) {
        var close = el('button', 'toast-close', '&times;');
        close.type = 'button';
        close.setAttribute('aria-label', 'Затвори');
        node.appendChild(close);
        document.body.appendChild(node);
        var hide = function () { node.classList.add('is-leaving'); setTimeout(function () { node.remove(); }, 300); };
        close.addEventListener('click', hide);
        setTimeout(hide, node.classList.contains('toast--error') ? 7000 : 4000);
    };
    document.querySelectorAll('.toast').forEach(toast);
    var sayError = function (message) {
        document.querySelectorAll('.toast--live').forEach(function (t) { t.remove(); });
        var node = el('p', 'toast toast--error toast--live');
        node.setAttribute('role', 'alert');
        node.textContent = message;
        toast(node);
    };

    /* ---------- A request opened from the notification e-mail: bring it into view ---------- */
    var target = document.querySelector('.entry.is-target');
    if (target) setTimeout(function () { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 150);

    /* ---------- Password eye ---------- */
    var eye = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
    var eyeOff = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.9 8.3 2 12 2 12s3.6 7 10 7c1.7 0 3.2-.5 4.5-1.2"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
    document.querySelectorAll('input[type="password"]').forEach(function (input) {
        var wrap = el('span', 'pw-wrap');
        input.parentNode.insertBefore(wrap, input);
        wrap.appendChild(input);
        var button = el('button', 'pw-toggle', eye);
        button.type = 'button';
        button.setAttribute('aria-label', 'Покажи паролата');
        button.setAttribute('aria-pressed', 'false');
        button.addEventListener('click', function () {
            var show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            button.innerHTML = show ? eyeOff : eye;
            button.setAttribute('aria-label', show ? 'Скрий паролата' : 'Покажи паролата');
            button.setAttribute('aria-pressed', String(show));
            input.focus();
        });
        wrap.appendChild(button);
    });

    /* ---------- Confirm dialog ---------- */
    var askDialog = null;
    var ask = function (message, danger) {
        return new Promise(function (resolve) {
            if (!askDialog) {
                askDialog = el('div', 'ask', '<div class="ask-card" role="alertdialog" aria-modal="true" aria-labelledby="ask-text"><p id="ask-text"></p><div class="ask-actions"><button type="button" class="btn btn--ghost" data-ask="no">Отказ</button><button type="button" class="btn" data-ask="yes">Да</button></div></div>');
                document.body.appendChild(askDialog);
            }
            var yes = askDialog.querySelector('[data-ask="yes"]');
            var no = askDialog.querySelector('[data-ask="no"]');
            askDialog.querySelector('#ask-text').textContent = message;
            yes.className = 'btn' + (danger ? ' btn--solid-danger' : '');
            yes.textContent = danger ? 'Изтрий' : 'Да';
            var last = document.activeElement;
            var done = function (answer) {
                askDialog.classList.remove('is-open');
                document.removeEventListener('keydown', onKey, true);
                yes.onclick = no.onclick = askDialog.onclick = null;
                if (last && last.focus) last.focus();
                resolve(answer);
            };
            var onKey = function (e) {
                if (e.key === 'Escape') { e.preventDefault(); done(false); }
                if (e.key === 'Tab') { e.preventDefault(); (document.activeElement === yes ? no : yes).focus(); }
            };
            yes.onclick = function () { done(true); };
            no.onclick = function () { done(false); };
            askDialog.onclick = function (e) { if (e.target === askDialog) done(false); };
            document.addEventListener('keydown', onKey, true);
            askDialog.classList.add('is-open');
            (danger ? no : yes).focus();
        });
    };
    window.sibebeAsk = ask;

    /* ---------- Dropdowns ---------- */
    var openSelect = null;
    var closeSelect = function () {
        if (!openSelect) return;
        openSelect.classList.remove('is-open');
        openSelect.querySelector('.sel-button').setAttribute('aria-expanded', 'false');
        openSelect = null;
    };
    document.addEventListener('click', function (e) { if (openSelect && e.composedPath().indexOf(openSelect) < 0) closeSelect(); });
    var enhanceSelect = function (select) {
        var wrap = el('div', 'sel');
        select.parentNode.insertBefore(wrap, select);
        wrap.appendChild(select);
        select.classList.add('sel-native');
        select.tabIndex = -1;
        var button = el('button', 'sel-button', '<span class="sel-value"></span>' + ICON.chevron);
        button.type = 'button';
        button.setAttribute('aria-haspopup', 'listbox');
        button.setAttribute('aria-expanded', 'false');
        var label = select.closest('label');
        if (select.getAttribute('aria-label')) button.setAttribute('aria-label', select.getAttribute('aria-label'));
        else if (label) button.setAttribute('aria-label', (label.firstChild && label.firstChild.textContent || '').trim());
        else if (select.getAttribute('aria-label')) button.setAttribute('aria-label', select.getAttribute('aria-label'));
        var list = el('ul', 'sel-list');
        list.setAttribute('role', 'listbox');
        // The button comes first, so clicking the field's label opens this list, not the hidden native one
        wrap.insertBefore(button, select);
        wrap.appendChild(list);
        var render = function () {
            list.innerHTML = '';
            Array.prototype.forEach.call(select.options, function (option, i) {
                var item = el('li', 'sel-option' + (option.selected ? ' is-selected' : ''));
                item.setAttribute('role', 'option');
                item.setAttribute('aria-selected', String(option.selected));
                item.dataset.index = i;
                item.textContent = option.textContent;
                list.appendChild(item);
            });
            button.querySelector('.sel-value').textContent = select.options[select.selectedIndex] ? select.options[select.selectedIndex].textContent : '';
        };
        var choose = function (i) {
            select.selectedIndex = i;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            render();
            closeSelect();
            button.focus();
        };
        var active = function () { return list.querySelector('.is-active') || list.querySelector('.is-selected'); };
        var move = function (step) {
            var items = list.querySelectorAll('.sel-option');
            var current = active();
            var i = current ? +current.dataset.index + step : 0;
            i = Math.max(0, Math.min(items.length - 1, i));
            items.forEach(function (item) { item.classList.remove('is-active'); });
            items[i].classList.add('is-active');
            items[i].scrollIntoView({ block: 'nearest' });
        };
        button.addEventListener('click', function () {
            if (openSelect === wrap) { closeSelect(); return; }
            closeSelect();
            render();
            wrap.classList.add('is-open');
            button.setAttribute('aria-expanded', 'true');
            openSelect = wrap;
            var selected = list.querySelector('.is-selected');
            if (selected) selected.scrollIntoView({ block: 'nearest' });
        });
        button.addEventListener('keydown', function (e) {
            var open = openSelect === wrap;
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                if (!open) button.click(); else move(e.key === 'ArrowDown' ? 1 : -1);
            } else if ((e.key === 'Enter' || e.key === ' ') && open) {
                e.preventDefault();
                var current = active();
                if (current) choose(+current.dataset.index);
            } else if (e.key === 'Escape' && open) {
                e.preventDefault();
                closeSelect();
            }
        });
        list.addEventListener('click', function (e) {
            e.preventDefault(); // inside a <label> a click would otherwise re-open the list
            var item = e.target.closest('.sel-option');
            if (item) choose(+item.dataset.index);
        });
        select.addEventListener('change', render);
        render();
        return wrap;
    };
    document.querySelectorAll('select').forEach(enhanceSelect);

    /* ---------- File picker with previews and drag and drop ---------- */
    document.querySelectorAll('input[type="file"]').forEach(function (input) {
        var multiple = input.multiple;
        var zone = el('div', 'pick');
        input.parentNode.insertBefore(zone, input);
        zone.appendChild(input);
        input.classList.add('pick-native');
        var button = el('button', 'pick-button', ICON.upload + '<span>' + (multiple ? 'Изберете снимки' : 'Изберете снимка') + '</span>');
        button.type = 'button';
        var hint = el('span', 'pick-hint', multiple ? 'или ги пуснете тук' : 'или я пуснете тук');
        var previews = el('div', 'pick-previews');
        zone.appendChild(button);
        zone.appendChild(hint);
        zone.appendChild(previews);
        button.addEventListener('click', function () { input.click(); });
        var show = function () {
            previews.innerHTML = '';
            var files = Array.prototype.slice.call(input.files || []);
            zone.classList.toggle('has-files', files.length > 0);
            hint.textContent = files.length
                ? (files.length === 1 ? files[0].name : 'Избрани снимки: ' + files.length)
                : (multiple ? 'или ги пуснете тук' : 'или я пуснете тук');
            files.slice(0, 12).forEach(function (file) {
                var img = el('img');
                img.alt = '';
                img.src = URL.createObjectURL(file);
                img.onload = function () { URL.revokeObjectURL(img.src); };
                previews.appendChild(img);
            });
            zone.classList.remove('is-invalid');
        };
        input.addEventListener('change', show);
        ['dragenter', 'dragover'].forEach(function (type) {
            zone.addEventListener(type, function (e) { e.preventDefault(); zone.classList.add('is-drag'); });
        });
        ['dragleave', 'drop'].forEach(function (type) {
            zone.addEventListener(type, function (e) { e.preventDefault(); zone.classList.remove('is-drag'); });
        });
        zone.addEventListener('drop', function (e) {
            var files = Array.prototype.filter.call(e.dataTransfer.files, function (f) { return /^image\/(jpeg|png|webp)$/.test(f.type); });
            if (!files.length) { sayError('Позволени са само снимки JPG, PNG или WEBP.'); return; }
            var dt = new DataTransfer();
            (multiple ? files : files.slice(0, 1)).forEach(function (f) { dt.items.add(f); });
            input.files = dt.files;
            show();
        });
    });

    /* ---------- Date and time picker ---------- */
    var parseLocal = function (value) {
        var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value || '');
        return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : null;
    };
    var formatLong = function (d) { return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + ' г., ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ' ч.'; };
    document.querySelectorAll('input[type="datetime-local"]').forEach(function (input) {
        var required = input.required;
        var hidden = el('input');
        hidden.type = 'hidden';
        hidden.name = input.name;
        hidden.value = input.value;
        var wrap = el('div', 'dp');
        if (required) wrap.dataset.required = '1';
        var button = el('button', 'dp-button', ICON.calendar + '<span class="dp-value"></span>');
        button.type = 'button';
        button.setAttribute('aria-haspopup', 'dialog');
        var pop = el('div', 'dp-pop');
        pop.setAttribute('role', 'dialog');
        pop.setAttribute('aria-label', 'Изберете дата и час');
        wrap.appendChild(hidden);
        wrap.appendChild(button);
        wrap.appendChild(pop);
        input.parentNode.replaceChild(wrap, input);

        var chosen = parseLocal(hidden.value);
        var view = chosen ? new Date(chosen.getFullYear(), chosen.getMonth(), 1) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        var time = { h: chosen ? chosen.getHours() : 10, m: chosen ? chosen.getMinutes() : 0 };

        var hourSelect = el('select');
        var minuteSelect = el('select');
        for (var h = 0; h < 24; h++) hourSelect.add(new Option(pad(h), h));
        var minutes = [0, 15, 30, 45];
        if (minutes.indexOf(time.m) < 0) minutes.push(time.m);
        minutes.sort(function (a, b) { return a - b; }).forEach(function (m) { minuteSelect.add(new Option(pad(m), m)); });
        hourSelect.value = time.h;
        minuteSelect.value = time.m;
        hourSelect.setAttribute('aria-label', 'Час');
        minuteSelect.setAttribute('aria-label', 'Минути');

        pop.innerHTML = '<div class="dp-head"><button type="button" class="dp-nav" data-step="-1" aria-label="Предишен месец">' + ICON.left + '</button><strong class="dp-title"></strong><button type="button" class="dp-nav" data-step="1" aria-label="Следващ месец">' + ICON.right + '</button></div>'
            + '<div class="dp-grid dp-days">' + DAYS.map(function (d) { return '<span>' + d + '</span>'; }).join('') + '</div><div class="dp-grid dp-dates"></div>'
            + '<div class="dp-time"><span>Час</span></div><div class="dp-foot"><button type="button" class="btn btn--small btn--ghost" data-dp="today">Днес</button><button type="button" class="btn btn--small" data-dp="done">Готово</button></div>';
        var timeRow = pop.querySelector('.dp-time');
        timeRow.appendChild(hourSelect);
        timeRow.appendChild(el('b', null, ':'));
        timeRow.appendChild(minuteSelect);
        enhanceSelect(hourSelect);
        enhanceSelect(minuteSelect);

        var write = function () {
            if (!chosen) { button.querySelector('.dp-value').textContent = 'Изберете дата и час'; button.classList.add('is-empty'); return; }
            chosen.setHours(time.h, time.m, 0, 0);
            hidden.value = chosen.getFullYear() + '-' + pad(chosen.getMonth() + 1) + '-' + pad(chosen.getDate()) + 'T' + pad(time.h) + ':' + pad(time.m);
            button.querySelector('.dp-value').textContent = formatLong(chosen);
            button.classList.remove('is-empty');
            wrap.classList.remove('is-invalid');
        };
        var draw = function () {
            pop.querySelector('.dp-title').textContent = MONTHS_TITLE[view.getMonth()] + ' ' + view.getFullYear();
            var grid = pop.querySelector('.dp-dates');
            grid.innerHTML = '';
            var first = (view.getDay() + 6) % 7; // Monday first
            var daysIn = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
            var today = new Date();
            for (var i = 0; i < first; i++) grid.appendChild(el('span'));
            for (var d = 1; d <= daysIn; d++) {
                var day = el('button', 'dp-day', String(d));
                day.type = 'button';
                day.dataset.day = d;
                if (d === today.getDate() && view.getMonth() === today.getMonth() && view.getFullYear() === today.getFullYear()) day.classList.add('is-today');
                if (chosen && d === chosen.getDate() && view.getMonth() === chosen.getMonth() && view.getFullYear() === chosen.getFullYear()) day.classList.add('is-selected');
                grid.appendChild(day);
            }
        };
        var open = function () {
            document.querySelectorAll('.dp.is-open').forEach(function (other) { other.classList.remove('is-open'); });
            draw();
            wrap.classList.add('is-open');
        };
        var close = function () { wrap.classList.remove('is-open'); };
        button.addEventListener('click', function () { wrap.classList.contains('is-open') ? close() : open(); });
        pop.addEventListener('click', function (e) {
            e.preventDefault(); // the picker sits inside a <label>; do not let clicks toggle it again
            var nav = e.target.closest('.dp-nav');
            var day = e.target.closest('.dp-day');
            var action = e.target.closest('[data-dp]');
            if (nav) { view.setMonth(view.getMonth() + +nav.dataset.step); draw(); }
            if (day) { chosen = new Date(view.getFullYear(), view.getMonth(), +day.dataset.day); write(); draw(); }
            if (action && action.dataset.dp === 'today') {
                var now = new Date();
                chosen = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                view = new Date(now.getFullYear(), now.getMonth(), 1);
                write(); draw();
            }
            if (action && action.dataset.dp === 'done') { close(); button.focus(); }
        });
        hourSelect.addEventListener('change', function () { time.h = +hourSelect.value; if (chosen) write(); });
        minuteSelect.addEventListener('change', function () { time.m = +minuteSelect.value; if (chosen) write(); });
        // composedPath: the clicked day is redrawn (removed) before this runs, so contains() would say "outside"
        document.addEventListener('click', function (e) { if (e.composedPath().indexOf(wrap) < 0) close(); });
        wrap.addEventListener('keydown', function (e) { if (e.key === 'Escape' && wrap.classList.contains('is-open')) { e.stopPropagation(); close(); button.focus(); } });
        write();
    });

    /* ---------- Google Drive import (gallery): one photo per request, with a progress bar ---------- */
    document.querySelectorAll('form[data-drive]').forEach(function (form) {
        var progress = form.querySelector('.drive-progress');
        var bar = progress.querySelector('.drive-bar span');
        var status = progress.querySelector('.drive-status');
        var button = form.querySelector('[type="submit"]');
        var post = function (data) {
            data.append('csrf', form.dataset.csrf);
            return fetch('drive.php', { method: 'POST', body: data, headers: { Accept: 'application/json' } })
                .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'Сървърът не отговори.' }; }); });
        };
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (form.dataset.confirmed) return;
            var link = form.link.value.trim();
            if (!link) return;
            button.disabled = true;
            progress.hidden = false;
            bar.style.width = '4%';
            status.textContent = 'Търся снимките в папката…';
            var list = new FormData();
            list.append('action', 'list');
            list.append('link', link);
            post(list).then(function (res) {
                if (!res.ok) throw new Error(res.error);
                var photos = res.photos;
                var note = (res.already ? ' Вече внесени (пропуснати): ' + res.already + '.' : '') + (res.skipped.length ? ' Файлове, които не са снимки JPG/PNG/WEBP: ' + res.skipped.length + '.' : '');
                if (!photos.length) {
                    status.textContent = 'Няма нови снимки за внасяне.' + note;
                    bar.style.width = '100%';
                    button.disabled = false;
                    return;
                }
                var done = 0, failed = 0, i = 0;
                var next = function () {
                    if (i >= photos.length) {
                        status.textContent = 'Готово: внесени ' + done + (failed ? ', неуспешни ' + failed : '') + '.' + note;
                        setTimeout(function () { location.href = '?p=gallery'; }, 1400);
                        return;
                    }
                    var photo = photos[i++];
                    status.textContent = 'Внасям ' + i + ' от ' + photos.length + ': ' + photo.name;
                    var one = new FormData();
                    one.append('action', 'import');
                    one.append('id', photo.id);
                    one.append('category', form.category.value);
                    one.append('alt', form.alt.value);
                    post(one).then(function (r) { if (r.ok) done++; else failed++; })
                        .catch(function () { failed++; })
                        .then(function () { bar.style.width = Math.round(i / photos.length * 100) + '%'; next(); });
                };
                next();
            }).catch(function (err) {
                status.textContent = '';
                progress.hidden = true;
                button.disabled = false;
                sayError(err.message || 'Възникна грешка.');
            });
        });
    });

    /* ---------- Gallery: select several photos, then move or delete them together ---------- */
    document.querySelectorAll('form[data-bulk]').forEach(function (form) {
        var boxes = function () { return document.querySelectorAll('input[form="' + form.id + '"][name="ids[]"]'); };
        var all = form.querySelector('[data-bulk-all]');
        var count = form.querySelector('[data-bulk-count]');
        var update = function () {
            var list = boxes();
            var n = Array.prototype.filter.call(list, function (b) { return b.checked; }).length;
            count.textContent = n ? 'Избрани: ' + n : 'Няма избрани';
            form.classList.toggle('has-selection', n > 0);
            form.querySelectorAll('[data-bulk-need]').forEach(function (btn) { btn.disabled = n === 0; });
            all.checked = n > 0 && n === list.length;
            all.indeterminate = n > 0 && n < list.length;
            list.forEach(function (b) { b.closest('.photo').classList.toggle('is-picked', b.checked); });
        };
        all.addEventListener('change', function () {
            boxes().forEach(function (b) { b.checked = all.checked; });
            update();
        });
        document.addEventListener('change', function (e) { if (e.target.matches && e.target.matches('input[form="' + form.id + '"]')) update(); });
        // Click on the photo itself also selects it
        document.querySelectorAll('.photo img').forEach(function (img) {
            img.addEventListener('click', function () {
                var box = img.closest('.photo').querySelector('.photo-pick input');
                box.checked = !box.checked;
                update();
            });
        });
        form.addEventListener('submit', function (e) {
            if (form.dataset.confirmed) return;
            var op = e.submitter && e.submitter.value;
            var n = Array.prototype.filter.call(boxes(), function (b) { return b.checked; }).length;
            if (op !== 'delete') return;
            e.preventDefault();
            ask('Да изтрия ли ' + n + (n === 1 ? ' снимка' : ' снимки') + '? Това не може да се върне.', true).then(function (yes) {
                if (!yes) return;
                form.dataset.confirmed = '1';
                form.requestSubmit(e.submitter);
            });
        });
        update();
    });

    /* ---------- Forms: own messages instead of the browser bubbles, own confirm dialog ---------- */
    document.querySelectorAll('form').forEach(function (form) { form.noValidate = true; });
    var fieldName = function (node) {
        var label = node.closest('label');
        var text = label ? (label.firstChild && label.firstChild.nodeType === 3 ? label.firstChild.textContent : label.textContent) : '';
        return text.replace(/\(.*?\)/g, '').trim();
    };
    document.addEventListener('submit', function (e) {
        var form = e.target;
        if (form.dataset.confirmed || form.hasAttribute('data-drive')) return;
        if (form.hasAttribute('data-bulk')) return;
        var problems = [];
        form.querySelectorAll('[required]').forEach(function (field) {
            var empty = field.type === 'file' ? !field.files.length : !String(field.value).trim();
            var box = field.closest('.pick') || field;
            box.classList.toggle('is-invalid', empty);
            if (empty) problems.push(field);
        });
        form.querySelectorAll('.dp[data-required]').forEach(function (dp) {
            var empty = !dp.querySelector('input[type="hidden"]').value;
            dp.classList.toggle('is-invalid', empty);
            if (empty) problems.push(dp);
        });
        form.querySelectorAll('input[type="email"], input[type="url"]').forEach(function (field) {
            var value = field.value.trim();
            var bad = value && (field.type === 'email' ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) : !/^https?:\/\/\S+\.\S+/.test(value));
            if (bad) { field.classList.add('is-invalid'); problems.push(field); }
        });
        form.querySelectorAll('input[minlength]').forEach(function (field) {
            if (field.value && field.value.length < +field.getAttribute('minlength')) { field.classList.add('is-invalid'); problems.push(field); }
        });
        if (problems.length) {
            e.preventDefault();
            var first = problems[0];
            var name = fieldName(first.matches ? first : first) || '';
            var message = 'Моля, попълнете ' + (name ? '„' + name + '“' : 'задължителните полета') + '.';
            if (first.type === 'email') message = 'Проверете имейла.';
            if (first.type === 'url') message = 'Линкът трябва да започва с https://';
            if (first.getAttribute && first.getAttribute('minlength') && first.value) message = 'Паролата трябва да е поне ' + first.getAttribute('minlength') + ' знака.';
            if (first.type === 'file') message = 'Изберете снимка.';
            if (first.classList && first.classList.contains('dp')) message = 'Изберете дата и час.';
            sayError(message);
            var focusTarget = first.classList && first.classList.contains('dp') ? first.querySelector('.dp-button') : (first.closest('.pick') ? first.closest('.pick').querySelector('.pick-button') : first);
            if (focusTarget && focusTarget.focus) focusTarget.focus();
            return;
        }
        var msg = form.getAttribute('data-confirm');
        if (msg) {
            e.preventDefault();
            var danger = !!form.querySelector('.btn--danger');
            ask(msg, danger).then(function (yes) {
                if (!yes) return;
                form.dataset.confirmed = '1';
                if (form.requestSubmit) form.requestSubmit(); else form.submit();
            });
        }
    });
    document.addEventListener('input', function (e) { if (e.target.classList) e.target.classList.remove('is-invalid'); });
})();

// Long side menu: keep the open page's item in view
document.querySelector('.sidebar nav a[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
