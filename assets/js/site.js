/* Minsk Dialogue — small progressive enhancements. Every page works without them. */
(function () {
  'use strict';
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* Texts written by this script, in the page's language */
  var RU = document.documentElement.lang === 'ru';
  var TEXT = RU ? {
    'Menu': 'Меню', 'Close the menu': 'Закрыть меню', 'Photo viewer': 'Просмотр фото', 'Close': 'Закрыть',
    'Previous photo': 'Предыдущее фото', 'Next photo': 'Следующее фото', 'Play episode': 'Слушать выпуск', 'Pause episode': 'Пауза',
    'Loading…': 'Загрузка…',
    'Type a word or a name to search publications, podcasts, events and media.': 'Введите слово или имя, чтобы найти публикации, подкасты, мероприятия и медиа.',
    'Your e-mail has been added to our list. We will keep you updated on the most interesting news, publications and events of the Minsk Dialogue.':
      'Ваш адрес добавлен в рассылку. Мы будем сообщать вам о самых интересных новостях, публикациях и мероприятиях «Минского диалога».',
    'The subscription could not be saved. Please try again later or write to ': 'Не удалось оформить подписку. Попробуйте позже или напишите на ',
    'Your email app should open with a subscription request. If it does not, write to ': 'Должно открыться почтовое приложение с запросом на подписку. Если этого не произошло, напишите на ',
    'Please add me to the Minsk Dialogue mailing list.': 'Прошу добавить меня в рассылку «Минского диалога».', 'Name: ': 'Имя: ',
    'Thank you! Your message has reached the hosts.': 'Спасибо! Ваше сообщение получено.',
    'Thank you for subscribing to the Minsk Dialogue newsletter!': 'Спасибо за подписку на рассылку «Минского диалога»!',
    'We will send news, research and events to ': 'Мы будем присылать новости, исследования и анонсы мероприятий на адрес ',
    'This is the test copy of the website, so the address is not saved. On the real website it goes straight to the subscriber list in the admin panel.':
      'Это тестовая копия сайта, поэтому адрес не сохраняется. На настоящем сайте он сразу попадает в список подписчиков в админ-панели.',
    'Close': 'Закрыть',
    'The message could not be sent. Please try again later or write to ': 'Не удалось отправить сообщение. Попробуйте позже или напишите на ',
    'Your email app should open with your message. If it does not, write to ': 'Должно открыться почтовое приложение с вашим сообщением. Если этого не произошло, напишите на '
  } : {};
  function tr(s) { return TEXT[s] || s; }
  function results(n) {
    if (!RU) return n + (n === 1 ? ' result' : ' results');
    var m10 = n % 10, m100 = n % 100;
    return n + (m10 === 1 && m100 !== 11 ? ' результат' : (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? ' результата' : ' результатов'));
  }

  /* The main menu behind a button on phones and tablets */
  var hdr = $('.header'), menuBtn = $('.menu-btn');
  if (hdr && menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = !hdr.classList.contains('is-open');
      hdr.classList.toggle('is-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? tr('Close the menu') : tr('Menu'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && hdr.classList.contains('is-open')) { hdr.classList.remove('is-open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.focus(); }
    });
  }

  /* Tabs scroll sideways on phones: keep the current one in view */
  $$('.tabs').forEach(function (t) {
    var on = $('[aria-current], [aria-selected="true"]', t);
    if (!on || t.scrollWidth <= t.clientWidth) return;
    var x = on.getBoundingClientRect().right - t.getBoundingClientRect().right;
    if (x > 0) t.scrollLeft += x + 16;
  });

  /* Research menu: open on click for touch screens */
  $$('.dd').forEach(function (dd) {
    var btn = $('.dd__btn', dd);
    btn.addEventListener('click', function (e) {
      if (window.matchMedia('(min-width: 1100px)').matches && window.matchMedia('(hover: none)').matches && !dd.classList.contains('is-open')) {
        e.preventDefault();
        dd.classList.add('is-open');
      }
    });
    document.addEventListener('click', function (e) { if (!dd.contains(e.target)) dd.classList.remove('is-open'); });
    dd.addEventListener('keydown', function (e) { if (e.key === 'Escape') { dd.classList.remove('is-open'); btn.focus(); } });
  });

  /* "Show more" lists: <ul data-paginate="24"> followed by <button data-more> */
  function paginate(list) {
    var step = parseInt(list.getAttribute('data-paginate'), 10) || 24;
    var btn = list.parentNode.querySelector('[data-more]');
    var items = function () { return $$(':scope > *', list).filter(function (el) { return !el.hasAttribute('data-filtered'); }); };
    var shown = step;
    function render() {
      var all = items();
      $$(':scope > *', list).forEach(function (el) { el.hidden = true; });
      all.forEach(function (el, i) { el.hidden = i >= shown; });
      if (btn) btn.hidden = all.length <= shown;
    }
    if (btn) btn.addEventListener('click', function () {
      var first = items()[shown];
      shown = btn.hasAttribute('data-all') ? Infinity : shown + step;
      render();
      if (first) { var a = first.querySelector('a') || first; a.focus({ preventScroll: true }); }
    });
    list._reset = function () { shown = step; render(); };
    render();
  }
  $$('[data-paginate]').forEach(paginate);

  /* Client-side filters: <nav data-filter-for="id"> with buttons data-value; items carry data-type */
  $$('[data-filter-for]').forEach(function (nav) {
    var list = document.getElementById(nav.getAttribute('data-filter-for'));
    if (!list) return;
    var buttons = $$('button', nav);
    function apply(value) {
      buttons.forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-value') === value ? 'true' : 'false'); });
      $$(':scope > *', list).forEach(function (el) {
        var types = (el.getAttribute('data-type') || '').split(' ');
        if (value === 'all' || types.indexOf(value) >= 0) el.removeAttribute('data-filtered');
        else { el.setAttribute('data-filtered', ''); el.hidden = true; }
      });
      if (list._reset) list._reset();
    }
    buttons.forEach(function (b) { b.addEventListener('click', function () { apply(b.getAttribute('data-value')); }); });
  });

  /* Tabs that switch panels: <div role="tablist"> buttons aria-controls */
  $$('[role="tablist"]').forEach(function (tl) {
    var tabs = $$('[role="tab"]', tl);
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
      if (tab.id && history.replaceState) history.replaceState(null, '', '#' + tab.id.replace(/^tab-/, ''));
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
      });
    });
    var want = location.hash && document.getElementById('tab-' + location.hash.slice(1));
    select(want && tabs.indexOf(want) >= 0 ? want : tabs[0]);
  });

  /* Contents: highlight the section being read */
  var toc = $('.toc');
  if (toc && 'IntersectionObserver' in window) {
    var links = $$('a[href^="#"]', toc);
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var current = null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          if (current) current.classList.remove('is-active');
          current = map[en.target.id];
          if (current) current.classList.add('is-active');
        }
      });
    }, { rootMargin: '0px 0px -70% 0px' });
    Object.keys(map).forEach(function (id) { var h = document.getElementById(id); if (h) io.observe(h); });
  }

  /* Lightbox for photo galleries */
  var groups = {};
  $$('[data-lightbox]').forEach(function (a) {
    var g = a.getAttribute('data-lightbox');
    (groups[g] = groups[g] || []).push(a);
    a.addEventListener('click', function (e) { e.preventDefault(); openBox(g, groups[g].indexOf(a)); });
  });
  function openBox(group, index) {
    var items = groups[group];
    var prevFocus = document.activeElement;
    var box = document.createElement('div');
    box.className = 'lb';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', tr('Photo viewer'));
    box.innerHTML = '<img alt=""><button class="lb__close" type="button" aria-label="' + tr('Close') + '"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg></button>' +
      '<button class="lb__prev" type="button" aria-label="' + tr('Previous photo') + '"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>' +
      '<button class="lb__next" type="button" aria-label="' + tr('Next photo') + '"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button><p class="lb__count" aria-live="polite"></p>';
    document.body.appendChild(box);
    document.body.style.overflow = 'hidden';
    var img = $('img', box), count = $('.lb__count', box);
    function show(i) {
      index = (i + items.length) % items.length;
      var a = items[index];
      img.src = a.getAttribute('href');
      var t = a.querySelector('img');
      img.alt = t ? t.alt : '';
      count.textContent = (index + 1) + ' / ' + items.length;
    }
    function close() {
      document.removeEventListener('keydown', onKey);
      box.remove();
      document.body.style.overflow = '';
      if (prevFocus) prevFocus.focus();
    }
    function onKey(e) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') show(index + 1);
      else if (e.key === 'ArrowLeft') show(index - 1);
      else if (e.key === 'Tab') {
        var f = $$('button', box), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    $('.lb__close', box).addEventListener('click', close);
    $('.lb__prev', box).addEventListener('click', function () { show(index - 1); });
    $('.lb__next', box).addEventListener('click', function () { show(index + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    var sx = null;
    box.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
      sx = null;
    });
    document.addEventListener('keydown', onKey);
    show(index);
    $('.lb__close', box).focus();
  }

  /* Podcast player around a native <audio> element */
  function fmt(s) {
    if (!isFinite(s)) return '0:00';
    s = Math.floor(s);
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
  }
  $$('.player').forEach(function (p) {
    var audio = $('audio', p), btn = $('.player__btn', p), track = $('.player__track', p), fill = $('.player__fill', p);
    var now = $('[data-now]', p), total = $('[data-total]', p);
    if (!audio) return;
    function sync() {
      var d = audio.duration || parseFloat(p.getAttribute('data-duration')) || 0;
      var pct = d ? (audio.currentTime / d) * 100 : 0;
      fill.style.width = pct + '%';
      track.setAttribute('aria-valuenow', Math.round(pct));
      track.setAttribute('aria-valuetext', fmt(audio.currentTime) + ' of ' + fmt(d));
      now.textContent = fmt(audio.currentTime);
      if (audio.duration) total.textContent = fmt(audio.duration);
    }
    btn.addEventListener('click', function () {
      $$('audio').forEach(function (a) { if (a !== audio) a.pause(); });
      if (audio.paused) audio.play(); else audio.pause();
    });
    audio.addEventListener('play', function () { p.classList.add('is-playing'); btn.setAttribute('aria-label', tr('Pause episode')); });
    audio.addEventListener('pause', function () { p.classList.remove('is-playing'); btn.setAttribute('aria-label', tr('Play episode')); });
    audio.addEventListener('timeupdate', sync);
    audio.addEventListener('loadedmetadata', sync);
    function seekTo(x) {
      var r = track.getBoundingClientRect();
      var d = audio.duration || parseFloat(p.getAttribute('data-duration')) || 0;
      if (!d) return;
      audio.currentTime = Math.max(0, Math.min(1, (x - r.left) / r.width)) * d;
      sync();
    }
    track.addEventListener('click', function (e) { seekTo(e.clientX); });
    track.addEventListener('keydown', function (e) {
      var d = audio.duration || 0;
      if (e.key === 'ArrowRight') { audio.currentTime = Math.min(d, audio.currentTime + 15); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { audio.currentTime = Math.max(0, audio.currentTime - 15); e.preventDefault(); }
      sync();
    });
    $$('[data-skip]', p).forEach(function (b) {
      b.addEventListener('click', function () {
        audio.currentTime = Math.max(0, audio.currentTime + parseFloat(b.getAttribute('data-skip')));
        sync();
      });
    });
  });

  /* YouTube: the video's picture until it is clicked, then the player, already playing */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-yt]');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube.com/embed/' + a.getAttribute('data-yt') + '?autoplay=1&rel=0&playsinline=1';
    f.title = a.getAttribute('aria-label').replace(/^[^:]*:\s*/, '');
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    f.allowFullscreen = true;
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    a.parentNode.replaceChild(f, a);
    f.focus();
  });

  /* Cards, list items and section headings below the fold arrive with a short fade as they scroll into view */
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    var fold = window.innerHeight;
    $$('main .card-grid > li, main .prog-grid > *, main .rows > li, main .ev-list > li, main .press-list > li, main .people-grid > *, ' +
       'main .team-grid > *, main .link-cards > *, main .photo-grid > li, main .shows > *, main .featured__card, main .sec-h').forEach(function (el) {
      if (el.getBoundingClientRect().top < fold) return;      // on screen already (or hidden until "Show more")
      var i = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty('--d', ((i % 3) * 0.07) + 's');
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  /* Newsletter sign-up: the admin panel saves it (/api/subscribe) and a window thanks the reader */
  function thanks(email, test) {
    var d = document.createElement('dialog');
    d.className = 'thanks';
    d.setAttribute('aria-labelledby', 'thanks-h');
    d.innerHTML = '<h2 id="thanks-h" class="thanks__h">' + tr('Thank you for subscribing to the Minsk Dialogue newsletter!') + '</h2>' +
      '<p class="thanks__text">' + tr('We will send news, research and events to ') + '<b></b>.</p>' +
      (test ? '<p class="thanks__note">' + tr('This is the test copy of the website, so the address is not saved. On the real website it goes straight to the subscriber list in the admin panel.') + '</p>' : '') +
      '<button class="thanks__btn" type="button">' + tr('Close') + '</button>';
    $('b', d).textContent = email;
    document.body.appendChild(d);
    $('.thanks__btn', d).addEventListener('click', function () { d.close(); });
    d.addEventListener('close', function () { d.remove(); });
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });     // a click outside the box
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
    $('.thanks__btn', d).focus();
  }
  $$('form[data-newsletter]').forEach(function (form) {
    var msg = $('.newsletter__msg', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var email = (data.get('Email') || '').toString().trim();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var endpoint = form.getAttribute('data-endpoint');
      var done = function (ok, text) { msg.hidden = false; msg.innerHTML = text; if (ok) form.reset(); };
      if (!endpoint && form.hasAttribute('data-test-copy')) { msg.hidden = true; form.reset(); thanks(email, true); return; }
      if (!endpoint) {
        var body = encodeURIComponent(tr('Please add me to the Minsk Dialogue mailing list.')) + '%0D%0A%0D%0A' + encodeURIComponent(tr('Name: ')) +
          encodeURIComponent(((data.get('Name') || '') + ' ' + (data.get('Surname') || '')).trim()) + '%0D%0AE-mail: ' + encodeURIComponent(email);
        location.href = 'mailto:' + form.getAttribute('data-mailto') + '?subject=Newsletter%20subscription&body=' + body;
        done(true, tr('Your email app should open with a subscription request. If it does not, write to ') + '<a href="mailto:' +
          form.getAttribute('data-mailto') + '">' + form.getAttribute('data-mailto') + '</a>.');
        return;
      }
      fetch(endpoint, { method: 'POST', body: data, headers: { 'Accept': 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error(r.status);
          msg.hidden = true; form.reset(); thanks(email, false);
        })
        .catch(function () {
          done(false, tr('The subscription could not be saved. Please try again later or write to ') + '<a href="mailto:' +
            form.getAttribute('data-mailto') + '">' + form.getAttribute('data-mailto') + '</a>.');
        });
    });
  });

  /* Last Monday: a question or comment for the hosts (saved in the admin panel, Podcasts › Listener questions) */
  $$('form[data-question]').forEach(function (form) {
    var msg = $('.ask__msg', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var data = new FormData(form);
      data.set('page', location.pathname);
      var endpoint = form.getAttribute('data-endpoint'), mailto = form.getAttribute('data-mailto');
      var write = '<a href="mailto:' + mailto + '">' + mailto + '</a>.';
      var done = function (ok, text) { msg.hidden = false; msg.innerHTML = text; if (ok) form.reset(); };
      if (!endpoint) {
        location.href = 'mailto:' + mailto + '?subject=' + encodeURIComponent(form.getAttribute('data-subject')) + '&body=' + encodeURIComponent(data.get('text') || '');
        done(true, tr('Your email app should open with your message. If it does not, write to ') + write);
        return;
      }
      fetch(endpoint, { method: 'POST', body: data, headers: { 'Accept': 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); done(true, tr('Thank you! Your message has reached the hosts.')); })
        .catch(function () { done(false, tr('The message could not be sent. Please try again later or write to ') + write); });
    });
  });

  /* Site search (runs on /en/search/ and /search/) */
  var sForm = $('#search-form');
  if (sForm) {
    var input = $('#q'), out = $('#results'), countEl = $('#search-count'), tabsNav = $('#search-tabs');
    var data = null, group = 'all';
    var params = new URLSearchParams(location.search);
    input.value = params.get('q') || '';
    group = params.get('in') || 'all';
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
    function hl(text, terms) {
      var out = esc(text);
      terms.forEach(function (t) {
        if (t.length < 2) return;
        var re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
        out = out.replace(re, '<mark>$1</mark>');
      });
      return out;
    }
    function run() {
      var q = input.value.trim();
      var terms = norm(q).split(/\s+/).filter(Boolean);
      $$('a', tabsNav).forEach(function (a) {
        var on = a.getAttribute('data-group') === group;
        if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        a.href = '?q=' + encodeURIComponent(q) + (a.getAttribute('data-group') === 'all' ? '' : '&in=' + a.getAttribute('data-group'));
      });
      if (!terms.length) { out.innerHTML = ''; countEl.textContent = tr('Type a word or a name to search publications, podcasts, events and media.'); if (out._reset) out._reset(); return; }
      var hits = data.filter(function (d) {
        if (group !== 'all' && d.g !== group) return false;
        var hay = d._h || (d._h = norm(d.t + ' ' + (d.a || '') + ' ' + (d.s || '') + ' ' + (d.k || '') + ' ' + (d.x || '')));
        return terms.every(function (t) { return hay.indexOf(t) >= 0; });
      });
      hits.forEach(function (d) { d._score = terms.reduce(function (s, t) { return s + (norm(d.t).indexOf(t) >= 0 ? 3 : 0) + (norm(d.a).indexOf(t) >= 0 ? 2 : 0); }, 0); });
      hits.sort(function (a, b) { return b._score - a._score || (a.d < b.d ? 1 : -1); });
      countEl.textContent = results(hits.length);
      var raw = q.split(/\s+/).filter(Boolean);
      out.innerHTML = hits.map(function (d) {
        var meta = '<span class="kind">' + esc(d.k) + '</span>' + (d.a ? ' · ' + esc(d.a) : '') + (d.dl ? ' · ' + esc(d.dl) : '');
        var thumb = d.i ? '<span class="row__thumb"><img src="' + esc(d.i) + '" alt="" loading="lazy"></span>' : '';
        var ext = d.e ? ' target="_blank" rel="noopener"' : '';
        return '<li><a class="row row--wide row--lg row--top" href="' + esc(d.u) + '"' + ext + '><span class="row__text"><span class="row__title">' + hl(d.t, raw) +
          '</span><span class="meta">' + meta + '</span></span>' + thumb + '</a></li>';
      }).join('');
      out._reset && out._reset();
    }
    countEl.textContent = tr('Loading…');
    fetch(sForm.getAttribute('data-index')).then(function (r) { return r.json(); }).then(function (j) { data = j; run(); });
    sForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = input.value.trim();
      history.replaceState(null, '', '?q=' + encodeURIComponent(q) + (group === 'all' ? '' : '&in=' + group));
      if (data) run();
    });
    tabsNav.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      e.preventDefault();
      group = a.getAttribute('data-group');
      history.replaceState(null, '', a.getAttribute('href'));
      if (data) run();
    });
  }
})();
