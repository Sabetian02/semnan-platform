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
const { escA, orgLogo, orgImage } = require("./org");

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
  arrow: '<path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>'
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

/* ---------- Profile page ----------
   قالب واحد پروفایل کانون/انجمن: هویت، معرفی، درباره، فعالیت‌ها، رویدادها،
   دوره‌ها و بخش‌های اختیاری (افتخارات/تیم/گالری) فقط وقتی داده وجود دارد. */
function renderProfile(prefix, item, kindTitle, backHref, kindShort) {
  const tele = teleSafe(item.telegram);
  const joinHref = tele || TELE_URL;
  const joinLabel = tele ? "عضویت در مجموعه" : "پیگیری از کانال پلتفرم";

  const acts = (item.activities || []).filter(Boolean);
  const evs = (item.events || []).filter(Boolean);
  const cls = (item.classes || []).filter(Boolean);
  const team = (Array.isArray(item.team) ? item.team : []).filter((m) => m && (m.name || m.role));
  const awards = (Array.isArray(item.achievements) ? item.achievements : []).filter(Boolean);
  const gallery = (Array.isArray(item.gallery) ? item.gallery : []).filter(Boolean);
  const email = String(item.email || "").trim();
  const location = String(item.location || "").trim();
  const founded = String(item.founded || "").trim();
  const aboutLong = String(item.desc || "").length > 420;

  const secHead = (ico, id, title, extra) =>
    `<header class="op-sec-head"><span class="op-sec-ico">${opIco(ico)}</span><h2 id="${id}">${esc(title)}</h2>${extra || ""}</header>`;
  const count = (n, label) => `<span class="op-sec-count">${faNum(n)} ${esc(label)}</span>`;

  const sections = [];

  sections.push(`<section class="op-sec" id="about" aria-labelledby="op-about-h">
          ${secHead("info", "op-about-h", `درباره ${item.short}`)}
          <div class="op-sec-body">
            <p class="op-about-text${aboutLong ? " is-clamped" : ""}" id="op-about" data-op-about>${esc(item.desc)}</p>
            ${aboutLong ? `<button class="op-more" type="button" data-op-more aria-expanded="false" aria-controls="op-about"><span data-op-more-label>ادامه مطلب</span>${opIco("arrow", "op-more-ico")}</button>` : ""}
          </div>
        </section>`);

  if (acts.length) {
    sections.push(`<section class="op-sec" id="activities" aria-labelledby="op-act-h">
          ${secHead("spark", "op-act-h", `فعالیت‌های ${item.short}`, count(acts.length, "فعالیت"))}
          <div class="op-sec-body"><div class="op-cards">
            ${acts.map((a) => `<article class="op-act"><span class="op-act-ico">${opIco(pickActIcon(a))}</span><h3>${esc(a)}</h3></article>`).join("\n            ")}
          </div></div>
        </section>`);
  }

  if (evs.length) {
    sections.push(`<section class="op-sec" id="events" aria-labelledby="op-ev-h">
          ${secHead("calendar", "op-ev-h", "رویدادها و برنامه‌ها", count(evs.length, "رویداد"))}
          <div class="op-sec-body"><ol class="op-timeline">
            ${evs.map((e, i) => `<li class="op-ev"><span class="op-ev-no">${faNum(i + 1)}</span><h3>${esc(e)}</h3></li>`).join("\n            ")}
          </ol></div>
        </section>`);
  }

  if (cls.length) {
    sections.push(`<section class="op-sec" id="classes" aria-labelledby="op-cls-h">
          ${secHead("book", "op-cls-h", "دوره‌ها و کارگاه‌ها", count(cls.length, "دوره"))}
          <div class="op-sec-body"><ul class="op-list">
            ${cls.map((c) => `<li class="op-row"><span class="op-row-ico">${opIco("book")}</span><span class="op-row-txt">${esc(c)}</span><span class="op-row-tag">دوره</span></li>`).join("\n            ")}
          </ul></div>
        </section>`);
  }

  if (awards.length) {
    sections.push(`<section class="op-sec" id="achievements" aria-labelledby="op-aw-h">
          ${secHead("award", "op-aw-h", "افتخارات و دستاوردها", count(awards.length, "مورد"))}
          <div class="op-sec-body"><ul class="op-awards">
            ${awards.map((a) => `<li>${opIco("award")}<span>${esc(a)}</span></li>`).join("\n            ")}
          </ul></div>
        </section>`);
  }

  if (team.length) {
    sections.push(`<section class="op-sec" id="team" aria-labelledby="op-team-h">
          ${secHead("users", "op-team-h", `اعضای ${item.short}`, count(team.length, "نفر"))}
          <div class="op-sec-body"><div class="op-team">
            ${team
              .map((m) => {
                const photo = m.photo ? orgImage(m.photo, prefix, m.name || "") : "";
                return `<article class="op-person"><span class="op-person-av">${photo || opIco("users", "op-person-ico")}</span><h3>${esc(m.name || "")}</h3><span>${esc(m.role || "")}</span></article>`;
              })
              .join("\n            ")}
          </div></div>
        </section>`);
  }

  const galleryImgs = gallery.map((g) => orgImage(g, prefix, `تصویر از ${item.short}`)).filter(Boolean);
  if (galleryImgs.length) {
    sections.push(`<section class="op-sec" id="gallery" aria-labelledby="op-gal-h">
          ${secHead("image", "op-gal-h", "گالری تصاویر", count(galleryImgs.length, "تصویر"))}
          <div class="op-sec-body"><div class="op-gallery">${galleryImgs.join("\n            ")}</div></div>
        </section>`);
  }

  const contactList = [];
  if (email) contactList.push(`<li>${opIco("mail")}<a href="mailto:${escA(email)}">${esc(email)}</a></li>`);
  if (location) contactList.push(`<li>${opIco("pin")}<span>${esc(location)}</span></li>`);

  sections.push(`<section class="op-sec op-contact" id="contact" aria-labelledby="op-contact-h">
          <div class="op-contact-inner">
            <div class="op-contact-txt">
              <span class="op-type">ارتباط و عضویت</span>
              <h2 id="op-contact-h">${tele ? `به ${esc(item.short)} بپیوند` : `اخبار ${esc(item.short)}`}</h2>
              <p>${tele ? `برای عضویت، اطلاع از فراخوان‌ها و همراهی با برنامه‌های ${esc(item.short)}، کانال تلگرام مجموعه را دنبال کن.` : `کانال اختصاصی ${esc(item.short)} در دسترس نیست؛ برای پیگیری اخبار از کانال پلتفرم استفاده کن.`}</p>
              ${contactList.length ? `<ul class="op-contact-list">${contactList.join("")}</ul>` : ""}
            </div>
            <div class="op-contact-cta">
              <a class="btn btn-gold" href="${esc(joinHref)}" target="_blank" rel="noopener">${teleSvg} ${esc(tele ? "عضویت در کانال تلگرام" : "پیگیری از کانال پلتفرم")}</a>
              <a class="btn btn-outline-light" href="${backHref}">${opIco("arrow", "op-btn-ico")} همهٔ ${esc(kindTitle)}</a>
            </div>
          </div>
        </section>`);

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
              ${acts.length ? `<a class="btn btn-outline-light" href="#activities">${opIco("arrow", "op-btn-ico")} مشاهده فعالیت‌ها</a>` : ""}
            </div>
          </div>
        </div>
      </div>
    </section>
    ${renderMarquee()}

    <section class="op-body">
      <div class="container op-grid">
        <div class="op-main">
          ${sections.join("\n          ")}
          <a class="back-link" href="${backHref}">${opIco("arrow", "op-back-ico")} بازگشت به فهرست ${esc(kindTitle)}</a>
        </div>
        <aside class="op-side" aria-label="اطلاعات تکمیلی">
          <div class="op-side-card">
            <h3>در یک نگاه</h3>
            <dl class="op-facts">
              <div><dt>نوع تشکل</dt><dd>${esc(kindShort)}</dd></div>
              <div><dt>حوزه فعالیت</dt><dd>${esc(item.cat)}</dd></div>
              <div><dt>دانشگاه</dt><dd>دانشگاه سمنان</dd></div>
              ${founded ? `<div><dt>سال تأسیس</dt><dd>${esc(founded)}</dd></div>` : ""}
            </dl>
          </div>
          <div class="op-side-card">
            <h3>فهرست محتوا</h3>
            <ul class="op-stats">
              <li><b>${faNum(acts.length)}</b><span>فعالیت</span></li>
              <li><b>${faNum(evs.length)}</b><span>رویداد</span></li>
              <li><b>${faNum(cls.length)}</b><span>دوره</span></li>
            </ul>
          </div>
          <div class="op-side-card">
            <h3>مسیرهای سریع</h3>
            <ul class="op-links">
              <li><a href="${backHref}">${opIco("arrow")} فهرست ${esc(kindTitle)}</a></li>
              <li><a href="${prefix}index.html">${opIco("arrow")} صفحه اصلی پلتفرم</a></li>
              <li><a href="${prefix}amoozesh.html">${opIco("arrow")} دوره‌های آموزشی</a></li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  </main>
  ${renderFooter(prefix)}`;

  return pageSkeleton(prefix, item.name, body, item.desc);
}

/* ---------- List pages (kanonha / anjomanha) are rendered by index-build.js ---------- */

/* ---------- Write all ---------- */
function writeProfile(folder, it, kindTitle, backHref, kindShort) {
  const prefix = "../";
  const file = path.join(folder, it.slug + ".html");
  fs.writeFileSync(file, renderProfile(prefix, it, kindTitle, backHref, kindShort), "utf8");
  console.log("✔", path.relative(ROOT, file));
}

kanonha.forEach((k) => writeProfile(KANON_DIR, k, "کانون‌های فرهنگی", "../kanonha.html", "کانون فرهنگی"));
anjomanha.forEach((a) => writeProfile(ANJOMAN_DIR, a, "انجمن‌های علمی", "../anjomanha.html", "انجمن علمی"));

console.log("\nتولید شد:", kanonha.length + anjomanha.length, "پروفایل");

/* ---------- Dump shared header/footer for root-level hand-built pages ---------- */
const partsDir = path.join(__dirname, "parts");
if (!fs.existsSync(partsDir)) fs.mkdirSync(partsDir);
fs.writeFileSync(path.join(partsDir, "_header.html"), renderHeader(""), "utf8");
fs.writeFileSync(path.join(partsDir, "_footer.html"), renderFooter(""), "utf8");
fs.writeFileSync(path.join(partsDir, "_marquee.html"), renderMarquee(), "utf8");
console.log("✔ parts/_header.html , parts/_footer.html , parts/_marquee.html");