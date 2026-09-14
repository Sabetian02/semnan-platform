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

function pageSkeleton(prefix, title, bodyExtra) {
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)} | ${esc(site.brand_name)}</title>
  <meta name="description" content="${esc(title)} — ${esc(site.brand_name)}">
  <link rel="stylesheet" href="${prefix}assets/css/style.css">
</head>
<body>
${bodyExtra}
<script src="${prefix}assets/js/main.js"></script>
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

/* ---------- Profile page ---------- */
function renderProfile(prefix, item, kindTitle, backHref, backLabel) {
  const activities = (item.activities || []).map((a) => `<li>${esc(a)}</li>`).join("");
  const events = (item.events || []).map((e) => `<li>${esc(e)}</li>`).join("");
  const classes = (item.classes || []).map((c) => `<li>${esc(c)}</li>`).join("");

  const tele = teleSafe(item.telegram);

  const teleHtml = tele
    ? `<a class="ph-tele" href="${esc(tele)}" target="_blank" rel="noopener">${teleSvg} عضویت در کانال تلگرام ${tele.startsWith("https://t.me/+") ? "(دعوت)" : ""}</a>`
    : `<a class="ph-tele" href="${TELE_URL}" target="_blank" rel="noopener">${teleSvg} پیگیری از کانال پلتفرم</a>`;

  const cards = [];
  cards.push(`<div class="card"><div class="card-title"><span class="ct-ico">💬</span> درباره ${esc(item.short)}</div><p>${esc(item.desc)}</p></div>`);
  if (activities) cards.push(`<div class="card"><div class="card-title"><span class="ct-ico">🎯</span> فعالیت‌های ${esc(item.short)}</div><ul class="plist">${activities}</ul></div>`);
  if (events) cards.push(`<div class="card"><div class="card-title"><span class="ct-ico">📅</span> رویدادهای ${esc(item.short)}</div><ul class="plist">${events}</ul></div>`);
  if (classes) cards.push(`<div class="card"><div class="card-title"><span class="ct-ico">📚</span> دوره‌ها و کلاس‌های ${esc(item.short)}</div><ul class="plist">${classes}</ul></div>`);

  const body = `
  ${renderHeader(prefix)}
  <main>
    <section class="profile-head">
      <div class="container">
        <span class="ph-ico">${item.icon}</span>
        <div class="ph-info">
          <div class="crumbs"><a href="${prefix}index.html">خانه</a><span class="sep">/</span><a href="${backHref}">${esc(kindTitle)}</a></div>
          <h1>${esc(item.name)}</h1>
          <span class="ph-tag">${esc(item.cat)} · دانشگاه سمنان</span>
          <div>${teleHtml}</div>
        </div>
      </div>
    </section>
    ${renderMarquee()}

    <section class="profile-body">
      <div class="container profile-grid">
        <div>
          ${cards.join("\n          ")}
          <a class="back-link" href="${backHref}">→ بازگشت به ${esc(kindTitle)}</a>
        </div>
        <aside>
          <div class="side-card">
            <h3>کانال تلگرام ${esc(item.short)}</h3>
            <p>اخبار، فراخوان‌ها و رویدادهای ${esc(item.short)} را در کانال تلگرامش دنبال کن.</p>
            ${tele
              ? `<a class="btn btn-navy" href="${esc(tele)}" target="_blank" rel="noopener">${teleSvg} عضویت در کانال تلگرام</a>`
              : `<a class="btn btn-navy" href="${TELE_URL}" target="_blank" rel="noopener">${teleSvg} پیگیری از کانال پلتفرم</a>`}
          </div>
          <div class="side-card">
            <h3>دسترسی سریع</h3>
            <ul class="plist">
              <li><a href="${backHref}">فهرست ${esc(kindTitle)}</a></li>
              <li><a href="${prefix}index.html">صفحه اصلی پلتفرم</a></li>
              <li><a href="${prefix}amoozesh.html">آموزش‌های مجازی</a></li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  </main>
  ${renderFooter(prefix)}`;

  return pageSkeleton(prefix, item.name, body);
}

/* ---------- List page (no filter, no telegram) ---------- */
function renderListPage(prefix, items, title, subtitle, catLabel) {
  const cards = items
    .map((it) => `<a class="list-card reveal" href="${prefix}${catLabel}/${it.slug}.html">
        <span class="lc-ico">${it.icon}</span>
        <span class="lc-body"><h3>${esc(it.short)}</h3><span class="lc-cat">${esc(it.cat)}</span></span>
        <span class="lc-arrow">←</span>
      </a>`)
    .join("\n        ");

  const body = `
  ${renderHeader(prefix)}
  <main>
    <section class="page-hero">
      <div class="container">
        <div class="crumbs"><a href="${prefix}index.html">خانه</a><span class="sep">/</span>${esc(title)}</div>
        <h1>${esc(title)}</h1>
        <p>${esc(subtitle)}</p>
      </div>
    </section>
    ${renderMarquee()}
    <section class="section" style="padding-top:0">
      <div class="container">
        <div class="list-grid">${cards}</div>
      </div>
    </section>
  </main>
  ${renderFooter(prefix)}`;

  return pageSkeleton(prefix, title, body);
}

/* ---------- Write all ---------- */
function writeProfile(folder, it, kindTitle, backHref) {
  const prefix = "../";
  const file = path.join(folder, it.slug + ".html");
  fs.writeFileSync(file, renderProfile(prefix, it, kindTitle, backHref), "utf8");
  console.log("✔", path.relative(ROOT, file));
}

kanonha.forEach((k) => writeProfile(KANON_DIR, k, "کانون‌های فرهنگی", "../kanonha.html"));
anjomanha.forEach((a) => writeProfile(ANJOMAN_DIR, a, "انجمن‌های علمی", "../anjomanha.html"));

fs.writeFileSync(
  path.join(ROOT, "kanonha.html"),
  renderListPage("", kanonha, "کانون‌های فرهنگی دانشگاه سمنان", "پروفایل هر کانون را ببین، با فعالیت‌هایش آشنا شو و در کانال تلگرامش عضو شو.", "kanonha"),
  "utf8"
);
console.log("✔ kanonha.html");

fs.writeFileSync(
  path.join(ROOT, "anjomanha.html"),
  renderListPage("", anjomanha, "انجمن‌های علمی دانشگاه سمنان", "پروفایل هر انجمن را ببین، با فعالیت‌هایش آشنا شو و در کانال تلگرامش عضو شو.", "anjomanha"),
  "utf8"
);
console.log("✔ anjomanha.html");

console.log("\nتولید شد:", kanonha.length + anjomanha.length, "پروفایل + 2 صفحه فهرست");

/* ---------- Dump shared header/footer for root-level hand-built pages ---------- */
const partsDir = path.join(__dirname, "parts");
if (!fs.existsSync(partsDir)) fs.mkdirSync(partsDir);
fs.writeFileSync(path.join(partsDir, "_header.html"), renderHeader(""), "utf8");
fs.writeFileSync(path.join(partsDir, "_footer.html"), renderFooter(""), "utf8");
fs.writeFileSync(path.join(partsDir, "_marquee.html"), renderMarquee(), "utf8");
console.log("✔ parts/_header.html , parts/_footer.html , parts/_marquee.html");