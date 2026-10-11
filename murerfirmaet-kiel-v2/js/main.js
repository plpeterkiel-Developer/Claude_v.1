(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var $ = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ---------- Header: glass on scroll, hide when scrolling down ---------- */
  var header = $('.site-header');
  var lastY = 0;
  function onScrollHeader() {
    var y = window.scrollY;
    header.classList.toggle('scrolled', y > 40);
    header.classList.toggle('hidden', y > lastY && y > 400 && !document.body.classList.contains('menu-open'));
    lastY = y;
  }
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  var toggle = $('.menu-toggle');
  toggle.addEventListener('click', function () {
    var open = document.body.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  $$('.nav a').forEach(function (a) {
    a.addEventListener('click', function () {
      document.body.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------- Reveal on scroll ---------- */
  var revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  $$('.reveal').forEach(function (el) { revealObs.observe(el); });

  /* ---------- Animated counters ---------- */
  var countObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      countObs.unobserve(e.target);
      var el = e.target;
      var target = parseFloat(el.dataset.count);
      var decimals = (el.dataset.count.split('.')[1] || '').length;
      var suffix = el.dataset.suffix || '';
      if (reduceMotion) { el.textContent = target.toFixed(decimals).replace('.', ',') + suffix; return; }
      var start = performance.now();
      (function tick(now) {
        var p = clamp((now - start) / 1800, 0, 1);
        var eased = 1 - Math.pow(1 - p, 4);
        el.textContent = (target * eased).toFixed(decimals).replace('.', ',') + suffix;
        if (p < 1) requestAnimationFrame(tick);
      })(start);
    });
  }, { threshold: 0.5 });
  $$('[data-count]').forEach(function (el) { countObs.observe(el); });

  /* ---------- Spotlight on cards ---------- */
  $$('.card').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- Custom cursor ---------- */
  if (finePointer && !reduceMotion) {
    document.body.classList.add('has-cursor');
    var ring = document.createElement('div');
    var dot = document.createElement('div');
    ring.className = 'cursor';
    dot.className = 'cursor-dot';
    document.body.append(ring, dot);
    var mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function loop() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      var size = ring.offsetWidth;
      ring.style.transform = 'translate(' + (rx - size / 2) + 'px,' + (ry - size / 2) + 'px)';
      dot.style.transform = 'translate(' + (mx - 3) + 'px,' + (my - 3) + 'px)';
      requestAnimationFrame(loop);
    })();
    document.addEventListener('pointerover', function (e) {
      ring.classList.toggle('hover', !!e.target.closest('a, button, input, select, textarea, summary, .compare'));
    });
  }

  /* ---------- Hero: interactive tile wall ---------- */
  var wall = $('#tile-wall');
  if (wall) {
    var wctx = wall.getContext('2d');
    var tiles = [];
    var pointer = { x: -9999, y: -9999 };
    var W = 0, H = 0, dpr = 1;

    var buildWall = function () {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = wall.clientWidth; H = wall.clientHeight;
      wall.width = W * dpr; wall.height = H * dpr;
      wctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Large-format tiles laid in a half-offset bond, like a modern bathroom wall
      var tw = W < 700 ? 90 : 150, th = tw / 2, gap = 3;
      tiles = [];
      for (var row = 0, y = 0; y < H + th; row++, y += th) {
        var offset = row % 2 ? -tw / 2 : 0;
        for (var x = offset; x < W + tw; x += tw) {
          tiles.push({ x: x + gap / 2, y: y + gap / 2, w: tw - gap, h: th - gap, tone: 13 + Math.random() * 5, lift: 0 });
        }
      }
    };

    var drawWall = function (t) {
      wctx.fillStyle = '#0b0b0a';
      wctx.fillRect(0, 0, W, H);
      var radius = Math.max(W, H) * 0.22;
      for (var i = 0; i < tiles.length; i++) {
        var tl = tiles[i];
        var cx = tl.x + tl.w / 2, cy = tl.y + tl.h / 2;
        var d = Math.hypot(cx - pointer.x, cy - pointer.y);
        var target = Math.max(0, 1 - d / radius);
        var wave = reduceMotion ? 0 : (Math.sin(t / 1400 - cx / 260 + cy / 380) * 0.5 + 0.5) * 0.18;
        tl.lift += (target - tl.lift) * 0.08;
        var l = Math.min(1, tl.lift + wave);
        var s = 1 + tl.lift * 0.04;
        var w = tl.w * s, h = tl.h * s;
        var x = cx - w / 2 - tl.lift * 3, y = cy - h / 2 - tl.lift * 3;
        wctx.fillStyle = 'hsl(36, 9%, ' + (tl.tone + l * 16) + '%)';
        wctx.fillRect(x, y, w, h);
        // Bevel: light top edge, dark bottom edge
        wctx.fillStyle = 'rgba(255,240,215,' + (0.05 + l * 0.12) + ')';
        wctx.fillRect(x, y, w, 1.5);
        wctx.fillStyle = 'rgba(0,0,0,0.35)';
        wctx.fillRect(x, y + h - 1.5, w, 1.5);
        if (tl.lift > 0.02) {
          wctx.strokeStyle = 'rgba(226,196,143,' + tl.lift * 0.75 + ')';
          wctx.lineWidth = 1;
          wctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        }
      }
    };

    var running = true;
    var frame = function (t) {
      drawWall(t);
      if (running && !reduceMotion) requestAnimationFrame(frame);
    };

    buildWall();
    requestAnimationFrame(frame);
    window.addEventListener('resize', function () { buildWall(); if (reduceMotion) drawWall(0); });
    var hero = $('.hero');
    hero.addEventListener('pointermove', function (e) {
      var r = wall.getBoundingClientRect();
      pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
    });
    hero.addEventListener('pointerleave', function () { pointer.x = pointer.y = -9999; });
    // Pause the animation when the hero is off-screen to save battery
    new IntersectionObserver(function (entries) {
      var wasRunning = running;
      running = entries[0].isIntersecting;
      if (running && !wasRunning && !reduceMotion) requestAnimationFrame(frame);
    }).observe(hero);
  }

  /* ---------- Pattern studio ---------- */
  var pcanvas = $('#pattern-canvas');
  if (pcanvas) {
    var pctx = pcanvas.getContext('2d');
    var state = { pattern: 'herringbone', color: '#d8cfc0', grout: '#e9e6df', terrazzo: false };
    var shapes = [];
    var animStart = 0;
    var S = 0;

    var rect = function (x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; };

    var rotateAll = function (polys, angle, cx, cy) {
      var c = Math.cos(angle), s = Math.sin(angle);
      return polys.map(function (p) {
        return p.map(function (pt) {
          var dx = pt[0] - cx, dy = pt[1] - cy;
          return [cx + dx * c - dy * s, cy + dx * s + dy * c];
        });
      });
    };

    var patterns = {
      stacked: function (u) {
        var out = [];
        for (var y = 0; y < S; y += u * 1.5) for (var x = 0; x < S; x += u * 1.5) out.push(rect(x, y, u * 1.5, u * 1.5));
        return out;
      },
      bond: function (u) {
        var out = [], w = u * 2.4, h = u * 1.2;
        for (var r = 0, y = 0; y < S; r++, y += h) {
          for (var x = r % 2 ? -w / 2 : 0; x < S; x += w) out.push(rect(x, y, w, h));
        }
        return out;
      },
      herringbone: function (u) {
        // Staircase of one horizontal + one vertical plank, repeated, then rotated 45°
        var out = [], Wd = u * 0.7, L = Wd * 3, ext = S * 1.6;
        for (var k = -40; k < 40; k++) {
          for (var n = -60; n < 60; n++) {
            var ox = n * Wd + k * L, oy = n * Wd - k * L;
            if (ox < -ext || ox > ext || oy < -ext || oy > ext) continue;
            out.push(rect(ox, oy, L, Wd));
            out.push(rect(ox + L, oy + Wd - L, Wd, L));
          }
        }
        return rotateAll(out, -Math.PI / 4, 0, 0).map(function (p) {
          return p.map(function (pt) { return [pt[0] + S / 2, pt[1] + S / 2]; });
        }).filter(function (p) {
          return p.some(function (pt) { return pt[0] > -u * 3 && pt[0] < S + u * 3 && pt[1] > -u * 3 && pt[1] < S + u * 3; });
        });
      },
      chevron: function (u) {
        var out = [], cw = u * 1.6, h = u * 0.8, slope = cw * 0.6;
        for (var k = 0, x = 0; x < S; k++, x += cw) {
          for (var y = -slope - h; y < S + slope; y += h) {
            out.push(k % 2
              ? [[x, y - slope], [x + cw, y], [x + cw, y + h], [x, y - slope + h]]
              : [[x, y], [x + cw, y - slope], [x + cw, y - slope + h], [x, y + h]]);
          }
        }
        return out;
      },
      hex: function (u) {
        var out = [], r = u * 0.9, hw = Math.sqrt(3) * r;
        for (var row = 0, y = 0; y < S + r * 2; row++, y += r * 1.5) {
          for (var x = row % 2 ? hw / 2 : 0; x < S + hw; x += hw) {
            var pts = [];
            for (var i = 0; i < 6; i++) {
              var a = Math.PI / 6 + i * Math.PI / 3;
              pts.push([x + r * Math.cos(a), y + r * Math.sin(a)]);
            }
            out.push(pts);
          }
        }
        return out;
      }
    };

    var hexToRgb = function (hex) {
      var n = parseInt(hex.slice(1), 16);
      return [n >> 16 & 255, n >> 8 & 255, n & 255];
    };

    var rebuild = function () {
      var dprP = Math.min(window.devicePixelRatio || 1, 2);
      S = pcanvas.clientWidth;
      pcanvas.width = S * dprP; pcanvas.height = S * dprP;
      pctx.setTransform(dprP, 0, 0, dprP, 0, 0);
      var u = S / 9;
      var base = hexToRgb(state.color);
      shapes = patterns[state.pattern](u).map(function (pts) {
        var cx = 0, cy = 0;
        pts.forEach(function (p) { cx += p[0]; cy += p[1]; });
        cx /= pts.length; cy /= pts.length;
        var v = (Math.random() - 0.5) * 18;
        var specks = [];
        if (state.terrazzo) {
          for (var i = 0; i < 7; i++) specks.push([cx + (Math.random() - 0.5) * u, cy + (Math.random() - 0.5) * u * 0.5, Math.random() * 2.2 + 0.6, Math.random() > 0.5]);
        }
        return {
          pts: pts, cx: cx, cy: cy, specks: specks,
          fill: 'rgb(' + base.map(function (c) { return clamp(Math.round(c + v), 0, 255); }).join(',') + ')',
          delay: (cx + cy) / (S * 2) * 900
        };
      });
      animStart = performance.now();
      requestAnimationFrame(drawPattern);
    };

    var drawPattern = function (now) {
      var t = reduceMotion ? 1e9 : now - animStart;
      pctx.fillStyle = state.grout;
      pctx.fillRect(0, 0, S, S);
      var done = true;
      var groutW = Math.max(1.5, S / 260);
      shapes.forEach(function (sh) {
        var p = clamp((t - sh.delay) / 450, 0, 1);
        if (p < 1) done = false;
        if (p === 0) return;
        var e = 1 - Math.pow(1 - p, 3);
        pctx.save();
        pctx.globalAlpha = e;
        pctx.translate(sh.cx, sh.cy);
        pctx.scale(e, e);
        pctx.translate(-sh.cx, -sh.cy);
        pctx.beginPath();
        sh.pts.forEach(function (pt, i) { i ? pctx.lineTo(pt[0], pt[1]) : pctx.moveTo(pt[0], pt[1]); });
        pctx.closePath();
        pctx.fillStyle = sh.fill;
        pctx.fill();
        pctx.lineWidth = groutW;
        pctx.strokeStyle = state.grout;
        pctx.stroke();
        sh.specks.forEach(function (sp) {
          pctx.fillStyle = sp[3] ? 'rgba(60,55,50,.55)' : 'rgba(255,255,255,.7)';
          pctx.beginPath();
          pctx.arc(sp[0], sp[1], sp[2], 0, Math.PI * 2);
          pctx.fill();
        });
        pctx.restore();
      });
      // Soft light falloff for depth
      var g = pctx.createLinearGradient(0, 0, S, S);
      g.addColorStop(0, 'rgba(255,255,255,0.12)');
      g.addColorStop(1, 'rgba(0,0,0,0.18)');
      pctx.fillStyle = g;
      pctx.fillRect(0, 0, S, S);
      if (!done) requestAnimationFrame(drawPattern);
    };

    var label = $('#studio-tag');
    var updateLabel = function () {
      var p = $('[data-pattern][aria-pressed="true"]').textContent;
      var c = $('[data-color][aria-pressed="true"]').getAttribute('aria-label');
      var g = $('[data-grout][aria-pressed="true"]').textContent;
      label.textContent = p + ' · ' + c + ' · ' + g.toLowerCase() + ' fuge';
    };

    var bindGroup = function (attr, apply) {
      $$('[data-' + attr + ']').forEach(function (btn) {
        btn.addEventListener('click', function () {
          $$('[data-' + attr + ']').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
          btn.setAttribute('aria-pressed', 'true');
          apply(btn);
          updateLabel();
          rebuild();
        });
      });
    };
    bindGroup('pattern', function (b) { state.pattern = b.dataset.pattern; });
    bindGroup('color', function (b) { state.color = b.dataset.color; state.terrazzo = b.hasAttribute('data-terrazzo'); });
    bindGroup('grout', function (b) { state.grout = b.dataset.grout; });

    var studioObs = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { studioObs.disconnect(); updateLabel(); rebuild(); }
    }, { threshold: 0.3 });
    studioObs.observe(pcanvas);
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { if (shapes.length) rebuild(); }, 200);
    });
  }

  /* ---------- Before / after slider ---------- */
  $$('.compare').forEach(function (cmp) {
    var input = $('input', cmp);
    var set = function () { cmp.style.setProperty('--pos', input.value + '%'); };
    input.addEventListener('input', set);
    set();
  });

  /* ---------- Process: vertical scroll drives horizontal track ---------- */
  var processEl = $('.process');
  if (processEl) {
    var track = $('.process-track', processEl);
    var bar = $('.progress span', processEl);
    var horizontal = window.matchMedia('(min-width: 761px) and (prefers-reduced-motion: no-preference)');
    var updateProcess = function () {
      if (!horizontal.matches) { track.style.transform = ''; return; }
      var r = processEl.getBoundingClientRect();
      var p = clamp(-r.top / (r.height - window.innerHeight), 0, 1);
      var distance = track.scrollWidth - window.innerWidth;
      track.style.transform = 'translate3d(' + (-p * distance) + 'px,0,0)';
      bar.style.width = (p * 100) + '%';
    };
    window.addEventListener('scroll', updateProcess, { passive: true });
    window.addEventListener('resize', updateProcess);
    updateProcess();
  }

  /* ---------- Price estimator ----------
     Vejledende priser i kr. inkl. moms — JUSTÉR til firmaets egne priser. */
  var PRICES = {
    perM2: { standard: 14000, premium: 19000, luksus: 26000 },
    fixed: 18000,
    extras: { demolition: 9000, floorHeat: 7500, niche: 4500 }
  };
  var est = $('#estimator');
  if (est) {
    var area = $('#est-area', est);
    var fmt = new Intl.NumberFormat('da-DK', { maximumFractionDigits: 0 });
    var calc = function () {
      var m2 = +area.value;
      var level = $('input[name="level"]:checked', est).value;
      var total = PRICES.fixed + m2 * PRICES.perM2[level];
      $$('input[name="extra"]:checked', est).forEach(function (x) { total += PRICES.extras[x.value]; });
      var low = Math.round(total * 0.9 / 1000) * 1000;
      var high = Math.round(total * 1.15 / 1000) * 1000;
      $('#est-area-out', est).textContent = m2 + ' m²';
      $('#est-price', est).textContent = fmt.format(low) + ' – ' + fmt.format(high) + ' kr.';
    };
    est.addEventListener('input', calc);
    calc();
  }

  /* ---------- Contact form ----------
     No server yet: the form opens the visitor's mail app with everything filled in.
     Swap for Formspree / Netlify Forms / own backend when the site goes live. */
  var form = $('#contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var d = new FormData(form);
      var body = [
        'Navn: ' + d.get('name'),
        'Telefon: ' + d.get('phone'),
        'E-mail: ' + d.get('email'),
        'Postnr.: ' + d.get('zip'),
        'Projekt: ' + d.get('type'),
        '',
        d.get('message')
      ].join('\n');
      window.location.href = 'mailto:' + form.dataset.to +
        '?subject=' + encodeURIComponent('Tilbud: ' + d.get('type') + ' (' + d.get('zip') + ')') +
        '&body=' + encodeURIComponent(body);
      $('.form-status', form).textContent = 'Tak! Din mailklient åbner nu med din forespørgsel klar til afsendelse.';
    });
  }

  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
