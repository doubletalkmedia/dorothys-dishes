/* Builds the pages from content.json. You shouldn't need to edit this file —
   everything you'd normally change lives in content.json (or in the CMS). */
function renderSite() {
  var S = window.SITE;
  if (!S) return;
  var page = document.body.getAttribute('data-page');
  var $ = function (id) { return document.getElementById(id); };
  var img = function (f) { return 'images/' + f; };
  var pageIsIndex = page === 'index';
  var home = function (hash) { return (pageIsIndex ? '' : 'index.html') + hash; };

  /* ---------- shared: top bar ---------- */
  function renderTopbar() {
    var bar = $('topbar'); if (!bar) return;
    var brand;
    if (S.logo && S.logo.file) {
      var lh = 'height:' + (S.logo.height || 34) + 'px';
      // Two versions are loaded and cross-faded, because the bar changes from
      // rust to bone as you scroll and neither logo reads on both.
      brand = '<a class="topbar-name topbar-logo" href="index.html">'
        + '<img class="logo-dark" src="' + img(S.logo.file) + '" alt="' + S.bandName + '" style="' + lh + '">'
        + (S.logo.reversed
            ? '<img class="logo-light" src="' + img(S.logo.reversed) + '" alt="" aria-hidden="true" style="' + lh + '">'
            : '')
        + '</a>';
    } else {
      brand = '<a class="topbar-name" href="index.html">' + S.bandName + '</a>';
    }
    var nav = S.nav.map(function (n) {
      var href = n.href;
      if (pageIsIndex && href.indexOf('index.html#') === 0) href = href.replace('index.html', '');
      return '<a href="' + href + '">' + n.label + '</a>';
    }).join('');
    bar.innerHTML = brand + '<nav class="topnav" aria-label="Sections">' + nav + '</nav>';
    syncTopbar();
  }

  /* The bar shows its inverted (rust) state only while the page is scrolled to
     the top. Listeners are registered once, and read the bar fresh each time, so
     re-rendering the header never stacks up duplicates. */
  var TOPBAR_THRESHOLD = 12, topbarQueued = false;
  function syncTopbar() {
    var bar = document.querySelector('.topbar');
    if (bar) bar.classList.toggle('at-top', (window.pageYOffset || 0) <= TOPBAR_THRESHOLD);
    topbarQueued = false;
  }
  function queueTopbarSync() {
    if (topbarQueued) return;
    topbarQueued = true;
    (window.requestAnimationFrame || function (f) { setTimeout(f, 16); })(syncTopbar);
  }
  window.addEventListener('scroll', queueTopbarSync, { passive: true });
  window.addEventListener('resize', queueTopbarSync, { passive: true });

  /* ---------- shared: footer ---------- */
  function renderFooter(lineOverride) {
    var f = $('footer'); if (!f) return;
    var links = S.footer.links.slice();
    if (!pageIsIndex) links.unshift({ label: 'Home', href: 'index.html' });
    links = links.filter(function (l) { return !(l.href === page + '.html'); });
    f.innerHTML = '<div class="wrap">' +
      '<p class="footer-name">' + S.bandName + '</p>' +
      '<p class="footer-line">' + (lineOverride || S.footer.line) + '</p>' +
      '<p class="footer-small">' + links.map(function (l) { return '<a href="' + l.href + '">' + l.label + '</a>'; }).join('') + '</p>' +
      '</div>';
  }

  /* ---------- shared: form wiring ---------- */
  function wireForm(form, endpoint, msgs) {
    var note = form.querySelector('.form-note');
    var wrap = form.parentNode;
    if (!endpoint) {
      var p = document.createElement('p');
      p.className = 'form-off';
      p.innerHTML = msgs.notConnected + ' <a class="btn btn-solid" href="' + S.contactLink + '">' + cap(S.contactLabel) + '</a>';
      wrap.replaceChild(p, form);
      return;
    }
    form.setAttribute('action', endpoint);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type=submit]');
      btn.disabled = true; note.textContent = 'Sending…';
      fetch(endpoint, { method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(form) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); form.reset(); note.textContent = msgs.thanks; })
        .catch(function () { note.textContent = msgs.error; })
        .then(function () { btn.disabled = false; });
    });
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ---------- index ---------- */
  function renderIndex() {
    var H = S.hero;
    $('hero').innerHTML =
      '<div class="wrap">' +
        '<h1 class="wordmark"><span>' + H.line1 + '</span><span>' + H.line2 + '</span></h1>' +
        '<p class="tagline">' + H.tagline + '</p>' +
        '<a class="btn btn-rust" href="#shows">' + H.button + '</a>' +
      '</div>' +
      '<figure class="hero-photo"><img src="' + img(H.photo) + '" alt="' + H.photoAlt + '" fetchpriority="high"></figure>';
    fitWordmark();

    // Shows
    var sh = S.shows, showsHtml;
    if (sh.useBandsintown) {
      showsHtml = '<a class="bit-widget-initializer" data-artist-name="' + sh.bandsintownArtistName + '" data-background-color="rgba(0,0,0,0)" data-separator-color="#C7B584" data-text-color="#2E261F" data-font="Lora" data-auto-style="no" data-button-label-capitalization="capitalize" data-header-capitalization="capitalize" data-location-capitalization="capitalize" data-venue-capitalization="capitalize" data-display-local-dates="false" data-display-past-dates="false" data-display-limit="10" data-link-color="#9E3F2B" data-link-text-color="#EFEAE0" data-display-lineup="false" data-display-play-my-city="true" data-language="en"></a>';
    } else {
      var today = new Date(); today.setHours(0, 0, 0, 0);
      var upcoming = sh.list.filter(function (s) { return parseDate(s.date) >= today; })
        .sort(function (a, b) { return parseDate(a.date) - parseDate(b.date); });
      if (upcoming.length) {
        showsHtml = '<ol class="shows">' + upcoming.map(function (s) {
          var d = parseDate(s.date);
          var mon = d.toLocaleString('en-US', { month: 'short' });
          var action = s.tickets ? '<a class="btn btn-line" href="' + s.tickets + '">Tickets</a>' : (s.free ? '<span class="show-free">Free show</span>' : '<span></span>');
          var where = [s.city, s.time].filter(Boolean).join(' · ');
          return '<li class="show"><time class="show-date" datetime="' + s.date + '"><span class="show-month">' + mon + '</span><span class="show-day">' + d.getDate() + '</span></time>' +
            '<div class="show-where"><strong>' + s.venue + '</strong><span>' + where + (s.note ? ' · ' + s.note : '') + '</span></div>' + action + '</li>';
        }).join('') + '</ol>';
      } else {
        showsHtml = '<p class="shows-empty">' + sh.emptyMessage.replace('Facebook', '<a href="' + S.links.facebook + '">Facebook</a>') + '</p>';
      }
    }
    $('shows').innerHTML = '<div class="wrap"><h2>' + sh.heading + '</h2><p class="lede">' + sh.lede + '</p>' + showsHtml +
      '<p class="aside">' + sh.bookingLine + ' <a href="booking.html">' + sh.bookingLinkText + '</a></p></div>';
    if (sh.useBandsintown) {
      var sc = document.createElement('script'); sc.charset = 'utf-8'; sc.src = 'https://widget.bandsintown.com/main.min.js'; document.body.appendChild(sc);
    }

    // Landscapes
    S.landscapes.forEach(function (l, i) {
      var el = $('land-' + (i + 1)); if (!el) return;
      el.style.setProperty('--img', 'url(' + img(l.file) + ')'); el.setAttribute('aria-label', l.alt);
    });

    // Watch
    var W = S.watch;
    var vid = function (v, cls) {
      return '<figure class="video ' + (cls || '') + '"><div class="video-frame' + (v.vertical ? ' video-frame-vertical' : '') + '">' +
        '<iframe src="https://www.youtube.com/embed/' + v.youtubeId + '" title="' + v.title + '" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>' +
        '<figcaption><strong>' + v.title + '</strong>' + (v.caption ? ' · ' + v.caption : '') + '</figcaption></figure>';
    };
    var rest = W.videos.slice(1);
    $('watch').innerHTML = '<div class="wrap"><h2>' + W.heading + '</h2><p class="lede">' + W.lede + '</p>' +
      (W.videos[0] ? vid(W.videos[0]) : '') +
      (rest.length ? '<div class="video-row">' + rest.map(function (v) { return vid(v); }).join('') + '</div>' : '') +
      '<p class="aside">' + W.moreText + ' <a href="' + S.links.youtube + '">' + W.moreLinkText + '</a>.</p></div>';

    // Listen
    var L = S.listen, A = L.album;
    var col = function (arr, start) { return arr && arr.length ? '<ol start="' + start + '">' + arr.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ol>' : ''; };
    $('listen').innerHTML = '<div class="wrap"><h2>' + L.heading + '</h2>' +
      '<div class="album"><figure class="album-photo"><img src="' + img(A.photo) + '" alt="' + A.photoAlt + '" loading="lazy"></figure>' +
      '<div class="album-text"><p class="album-kicker">' + A.kicker + '</p><h3 class="album-title">' + A.title + '</h3>' +
      '<div class="tracklist">' + col(A.sideOne, 1) + col(A.sideTwo, (A.sideOne || []).length + 1) + '</div>' +
      '<div class="btn-row"><a class="btn btn-line" href="' + S.links.spotify + '">Spotify</a><a class="btn btn-line" href="' + S.links.appleMusic + '">Apple Music</a><a class="btn btn-line" href="' + S.links.youtube + '">YouTube</a></div></div></div>' +
      (L.spotifyArtistId ? '<div class="player"><iframe title="' + S.bandName + ' on Spotify" src="https://open.spotify.com/embed/artist/' + L.spotifyArtistId + '?utm_source=generator&theme=0" width="100%" height="352" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe></div>' : '') +
      '</div>';

    // Band
    var B = S.band;
    var initials = function (n) { return n.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase(); };
    var members = B.members.slice().sort(function (a, b) { return (b.lead ? 1 : 0) - (a.lead ? 1 : 0); });
    $('band').innerHTML = '<div class="wrap"><h2>' + B.heading + '</h2>' +
      '<div class="bio">' + B.bio.map(function (p) { return '<p>' + p + '</p>'; }).join('') + (B.placeholder ? '<p class="placeholder">' + B.placeholder + '</p>' : '') + '</div>' +
      '<ul class="members">' + members.map(function (m) {
        var mark = m.photo ? '<img class="member-mark" src="' + img(m.photo) + '" alt="">' : '<span class="member-mark" aria-hidden="true">' + initials(m.name) + '</span>';
        return '<li class="member' + (m.lead ? ' member-lead' : '') + '">' + mark + '<div><h3>' + m.name + '</h3><p class="member-role">' + m.role + '</p><p>' + m.blurb + '</p></div></li>';
      }).join('') + '</ul>' +
      (B.credit ? '<p class="credit">' + B.credit + '</p>' : '') + '</div>';

    // Photos
    var P = S.photos;
    $('photos').innerHTML = '<div class="wrap"><h2>' + P.heading + '</h2><div class="gallery">' +
      P.gallery.map(function (g) {
        var cls = 'tile' + (g.size === 'tall' ? ' tile-tall' : g.size === 'wide' ? ' tile-wide' : '');
        return '<a class="' + cls + '" href="' + img(g.file) + '"><img src="' + img(g.file) + '" alt="' + (g.alt || '') + '" loading="lazy"></a>';
      }).join('') + '</div>' +
      '<p class="aside">' + P.moreText + ' <a href="' + S.links.instagram + '">' + P.moreLinkText + '</a>.</p></div>';

    // Dish list
    var D = S.dishList;
    $('dish-list').innerHTML = '<div class="wrap"><h2>' + D.heading + '</h2><p class="lede">' + D.lede + '</p>' +
      '<form class="dish-form" method="POST">' +
      '<label for="dl-name">Name</label><input id="dl-name" name="name" type="text" autocomplete="name">' +
      '<label for="dl-email">Email</label><input id="dl-email" name="email" type="email" autocomplete="email" required>' +
      '<label for="dl-town">' + D.townLabel + '</label><input id="dl-town" name="town" type="text" placeholder="Lincoln, NE" autocomplete="address-level2">' +
      '<button class="btn btn-solid" type="submit">' + D.button + '</button><p class="form-note" role="status" aria-live="polite"></p></form></div>';
    wireForm($('dish-list').querySelector('form'), S.forms.dishListEndpoint, D);

    // Follow
    var F = S.follow;
    $('follow').innerHTML = '<div class="wrap"><h2>' + F.heading + '</h2><p class="lede">' + F.lede + '</p><ul class="social">' +
      F.items.map(function (i) { return '<li><a href="' + (S.links[i.link] || i.href) + '"><span class="social-name">' + i.name + '</span><span class="social-sub">' + i.sub + '</span></a></li>'; }).join('') + '</ul></div>';

    // Press
    var R = S.press;
    $('press').innerHTML = '<div class="wrap"><h2>' + R.heading + '</h2><ul class="press">' +
      R.items.map(function (i) { return '<li><a href="' + i.href + '">' + i.name + '</a><span>' + i.sub + '</span></li>'; }).join('') + '</ul>' +
      '<p class="aside">' + R.contactLine + ' <a href="' + S.contactLink + '">' + S.contactLabel + '</a></p></div>';
  }

  function parseDate(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }

  function fitWordmark() {
    var el = document.querySelector('.wordmark'); if (!el) return;
    var spans = [].slice.call(el.querySelectorAll('span'));
    function widestLine() {
      var w = 0;
      for (var i = 0; i < spans.length; i++) w = Math.max(w, spans[i].getBoundingClientRect().width);
      return w;
    }
    function fit() {
      el.style.fontSize = '';
      var cs = getComputedStyle(el);
      var fill = parseFloat(cs.getPropertyValue('--wordmark-fill'));
      if (!(fill > 0)) fill = 1;
      var max = el.clientWidth * fill;
      var size = parseFloat(cs.fontSize);
      var w = widestLine();
      // Text width scales linearly with font-size, so one measurement is enough.
      if (w > max && w > 0) el.style.fontSize = (size * max / w) + 'px';
    }
    fit(); window.addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  }

  /* ---------- booking ---------- */
  function renderBooking() {
    var K = S.booking;
    var opts = K.eventTypes.map(function (t) { return '<option>' + t + '</option>'; }).join('');
    $('booking').innerHTML = '<h1>' + K.heading + '</h1><p class="intro">' + K.intro + '</p>' +
      (K.goodToKnow && K.goodToKnow.length ? '<h2 class="sub">' + K.goodToKnowHeading + '</h2><ul class="facts">' + K.goodToKnow.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>' : '') +
      '<form class="dish-form booking-form" method="POST">' +
      '<div class="two"><div><label for="b-name">Your name</label><input id="b-name" name="name" type="text" autocomplete="name" required></div>' +
      '<div><label for="b-email">Email</label><input id="b-email" name="email" type="email" autocomplete="email" required></div></div>' +
      '<div class="two"><div><label for="b-phone">Phone</label><input id="b-phone" name="phone" type="tel" autocomplete="tel"></div>' +
      '<div><label for="b-type">What kind of event</label><select id="b-type" name="event_type">' + opts + '</select></div></div>' +
      '<div class="two"><div><label for="b-date">Date</label><input id="b-date" name="date" type="date"></div>' +
      '<div><label for="b-where">Where</label><input id="b-where" name="location" type="text" placeholder="Venue, town"></div></div>' +
      '<label for="b-budget">Budget, if you have one in mind</label><input id="b-budget" name="budget" type="text">' +
      '<label for="b-details">Tell us about it</label><textarea id="b-details" name="details" rows="5" placeholder="Crowd size, how long you need us, indoors or out, whether there\'s a PA — anything that helps."></textarea>' +
      '<button class="btn btn-solid" type="submit">' + K.button + '</button><p class="form-note" role="status" aria-live="polite"></p></form>';
    wireForm($('booking').querySelector('form'), S.forms.bookingEndpoint, K);
  }

  /* ---------- donald's don'ts ---------- */
  function renderDonalds() {
    var D = S.donalds;
    $('donalds').innerHTML = '<h1>' + D.heading + '</h1><p>' + D.intro + '</p><ul class="donts">' +
      D.list.map(function (t) { var ph = /^\[.*\]$/.test(t); return '<li><span class="no">Don\'t</span><span' + (ph ? ' class="placeholder"' : '') + '>' + t + '</span></li>'; }).join('') +
      '</ul><a class="btn btn-line" href="index.html">Back to the band</a>';
  }

  /* ---------- naming study ---------- */
  function renderNamingStudy() {
    var N = S.namingStudy;
    var sec = function (label, heading) { return '<h2><small>' + label + '</small>' + heading + '</h2>'; };
    var html = '<p class="report-kicker">' + N.kicker + '</p><h1>' + N.title + '</h1>' +
      '<dl class="memo">' + N.memo.map(function (m) { return '<dt>' + m[0] + '</dt><dd>' + m[1] + '</dd>'; }).join('') + '</dl>';
    N.sections.forEach(function (s) { html += sec(s.label, s.heading) + s.paragraphs.map(function (p) { return '<p>' + p + '</p>'; }).join(''); });
    var F = N.findings;
    html += sec(F.label, F.heading) + '<p>' + F.intro + '</p><ul class="chart">' +
      F.chart.map(function (c) { return '<li><span class="lbl">' + c.label + '</span><div class="bar' + (c.faint ? ' faint' : '') + '" style="width:' + c.pct + '%"><span>' + c.show + '</span></div></li>'; }).join('') +
      '</ul><p class="chart-note">' + F.chartNote + '</p><p>' + F.moreIntro + '</p><ul>' + F.bullets.map(function (b) { return '<li>' + b + '</li>'; }).join('') + '</ul>';
    var Q = N.quotes;
    html += sec(Q.label, Q.heading) + Q.items.map(function (q) { return '<blockquote><p>' + q.text + '</p><cite>' + q.who + '</cite></blockquote>'; }).join('');
    var A = N.alternatives;
    html += sec(A.label, A.heading) + '<table><thead><tr>' + A.columns.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      A.rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>' +
      '<div class="rec"><p>' + A.recommendation + '</p></div>';
    var T = N.transcript;
    html += sec(T.label, T.heading) + '<dl class="transcript">' + T.lines.map(function (l) { return '<dt>' + l[0] + '</dt><dd>' + l[1] + '</dd>'; }).join('') + '</dl>';
    var St = N.stimulus;
    html += sec(St.label, St.heading) + '<figure class="stimulus"><img src="' + img(St.photo) + '" alt="' + St.alt + '" loading="lazy"><figcaption>' + St.caption + '</figcaption></figure>' +
      '<p class="aside">' + N.closing + '</p><a class="btn btn-line back" href="index.html">' + N.backButton + '</a>';
    $('report').innerHTML = html;
  }

  /* ---------- lily land ---------- */
  function renderLily() {
    var L = S.lily;
    var t = L.ticker.map(function (x) { return '<span>✦ ' + x + '</span>'; }).join('');
    $('ticker').innerHTML = '<div class="ticker-track">' + t + t + '</div>';
    $('lily').innerHTML =
      '<header class="mast"><p class="mast-small">' + L.presents + '</p><h1>' + L.title + '</h1><div class="mast-sub">' + L.sub.map(function (s) { return '<span>' + s + '</span>'; }).join('') + '</div></header>' +
      '<figure class="cover"><img src="' + img(L.cover) + '" alt="' + L.coverAlt + '">' +
      '<div class="sticker" aria-hidden="true"><div><strong>' + L.sticker.big + '</strong>' + L.sticker.small + '<small>' + L.sticker.tiny + '</small></div></div></figure>' +
      '<p class="cover-note">' + L.coverNote + '</p>' +
      '<section class="card"><h2>' + L.issueHeading + '</h2><ul class="features">' +
      L.features.map(function (f, i) { return '<li><span class="num">' + (i + 1) + '</span><div><h3>' + f.title + '</h3><p>' + f.text + '</p></div></li>'; }).join('') + '</ul></section>' +
      '<section class="card"><h2>' + L.shopHeading + '</h2><div class="shop">' +
      L.products.map(function (p) { return '<div class="product"><span class="sold">' + L.soldOutLabel + '</span><h3>' + p.name + '</h3><span class="price">' + p.price + '</span><p>' + p.text + '</p></div>'; }).join('') + '</div></section>' +
      '<section class="card subscribe"><h2>' + L.subscribeHeading + '</h2><p>' + L.subscribeText + '</p><a class="btn" href="index.html#dish-list">' + L.subscribeButton + '</a><p>' + L.subscribeNote + '</p></section>';
    $('lily-foot').innerHTML = '<p>' + L.footer + '<br><a href="index.html">Back to ' + S.bandName + '</a></p>';
  }

  /* ---------- go ---------- */
  renderTopbar();
  if (page === 'index') { renderIndex(); renderFooter(); }
  if (page === 'booking') { renderBooking(); renderFooter(); }
  if (page === 'donalds-donts') { renderDonalds(); renderFooter(S.donalds.footerLine); }
  if (page === 'focus-group') { renderNamingStudy(); renderFooter(S.namingStudy.footerLine); }
  if (page === 'lily-land') { renderLily(); }
}

/* ------------------------------------------------------------------
   Load the content, then draw the page.

   content.json is fetched at runtime, which means opening these files
   straight off your disk (a file:// address) will not work — browsers
   block a local page from reading a local file. Run preview.py instead;
   it starts a small local server and opens the right address.
   ------------------------------------------------------------------ */
(function () {
  if (window.SITE) { renderSite(); return; }   // already inlined (preview build)

  fetch('content.json', { cache: 'no-store' })
    .then(function (r) {
      if (!r.ok) throw new Error('content.json returned ' + r.status);
      return r.json();
    })
    .then(function (data) { window.SITE = data; renderSite(); })
    .catch(function (err) {
      var local = location.protocol === 'file:';
      document.body.innerHTML =
        '<div style="max-width:34rem;margin:14vh auto;padding:0 1.5rem;'
        + 'font:1rem/1.6 Lora,Georgia,serif;color:#2E261F">'
        + '<h1 style="font:800 2rem/1 \'Barlow Condensed\',Arial,sans-serif;'
        + 'text-transform:uppercase;color:#9E3F2B;margin:0 0 1rem">'
        + (local ? 'Open this through the preview server' : 'Content failed to load')
        + '</h1><p>'
        + (local
            ? 'Browsers will not let a page opened from your hard drive read '
              + 'content.json. In a terminal, go to this folder and run '
              + '<code style="background:#E4DDCF;padding:.1em .4em">python3 preview.py</code> '
              + '\u2014 it opens the site correctly. Once the site is hosted online this '
              + 'does not apply.'
            : 'The page could not read content.json. If you just edited it, '
              + 'check for a missing comma or quote.')
        + '</p><p style="color:#5A4F44;font-size:.9rem">' + String(err) + '</p></div>';
      document.body.style.background = '#EFEAE0';
    });
})();
