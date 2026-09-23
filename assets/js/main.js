/* پلتفرم دانشگاه سمنان — اسکریپت مشترک */
(function () {
  "use strict";

  // Sticky header shadow
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("scrolled", window.scrollY > 8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Mobile menu
  var burger = document.querySelector(".burger");
  var mmenu = document.querySelector(".mobile-menu");
  if (burger && mmenu) {
    var closeMenu = function () { mmenu.classList.remove("open"); };
    burger.addEventListener("click", function () { mmenu.classList.add("open"); });
    var backdrop = mmenu.querySelector(".mm-backdrop");
    var closeBtn = mmenu.querySelector(".mm-close");
    if (backdrop) backdrop.addEventListener("click", closeMenu);
    if (closeBtn) closeBtn.addEventListener("click", closeMenu);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
  }

  // Gentle reveal on scroll
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.1 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ============================================================
     صفحات فهرست (دوره‌ها / اطلاعیه‌ها): جستجو، فیلتر، مرتب‌سازی
     ============================================================ */
  function faDigitsN(n) {
    return String(n).replace(/[0-9]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹"[+d]; });
  }
  function normTxt(s) {
    return String(s || "")
      .replace(/ي/g, "ی").replace(/ك/g, "ک")
      .replace(/[^\u0600-\u06FFa-zA-Z0-9]+/g, " ")
      .trim().toLowerCase();
  }
  function initListings() {
    var wrap = document.querySelector("[data-lp]");
    if (!wrap) return;
    var list = wrap.querySelector("[data-lp-list]");
    if (!list) return;
    var cards = Array.prototype.slice.call(list.children);
    var search = wrap.querySelector("[data-lp-search]");
    var catGrp = wrap.querySelector("[data-lp-cat]");
    var priceGrp = wrap.querySelector("[data-lp-price]");
    var sortGrp = wrap.querySelector("[data-lp-sort]");
    var empty = wrap.querySelector("[data-lp-empty]");
    if (!cards.length) return;

    /* رادیو/چک‌باکس یا select — مقدار انتخاب‌شدهٔ هر گروه فیلتر */
    function grpVal(grp) {
      if (!grp) return "";
      if (grp.tagName === "SELECT") return grp.value;
      var el = grp.querySelector("input:checked");
      return el ? el.value : "";
    }
    function grpReset(grp) {
      if (!grp) return;
      if (grp.tagName === "SELECT") { grp.selectedIndex = 0; return; }
      var first = grp.querySelector('input[value=""]');
      if (first) first.checked = true;
    }

    function apply() {
      var q = normTxt(search ? search.value : "");
      var cat = grpVal(catGrp);
      var pr = grpVal(priceGrp);
      var sort = grpVal(sortGrp);
      var visible = cards.filter(function (card) {
        if (q && normTxt(card.getAttribute("data-search")).indexOf(q) === -1) return false;
        if (cat && card.getAttribute("data-cat") !== cat) return false;
        if (pr && card.getAttribute("data-price") !== pr) return false;
        return true;
      });
      if (sort === "title") {
        visible = visible.slice().sort(function (a, b) {
          return String(a.getAttribute("data-title")).localeCompare(String(b.getAttribute("data-title")), "fa");
        });
      } else if (sort === "old" || sort === "new") {
        var asc = sort === "old";
        visible = visible.slice().sort(function (a, b) {
          var dA = Date.parse(a.getAttribute("data-dt") || "") || 0;
          var dB = Date.parse(b.getAttribute("data-dt") || "") || 0;
          return asc ? dA - dB : dB - dA;
        });
      }
      visible.forEach(function (card) { list.appendChild(card); });
      cards.forEach(function (card) {
        var show = visible.indexOf(card) !== -1;
        card.hidden = !show;
        card.classList.toggle("in", show);
      });
      var n = visible.length;
      document.querySelectorAll("[data-lp-count]").forEach(function (el) { el.textContent = faDigitsN(n); });
      if (empty) empty.hidden = n !== 0;
      document.querySelectorAll("[data-lp-reset]").forEach(function (b) { b.hidden = !(q || cat || pr); });
      wrap.querySelectorAll(".lp-chip").forEach(function (chip) {
        var inp = chip.querySelector("input");
        chip.classList.toggle("is-on", !!(inp && inp.checked));
      });
    }

    if (search) search.addEventListener("input", apply);
    [catGrp, priceGrp, sortGrp].forEach(function (grp) {
      if (grp) grp.addEventListener("change", apply);
    });
    document.querySelectorAll("[data-lp-reset]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (search) search.value = "";
        grpReset(catGrp);
        grpReset(priceGrp);
        grpReset(sortGrp);
        apply();
        if (search) search.focus();
      });
    });

    /* باز/بستن پنل فیلترها روی موبایل */
    var toggle = wrap.querySelector("[data-lp-toggle]");
    var filters = wrap.querySelector("[data-lp-filters]");
    if (toggle && filters) {
      toggle.addEventListener("click", function () {
        var open = filters.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }

    /* فیلتر اولیه از آدرس — لینک‌هایی مثل ettelaieh.html?cat=رویداد&q=کارگاه */
    function pickRadio(grp, value) {
      if (!grp || !value) return;
      var safe = String(value).replace(/"/g, "");
      if (grp.tagName === "SELECT") { grp.value = safe; return; }
      var el = grp.querySelector('input[value="' + safe + '"]');
      if (el) el.checked = true;
    }
    (function fromUrl() {
      var p;
      try { p = new URLSearchParams(window.location.search); } catch (e) { return; }
      var q = p.get("q") || p.get("search") || "";
      if (q && search) search.value = q;
      pickRadio(catGrp, p.get("cat") || p.get("category") || "");
      pickRadio(sortGrp, p.get("sort") || "");
      pickRadio(priceGrp, p.get("price") || "");
    })();
    apply();
  }
  initListings();

  /* ============================================================
     پروفایل تشکل‌ها — «ادامه مطلب» برای توضیح بلند
     ============================================================ */
  function initOrgProfile() {
    var buttons = document.querySelectorAll("[data-op-more]");
    if (!buttons.length) return;
    buttons.forEach(function (btn) {
      var text = document.getElementById(btn.getAttribute("aria-controls")) ||
        btn.parentNode.querySelector("[data-op-about]");
      var label = btn.querySelector("[data-op-more-label]");
      if (!text) return;
      btn.addEventListener("click", function () {
        var clamped = text.classList.toggle("is-clamped");
        btn.setAttribute("aria-expanded", clamped ? "false" : "true");
        if (label) label.textContent = clamped ? "ادامه مطلب" : "کمتر";
      });
    });
  }
  initOrgProfile();

  /* ============================================================
     صفحه‌بندی داخلِ همان کادر برای آرشیو اطلاعیه‌ها و دوره‌ها
     (بدون صفحهٔ جدید؛ تعداد هر صفحه از data-pgr-size می‌آید)
     ============================================================ */
  function initOrgPager() {
    document.querySelectorAll("[data-pgr]").forEach(function (wrap) {
      var nav = wrap.parentNode.querySelector("[data-pgr-nav]");
      if (!nav) return;
      var items = Array.prototype.slice.call(wrap.children);
      var size = parseInt(wrap.getAttribute("data-pgr-size") || "15", 10) || 15;
      var pages = Math.max(1, Math.ceil(items.length / size));
      if (pages <= 1) return;
      var pageBtns = [];
      function show(p) {
        items.forEach(function (li, i) { li.hidden = Math.floor(i / size) !== p; });
        pageBtns.forEach(function (b, i) {
          b.classList.toggle("is-active", i === p);
          if (i === p) b.setAttribute("aria-current", "page");
          else b.removeAttribute("aria-current");
        });
        var prev = nav.querySelector("[data-pg-prev]");
        var next = nav.querySelector("[data-pg-next]");
        if (prev) prev.disabled = p === 0;
        if (next) next.disabled = p === pages - 1;
      }
      for (var p = 0; p < pages; p++) {
        (function (pi) {
          var b = document.createElement("button");
          b.type = "button";
          b.textContent = faDigits("" + (pi + 1));
          b.addEventListener("click", function () { show(pi); });
          pageBtns.push(b);
        })(p);
      }
      var prev = document.createElement("button");
      prev.type = "button"; prev.dataset.pgPrev = ""; prev.textContent = "قبلی";
      var next = document.createElement("button");
      next.type = "button"; next.dataset.pgNext = ""; next.textContent = "بعدی";
      nav.appendChild(prev);
      pageBtns.forEach(function (b) { nav.appendChild(b); });
      nav.appendChild(next);
      nav.hidden = false;
      show(0);
    });
  }
  initOrgPager();

  /* ============================================================
     فهرست اعضا — دو دکمهٔ بازشونده «اعضا» و «مسئولین»
     ============================================================ */
  function initMemberTabs() {
    var btns = Array.prototype.slice.call(document.querySelectorAll("[data-mem-toggle]"));
    if (!btns.length) return;
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-mem-toggle");
        var panel = document.querySelector('[data-mem-panel="' + key + '"]');
        if (!panel) return;
        var wasOpen = !panel.hidden;
        btns.forEach(function (b) {
          b.classList.remove("is-open");
          b.setAttribute("aria-expanded", "false");
          b.setAttribute("aria-selected", "false");
        });
        document.querySelectorAll("[data-mem-panel]").forEach(function (p) { p.hidden = true; });
        if (!wasOpen) {
          panel.hidden = false;
          btn.classList.add("is-open");
          btn.setAttribute("aria-expanded", "true");
          btn.setAttribute("aria-selected", "true");
        }
      });
    });
  }
  initMemberTabs();

  /* ============================================================
     تب بار موبایل — فقط زیر ۹۹۲px؛ سکشن‌های همان تب را نشان می‌دهد
     (روی دسکتاپ همهٔ سکشن‌ها مثل قبل نمایش داده می‌شوند)
     ============================================================ */
  function initProfileTabs() {
    var bar = document.querySelector("[data-op-tabbar]");
    if (!bar) return;
    var btns = Array.prototype.slice.call(bar.querySelectorAll("[data-op-tab-btn]"));
    if (!btns.length) return;
    var glide = bar.querySelector("[data-op-tabglide]");
    var scroll = bar.querySelector(".op-tabbar-scroll");
    var sections = Array.prototype.slice.call(document.querySelectorAll(".op-main [data-op-tab]"));
    var mq = window.matchMedia("(max-width: 991px)");
    var active = btns[0].getAttribute("data-op-tab-btn");

    function positionGlide(animate) {
      var btn = btns.filter(function (b) { return b.getAttribute("data-op-tab-btn") === active; })[0];
      if (!glide || !btn) return;
      if (!animate) glide.style.transition = "none";
      glide.style.width = btn.offsetWidth + "px";
      glide.style.transform = "translateX(" + btn.offsetLeft + "px)";
      if (!animate) { void glide.offsetWidth; glide.style.transition = ""; }
      if (scroll && mq.matches && scroll.scrollTo) {
        var left = btn.offsetLeft;
        var right = left + btn.offsetWidth;
        if (left < scroll.scrollLeft) scroll.scrollTo({ left: Math.max(0, left - 12), behavior: "smooth" });
        else if (right > scroll.scrollLeft + scroll.clientWidth) scroll.scrollTo({ left: right - scroll.clientWidth + 12, behavior: "smooth" });
      }
    }

    function apply() {
      var mobile = mq.matches;
      sections.forEach(function (sec) {
        sec.hidden = mobile ? sec.getAttribute("data-op-tab") !== active : false;
      });
      btns.forEach(function (b) {
        var on = b.getAttribute("data-op-tab-btn") === active;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
      bar.classList.toggle("is-ready", mobile);
      if (mobile) requestAnimationFrame(function () { positionGlide(false); });
    }

    function activate(key, doScroll) {
      active = key;
      apply();
      if (doScroll) {
        var y = bar.getBoundingClientRect().top + window.pageYOffset - 71;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }

    btns.forEach(function (b) {
      b.addEventListener("click", function () { activate(b.getAttribute("data-op-tab-btn"), true); });
    });

    document.addEventListener("click", function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      var id = (a.getAttribute("href") || "").slice(1);
      if (!id) return;
      var target = document.getElementById(id);
      var key = target ? target.getAttribute("data-op-tab") : null;
      if (!mq.matches || !key) return;
      e.preventDefault();
      activate(key, true);
    });

    if (mq.addEventListener) mq.addEventListener("change", apply);
    else if (mq.addListener) mq.addListener(apply);
    window.addEventListener("resize", function () { positionGlide(false); });
    window.addEventListener("load", function () { positionGlide(false); });
    apply();
  }
  initProfileTabs();

  /* ============================================================
     گالری — بزرگ‌نمایی هر تصویر با کپشن (لایت‌باکس + پیمایش)
     ============================================================ */
  function initGalleryLightbox() {
    var lb = document.querySelector("[data-op-lightbox]");
    if (!lb) return;
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-op-gal]"));
    if (!items.length) return;
    var img = lb.querySelector("[data-op-lb-img]");
    var cap = lb.querySelector("[data-op-lb-cap]");
    var prev = lb.querySelector("[data-op-lb-prev]");
    var next = lb.querySelector("[data-op-lb-next]");
    var closeBtn = lb.querySelector("[data-op-lb-close]");
    var idx = 0;

    function render() {
      var real = items[idx].querySelector("img");
      if (!real || !img) return;
      img.src = real.currentSrc || real.src;
      img.alt = real.alt || "";
      var c = items[idx].getAttribute("data-cap") || "";
      if (cap) { cap.textContent = c; cap.hidden = !c; }
      if (prev) prev.disabled = idx === 0;
      if (next) next.disabled = idx === items.length - 1;
    }
    function open(i) {
      idx = i;
      render();
      lb.hidden = false;
      document.body.style.overflow = "hidden";
      if (closeBtn) closeBtn.focus();
    }
    function hideLb() {
      lb.hidden = true;
      document.body.style.overflow = "";
      if (items[idx]) items[idx].focus();
    }
    function step(d) {
      var n = idx + d;
      if (n < 0 || n >= items.length) return;
      idx = n;
      render();
    }

    items.forEach(function (item, i) {
      item.addEventListener("click", function () { open(i); });
    });
    if (closeBtn) closeBtn.addEventListener("click", hideLb);
    if (prev) prev.addEventListener("click", function () { step(-1); });
    if (next) next.addEventListener("click", function () { step(1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) hideLb(); });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") hideLb();
      else if (e.key === "ArrowLeft") step(1);
      else if (e.key === "ArrowRight") step(-1);
    });
  }
  initGalleryLightbox();

  /* ============================================================
     بخش تخفیف‌ها — تاریخ شمسی، شمارش معکوس، کپی کد
     ============================================================ */

  var MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];

  // تبدیل میلادی -> شمسی (الگوریتم استاندارد jalaali)
  function g2j(gy, gm, gd) {
    var g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    var jy = 979;
    gy -= 1600;
    var gy2 = (gm > 2) ? gy + 1 : gy;
    var days = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
    jy += 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    jy += Math.floor((days - 1) / 365);
    if (days > 365) days = (days - 1) % 365;
    var jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
    var jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
    return { y: jy, m: jm, d: jd };
  }

  // تاریخ شمسی امروز
  function todayJalali() {
    var now = new Date();
    return g2j(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }

  // عدد ترتیبی تاریخ شمسی (برای مقایسه‌ی تفاوت روز)
  function jalaliDayNum(y, m, d) {
    var md = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
    var dn = 0;
    for (var i = 0; i < m - 1; i++) dn += md[i];
    return y * 366 + dn + d;
  }

  // نمایش تاریخ شمسی کوتاه — "۲۵ شهریور"
  function jalaliLabel(j) {
    if (!j) return "";
    return j.d + " " + MONTHS[j.m - 1];
  }

  function faDigits(n) {
    var s = String(n);
    return s.replace(/[0-9]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹"[+d]; });
  }

  // آماده‌سازی کارت‌های تخفیف
  function initDiscounts() {
    var cards = document.querySelectorAll(".dc");
    if (!cards.length) return;

    var now = todayJalali();

    cards.forEach(function (card) {
      var expText = card.querySelector(".dc-exp-text");
      var statusEl = card.querySelector(".dc-status");
      var barFill = card.querySelector(".dc-bar-fill");
      var permanent = card.getAttribute("data-exp") === "permanent";
      var dimmed = card.classList.contains("dc-off");

      if (dimmed) {
        if (statusEl) { statusEl.textContent = "منقضی"; statusEl.style.background = "linear-gradient(90deg,#e0392e,#c2291f)"; statusEl.style.border = "none"; }
        if (expText) expText.innerHTML = "<b>منقضی شد</b> — این تخفیف دیگر معتبر نیست";
        if (barFill) { barFill.style.width = "100%"; barFill.style.background = "linear-gradient(90deg,#e0392e,#c2291f)"; }
        card.classList.add("dc-expired");
        return;
      }

      if (permanent) {
        if (statusEl) { statusEl.textContent = "همیشگی"; statusEl.style.background = "linear-gradient(90deg,#4cc878,#2f9e5a)"; statusEl.style.border = "none"; }
        if (expText) {
          expText.innerHTML = "انقضا ندارد — اعتبار این تخفیف <b>همیشگی</b> است";
        }
        if (card.getAttribute("data-exp-text")) {
          expText.textContent = card.getAttribute("data-exp-text");
          if (statusEl) { statusEl.textContent = "فعال"; statusEl.style.background = "linear-gradient(90deg,#4cc878,#2f9e5a)"; statusEl.style.border = "none"; }
        }
        return;
      }

      var j = null;
      var raw = card.getAttribute("data-exp");
      var m = raw ? String(raw).match(/^(\d{4})-(\d{2})-(\d{2})/) : null;
      if (m) j = g2j(+m[1], +m[2], +m[3]);
      if (j) {
        var diff = jyDayNum(j.y, j.m, j.d) - jyDayNum(now.y, now.m, now.d);
        if (diff < 0) {
          // منقضی
          if (statusEl) { statusEl.textContent = "منقضی"; statusEl.style.background = "linear-gradient(90deg,#e0392e,#c2291f)"; statusEl.style.border = "none"; }
          if (expText) expText.innerHTML = "<b>منقضی شد</b> — این تخفیف دیگر معتبر نیست";
          if (barFill) { barFill.style.width = "100%"; barFill.style.background = "linear-gradient(90deg,#e0392e,#c2291f)"; }
          card.classList.add("dc-expired");
        } else if (diff === 0) {
          if (statusEl) { statusEl.textContent = "امروز آخرین روز"; statusEl.style.background = "linear-gradient(90deg,#f5c400,#d4a100)"; statusEl.style.border = "none"; }
          if (expText) expText.innerHTML = "فقط <b>امروز</b> فرصت داری — عجله کن!";
        } else {
          if (statusEl) { statusEl.textContent = "فعال"; statusEl.style.background = "linear-gradient(90deg,#4cc878,#2f9e5a)"; statusEl.style.border = "none"; }
          if (expText) expText.innerHTML = "<b>" + faDigits(diff) + "</b> روز تا انقضا باقی مانده · تا " + jalaliLabel(j);
          if (barFill) {
            var pct = Math.min(diff, 14) / 14 * 100;
            barFill.style.width = pct + "%";
            if (diff <= 3) { barFill.classList.add("dc-pulse"); }
          }
        }
      } else if (raw) {
        if (expText) expText.textContent = "اعتبار تا " + raw;
        if (statusEl) { statusEl.textContent = "فعال"; statusEl.style.background = "linear-gradient(90deg,#4cc878,#2f9e5a)"; statusEl.style.border = "none"; }
      }
    });

    // کپی کد تخفیف
    document.querySelectorAll(".dc-copy").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var cardEl = btn.closest(".dc");
        var code = btn.getAttribute("data-code") || "";
        if (!code && cardEl) {
          var codeEl = cardEl.querySelector(".dc-code");
          if (codeEl) { code = codeEl.textContent.trim(); }
        }
        var copiedEl = btn.querySelector(".dc-copied");
        var iconEl = btn.querySelector(".dc-ci");
        var flash = function () {
          btn.classList.add("done");
          if (iconEl) iconEl.style.display = "none";
          if (copiedEl) copiedEl.style.display = "inline";
          setTimeout(function () {
            btn.classList.remove("done");
            if (iconEl) iconEl.style.display = "";
            if (copiedEl) copiedEl.style.display = "none";
          }, 1600);
        };
        var legacyCopy = function () {
          var ta = document.createElement("textarea");
          ta.value = code;
          ta.setAttribute("readonly", "");
          ta.style.position = "fixed";
          ta.style.top = "0";
          ta.style.left = "0";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          ta.setSelectionRange(0, 999999);
          var ok = false;
          try { ok = document.execCommand("copy"); } catch (e) {}
          document.body.removeChild(ta);
          return ok;
        };
        if (!code) return;
        if (!legacyCopy()) {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(code).then(flash).catch(flash);
          } else {
            flash();
          }
        } else {
          flash();
        }
      });
    });
  }

  // ===== اطلاعیه‌ها: تاریخ شمسی و دکمهٔ «نمایش بیشتر» =====
  function isoJalali(iso) {
    if (!iso) return "";
    var d = new Date(String(iso));
    if (isNaN(d.getTime())) return "";
    var j = g2j(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return faDigits(j.d) + " " + MONTHS[j.m - 1] + " " + faDigits(j.y);
  }
  document.querySelectorAll("[data-date]").forEach(function (el) {
    var s = isoJalali(el.getAttribute("data-date"));
    if (s) el.textContent = s;
  });

  // ===== اسلایدرها — کتابخانهٔ Swiper با تنظیمات real سایت eseminar.tv =====
  // فلش چپ ← : اسلاید بعدی (nextEl). فلش راست → : بازگشت به ابتدا (slideTo(0)).
  function wireReset(sw, btn) {
    if (!sw || !btn) return;
    function upd() {
      btn.classList.toggle("swiper-button-disabled", sw.activeIndex === 0);
    }
    sw.on("slideChange", upd);
    sw.on("slideChangeTransitionEnd", upd);
    sw.on("resize", upd);
    upd();
    btn.addEventListener("click", function () {
      sw.slideTo(0, 500, false);
      if (sw.autoplay && sw.autoplay.running) sw.autoplay.start();
    });
  }

  // وقتی اسلایدر به آخر رسید، دکمهٔ «مشاهده همه»/«همه دورهها» نئونی می‌شود.
  function wireEndGlow(sw, section) {
    if (!sw || !section) return;
    function upd() {
      section.classList.toggle("spn-end-glow", sw.isEnd);
    }
    sw.on("slideChange", upd);
    sw.on("slideChangeTransitionEnd", upd);
    sw.on("resize", upd);
    upd();
  }

  var coursesFrame = document.querySelector(".courses-frame");
  var coursesSwiper = null;
  if (coursesFrame && typeof Swiper !== "undefined") {
    coursesSwiper = new Swiper(coursesFrame.querySelector(".featured-slider-stage"), {
      slidesPerView: "auto",
      spaceBetween: 30,
      centeredSlides: false,
      autoplay: { delay: 5e3, disableOnInteraction: false },
      navigation: {
        nextEl: coursesFrame.querySelector(".swiper-button-prev")
      }
    });
    wireReset(coursesSwiper, coursesFrame.querySelector(".swiper-button-next"));
    wireEndGlow(coursesSwiper, coursesFrame.closest('.es-home-page-slide-show-container'));
  }

  var newsFrame = document.querySelector(".es-news-frame");
  var newsSwiper = null;
  if (newsFrame && typeof Swiper !== "undefined") {
    newsSwiper = new Swiper(newsFrame.querySelector(".es-main-page-slider-swiper-contianer"), {
      slidesPerView: "auto",
      spaceBetween: 16,
      autoplay: { delay: 5e3, disableOnInteraction: false },
      breakpoints: { 768: {}, 1024: {}, 1200: {} },
      navigation: {
        nextEl: newsFrame.querySelector(".swiper-button-prev")
      }
    });
    if (newsSwiper.autoplay) newsSwiper.autoplay.stop();
    wireReset(newsSwiper, newsFrame.querySelector(".swiper-button-next"));
    wireEndGlow(newsSwiper, newsFrame.closest('.es-news-section'));
  }

  // checkViewPortStatus — همان منطق سایت eseminar برای بخش اطلاعیه‌ها
  function newsCheckViewPort() {
    if (!newsSwiper || !newsFrame) return;
    var rect = newsFrame.getBoundingClientRect();
    var inView = rect.top < window.innerHeight && rect.bottom > 0 &&
      (window.innerHeight - rect.top) > 0.5 * rect.height;
    if (inView) {
      if (newsSwiper.autoplay && !newsSwiper.autoplay.running) newsSwiper.autoplay.start();
    } else if (window.scrollY > rect.bottom) {
      newsSwiper.slideTo(0, 1000, false);
    }
  }
  function newsDebounce(fn, wait) {
    var t = 0;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, wait);
    };
  }
  if (newsSwiper) {
    newsCheckViewPort();
    window.addEventListener("scroll", newsDebounce(newsCheckViewPort, 150), { passive: true });
  }

  initDiscounts();
  /* ============================================================
     اعلان‌ها — دکمهٔ زنگوله/دکمهٔ هیرو صرفاً کلید روشن/خاموش است
     اولین poll بعد از هر (فعال‌سازی/باز شدن صفحه) بی‌صدا «پایه» می‌گیرد؛
     فقط پیام‌هایی که بعد از آن در اطلاعیه/آموزش/تخفیف اضافه شوند،
     یک‌به‌یک (بدون تجمیع) نوتیف می‌گیرند.
     ============================================================ */
  /* ================= اعلان پس‌زمینه (Web Push) =================
     هنگام فعال‌سازی، مرورگر در سرور اعلان ثبت می‌شود؛ Worker هر ۲ دقیقه
     latest.json را چک می‌کند و فقط پیام‌های جدید را حتی وقتی سایت بسته است
     می‌فرستد. هنگام غیرفعال‌سازی، اشتراک لغو می‌شود تا دیگر پیامی نیاید. */
  var VAPID_PUBLIC_KEY = "BKiNVkyEdUYc70SDo_umdZsFVR408ECzHhQVUJep7RBddrQAjRWHmobowOtx5SOvN_W8BED3PTdNGIZjW5EMNGU";
  var NOTIF_API = "https://auth.semnanplatform.ir";

  function urlBase64ToUint8Array(b64) {
    var bin = atob(b64.replace(/-/g, "+").replace(/_/g, "/"));
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }

  function initNotifications() {
    var ON_KEY = "sp_notif_on";
    var SEEN_KEY = "sp_seen_items_v1";
    var supported = "Notification" in window;
    var pollTimer = null;
    var primed = false;
    var enabled = false;
    try { enabled = localStorage.getItem(ON_KEY) === "1"; } catch (_) {}

    function loadSeen() {
      try { return JSON.parse(localStorage.getItem(SEEN_KEY) || "[]"); } catch (_) { return []; }
    }
    function saveSeen(list) {
      try { localStorage.setItem(SEEN_KEY, JSON.stringify(list)); } catch (_) {}
    }
    var seen = loadSeen();

    var ON_LABEL = "غیرفعال کردن اعلان";
    var OFF_LABEL = "فعال کردن اعلان";

    function toast(msg) {
      var old = document.querySelector(".ntf-toast");
      if (old) old.remove();
      var t = document.createElement("div");
      t.className = "ntf-toast";
      t.textContent = msg;
      document.body.appendChild(t);
      requestAnimationFrame(function () { t.classList.add("show"); });
      setTimeout(function () {
        t.classList.remove("show");
        setTimeout(function () { t.remove(); }, 300);
      }, 3200);
    }

    function setUI() {
      document.querySelectorAll(".notif-bell").forEach(function (btn) {
        btn.classList.toggle("on", enabled);
        btn.setAttribute("aria-pressed", enabled ? "true" : "false");
        var lbl = btn.querySelector(".notif-label");
        if (lbl) lbl.textContent = enabled ? ON_LABEL : OFF_LABEL;
      });
    }

    function stopPolling() {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    }

    function fireNotification(it) {
      if (!enabled || Notification.permission !== "granted") return;
      var title;
      if (it.type === "course") title = "دوره‌ی آموزشی جدید 📚 " + (it.title || "");
      else if (it.type === "discount") title = "تخفیف جدید 🎁 " + (it.title || "");
      else title = "اطلاعیه‌ی جدید 📣 " + (it.title || "");
      var body = it.summary || "";
      if (it.type === "course" && it.teacher) body = it.teacher + (it.price ? " · " + it.price : "");
      if (it.type === "discount" && it.code) body = (body ? body + " — " : "") + "کد تخفیف: " + it.code;
      var n;
      try {
        n = new Notification(title, {
          body: body,
          icon: "assets/images/SVG/logo.svg",
          tag: "spn-" + it.id,
          data: { url: it.link || "/" }
        });
        n.onclick = function () {
          n.close();
          window.focus();
          if (it.link) window.location.href = it.link;
        };
      } catch (_) {}
    }

    function pollLatest() {
      fetch("/latest.json?ts=" + Date.now(), { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
        .then(function (data) {
          if (!data || !Array.isArray(data.items)) return;
          var current = data.items;
          console.log("[notif] pollLatest: primed=" + primed + " current=" + current.length + " seen=" + seen.length);
          if (!primed) {
            current.forEach(function (it) {
              if (seen.indexOf(it.id) === -1) seen.push(it.id);
            });
            if (seen.length > 400) seen = seen.slice(-400);
            saveSeen(seen);
            primed = true; // بی‌صدا پایه می‌گیرد؛ پخشِ پیام‌های قدیمی ممنوع
            return;
          }
          var changed = false;
          var newCount = 0;
          current.forEach(function (it) {
            if (seen.indexOf(it.id) !== -1) return;
            seen.push(it.id);
            changed = true;
            newCount++;
            console.log("[notif] NEW: " + it.id);
            fireNotification(it);
          });
          console.log("[notif] newCount=" + newCount + " changed=" + changed);
          if (changed) {
            if (seen.length > 400) seen = seen.slice(-400);
            saveSeen(seen);
          }
        })
        .catch(function () {});
    }

    function startPolling() {
      if (pollTimer) return;
      pollLatest();
      pollTimer = setInterval(pollLatest, 60e3);
    }

    function registerSW() {
      if (!("serviceWorker" in navigator)) return;
      navigator.serviceWorker.register("/sw.js").catch(function () {});
    }

    /* ثبت‌نام نزد سرور اعلان برای دریافت حتی با سایت بسته */
    function enablePush() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.log("[notif] enablePush: SW/PushManager unsupported");
        return;
      }
      console.log("[notif] enablePush: starting subscription");
      navigator.serviceWorker.register("/sw.js")
        .then(function (reg) {
          console.log("[notif] enablePush: sw active, reg has pushManager=" + (!!reg.pushManager));
          if (!reg.pushManager) throw new Error("no pushManager on reg");
          return reg.pushManager.getSubscription().then(function (sub) {
            console.log("[notif] enablePush: existing sub=" + (sub ? "yes" : "none"));
            if (sub) return sub;
            return reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            }).then(function (s) {
              console.log("[notif] enablePush: subscribed, endpoint=" + s.endpoint);
              return s;
            });
          });
        })
        .then(function (sub) {
          var keys = sub.toJSON().keys;
          return fetch(NOTIF_API + "/api/subscribe", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ subscription: { endpoint: sub.endpoint, keys: keys } })
          }).then(function (r) {
            console.log("[notif] enablePush: server response=" + r.status);
            return r;
          });
        })
        .catch(function (err) {
          console.log("[notif] enablePush ERROR: " + (err && err.message ? err.message : err));
        });
    }

    /* لغو اشتراک نزد سرور + مرورگر موقع غیرفعال کردن */
    function disablePush() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      navigator.serviceWorker.register("/sw.js")
        .then(function (reg) {
          return reg.pushManager.getSubscription().then(function (sub) {
            if (!sub) return;
            fetch(NOTIF_API + "/api/unsubscribe", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ endpoint: sub.endpoint })
            }).catch(function () {});
            return sub.unsubscribe();
          });
        })
        .catch(function (err) {
          console.log("[notif] disablePush error: " + (err && err.message ? err.message : err));
        });
    }

    function enable() {
      if (!supported) { toast("مرورگر شما از اعلان پشتیبانی نمی‌کند"); return; }
      console.log("[notif] enable() called, permission=" + Notification.permission);
      var cont = function () {
        enabled = true;
        primed = false;
        try { localStorage.setItem(ON_KEY, "1"); } catch (_) {}
        registerSW();
        startPolling();
        enablePush();
        setUI();
        toast("اعلان‌ها فعال شد ✓ — فقط برای پیام جدید اطلاع می‌دهد");
      };
      if (Notification.permission === "granted") { cont(); return; }
      if (Notification.permission === "denied") {
        toast("اجازه‌ی اعلان مسدود شده — در تنظیمات مرورگر اجازه دهید");
        return;
      }
      Notification.requestPermission().then(function (perm) {
        if (perm === "granted") cont();
        else toast("برای فعال شدن اعلان، اجازه را در مرورگر بدهید");
      });
    }

    function disable() {
      enabled = false;
      primed = false;
      try { localStorage.setItem(ON_KEY, "0"); } catch (_) {}
      stopPolling();
      disablePush();
      setUI();
      toast("اعلان‌ها غیرفعال شد");
    }

    document.querySelectorAll(".notif-bell").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (enabled) disable(); else enable();
      });
    });

    setUI();
    console.log("[notif] init: enabled=" + enabled + " perm=" + Notification.permission);
    if (enabled && supported && Notification.permission === "granted") startPolling();
  }

  initNotifications();

  /* جستجوی سراسری: جستجو در تیترها و هشتگ‌ها */
  function initSiteSearch() {
    var root = document.querySelector(".site-search");
    if (!root) return;
    var toggle = document.querySelector(".nav-search");
    var input = root.querySelector(".site-search-input");
    var clearBtn = root.querySelector(".site-search-clear");
    var closeBtn = root.querySelector(".site-search-close");
    var results = root.querySelector("[data-sr]");
    var empty = root.querySelector("[data-se]");
    var indexUrl = root.getAttribute("data-index") || "search-index.json";
    var linkBase = indexUrl.replace(/[^/]*$/, "");
    var store = { items: [] };
    var loading = false;
    var pending = [];

    function escHtml(s) {
      return String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }
    function normalize(s) {
      return String(s || "").toLowerCase().replace(/^#+/, "").replace(/[\u200c\u200b]/g, "").replace(/\s+/g, " ").trim();
    }
    function selectToEnd() {
      try { input.setSelectionRange(input.value.length, input.value.length); } catch (_) {}
    }
    function absUrl(u) {
      var s = String(u || "");
      if (/^(https?:)?\/\//i.test(s)) return s;
      if (s.charAt(0) === "/" || s.charAt(0) === "#" || s.charAt(0) === ".") return s;
      return linkBase + s;
    }
    function open(term) {
      root.hidden = false;
      document.body.classList.add("has-search");
      if (term) {
        input.value = term.replace(/^#/, "");
        run();
      }
      input.focus();
      selectToEnd();
    }
    function close() {
      root.hidden = true;
      document.body.classList.remove("has-search");
    }
    function load(cb) {
      if (store.items.length) return cb();
      if (loading) { pending.push(cb); return; }
      loading = true;
      var done = function () {
        loading = false;
        cb();
        pending.splice(0).forEach(function (f) { f(); });
      };
      fetch(indexUrl)
        .then(function (r) { return r.json(); })
        .then(function (data) { store.items = (data && data.items) || []; done(); })
        .catch(function () { done(); });
    }
    function run() {
      var q = normalize(input.value);
      if (!q) {
        results.innerHTML = "";
        empty.hidden = true;
        return;
      }
      load(function () {
        var hits = store.items.filter(function (it) {
          if (normalize(it.t).indexOf(q) !== -1) return true;
          return (it.h || []).some(function (h) { return normalize(h).indexOf(q) !== -1; });
        }).slice(0, 12);
        if (!hits.length) {
          results.innerHTML = "";
          empty.hidden = false;
          return;
        }
        empty.hidden = true;
        results.innerHTML = hits.map(function (it) {
          var slow = String(it.t || "");
          var at = slow.toLowerCase().indexOf(q);
          var title = at !== -1
            ? escHtml(slow.slice(0, at)) + "<mark>" + escHtml(slow.slice(at, at + q.length)) + "</mark>" + escHtml(slow.slice(at + q.length))
            : escHtml(slow);
          var tagHtml = (it.h || []).slice(0, 5).map(function (h) {
            return '<span class="sr-tag">#' + escHtml(h) + "</span>";
          }).join("");
          return '<a class="sr-item" href="' + absUrl(it.u) + '"><span class="sr-kind">' + escHtml(it.k) + "</span>" +
            '<span class="sr-txt"><b>' + title + "</b>" + (tagHtml ? '<span class="sr-tags">' + tagHtml + "</span>" : "") + "</span></a>";
        }).join("");
      });
    }

    if (toggle) toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      open("");
    });
    if (clearBtn) clearBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      input.value = "";
      results.innerHTML = "";
      empty.hidden = true;
      input.focus();
    });
    if (closeBtn) closeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      close();
    });
    if (input) {
      input.addEventListener("input", run);
      input.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { close(); return; }
        if (e.key === "Enter") {
          e.preventDefault();
          var first = results.querySelector("a");
          if (first) location.href = first.getAttribute("href");
        }
      });
    }
    document.addEventListener("click", function (e) {
      if (!root.hidden && !root.contains(e.target) && !(toggle && toggle.contains(e.target))) close();
    });
    /* باز شدن جستجو از چیپ‌های هشتگ (#…) */
    document.addEventListener("click", function (e) {
      var el = e.target.closest("[data-search]");
      if (!el) return;
      e.preventDefault();
      open(el.getAttribute("data-search") || "");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !root.hidden) close();
    });
    window.__openSearch = function (term) { open(term || ""); };
  }

  initSiteSearch();
})();