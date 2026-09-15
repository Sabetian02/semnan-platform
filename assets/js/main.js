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
     اعلان‌ها — نوتیف مرورگر برای اطلاعیه‌ها و دوره‌های جدید
     (سایت استاتیک بدون سرور: تا وقتی صفحه باز است هر ۶۰ ثانیه
      latest.json چک می‌شود و مطلب تازه -> نوتیف نمایش داده می‌شود)
     ============================================================ */
  function initNotifications() {
    var supported = "Notification" in window;
    var SEEN_KEY = "sp_seen_items_v1";
    var UNREAD_KEY = "sp_unread_items_v1";

    function loadJSON(key) {
      try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch (_) { return []; }
    }
    function saveJSON(key, list) {
      try { localStorage.setItem(key, JSON.stringify(list)); } catch (_) {}
    }

    var seen = loadJSON(SEEN_KEY);
    var unread = loadJSON(UNREAD_KEY);
    var pollTimer = null;
    var bell = document.querySelector(".nav-bell");
    var pop = null;

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

    function fireNotification(it) {
      if (Notification.permission !== "granted") return;
      var title = (it.type === "course" ? "دورهٔ جدید 📚 " : "اطلاعیهٔ جدید 📣 ") + (it.title || "");
      var body = it.summary || (it.type === "course" ? it.teacher + " · " + it.price : "");
      var n;
      try {
        n = new Notification(title, {
          body: body,
          icon: "assets/images/SVG/logo.svg",
          tag: "sp-" + it.id,
          data: { url: it.link || "/" }
        });
        n.onclick = function () {
          n.close();
          window.focus();
          if (it.link) window.location.href = it.link;
        };
      } catch (_) {}
    }

    function updateBell() {
      if (!bell) return;
      var dot = bell.querySelector(".nav-bell-dot");
      var count = unread.length;
      if (dot) {
        dot.textContent = count > 9 ? "۹+" : String(count);
        dot.hidden = count === 0;
      }
      bell.classList.toggle("on", Notification.permission === "granted");
    }

    function renderPop() {
      if (!bell) { updateBell(); return; }
      closePop();
      pop = document.createElement("div");
      pop.className = "notif-pop";
      var head = document.createElement("div");
      head.className = "notif-pop-head";
      head.textContent = unread.length ? "اعلان‌های جدید" : "اعلان‌ها";
      pop.appendChild(head);
      var list = document.createElement("div");
      list.className = "notif-pop-list";
      if (unread.length) {
        unread.forEach(function (it) {
          var a = document.createElement("a");
          a.href = it.link || "/";
          var t = document.createElement("b");
          t.textContent = it.title;
          var s = document.createElement("span");
          s.textContent = it.type === "course" ? "دورهٔ آموزشی" : "اطلاعیه";
          a.appendChild(t);
          a.appendChild(s);
          a.addEventListener("click", function () {
            unread = unread.filter(function (u) { return u.id !== it.id; });
            saveJSON(UNREAD_KEY, unread);
            updateBell();
          });
          list.appendChild(a);
        });
      } else {
        var e = document.createElement("div");
        e.className = "notif-pop-empty";
        e.textContent = Notification.permission === "granted" ? "مورد جدیدی نیست" : "برای فعال کردن اعلان، روی زنگوله بزن";
        list.appendChild(e);
      }
      pop.appendChild(list);
      if (unread.length) {
        var foot = document.createElement("div");
        foot.className = "notif-pop-foot";
        var clear = document.createElement("button");
        clear.type = "button";
        clear.textContent = "پاک کردن همه";
        clear.addEventListener("click", function () {
          unread = [];
          saveJSON(UNREAD_KEY, unread);
          updateBell();
          renderPop();
        });
        foot.appendChild(clear);
        pop.appendChild(foot);
      }
      document.body.appendChild(pop);
      var r = bell.getBoundingClientRect();
      pop.style.top = (r.bottom + 8) + "px";
      pop.style.right = (window.innerWidth - r.right) + "px";
      pop.classList.add("show");
    }

    function closePop() {
      if (pop) { pop.remove(); pop = null; }
      if (bell) bell.setAttribute("aria-expanded", "false");
    }
    function togglePop() {
      if (pop) { closePop(); return; }
      renderPop();
      if (bell) bell.setAttribute("aria-expanded", "true");
    }

    document.addEventListener("click", function (e) {
      if (pop && e.target.closest && !e.target.closest(".notif-pop, .nav-bell, .mm-notif")) closePop();
    });
    window.addEventListener("scroll", closePop, { passive: true });
    window.addEventListener("resize", closePop);

    function startPolling() {
      if (pollTimer) return;
      pollLatest();
      pollTimer = setInterval(pollLatest, 60e3);
    }

    function pollLatest() {
      fetch("/latest.json?ts=" + Date.now(), { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
        .then(function (data) {
          if (!data || !Array.isArray(data.items)) return;
          data.items.forEach(function (it) {
            var id = it.id;
            if (seen.indexOf(id) !== -1) return;
            seen.push(id);
            unread.push({ id: id, title: it.title || "", link: it.link || "/", type: it.type || "" });
            fireNotification(it);
          });
          if (seen.length > 400) seen = seen.slice(-400);
          saveJSON(SEEN_KEY, seen);
          if (unread.length > 30) unread = unread.slice(-30);
          saveJSON(UNREAD_KEY, unread);
          updateBell();
        })
        .catch(function () {});
    }

    function registerSW() {
      if (!("serviceWorker" in navigator)) return;
      navigator.serviceWorker.register("/sw.js").catch(function () {});
    }

    function requestEnable() {
      if (!supported) { toast("مرورگر شما از اعلان پشتیبانی نمی‌کند"); return; }
      if (Notification.permission === "denied") {
        toast("اجازهٔ اعلان از طرف مرورگر رد شده — در تنظیمات مرورگر اجازه بده");
        return;
      }
      if (Notification.permission === "granted") {
        toast("اعلان‌ها فعال است — برای مطالب جدید خبر می‌گیری");
        startPolling();
        updateBell();
        return;
      }
      Notification.requestPermission().then(function (perm) {
        if (perm === "granted") {
          registerSW();
          startPolling();
          toast("اعلان‌ها فعال شد ✓");
        } else {
          toast("برای فعال شدن اعلان، اجازه را در مرورگر بده");
        }
        updateBell();
      });
    }

    document.querySelectorAll(".notif-bell").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (btn.classList.contains("nav-bell")) {
          requestEnable();
          if (Notification.permission === "granted") togglePop();
          return;
        }
        requestEnable();
      });
    });

    if (bell) {
      var label = bell.querySelector(".notif-label");
      if (Notification.permission === "granted") {
        if (label) label.textContent = "اعلان‌ها فعال شد";
        startPolling();
      }
      updateBell();
    }

    /* به‌روزرسانی لیبل دکمهٔ هیرو بعد از فعال بودن */
    var heroLabel = document.querySelector(".btn-notif .notif-label");
    if (heroLabel && Notification.permission === "granted") heroLabel.textContent = "اعلان‌ها فعال شد";
  }

  initNotifications();
})();