/*
 * Producer script — generates profile pages, list pages, and shared parts.
 * Reads CMS-managed content from ./content
 * Run: node build/build.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CONTENT = path.join(ROOT, "content");
const KANON_DIR = path.join(ROOT, "kanonha");
const ANJOMAN_DIR = path.join(ROOT, "anjomanha");

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const site = readJson(path.join(CONTENT, "site.json"));
const home = readJson(path.join(CONTENT, "home.json"));

/* نسخهٔ دارایی‌ها: با هر دیپلوی، URL سیاس/جی‌اس عوض می‌شود تا کش مرورگر باطل شود */
let ASSET_VER;
try {
  ASSET_VER = require("child_process")
    .execSync("git rev-parse --short HEAD")
    .toString()
    .trim();
} catch (_) {
  ASSET_VER = Date.now().toString(36);
}

function loadFolder(folder) {
  const dir = path.join(CONTENT, folder);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson(path.join(dir, f)))
    .filter((it) => it.active !== false)
    .sort((a, b) => (a.sort || 0) - (b.sort || 0));
}

const kanonha = loadFolder("kanonha");
const anjomanha = loadFolder("anjomanha");

/* اطلاعیه‌ها از «بخش اطلاعیهٔ اصلی» (content/news) — هر پروفایل خبرهای خودش را
   از همین منبع می‌گیرد تا دسته‌بندی و محتوا همیشه زیر نظر تنظیمات اصلی بماند. */
const allNews = fs
  .readdirSync(path.join(CONTENT, "news"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => {
    const it = readJson(path.join(CONTENT, "news", f));
    it._slug = it.slug || path.basename(f, ".json");
    return it;
  })
  .filter((it) => it.active !== false)
  .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
const newsForOrg = (slug, orgKind) =>
  allNews.filter((n) => {
    const key = orgKind === "anjoman" ? n.anjoman : n.kanon;
    return key && key === slug;
  });

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const TELE_URL = site.telegram_url || "https://t.me/PlatformSem";
const ABS_URI = /^(https?:|mailto:|tel:)/i;
const teleSafe = (t) => (t && ABS_URI.test(t) ? t : "");
const teleSvg = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L6.74 13.3 2.64 12c-.88-.25-.89-.86.2-1.3L20.03 4.7c.73-.33 1.43.18 1.15 1.3l-3.7 17.42c-.25 1.16-.95 1.44-1.92.9l-5.29-3.9-2.55 2.2c-.29.28-.53.46-1.1.46l.32-4.9z"/></svg>`;

/* لوگو/نشان جایگزین مشترک با صفحات فهرست */
const { escA, orgLogo, orgImage, newsOrg } = require("./org");

const navLinks = (prefix) =>
  site.nav
    .map(
      (n) =>
        `<li><a href="${href(n.link, prefix)}">${esc(n.label)}</a></li>`
    )
    .join("\n          ");

const mmLinks = (prefix) =>
  site.nav
    .map((n) => `<a href="${href(n.link, prefix)}">${esc(n.label)}</a>`)
    .join("\n        ");

const href = (link, prefix) => {
  const l = esc(link);
  if (/^(https?:|mailto:|tel:)/.test(link)) return l;
  return prefix + l;
};

const footLinks = (list, prefix) =>
  list
    .map(
      (n) => `<li><a href="${href(n.link, prefix)}">${esc(n.label)}</a></li>`
    )
    .join("\n            ");

function renderHeader(prefix) {
  return `
  <header class="site-header">
    <div class="container">
      <nav class="nav">
        <a class="brand" href="${prefix}index.html">
          <img class="brand-logo" src="${prefix}assets/images/SVG/logo.svg" alt="لوگوی پلتفرم دانشگاه سمنان">
          <span class="brand-name"><strong>${esc(site.brand_name)}</strong><span>${esc(site.brand_tagline)}</span></span>
        </a>
        <ul class="nav-links">
          ${navLinks(prefix)}
        </ul>
        <button class="nav-bell notif-bell" type="button" aria-label="اعلان‌ها" aria-pressed="false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </button>
        <a class="btn btn-navy btn-sm nav-cta" href="${esc(site.cta.link)}" target="_blank" rel="noopener">${esc(site.cta.label)}</a>
        <button class="burger" aria-label="باز کردن منو"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>
      </nav>
    </div>
  </header>

  <div class="mobile-menu">
    <div class="mm-backdrop"></div>
    <aside class="mm-panel">
      <div class="mm-head">
        <div class="brand"><img class="brand-logo" src="${prefix}assets/images/SVG/logo.svg" alt="لوگوی پلتفرم دانشگاه سمنان"><span class="brand-name"><strong>${esc(site.brand_name)}</strong></span></div>
        <button class="mm-close" aria-label="بستن">✕</button>
      </div>
      <div class="mm-links">
        <button class="mm-notif notif-bell" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span class="notif-label">فعال کردن اعلان</span>
        </button>
        ${mmLinks(prefix)}
      </div>
    </aside>
  </div>`;
}

function renderFooter(prefix) {
  const f = site.footer;
  return `
  <footer class="site-footer">
    <div class="container">
      <div class="foot-grid">
        <div class="foot-col foot-brand-col">
          <div class="foot-brand">
            <img class="brand-logo foot-logo" src="${prefix}assets/images/SVG/logo.svg" alt="لوگوی پلتفرم دانشگاه سمنان">
            <div><strong>${esc(site.brand_name)}</strong><span>${esc(f.slogan)}</span></div>
          </div>
          <p>${esc(f.about)}</p>
          <a class="foot-tele" href="${esc(TELE_URL)}" target="_blank" rel="noopener">${teleSvg} کانال تلگرام پلتفرم</a>
        </div>
        <div class="foot-col">
          <h4>${esc(f.quick_title)}</h4>
          <ul>
            ${footLinks(f.quick, prefix)}
          </ul>
        </div>
        <div class="foot-col">
          <h4>${esc(f.services_title)}</h4>
          <ul>
            ${footLinks(f.services, prefix)}
          </ul>
        </div>
      </div>
      <div class="foot-bottom">
        <div>© ${new Date().getFullYear()} <b>${esc(site.brand_name)}</b> — تمامی حقوق محفوظ است.</div>
        <div>${esc(f.right_text)}</div>
      </div>
    </div>
  </footer>`;
}

function pageSkeleton(prefix, title, bodyExtra, desc) {
  const meta = (desc ? String(desc).replace(/\s+/g, " ").trim().slice(0, 160) : "") || `${title} — ${site.brand_name}`;
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)} | ${esc(site.brand_name)}</title>
  <meta name="description" content="${escA(meta)}">
  <link rel="stylesheet" href="${prefix}assets/css/style.css?v=${ASSET_VER}">
</head>
<body>
${bodyExtra}
<script src="${prefix}assets/js/main.js?v=${ASSET_VER}"></script>
</body>
</html>`;
}

/* ---------- Moving announcement ticker (below hero) ---------- */
function renderMarquee() {
  const items = home.ticker && home.ticker.length ? home.ticker : [];
  const item = (it) =>
    `<div class="ticker-item"><span class="tt-ico">${esc(it.icon || "✦")}</span>${it.label ? `<b>${esc(it.label)}:</b>` : ""} ${esc(it.text)}</div>`;
  const half = items.map(item).join("");
  const full = half + half;
  return `
  <div class="ticker" dir="ltr" aria-label="اطلاعیه‌های متحرک">
    <div class="ticker-track">${full}</div>
  </div>`;
}

/* ---------- آیکن‌های درون‌خطی قالب پروفایل تشکل‌ها ---------- */
const OP_ICONS = {
  chat: '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12z"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h11v18H6a2 2 0 0 0-2 2z"/><path d="M8 7h6M8 11h6"/>',
  flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3"/>',
  doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  trophy: '<path d="M8 4h8v4a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 3M16 6h3a3 3 0 0 1-3 3M10 20h4M12 12v8"/>',
  art: '<path d="M12 21a9 9 0 1 1 9-9c0 2-1.5 3-3.2 3H16a2 2 0 0 0-1.4 3.4A1.9 1.9 0 0 1 12 21z"/><circle cx="8" cy="11" r="1.3"/><circle cx="11" cy="7.5" r="1.3"/><circle cx="15.5" cy="8.5" r="1.3"/>',
  pin: '<path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/>',
  ball: '<circle cx="12" cy="12" r="9"/><path d="M12 3c3 3 3 15 0 18M3 12c3 3 15 3 18 0"/>',
  heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
  rocket: '<path d="M12 3c3 2 5 6 5 10l-3 3H10l-3-3c0-4 2-8 5-10z"/><path d="M9 16l-2 4 4-2M15 16l2 4-4-2"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 5.5a3.2 3.2 0 0 1 0 6.4M21.5 20a6.5 6.5 0 0 0-4.5-6.1"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 22l5-2.5L17 22l-1.5-8"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.6"/><path d="M21 16l-5-5-9 9"/>',
  arrow: '<path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>',
  chev: '<path d="M6 9l6 6 6-6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/><path d="M11 8v6M8 11h6"/>'
};
const opIco = (name, cls) =>
  `<svg class="${cls || "op-ico"}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${OP_ICONS[name] || OP_ICONS.spark}</svg>`;

/* آیکن فعالیت بر پایهٔ کلیدواژه — صرفاً تزئینی، بدون افزودن دادهٔ ساختگی */
const ACT_ICON_RULES = [
  [/(پادکست|رادیو|تیزر|رسانه|مصاحبه|گویند|صدا|ضبط)/, "mic"],
  [/(کارگاه|ورکشاپ|آموزش|دوره|کلاس|تدریس)/, "book"],
  [/(نشست|سمینار|همایش|گفتگو|گفت‌وگو|پنل|سخنرانی|میزگرد)/, "chat"],
  [/(پژوهش|تحقیق|مقاله|پروژه|آزمایش|علمی)/, "flask"],
  [/(انتشار|نشریه|مجله|کتاب|جزوه|خبرنامه)/, "doc"],
  [/(مسابقه|رقابت|المپیاد|جشنواره|تورنمنت|لیگ)/, "trophy"],
  [/(نمایش|تئاتر|اجرا|کنسرت|موسیقی|هنر|نقاشی|عکس|فیلم|خطاطی|خوشنویس)/, "art"],
  [/(بازدید|اردو|سفر|گردش|طبیعت|کوه)/, "pin"],
  [/(ورزش|بازی|شطرنج|فوتسال|والیبال)/, "ball"],
  [/(کمک|خیر|داوطلب|محیط|سلامت|امداد)/, "heart"],
  [/(کسب|کارآفرین|استارتاپ|مهارت|شغل)/, "rocket"]
];
const pickActIcon = (title) => {
  const t = String(title || "");
  for (const [re, name] of ACT_ICON_RULES) if (re.test(t)) return name;
  return "spark";
};

const faNum = (n) => String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);

/* دسته‌های اطلاعیه — باید با گزینه‌های «بخش اطلاعیهٔ اصلی» در admin/config.yml یکی باشد */
const NEWS_CATEGORIES = ["جدید", "رویداد", "فراخوان", "اطلاع‌رسانی", "دوره", "خبر", "تخفیف"];
const CAT_EMOJI = { "دوره": "🎓", "رویداد": "🗓", "فراخوان": "📣", "اطلاع‌رسانی": "✉", "جدید": "✨", "خبر": "📰", "تخفیف": "🎟" };

/* بازهٔ «ماه اخیر» — ۳۰ روزِ منتهی به لحظهٔ ساخت سایت */
const LAST_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const isRecent = (n) => new Date(n.date || 0).getTime() >= Date.now() - LAST_MONTH_MS;

/* ---------- Profile page ----------
   قالب واحد پروفایل کانون/انجمن: هویت، معرفی، درباره، فعالیت‌ها، رویدادها،
   دوره‌ها و بخش‌های اختیاری (افتخارات/تیم/گالری) فقط وقتی داده وجود دارد. */
function renderProfile(prefix, item, kindTitle, backHref, kindShort, orgKind) {
  const tele = teleSafe(item.telegram);
  const joinHref = tele || TELE_URL;
  const joinLabel = tele ? "عضویت در مجموعه" : "پیگیری از کانال پلتفرم";
  const myNews = newsForOrg(item.slug, orgKind);
  const recentNews = myNews.filter(isRecent);
  const courseNews = myNews.filter((n) => String(n.category || "").trim() === "دوره");

  const members = (Array.isArray(item.members) ? item.members : [])
    .filter((m) => m && String(m.name || m.major || "").trim())
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "fa"));
  /* مسئولین — همان اعضایی که «مقام» دارند؛ نفر اول همیشه «دبیر» است */
  const officials = members
    .filter((m) => String(m.post || "").trim())
    .sort((a, b) => {
      const da = String(a.post || "").trim() === "دبیر" ? 0 : 1;
      const db = String(b.post || "").trim() === "دبیر" ? 0 : 1;
      return da - db || String(a.name || "").localeCompare(String(b.name || ""), "fa");
    });
  const gallery = (Array.isArray(item.gallery) ? item.gallery : [])
    .map((g) => (g && typeof g === "object" ? g : { image: g }))
    .filter((g) => g && String(g.image || "").trim());
  const aboutLong = String(item.desc || "").length > 420;

  const secHead = (ico, id, title, extra) =>
    `<header class="op-sec-head"><span class="op-sec-ico">${opIco(ico)}</span><h2 id="${id}">${esc(title)}</h2>${extra || ""}</header>`;
  const count = (n, label) => `<span class="op-sec-count">${faNum(n)} ${esc(label)}</span>`;

  const newsHref = (n) => `${prefix}ettelaieh/${escA(n._slug || "")}.html`;

  /* ردیف آرشیو/دوره — برگرفته از بخش اطلاعیهٔ اصلی؛ دسته‌ها همان تنظیمات داشبورد است */
  const archiveItem = (n) => `<li class="op-news-item">
                <a class="op-news-link" href="${newsHref(n)}">
                  <span class="op-news-chip">${esc(n.category || "خبر")}</span>
                  <span class="op-news-txt">${esc(n.title)}</span>
                  <time class="op-news-date" data-date="${escA(n.date || "")}"></time>
                </a>
              </li>`;

  /* فلش کارت «فعالیت‌های ماه اخیر» — با تصویر، به ترتیب تاریخ */
  const flashCard = (n) => {
    const img = orgImage(n.image || n.image_url, prefix, n.title || "");
    const visual = img
      ? `<span class="op-flash-img">${img}</span>`
      : `<span class="op-flash-img op-flash-ico" aria-hidden="true">${CAT_EMOJI[n.category] || "📰"}</span>`;
    return `<a class="op-flash" href="${newsHref(n)}">
                ${visual}
                <span class="op-flash-chip">${esc(n.category || "خبر")}</span>
                <span class="op-flash-txt"><b>${esc(n.title)}</b><time class="op-news-date" data-date="${escA(n.date || "")}"></time></span>
              </a>`;
  };

  const galleryImgs = gallery
    .map((g, i) => {
      const src = orgImage(g.image, prefix, `تصویر ${faNum(i + 1)} از ${item.short}`);
      return src ? { src, caption: String(g.caption || "").trim() } : null;
    })
    .filter(Boolean);

  /* آمار — «رویداد/دوره/تخفیف» از اطلاعیه‌های مجموعه و «تعداد اعضا» از جدول اعضا */
  const STAT_CATEGORIES = ["رویداد", "دوره", "تخفیف"];
  const catCounts = {};
  STAT_CATEGORIES.forEach((c) => (catCounts[c] = 0));
  myNews.forEach((n) => {
    const c = String(n.category || "").trim();
    if (c in catCounts) catCounts[c] += 1;
  });
  const statChips = [
    ...STAT_CATEGORIES.map((c) => ({ n: catCounts[c], l: c })),
    { n: members.length, l: "تعداد اعضا" }
  ];
  const statsChipsHtml = `<ul class="op-cat-chips">
              ${statChips.map((s) => `<li class="${s.n ? "" : "is-zero"}"><b>${faNum(s.n)}</b><span>${esc(s.l)}</span></li>`).join("")}
            </ul>`;
  const tocStats = `<div class="op-toc-stats">
            <h4>آمار</h4>
            ${statsChipsHtml}
          </div>`;

  /* فهرست محتوا — فقط بخش‌هایی که واقعاً در صفحه وجود دارند */
  const tocHrefs = [
    myNews.length ? ["#news", "اطلاعیه‌ها"] : null,
    courseNews.length ? ["#classes", "دوره‌ها و کارگاه‌ها"] : null,
    members.length ? ["#members", "فهرست اعضا"] : null,
    galleryImgs.length ? ["#gallery", "گالری تصاویر"] : null
  ].filter(Boolean);

  /* کارت فهرست محتوا + آمار (نوار کنار دسکتاپ) */
  const tocCard = `<div class="op-side-card">
            <h3>فهرست محتوا</h3>
            <ul class="op-toc">
              ${tocHrefs.map(([h, t]) => `<li><a href="${h}">${opIco("arrow", "op-toc-ico")} ${esc(t)}</a></li>`).join("")}
            </ul>
            ${tocStats}
          </div>`;

  /* کارت آمار نسخهٔ موبایل — تب بار جایگزین فهرست محتوا شده است */
  const statsCard = `<div class="op-side-card op-stats-card">
            <h3>آمار</h3>
            ${statsChipsHtml}
          </div>`;

  /* تب بار موبایل — هر تب فقط وقتی محتوای مربوطه وجود داشته باشد ساخته می‌شود */
  const hasActivity = recentNews.length || myNews.length || courseNews.length;
  const tabs = [
    { key: "about", label: "درباره", icon: "info", n: 0 },
    hasActivity ? { key: "activity", label: "اطلاعیه‌ها و فعالیت‌ها", icon: "spark", n: myNews.length } : null,
    members.length ? { key: "members", label: "اعضا", icon: "users", n: members.length } : null,
    galleryImgs.length ? { key: "gallery", label: "گالری تصاویر", icon: "image", n: galleryImgs.length } : null
  ].filter(Boolean);

  const tabbar = `<nav class="op-tabbar" data-op-tabbar aria-label="بخش‌های ${esc(item.short)}">
          <div class="op-tabbar-scroll">
            <div class="op-tabbar-inner" role="tablist" data-op-tabbar-inner>
              <span class="op-tabglide" data-op-tabglide aria-hidden="true"></span>
              ${tabs.map((t, i) => `<button type="button" role="tab" class="op-tabbtn${i === 0 ? " is-active" : ""}" data-op-tab-btn="${t.key}" aria-selected="${i === 0 ? "true" : "false"}">
                ${opIco(t.icon, "op-tab-ico")}<span class="op-tab-lbl">${esc(t.label)}</span>${t.n ? `<span class="op-tab-n">${faNum(t.n)}</span>` : ""}
              </button>`).join("")}
            </div>
          </div>
        </nav>`;

  /* لایت‌باکس گالری — بزرگ‌نمایی عکس به‌همراه کپشن */
  const lightbox = `<div class="op-lightbox" data-op-lightbox hidden>
          <button type="button" class="op-lb-close" data-op-lb-close aria-label="بستن گالری">✕</button>
          <button type="button" class="op-lb-nav op-lb-prev" data-op-lb-prev aria-label="تصویر قبلی">${opIco("chev", "op-lb-ico")}</button>
          <figure class="op-lb-stage">
            <img class="op-lb-img" data-op-lb-img alt="" loading="lazy" decoding="async">
            <figcaption class="op-lb-cap" data-op-lb-cap hidden></figcaption>
          </figure>
          <button type="button" class="op-lb-nav op-lb-next" data-op-lb-next aria-label="تصویر بعدی">${opIco("chev", "op-lb-ico")}</button>
        </div>`;

  const sections = [];

  sections.push(`<section class="op-sec" id="about" data-op-tab="about" aria-labelledby="op-about-h">
          ${secHead("info", "op-about-h", `درباره ${item.short}`)}
          <div class="op-sec-body">
            <p class="op-about-text${aboutLong ? " is-clamped" : ""}" id="op-about" data-op-about>${esc(item.desc)}</p>
            ${aboutLong ? `<button class="op-more" type="button" data-op-more aria-expanded="false" aria-controls="op-about"><span data-op-more-label>ادامه مطلب</span>${opIco("arrow", "op-more-ico")}</button>` : ""}
          </div>
        </section>`);

  /* اطلاعات ارتباط و عضویت — زیرِ «درباره»، بدون دکمهٔ بازگشت به فهرست */
  sections.push(`<section class="op-sec op-contact" id="contact" data-op-tab="about" aria-labelledby="op-contact-h">
          <div class="op-contact-inner">
            <div class="op-contact-txt">
              <span class="op-type">ارتباط و عضویت</span>
              <h2 id="op-contact-h">${tele ? `به ${esc(item.short)} بپیوند` : `اخبار ${esc(item.short)}`}</h2>
              <p>${tele ? `برای عضویت، اطلاع از فراخوان‌ها و همراهی با برنامه‌های ${esc(item.short)}، کانال تلگرام مجموعه را دنبال کن.` : `کانال اختصاصی ${esc(item.short)} در دسترس نیست؛ برای پیگیری اخبار از کانال پلتفرم استفاده کن.`}</p>
            </div>
            <div class="op-contact-cta">
              <a class="btn btn-gold" href="${esc(joinHref)}" target="_blank" rel="noopener">${teleSvg} ${esc(tele ? "عضویت در کانال تلگرام" : "پیگیری از کانال پلتفرم")}</a>
            </div>
          </div>
        </section>`);

  /* آمار — در نمایش موبایل داخل تب «درباره» (تب بار جایگزین فهرست محتوا شده است) */
  sections.push(`<aside class="op-side op-side-inline" data-op-tab="about" aria-label="آمار ${esc(item.short)}">${statsCard}</aside>`);

  /* فعالیت‌های ماه اخیر — فلش کارت از اطلاعیه‌های همین تشکل در بازهٔ ۳۰ روز */
  if (recentNews.length) {
    sections.push(`<section class="op-sec" id="flash" data-op-tab="activity" aria-labelledby="op-flash-h">
          ${secHead("spark", "op-flash-h", `فعالیت‌های ${item.short} در ماه اخیر`, count(recentNews.length, "فعالیت"))}
          <div class="op-sec-body"><div class="op-flash-grid">
            ${recentNews.map(flashCard).join("\n            ")}
          </div></div>
        </section>`);
  }

  /* اطلاعیه‌های همین تشکل — آرشیوِ صفحه‌بندی‌شده (۱۵ مورد در هر صفحه؛ به‌صورت همان کادر) */
  if (myNews.length) {
    sections.push(`<section class="op-sec op-archive" id="news" data-op-tab="activity" aria-labelledby="op-news-h">
          ${secHead("doc", "op-news-h", `اطلاعیه‌های ${item.short}`, count(myNews.length, "اطلاعیه"))}
          <div class="op-sec-body">
            <ul class="op-news" data-pgr data-pgr-size="7">
              ${myNews.map(archiveItem).join("\n              ")}
            </ul>
            <nav class="op-pager" data-pgr-nav hidden aria-label="صفحه‌بندی اطلاعیه‌ها"></nav>
          </div>
        </section>`);
  }

  /* دوره‌ها و کارگاه‌ها — مستقیماً به اطلاعیه‌های دستهٔ «دوره» وصل است */
  if (courseNews.length) {
    sections.push(`<section class="op-sec" id="classes" data-op-tab="activity" aria-labelledby="op-cls-h">
          ${secHead("book", "op-cls-h", "دوره‌ها و کارگاه‌ها", count(courseNews.length, "دوره"))}
          <div class="op-sec-body">
            <ul class="op-news" data-pgr data-pgr-size="3">
              ${courseNews.map(archiveItem).join("\n              ")}
            </ul>
            <nav class="op-pager" data-pgr-nav hidden aria-label="صفحه‌بندی دوره‌ها و کارگاه‌ها"></nav>
          </div>
        </section>`);
  }

  /* فهرست اعضا — دو دکمهٔ بازشونده: «اعضا» و «مسئولین» */
  if (members.length) {
    const memberRows = members.map((m, i) => {
      const t = String(m.title || "").trim();
      return `<tr>
                      <td class="op-mem-row">${faNum(i + 1)}</td>
                      <td>${esc(m.name)}</td>
                      <td>${esc(m.major)}</td>
                      <td>${t ? `<span class="op-title">${esc(t)}</span>` : `<span class="op-title is-empty">—</span>`}</td>
                    </tr>`;
    }).join("");
    const officialRows = officials.map((m) => `<tr>
                      <td>${esc(m.name)}</td>
                      <td><span class="op-post">${esc(m.post)}</span></td>
                    </tr>`).join("");
    sections.push(`<section class="op-sec" id="members" data-op-tab="members" aria-labelledby="op-mem-h">
          ${secHead("users", "op-mem-h", "فهرست اعضا", count(members.length, "نفر"))}
          <div class="op-sec-body">
            <div class="op-mem-tabs" role="tablist" aria-label="اعضا و مسئولین ${esc(item.short)}">
              <button type="button" class="op-mem-tab is-open" role="tab" aria-selected="true" aria-expanded="true" data-mem-toggle="members">
                ${opIco("users", "op-mem-tab-ico")} اعضا <span class="op-mem-badge">${faNum(members.length)}</span>
              </button>
              <button type="button" class="op-mem-tab op-mem-tab-gold" role="tab" aria-selected="false" aria-expanded="false" data-mem-toggle="officials"${officials.length ? "" : " disabled"}>
                ${opIco("award", "op-mem-tab-ico")} مسئولین${officials.length ? ` <span class="op-mem-badge">${faNum(officials.length)}</span>` : ""}
              </button>
            </div>
            <div class="op-mem-panel" data-mem-panel="members" role="tabpanel">
              <div class="op-members-scroll">
                <table class="op-members-tbl">
                  <thead>
                    <tr>
                      <th scope="col">ردیف</th>
                      <th scope="col">نام و نام خانوادگی</th>
                      <th scope="col">رشته تحصیلی</th>
                      <th scope="col">عنوان</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${memberRows}
                  </tbody>
                </table>
              </div>
            </div>
            ${officials.length ? `<div class="op-mem-panel" data-mem-panel="officials" role="tabpanel" hidden>
              <div class="op-members-scroll">
                <table class="op-members-tbl op-officials-tbl">
                  <thead>
                    <tr>
                      <th scope="col">نام و نام خانوادگی</th>
                      <th scope="col">مقام</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${officialRows}
                  </tbody>
                </table>
              </div>
            </div>` : ""}
          </div>
        </section>`);
  }

  if (galleryImgs.length) {
    sections.push(`<section class="op-sec" id="gallery" data-op-tab="gallery" aria-labelledby="op-gal-h">
          ${secHead("image", "op-gal-h", "گالری تصاویر", count(galleryImgs.length, "تصویر"))}
          <div class="op-sec-body">
            <div class="op-gallery">
              ${galleryImgs.map((g, i) => `<button type="button" class="op-gal-item" data-op-gal aria-label="بزرگ‌نمایی تصویر ${faNum(i + 1)}"${g.caption ? ` data-cap="${escA(g.caption)}"` : ""}>
                ${g.src}
                ${g.caption ? `<span class="op-gal-cap">${esc(g.caption)}</span>` : ""}
                <span class="op-gal-zoom" aria-hidden="true">${opIco("search", "op-gal-zoom-ico")}</span>
              </button>`).join("\n              ")}
            </div>
          </div>
        </section>`);
    sections.push(lightbox);
  }

  const body = `
  ${renderHeader(prefix)}
  <main>
    <section class="op-hero">
      <div class="container">
        <nav class="op-crumbs" aria-label="مسیر صفحه">
          <a href="${prefix}index.html">خانه</a><span aria-hidden="true">/</span>
          <a href="${backHref}">${esc(kindTitle)}</a><span aria-hidden="true">/</span>
          <span aria-current="page">${esc(item.name)}</span>
        </nav>
        <div class="op-hero-row">
          <span class="op-hero-logo">${orgLogo(item, prefix, "op-logo-img", "op-mono")}</span>
          <div class="op-hero-txt">
            <span class="op-type">${esc(kindShort)} · دانشگاه سمنان</span>
            <h1>${esc(item.name)}</h1>
            <p class="op-tagline">${esc(item.desc)}</p>
            <div class="op-hero-actions">
              <a class="btn btn-gold" href="${esc(joinHref)}" target="_blank" rel="noopener">${teleSvg} ${esc(joinLabel)}</a>
              ${recentNews.length ? `<a class="btn btn-outline-light" href="#flash">${opIco("arrow", "op-btn-ico")} فعالیت‌های ماه اخیر</a>` : myNews.length ? `<a class="btn btn-outline-light" href="#news">${opIco("arrow", "op-btn-ico")} اطلاعیه‌ها</a>` : ""}
            </div>
          </div>
        </div>
      </div>
    </section>
    ${renderMarquee()}

    <section class="op-body">
      <div class="container op-grid">
        <div class="op-main">
          ${tabs.length > 1 ? tabbar : ""}
          ${sections.join("\n          ")}
          <a class="back-link" href="${backHref}">${opIco("arrow", "op-back-ico")} بازگشت به فهرست ${esc(kindTitle)}</a>
        </div>
        <aside class="op-side op-side-desk" aria-label="اطلاعات تکمیلی">${tocCard}</aside>
      </div>
    </section>
  </main>
  ${renderFooter(prefix)}`;

  return pageSkeleton(prefix, item.name, body, item.desc);
}

/* ---------- List pages (kanonha / anjomanha) are rendered by index-build.js ---------- */

/* ---------- Write all ---------- */
function writeProfile(folder, it, kindTitle, backHref, kindShort, orgKind) {
  const prefix = "../";
  const file = path.join(folder, it.slug + ".html");
  fs.writeFileSync(file, renderProfile(prefix, it, kindTitle, backHref, kindShort, orgKind), "utf8");
  console.log("✔", path.relative(ROOT, file));
}

kanonha.forEach((k) => writeProfile(KANON_DIR, k, "کانون‌های فرهنگی", "../kanonha.html", "کانون فرهنگی", "kanon"));
anjomanha.forEach((a) => writeProfile(ANJOMAN_DIR, a, "انجمن‌های علمی", "../anjomanha.html", "انجمن علمی", "anjoman"));

console.log("\nتولید شد:", kanonha.length + anjomanha.length, "پروفایل");

/* ---------- Dump shared header/footer for root-level hand-built pages ---------- */
const partsDir = path.join(__dirname, "parts");
if (!fs.existsSync(partsDir)) fs.mkdirSync(partsDir);
fs.writeFileSync(path.join(partsDir, "_header.html"), renderHeader(""), "utf8");
fs.writeFileSync(path.join(partsDir, "_footer.html"), renderFooter(""), "utf8");
fs.writeFileSync(path.join(partsDir, "_marquee.html"), renderMarquee(), "utf8");
console.log("✔ parts/_header.html , parts/_footer.html , parts/_marquee.html");