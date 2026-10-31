/* Minsk Dialogue admin: editor widgets. No libraries. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var CSRF = ($('meta[name="csrf-token"]') || {}).content || '';
  var ICON = {
    close: '<svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    star: '<svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" fill="currentColor" stroke="none"/></svg>',
    up: '<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    down: '<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
    copy: '<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="1"/><path d="M16 8V4H4v12h4"/></svg>',
    trash: '<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    doc: '<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 12h6M10 16h6"/></svg>',
    upload: '<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5M4 20h16"/></svg>'
  };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function data(id) { var el = document.getElementById(id); try { return el ? JSON.parse(el.textContent) : null; } catch (e) { return null; } }

  /* ---------- forms: CSRF, confirmations, POST links ---------- */
  $$('input[name="_csrf"]').forEach(function (i) { if (!i.value) i.value = CSRF; });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-confirm]');
    if (b && b.tagName !== 'FORM' && !window.confirm(b.getAttribute('data-confirm'))) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f.hasAttribute('data-confirm') && !window.confirm(f.getAttribute('data-confirm'))) e.preventDefault();
    $$('input[name="_csrf"]', f).forEach(function (i) { if (!i.value) i.value = CSRF; });
  }, true);
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-post]');
    if (!a) return;
    e.preventDefault();
    var f = document.createElement('form');
    f.method = 'post'; f.action = a.getAttribute('href');
    f.innerHTML = '<input type="hidden" name="_csrf" value="' + esc(CSRF) + '">';
    document.body.appendChild(f); f.submit();
  });

  function post(url, body, isJson) {
    var opts = { method: 'POST', headers: { 'X-CSRF-Token': CSRF, 'Accept': 'application/json', 'X-Requested-With': 'fetch' }, credentials: 'same-origin' };
    if (isJson) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); } else opts.body = body;
    return fetch(url, opts).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || ('Error ' + r.status)); return j; });
    });
  }
  function upload(fileList, want) {
    var fd = new FormData();
    Array.prototype.forEach.call(fileList, function (f) { fd.append('file', f); });
    if (want) fd.append('want', want);
    return post('/admin/upload', fd).then(function (j) { return j.files; });
  }
  function fail(err) { window.alert(err && err.message ? err.message : 'Something went wrong.'); }

  /* ---------- menus ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-menu]');
    $$('.menu').forEach(function (m) {
      if (!t || m !== t.nextElementSibling) { m.hidden = true; var b = m.previousElementSibling; if (b && b.hasAttribute('data-menu')) b.setAttribute('aria-expanded', 'false'); }
    });
    if (t) {
      e.preventDefault();
      var m = t.nextElementSibling;
      // a table that scrolls sideways would cut the menu off: place it on the page instead
      var fixed = m.hidden && t.closest('.tbl-wrap'), r = t.getBoundingClientRect();
      if (fixed) { m.style.position = 'fixed'; m.style.right = 'auto'; m.style.left = '0px'; }
      m.hidden = !m.hidden;
      t.setAttribute('aria-expanded', String(!m.hidden));
      if (fixed) {
        m.style.left = Math.max(8, r.right - m.offsetWidth) + 'px';
        m.style.top = (r.bottom + 6 + m.offsetHeight > window.innerHeight ? Math.max(8, r.top - 6 - m.offsetHeight) : r.bottom + 6) + 'px';
      }
    }
  });
  window.addEventListener('scroll', function (e) {
    $$('.tbl-wrap .menu').forEach(function (m) {
      if (m.hidden || m.contains(e.target)) return;
      m.hidden = true;
      var b = m.previousElementSibling; if (b) b.setAttribute('aria-expanded', 'false');
    });
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') $$('.menu').forEach(function (m) { if (!m.closest('.picker')) m.hidden = true; }); });

  /* ---------- small things ---------- */
  function autosize(t) { t.style.height = 'auto'; t.style.height = (t.scrollHeight + 2) + 'px'; }
  $$('textarea[data-autosize]').forEach(function (t) { autosize(t); t.addEventListener('input', function () { autosize(t); }); });
  window.addEventListener('load', function () { $$('textarea[data-autosize]').forEach(autosize); });
  $$('form[data-autosubmit]').forEach(function (f) {
    $$('select', f).forEach(function (s) { s.addEventListener('change', function () { f.submit(); }); });
  });
  $$('.inp.sel select').forEach(function (s) {
    var lab = s.closest('.inp.sel');
    function upd() { lab.classList.toggle('ph', !s.value && s.options[0] && s.options[0].value === ''); }
    s.addEventListener('change', upd);
  });
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var src = $('[data-copy-source]', b.parentNode);
      src.select();
      (navigator.clipboard ? navigator.clipboard.writeText(src.value) : Promise.reject()).catch(function () { document.execCommand('copy'); });
      b.textContent = 'Copied';
    });
  });
  $$('[data-import-form]').forEach(function (f) {
    var input = $('[data-import-file]', f);
    $('[data-import-pick]', f).addEventListener('click', function () { input.click(); });
    input.addEventListener('change', function () { if (input.files.length) f.submit(); });
  });
  $$('[data-reveal]').forEach(function (box) {
    var t = $('[data-reveal-toggle]', box), body = $('[data-reveal-body]', box);
    t.addEventListener('change', function () { body.hidden = !t.checked; });
  });
  $$('[data-radio-group]').forEach(function (g) {
    function upd() {
      $$('input[type=radio]', g).forEach(function (r) {
        var dot = r.nextElementSibling;
        if (dot) dot.style.border = r.checked ? '5px solid #0B4F9C' : '1px solid #9FB4CD';
      });
    }
    g.addEventListener('change', upd);
  });
  $$('[data-show-picker]').forEach(function (g) {
    g.addEventListener('change', function () {
      $$('[data-show-option]', g).forEach(function (o) {
        var on = $('input', o).checked;
        o.style.border = on ? '2px solid #0B4F9C' : '1px solid #D5DFEA';
        o.style.padding = on ? '9px' : '10px';
      });
    });
  });
  /* on narrow screens the editing panel sits under the list: show it after picking someone */
  var editPanel = $('[data-panel]');
  if (editPanel && window.matchMedia('(max-width:980px)').matches && /[?&](person|id)=/.test(location.search) && !/[?&]msg=/.test(location.search)) {
    editPanel.scrollIntoView();
  }

  /* ---------- unsaved changes ---------- */
  var dirty = false, submitting = false;
  $$('form[data-dirty-warn]').forEach(function (f) {
    f.addEventListener('input', function () { dirty = true; });
    f.addEventListener('change', function () { dirty = true; });
    f.addEventListener('submit', function (e) { if (!(e.submitter && e.submitter.getAttribute('formtarget') === '_blank')) submitting = true; });
  });
  window.addEventListener('beforeunload', function (e) { if (dirty && !submitting) { e.preventDefault(); e.returnValue = ''; } });
  window.markDirty = function () { dirty = true; };

  /* ---------- English / Russian: typing in one version is kept while you look at the other ---------- */
  (function () {
    var form = $('form[data-editor-form]'); if (!form) return;
    var key = form.getAttribute('data-entry-key'), lang = form.getAttribute('data-lang');
    var KEEP = 'md-unsaved:', SKIP = /^(_csrf|_action|image|image_focus|cover|kind_sub)$/;
    function store() { try { return window.sessionStorage; } catch (e) { return null; } }
    var ss = store();
    function read(l) { try { return ss ? JSON.parse(ss.getItem(KEEP + key + ':' + l) || 'null') : null; } catch (e) { return null; } }
    function drop(l) { try { if (ss) ss.removeItem(KEEP + key + ':' + l); } catch (e) { /* storage off */ } }
    // a new item gets its address when first saved: carry what was kept for it over to that address
    try {
      var made = ss && ss.getItem('md-created');
      if (made && key.indexOf(':new-') < 0 && made.split(':')[0] === key.split(':')[0]) {
        ['en', 'ru'].forEach(function (l) { var v = ss.getItem(KEEP + made + ':' + l); if (v) { ss.setItem(KEEP + key + ':' + l, v); ss.removeItem(KEEP + made + ':' + l); } });
      }
      if (ss) ss.removeItem('md-created');
    } catch (e) { /* storage off */ }
    function snapshot() {
      $$('[data-editor]', form).forEach(function (ed) { $('textarea', ed).value = $('.doc', ed).innerHTML; });
      var out = { fields: [], tokens: {} };
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name || SKIP.test(el.name) || el.type === 'file' || el.type === 'submit' || el.type === 'button' || el.closest('[data-tokens]')) return;
        out.fields.push([el.name, (el.type === 'checkbox' || el.type === 'radio') ? (el.checked ? '1' : '') : el.value]);
      });
      $$('[data-tokens]', form).forEach(function (box) {
        out.tokens[box.getAttribute('data-tokens')] = $$('[data-token]', box).map(function (t) { return t.outerHTML; }).join('');
      });
      return out;
    }
    function restore(snap) {
      var seen = {};
      snap.fields.forEach(function (f) {
        var list = form.querySelectorAll('[name="' + f[0].replace(/"/g, '') + '"]'), i = seen[f[0]] || 0;
        seen[f[0]] = i + 1;
        var el = list[i]; if (!el || el.closest('[data-tokens]')) return;
        if (el.type === 'checkbox' || el.type === 'radio') el.checked = !!f[1];
        else el.value = f[1];
        var ed = el.closest('[data-editor]');
        if (ed && el.tagName === 'TEXTAREA') $('.doc', ed).innerHTML = f[1];
        if (el.hasAttribute('data-autosize')) { el.style.height = 'auto'; el.style.height = (el.scrollHeight + 2) + 'px'; }
      });
      Object.keys(snap.tokens).forEach(function (name) {
        var box = $('[data-tokens="' + name + '"]', form); if (!box) return;
        $$('[data-token]', box).forEach(function (t) { t.remove(); });
        var tmp = document.createElement('div'); tmp.innerHTML = snap.tokens[name];
        var pick = $('.picker', box);
        Array.prototype.slice.call(tmp.children).forEach(function (t) { box.insertBefore(t, pick); });
      });
    }
    function note(html) {
      var h = $('[data-lang-helper]', form); if (!h) return null;
      var d = document.createElement('div'); d.className = 'notice lang-note'; d.innerHTML = html; h.appendChild(d); return d;
    }
    var kept = read(lang);
    if (kept) {
      restore(kept);
      dirty = true;
      var mine = $('[data-ltab="' + lang + '"] .lchip', form);
      if (mine) { mine.className = 'lchip lchip--unsaved'; mine.textContent = 'Unsaved changes'; }
      note('Your unsaved changes to this version are back. <b>Save</b> to keep them.');
    }
    // tabs: mark the other version when it has unsaved typing; keep this one's when switching
    $$('[data-ltab]', form).forEach(function (a) {
      var l = a.getAttribute('data-ltab');
      if (l !== lang && read(l)) {
        var chip = $('.lchip', a); if (chip) { chip.className = 'lchip lchip--unsaved'; chip.textContent = 'Unsaved changes'; }
      }
      a.addEventListener('click', function () {
        if (l === lang || !dirty) return;
        try { if (ss) ss.setItem(KEEP + key + ':' + lang, JSON.stringify(snapshot())); } catch (e) { /* storage full or off */ }
        submitting = true;          // nothing is lost, so no "leave the page?" question
      });
    });
    form.addEventListener('submit', function (e) {
      var b = e.submitter;
      if (b && b.getAttribute('formtarget') === '_blank') return;      // a preview, not a save
      drop(lang);
      try { if (ss && key.indexOf(':new-') > 0) ss.setItem('md-created', key); } catch (err) { /* storage off */ }
    });
    // an empty version: start from the other language's text, or have Google translate it
    var other = data('other-version');
    if (form.hasAttribute('data-empty') && other && !kept) {
      var box = note('<b>This ' + (lang === 'ru' ? 'Russian' : 'English') + ' version is empty.</b> Start from the ' + esc(other.name) + ' one: ' +
        '<button type="button" class="link" data-copy-other>Copy the ' + esc(other.name) + ' text here</button> · ' +
        '<button type="button" class="link" data-translate>Translate it with Google ↗</button>');
      $('[data-copy-other]', box).addEventListener('click', function () {
        var t = form.querySelector('[name="title"]'), s = form.querySelector('[name="summary"]'), b = form.querySelector('[data-editor] textarea[name="body"]');
        if (t && !t.value.trim()) { t.value = other.title; t.dispatchEvent(new Event('input', { bubbles: true })); }
        if (s && !s.value.trim()) s.value = other.summary;
        if (b) { b.value = other.body; $('.doc', b.closest('[data-editor]')).innerHTML = other.body; }
        $$('textarea[data-autosize]', form).forEach(function (x) { x.style.height = 'auto'; x.style.height = (x.scrollHeight + 2) + 'px'; });
        dirty = true;
        box.innerHTML = 'The ' + esc(other.name) + ' text is copied in. Translate it, then <b>Save</b>.';
      });
      $('[data-translate]', box).addEventListener('click', function () {
        var tmp = document.createElement('div'); tmp.innerHTML = other.body.replace(/<\/(p|h2|h3|h4|li|blockquote)>/gi, '\n\n');
        var text = [other.title, other.summary, tmp.textContent.replace(/\n{3,}/g, '\n\n').trim()].filter(Boolean).join('\n\n');
        var url = 'https://translate.google.com/?sl=' + other.lang + '&tl=' + lang + '&op=translate';
        if (text.length <= 4800) { window.open(url + '&text=' + encodeURIComponent(text), '_blank', 'noopener'); return; }
        (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () {
          box.insertAdjacentHTML('beforeend', '<p class="small" style="margin-top:6px">The text is long, so it is copied: paste it into Google Translate (it takes 5,000 characters at a time).</p>');
        }).catch(function () { /* clipboard refused: Google Translate opens empty */ });
        window.open(url, '_blank', 'noopener');
      });
    }
  })();
  $$('a[data-preview]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (dirty && !window.confirm('The preview shows the last saved version. Your latest changes are not saved yet. Open it anyway?')) e.preventDefault();
    });
  });

  /* ---------- address (slug) ---------- */
  var CYR = { 'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'i', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'iu', 'я': 'ia', 'і': 'i', 'ў': 'u' };
  function slugify(s) {
    s = (s || '').toLowerCase().split('').map(function (c) { return CYR[c] !== undefined ? CYR[c] : c; }).join('');
    s = s.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return s.slice(0, 70).replace(/-+$/, '');
  }
  $$('[data-slug]').forEach(function (inp) {
    var form = inp.form, title = form && $('[data-title]', form), manual = !!inp.value;
    var btn = $('[data-slug-edit]', inp.parentNode);
    if (btn) btn.addEventListener('click', function () { inp.readOnly = false; manual = true; inp.focus(); inp.select(); });
    if (title) title.addEventListener('input', function () { if (!manual) inp.value = slugify(title.value); });
  });

  /* ---------- publish button: "Schedule" when the date is later ---------- */
  var MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  function parseDate(t) {
    t = (t || '').trim(); var m;
    if ((m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2}))?/))) return new Date(+m[1], m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
    if ((m = t.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})(?:,? (\d{1,2}):(\d{2}))?/))) return new Date(+m[3], m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0));
    if ((m = t.match(/^([A-Za-z]{3})[a-z]*\.? (\d{1,2}),? (\d{4})(?:,? (\d{1,2}):(\d{2}))?/))) {
      var mo = MONTHS.indexOf(m[1].toLowerCase()); if (mo < 0) return null;
      return new Date(+m[3], mo, +m[2], +(m[4] || 0), +(m[5] || 0));
    }
    return null;
  }
  $$('[data-publish-btn]').forEach(function (b) {
    var inp = b.form && b.form.querySelector('#publish_at'); if (!inp) return;
    var label = b.lastChild;
    function upd() { var d = parseDate(inp.value); label.textContent = d && d > new Date() ? 'Schedule' : 'Publish'; }
    inp.addEventListener('input', upd); inp.addEventListener('change', upd); upd();
  });
  $$('[data-date-clear]').forEach(function (b) {
    b.addEventListener('click', function () {
      var inp = b.parentNode.querySelector('input'); inp.value = '';
      inp.dispatchEvent(new Event('input', { bubbles: true })); window.markDirty();
    });
  });

  /* ---------- rich text editor ---------- */
  var ALLOWED = { P: 1, H2: 1, H3: 1, H4: 1, BLOCKQUOTE: 1, UL: 1, OL: 1, LI: 1, STRONG: 1, EM: 1, B: 1, I: 1, A: 1, BR: 1, SUP: 1, SUB: 1, IMG: 1, TABLE: 1, THEAD: 1, TBODY: 1, TR: 1, TD: 1, TH: 1 };
  function cleanPaste(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 8) { c.remove(); return; }
        if (c.nodeType !== 1) return;
        if (/^(SCRIPT|STYLE|META|LINK|TITLE|O:P)$/.test(c.tagName)) { c.remove(); return; }
        walk(c);
        if (!ALLOWED[c.tagName]) {
          if (c.tagName === 'DIV') { var p = doc.createElement('p'); while (c.firstChild) p.appendChild(c.firstChild); c.replaceWith(p); }
          else { while (c.firstChild) c.parentNode.insertBefore(c.firstChild, c); c.remove(); }
          return;
        }
        Array.prototype.slice.call(c.attributes).forEach(function (a) {
          if (!((c.tagName === 'A' && a.name === 'href') || (c.tagName === 'IMG' && (a.name === 'src' || a.name === 'alt')))) c.removeAttribute(a.name);
        });
      });
    })(doc.body);
    return doc.body.innerHTML;
  }
  function initEditor(ed) {
    var doc = $('.doc', ed), ta = $('textarea', ed), form = ed.closest('form');
    var toc = form && $('[data-toc]', form);
    function sync() {
      ta.value = doc.innerHTML;
      if (toc) {
        var hs = $$('h2', doc);
        toc.innerHTML = hs.length ? hs.map(function (h, i) {
          return '<li style="display:flex;gap:10px;padding:9px 0;border-bottom:1px solid #EEF2F6"><span class="muted">' + (i + 1) + '</span>' + esc(h.textContent.trim()) + '</li>';
        }).join('') : '<li class="muted" style="padding:9px 0">No subheadings yet.</li>';
      }
    }
    sync();
    try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) { /* older browsers */ }
    doc.addEventListener('input', function () { sync(); window.markDirty(); });
    doc.addEventListener('paste', function (e) {
      var cd = e.clipboardData; if (!cd) return;
      e.preventDefault();
      var html = cd.getData('text/html');
      if (html) document.execCommand('insertHTML', false, cleanPaste(html));
      else document.execCommand('insertText', false, cd.getData('text/plain'));
      sync();
    });
    function block() {
      var s = window.getSelection(); if (!s.rangeCount) return null;
      var n = s.anchorNode; n = n && n.nodeType === 3 ? n.parentNode : n;
      return n && doc.contains(n) ? n.closest('h2,h3,blockquote,p,li') : null;
    }
    function state() {
      var b = block();
      $$('[data-cmd]', ed).forEach(function (btn) {
        var c = btn.getAttribute('data-cmd'), on = false;
        if (c === 'h2') on = !!(b && b.closest('h2'));
        else if (c === 'quote') on = !!(b && b.closest('blockquote'));
        else if (c === 'bold' || c === 'italic') { try { on = document.queryCommandState(c); } catch (e) { on = false; } }
        else if (c === 'list') on = !!(b && b.closest('ul'));
        else if (c === 'olist') on = !!(b && b.closest('ol'));
        btn.classList.toggle('on', on);
      });
    }
    document.addEventListener('selectionchange', function () { if (doc.contains(document.activeElement) || document.activeElement === doc) state(); });
    $$('[data-cmd]', ed).forEach(function (btn) {
      btn.addEventListener('mousedown', function (e) { e.preventDefault(); });
      btn.addEventListener('click', function () {
        doc.focus();
        var c = btn.getAttribute('data-cmd'), b = block();
        if (c === 'h2') document.execCommand('formatBlock', false, b && b.closest('h2') ? 'p' : 'h2');
        else if (c === 'quote') document.execCommand('formatBlock', false, b && b.closest('blockquote') ? 'p' : 'blockquote');
        else if (c === 'bold') document.execCommand('bold');
        else if (c === 'italic') document.execCommand('italic');
        else if (c === 'list') document.execCommand('insertUnorderedList');
        else if (c === 'olist') document.execCommand('insertOrderedList');
        else if (c === 'image') { saveCaret(); picker.click(); return; }
        else if (c === 'link') {
          var s = window.getSelection(), a = s.anchorNode && (s.anchorNode.nodeType === 3 ? s.anchorNode.parentNode : s.anchorNode).closest('a');
          var url = window.prompt('Link address (leave empty to remove the link)', a ? a.getAttribute('href') : 'https://');
          if (url === null) return;
          if (!url || url === 'https://') document.execCommand('unlink');
          else if (s.isCollapsed && !a) document.execCommand('insertHTML', false, '<a href="' + esc(url) + '">' + esc(url) + '</a>');
          else document.execCommand('createLink', false, url);
        }
        sync(); state(); window.markDirty();
      });
    });
    if (form) form.addEventListener('submit', sync);

    /* pictures: upload one at the cursor, then drag it to another place in the text */
    var picker = $('[data-editor-image]', ed), caret = null;
    function saveCaret() {
      var s = window.getSelection();
      caret = s.rangeCount && doc.contains(s.getRangeAt(0).startContainer) ? s.getRangeAt(0).cloneRange() : null;
    }
    function blockOf(node) {
      while (node && node.parentNode !== doc) node = node.parentNode;
      return node;
    }
    function figure(url) {
      var p = document.createElement('p'), im = document.createElement('img');
      im.src = url; im.alt = ''; p.appendChild(im);
      return p;
    }
    if (picker) picker.addEventListener('change', function () {
      if (!picker.files.length) return;
      upload(picker.files, 'img').then(function (list) {
        var at = caret && blockOf(caret.startContainer);
        list.forEach(function (f) {
          var p = figure(f.url);
          if (at && at !== doc) at.parentNode.insertBefore(p, at.nextSibling); else doc.appendChild(p);
          at = p;
        });
        sync(); window.markDirty();
      }).catch(fail).then(function () { picker.value = ''; });
    });
    var dragged = null;
    function clearLine() { $$('.drop-line', doc).forEach(function (x) { x.classList.remove('drop-line', 'drop-after'); }); }
    doc.addEventListener('dragstart', function (e) {
      if (e.target.tagName !== 'IMG') return;
      dragged = e.target;
      dragged.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', ''); } catch (err) { /* old browsers */ }
    });
    doc.addEventListener('dragend', function () { if (dragged) dragged.classList.remove('dragging'); dragged = null; clearLine(); });
    function target(e) {
      var el = document.elementFromPoint(e.clientX, e.clientY);
      var b = el && el !== doc && doc.contains(el) ? blockOf(el) : null;
      if (!b) return null;
      var r = b.getBoundingClientRect();
      return { block: b, after: e.clientY > r.top + r.height / 2 };
    }
    doc.addEventListener('dragover', function (e) {
      if (!dragged) return;
      e.preventDefault();
      clearLine();
      var t = target(e);
      if (t && t.block !== blockOf(dragged)) { t.block.classList.add('drop-line'); t.block.classList.toggle('drop-after', t.after); }
    });
    doc.addEventListener('drop', function (e) {
      if (!dragged) return;
      e.preventDefault();
      var t = target(e), from = blockOf(dragged);
      clearLine();
      if (!t || t.block === from) return;
      var alone = from && from.textContent.trim() === '' && from.querySelectorAll('img').length === 1;
      var moving = alone ? from : figure(dragged.getAttribute('src'));
      if (!alone) dragged.remove();
      t.block.parentNode.insertBefore(moving, t.after ? t.block.nextSibling : t.block);
      $$('.dragging', doc).forEach(function (x) { x.classList.remove('dragging'); });
      sync(); window.markDirty();
    });
  }
  $$('[data-editor]').forEach(initEditor);

  /* ---------- people tokens (authors, hosts, experts) ---------- */
  var PEOPLE = data('people-data') || [];
  function personToken(p, name) {
    var pic = p.photo ? '<img src="' + esc(p.photo) + '" alt="">' : '<span class="ini">' + esc(p.ini) + '</span>';
    return '<span class="token" data-token><input type="hidden" name="' + esc(name) + '" value="' + esc(p.id) + '">' + pic + esc(p.name) +
      '<button type="button" class="tok-x" aria-label="Remove ' + esc(p.name) + '">' + ICON.close + '</button></span>';
  }
  function plainToken(text, name, plain) {
    return '<span class="token' + (plain ? ' plain' : '') + '" data-token><input type="hidden" name="' + esc(name) + '" value="' + esc(text) + '">' + esc(text) +
      '<button type="button" class="tok-x" aria-label="Remove ' + esc(text) + '">' + ICON.close + '</button></span>';
  }
  document.addEventListener('click', function (e) {
    var x = e.target.closest('.tok-x');
    if (x) { var t = x.closest('[data-token]'); if (t) { t.remove(); window.markDirty(); } }
  });
  $$('[data-tokens]').forEach(function (box) {
    var name = box.getAttribute('data-tokens'), free = box.getAttribute('data-free') === '1';
    var addBtn = $('[data-add-token]', box), picker = addBtn.parentNode;
    addBtn.addEventListener('click', function () {
      if ($('.tok-input', picker)) return;
      addBtn.hidden = true;
      var inp = document.createElement('input');
      inp.className = 'tok-input'; inp.placeholder = free ? 'Name of an expert or anyone else' : 'Name of an expert';
      inp.setAttribute('aria-label', 'Add a person');
      var menu = document.createElement('div'); menu.className = 'menu'; menu.hidden = true; menu.setAttribute('role', 'listbox');
      picker.appendChild(inp); picker.appendChild(menu); inp.focus();
      var hits = [], cur = 0;
      function chosen() { return $$('input[name="' + name + '"]', box).map(function (i) { return i.value; }); }
      function render() {
        var q = inp.value.trim().toLowerCase(), have = chosen();
        hits = PEOPLE.filter(function (p) { return have.indexOf(p.id) < 0 && (!q || p.name.toLowerCase().indexOf(q) >= 0); }).slice(0, 12);
        cur = 0;
        var html = hits.map(function (p, i) {
          var pic = p.photo ? '<img src="' + esc(p.photo) + '" alt="">' : '<span class="ini">' + esc(p.ini) + '</span>';
          return '<button type="button" role="option" data-i="' + i + '"' + (i === 0 ? ' aria-selected="true"' : '') + '>' + pic + esc(p.name) + '<span class="sub">' + esc(p.group) + '</span></button>';
        }).join('');
        if (free && q) html += '<button type="button" data-free-add>Add “' + esc(inp.value.trim()) + '” as a name</button>';
        menu.innerHTML = html; menu.hidden = !html;
      }
      function pick(p) {
        picker.insertAdjacentHTML('beforebegin', personToken(p, name)); close(); window.markDirty();
      }
      function addFree() { var v = inp.value.trim(); if (!v) return; picker.insertAdjacentHTML('beforebegin', plainToken(v, name + '_names', false)); close(); window.markDirty(); }
      function close() { inp.remove(); menu.remove(); addBtn.hidden = false; }
      inp.addEventListener('input', render);
      inp.addEventListener('keydown', function (ev) {
        if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
          ev.preventDefault(); if (!hits.length) return;
          cur = (cur + (ev.key === 'ArrowDown' ? 1 : hits.length - 1)) % hits.length;
          $$('[role=option]', menu).forEach(function (o, i) { o.setAttribute('aria-selected', String(i === cur)); });
        } else if (ev.key === 'Enter') {
          ev.preventDefault();
          if (hits[cur] && (!free || hits[cur].name.toLowerCase().indexOf(inp.value.trim().toLowerCase()) >= 0)) pick(hits[cur]);
          else if (free) addFree();
        } else if (ev.key === 'Escape') { close(); }
      });
      menu.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
      menu.addEventListener('click', function (ev) {
        var o = ev.target.closest('[data-i]'); if (o) pick(hits[+o.getAttribute('data-i')]);
        else if (ev.target.closest('[data-free-add]')) addFree();
      });
      inp.addEventListener('blur', function () { setTimeout(function () { if (document.activeElement !== inp && inp.parentNode) { if (free && inp.value.trim()) addFree(); else close(); } }, 150); });
      render();
    });
  });
  $$('[data-free-tokens]').forEach(function (box) {
    var name = box.getAttribute('data-free-tokens'), btn = $('[data-add-free]', box);
    btn.addEventListener('click', function () {
      btn.hidden = true;
      var inp = document.createElement('input'); inp.className = 'tok-input'; inp.placeholder = 'Name'; inp.setAttribute('aria-label', 'Add');
      box.insertBefore(inp, btn); inp.focus();
      function done(keep) { var v = inp.value.trim(); if (keep && v) inp.insertAdjacentHTML('beforebegin', plainToken(v, name, true)); inp.remove(); btn.hidden = false; window.markDirty(); }
      inp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); done(true); } else if (ev.key === 'Escape') done(false); });
      inp.addEventListener('blur', function () { done(true); });
    });
  });
  $$('[data-guests]').forEach(function (box) {
    var btn = $('[data-add-guest]', box);
    btn.addEventListener('click', function () {
      btn.hidden = true;
      var wrap = document.createElement('span'); wrap.style.cssText = 'display:inline-flex;gap:6px;align-items:center;flex-wrap:wrap';
      wrap.innerHTML = '<input class="tok-input" placeholder="Name" aria-label="Guest name"><input class="tok-input" placeholder="Affiliation (optional)" aria-label="Affiliation">' +
        '<button type="button" class="btn sec sm">Add</button><button type="button" class="link small" style="color:#51627A">Cancel</button>';
      box.insertBefore(wrap, btn);
      var ins = $$('input', wrap), bs = $$('button', wrap);
      ins[0].focus();
      function add() {
        var n = ins[0].value.trim(), a = ins[1].value.trim(); if (!n) return;
        var ini = n.split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
        wrap.insertAdjacentHTML('beforebegin', '<span class="token" data-token><input type="hidden" name="guest_name" value="' + esc(n) + '"><input type="hidden" name="guest_aff" value="' + esc(a) + '">' +
          '<span class="ini">' + esc(ini) + '</span>' + esc(n) + (a ? '<span class="muted">· ' + esc(a) + '</span>' : '') +
          '<button type="button" class="tok-x" aria-label="Remove ' + esc(n) + '">' + ICON.close + '</button></span>');
        wrap.remove(); btn.hidden = false; window.markDirty();
      }
      bs[0].addEventListener('click', add);
      bs[1].addEventListener('click', function () { wrap.remove(); btn.hidden = false; });
      ins.forEach(function (i) { i.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); add(); } }); });
    });
  });

  /* ---------- repeated rows (programme sessions, goals, platforms) ---------- */
  function sortable(container, itemSel, onDrop) {
    var dragged = null;
    container.addEventListener('dragstart', function (e) {
      if (e.target.closest && e.target.closest('[data-editor]')) return;      // a picture moving inside a text
      var it = e.target.closest(itemSel); if (!it || !container.contains(it)) return;
      dragged = it; it.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', 'row'); } catch (err) { /* IE */ }
    });
    container.addEventListener('dragover', function (e) {
      if (!dragged) return;
      var over = e.target.closest(itemSel); if (!over || over === dragged || !container.contains(over)) return;
      e.preventDefault();
      var r = over.getBoundingClientRect();
      var after = over.parentNode === container && getComputedStyle(container).display === 'grid' ? (e.clientX > r.left + r.width / 2) : (e.clientY > r.top + r.height / 2);
      container.insertBefore(dragged, after ? over.nextSibling : over);
    });
    container.addEventListener('drop', function (e) { if (dragged) e.preventDefault(); });
    container.addEventListener('dragend', function () {
      if (!dragged) return;
      dragged.classList.remove('dragging'); dragged = null; window.markDirty(); if (onDrop) onDrop();
    });
  }
  $$('[data-rows]').forEach(function (rows) {
    var field = rows.parentNode, tmpl = $('template[data-row-template]', field), add = $('[data-row-add]', field);
    if (add && tmpl) add.addEventListener('click', function () {
      rows.appendChild(tmpl.content.cloneNode(true));
      var last = rows.lastElementChild, i = last && $('input', last);
      if (last) $$('[data-editor]', last).forEach(initEditor);
      if (i) i.focus(); window.markDirty();
    });
    rows.addEventListener('click', function (e) { var b = e.target.closest('[data-row-remove]'); if (b) { b.closest('[data-row]').remove(); window.markDirty(); } });
    if (rows.hasAttribute('data-sortable')) {
      rows.addEventListener('mousedown', function (e) { var row = e.target.closest('[data-row]'); if (row) row.draggable = !!e.target.closest('[data-handle]'); });
      sortable(rows, '[data-row]');
    }
  });
  /* ---------- an event's programme: sessions, each with any number of speakers ---------- */
  $$('[data-agenda]').forEach(function (box) {
    var list = $('[data-sessions]', box), out = $('input[name="agenda_json"]', box), form = box.closest('form');
    function add(tmplSel, into) {
      var node = $(tmplSel, box).content.firstElementChild.cloneNode(true);
      into.appendChild(node);
      $$('textarea[data-autosize]', node).forEach(function (t) { t.addEventListener('input', function () { t.style.height = 'auto'; t.style.height = (t.scrollHeight + 2) + 'px'; }); });
      var first = $('input:not([type=time]), input', node); if (first) first.focus();
      window.markDirty();
      return node;
    }
    box.addEventListener('click', function (e) {
      if (e.target.closest('[data-add-session]')) { var s = add('template[data-session-template]', list); add('template[data-speaker-template]', $('[data-speakers]', s)); $('[data-k="start"]', s).focus(); }
      else if (e.target.closest('[data-add-speaker]')) add('template[data-speaker-template]', $('[data-speakers]', e.target.closest('[data-session]')));
      else if (e.target.closest('[data-remove-speaker]')) { e.target.closest('[data-speaker]').remove(); window.markDirty(); }
      else if (e.target.closest('[data-remove-session]')) { e.target.closest('[data-session]').remove(); window.markDirty(); }
    });
    list.addEventListener('mousedown', function (e) { var s = e.target.closest('[data-session]'); if (s) s.draggable = !!e.target.closest('[data-handle]'); });
    sortable(list, '[data-session]');
    function val(root, k) { var el = $('[data-k="' + k + '"]', root); return el ? el.value.trim() : ''; }
    function write() {
      out.value = JSON.stringify($$('[data-session]', list).map(function (s) {
        return { start: val(s, 'start'), end: val(s, 'end'), session: val(s, 'session'), description: val(s, 'description'),
                 speakers: $$('[data-speaker]', s).map(function (p) { return { name: val(p, 'name'), bio: val(p, 'bio') }; })
                   .filter(function (p) { return p.name || p.bio; }) };
      }));
    }
    if (form) form.addEventListener('submit', write, true);
  });

  $$('[data-sortable-list]').forEach(function (list) {
    var url = list.getAttribute('data-order-url');
    list.addEventListener('click', function (e) { if (list.classList.contains('was-dragged')) { e.preventDefault(); list.classList.remove('was-dragged'); } });
    sortable(list, '[data-id]', function () {
      list.classList.add('was-dragged'); setTimeout(function () { list.classList.remove('was-dragged'); }, 50);
      post(url, { ids: $$('[data-id]', list).map(function (r) { return r.getAttribute('data-id'); }) }, true).catch(fail);
    });
  });

  /* ---------- picture with a focal point ---------- */
  function focusBox(card) {
    var box = $('[data-focus-box]', card); if (!box) return;
    var dot = $('[data-focus-dot]', box), input = $('[data-focus-input]', card);
    function set(x, y) {
      x = Math.max(0, Math.min(100, x)); y = Math.max(0, Math.min(100, y));
      dot.style.left = x + '%'; dot.style.top = y + '%';
      input.value = x.toFixed(1) + ',' + y.toFixed(1);
      $$('[data-crop]', card).forEach(function (i) { i.style.objectPosition = x.toFixed(1) + '% ' + y.toFixed(1) + '%'; });
      window.markDirty();
    }
    function at(ev) { var r = box.getBoundingClientRect(); set((ev.clientX - r.left) / r.width * 100, (ev.clientY - r.top) / r.height * 100); }
    var drag = false;
    box.addEventListener('pointerdown', function (ev) { drag = true; box.setPointerCapture(ev.pointerId); at(ev); ev.preventDefault(); });
    box.addEventListener('pointermove', function (ev) { if (drag) at(ev); });
    box.addEventListener('pointerup', function () { drag = false; });
    dot.addEventListener('keydown', function (ev) {
      var p = input.value.split(',').map(parseFloat), s = ev.shiftKey ? 10 : 2;
      if (ev.key === 'ArrowLeft') set(p[0] - s, p[1]); else if (ev.key === 'ArrowRight') set(p[0] + s, p[1]);
      else if (ev.key === 'ArrowUp') set(p[0], p[1] - s); else if (ev.key === 'ArrowDown') set(p[0], p[1] + s); else return;
      ev.preventDefault();
    });
  }
  function imageCardHTML(f) {
    var crops = [['Card', '4/3'], ['Thumbnail', '1/1']];
    return '<div class="focus-box" data-focus-box style="aspect-ratio:auto"><img src="' + esc(f.url) + '" alt="" draggable="false">' +
      '<span class="focus-dot" style="left:50%;top:50%" tabindex="0" role="slider" aria-label="Focal point" data-focus-dot></span></div>' +
      '<div style="display:flex;gap:12px;margin-top:14px;align-items:flex-start">' + crops.map(function (c) {
        return '<div style="flex:none"><div style="position:relative;height:96px;aspect-ratio:' + c[1] + ';overflow:hidden;border-radius:3px;background:#E3E7EC">' +
          '<img src="' + esc(f.url) + '" alt="" data-crop style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 50%"></div>' +
          '<p class="hint" style="margin-top:6px">' + c[0] + '</p></div>';
      }).join('') + '</div><p class="hint">Drag the circle to keep the important part in every crop.</p>' +
      '<div style="display:flex;gap:16px;margin-top:14px"><button type="button" class="link small" data-image-pick>Replace</button>' +
      '<button type="button" class="link small" style="color:#51627A" data-image-remove>Remove</button></div>';
  }
  function dropHTML() {
    return '<div class="drop" data-image-drop>' + ICON.upload + '<span><b>Drop a picture here</b> or <button type="button" class="link" data-image-pick>browse</button></span>' +
      '<span class="hint">JPG, PNG or WebP, at least 1280 px wide</span></div>';
  }
  $$('[data-image-card]').forEach(function (card) {
    var file = $('[data-image-file]', card), input = $('[data-image-input]', card), focus = $('[data-focus-input]', card);
    focusBox(card);
    function body() { return Array.prototype.slice.call(card.children).filter(function (c) { return c.tagName !== 'INPUT'; }); }
    function show(html) { body().forEach(function (c) { c.remove(); }); card.insertAdjacentHTML('beforeend', html); focusBox(card); }
    function send(fs) {
      if (!fs || !fs.length) return;
      card.style.opacity = '.6';
      upload([fs[0]], 'img').then(function (list) {
        input.value = list[0].canon; focus.value = '50,50'; show(imageCardHTML(list[0])); window.markDirty();
      }).catch(fail).then(function () { card.style.opacity = ''; });
    }
    card.addEventListener('click', function (e) {
      if (e.target.closest('[data-image-pick]')) file.click();
      if (e.target.closest('[data-image-remove]')) { input.value = ''; focus.value = '50,50'; show(dropHTML()); window.markDirty(); }
    });
    file.addEventListener('change', function () { send(file.files); file.value = ''; });
    card.addEventListener('dragover', function (e) { if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types, 'Files') >= 0) { e.preventDefault(); var d = $('[data-image-drop]', card); if (d) d.classList.add('over'); } });
    card.addEventListener('dragleave', function () { var d = $('[data-image-drop]', card); if (d) d.classList.remove('over'); });
    card.addEventListener('drop', function (e) { if (e.dataTransfer.files.length) { e.preventDefault(); send(e.dataTransfer.files); } });
  });
  $$('[data-photo-field]').forEach(function (box) {
    var file = $('[data-image-file]', box), input = $('[data-image-input]', box), pic = $('[data-photo]', box);
    $('[data-image-pick]', box).addEventListener('click', function () { file.click(); });
    file.addEventListener('change', function () {
      if (!file.files.length) return;
      upload([file.files[0]], 'img').then(function (list) {
        input.value = list[0].canon;
        pic.innerHTML = '<img src="' + esc(list[0].thumb || list[0].url) + '" alt="" style="width:88px;height:88px;border-radius:50%;object-fit:cover;object-position:50% 25%">';
        window.markDirty();
      }).catch(fail);
      file.value = '';
    });
  });
  $$('[data-cover-field], [data-cover-card]').forEach(function (box) {
    var file = $('[data-cover-file]', box), input = $('[data-cover-input]', box), prev = $('[data-cover-preview]', box) || $('img', box);
    var pick = $('[data-cover-pick]', box), reset = $('[data-cover-reset]', box);
    if (pick) pick.addEventListener('click', function () { file.click(); });
    if (reset) reset.addEventListener('click', function () { input.value = ''; window.markDirty(); box.closest('form').requestSubmit ? box.closest('form').requestSubmit() : box.closest('form').submit(); });
    file.addEventListener('change', function () {
      if (!file.files.length) return;
      upload([file.files[0]], 'img').then(function (list) {
        input.value = list[0].canon;
        var url = list[0].url;
        if (prev && prev.tagName === 'IMG') prev.src = list[0].thumb || url;
        else if (prev) prev.innerHTML = '<img src="' + esc(url) + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block">';
        window.markDirty();
      }).catch(fail);
      file.value = '';
    });
  });
  $$('[data-file-field]').forEach(function (box) {
    var file = $('[data-file-pick-input]', box), input = $('[data-file-input]', box);
    box.addEventListener('click', function (e) {
      if (e.target.closest('[data-file-pick]')) { e.preventDefault(); file.click(); }
      if (e.target.closest('[data-file-remove]')) {
        e.preventDefault(); input.value = '';
        var row = e.target.closest('.file'); if (row && row !== box) row.remove(); else { var n = $('.name', box); if (n) n.textContent = 'Upload the programme or report'; e.target.remove(); }
        window.markDirty();
      }
    });
    file.addEventListener('change', function () {
      if (!file.files.length) return;
      upload([file.files[0]], 'doc').then(function (list) {
        input.value = list[0].canon;
        var name = $('.name', box);
        if (name) name.textContent = list[0].name;
        else {
          var old = $('.file', box); if (old) old.remove();
          input.insertAdjacentHTML('afterend', '<div class="file" style="margin-top:10px">' + ICON.doc + '<span class="name small">' + esc(list[0].name) + '</span></div>');
        }
        var radio = box.closest('label') && $('input[type=radio]', box.closest('label'));
        if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change', { bubbles: true })); }
        window.markDirty();
      }).catch(fail);
      file.value = '';
    });
  });

  /* ---------- gallery photos ---------- */
  $$('[data-gallery-form]').forEach(function (form) {
    var grid = $('[data-photo-grid]', form), drop = $('[data-photo-drop]', form), file = $('[data-photo-file]', form);
    var coverInput = $('[data-cover-value]', form), inputs = $('[data-photo-inputs]', form), count = $('[data-photo-count]', form);
    function tile(f) {
      return '<span class="g-tile" draggable="true" data-photo="' + esc(f.canon) + '"><img src="' + esc(f.thumb || f.url) + '" alt="">' +
        '<button type="button" class="g-star" title="Cover" aria-label="Make this the cover" data-star>' + ICON.star + '</button>' +
        '<button type="button" class="g-x" aria-label="Remove photo" data-photo-remove>' + ICON.close + '</button></span>';
    }
    function refresh() {
      var ps = $$('[data-photo]', grid).map(function (t) { return t.getAttribute('data-photo'); });
      if (ps.indexOf(coverInput.value) < 0) coverInput.value = ps[0] || '';
      $$('[data-photo]', grid).forEach(function (t) { $('[data-star]', t).classList.toggle('on', t.getAttribute('data-photo') === coverInput.value); });
      inputs.innerHTML = ps.map(function (p) { return '<input type="hidden" name="photos" value="' + esc(p) + '">'; }).join('');
      count.textContent = ps.length + ' photo' + (ps.length === 1 ? '' : 's');
    }
    function send(fs) {
      var list = Array.prototype.slice.call(fs).filter(function (f) { return /^image\//.test(f.type); });
      var chain = Promise.resolve();
      list.forEach(function (f) {
        var ph = document.createElement('span'); ph.className = 'g-tile uploading'; grid.appendChild(ph);
        chain = chain.then(function () {
          return upload([f], 'img').then(function (r) { ph.outerHTML = tile(r[0]); refresh(); window.markDirty(); })
            .catch(function (err) { ph.remove(); fail(err); });
        });
      });
    }
    $('[data-photo-pick]', form).addEventListener('click', function () { file.click(); });
    file.addEventListener('change', function () { send(file.files); file.value = ''; });
    drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('over'); });
    drop.addEventListener('dragleave', function () { drop.classList.remove('over'); });
    drop.addEventListener('drop', function (e) { e.preventDefault(); drop.classList.remove('over'); send(e.dataTransfer.files); });
    grid.addEventListener('click', function (e) {
      var s = e.target.closest('[data-star]'), x = e.target.closest('[data-photo-remove]');
      if (s) { coverInput.value = s.closest('[data-photo]').getAttribute('data-photo'); refresh(); window.markDirty(); }
      if (x) { x.closest('[data-photo]').remove(); refresh(); window.markDirty(); }
    });
    sortable(grid, '.g-tile', refresh);
    form.addEventListener('submit', refresh);
  });

  /* ---------- Import contacts: preview with the matched columns ---------- */
  $$('form[data-import-map]').forEach(function (f) {
    var body = $('[data-import-preview]', f);
    function col(k) { var s = $('[data-import-col="' + k + '"]', f); return s && s.value !== '' ? +s.value : -1; }
    function upd() {
      var ci = [col('email'), col('first_name'), col('last_name')];
      $$('tr', body).forEach(function (tr) {
        var r = JSON.parse(tr.getAttribute('data-sample'));
        tr.innerHTML = ci.map(function (i) { return '<td>' + esc(i >= 0 ? (r[i] || '') : '—') + '</td>'; }).join('');
      });
    }
    f.addEventListener('change', upd); upd();
  });

  /* ---------- mini audio player (episode editor) ---------- */
  $$('[data-mini-player]').forEach(function (p) {
    var a = $('audio', p), b = $('button', p), bar = $('[data-progress]', p);
    b.addEventListener('click', function () { if (a.paused) a.play(); else a.pause(); });
    a.addEventListener('timeupdate', function () { if (a.duration) bar.style.width = (a.currentTime / a.duration * 100) + '%'; });
  });

  /* ---------- newsletter builder ---------- */
  var nlForm = $('[data-newsletter-form]');
  if (nlForm) (function () {
    var locked = nlForm.getAttribute('data-locked') === '1';
    var store = $('[data-blocks-input]', nlForm), canvas = $('[data-nl-canvas]', nlForm);
    var panel = $('[data-block-panel-body]', nlForm), panelTitle = $('[data-block-panel-title]', nlForm);
    var items = data('nl-items') || [];
    var blocks = JSON.parse(store.value || '[]'), sel = -1, timer = null;
    var NAMES = { heading: 'Heading', text: 'Text', featured: 'Featured item', list: 'List of items', podcast: 'Podcast episode', event: 'Event', image: 'Image', button: 'Button', divider: 'Divider' };
    var nid = nlForm.getAttribute('action').split('/').pop();
    function firstOf(kind) { var it = items.filter(function (i) { return !kind || i.kind === kind; })[0]; return it ? it.id : ''; }
    function defaults(t) {
      return {
        heading: { type: t, text: 'Heading', note: '' }, text: { type: t, text: '' },
        featured: { type: t, item: firstOf('research'), show_image: true, button: 'Read the paper' },
        list: { type: t, title: 'Latest research', items: items.filter(function (i) { return i.kind === 'research'; }).slice(0, 3).map(function (i) { return i.id; }) },
        podcast: { type: t, item: firstOf('podcast') }, event: { type: t, item: firstOf('event') },
        image: { type: t, image: '', url: '', alt: '' }, button: { type: t, text: 'Read more', url: 'https://minskdialogue.by/en/' }, divider: { type: t }
      }[t];
    }
    function save() { store.value = JSON.stringify(blocks); window.markDirty(); }
    function rerender() {
      clearTimeout(timer);
      timer = setTimeout(function () {
        post('/admin/newsletter/' + nid + '/render', { blocks: blocks, lang: nlForm.elements.lang.value, audience: nlForm.elements.audience.value }, true).then(function (j) {
          canvas.innerHTML = j.html; mark();
          var c = $('[data-nl-count]', nlForm); if (c) c.textContent = j.recipients;
        }).catch(fail);
      }, 250);
    }
    function mark() {
      $$('.nl-tools', canvas).forEach(function (t) { t.remove(); });
      $$('.nl-block', canvas).forEach(function (b) {
        var i = +b.getAttribute('data-block');
        b.classList.toggle('on', i === sel);
        if (i === sel && !locked) {
          var tb = document.createElement('div'); tb.className = 'nl-tools';
          tb.innerHTML = '<button type="button" data-act="up" aria-label="Move up">' + ICON.up + '</button><button type="button" data-act="down" aria-label="Move down">' + ICON.down + '</button>' +
            '<button type="button" data-act="copy" aria-label="Duplicate">' + ICON.copy + '</button><button type="button" data-act="del" aria-label="Delete">' + ICON.trash + '</button>';
          b.appendChild(tb);
        }
      });
    }
    function select(i) { sel = i; mark(); settings(); }
    function rowOf(i) { var b = $$('.nl-block', canvas)[i]; return b ? b.closest('tr') : null; }
    function renumber() { $$('.nl-block', canvas).forEach(function (b, i) { b.setAttribute('data-block', i); }); }
    function stub(type) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td style="padding:0"><div class="nl-block" tabindex="0"><div style="margin:12px 32px;padding:18px;border:1px dashed #9FB4CD;color:#7A8BA3;text-align:center;font:14px Roboto,Arial,sans-serif">' +
        esc(NAMES[type] || 'Block') + '</div></div></td>';
      return tr;
    }
    var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var EMOJI = { podcast: '🎧', event: '📅', research: '📄' };
    function nlLang() { return nlForm.elements.lang.value; }
    function titleOf(i) { return (nlLang() === 'ru' ? i.title_ru : i.title_en) || ''; }
    function sendMonth() {
      var at = nlForm.elements.send_at && nlForm.elements.send_at.value;
      var d = at ? new Date(at) : new Date();
      return { y: d.getFullYear(), m: d.getMonth() };
    }
    function opt(list, value, empty) {
      var now = sendMonth(), groups = [[], [], []];
      var names = ['This month · ' + MONTH_NAMES[now.m] + ' ' + now.y, 'Last month · ' + MONTH_NAMES[(now.m + 11) % 12], 'Earlier'];
      list.forEach(function (i) {
        var t = titleOf(i); if (!t && i.id !== value) return;
        var y = +(i.iso || '0').slice(0, 4), m = +(i.iso || '0000-01').slice(5, 7) - 1;
        var ago = (now.y - y) * 12 + (now.m - m);
        groups[ago <= 0 ? 0 : ago === 1 ? 1 : 2].push(i);
      });
      return (empty ? '<option value="">' + esc(empty) + '</option>' : '') + groups.map(function (g, n) {
        if (!g.length) return '';
        return '<optgroup label="' + esc(names[n]) + '">' + g.map(function (i) {
          var t = titleOf(i) || i.title;
          return '<option value="' + esc(i.id) + '"' + (i.id === value ? ' selected' : '') + '>' + (EMOJI[i.kind] || '') + ' ' +
            esc(t.length > 64 ? t.slice(0, 62) + '…' : t) + ' · ' + esc(i.label) + ' · ' + esc(i.date) + '</option>';
        }).join('') + '</optgroup>';
      }).join('');
    }
    function monthsResearch() {
      var now = sendMonth(), key = now.y + '-' + ('0' + (now.m + 1)).slice(-2);
      return items.filter(function (i) { return i.kind === 'research' && titleOf(i) && (i.iso || '').slice(0, 7) === key; });
    }
    function f(label, ctl, hint) { return '<div class="field"><span class="lbl">' + label + '</span>' + ctl + (hint ? '<p class="hint">' + hint + '</p>' : '') + '</div>'; }
    function sel_(name, html) { return '<label class="inp sel"><select data-k="' + name + '">' + html + '</select><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></label>'; }
    function inp(name, v, ph) { return '<input class="inp" data-k="' + name + '" value="' + esc(v) + '" placeholder="' + esc(ph || '') + '">'; }
    function settings() {
      var b = blocks[sel];
      if (!b) { panelTitle.textContent = 'Block'; panel.innerHTML = '<p class="small muted">Click a block in the email to change it.</p>'; return; }
      panelTitle.textContent = NAMES[b.type];
      var h = '';
      if (b.type === 'heading') h = f('Heading', inp('text', b.text)) + f('Note', '<textarea class="inp area" data-k="note" rows="3">' + esc(b.note) + '</textarea>');
      else if (b.type === 'text') h = f('Text', '<textarea class="inp area" data-k="text" rows="8">' + esc(b.text) + '</textarea>', 'Leave an empty line between paragraphs. **bold** and [label](https://…) for links.');
      else if (b.type === 'featured') h = f('Item', sel_('item', opt(items, b.item, 'Choose…')), '📄 research · 🎧 podcast episodes · 📅 events. Title, image and summary fill in automatically.') +
        '<div class="field"><label class="tgl"><span style="font-weight:500">Show image</span><input type="checkbox" class="sr-only" data-k="show_image"' + (b.show_image !== false ? ' checked' : '') + '><span class="toggle" aria-hidden="true"><i></i></span></label></div>' +
        f('Button text', inp('button', b.button, 'Read the paper')) + f('Summary', '<textarea class="inp area" data-k="summary" rows="3" placeholder="Leave empty to use the first sentence of the item">' + esc(b.summary || '') + '</textarea>');
      else if (b.type === 'list') {
        h = f('Title', inp('title', b.title, 'Latest research'));
        h += '<div class="field"><span class="lbl">Items</span>' + (b.items || []).map(function (id, i) {
          return '<div style="display:flex;gap:6px;margin-bottom:6px"><div style="flex:1 1 auto;min-width:0">' + sel_('items.' + i, opt(items, id, 'Choose…')) + '</div>' +
            '<button type="button" class="iconbtn sm" data-list-del="' + i + '" aria-label="Remove">' + ICON.close + '</button></div>';
        }).join('') + '<button type="button" class="link small" data-list-add>+ Add an item</button> · <button type="button" class="link small" data-list-latest>Fill with this month’s research</button>' +
          '<p class="hint" style="margin-top:6px">This month: the month the newsletter is sent in (' + MONTH_NAMES[sendMonth().m] + ').</p></div>';
      } else if (b.type === 'podcast') h = f('Episode', sel_('item', opt(items.filter(function (i) { return i.kind === 'podcast'; }), b.item, 'Choose…'))) + f('Link text', inp('button', b.button, 'Listen →'));
      else if (b.type === 'event') h = f('Event', sel_('item', opt(items.filter(function (i) { return i.kind === 'event'; }), b.item, 'Choose…'))) + f('Link text', inp('button', b.button, 'Event details →'));
      else if (b.type === 'image') h = f('Picture', '<input type="file" accept="image/*" data-nl-image hidden><button type="button" class="btn ghost sm" data-nl-image-pick>' + (b.image ? 'Replace the picture' : 'Choose a picture') + '</button>') +
        f('Link', inp('url', b.url, 'https://')) + f('Description', inp('alt', b.alt, 'For people who cannot see the picture'));
      else if (b.type === 'button') h = f('Text', inp('text', b.text)) + f('Link', inp('url', b.url, 'https://'));
      else h = '<p class="small muted">A thin line between blocks.</p>';
      panel.innerHTML = h;
      if (locked) $$('input,select,textarea,button', panel).forEach(function (x) { x.disabled = true; });
    }
    panel.addEventListener('input', function (e) {
      var k = e.target.getAttribute('data-k'), b = blocks[sel]; if (!k || !b) return;
      if (k.indexOf('items.') === 0) b.items[+k.split('.')[1]] = e.target.value;
      else b[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      save(); rerender();
    });
    panel.addEventListener('click', function (e) {
      var b = blocks[sel]; if (!b) return;
      if (e.target.closest('[data-list-add]')) { b.items = (b.items || []).concat(['']); save(); settings(); rerender(); }
      var d = e.target.closest('[data-list-del]'); if (d) { b.items.splice(+d.getAttribute('data-list-del'), 1); save(); settings(); rerender(); }
      if (e.target.closest('[data-list-latest]')) {
        var month = monthsResearch();
        b.items = (month.length ? month : items.filter(function (i) { return i.kind === 'research' && titleOf(i); }).slice(0, 3)).map(function (i) { return i.id; });
        save(); settings(); rerender();
        if (!month.length) panel.insertAdjacentHTML('beforeend', '<p class="hint">Nothing published this month yet, so these are the three latest.</p>');
      }
      if (e.target.closest('[data-nl-image-pick]')) $('[data-nl-image]', panel).click();
    });
    panel.addEventListener('change', function (e) {
      if (e.target.matches('[data-nl-image]') && e.target.files.length) {
        upload([e.target.files[0]], 'img').then(function (list) { blocks[sel].image = list[0].canon; save(); settings(); rerender(); }).catch(fail);
      } else if (e.target.getAttribute('data-k')) {
        var k = e.target.getAttribute('data-k'), b = blocks[sel];
        if (k.indexOf('items.') === 0) b.items[+k.split('.')[1]] = e.target.value; else b[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        save(); rerender();
      }
    });
    canvas.addEventListener('click', function (e) {
      if (locked) return;
      var t = e.target.closest('[data-act]');
      if (t) {
        e.preventDefault();
        var act = t.getAttribute('data-act'), row = rowOf(sel);
        if (act === 'up' && sel > 0) { blocks.splice(sel - 1, 0, blocks.splice(sel, 1)[0]); row.parentNode.insertBefore(row, rowOf(sel - 1)); sel--; }
        else if (act === 'down' && sel < blocks.length - 1) { blocks.splice(sel + 1, 0, blocks.splice(sel, 1)[0]); row.parentNode.insertBefore(rowOf(sel + 1), row); sel++; }
        else if (act === 'copy') { blocks.splice(sel + 1, 0, JSON.parse(JSON.stringify(blocks[sel]))); row.parentNode.insertBefore(row.cloneNode(true), row.nextSibling); sel++; }
        else if (act === 'del') { blocks.splice(sel, 1); row.remove(); sel = Math.min(sel, blocks.length - 1); }
        renumber(); mark(); save(); settings(); rerender(); return;
      }
      var b = e.target.closest('.nl-block');
      if (b) { e.preventDefault(); select(+b.getAttribute('data-block')); }
    });
    function insertAt(type, index) {
      var nb = defaults(type); if (!nb) return;
      var before = rowOf(index), tr = stub(type), last = rowOf(blocks.length - 1);
      if (before) before.parentNode.insertBefore(tr, before);
      else if (last) last.parentNode.insertBefore(tr, last.nextSibling);
      blocks.splice(index, 0, nb); sel = index; renumber(); mark(); save(); settings(); rerender();
    }
    $$('[data-add-block]', nlForm).forEach(function (p) {
      p.addEventListener('click', function () { if (!locked) insertAt(p.getAttribute('data-add-block'), sel >= 0 ? sel + 1 : blocks.length); });
      p.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/x-block', p.getAttribute('data-add-block')); e.dataTransfer.effectAllowed = 'copy'; });
    });
    function dropIndex(y) {
      var bs = $$('.nl-block', canvas);
      for (var i = 0; i < bs.length; i++) { var r = bs[i].getBoundingClientRect(); if (y < r.top + r.height / 2) return i; }
      return bs.length;
    }
    canvas.addEventListener('dragover', function (e) { if (!locked && Array.prototype.indexOf.call(e.dataTransfer.types, 'text/x-block') >= 0) { e.preventDefault(); canvas.classList.add('over'); } });
    canvas.addEventListener('dragleave', function () { canvas.classList.remove('over'); });
    canvas.addEventListener('drop', function (e) {
      var t = e.dataTransfer.getData('text/x-block'); canvas.classList.remove('over');
      if (t && !locked) { e.preventDefault(); insertAt(t, dropIndex(e.clientY)); }
    });
    $$('[data-nl-field]', nlForm).forEach(function (x) {
      x.addEventListener('input', function () {
        if (x.name === 'subject') { var h = $('[data-nl-title]', nlForm); if (h) h.textContent = x.value || 'Untitled newsletter'; }
        if (x.name === 'lang' || x.name === 'audience') {
          if (x.name === 'lang' && nlForm.elements.audience.value !== 'all') nlForm.elements.audience.value = x.value;     // that language's readers
          rerender(); settings();
        }
      });
    });
    $$('[data-test-open], [data-schedule-open]', nlForm).forEach(function (b) {
      b.addEventListener('click', function () {
        var d = $(b.hasAttribute('data-test-open') ? '[data-test-dialog]' : '[data-schedule-dialog]', nlForm);
        $$('.nl-dialog', nlForm).forEach(function (o) { if (o !== d) o.hidden = true; });
        d.hidden = !d.hidden; var i = $('input', d); if (i && !d.hidden) i.focus();
      });
    });
    $$('[data-dialog-close]', nlForm).forEach(function (b) { b.addEventListener('click', function () { b.closest('.nl-dialog').hidden = true; }); });
    nlForm.addEventListener('submit', function () { save(); });
    if (locked) $$('input,select,textarea', nlForm).forEach(function (x) { if (x.type !== 'hidden') x.disabled = true; });
    mark();
  })();
})();
