/*
 * قالب حرفه‌ای صفحهٔ اطلاعیه (پوشهٔ ettelaieh/)
 * ------------------------------------------------------------------
 * هر اطلاعیه یک صفحهٔ کامل و مستقل است: هیرو، کاور با ابعاد طبیعی خود تصویر،
 * بلوک‌های محتواییِ قابل‌چینش از داشبورد، نوار کنارِ چسبان، اشتراک‌گذاری،
 * رویداد و شمارش معکوس، گالری، ویدیو، فایل‌های پیوست، فرم گوگل، پرسش‌های
 * پرتکرار، اطلاعیه‌های مرتبط و داده‌های ساخت‌یافتهٔ سئو (OG + JSON-LD).
 *
 * این ماژول از index-build.js صدا زده می‌شود و ابزارهای مشترک را به‌صورت ctx
 * می‌گیرد تا کد ساخت‌وساز تکرار نشود.
 */
const fs = require("fs");
const path = require("path");
const { imageSize, fileSize, fileKind, videoEmbed, formEmbed, mapEmbed } = require("./lib/media");
const { orgLogo } = require("./org");

const SITE_URL = "https://semnanplatform.ir";
const MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const WEEKDAYS = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];
const CAT_EMOJI = { "دوره": "🎓", "رویداد": "🗓", "فراخوان": "📣", "اطلاع‌رسانی": "✉", "جدید": "✨", "خبر": "📰", "تخفیف": "🎟" };

/* آیکن‌های درون‌خطی — سبک خطی، هم‌خانوادهٔ بقیهٔ سایت */
const I = {
  arrow: '<path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>',
  chev: '<path d="M15 18l-6-6 6-6"/>',
  chevDown: '<path d="M6 9l6 6 6-6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  pin: '<path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5.5a3.2 3.2 0 0 1 0 6.4M21.5 20a6.5 6.5 0 0 0-4.5-6.1"/>',
  tag: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0l-7-7A2 2 0 0 1 3 12.2V5a2 2 0 0 1 2-2h7.2a2 2 0 0 1 1.4.6l7 7a2 2 0 0 1 0 2.8z"/><circle cx="7.8" cy="7.8" r="1.4"/>',
  share: '<circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="M8.5 10.9l7-4.3M8.5 13.1l7 4.3"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.6.6l2-2A5 5 0 0 0 12.6 4.6l-1 1"/><path d="M14 11a5 5 0 0 0-7.6-.6l-2 2A5 5 0 0 0 11.4 19.4l1-1"/>',
  print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 15h12v6H6z"/>',
  download: '<path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M4 20h16"/>',
  play: '<path d="M8 5.6v12.8L19 12z"/>',
  check: '<path d="M4 12.5l5 5L20 6.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  warn: '<path d="M12 3.5l9.4 16.5H2.6z"/><path d="M12 9.5v4.5M12 17h.01"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.6"/><path d="M21 16l-5-5-9 9"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  top: '<path d="M12 19V5"/><path d="M5 12l7-7 7 7"/>',
  quote: '<path d="M9.5 6.5C6.5 7.5 5 9.8 5 13v4.5h5V12H7.8c.1-1.6.8-2.7 2.4-3.4zM19 6.5c-3 1-4.5 3.3-4.5 6.5v4.5h5V12h-2.2c.1-1.6.8-2.7 2.4-3.4z"/>',
  edit: '<path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17z"/><path d="M14 6.5l3.5 3.5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.4 9.4a2.6 2.6 0 1 1 3.3 2.5c-.7.3-.7 1-.7 1.6M12 17h.01"/>',
  chart: '<path d="M4 20V9M10 20V4M16 20v-6M22 20H2"/>',
  minus: '<path d="M5 12h14"/>',
  money: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 12h.01M18 12h.01"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5 9-5Z"/><path d="M3 13l9 5 9-5"/><path d="M3 17l9 5 9-5"/>',
  monitor: '<rect x="2.5" y="4" width="19" height="12.5" rx="2"/><path d="M8 20.5h8M12 16.5v4"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.4 2.1L8 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5 12 13l8.5-6.5"/>',
  bolt: '<path d="M13 2L4.5 13H11l-1 9 8.5-11H12z"/>',
  telegram: '<path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L6.74 13.3 2.64 12c-.88-.25-.89-.86.2-1.3L20.03 4.7c.73-.33 1.43.18 1.15 1.3l-3.7 17.42c-.25 1.16-.95 1.44-1.92.9l-5.29-3.9-2.55 2.2c-.29.28-.53.46-1.1.46l.32-4.9z"/>',
  whatsapp: '<path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.5L3.5 20.5l1.4-4.3A8.5 8.5 0 1 1 20.5 11.6z"/><path d="M8.8 8.2c-.3.6-.4 1.4-.1 2.3a7 7 0 0 0 4.8 4.5c.9.3 1.7.2 2.3-.2"/>',
  xmark: '<path d="M4.5 4.5l15 15M19.5 4.5l-15 15"/>',
  map: '<path d="M9 3.5L3.5 6v14.5L9 18l6 2.5 5.5-2.5V3.5L15 6z"/><path d="M9 3.5V18M15 6v14.5"/>'
};
const ico = (name, cls) =>
  `<svg class="${cls || "ap-i"}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${I[name] || I.spark}</svg>`;
const icoFill = (name, cls) =>
  `<svg class="${cls || "ap-i"}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">${I[name] || I.spark}</svg>`;

module.exports = function createAnnRenderer(ctx) {
  const {
    esc,
    escA,
    faNum,
    ROOT,
    site,
    TELE_URL = "",
    pickImage,
    safeLink,
    ABS_URI,
    LOCAL_LINK,
    renderHeaderN,
    renderFooterN,
    mdParse,
    allNews = [],
    allCourses = [],
    kanonhaList = [],
    anjomanhaList = [],
    newsOrg,
    newsOrgs,
    tgHref,
    assetVer = "",
    ads = null
  } = ctx;

  const BRAND = site.brand_name || "پلتفرم دانشگاه سمنان";
  const now = Date.now();

  /* بنرهای تبلیغاتی مشترک — از ads در content/ads.json (بخش «تبلیغات» داشبورد) */
  function adsMarkup(a) {
    if (!a) return "";
    const bs = a.banner_size;
    const w = Number(bs && bs.width) || 388;
    const h = Number(bs && bs.height) || 100;
    const ratio = w > 0 && h > 0 ? `aspect-ratio: ${w} / ${h}` : "";
    const slots = [];
    const s1 = a.slot1;
    const s2 = a.slot2;
    if (s1 && s1.image && s1.active !== false) {
      slots.push(`<a class="ap-ad"${ratio ? ` style="${ratio}"` : ""} href="${escA(tgHref(s1.link || "#"))}" target="_blank" rel="noopener"><img class="ap-ad-img" src="${escA(s1.image)}" alt="" loading="lazy"></a>`);
    }
    if (s2 && s2.image && s2.active !== false) {
      slots.push(`<a class="ap-ad"${ratio ? ` style="${ratio}"` : ""} href="${escA(tgHref(s2.link || "#"))}" target="_blank" rel="noopener"><img class="ap-ad-img" src="${escA(s2.image)}" alt="" loading="lazy"></a>`);
    }
    if (!slots.length) return "";
    return slots.join("\n        ");
  }

  /* =============== ابزارهای تاریخ — همه بر پایهٔ وقت تهران =============== */
  function tehranParts(iso) {
    const d = iso instanceof Date ? iso : new Date(String(iso || ""));
    if (isNaN(d.getTime())) return null;
    let parts;
    try {
      parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Tehran",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        weekday: "short"
      }).formatToParts(d);
    } catch (_) {
      return {
        y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(),
        h: d.getHours(), min: d.getMinutes(), wd: d.getDay(), date: d
      };
    }
    const o = {};
    parts.forEach((p) => (o[p.type] = p.value));
    const wdMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return {
      y: +o.year,
      m: +o.month,
      d: +o.day,
      h: +o.hour % 24,
      min: +o.minute,
      wd: wdMap[o.weekday] == null ? d.getUTCDay() : wdMap[o.weekday],
      date: d
    };
  }

  /* میلادی → شمسی (الگوریتم استاندارد jalaali — همان منطق main.js) */
  function g2j(gy, gm, gd) {
    const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy = 979;
    gy -= 1600;
    const gy2 = gm > 2 ? gy + 1 : gy;
    let days =
      365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) +
      Math.floor((gy2 + 399) / 400) - 80 + gd + gdm[gm - 1];
    jy += 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    jy += Math.floor((days - 1) / 365);
    if (days > 365) days = (days - 1) % 365;
    const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
    const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
    return { y: jy, m: jm, d: jd };
  }

  const fa = (n) => faNum(n);
  function faDate(iso, withWeekday) {
    const p = tehranParts(iso);
    if (!p) return "";
    const j = g2j(p.y, p.m, p.d);
    const base = fa(j.d) + " " + MONTHS[j.m - 1] + " " + fa(j.y);
    return (withWeekday ? WEEKDAYS[p.wd] + "، " : "") + base;
  }
  function faTime(iso) {
    const p = tehranParts(iso);
    if (!p) return "";
    return fa(String(p.h).padStart(2, "0")) + ":" + fa(String(p.min).padStart(2, "0"));
  }
  function faDateTime(iso, withWeekday) {
    const p = tehranParts(iso);
    if (!p) return "";
    return faDate(iso, withWeekday) + " — ساعت " + faTime(iso);
  }
  const ms = (x) => {
    const p = tehranParts(x);
    return p ? p.date.getTime() : 0;
  };

  /* شمارهٔ تلفن: ارقام فارسی/عربی به لاتین تبدیل می‌شوند تا لینک tel: خالی نماند */
  const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
  const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
  function telHref(raw) {
    const ascii = String(raw || "").replace(/[۰-۹٠-٩]/g, (ch) => {
      const i = FA_DIGITS.indexOf(ch);
      if (i >= 0) return String(i);
      const j = AR_DIGITS.indexOf(ch);
      return j >= 0 ? String(j) : ch;
    });
    return ascii.replace(/[^\d+]/g, "");
  }

  /* =============== تصویر: آدرس، ابعاد طبیعی و کلاس چیدمان =============== */
  function srcUrl(src, prefix) {
    const s = String(src || "").trim();
    if (!s) return "";
    if (ABS_URI.test(s)) return s;
    return encodeURI(prefix + s.replace(/^\.\//, ""));
  }
  function dims(src) {
    const s = String(src || "").trim();
    if (!s || ABS_URI.test(s)) return null;
    const d = imageSize(path.join(ROOT, s.replace(/^\.\//, "")));
    /* مقادیر اعشاری (مثل SVG) در attribute های HTML گرد می‌شوند */
    return d && d.w && d.h ? { w: Math.round(d.w), h: Math.round(d.h) } : null;
  }
  /* تصویر با نسبت ابعاد واقعی خودش — width/height برای جلوگیری از پرش چیدمان (CLS) */
  function figImg(src, prefix, alt, cls, eager) {
    const url = srcUrl(src, prefix);
    if (!url) return "";
    const d = dims(src);
    const attrs = d && d.w && d.h ? ` width="${d.w}" height="${d.h}"` : "";
    const shape = d && d.w && d.h ? (d.h > d.w * 1.15 ? " is-tall" : d.w > d.h * 1.6 ? " is-wide" : "") : "";
    return `<img${cls ? ` class="${cls}${shape}"` : shape ? ` class="${shape.trim()}"` : ""} src="${escA(url)}" alt="${escA(alt)}"${attrs} loading="${eager ? "eager" : "lazy"}" decoding="async">`;
  }

  /* =============== تشکل‌های مرجع و لینک‌ها =============== */
  function orgFor(n) {
    if (typeof newsOrgs === "function") {
      return newsOrgs(n, kanonhaList, anjomanhaList).map((o) => {
        const all = o.base === "kanonha" ? kanonhaList : anjomanhaList;
        const item = (all || []).find((x) => x && x.slug === o.slug) || null;
        return { ...o, item, href: "../" + o.base + "/" + encodeURI(o.slug) + ".html" };
      });
    }
    const o = typeof newsOrg === "function" ? newsOrg(n, kanonhaList, anjomanhaList) : null;
    if (!o) return [];
    const all = o.base === "kanonha" ? kanonhaList : anjomanhaList;
    const item = all.find((x) => x && x.slug === o.slug) || null;
    return [{ ...o, item, href: "../" + o.base + "/" + encodeURI(o.slug) + ".html" }];
  }
  /* لینک امن و داخلی/بیرونی‌شده برای دکمه‌ها */
  function ctaHref(link) {
    const s = String(link || "").trim();
    if (!s) return "";
    if (ABS_URI.test(s)) return tgHref(s);
    if (!LOCAL_LINK.test(s)) return "";
    const clean = s.replace(/^\.\//, "").replace(/^\//, "");
    const file = clean.split(/[?#]/)[0];
    if (file && !fs.existsSync(path.join(ROOT, file))) return "";
    return "../" + clean;
  }
  function ctaList(n) {
    const out = [];
    (Array.isArray(n.cta) ? n.cta : []).forEach((c) => {
      const href = ctaHref(c && c.link);
      if (href && String(c.label || "").trim()) {
        out.push({
          label: String(c.label).trim(),
          href: c && c.icon === "telegram" ? tgHref(href) : href,
          style: ["gold", "navy", "ghost", "tele", "light"].indexOf(c.style) >= 0 ? c.style : "navy",
          external: ABS_URI.test(href),
          ico: c.icon || ""
        });
      }
    });
    return out;
  }
  const ev = (n) => (n && n.event && typeof n.event === "object" ? n.event : null);
  function statusOf(n) {
    const e = ev(n);
    if (!e) return null;
    const start = ms(e.start || n.date);
    const end = e.end ? ms(e.end) : start + 2 * 60 * 60 * 1000;
    if (!start) return null;
    if (now < start) return { key: "soon", label: "رویداد پیشِ‌رو", start, end, days: Math.max(1, Math.ceil((start - now) / 86400000)) };
    if (now <= end) return { key: "live", label: "در حال برگزاری", start, end };
    return { key: "past", label: "پایان‌یافته", start, end };
  }
  /* دکمهٔ اصلی صفحه: فقط وقتی لینک واقعی هست (CTA دستی، ثبت‌نام رویداد یا لینک اطلاعیه).
     بدون لینک، دکمه‌ای رندر نمی‌شود — دکمهٔ پیگیری کانال تلگرام حذف شده است. */
  function primaryCta(n) {
    const list = ctaList(n);
    if (list.length) return list[0];
    const e = ev(n);
    const reg = e && ctaHref(e.registration_url);
    if (reg) return { label: "ثبت‌نام و شرکت در رویداد", href: reg, style: "gold", external: ABS_URI.test(reg), ico: "" };
    const l = ctaHref(n.link);
    if (l) return { label: "مشاهده در منبع", href: l, style: "gold", external: ABS_URI.test(l), ico: "" };
    return null;
  }
  function btn(c, cls) {
    const icon =
      c.ico === "telegram"
        ? icoFill("telegram", "ap-btn-i")
        : c.ico === "whatsapp"
        ? ico("whatsapp", "ap-btn-i")
        : c.ico === "download"
        ? ico("download", "ap-btn-i")
        : c.ico === "calendar"
        ? ico("calendar", "ap-btn-i")
        : "";
    const target = c.external ? ' target="_blank" rel="noopener"' : "";
    return `<a class="btn btn-${c.style || "navy"}${cls ? " " + cls : ""}" href="${escA(c.href)}"${target}>${icon}${esc(c.label)}</a>`;
  }

  /* =============== متن کامل: تبدیل به HTML + فهرست مطالب =============== */
  function toBlocks(n) {
    const raw = (Array.isArray(n.blocks) ? n.blocks : []).filter((b) => b && b.type);
    const real = raw.filter((b) => b.type !== "ads");
    /* بلوک «ads» فقط جای نمایش موبایل را مشخص می‌کند؛ اگر هیچ بلوک محتوایی وجود
       نداشته باشد یعنی صفحه با فیلدهای تختِ قدیمی ساخته شده (یا فقط بلوک پیش‌فرض
       تبلیغات را دارد) و باید حالت خودکار حفظ شود تا محتوا ناپدید نشود. */
    if (real.length) return raw;
    /* ترتیب پیش‌فرض بر پایهٔ فیلدهای تختِ قدیمی + فیلدهای تازه */
    const auto = [];
    if (Array.isArray(n.highlights) && n.highlights.length) auto.push({ type: "highlights", heading: "در یک نگاه", items: n.highlights });
    /* اگر متن کامل نوشته نشده باشد، خلاصه به‌عنوان متن صفحه می‌آید تا ستون اصلی خالی نماند */
    if (String(n.body || "").trim()) auto.push({ type: "text", markdown: n.body });
    else if (String(n.summary || "").trim()) auto.push({ type: "text", markdown: n.summary });
    if (Array.isArray(n.facts) && n.facts.length) auto.push({ type: "facts", heading: "اطلاعات کلیدی", items: n.facts });
    if (n.video && (n.video.url || n.video.file)) auto.push({ type: "video", ...n.video });
    if (Array.isArray(n.gallery) && n.gallery.length) auto.push({ type: "gallery", heading: "گالری تصاویر", items: n.gallery });
    if (Array.isArray(n.timeline) && n.timeline.length) auto.push({ type: "timeline", heading: "برنامهٔ زمانی", items: n.timeline });
    if (Array.isArray(n.attachments) && n.attachments.length) auto.push({ type: "files", heading: "فایل‌های پیوست", items: n.attachments });
    if (Array.isArray(n.faq) && n.faq.length) auto.push({ type: "faq", heading: "پرسش‌های پرتکرار", items: n.faq });
    if (n.form && n.form.url) auto.push({ type: "form", ...n.form, heading: n.form.title || "ثبت‌نام / فرم" });
    if (n.notice && (n.notice.text || n.notice.title)) auto.push({ type: "notice", ...n.notice });
    if (Array.isArray(n.stats) && n.stats.length) auto.push({ type: "stats", heading: n.stats_title || "در یک نگاه آماری", items: n.stats });
    if (n.quote && n.quote.text) auto.push({ type: "quote", ...n.quote });
    if (n.location && (n.location.name || n.location.address || n.location.map_url)) auto.push({ type: "location", ...n.location });
    return auto;
  }

  /* =============== رندر بلوک‌ها =============== */
  const BLOCK_ICON = {
    highlights: "spark", text: "list", facts: "info", video: "play", gallery: "image",
    files: "file", timeline: "clock", form: "edit", faq: "help", notice: "warn",
    stats: "chart", quote: "quote", cta: "bolt", location: "pin", image: "image", divider: "minus",
    buttons: "bolt", schedule: "clock", audience: "users", tabs: "list", prices: "money", teacher: "shield"
  };

  function bHighlights(b, prefix) {
    const items = (Array.isArray(b.items) ? b.items : []).map((x) => (typeof x === "string" ? x : x && x.text)).filter(Boolean);
    if (!items.length) return "";
    return `<ul class="ap-highlights">${items
      .map((t) => `<li><span class="ap-hl-ico">${ico("check")}</span><span>${esc(t)}</span></li>`)
      .join("")}</ul>`;
  }

  function bFacts(b) {
    const items = (Array.isArray(b.items) ? b.items : []).filter((x) => x && (x.label || x.value));
    if (!items.length) return "";
    return `<dl class="ap-facts">${items
      .map(
        (x) =>
          `<div class="ap-fact"><dt>${x.icon ? `<span class="ap-fact-ico">${ico(x.icon)}</span>` : ""}${esc(x.label || "")}</dt><dd>${esc(x.value || "")}</dd></div>`
      )
      .join("")}</dl>`;
  }

  function bText(b, prefix, idPrefix, toc) {
    const parsed = mdParse(b.markdown || b.body || "", { idPrefix, localPrefix: prefix });
    if (parsed.toc && parsed.toc.length) toc.push(...parsed.toc);
    if (!parsed.html) return "";
    return `<div class="ap-rich">${parsed.html}</div>`;
  }

  function bImage(b, prefix) {
    const src = safeMedia(b.image || b.url);
    if (!src) return "";
    return `<figure class="ap-figure">
              ${figImg(src, prefix, b.alt || b.caption || "", "ap-fig-img")}
              ${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ""}
            </figure>`;
  }

  function bGallery(b, prefix, gid) {
    const items = (Array.isArray(b.items) ? b.items : [])
      .map((g) => (g && typeof g === "object" ? g : { image: g }))
      .filter((g) => g && String(g.image || g.url || "").trim());
    if (!items.length) return "";
    const cols = ["", "two", "three", "four"].indexOf(String(b.columns)) > 0 ? " is-" + b.columns : "";
    return `<div class="ap-gallery${cols}" role="list">${items
      .map((g, i) => {
        const src = safeMedia(g.image || g.url);
        const full = srcUrl(src, prefix);
        const cap = String(g.caption || "").trim();
        return `<button type="button" role="listitem" class="ap-gal" data-ap-gal="${gid}" data-src="${escA(full)}" data-cap="${escA(cap)}" aria-label="بزرگ‌نمایی تصویر ${fa(i + 1)}">
              ${figImg(src, prefix, cap || b.heading || "", "ap-gal-img")}
              <span class="ap-gal-zoom">${ico("image", "ap-gal-ico")}</span>
              ${cap ? `<span class="ap-gal-cap">${esc(cap)}</span>` : ""}
            </button>`;
      })
      .join("")}</div>`;
  }

  function bVideo(b, prefix, cover) {
    const url = String(b.url || "").trim();
    const posterSrc = safeMedia(b.poster) || cover || "";
    const poster = posterSrc ? srcUrl(posterSrc, prefix) : "";
    const v = url ? videoEmbed(url) : null;
    const directFile = safeMedia(b.file);
    if (!v && directFile) {
      const u = srcUrl(directFile, prefix);
      return `<figure class="ap-video ap-video--native"${poster ? ` style="--poster:url('${escA(poster)}')"` : ""}>
                <video controls preload="metadata" playsinline${poster ? ` poster="${escA(poster)}"` : ""}>
                  <source src="${escA(u)}" type="${/\.webm/i.test(u) ? "video/webm" : "video/mp4"}">
                  مرورگر شما امکان پخش ویدیو را ندارد.
                </video>
                ${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ""}
              </figure>`;
    }
    if (!v) return "";
    if (v.kind === "file") {
      return `<figure class="ap-video ap-video--native">
                <video controls preload="metadata" playsinline${poster ? ` poster="${escA(poster)}"` : ""}>
                  <source src="${escA(v.src)}" type="${/\.webm/i.test(v.src) ? "video/webm" : /\.mov/i.test(v.src) ? "video/quicktime" : "video/mp4"}">
                  مرورگر شما امکان پخش ویدیو را ندارد.
                </video>
                ${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ""}
              </figure>`;
    }
    if (v.kind === "link") {
      return `<div class="ap-video-link">${btn({ label: b.title || "تماشای ویدیو", href: v.src, style: "navy", external: true, ico: "play" })}</div>`;
    }
    /* نمای Facade: ویدیو فقط با کلیک کاربر بارگذاری می‌شود (سرعت + حریم خصوصی) */
    const thumb = v.thumb || poster;
    return `<figure class="ap-video" data-ap-video data-src="${escA(v.src)}" data-allow="${escA(v.allow || "")}" data-title="${escA(b.title || "ویدیو")}">
              <button type="button" class="ap-video-btn" data-ap-video-btn aria-label="پخش ویدیو در ${escA(v.label)}">
                ${thumb ? `<img class="ap-video-poster" src="${escA(thumb)}" alt="" loading="lazy" decoding="async">` : `<span class="ap-video-poster ap-video-poster--plain" aria-hidden="true"></span>`}
                <span class="ap-video-scrim" aria-hidden="true"></span>
                <span class="ap-video-play" aria-hidden="true">${icoFill("play", "ap-play-ico")}</span>
                <span class="ap-video-tag">${esc(v.label)}</span>
              </button>
              ${b.title || b.caption ? `<figcaption>${b.title ? `<b>${esc(b.title)}</b>` : ""}${b.caption ? ` ${esc(b.caption)}` : ""}</figcaption>` : ""}
            </figure>`;
  }

  function bTimeline(b) {
    const items = (Array.isArray(b.items) ? b.items : []).filter((x) => x && (x.title || x.time || x.desc));
    if (!items.length) return "";
    return `<ol class="ap-timeline">${items
      .map(
        (x) =>
          `<li><span class="ap-tl-dot" aria-hidden="true"></span>
                <div class="ap-tl-body">
                  ${x.time ? `<span class="ap-tl-time">${ico("clock", "ap-tl-ico")}${esc(x.time)}</span>` : ""}
                  ${x.title ? `<h3 class="ap-tl-title">${esc(x.title)}</h3>` : ""}
                  ${x.desc ? `<p class="ap-tl-desc">${esc(x.desc)}</p>` : ""}
                </div>
              </li>`
      )
      .join("")}</ol>`;
  }

  function bFiles(b, prefix) {
    const items = (Array.isArray(b.items) ? b.items : []).filter((x) => x && String(x.file || x.url || "").trim());
    if (!items.length) return "";
    return `<ul class="ap-files">${items
      .map((f) => {
        const raw = String(f.file || f.url);
        const k = fileKind(raw);
        const size = ABS_URI.test(raw) ? "" : fileSize(path.join(ROOT, raw.replace(/^\.\//, "")));
        const href = srcUrl(raw, prefix);
        const title = String(f.title || "").trim() || raw.split("/").pop();
        return `<li class="ap-file">
                <span class="ap-file-ico is-${k.kind}">${ico(k.kind === "image" ? "image" : k.kind === "video" ? "play" : k.kind === "audio" ? "bell" : "file", "ap-file-i")}</span>
                <span class="ap-file-txt"><b>${esc(title)}</b><small>${esc(k.label)}${size ? " · " + esc(size) : ""}${f.note ? " · " + esc(f.note) : ""}</small></span>
                <a class="ap-file-dl" href="${escA(href)}" download target="_blank" rel="noopener">${ico("download", "ap-file-dl-i")} دانلود</a>
              </li>`;
      })
      .join("")}</ul>`;
  }

  function bForm(b) {
    const url = String(b.url || "").trim();
    const f = url ? formEmbed(url, b.height) : null;
    if (!f) return "";
    if (f.kind === "link") {
      return `<div class="ap-form-cta">
                ${b.note ? `<p class="ap-note">${esc(b.note)}</p>` : ""}
                ${btn({ label: b.button_label || b.heading || "تکمیل فرم", href: f.src, style: "gold", external: true, ico: "edit" })}
              </div>`;
    }
    return `<div class="ap-form">
              ${b.note ? `<p class="ap-note">${esc(b.note)}</p>` : ""}
              <div class="ap-form-frame" style="--fh:${f.height}px">
                <iframe src="${escA(f.src)}" title="${escA(b.heading || "فرم ثبت‌نام")}" loading="lazy" allowfullscreen frameborder="0">در حال بارگذاری فرم…</iframe>
              </div>
              <a class="ap-form-open" href="${escA(f.src.replace(/\?embedded=true$/, ""))}" target="_blank" rel="noopener">${ico("link", "ap-i-sm")} باز کردن فرم در پنجرهٔ جدید</a>
            </div>`;
  }

  function bFaq(b) {
    const items = (Array.isArray(b.items) ? b.items : []).filter((x) => x && x.q);
    if (!items.length) return "";
    return `<div class="ap-faq">${items
      .map(
        (x) =>
          `<details class="ap-faq-item">
                <summary>${ico("help", "ap-faq-i")}<span>${esc(x.q)}</span>${ico("chevDown", "ap-faq-chev")}</summary>
                <div class="ap-faq-a">${esc(x.a || "")}</div>
              </details>`
      )
      .join("")}</div>`;
  }

  function bNotice(b) {
    const tone = ["info", "warn", "success", "danger"].indexOf(String(b.tone)) >= 0 ? String(b.tone) : "info";
    const icon = tone === "warn" || tone === "danger" ? "warn" : tone === "success" ? "check" : "info";
    return `<div class="ap-notice is-${tone}">
              <span class="ap-notice-ico">${ico(icon, "ap-notice-i")}</span>
              <div>${b.title ? `<b class="ap-notice-t">${esc(b.title)}</b>` : ""}${b.text ? `<p>${esc(b.text)}</p>` : ""}</div>
            </div>`;
  }

  function bStats(b) {
    const items = (Array.isArray(b.items) ? b.items : []).filter((x) => x && (x.number || x.label));
    if (!items.length) return "";
    return `<ul class="ap-stats">${items
      .map((x) => `<li>${x.icon ? `<span class="ap-stat-ico">${ico(x.icon)}</span>` : ""}<b>${esc(x.number || "")}</b><span>${esc(x.label || "")}</span></li>`)
      .join("")}</ul>`;
  }

  function bQuote(b, prefix) {
    const av = safeMedia(b.avatar);
    return `<figure class="ap-quote">
              <span class="ap-quote-mark" aria-hidden="true">${icoFill("quote", "ap-quote-i")}</span>
              <blockquote>${esc(b.text || "")}</blockquote>
              ${b.author || b.role ? `<figcaption>${av ? figImg(av, prefix, b.author || "", "ap-quote-av") : ""}<span><b>${esc(b.author || "")}</b>${b.role ? `<small>${esc(b.role)}</small>` : ""}</span></figcaption>` : ""}
            </figure>`;
  }

  function bCta(b, n) {
    const list = ctaList(b.items && b.items.length ? { cta: b.items } : n);
    if (!list.length) return "";
    return `<div class="ap-cta-row">
              ${b.text ? `<p class="ap-cta-text">${esc(b.text)}</p>` : ""}
              <div class="ap-cta-btns">${list.map((c) => btn(c)).join("")}</div>
            </div>`;
  }

  /* بلوک «دکمه‌ها»: دکمه‌های لینک‌دار قابل‌تنظیم از داشبورد —
     رنگ‌ها از پالت سایت (طلایی، سرمه‌ای، تلگرام، ساده) + سفید */
  const BTN_STYLES = ["gold", "navy", "tele", "ghost", "white", "light"];
  function bButtons(b) {
    const items = (Array.isArray(b.items) ? b.items : [])
      .map((it) => {
        const href = ctaHref(it && it.link);
        const label = String((it && it.label) || "").trim();
        if (!href || !label) return null;
        return {
          label,
          href,
          style: BTN_STYLES.indexOf(it.style) >= 0 ? it.style : "navy",
          external: ABS_URI.test(href),
          ico: it.icon || ""
        };
      })
      .filter(Boolean);
    if (!items.length) return "";
    return `<div class="ap-btns">
              ${b.text ? `<p class="ap-btns-text">${esc(b.text)}</p>` : ""}
              <div class="ap-btns-row">${items.map((c) => btn(c)).join("")}</div>
            </div>`;
  }

  function bLocation(b) {
    const map = b.map_url ? mapEmbed(b.map_url) : null;
    const mapTag =
      map && map.provider === "google"
        ? `<span class="ap-map-tag">نقشهٔ گوگل</span>`
        : map && map.provider === "neshan"
        ? `<span class="ap-map-tag">نشان</span>`
        : "";
    const rows = [];
    if (b.address) rows.push(`<p class="ap-loc-addr">${ico("pin", "ap-i-sm")} ${esc(b.address)}</p>`);
    const mapTitle = (map && map.title) || b.name || "نقشه";
    const dirHref = b.map_url && String(b.map_url).trim().slice(0, 7).toLowerCase() !== "<iframe" ? b.map_url : "";
    return `<div class="ap-location">
              ${b.name ? `<h3 class="ap-loc-name">${ico("map", "ap-i-sm")} ${esc(b.name)}</h3>` : ""}
              ${rows.join("")}
              ${
                map
                  ? `<div class="ap-map"><iframe src="${escA(map.src)}" title="${escA(mapTitle)}" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade" frameborder="0"></iframe>${mapTag}</div>`
                  : ""
              }
              ${dirHref ? `<a class="ap-loc-dir" href="${escA(dirHref)}" target="_blank" rel="noopener">${ico("map", "ap-i-sm")} مشاهدهٔ مسیر در نقشه</a>` : ""}
            </div>`;
  }

  function bDivider(b) {
    return b.text ? `<div class="ap-divider"><span>${esc(b.text)}</span></div>` : `<hr class="ap-hr">`;
  }

  /* ===== بلوک‌های مخصوص صفحات دوره (amoozesh/) — الهام از وبینارهای ایسمینار ===== */
  /* سرفصل‌ها/زمان‌بندی درس‌ها: بازهٔ زمانی + مدت + توضیح (شبیه تایم‌لاین وبینار) */
  function bSchedule(b) {
    const items = (Array.isArray(b.items) ? b.items : []).filter((it) => it && (it.title || it.time || it.note));
    if (!items.length) return "";
    return `<div class="cp-schedule">
      <ol class="cp-sched">
        ${items
          .map((it, i) => {
            const t = String(it.time || "").trim();
            const d = String(it.duration || "").trim();
            const title = String(it.title || "").trim();
            const note = String(it.note || "").trim();
            return `<li class="cp-sched-item">
            <span class="cp-sched-no">${fa(String(i + 1).padStart(2, "0"))}</span>
            <div class="cp-sched-body">
              <div class="cp-sched-head">
                ${title ? `<h4>${esc(title)}</h4>` : ""}
                <span class="cp-sched-tags">
                  ${t ? `<span class="cp-sched-tag is-time">${ico("clock", "ap-i-xs")} ${esc(t)}</span>` : ""}
                  ${d ? `<span class="cp-sched-tag is-dur">${ico("bolt", "ap-i-xs")} ${esc(d)}</span>` : ""}
                </span>
              </div>
              ${note ? `<p class="cp-sched-note">${esc(note)}</p>` : ""}
            </div>
          </li>`;
          })
          .join("\n          ")}
      </ol>
    </div>`;
  }

  /* مخاطبین: دو ستون — این دوره برای چه کسی است / برای چه کسی نیست (الگوی ایسمینار) */
  function bAudience(b) {
    const good = (Array.isArray(b.suitable) ? b.suitable : []).filter(Boolean);
    const bad = (Array.isArray(b.unsuitable) ? b.unsuitable : []).filter(Boolean);
    if (!good.length && !bad.length) return "";
    return `<div class="cp-audience">
      <div class="cp-aud-col is-good">
        <h4><span class="cp-aud-ico">${ico("check", "ap-i-sm")}</span> ${esc(b.good_title || "این دوره برای چه کسانی است؟")}</h4>
        <ul>${good.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      </div>
      ${bad.length ? `<div class="cp-aud-col is-bad">
        <h4><span class="cp-aud-ico">${ico("xmark", "ap-i-sm")}</span> ${esc(b.bad_title || "این دوره برای چه کسانی نیست؟")}</h4>
        <ul>${bad.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      </div>` : ""}
    </div>`;
  }

  /* تب‌ها (بدون جاوااسکریپت — با radio مخفی و CSS): مثل «توضیحات / سرفصل‌ها / …» در سمینار */
  function bTabs(b, prefix, idSeed) {
    const items = (Array.isArray(b.tabs) ? b.tabs : []).filter((t) => t && String(t.tab || "").trim());
    if (!items.length) return "";
    const gid = "cp-tabs-" + String(idSeed || "0").replace(/[^a-z0-9-]/gi, "");
    return `<div class="cp-tabs" data-cp-tabs>
      ${items
        .map((t, i) => `<input type="radio" name="${gid}" id="${gid}-${i}" class="cp-tab-radio"${i === 0 ? " checked" : ""} hidden aria-hidden="true">`)
        .join("")}
      <nav class="cp-tabbar" aria-label="بخش‌های دوره">
        ${items
          .map((t, i) => `<label class="cp-tab-btn" for="${gid}-${i}">${t.icon ? ico(t.icon, "ap-i-sm") : ""}${esc(t.tab)}</label>`)
          .join("")}
      </nav>
      ${items
        .map((t, i) => {
          const bodyHtml = String(t.markdown || "").trim()
            ? mdParse(t.markdown, { idPrefix: gid + "-" + i + "-", localPrefix: prefix }).html
            : "";
          return `<section class="cp-tab-panel" data-cp-tab-panel="${i}">${bodyHtml || ""}</section>`;
        })
        .join("")}
    </div>`;
  }

  /* جدول قیمت/بلیت (مثل «بلیت‌های وبینار»): چند گزینه با لیست امکانات و دکمهٔ ثبت‌نام */
  function bPrices(b, prefix) {
    const items = (Array.isArray(b.items) ? b.items : []).filter((t) => t && String(t.name || "").trim());
    if (!items.length) return "";
    return `<div class="cp-prices">
      ${items
        .map((t, i) => {
          const feats = (Array.isArray(t.features) ? t.features : []).filter(Boolean);
          const isHot = t.hot === true;
          const price = String(t.price || "").trim();
          const cta = t.link
            ? (ABS_URI.test(t.link) ? { label: t.cta || "ثبت‌نام", href: t.link, style: "gold", external: true } : { label: t.cta || "ثبت‌نام", href: prefix + t.link.replace(/^\.\//, ""), style: "gold", external: false })
            : null;
          return `<div class="cp-price${isHot ? " is-hot" : ""}">
            <div class="cp-price-head">
              ${isHot ? `<span class="cp-price-badge">${ico("spark", "ap-i-xs")} پیشنهاد</span>` : ""}
              <h4>${esc(t.name)}</h4>
              <b class="cp-price-val">${esc(price)}</b>
            </div>
            ${feats.length ? `<ul class="cp-price-feats">${feats.map((f) => `<li>${ico("check", "ap-i-xs")} ${esc(f)}</li>`).join("")}</ul>` : ""}
            ${cta ? btn(cta, "cp-price-cta") : ""}
          </div>`;
        })
        .join("\n      ")}
    </div>`;
  }

  /* کارت مدرس: عکس یا حرف اول نام + سمت + معرفی + لینک */
  function bTeacher(b, prefix, course) {
    const name = String(b.name || "").trim();
    if (!name) return "";
    const img = b.image ? safeMedia(b.image) : (course && course.teacher_image ? safeMedia(course.teacher_image) : "");
    const avatar = img
      ? `<img class="cp-tch-avatar" src="${srcUrl(img, prefix)}" alt="${escA(name)}" loading="lazy">`
      : `<span class="cp-tch-avatar is-initial">${esc([...(name)].slice(0, 1)[0])}</span>`;
    return `<div class="cp-teacher">
      <div class="cp-tch-media">${avatar}</div>
      <div class="cp-tch-info">
        <span class="cp-tch-kicker">${esc(b.kicker || "مدرس دوره")}</span>
        <h4 class="cp-tch-name">${esc(name)}</h4>
        ${b.role ? `<p class="cp-tch-role">${esc(b.role)}</p>` : ""}
        ${b.bio ? `<p class="cp-tch-bio">${esc(b.bio)}</p>` : ""}
        ${b.link ? `<a class="cp-tch-link" href="${escA(ctaHref(b.link) || b.link)}" target="_blank" rel="noopener">${ico("link", "ap-i-sm")} اطلاعات بیشتر</a>` : ""}
      </div>
    </div>`;
  }

   const RENDER = {
    highlights: (b, c) => bHighlights(b, c.prefix),
    facts: (b) => bFacts(b),
    schedule: (b) => bSchedule(b),
    audience: (b) => bAudience(b),
    tabs: (b, c) => bTabs(b, c.prefix, c.idPrefix),
    prices: (b, c) => bPrices(b, c.prefix),
    teacher: (b, c) => bTeacher(b, c.prefix, c.n),
    text: (b, c) => bText(b, c.prefix, c.idPrefix, c.toc),
    image: (b, c) => bImage(b, c.prefix),
    gallery: (b, c) => bGallery(b, c.prefix, c.idPrefix.replace(/[^a-z0-9-]/gi, "") || "gal"),
    video: (b, c) => bVideo(b, c.prefix, c.cover),
    timeline: (b) => bTimeline(b),
    files: (b, c) => bFiles(b, c.prefix),
    form: (b) => bForm(b),
    faq: (b) => bFaq(b),
    notice: (b) => bNotice(b),
    stats: (b) => bStats(b),
    quote: (b, c) => bQuote(b, c.prefix),
    cta: () => "",
    buttons: (b) => bButtons(b),
    location: (b) => bLocation(b),
    divider: (b) => bDivider(b)
  };

  /* محتوای یک بلوک + سرتیتر + لنگر برای فهرست مطالب */
  function renderBlock(b, i, state) {
    const fn = RENDER[b.type];
    if (!fn) return { html: "", toc: [] };
    const toc = [];
    const inner = fn(b, { ...state, idPrefix: "ap-" + b.type + "-" + i + "-", toc });
    if (!inner) return { html: "", toc: [] };
    const bId = "ap-blk-" + i;
    const head = String(b.heading || "").trim();
    if (head) {
      const entry = { id: bId, text: head, level: 2 };
      const html = `<section id="${bId}" class="ap-block ap-block--${esc(b.type)}${b.place === "side" ? " is-side" : ""}" style="--ap-i:${i}">
          <h2 class="ap-block-h"><span class="ap-block-hi">${ico(BLOCK_ICON[b.type] || "spark", "ap-block-ico")}</span>${esc(head)}</h2>
          ${inner}
        </section>`;
      return { html: { section: html, entry }, toc };
    }
    const html = `<section class="ap-block ap-block--${esc(b.type)}${b.place === "side" ? " is-side" : ""}" style="--ap-i:${i}">${inner}</section>`;
    return { html: { section: html, entry: null }, toc };
  }

  /* =============== کارت‌های نوار کنار =============== */
  function sideKeyFacts(n, org, st) {
    const e = ev(n);
    const rows = [];
    const row = (icon, label, val, href) => {
      if (!val) return "";
      return `<li><span class="ap-kf-ico">${ico(icon, "ap-i-sm")}</span><span class="ap-kf-l">${esc(label)}</span><span class="ap-kf-v">${href ? `<a href="${escA(href)}"${ABS_URI.test(href) ? ' target="_blank" rel="noopener"' : ""}>${esc(val)}</a>` : esc(val)}</span></li>`;
    };
    rows.push(row("calendar", "انتشار", faDate(n.date || "", false), ""));
    if (e) {
      if (e.start) rows.push(row("clock", "شروع", faDateTime(e.start, false)));
      if (e.end) rows.push(row("clock", "پایان", faDateTime(e.end, false)));
      if (e.all_day) rows.push(row("calendar", "نوع", "تمام‌روز"));
      const mode = String(e.mode || "").trim();
      if (mode) rows.push(row(mode === "آنلاین" ? "monitor" : "pin", "شکل برگزاری", mode));
      if (e.location || e.address) {
        const mu = n.location && n.location.map_url ? String(n.location.map_url).trim() : "";
        const muHref = mu && mu.slice(0, 7).toLowerCase() !== "<iframe" ? mu : "";
        rows.push(row("pin", "مکان", e.location || e.address, muHref));
      }
      if (e.deadline) rows.push(row("bell", "مهلت ثبت‌نام", faDateTime(e.deadline, false)));
      if (e.capacity) rows.push(row("users", "ظرفیت", e.capacity));
      if (e.fee) rows.push(row("money", "هزینه", e.fee));
    }
    rows.push(row("tag", "دسته", n.category || "خبر", "../ettelaieh.html?cat=" + encodeURIComponent(n.category || "")));
    if (n.author) rows.push(row("edit", "منتشرکننده", n.author));
    if (org && org.length) {
      org.forEach((o) => rows.push(row(o.kind === "کانون" ? "users" : "book", o.kind + " برگزارکننده", o.name, o.href)));
    }
    const body = rows.filter(Boolean).join("");
    if (!body) return "";
    return `<section class="ap-card ap-card--kf" aria-labelledby="ap-kf-h">
        <h2 class="ap-card-h" id="ap-kf-h">${ico("info", "ap-card-i")} اطلاعات کلی</h2>
        <ul class="ap-kf">${body}</ul>
        ${st && st.key === "soon" ? countdown(n, st) : ""}
      </section>`;
  }

  function countdown(n, st) {
    const until = new Date(st.start).toISOString();
    return `<div class="ap-count" data-ap-countdown data-until="${escA(until)}">
        <span class="ap-count-l">تا شروع رویداد</span>
        <div class="ap-count-grid">
          <span><b data-ap-cd="d">${fa(0)}</b><small>روز</small></span>
          <span><b data-ap-cd="h">${fa(0)}</b><small>ساعت</small></span>
          <span><b data-ap-cd="m">${fa(0)}</b><small>دقیقه</small></span>
          <span><b data-ap-cd="s">${fa(0)}</b><small>ثانیه</small></span>
        </div>
      </div>`;
  }

  function sideShare(url, title) {
    const u = encodeURIComponent(url);
    const t = encodeURIComponent(title);
    return `<section class="ap-card ap-card--share" aria-labelledby="ap-sh-h">
        <h2 class="ap-card-h" id="ap-sh-h">${ico("share", "ap-card-i")} اشتراک‌گذاری</h2>
        <div class="ap-share">
          <a class="ap-sh is-tele" href="https://t.me/share/url?url=${u}&text=${t}" target="_blank" rel="noopener" aria-label="اشتراک در تلگرام">${icoFill("telegram", "ap-sh-i")}<span>تلگرام</span></a>
          <a class="ap-sh is-wa" href="https://wa.me/?text=${t}%20${u}" target="_blank" rel="noopener" aria-label="اشتراک در واتس‌اپ">${ico("whatsapp", "ap-sh-i")}<span>واتس‌اپ</span></a>
          <a class="ap-sh is-x" href="https://twitter.com/intent/tweet?url=${u}&text=${t}" target="_blank" rel="noopener" aria-label="اشتراک در ایکس">${ico("xmark", "ap-sh-i")}<span>ایکس</span></a>
          <button type="button" class="ap-sh is-copy" data-ap-copy="${escA(url)}" aria-label="کپی نشانی">${ico("copy", "ap-sh-i")}<span>کپی نشانی</span></button>
          <button type="button" class="ap-sh is-native" data-ap-native data-ap-url="${escA(url)}" data-ap-title="${escA(title)}" aria-label="اشتراک‌گذاری">${ico("share", "ap-sh-i")}<span>اشتراک‌گذاری</span></button>
        </div>
      </section>`;
  }

  function sideOrg(n, orgs) {
    if (!orgs || !orgs.length) return "";
    const cards = orgs
      .map((org) => {
        const logo = org.item && org.item.slug ? orgLogo(org.item, "../", "ap-org-img", "ap-org-mono") : "";
        return `<a class="ap-org" href="${escA(org.href)}">
          <span class="ap-org-logo">${logo}</span>
          <span class="ap-org-txt"><small>${esc(org.kind)} برگزارکننده</small><b>${esc(org.name)}</b><span>مشاهدهٔ پروفایل و فعالیت‌ها ${ico("chev", "ap-i-xs")}</span></span>
        </a>`;
      })
      .join("\n        ");
    return `<section class="ap-card ap-card--org">
        ${cards}
      </section>`;
  }

  /* =============== کاور و هیرو =============== */
  function coverFigure(n, prefix, cls, decorative) {
    const img = pickImage(n);
    if (!img) return "";
    const d = dims(img);
    const tall = d && d.w && d.h && d.h > d.w * 1.15;
    const cap = String(n.image_caption || "").trim();
    const full = srcUrl(img, prefix);
    /* در قالب «مجله» کاور تزئینی است و دکمه/زیرنویس نمی‌گیرد */
    if (decorative) {
      return `<figure class="ap-cover${tall ? " is-tall" : ""}${cls ? " " + cls : ""}">
          ${figImg(img, prefix, "", "ap-cover-img", true)}
        </figure>`;
    }
    return `<figure class="ap-cover${tall ? " is-tall" : ""}${cls ? " " + cls : ""}">
        <button type="button" class="ap-cover-btn" data-ap-gal="cover" data-src="${escA(full)}" data-cap="${escA(cap || n.title || "")}" aria-label="بزرگ‌نمایی تصویر">
          ${figImg(img, prefix, n.title || "", "ap-cover-img", true)}
        </button>
        ${cap ? `<figcaption>${esc(cap)}</figcaption>` : ""}
      </figure>`;
  }

  function heroArt(n) {
    const emoji = CAT_EMOJI[String(n.category || "").trim()] || "📰";
    return `<span class="ap-art" aria-hidden="true"><span class="ap-art-emoji">${emoji}</span></span>`;
  }

  /* چیپ‌های هشتگ — با «#» و اتصال به جستجوی سراسری (data-search) */
  function hashChips(list, max) {
    const arr = (Array.isArray(list) ? list : [])
      .map((h) => String(h || "").trim().replace(/^#+/, ""))
      .filter(Boolean)
      .slice(0, max || 8);
    if (!arr.length) return "";
    return arr.map((h) => `<span class="ap-chip is-hashtag" role="button" tabindex="0" data-search="#${escA(h)}">#${esc(h)}</span>`).join("\n        ");
  }

  function chipRow(n, orgs, st) {
    const orgChips = (Array.isArray(orgs) ? orgs : [])
      .map((org) => `<a class="ap-chip is-org" href="${escA(org.href)}">${ico(org.kind === "کانون" ? "users" : "book", "ap-i-xs")} ${esc(org.name)}</a>`)
      .join("");
    return `<div class="ap-chips">
        ${
          n.badge
            ? `<span class="ap-chip is-badge">${ico("bolt", "ap-i-xs")} ${esc(n.badge)}</span>`
            : ""
        }
        <span class="ap-chip is-cat">${CAT_EMOJI[String(n.category || "").trim()] || "📰"} ${esc(n.category || "خبر")}</span>
        ${st ? `<span class="ap-chip is-status is-${st.key}">${ico(st.key === "past" ? "check" : "bell", "ap-i-xs")} ${esc(st.label)}</span>` : ""}
        ${orgChips}
        ${hashChips(n.hashtags)}
      </div>`;
  }

  function metaLine(n) {
    return `<div class="ap-metaline">
        <span class="ap-meta-i">${ico("calendar", "ap-i-sm")} <time datetime="${escA(n.date || "")}" data-date="${escA(n.date || "")}">${esc(faDate(n.date, true))}</time></span>
        ${n.author ? `<span class="ap-meta-sep" aria-hidden="true"></span><span class="ap-meta-i">${ico("edit", "ap-i-sm")} ${esc(n.author)}</span>` : ""}
      </div>`;
  }

  function readingMinutes(n) {
    const parts = [n.body, n.summary];
    (Array.isArray(n.blocks) ? n.blocks : []).forEach((b) => {
      if (b && b.markdown) parts.push(b.markdown);
      if (b && b.items) b.items.forEach((x) => parts.push(typeof x === "string" ? x : x && (x.text || x.desc || x.a || x.value)));
    });
    (Array.isArray(n.highlights) ? n.highlights : []).forEach((x) => parts.push(typeof x === "string" ? x : x && x.text));
    const words = parts
      .filter(Boolean)
      .join(" ")
      .replace(/[#*>`\-[\]()!_|]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1).length;
    return Math.max(1, Math.round(words / 190));
  }

  /* لینک تقویم گوگل + فایل ICS (بدون هیچ سرویس بیرونی) */
  function calendarLinks(n, url) {
    const e = ev(n);
    if (!e || !e.start) return "";
    const start = new Date(e.start);
    const end = e.end ? new Date(e.end) : new Date(start.getTime() + 2 * 3600 * 1000);
    const fmt = (d) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
    const q = (o) => new URLSearchParams(o).toString();
    const gcal =
      "https://calendar.google.com/calendar/render?" +
      q({
        action: "TEMPLATE",
        text: n.title || "",
        dates: fmt(start) + "/" + fmt(end),
        details: (n.summary || "") + "\n" + url,
        location: e.location || e.address || ""
      });
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Semnan Platform//FA//",
      "BEGIN:VEVENT",
      "UID:" + url,
      "DTSTAMP:" + fmt(new Date()),
      "DTSTART:" + fmt(start),
      "DTEND:" + fmt(end),
      "SUMMARY:" + (n.title || ""),
      "DESCRIPTION:" + String(n.summary || "").replace(/\n/g, " "),
      "LOCATION:" + (e.location || e.address || ""),
      "URL:" + url,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");
    const icsHref = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
    return `<div class="ap-cal">
        <a class="ap-cal-btn" href="${escA(gcal)}" target="_blank" rel="noopener">${ico("calendar", "ap-i-sm")} افزودن به تقویم گوگل</a>
        <a class="ap-cal-btn" href="${escA(icsHref)}" download="${escA((n._slug || "event") + ".ics")}">${ico("download", "ap-i-sm")} فایل تقویم (ICS)</a>
      </div>`;
  }

  /* =============== اطلاعیه‌های مرتبط و ناوبری =============== */
  function related(n, org, limit) {
    const pool = allNews.filter((x) => x._slug !== n._slug);
    const scored = pool
      .map((x) => {
        let score = 0;
        const sameOrg = (x) =>
        Array.isArray(org) && org.some((o) => (o.base === "kanonha" && x.kanon === o.slug) || (o.base === "anjomanha" && x.anjoman === o.slug));
      if (sameOrg(x)) score += 3;
        if (x.category && x.category === n.category) score += 2;
        const tags = Array.isArray(n.hashtags) ? n.hashtags : [];
        const xt = Array.isArray(x.hashtags) ? x.hashtags : [];
        if (tags.length && xt.length && tags.some((t) => xt.indexOf(t) >= 0)) score += 2;
        return { x, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score || ms(b.x.date) - ms(a.x.date))
      .slice(0, limit)
      .map((s) => s.x);
    if (!scored.length) return "";
    return `<section class="ap-block ap-related" aria-labelledby="ap-rel-h">
        <h2 class="ap-block-h" id="ap-rel-h"><span class="ap-block-hi">${ico("spark", "ap-block-ico")}</span>اطلاعیه‌های مرتبط</h2>
        <div class="ap-rel-grid">
          ${scored
            .map((x) => {
              const img = pickImage(x);
              const d = img ? dims(img) : null;
              const shapeCls = d && d.w && d.h ? (d.h > d.w * 1.15 ? " is-tall" : d.w > d.h * 1.6 ? " is-wide" : "") : "";
              return `<a class="ap-rel" href="${escA(encodeURI(x._slug) + ".html")}">
                  ${
                    img
                      ? `<span class="ap-rel-img${shapeCls}"><img src="${escA(srcUrl(img, "../"))}" alt="" loading="lazy" decoding="async"${d && d.w && d.h ? ` width="${d.w}" height="${d.h}"` : ""}></span>`
                      : `<span class="ap-rel-img ap-rel-art" aria-hidden="true">${CAT_EMOJI[x.category] || "📰"}</span>`
                  }
                  <span class="ap-rel-body">
                    <span class="ap-rel-chip">${esc(x.category || "خبر")}</span>
                    <b class="ap-rel-t">${esc(x.title || "")}</b>
                    <time class="ap-rel-d" data-date="${escA(x.date || "")}"></time>
                  </span>
                </a>`;
            })
            .join("")}
        </div>
      </section>`;
  }

  /* =============== متادیتای سئو: OG، توییتر و JSON-LD =============== */
  function absUrl(rel) {
    return SITE_URL + "/" + String(rel).replace(/^\//, "");
  }
  function jsonLd(obj) {
    return `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;
  }

  function headExtras(n, org, url, toc) {
    const title = (n.seo && n.seo.title) || n.title || "";
    const desc = (n.seo && n.seo.description) || n.summary || "";
    const img = (n.seo && n.seo.image) || pickImage(n);
    const ogImg = img ? (ABS_URI.test(img) ? img : absUrl(img)) : absUrl("assets/images/SVG/logo.svg");
    const canonical = (n.seo && n.seo.canonical) || url;
    const tags = Array.isArray(n.hashtags) ? n.hashtags.filter(Boolean) : [];
    const e = ev(n);
    const st = statusOf(n);
    const pageTitle = title + " | اطلاعیه‌های پلتفرم";

    const metas = [
      `<link rel="canonical" href="${escA(canonical)}">`,
      n.seo && n.seo.noindex ? `<meta name="robots" content="noindex, follow">` : `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">`,
      `<meta property="og:type" content="article">`,
      `<meta property="og:locale" content="fa_IR">`,
      `<meta property="og:site_name" content="${escA(BRAND)}">`,
      `<meta property="og:title" content="${escA(title)}">`,
      `<meta property="og:description" content="${escA(desc)}">`,
      `<meta property="og:url" content="${escA(canonical)}">`,
      `<meta property="og:image" content="${escA(ogImg)}">`,
      `<meta property="og:image:alt" content="${escA(title)}">`,
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:title" content="${escA(title)}">`,
      `<meta name="twitter:description" content="${escA(desc)}">`,
      `<meta name="twitter:image" content="${escA(ogImg)}">`
    ];
    if (n.date) {
      metas.push(`<meta property="article:published_time" content="${escA(new Date(n.date).toISOString())}">`);
    }
    if (n.category) metas.push(`<meta property="article:section" content="${escA(n.category)}">`);
    tags.slice(0, 8).forEach((t) => metas.push(`<meta property="article:tag" content="${escA(t)}">`));

    /* داده‌های ساخت‌یافته: مقاله خبری، رویداد، مسیر راهنما، پرسش‌های پرتکرار */
    const article = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
      headline: String(title).slice(0, 110),
      description: desc,
      image: [ogImg],
      datePublished: n.date ? new Date(n.date).toISOString() : undefined,
      dateModified: n.updated ? new Date(n.updated).toISOString() : n.date ? new Date(n.date).toISOString() : undefined,
      inLanguage: "fa-IR",
      articleSection: n.category || undefined,
      keywords: tags.length ? tags.join("، ") : undefined,
      author: n.author
        ? { "@type": "Person", name: n.author }
        : { "@type": "Organization", name: org && org.length ? org[0].name : BRAND },
      publisher: {
        "@type": "Organization",
        name: BRAND,
        logo: { "@type": "ImageObject", url: absUrl("assets/images/SVG/logo.svg") }
      }
    };
    const graph = [article];
    const crumbs = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "خانه", item: absUrl("index.html") },
        { "@type": "ListItem", position: 2, name: "اطلاعیه‌ها", item: absUrl("ettelaieh.html") },
        { "@type": "ListItem", position: 3, name: String(title), item: canonical }
      ]
    };
    graph.push(crumbs);

    if (e && e.start) {
      const start = new Date(e.start);
      const end = e.end ? new Date(e.end) : new Date(start.getTime() + 2 * 3600 * 1000);
      graph.push({
        "@context": "https://schema.org",
        "@type": "Event",
        name: title,
        description: desc,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode:
          String(e.mode || "") === "آنلاین"
            ? "https://schema.org/OnlineEventAttendanceMode"
            : "https://schema.org/OfflineEventAttendanceMode",
        image: [ogImg],
        url: canonical,
        location: (e.location || e.address) && String(e.mode || "") !== "آنلاین"
          ? { "@type": "Place", name: e.location || e.address, address: e.address || e.location }
          : { "@type": "VirtualLocation", url: canonical },
        organizer: { "@type": "Organization", name: org && org.length ? org[0].name : BRAND, url: org && org.length ? absUrl((org[0].href || "").replace("../", "")) : absUrl("index.html") },
        offers:
          e.fee || e.registration_url
            ? {
                "@type": "Offer",
                price: /رایگان/.test(String(e.fee || "")) ? "0" : undefined,
                priceCurrency: "IRR",
                availability: "https://schema.org/InStock",
                url: e.registration_url || canonical
              }
            : undefined
      });
    }

    /* پرسش‌ها: اگر بلوک‌های صریح وجود دارند، فقط همان‌ها معتبرند (مطابق toBlocks)
       تا یک پرسش از فیلد تخت و بلوک هم‌زمان دوبار در سئو تکرار نشود */
    const faqItems = [];
    const addFaq = (f) => {
      if (!f || !f.q) return;
      if (faqItems.some((x) => String(x.q) === String(f.q))) return;
      faqItems.push(f);
    };
    const explicitBlocks = (Array.isArray(n.blocks) ? n.blocks : []).filter((b) => b && b.type);
    if (explicitBlocks.length) {
      explicitBlocks.forEach((b) => {
        if (b.type === "faq" && Array.isArray(b.items)) b.items.forEach(addFaq);
      });
    } else {
      (Array.isArray(n.faq) ? n.faq : []).forEach(addFaq);
    }
    if (faqItems.length) {
      graph.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a || "" }
        }))
      });
    }

    /* مقالهٔ چندبخشی (TOC) به موتور جستجو کمک می‌کند بخش‌ها را بشناسد */
    if (toc.length > 1) {
      graph.push({
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "بخش‌های " + String(title),
        itemListElement: toc.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: t.text,
          url: canonical + "#" + t.id
        }))
      });
    }

    return metas.join("\n  ") + "\n  " + graph.map(jsonLd).join("\n  ");
  }

  /* =============== صفحهٔ نهایی =============== */
  function renderAnnPage(n) {
    const prefix = "../";
    const slug = encodeURI(n._slug || "");
    const url = absUrl("ettelaieh/" + slug + ".html");
    const org = orgFor(n);
    const st = statusOf(n);
    const blocks = toBlocks(n);
    const cta = primaryCta(n);
    const tags = Array.isArray(n.hashtags) ? n.hashtags.filter(Boolean) : [];
    const toc = [];

    /* بلوک‌های بدنه و نوار کنار، به ترتیبی که در داشبورد چیده شده‌اند */
    /* بنرهای تبلیغاتی مشترک با صفحهٔ اصلی:
       دسکتاپ همیشه در نوار کنار (بین فهرست مطالب و اطلاعات کلی)؛
       موبایل فقط با بلوک «تبلیغات موبایل» در جای دلخواه بین بلوک‌ها جابه‌جا می‌شود */
    const adsSlots = ads && ads.show_announcements !== false ? adsMarkup(ads) : "";
    const annAdsSide = adsSlots ? `<div class="ap-ads ap-ads--side">${adsSlots}</div>` : "";
    const adsMain = adsSlots ? `<div class="ap-ads ap-ads--inline">${adsSlots}</div>` : "";

    const mainHtml = [];
    const sideHtml = [];
    let adPlaced = false;
    blocks.forEach((b, i) => {
      if (b.type === "ads") {
        if (adsMain && !adPlaced) {
          mainHtml.push(adsMain);
          adPlaced = true;
        }
        return;
      }
      const r = renderBlock(b, i, { prefix, n, cover: pickImage(n) });
      if (typeof r.html === "object" && r.html) {
        if (b.place === "side") sideHtml.push(r.html.section);
        else mainHtml.push(r.html.section);
        if (r.html.entry) toc.push(r.html.entry);
      } else if (typeof r.html === "string" && r.html) {
        (b.place === "side" ? sideHtml : mainHtml).push(r.html);
      }
      if (r.toc && r.toc.length) toc.push(...r.toc);
    });
    /* اگر بلوک تبلیغات نداشت، پیش‌فرض موبایل: ابتدای ستون اصلی */
    if (adsMain && !adPlaced) mainHtml.unshift(adsMain);

    const cover = coverFigure(n, prefix);
    const style = ["hero", "magazine", "doc"].indexOf(String(n.layout && n.layout.style)) >= 0 ? n.layout.style : "hero";
    const coverMode = ["hero", "boxed", "banner", "none"].indexOf(String(n.layout && n.layout.cover)) >= 0 ? n.layout.cover : "hero";
    const showSide = !(n.layout && n.layout.sidebar === "off");

    /* کاور در بالاترین بخش — مدرن و تمام‌عرض با گوشه‌های نرم */
    const topCover =
      coverMode !== "none"
        ? `<div class="ap-topcover"><div class="container">${cover || `<figure class="ap-cover ap-cover--art">${heroArt(n)}</figure>`}</div></div>`
        : "";

    /* موقعیت موبایل تبلیغات از روی بلوک «ads» در جریان بلوک‌ها تعیین می‌شود؛
       دسکتاپ همیشه از بنر نوار کنار (annAdsSide) استفاده می‌کند */
    const calLinks = calendarLinks(n, url);
    const headInner = `
        <nav class="ap-crumbs" aria-label="مسیر صفحه">
          <a href="${prefix}index.html">خانه</a><span class="ap-crumb-sep" aria-hidden="true">/</span>
          <a href="${prefix}ettelaieh.html">اطلاعیه‌ها</a><span class="ap-crumb-sep" aria-hidden="true">/</span>
          <span aria-current="page">${esc(String(n.title || "").slice(0, 46))}${String(n.title || "").length > 46 ? "…" : ""}</span>
        </nav>
        ${chipRow(n, org, st)}
        <h1 class="ap-title">${esc(n.title || "")}</h1>
        ${n.summary ? `<p class="ap-lead">${esc(n.summary)}</p>` : ""}
        ${metaLine(n)}
        ${cta || calLinks ? `<div class="ap-actions">
          ${cta ? btn(cta) : ""}
          ${calLinks}
        </div>` : ""}`;

    const head = `<header class="ap-head"><div class="container">${headInner}</div></header>`;

    const sourceRow = n.source && (n.source.name || n.source.link)
      ? `<p class="ap-source">${ico("link", "ap-i-sm")} منبع: ${
          n.source.link ? `<a href="${escA(n.source.link)}" target="_blank" rel="noopener">${esc(n.source.name || n.source.link)}</a>` : esc(n.source.name)
        }</p>`
      : "";

    const contactRow = n.contact && (n.contact.name || n.contact.phone || n.contact.telegram || n.contact.email)
      ? `<section class="ap-block ap-contact-card">
          <h2 class="ap-block-h"><span class="ap-block-hi">${ico("users", "ap-block-ico")}</span>راه‌های ارتباطی</h2>
          <ul class="ap-contact">
            ${n.contact.name ? `<li>${ico("info", "ap-i-sm")} ${esc(n.contact.name)}</li>` : ""}
            ${n.contact.phone ? `<li>${ico("phone", "ap-i-sm")} <a href="tel:${escA(telHref(n.contact.phone))}" dir="ltr">${esc(n.contact.phone)}</a></li>` : ""}
            ${n.contact.email ? `<li>${ico("mail", "ap-i-sm")} <a href="mailto:${escA(n.contact.email)}" dir="ltr">${esc(n.contact.email)}</a></li>` : ""}
            ${n.contact.telegram ? `<li>${icoFill("telegram", "ap-i-sm")} <a href="${escA(tgHref(/^https?:/.test(n.contact.telegram) ? n.contact.telegram : "https://t.me/" + String(n.contact.telegram).replace(/^@/, "")))}" target="_blank" rel="noopener" dir="ltr">${esc(n.contact.telegram)}</a></li>` : ""}
          </ul>
        </section>`
      : "";

    const tocCard = (toc) => `
      <section class="ap-card ap-card--toc" data-ap-toc aria-label="فهرست مطالب">
        <h2 class="ap-card-h">${ico("spark", "ap-card-i")} فهرست مطالب</h2>
        <ul class="ap-toc">
          ${toc.map((t) => `<li><a href="#${t.id}" data-ap-toc-link><span class="ap-toc-arrow" aria-hidden="true"></span>${esc(t.text)}</a></li>`).join("")}
        </ul>
        <span class="ap-toc-bar"><i data-ap-toc-progress aria-hidden="true"></i></span>
      </section>`;

    const aside = showSide
      ? `<aside class="ap-side" aria-label="اطلاعات جانبی اطلاعیه">
          ${toc.length > 1 ? tocCard(toc) : ""}
          ${annAdsSide}
          ${sideKeyFacts(n, org, st)}
          ${sideOrg(n, org)}
          ${sideShare(url, n.title || "")}
          ${sideHtml.join("\n          ")}
        </aside>`
      : "";

    /* اگر نوار کنار خاموش باشد، بلوک‌های کناری در جریان اصلی می‌آیند تا محتوا گم نشود */
    if (!showSide && sideHtml.length) mainHtml.push(`<div class="ap-side-inline">${sideHtml.join("")}</div>`);

    const body = `
  <main class="ap" data-ap-layout="${esc(style)}">
    <div class="ap-readbar" aria-hidden="true"><span data-ap-progress></span></div>
    ${topCover}
    ${head}
    <div class="ap-body">
      ${toc.length > 1 ? `<nav class="ap-toc-rail" data-ap-toc aria-label="فهرست مطالب">
        <span class="ap-toc-rail-label">مطالب این اطلاعیه</span>
        ${toc.map((t) => `<a href="#${t.id}" data-ap-toc-link class="ap-toc-chip">${esc(t.text)}</a>`).join("")}
      </nav>` : ""}
      <div class="container ap-grid${showSide ? "" : " is-single"}">
        <article class="ap-main">
          ${mainHtml.join("\n          ")}
          ${sourceRow}
          ${contactRow}
          <a class="ap-back" href="${prefix}ettelaieh.html">${ico("arrow", "ap-back-i")} بازگشت به فهرست اطلاعیه‌ها</a>
          ${related(n, org, 3)}
        </article>
        ${aside}
      </div>
    </div>
    <div class="ap-mobilebar">
      ${cta ? `<a class="ap-mb-cta" href="${escA(cta.href)}"${cta.external ? ' target="_blank" rel="noopener"' : ""}>${ico(cta.ico === "telegram" ? "bell" : "bolt", "ap-i-sm")} ${esc(cta.label)}</a>` : ""}
      <button type="button" class="ap-mb-btn" data-ap-native data-ap-url="${escA(url)}" data-ap-title="${escA(n.title || "")}" aria-label="اشتراک‌گذاری">${ico("share", "ap-i-sm")}</button>
      <button type="button" class="ap-mb-btn" data-ap-copy="${escA(url)}" aria-label="کپی نشانی">${ico("copy", "ap-i-sm")}</button>
      <button type="button" class="ap-mb-btn" data-ap-top aria-label="بازگشت به بالا">${ico("top", "ap-i-sm")}</button>
    </div>
    <button type="button" class="ap-top" data-ap-top aria-label="بازگشت به بالای صفحه">${ico("top", "ap-i-sm")}</button>
    <div class="ap-lightbox" data-ap-lightbox hidden>
      <button type="button" class="ap-lb-close" data-ap-lb-close aria-label="بستن">✕</button>
      <button type="button" class="ap-lb-nav is-prev" data-ap-lb-prev aria-label="تصویر بعدی">${ico("chev", "ap-lb-i")}</button>
      <figure class="ap-lb-stage"><img data-ap-lb-img alt="" decoding="async"><figcaption data-ap-lb-cap hidden></figcaption></figure>
      <button type="button" class="ap-lb-nav is-next" data-ap-lb-next aria-label="تصویر قبلی">${ico("chev", "ap-lb-i")}</button>
      <div class="ap-lb-count" data-ap-lb-count aria-hidden="true"></div>
    </div>
    <div class="ap-toast" data-ap-toast role="status" aria-live="polite" hidden></div>
  </main>`;

    /* تزریق متادیتای سئو + دارایی‌های اختصاصی همین قالب در <head> */
    const openBase = ctx.openFor ? ctx.openFor(prefix) : ctx.open;
    const closeBase = ctx.closeFor ? ctx.closeFor(prefix) : ctx.close;
    const openN = openBase.replace(
      "</head>",
      `  <link rel="stylesheet" href="${prefix}assets/css/ann.css?v=${escA(assetVer)}">\n  ${headExtras(n, org, url, toc)}\n</head>`
    );
    const closeN = closeBase.replace(
      "</body>",
      `  <script src="${prefix}assets/js/ann.js?v=${escA(assetVer)}" defer></script>\n</body>`
    );

    return ctx.assemble(
      openN,
      esc(n.seo && n.seo.title ? n.seo.title : n.title || "") + " | اطلاعیه\u200cهای پلتفرم",
      esc(n.seo && n.seo.description ? n.seo.description : n.summary || ""),
      renderHeaderN(prefix),
      [body],
      renderFooterN(prefix),
      closeN
    );
  }

  /* =============== قالب صفحهٔ دورهٔ آموزشی (پوشهٔ amoozesh/) ===============
     ترکیبی از قالب اطلاعیه (هیرو، نوار کنار، بلوک‌های قابل‌چینش) و الگوی
     وبینارهای ایسمینار (کارت بلیت/ثبت‌نام، سرفصل‌های زمان‌بندی‌شده، مخاطبین).
     داده‌ها از بلوک‌های داشبورد (blocks) ساخته می‌شود؛ فیلدهای تختِ قدیمی هم
     پشتیبانی می‌شوند تا صفحه بدون بلوک خالی نماند. */

  /* لینک ثبت‌نام: URL بیرونی یا صفحهٔ داخلی؛ اگر لینک همان فهرست بود به کانال ثبت‌نام برمی‌گردد */
  function courseRegister(c) {
    const rawLink = safeLink(c.link);
    if (rawLink && !/^\.?\/?amoozesh\.html$/i.test(rawLink)) {
      if (ABS_URI.test(rawLink)) {
        return { label: "ثبت‌نام و رزرو دوره", href: tgHref(rawLink), style: "gold", external: true, ico: "telegram" };
      }
      return { label: "ثبت‌نام و رزرو دوره", href: "../" + rawLink.replace(/^\.\//, ""), style: "gold", external: false, ico: "" };
    }
    return { label: "ثبت‌نام و رزرو دوره", href: TELE_URL, style: "gold", external: true, ico: "telegram" };
  }

  /* بلوک‌های خودکار وقتی دوره بلوک محتوایی ندارد (مثل اطلاعیه) */
  function courseAutoBlocks(c) {
    const raw = (Array.isArray(c.blocks) ? c.blocks : []).filter((b) => b && b.type);
    const real = raw.filter((b) => b.type !== "ads");
    if (real.length) return raw;
    const auto = [];
    if (String(c.body || "").trim()) auto.push({ type: "text", heading: "دربارهٔ دوره", markdown: c.body });
    else if (String(c.summary || "").trim()) auto.push({ type: "text", heading: "دربارهٔ دوره", markdown: c.summary });
    const facts = [];
    if (c.teacher) facts.push({ label: "مدرس", value: c.teacher });
    if (c.start_label) facts.push({ label: "شروع دوره", value: c.start_label });
    if (c.duration_label || c.lessons) facts.push({ label: "مدت / ساختار", value: c.duration_label || c.lessons });
    if (c.platform_label) facts.push({ label: "محل برگزاری", value: c.platform_label });
    if (c.organizer) facts.push({ label: "برگزارکننده", value: c.organizer });
    if (c.code) facts.push({ label: "کد دوره", value: c.code });
    if (facts.length) auto.push({ type: "facts", heading: "اطلاعات کلیدی دوره", items: facts });
    if (String(c.price || "").trim())
      auto.push({ type: "notice", title: "هزینهٔ ثبت‌نام", text: c.price === "رایگان" ? "شرکت در این دوره رایگان است." : "برای اطلاع از هزینهٔ نهایی و نحوهٔ پرداخت با پشتیبانی در تماس باشید.", tone: c.price === "رایگان" ? "success" : "info" });
    return auto;
  }

  function courseFactRows(c) {
    const rows = [];
    const row = (icon, label, val, href) => {
      if (!val) return "";
      return `<li><span class="ap-kf-ico">${ico(icon, "ap-i-sm")}</span><span class="ap-kf-l">${esc(label)}</span><span class="ap-kf-v">${href ? `<a href="${escA(href)}"${ABS_URI.test(href) ? ' target="_blank" rel="noopener"' : ""}>${esc(val)}</a>` : esc(val)}</span></li>`;
    };
    row("users", "مدرس", c.teacher, c.teacher_link || "");
    row("calendar", "شروع دوره", c.start_label, "");
    row("clock", "مدت / ساختار", c.duration_label || c.lessons, "");
    row("monitor", "محل برگزاری", c.platform_label, "");
    row("spark", "برگزارکننده", c.organizer, "");
    row("tag", "کد دوره", c.code, "");
    row("money", "هزینه", c.price || "رایگان", c.link && ABS_URI.test(c.link) ? c.link : "");
    return rows.join("");
  }

  function courseTeacherCard(c, prefix) {
    if (!c.teacher) return "";
    return `<section class="ap-card cp-teacher-card">
        <h2 class="ap-card-h">${ico("users", "ap-card-i")} مدرس دوره</h2>
        ${bTeacher({ name: c.teacher, role: c.teacher_role, image: c.teacher_image, bio: c.teacher_bio, link: c.teacher_link, kicker: "مدرس دوره" }, prefix)}
      </section>`;
  }

  function courseRelatedCard(c) {
    const href = c._slug + ".html";
    const img = pickImage(c);
    const media = img
      ? `<span class="cp-rel-media"><img src="${escA(srcUrl(img, "../"))}" alt="" loading="lazy"></span>`
      : `<span class="cp-rel-media is-art">${esc(c.icon || "🎓")}</span>`;
    return `<a class="cp-rel" href="${escA(href)}">
        ${media}
        <span class="cp-rel-body">
          <span class="cp-rel-cat">${esc(c.category || "دوره")}</span>
          <b>${esc(c.title)}</b>
          <small>${esc(c.price || "رایگان")}</small>
        </span>
      </a>`;
  }

  function courseRelated(c, limit) {
    const tags = Array.isArray(c.hashtags) ? c.hashtags : [];
    const pool = allCourses.filter((x) => x._slug !== c._slug);
    const scored = pool
      .map((x) => {
        let s = 0;
        if (x.category && x.category === c.category) s += 2;
        (Array.isArray(x.hashtags) ? x.hashtags : []).forEach((t) => {
          if (tags.includes(t)) s += 1;
        });
        return { x, s };
      })
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s || (a.x.sort || 0) - (b.x.sort || 0))
      .slice(0, limit);
    if (!scored.length) return "";
    return `<section class="ap-related cp-related">
        <h2 class="ap-related-h">${ico("layers", "ap-i-sm")} دوره‌های مرتبط</h2>
        <div class="ap-related-grid">${scored.map((r) => courseRelatedCard(r.x)).join("\n          ")}</div>
      </section>`;
  }

  function courseHeadExtras(c, url, toc) {
    const title = (c.seo && c.seo.title) || c.title || "";
    const desc = (c.seo && c.seo.description) || c.summary || "";
    const img = (c.seo && c.seo.image) || pickImage(c);
    const ogImg = img ? (ABS_URI.test(img) ? img : absUrl(img)) : absUrl("assets/images/SVG/logo.svg");
    const canonical = (c.seo && c.seo.canonical) || url;
    const tags = Array.isArray(c.hashtags) ? c.hashtags.filter(Boolean) : [];
    const metas = [
      `<link rel="canonical" href="${escA(canonical)}">`,
      c.seo && c.seo.noindex ? `<meta name="robots" content="noindex, follow">` : `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">`,
      `<meta property="og:type" content="article">`,
      `<meta property="og:locale" content="fa_IR">`,
      `<meta property="og:site_name" content="${escA(BRAND)}">`,
      `<meta property="og:title" content="${escA(title)}">`,
      `<meta property="og:description" content="${escA(desc)}">`,
      `<meta property="og:url" content="${escA(canonical)}">`,
      `<meta property="og:image" content="${escA(ogImg)}">`,
      `<meta property="og:image:alt" content="${escA(title)}">`,
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:title" content="${escA(title)}">`,
      `<meta name="twitter:description" content="${escA(desc)}">`,
      `<meta name="twitter:image" content="${escA(ogImg)}">`
    ];
    if (c.category) metas.push(`<meta property="article:section" content="${escA(c.category)}">`);
    tags.slice(0, 8).forEach((t) => metas.push(`<meta property="article:tag" content="${escA(t)}">`));

    const graph = [];
    const free = /رایگان/i.test(String(c.price || ""));
    const courseSchema = {
      "@context": "https://schema.org",
      "@type": "Course",
      name: title,
      description: desc,
      url: canonical,
      image: ogImg,
      provider: { "@type": "Organization", name: BRAND, url: SITE_URL },
      offers: {
        "@type": "Offer",
        price: free ? "0" : String(c.price || "").replace(/[^0-9.]/g, "") || "0",
        priceCurrency: "IRR",
        availability: "https://schema.org/PreOrder"
      }
    };
    if (c.teacher) courseSchema.creator = { "@type": "Person", name: c.teacher };
    if (c.start_date) {
      courseSchema.hasCourseInstance = {
        "@type": "CourseInstance",
        courseMode: "online",
        startDate: c.start_date,
        endDate: c.end_date || undefined,
        location: c.platform_label ? { "@type": "Place", name: c.platform_label } : { "@type": "VirtualLocation", url: canonical }
      };
    }
    graph.push(courseSchema);

    const faqItems = [];
    const addFaq = (f) => {
      if (!f || !f.q) return;
      if (!faqItems.some((x) => String(x.q) === String(f.q))) faqItems.push(f);
    };
    (Array.isArray(c.blocks) ? c.blocks : []).forEach((b) => {
      if (b && b.type === "faq" && Array.isArray(b.items)) b.items.forEach(addFaq);
    });
    (Array.isArray(c.faq) ? c.faq : []).forEach(addFaq);
    if (faqItems.length) {
      graph.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a || "" }
        }))
      });
    }
    if (toc.length > 1) {
      graph.push({
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "بخش‌های " + String(title),
        itemListElement: toc.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: t.text,
          url: canonical + "#" + t.id
        }))
      });
    }
    return metas.join("\n  ") + "\n  " + graph.map(jsonLd).join("\n  ");
  }

  function renderCoursePage(c) {
    const prefix = "../";
    const slug = encodeURI(c._slug || "");
    const url = absUrl("amoozesh/" + slug + ".html");
    const toc = [];

    const adsSlots = ads && ads.show_courses !== false ? adsMarkup(ads) : "";
    const courseAdsSide = adsSlots ? `<div class="ap-ads ap-ads--side">${adsSlots}</div>` : "";
    const adsMain = adsSlots ? `<div class="ap-ads ap-ads--inline">${adsSlots}</div>` : "";

    const register = courseRegister(c);
    const price = String(c.price || "رایگان").trim();

    const chips = [];
    chips.push(hashChips(Array.isArray(c.hashtags) && c.hashtags.length ? c.hashtags : []));

    const metaItems = [];
    const m = (icon, label, val) => (val ? `<span class="cp-meta-item">${ico(icon, "ap-i-sm")}<b>${esc(label)}:</b> ${esc(val)}</span>` : "");
    metaItems.push(m("users", "مدرس", c.teacher));
    metaItems.push(m("calendar", "شروع", c.start_label));
    metaItems.push(m("clock", "مدت", c.duration_label || c.lessons));
    metaItems.push(m("monitor", "محل برگزاری", c.platform_label));
    metaItems.push(m("spark", "برگزارکننده", c.organizer));
    metaItems.push(m("tag", "کد دوره", c.code));

    const detbarCells = [];
    const det = (icon, label, val) => (val ? `<span class="cp-det"><span class="cp-det-ico">${ico(icon)}</span><span><b>${esc(label)}</b><i>${esc(val)}</i></span></span>` : "");
    detbarCells.push(det("clock", "مدت / جلسات", c.duration_label || c.lessons));
    detbarCells.push(det("money", "هزینه", price));
    detbarCells.push(det("users", "مدرس", c.teacher));

    const artBg = c.cover_a || c.cover_b ? ` style="--cp-a:${escA(c.cover_a || "#001840")};--cp-b:${escA(c.cover_b || "#102A71")}"` : "";
    const img = pickImage(c);
    const heroMedia = img
      ? `<figure class="cp-hero-media">
          <button type="button" class="cp-hero-media-box" data-ap-gal="hero" data-src="${escA(srcUrl(img, prefix))}" data-cap="${escA(c.title || "")}" aria-label="بزرگ‌نمایی تصویر دوره">
            ${figImg(img, prefix, c.title || "", "cp-hero-media-img", true)}
          </button>
        </figure>`
      : `<figure class="cp-hero-media">
          <span class="cp-hero-media-box is-art"${artBg}><span class="ap-art-emoji cp-art-emoji">${esc(c.icon || "🎓")}</span></span>
        </figure>`;

    const headInner = `
        <nav class="ap-crumbs" aria-label="مسیر صفحه">
          <a href="${prefix}index.html">خانه</a><span class="ap-crumb-sep" aria-hidden="true">/</span>
          <a href="${prefix}amoozesh.html">آموزش‌های مجازی</a><span class="ap-crumb-sep" aria-hidden="true">/</span>
          <span aria-current="page">${esc(String(c.title || "").slice(0, 46))}${String(c.title || "").length > 46 ? "…" : ""}</span>
        </nav>
        <div class="cp-hero">
          <div class="cp-hero-info">
            ${chips.length ? `<div class="ap-chips">${chips.join("\n          ")}</div>` : ""}
            <h1 class="ap-title cp-title">${esc(c.title || "")}</h1>
            ${c.subtitle ? `<p class="cp-subtitle">${esc(c.subtitle)}</p>` : ""}
            ${c.summary ? `<p class="ap-lead">${esc(c.summary)}</p>` : ""}
            ${metaItems.length ? `<div class="cp-meta">${metaItems.join("\n          ")}</div>` : ""}
            ${register ? `<div class="ap-actions">
              ${btn(register)}
              ${`<a class="ap-back cp-hero-back" href="${prefix}amoozesh.html">${ico("arrow", "ap-back-i")} همهٔ دوره‌ها</a>`}
            </div>` : ""}
          </div>
          ${heroMedia}
        </div>`;

    const head = `<header class="ap-head cp-head"><div class="container">${headInner}</div></header>`;

    const detbar = detbarCells.filter(Boolean).length
      ? `<div class="cp-detbar"><div class="container"><div class="cp-detbar-in">${detbarCells.join("")}</div></div></div>`
      : "";

    const tocCard = (toc) => `
      <section class="ap-card ap-card--toc" data-ap-toc aria-label="فهرست مطالب">
        <h2 class="ap-card-h">${ico("spark", "ap-card-i")} فهرست مطالب</h2>
        <ul class="ap-toc">
          ${toc.map((t) => `<li><a href="#${t.id}" data-ap-toc-link><span class="ap-toc-arrow" aria-hidden="true"></span>${esc(t.text)}</a></li>`).join("")}
        </ul>
        <span class="ap-toc-bar"><i data-ap-toc-progress aria-hidden="true"></i></span>
      </section>`;

    const ticketThumb = img
      ? `<span class="cp-ticket-media"><img src="${escA(srcUrl(img, prefix))}" alt="" loading="lazy"></span>`
      : `<span class="cp-ticket-media is-art"${artBg}>${esc(c.icon || "🎓")}</span>`;

    const ticket = `<section class="cp-ticket">
        ${ticketThumb}
        <div class="cp-ticket-head">
          <span class="cp-ticket-cat">${esc(c.category || "دوره")}</span>
          <b class="cp-ticket-price">${esc(price)}</b>
        </div>
        <ul class="cp-ticket-facts">
          ${c.start_label ? `<li>${ico("calendar", "ap-i-sm")} ${esc(c.start_label)}</li>` : ""}
          ${(c.duration_label || c.lessons) ? `<li>${ico("clock", "ap-i-sm")} ${esc(c.duration_label || c.lessons)}</li>` : ""}
          ${c.platform_label ? `<li>${ico("monitor", "ap-i-sm")} ${esc(c.platform_label)}</li>` : ""}
          ${c.organizer ? `<li>${ico("spark", "ap-i-sm")} ${esc(c.organizer)}</li>` : ""}
        </ul>
        ${register ? btn(register, "cp-ticket-cta") : ""}
        <a class="cp-ticket-back" href="${prefix}amoozesh.html">→ بازگشت به فهرست دوره‌ها</a>
      </section>`;

    const factsCard = `<section class="ap-card ap-card--facts">
        <h2 class="ap-card-h">${ico("layers", "ap-card-i")} اطلاعات دوره</h2>
        <ul class="ap-kf">${courseFactRows(c)}</ul>
      </section>`;

    /* ---------- چیدمان بلوک‌محور دو ستونه ----------
       ستون اصلی از blocks_main و نوار کنار از blocks_side ساخته می‌شود.
       بلوک‌های سیستمی (s-*) اجزای ثابت نوار کنار را به‌همراه بلوک‌های محتوایی
       در همان لیست قرار می‌دهند تا ترتیب آن‌ها از داشبورد قابل جانمایی باشد. */
    const SYSTEM = { ticket, toc: () => (toc.length > 1 ? tocCard(toc) : ""), ads: courseAdsSide, facts: factsCard, teacher: courseTeacherCard(c, prefix), share: sideShare(url, c.title || "") };
    const defaultSide = () => [{ type: "s-ticket" }, { type: "s-toc" }, { type: "s-ads" }, { type: "s-facts" }, { type: "s-teacher" }, { type: "s-share" }];

    const legacy = (Array.isArray(c.blocks) ? c.blocks : []).filter((b) => b && b.type);
    const hasNew = Array.isArray(c.blocks_main) || Array.isArray(c.blocks_side);
    let mainRaw, sideRaw;
    if (hasNew) {
      mainRaw = (Array.isArray(c.blocks_main) ? c.blocks_main : []).filter((b) => b && b.type);
      const side = (Array.isArray(c.blocks_side) ? c.blocks_side : []).filter((b) => b && b.type);
      sideRaw = side.length ? side : defaultSide();
    } else if (legacy.some((b) => b.type !== "ads")) {
      const sideTeacher = legacy.some((b) => b.type === "teacher" && b.place === "side");
      mainRaw = legacy.filter((b) => b.type !== "ads" && b.place !== "side");
      const def = defaultSide().filter((s) => !(sideTeacher && s.type === "s-teacher"));
      sideRaw = [...def, ...legacy.filter((b) => b.place === "side" && b.type !== "ads")];
    } else {
      mainRaw = courseAutoBlocks(c);
      sideRaw = defaultSide();
    }

    const mainTokens = [];
    const sideTokens = [];
    let adPlaced = false;
    let bid = 0;
    const emit = (b, target) => {
      if (b.type === "ads") {
        if (target === "main") {
          if (adsMain && !adPlaced) {
            mainTokens.push(adsMain);
            adPlaced = true;
          }
        } else if (courseAdsSide) sideTokens.push(courseAdsSide);
        return;
      }
      if (b.type.indexOf("s-") === 0 && Object.prototype.hasOwnProperty.call(SYSTEM, b.type.slice(2))) {
        const markup = b.type === "s-toc" ? { toc: true } : SYSTEM[b.type.slice(2)];
        if (markup === "" || markup === null || markup === undefined) return;
        (target === "side" ? sideTokens : mainTokens).push(markup);
        return;
      }
      const r = renderBlock({ ...b, place: target }, bid++, { prefix, n: c, cover: pickImage(c), toc });
      if (typeof r.html === "object" && r.html) {
        (target === "side" ? sideTokens : mainTokens).push(r.html.section);
        if (r.html.entry) toc.push(r.html.entry);
      } else if (typeof r.html === "string" && r.html) {
        (target === "side" ? sideTokens : mainTokens).push(r.html);
      }
      if (r.toc && r.toc.length) toc.push(...r.toc);
    };
    mainRaw.forEach((b) => emit(b, "main"));
    sideRaw.forEach((b) => emit(b, "side"));
    if (adsMain && !adPlaced) mainTokens.push(adsMain);

    const resolve = (t) => (typeof t === "object" && t && t.toc ? (toc.length > 1 ? tocCard(toc) : "") : t);
    const mainHtml = mainTokens.map(resolve).filter(Boolean);
    const sideHtml = sideTokens.map(resolve).filter(Boolean);

    const aside = `<aside class="ap-side" aria-label="اطلاعات جانبی دوره">
          ${sideHtml.join("\n          ")}
        </aside>`;

    const body = `
  <main class="ap" data-ap-layout="course">
    <div class="ap-readbar" aria-hidden="true"><span data-ap-progress></span></div>
    ${head}
    ${detbar}
    <div class="ap-body">
      ${toc.length > 1 ? `<nav class="ap-toc-rail" data-ap-toc aria-label="فهرست مطالب">
        <span class="ap-toc-rail-label">مطالب این دوره</span>
        ${toc.map((t) => `<a href="#${t.id}" data-ap-toc-link class="ap-toc-chip">${esc(t.text)}</a>`).join("")}
      </nav>` : ""}
      <div class="container ap-grid">
        <article class="ap-main">
          ${mainHtml.join("\n          ")}
          ${courseRelated(c, 3)}
          <a class="ap-back" href="${prefix}amoozesh.html">${ico("arrow", "ap-back-i")} بازگشت به فهرست دوره‌ها</a>
        </article>
        ${aside}
      </div>
    </div>
    <div class="ap-mobilebar">
      ${register ? `<a class="ap-mb-cta" href="${escA(register.href)}"${register.external ? ' target="_blank" rel="noopener"' : ""}>${ico(register.ico === "telegram" ? "bell" : "bolt", "ap-i-sm")} ${esc(register.label)}</a>` : ""}
      <button type="button" class="ap-mb-btn" data-ap-native data-ap-url="${escA(url)}" data-ap-title="${escA(c.title || "")}" aria-label="اشتراک‌گذاری">${ico("share", "ap-i-sm")}</button>
      <button type="button" class="ap-mb-btn" data-ap-copy="${escA(url)}" aria-label="کپی نشانی">${ico("copy", "ap-i-sm")}</button>
      <button type="button" class="ap-mb-btn" data-ap-top aria-label="بازگشت به بالا">${ico("top", "ap-i-sm")}</button>
    </div>
    <button type="button" class="ap-top" data-ap-top aria-label="بازگشت به بالای صفحه">${ico("top", "ap-i-sm")}</button>
    <div class="ap-lightbox" data-ap-lightbox hidden>
      <button type="button" class="ap-lb-close" data-ap-lb-close aria-label="بستن">✕</button>
      <button type="button" class="ap-lb-nav is-prev" data-ap-lb-prev aria-label="تصویر بعدی">${ico("chev", "ap-lb-i")}</button>
      <figure class="ap-lb-stage"><img data-ap-lb-img alt="" decoding="async"><figcaption data-ap-lb-cap hidden></figcaption></figure>
      <button type="button" class="ap-lb-nav is-next" data-ap-lb-next aria-label="تصویر قبلی">${ico("chev", "ap-lb-i")}</button>
      <div class="ap-lb-count" data-ap-lb-count aria-hidden="true"></div>
    </div>
    <div class="ap-toast" data-ap-toast role="status" aria-live="polite" hidden></div>
  </main>`;

    const openBase = ctx.openFor ? ctx.openFor(prefix) : ctx.open;
    const closeBase = ctx.closeFor ? ctx.closeFor(prefix) : ctx.close;
    const openN = openBase.replace(
      "</head>",
      `  <link rel="stylesheet" href="${prefix}assets/css/ann.css?v=${escA(assetVer)}">\n  ${courseHeadExtras(c, url, toc)}\n</head>`
    );
    const closeN = closeBase.replace(
      "</body>",
      `  <script src="${prefix}assets/js/ann.js?v=${escA(assetVer)}" defer></script>\n</body>`
    );

    return ctx.assemble(
      openN,
      esc(c.seo && c.seo.title ? c.seo.title : c.title || "") + " | آموزش\u200cهای مجازی",
      esc(c.seo && c.seo.description ? c.seo.description : c.summary || ""),
      renderHeaderN(prefix),
      [body],
      renderFooterN(prefix),
      closeN
    );
  }

  /* مسیر تصویر محتواییِ امن (آپلود داخلی یا URL بیرونی) */
  function safeMedia(v) {
    const s = String(v || "").trim();
    if (!s) return "";
    if (ABS_URI.test(s)) return /^https?:/i.test(s) || /^data:image\//i.test(s) ? s : "";
    const rel = s.replace(/^\.\//, "");
    return fs.existsSync(path.join(ROOT, rel)) ? s : "";
  }

  return { renderAnnPage, renderCoursePage };
};
