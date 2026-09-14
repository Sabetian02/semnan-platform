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
        if (expText) expText.innerHTML = "<b>منقضی شده</b> — این تخفیف دیگر معتبر نیست";
        if (barFill) { barFill.style.width = "100%"; barFill.style.background = "linear-gradient(90deg,#e0392e,#c2291f)"; }
        card.classList.add("dc-expired");
        return;
      }

      if (permanent) {
        if (statusEl) { statusEl.textContent = "همیشگی"; statusEl.style.background = "linear-gradient(90deg,#3776e2,#102A71)"; statusEl.style.border = "none"; }
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
          if (expText) expText.innerHTML = "<b>منقضی شده</b> — این تخفیف دیگر معتبر نیست";
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
      } else if (card.getAttribute("data-exp-text")) {
        expText.textContent = "تا " + card.getAttribute("data-exp-text");
        if (statusEl) { statusEl.textContent = "فعال"; statusEl.style.background = "linear-gradient(90deg,#4cc878,#2f9e5a)"; statusEl.style.border = "none"; }
      }
    });

    // کپی کد تخفیف
    document.querySelectorAll(".dc-copy").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var code = btn.getAttribute("data-code") || "";
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
        if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
          navigator.clipboard.writeText(code).then(flash, function () { legacyCopy(); flash(); });
        } else {
          legacyCopy();
          flash();
        }
      });
    });
  }

  initDiscounts();
})();