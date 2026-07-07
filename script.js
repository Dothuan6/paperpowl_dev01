/* ecoeshop.vn clone — interactions */
document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Hero slider ---------- */
  const slides = Array.from(document.querySelectorAll('.hero__slide'));
  const dotsWrap = document.querySelector('.hero__dots');
  let idx = 0, timer;

  if (slides.length) {
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      if (i === 0) b.classList.add('is-active');
      b.addEventListener('click', () => go(i));
      dotsWrap.appendChild(b);
    });
    const dots = Array.from(dotsWrap.children);

    function go(n) {
      slides[idx].classList.remove('is-active');
      dots[idx].classList.remove('is-active');
      idx = (n + slides.length) % slides.length;
      slides[idx].classList.add('is-active');
      dots[idx].classList.add('is-active');
    }
    function next() { go(idx + 1); }
    function auto() { timer = setInterval(next, 5000); }
    function reset() { clearInterval(timer); auto(); }

    document.querySelector('.hero__next').addEventListener('click', () => { next(); reset(); });
    document.querySelector('.hero__prev').addEventListener('click', () => { go(idx - 1); reset(); });
    auto();
  }

  /* ---------- Flash sale countdown ---------- */
  const cd = document.getElementById('countdown');
  if (cd) {
    let remaining = 12 * 3600 + 34 * 60 + 56; // demo: 12:34:56
    const [h, , m, , s] = cd.children;
    function pad(n) { return String(n).padStart(2, '0'); }
    function tick() {
      if (remaining < 0) remaining = 12 * 3600;
      h.textContent = pad(Math.floor(remaining / 3600));
      m.textContent = pad(Math.floor((remaining % 3600) / 60));
      s.textContent = pad(remaining % 60);
      remaining--;
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- Carousel setup (smooth wheel + arrows, optional infinite loop) ---------- */
  function setupCarousel(track, prev, next, step, loop) {
    if (!track) return;
    let target = track.scrollLeft;
    let raf = null;
    let oneSet = 0;

    // Infinite loop: clone the item set before and after the originals
    let count = 0;
    if (loop) {
      const originals = Array.from(track.children);
      count = originals.length;
      if (count) {
        originals.forEach(el => track.appendChild(el.cloneNode(true)));            // set after
        originals.slice().reverse().forEach(el => track.insertBefore(el.cloneNode(true), track.firstChild)); // set before
        // order: [before set (count)][originals (count)][after set (count)]
        const measure = () => {
          // width of exactly one set incl. its trailing gap = position where originals begin
          oneSet = track.children[count].offsetLeft - track.children[0].offsetLeft;
          track.scrollLeft = oneSet;
          target = oneSet;
        };
        requestAnimationFrame(measure);
        window.addEventListener('load', measure);
      }
    }

    function wrap() {
      if (!loop || !oneSet) return;
      if (track.scrollLeft < oneSet * 0.5) {
        track.scrollLeft += oneSet; target += oneSet;
      } else if (track.scrollLeft > oneSet * 1.5) {
        track.scrollLeft -= oneSet; target -= oneSet;
      }
    }

    function animate() {
      const current = track.scrollLeft;
      const diff = target - current;
      if (Math.abs(diff) < 0.5) { track.scrollLeft = target; wrap(); raf = null; return; }
      track.scrollLeft = current + diff * 0.09; // lower = smoother, longer glide
      wrap();
      raf = requestAnimationFrame(animate);
    }
    function moveTo(v) {
      if (!loop) { const max = track.scrollWidth - track.clientWidth; v = Math.max(0, Math.min(max, v)); }
      target = v;
      if (!raf) raf = requestAnimationFrame(animate);
    }

    if (next) next.addEventListener('click', () => moveTo(target + step));
    if (prev) prev.addEventListener('click', () => moveTo(target - step));

    track.addEventListener('wheel', (e) => {
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (delta === 0) return;
      if (loop) {
        e.preventDefault();
        moveTo(target + delta * 0.85);
      } else {
        const max = track.scrollWidth - track.clientWidth;
        const atStart = track.scrollLeft <= 0, atEnd = track.scrollLeft >= max - 1;
        if ((delta < 0 && !atStart) || (delta > 0 && !atEnd)) {
          e.preventDefault();
          moveTo((raf ? target : track.scrollLeft) + delta * 0.85);
        }
      }
    }, { passive: false });
  }

  document.querySelectorAll('.cat-carousel').forEach(c =>
    setupCarousel(c.querySelector('.cat-track'), c.querySelector('.cat-prev'), c.querySelector('.cat-next'), 360, false));
  document.querySelectorAll('.partners__carousel').forEach(c =>
    setupCarousel(c.querySelector('.partners__track'), c.querySelector('.cat-prev'), c.querySelector('.cat-next'), 400, false));
  document.querySelectorAll('.row-carousel').forEach(c =>
    setupCarousel(c.querySelector('.product-row'), c.querySelector('.row-prev'), c.querySelector('.row-next'), 460, true));

  /* ---------- Certs carousel pagination dots ---------- */
  document.querySelectorAll('.certs__carousel').forEach(c => {
    const track = c.querySelector('.certs__track');
    const dotsWrap = c.querySelector('.certs__dots');
    if (!track || !dotsWrap) return;
    const perView = 4;
    const total = track.children.length;
    const pages = Math.max(1, Math.ceil(total / perView));
    for (let i = 0; i < pages; i++) {
      const b = document.createElement('button');
      if (i === 0) b.classList.add('is-active');
      b.addEventListener('click', () => track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' }));
      dotsWrap.appendChild(b);
    }
    const dots = Array.from(dotsWrap.children);
    track.addEventListener('scroll', () => {
      const p = Math.round(track.scrollLeft / track.clientWidth);
      dots.forEach((d, i) => d.classList.toggle('is-active', i === p));
    });

    // auto-advance through pages, looping
    let page = 0, autoTimer;
    function auto() {
      autoTimer = setInterval(() => {
        page = (page + 1) % pages;
        track.scrollTo({ left: page * track.clientWidth, behavior: 'smooth' });
      }, 3500);
    }
    function stop() { clearInterval(autoTimer); }
    c.addEventListener('mouseenter', stop);
    c.addEventListener('mouseleave', auto);
    dots.forEach((d, i) => d.addEventListener('click', () => { page = i; }));
    auto();
  });

  /* ---------- Cart dropdown ---------- */
  const cartWrap = document.querySelector('.cart-wrap');
  const cartToggle = document.getElementById('cartToggle');
  if (cartWrap && cartToggle) {
    cartToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      cartWrap.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!cartWrap.contains(e.target)) cartWrap.classList.remove('open');
    });
    // qty steppers
    cartWrap.querySelectorAll('.cart-item').forEach(item => {
      const val = item.querySelector('.qty__val');
      item.querySelector('.qty-plus').addEventListener('click', () => { val.value = (+val.value) + 1; });
      item.querySelector('.qty-minus').addEventListener('click', () => { if (+val.value > 1) val.value = (+val.value) - 1; });
      item.querySelector('.cart-item__remove').addEventListener('click', () => {
        item.remove();
        const badge = document.querySelector('.cart-count');
        if (badge) badge.textContent = Math.max(0, (+badge.textContent) - 1);
      });
    });
  }

  /* ---------- Mobile cart bottom-sheet enhancement ---------- */
  (function cartSheet() {
    const wrap = document.querySelector('.cart-wrap');
    const dropdown = wrap && wrap.querySelector('.cart-dropdown');
    if (!wrap || !dropdown) return;

    // Sticky sheet top: drag handle + orange summary bar (count · total · close)
    const top = document.createElement('div');
    top.className = 'cart-sheet-top';
    top.innerHTML =
      '<span class="cart-sheet-handle" aria-hidden="true"></span>' +
      '<div class="cart-sheet-summary">' +
        '<span class="cart-sheet-count">0 sản phẩm</span>' +
        '<span class="cart-sheet-total">0₫</span>' +
        '<button type="button" class="cart-sheet-close">Đóng</button>' +
      '</div>';
    dropdown.insertBefore(top, dropdown.firstChild);

    // Backdrop (mobile only, shown via CSS)
    const backdrop = document.createElement('div');
    backdrop.className = 'cart-backdrop';
    // Append backdrop inside .cart-wrap (same stacking context as the sheet) so the
    // sheet paints ABOVE the dim layer instead of being covered by it
    wrap.appendChild(backdrop);

    const countEl = top.querySelector('.cart-sheet-count');
    const totalEl = top.querySelector('.cart-sheet-total');

    function refresh() {
      const n = dropdown.querySelectorAll('.cart-item').length;
      countEl.textContent = n + ' sản phẩm';
      const totalB = dropdown.querySelector('.cart-dropdown__total b');
      if (totalB) totalEl.textContent = totalB.textContent.trim();
    }
    function isMobile() { return window.matchMedia('(max-width:768px)').matches; }
    function sync() {
      const open = wrap.classList.contains('open');
      if (open) refresh();
      if (open && isMobile()) {
        backdrop.classList.add('show');
        document.body.classList.add('cart-lock');
      } else {
        backdrop.classList.remove('show');
        document.body.classList.remove('cart-lock');
      }
    }
    function closeCart() { wrap.classList.remove('open'); }

    top.querySelector('.cart-sheet-close').addEventListener('click', closeCart);
    backdrop.addEventListener('click', closeCart);

    // React to open/close toggled by the existing cart handler
    new MutationObserver(sync).observe(wrap, { attributes: true, attributeFilter: ['class'] });
    // Keep totals fresh when items are added/removed (observe the list only,
    // never the whole dropdown — refresh() writes into the summary and would loop)
    const listEl = dropdown.querySelector('.cart-list');
    if (listEl) new MutationObserver(refresh).observe(listEl, { childList: true });
    window.addEventListener('resize', sync);
    refresh();
  })();

  /* ---------- Contact float menu ---------- */
  const floatBtns = document.getElementById('floatBtns');
  const contactToggle = document.getElementById('contactToggle');
  if (floatBtns && contactToggle) {
    contactToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      floatBtns.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!floatBtns.contains(e.target)) floatBtns.classList.remove('open');
    });
  }

  /* ---------- Show "to top" button after scrolling down ---------- */
  const toTop = document.querySelector('.to-top');
  if (toTop) {
    const onScroll = () => toTop.classList.toggle('show', window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Scroll reveal ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ---------- Quick view modal (Mua ngay / Chi tiết / Chọn mua) ---------- */
  (function () {
    const modal = document.getElementById('qvModal');
    if (!modal) return;
    const $ = id => document.getElementById(id);
    const valInput = modal.querySelector('.qv-val');
    const variants = modal.querySelectorAll('.qv-variant');
    const state = { loc: 0, thung: 0, unitLoc: 0, unitThung: 0, variant: 0, qty: 1 };

    const money = n => n.toLocaleString('vi-VN') + '₫';
    const num = t => parseInt((t || '').replace(/[^\d]/g, '') || '0', 10);

    function render() {
      $('qvP0').textContent = money(state.loc);
      $('qvU0').textContent = '(' + money(state.unitLoc) + '/cái)';
      $('qvP1').textContent = money(state.thung);
      $('qvU1').textContent = '(' + money(state.unitThung) + '/cái)';
      const price = state.variant === 0 ? state.loc : state.thung;
      $('qvTotal').textContent = money(price * state.qty);
    }
    function open(card, idx) {
      const nameEl = card.querySelector('h3');
      const name = (nameEl ? nameEl.innerText : 'Sản phẩm').trim();
      const priceText = card.querySelector('.pcard__price .now') ? card.querySelector('.pcard__price .now').textContent : '0';
      const raw = num(priceText);
      const isUnit = /cái/i.test(priceText);
      const unit = isUnit ? raw : Math.max(1, Math.round(raw / 50));
      state.unitLoc = unit;
      state.loc = unit * 50;
      state.unitThung = Math.max(1, Math.round(unit * 0.85));
      state.thung = state.unitThung * 1000;
      state.variant = 0; state.qty = 1;
      $('qvName').textContent = name;
      $('qvHeadName').textContent = name;
      $('qvImg').textContent = name;
      $('qvSku').textContent = 'PB' + String(idx + 1).padStart(3, '0');
      valInput.value = 1;
      variants.forEach((v, i) => v.classList.toggle('is-active', i === 0));
      modal.querySelector('input[value="0"]').checked = true;
      render();
      modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
    }
    function close() { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); }

    document.querySelectorAll('.pcard').forEach((card, idx) => {
      card.querySelectorAll('.btn-buy, .btn-ghost').forEach(btn => {
        const isDetail = /chi ti/i.test(btn.textContent);
        btn.addEventListener('click', e => {
          e.preventDefault();
          if (isDetail) window.location.href = 'product.html';
          else open(card, idx);
        });
      });
    });
    variants.forEach((v, i) => v.addEventListener('click', () => {
      state.variant = i;
      variants.forEach((x, j) => x.classList.toggle('is-active', j === i));
      v.querySelector('input').checked = true; render();
    }));
    modal.querySelector('.qv-plus').addEventListener('click', () => { state.qty++; valInput.value = state.qty; render(); });
    modal.querySelector('.qv-minus').addEventListener('click', () => { if (state.qty > 1) { state.qty--; valInput.value = state.qty; render(); } });
    $('qvAdd').addEventListener('click', () => {
      const badge = document.querySelector('.cart-count');
      if (badge) badge.textContent = (parseInt(badge.textContent, 10) || 0) + state.qty;
      close();
    });
    modal.querySelector('.qv-close').addEventListener('click', close);
    modal.addEventListener('click', e => { if (e.target === modal) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) close(); });

    const dots = modal.querySelectorAll('.qv-dots span'); let gi = 0;
    const setDot = i => { gi = (i + dots.length) % dots.length; dots.forEach((d, j) => d.classList.toggle('is-active', j === gi)); };
    if (modal.querySelector('.qv-gnext')) modal.querySelector('.qv-gnext').addEventListener('click', () => setDot(gi + 1));
    if (modal.querySelector('.qv-gprev')) modal.querySelector('.qv-gprev').addEventListener('click', () => setDot(gi - 1));

    // share toggle: click icon -> reveal Facebook + link
    const share = modal.querySelector('#qvShare');
    if (share) {
      const toggle = share.querySelector('.qv-share__toggle');
      toggle.addEventListener('click', e => { e.stopPropagation(); share.classList.toggle('open'); });
      modal.addEventListener('click', () => share.classList.remove('open'));
    }
  })();

  /* ---------- Review modal ("Viết đánh giá") ---------- */
  (function () {
    const rm = document.getElementById('reviewModal');
    if (!rm) return;
    const open = () => { rm.classList.add('open'); rm.setAttribute('aria-hidden', 'false'); };
    const close = () => { rm.classList.remove('open'); rm.setAttribute('aria-hidden', 'true'); };
    document.querySelectorAll('.pd-rev-write, .js-review-open').forEach(b =>
      b.addEventListener('click', e => { e.preventDefault(); open(); }));
    rm.querySelectorAll('.rv-close').forEach(b => b.addEventListener('click', close));
    rm.addEventListener('click', e => { if (e.target === rm) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && rm.classList.contains('open')) close(); });
    // star rating
    const stars = rm.querySelectorAll('.rv-stars span');
    let rating = 0;
    stars.forEach((s, i) => {
      s.addEventListener('mouseenter', () => stars.forEach((x, j) => x.classList.toggle('on', j <= i)));
      s.addEventListener('click', () => { rating = i + 1; });
    });
    rm.querySelector('.rv-stars').addEventListener('mouseleave', () => stars.forEach((x, j) => x.classList.toggle('on', j < rating)));
    // submit -> success
    const form = rm.querySelector('.rv-form');
    if (form) form.addEventListener('submit', e => {
      e.preventDefault();
      rm.querySelector('.rv-body').style.display = 'none';
      rm.querySelector('.rv-success').classList.add('show');
    });
  })();

  /* ---------- Header search -> search.html ---------- */
  document.querySelectorAll('.search').forEach(form => {
    const input = form.querySelector('input');
    const go = () => { window.location.href = 'search.html?q=' + encodeURIComponent((input.value || '').trim()); };
    const btn = form.querySelector('button');
    if (btn) btn.addEventListener('click', e => { e.preventDefault(); go(); });
    if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
  });

  /* ---------- Search page: echo query ---------- */
  (function () {
    const el = document.getElementById('searchQuery');
    if (!el) return;
    const q = new URLSearchParams(location.search).get('q') || '';
    el.textContent = q;
  })();

  /* ---------- Account tabs (orders/reviews/loyalty) ---------- */
  document.querySelectorAll('.acc-tabs').forEach(group => {
    group.querySelectorAll('.acc-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        group.querySelectorAll('.acc-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });
  });

  /* ---------- Account edit / address modals ---------- */
  document.querySelectorAll('.am-open').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const m = document.getElementById(btn.dataset.modal);
      if (m) { m.classList.add('open'); m.setAttribute('aria-hidden', 'false'); }
    });
  });
  document.querySelectorAll('.am-modal').forEach(m => {
    m.querySelectorAll('.am-close, .am-cancel').forEach(b => b.addEventListener('click', () => m.classList.remove('open')));
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.am-modal.open').forEach(m => m.classList.remove('open'));
  });

  /* ---------- Collection SEO toggle ---------- */
  (function () {
    const btn = document.querySelector('.col-seo-toggle');
    const box = document.querySelector('.col-seo');
    if (!btn || !box) return;
    btn.addEventListener('click', () => {
      box.classList.toggle('collapsed');
      btn.textContent = box.classList.contains('collapsed') ? 'Xem thêm' : 'Thu gọn';
    });
  })();

  /* ---------- Mobile hamburger + slide-in drawer ---------- */
  (function mobileNav() {
    const headerInner = document.querySelector('.header__inner');
    const sourceMenu = document.querySelector('.nav .menu');
    if (!headerInner || !sourceMenu) return;

    // Hamburger button (left of logo)
    const toggle = document.createElement('button');
    toggle.className = 'nav-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Mở menu');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span></span><span></span><span></span>';
    headerInner.insertBefore(toggle, headerInner.firstChild);

    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'drawer-overlay';

    // Drawer
    const drawer = document.createElement('aside');
    drawer.className = 'mobile-drawer';
    drawer.setAttribute('aria-hidden', 'true');

    const head = document.createElement('div');
    head.className = 'mobile-drawer__head';
    head.innerHTML =
      '<a href="index.html" class="mobile-drawer__logo"><img src="assets/Logo.jpg" alt="Paperbowl"></a>' +
      '<button class="mobile-drawer__close" type="button" aria-label="Đóng menu">&times;</button>';

    const nav = document.createElement('nav');
    nav.className = 'mobile-drawer__nav';
    const ul = document.createElement('ul');

    Array.from(sourceMenu.children).forEach(li => {
      const link = li.querySelector(':scope > a');
      const sub = li.querySelector(':scope > .submenu');
      const item = document.createElement('li');

      if (sub) {
        item.className = 'md-has-sub';
        const row = document.createElement('div');
        row.className = 'md-row';
        const a = document.createElement('a');
        a.href = link ? link.getAttribute('href') : '#';
        a.textContent = link ? link.textContent.trim() : '';
        const caret = document.createElement('button');
        caret.className = 'md-caret';
        caret.type = 'button';
        caret.setAttribute('aria-label', 'Mở rộng danh mục');
        caret.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M7 10l5 5 5-5z"/></svg>';
        row.appendChild(a);
        row.appendChild(caret);

        const subUl = document.createElement('ul');
        subUl.className = 'md-submenu';
        Array.from(sub.children).forEach(sli => {
          const sa = sli.querySelector('a');
          const sitem = document.createElement('li');
          const saa = document.createElement('a');
          saa.href = sa ? sa.getAttribute('href') : '#';
          saa.textContent = sa ? sa.textContent.trim() : '';
          sitem.appendChild(saa);
          subUl.appendChild(sitem);
        });

        caret.addEventListener('click', e => {
          e.preventDefault();
          item.classList.toggle('open');
        });
        item.appendChild(row);
        item.appendChild(subUl);
      } else {
        const a = document.createElement('a');
        a.href = link ? link.getAttribute('href') : '#';
        a.textContent = link ? link.textContent.trim() : '';
        a.className = 'md-link';
        item.appendChild(a);
      }
      ul.appendChild(item);
    });

    nav.appendChild(ul);
    drawer.appendChild(head);
    drawer.appendChild(nav);
    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    function open() {
      drawer.classList.add('open');
      overlay.classList.add('show');
      toggle.classList.add('is-active');
      toggle.setAttribute('aria-expanded', 'true');
      drawer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('drawer-lock');
    }
    function close() {
      drawer.classList.remove('open');
      overlay.classList.remove('show');
      toggle.classList.remove('is-active');
      toggle.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('drawer-lock');
    }

    toggle.addEventListener('click', () => drawer.classList.contains('open') ? close() : open());
    overlay.addEventListener('click', close);
    head.querySelector('.mobile-drawer__close').addEventListener('click', close);
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setTimeout(close, 80)));
    window.addEventListener('resize', () => { if (window.innerWidth > 1024) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  })();
});
