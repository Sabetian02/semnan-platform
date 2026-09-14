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
})();