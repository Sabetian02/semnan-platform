/* پلتفرم دانشگاه سمنان — رفتار صفحهٔ اطلاعیه (ettelaieh/*)
   نوار مطالعه، فهرست مطالب چسبان، گالری، ویدیو، شمارش معکوس، اشتراک‌گذاری */
(function () {
  "use strict";

  var FA = function (n) {
    return String(n).replace(/[0-9]/g, function (d) {
      return "۰۱۲۳۴۵۶۷۸۹"[+d];
    });
  };
  var pad = function (n) {
    return n < 10 ? "0" + n : String(n);
  };

  /* ---------- توست ---------- */
  var toastEl = document.querySelector("[data-ap-toast]");
  var toastTimer = null;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.hidden = true;
    }, 2200);
  }

  /* ---------- کپی در کلیپ‌بورد ---------- */
  function copy(text) {
    var done = function () {
      toast("نشانی اطلاعیه کپی شد ✓");
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {
        legacyCopy(text, done);
      });
      return;
    }
    legacyCopy(text, done);
  }
  function legacyCopy(text, done) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      done();
    } catch (e) {
      toast("کپی نشد — دستی نشانی را بردارید");
    }
    document.body.removeChild(ta);
  }

  /* ---------- نوار مطالعه ---------- */
  var bar = document.querySelector("[data-ap-progress]");
  var article = document.querySelector(".ap-main");
  function onScroll() {
    if (bar && article) {
      var start = article.offsetTop - 120;
      var span = article.offsetHeight;
      var p = span > 0 ? (window.scrollY - start) / span : 0;
      p = Math.max(0, Math.min(1, p));
      bar.style.inlineSize = (p * 100).toFixed(2) + "%";
    }
    if (topBtn) topBtn.classList.toggle("is-on", window.scrollY > 700);
  }

  /* ---------- دکمهٔ بازگشت به بالا ---------- */
  var topBtn = document.querySelector(".ap-top");
  Array.prototype.forEach.call(document.querySelectorAll("[data-ap-top]"), function (b) {
    b.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  /* ---------- فهرست مطالب: ردیابی بخش فعال ---------- */
  var tocNav = document.querySelector("[data-ap-toc]");
  var tocBar = document.querySelector("[data-ap-toc-progress]");
  var tocLinks = tocNav
    ? Array.prototype.slice.call(tocNav.querySelectorAll("[data-ap-toc-link]"))
    : [];
  var tocTargets = tocLinks
    .map(function (a) {
      var id = (a.getAttribute("href") || "").replace("#", "");
      var el = id ? document.getElementById(id) : null;
      return el ? { link: a, el: el } : null;
    })
    .filter(Boolean);

  function syncToc() {
    if (!tocTargets.length) return;
    var offset = 130;
    var current = tocTargets[0];
    tocTargets.forEach(function (t) {
      if (t.el.getBoundingClientRect().top - offset <= 0) current = t;
    });
    tocTargets.forEach(function (t) {
      t.link.classList.toggle("is-active", t === current);
    });
    if (tocBar) {
      var article = document.querySelector(".ap-main");
      if (article) {
        var p = (window.scrollY - (article.offsetTop - 140)) / Math.max(1, article.offsetHeight);
        tocBar.style.inlineSize = (Math.max(0, Math.min(1, p)) * 100).toFixed(1) + "%";
      }
    }
  }

  /* ---------- گالری و کاور: لایت‌باکس ---------- */
  var lb = document.querySelector("[data-ap-lightbox]");
  var lbImg = lb ? lb.querySelector("[data-ap-lb-img]") : null;
  var lbCap = lb ? lb.querySelector("[data-ap-lb-cap]") : null;
  var lbCount = lb ? lb.querySelector("[data-ap-lb-count]") : null;
  var group = [];
  var gi = 0;

  function showAt(i) {
    if (!group.length) return;
    gi = (i + group.length) % group.length;
    var item = group[gi];
    lbImg.src = item.src;
    lbImg.alt = item.cap || "";
    if (item.cap) {
      lbCap.textContent = item.cap;
      lbCap.hidden = false;
    } else {
      lbCap.hidden = true;
    }
    if (lbCount) lbCount.textContent = FA(gi + 1) + " از " + FA(group.length);
  }
  function openLb(items, index) {
    group = items;
    lb.hidden = false;
    document.documentElement.style.overflow = "hidden";
    showAt(index);
    var closeBtn = lb.querySelector("[data-ap-lb-close]");
    if (closeBtn) closeBtn.focus();
  }
  function closeLb() {
    lb.hidden = true;
    lbImg.removeAttribute("src");
    document.documentElement.style.overflow = "";
  }
  if (lb) {
    Array.prototype.forEach.call(document.querySelectorAll("[data-ap-gal]"), function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-ap-gal");
        var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-ap-gal="' + key + '"]'));
        var items = nodes.map(function (n) {
          return { src: n.getAttribute("data-src"), cap: n.getAttribute("data-cap") || "" };
        });
        openLb(items, nodes.indexOf(btn));
      });
    });
    var cl = lb.querySelector("[data-ap-lb-close]");
    var pv = lb.querySelector("[data-ap-lb-prev]");
    var nx = lb.querySelector("[data-ap-lb-next]");
    if (cl) cl.addEventListener("click", closeLb);
    if (pv) pv.addEventListener("click", function () { showAt(gi - 1); });
    if (nx) nx.addEventListener("click", function () { showAt(gi + 1); });
    lb.addEventListener("click", function (e) {
      if (e.target === lb) closeLb();
    });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") closeLb();
      if (e.key === "ArrowLeft") showAt(gi + 1);
      if (e.key === "ArrowRight") showAt(gi - 1);
    });
  }

  /* ---------- ویدیو: بارگذاری فقط با کلیک ---------- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-ap-video]"), function (wrap) {
    var btn = wrap.querySelector("[data-ap-video-btn]");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var src = wrap.getAttribute("data-src");
      var allow = wrap.getAttribute("data-allow") || "";
      var fr = document.createElement("iframe");
      fr.src = src + (src.indexOf("?") >= 0 ? "&" : "?") + "autoplay=1";
      fr.setAttribute("allow", allow + "; autoplay; fullscreen");
      fr.setAttribute("allowfullscreen", "");
      fr.setAttribute("title", wrap.getAttribute("data-title") || "ویدیو");
      fr.setAttribute("loading", "lazy");
      wrap.classList.add("is-playing");
      wrap.innerHTML = "";
      wrap.appendChild(fr);
    });
  });

  /* ---------- اشتراک‌گذاری، کپی، چاپ ---------- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-ap-copy]"), function (b) {
    b.addEventListener("click", function () {
      copy(b.getAttribute("data-ap-copy"));
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-ap-native]"), function (b) {
    b.addEventListener("click", function () {
      var url = b.getAttribute("data-ap-url");
      var title = b.getAttribute("data-ap-title") || document.title;
      if (navigator.share) {
        navigator.share({ title: title, url: url }).catch(function () {});
      } else {
        copy(url);
      }
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-ap-print]"), function (b) {
    b.addEventListener("click", function () {
      window.print();
    });
  });

  /* ---------- شمارش معکوس رویداد ---------- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-ap-countdown]"), function (box) {
    var until = Date.parse(box.getAttribute("data-until") || "");
    if (isNaN(until)) return;
    var out = function (k) {
      return box.querySelector('[data-ap-cd="' + k + '"]');
    };
    var els = { d: out("d"), h: out("h"), m: out("m"), s: out("s") };
    function tick() {
      var diff = until - Date.now();
      if (diff <= 0) {
        if (els.d) els.d.textContent = FA(0);
        if (els.h) els.h.textContent = FA(0);
        if (els.m) els.m.textContent = FA(0);
        if (els.s) els.s.textContent = FA(0);
        return;
      }
      var s = Math.floor(diff / 1000);
      if (els.d) els.d.textContent = FA(Math.floor(s / 86400));
      if (els.h) els.h.textContent = FA(pad(Math.floor((s % 86400) / 3600)));
      if (els.m) els.m.textContent = FA(pad(Math.floor((s % 3600) / 60)));
      if (els.s) els.s.textContent = FA(pad(s % 60));
    }
    tick();
    setInterval(tick, 1000);
  });

  /* ---------- پیوند فهرست/جستجو با پارامتر آدرس ---------- */
  /* کاری که در صفحهٔ فهرست انجام می‌شود در main.js است؛ این‌جا فقط لنگرها را
     نرم‌تر می‌کنیم تا پرش ناگهانی نباشد. */
  Array.prototype.forEach.call(document.querySelectorAll('.ap-toc a[href^="#"]'), function (a) {
    a.addEventListener("click", function (e) {
      var el = document.getElementById(a.getAttribute("href").slice(1));
      if (!el) return;
      e.preventDefault();
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 110, behavior: "smooth" });
    });
  });

  /* ---------- راه‌اندازی ---------- */
  if (tocTargets.length || bar || topBtn) {
    window.addEventListener("scroll", function () {
      onScroll();
      syncToc();
    }, { passive: true });
    window.addEventListener("resize", syncToc, { passive: true });
    onScroll();
    syncToc();
  }
})();
