/*
 * Assembles homepage + amoozesh from CMS content (./content).
 * Run: node build/build.js && node build/index-build.js
 */
const fs = require("fs");
const path = require("path");

const P = (f) => fs.readFileSync(path.join(__dirname, "parts", f), "utf8");
const ROOT = path.join(__dirname, "..");
const CONTENT = path.join(ROOT, "content");
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const home = readJson(path.join(CONTENT, "home.json"));
const site = readJson(path.join(CONTENT, "site.json"));

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const TELE_URL = (home.hero && home.hero.telegram_url) || "https://t.me/PlatformSem";
const teleSvg = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L6.74 13.3 2.64 12c-.88-.25-.89-.86.2-1.3L20.03 4.7c.73-.33 1.43.18 1.15 1.3l-3.7 17.42c-.25 1.16-.95 1.44-1.92.9l-5.29-3.9-2.55 2.2c-.29.28-.53.46-1.1.46l.32-4.9z"/></svg>`;

/* لینک ایمن: URLهای مطلق (http/https/mailto/tel) یا مسیرهای داخلیِ موجود قبول می‌شوند؛
   هر مقدار زباله (اسپیس/فارسی/ناموجود) در محتوای CMS نباید publish را بشکند → به تلگرام برمی‌گردد. */
const ABS_URI = /^(https?:|mailto:|tel:)/i;
const LOCAL_LINK = /^(#|\/?[\w.-]+\.html(?:#[A-Za-z0-9_-]*)?)/i;
const safeLink = (link) => {
  if (!link) return "";
  const s = String(link).trim();
  if (!s) return "";
  if (ABS_URI.test(s)) return s;
  if (/[\s\u0600-\u06FF]/.test(s)) return "";
  const f = s.replace(/^\.\//, "").split(/[?#]/)[0];
  if (!f || fs.existsSync(path.join(ROOT, f))) return s;
  return "";
};
const linkOrDefault = (link) => safeLink(link) || TELE_URL;
const imageOrNull = (img) =>
  img && (ABS_URI.test(img) || fs.existsSync(path.join(ROOT, img))) ? img : "";

/* ---------- قالب‌های هدر/فوتر با پیشوند مسیر (برای صفحه‌های داخل پوشه) ---------- */
const hrefN = (link, prefix) => {
  const l = esc(link);
  if (ABS_URI.test(link)) return l;
  return prefix + l;
};

function renderHeaderN(prefix) {
  const nav = (site.nav || []).map(
    (x) => `<li><a href="${hrefN(x.link, prefix)}">${esc(x.label)}</a></li>`
  ).join("\n          ");
  const mm = (site.nav || []).map(
    (x) => `<a href="${hrefN(x.link, prefix)}">${esc(x.label)}</a>`
  ).join("\n        ");
  return `
  <header class="site-header">
    <div class="container">
      <nav class="nav">
        <a class="brand" href="${prefix}index.html">
          <img class="brand-logo" src="${prefix}assets/images/SVG/logo.svg" alt="لوگوی پلتفرم دانشگاه سمنان">
          <span class="brand-name"><strong>${esc(site.brand_name)}</strong><span>${esc(site.brand_tagline)}</span></span>
        </a>
        <ul class="nav-links">
          ${nav}
        </ul>
        <a class="btn btn-navy btn-sm nav-cta" href="${esc((site.cta && site.cta.link) || "https://t.me/PlatformSem")}" target="_blank" rel="noopener">${esc((site.cta && site.cta.label) || "ورود به کانال پلتفرم")}</a>
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
        ${mm}
      </div>
    </aside>
  </div>`;
}

function renderFooterN(prefix) {
  const f = site.footer || {};
  const footLinks = (list) => (list || []).map(
    (x) => `<li><a href="${hrefN(x.link, prefix)}">${esc(x.label)}</a></li>`
  ).join("\n            ");
  const teleUrl = site.telegram_url || "https://t.me/PlatformSem";
  return `
  <footer class="site-footer">
    <div class="container">
      <div class="foot-grid">
        <div class="foot-col foot-brand-col">
          <div class="foot-brand">
            <img class="brand-logo foot-logo" src="${prefix}assets/images/SVG/logo.svg" alt="لوگوی پلتفرم دانشگاه سمنان">
            <div><strong>${esc(site.brand_name)}</strong><span>${esc(f.slogan || "")}</span></div>
          </div>
          <p>${esc(f.about || "")}</p>
          <a class="foot-tele" href="${esc(teleUrl)}" target="_blank" rel="noopener">${teleSvg} کانال تلگرام پلتفرم</a>
        </div>
        <div class="foot-col">
          <h4>${esc(f.quick_title || "دسترسی سریع")}</h4>
          <ul>
            ${footLinks(f.quick)}
          </ul>
        </div>
        <div class="foot-col">
          <h4>${esc(f.services_title || "خدمات پلتفرم")}</h4>
          <ul>
            ${footLinks(f.services)}
          </ul>
        </div>
      </div>
      <div class="foot-bottom">
        <div>© ${new Date().getFullYear()} <b>${esc(site.brand_name)}</b> — تمامی حقوق محفوظ است.</div>
        <div>${esc(f.right_text || "")}</div>
      </div>
    </div>
  </footer>`;
}

/* ---------- تبدیل Markdown سبک به HTML (برای متن کامل اطلاعیه‌ها) ---------- */
function mdToHtml(src) {
  if (!src) return "";
  const lines = String(src).replace(/\r\n/g, "\n").split("\n");
  let out = "";
  let para = [];
  let list = [];
  let inList = false;
  const flushPara = () => {
    if (para.length) {
      const txt = para.join("<br>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
      out += "<p>" + txt + "</p>";
      para = [];
    }
  };
  const flushList = () => {
    if (inList) {
      out += "<ul>" + list.map((li) => "<li>" + li.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>") + "</li>").join("") + "</ul>";
      list = [];
      inList = false;
    }
  };
  lines.forEach((raw) => {
    const line = raw.replace(/\r$/, "");
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      flushList(); flushPara();
      const lvl = Math.min(h[1].length + 1, 4);
      out += `<h${lvl}>${esc(h[2])}</h${lvl}>`;
      return;
    }
    const b = line.match(/^[-*]\s+(.*)$/);
    if (b) {
      flushPara();
      if (!inList) { inList = true; }
      list.push(esc(b[1]));
      return;
    }
    if (/^\s*$/.test(line)) {
      flushList(); flushPara();
      return;
    }
    flushList();
    para.push(esc(line));
  });
  flushList(); flushPara();
  return out;
}

function loadFolder(folder, includeInactive) {
  const dir = path.join(CONTENT, folder);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const it = readJson(path.join(dir, f));
      const base = path.basename(f, ".json");
      it._slug = it.slug || base || "item";
      return it;
    })
    .filter((it) => includeInactive || it.active !== false)
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

function assemble(open, title, desc, header, bodyParts, footer, close) {
  return (
    open
      .replace("<!--TITLE-->", "<title>" + title + "</title>")
      .replace("<!--DESC-->", desc)
      .replace("<!--HEADER-->", header) +
    bodyParts.join("\n") +
    footer +
    "\n" +
    close
  );
}

/* ---------- HERO ---------- */
function renderHero(h) {
  const stats = h.stats.map(
    (s) => `<div class="hs"><b>${esc(s.number)}</b><span>${esc(s.label)}</span></div>`
  ).join("\n              ");
  const cards = h.card_items.map((c) =>
    `<a class="hc-item hc-link" href="${esc(c.link)}">
                <span class="hc-ico${c.tone ? " " + esc(c.tone) : ""}">${c.icon}</span>
                <div class="hc-txt"><b>${esc(c.title)}</b><span>${esc(c.subtitle)}</span></div>
              </a>`
  ).join("\n              ");
  return `<!-- HERO -->
    <section class="hero">
      <span class="hero-blob b1"></span>
      <span class="hero-blob b2"></span>
      <span class="hero-blob b3"></span>
      <div class="container">
        <div class="hero-layout">
          <div class="hero-main">
            <span class="hero-badge">${esc(h.badge)}</span>
            <h1>${esc(h.title_before)}<span class="hl">${esc(h.title_highlight)}</span></h1>
            <hr class="hero-sep">
            <p class="lead">${esc(h.lead)}</p>
            <div class="hero-cta">
              <a class="btn btn-tele" href="${esc(TELE_URL)}" target="_blank" rel="noopener">${teleSvg} ${esc(h.cta_tele_text)}</a>
            </div>
            <div class="hero-stats">
              ${stats}
            </div>
          </div>
          <div class="hero-visual">
            <div class="hero-card">
              ${cards}
              <div class="hc-bar"><i style="width:100%"></i></div>
            </div>
            <a class="hero-float f1" href="${esc(h.float1.link)}"><span>${h.float1.icon}</span>${esc(h.float1.text)}</a>
            <a class="hero-float f2" href="${esc(h.float2.link)}"><span>${h.float2.icon}</span>${esc(h.float2.text)}</a>
          </div>
        </div>
      </div>
    </section>`;
}

/* ---------- ADS ---------- */
function renderAds(a) {
  const slots = [];
  if (a.slot1 && a.slot1.active !== false) {
    slots.push(`<a class="ad-slot" href="${esc(a.slot1.link)}" target="_blank" rel="noopener" aria-label="فضای تبلیغاتی ۱">
            <img class="ad-slot-img" src="${esc(a.slot1.image)}" alt="فضای تبلیغاتی شمارهٔ ۱" loading="lazy">
          </a>`);
  }
  if (a.slot2 && a.slot2.active !== false) {
    slots.push(`<a class="ad-slot" href="${esc(a.slot2.link)}" target="_blank" rel="noopener" aria-label="فضای تبلیغاتی ۲">
            <img class="ad-slot-img" src="${esc(a.slot2.image)}" alt="فضای تبلیغاتی شمارهٔ ۲" loading="lazy">
          </a>`);
  }
  if (!slots.length) return "";
  return `<!-- ADS BANNERS -->
    <section class="ads" id="ads">
      <div class="container">
        <div class="ad-slots reveal">
          ${slots.join("\n          ")}
        </div>
        <div class="ad-reserve">
          <a class="btn btn-gold" href="${esc(a.reserve.link)}" target="_blank" rel="noopener">${teleSvg} ${esc(a.reserve.label)}</a>
        </div>
      </div>
    </section>`;
}

/* ---------- NEWS ---------- */
const NEWS_BANNERS = {
  "دوره": {
    color: "#102A71",
    svg: `<rect width="96" height="64" rx="10" fill="#102A71"/>
                <g stroke="#FFDC5F" stroke-width="1.6">
                  <rect x="56" y="12" width="28" height="28" rx="6"/>
                  <path d="M63 16v20M70 16v20M63 26h14"/>
                </g>
                <g stroke="#FFFDF0" stroke-width="1.6">
                  <path d="M14 26h30M14 34h30M14 42h22"/>
                </g>
                <circle cx="78" cy="50" r="4" fill="#FFDC5F"/>
                <circle cx="66" cy="50" r="4" fill="#FFFDF0" fill-opacity=".7"/>
                <circle cx="20" cy="54" r="3" fill="#FFDC5F" fill-opacity=".8"/>`
  },
  "رویداد": {
    color: "#001840",
    svg: `<rect width="96" height="64" rx="10" fill="#001840"/>
                <g fill="#FFDC5F">
                  <circle cx="48" cy="30" r="10"/>
                  <rect x="44" y="40" width="8" height="12" rx="3"/>
                  <path d="M18 24h60M34 10l-6 14M62 10l6 14"/>
                </g>
                <g fill="#FFFDF0" fill-opacity=".85">
                  <circle cx="30" cy="30" r="6"/>
                  <circle cx="66" cy="30" r="6"/>
                  <rect x="27" y="36" width="6" height="10" rx="3"/>
                  <rect x="63" y="36" width="6" height="10" rx="3"/>
                </g>`
  },
  "فراخوان": {
    color: "#1b3a8b",
    svg: `<rect width="96" height="64" rx="10" fill="#1b3a8b"/>
                <g stroke="#FFDC5F" stroke-width="2" fill="none">
                  <path d="M26 12l-10 20 10 20h44l10-20-10-20z"/>
                </g>
                <g stroke="#FFFDF0" stroke-width="2" fill="none">
                  <path d="M31 18l-7 14 7 14h34l7-14-7-14z"/>
                </g>
                <g fill="#FFDC5F">
                  <circle cx="48" cy="32" r="10"/>
                  <path d="M48 26l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"/>
                </g>`
  }
};
const NEWS_BANNER_DEFAULT = {
  color: "#102A71",
  svg: `<rect width="96" height="64" rx="10" fill="#102A71"/>
                <rect width="96" height="64" rx="10" fill="url(#ng1)" fill-opacity=".25"/>
                <g fill="#FFDC5F">
                  <rect x="30" y="20" width="36" height="5" rx="2.5"/>
                  <rect x="30" y="30" width="26" height="5" rx="2.5"/>
                  <circle cx="30" cy="42" r="5"/>
                </g>
                <g stroke="#FFDC5F" stroke-width="1.4">
                  <path d="M14 34l8 8 12-14"/>
                  <path d="M70 30l6 6 8-10"/>
                </g>`
};

/* ---------- کارت اطلاعیه (مشترک بین صفحهٔ اصلی و صفحهٔ همهٔ اطلاعیه‌ها) ---------- */
const newsCard = (n) => {
  const ban = NEWS_BANNERS[n.category] || NEWS_BANNER_DEFAULT;
  const img = imageOrNull(n.image);
  const banner = img
    ? `<div class="n-banner" style="--ban:${ban.color}">
              <img class="n-img" src="${esc(img)}" alt="${esc(n.title)}" loading="lazy">
            </div>`
    : `<div class="n-banner" style="--ban:${ban.color}">
              <svg viewBox="0 0 96 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                ${ban.svg}
              </svg>
            </div>`;
  const chip = `<span class="n-chip-svg"><span class="n-chip">${esc(n.category || "خبر")}</span></span>`;
  const depth = "ettelaieh/" + n._slug + ".html";
  const dateHtml = n.date
    ? `<div class="n-meta"><span class="n-date" data-date="${esc(n.date)}"></span></div>`
    : "";
  return `<article class="n-card reveal">
            ${banner.replace("</div>", chip + "</div>")}
            <div class="n-body">
              <h3>${esc(n.title)}</h3>
              ${dateHtml}
              <p>${esc(n.summary)}</p>
              <a class="btn btn-navy btn-sm n-more" href="${depth}">اطلاعات بیشتر ←</a>
            </div>
          </article>`;
};

/* ---------- کارت اطلاعیهٔ کوچک اسلایدر (به سبک webinarCard سایت eseminar) ---------- */
const NEWS_PAIRS = {
  "دوره": ["#102A71", "#1b3a8b"],
  "رویداد": ["#001840", "#0a2266"],
  "فراخوان": ["#1b3a8b", "#0a1f54"],
  "اطلاع‌رسانی": ["#17328f", "#102A71"],
  "جدید": ["#244da0", "#102A71"]
};
const newsSlide = (n) => {
  const pair = NEWS_PAIRS[n.category] || ["#102A71", "#17328f"];
  const img = imageOrNull(n.image);
  const coverInner = img
    ? `<img class="wc-img" src="${esc(img)}" alt="${esc(n.title)}" loading="lazy">`
    : "";
  const depth = "ettelaieh/" + n._slug + ".html";
  return `<article class="wcard reveal">
            <a class="wc-cover" href="${depth}" style="--c1:${pair[0]};--c2:${pair[1]}">
              ${coverInner}
              <span class="wc-chip">${esc(n.category || "خبر")}</span>
            </a>
            <div class="wc-body">
              <h3><a href="${depth}">${esc(n.title)}</a></h3>
              <p class="wc-sum">${esc(n.summary)}</p>
            </div>
            <div class="wc-foot">
              <span class="wc-date" data-date="${esc(n.date || "")}"></span>
              <a class="wc-more" href="${depth}">جزئیات ←</a>
            </div>
          </article>`;
};

function renderNews(head, newsList) {
  if (!newsList.length) return "";
  const slides = newsList.map((n) => newsSlide(n)).join("\n          ");
  return `<!-- NEWS -->
    <section class="section news" id="news">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">${esc(head.eyebrow)}</span>
          <h2>${esc(head.title)}</h2>
          <p>${esc(head.subtitle)}</p>
          <div class="section-head-actions">
            <a class="btn btn-navy btn-sm news-all" href="ettelaieh.html">مشاهده همه اطلاعیه‌ها ←</a>
          </div>
        </div>
      </div>
      <div class="news-stage" data-stage>
        <button class="ns-arw prev" type="button" aria-label="اسلاید قبلی">→</button>
        <div class="news-scroller" data-scroller>
          ${slides}
        </div>
        <button class="ns-arw next" type="button" aria-label="اسلاید بعدی">←</button>
      </div>
    </section>`;
}

/* ---------- اسلایدر آموزش‌های مجازی (به سبک es-home-page-slide-show سایت eseminar) ---------- */
const courseSlide = (c) => {
  const link = linkOrDefault(c.link);
  const name = c.teacher || "مدرس دوره";
  const initial = esc(name.trim().charAt(0));
  return `<article class="cslide reveal">
            <div class="cs-card">
              <a class="cs-media" href="${link}" style="--c1:${esc(c.cover_a || "#102A71")};--c2:${esc(c.cover_b || "#1b3a8b")}" aria-label="${esc(c.title)}">
                <span class="cs-chip">${esc(c.category || "دوره")}</span>
                <span class="cs-emoji" aria-hidden="true">${esc(c.icon || "🎓")}</span>
              </a>
              <div class="cs-content">
                <div class="cs-top">
                  <h3><a href="${link}">${esc(c.title)}</a></h3>
                  <div class="cs-teacher">
                    <span class="cs-avatar" aria-hidden="true">${initial}</span>
                    <span class="cs-teacher-name">${name}</span>
                  </div>
                  <p class="cs-sum">${esc(c.summary || "")}</p>
                </div>
                <div class="cs-bottom">
                  <div class="cs-meta">
                    <span class="cs-lessons">▸ ${esc(c.lessons || "")}</span>
                    <span class="cs-price">${esc(c.price || "رایگان")}</span>
                  </div>
                  <a class="btn btn-gold btn-sm cs-cta" href="${link}">ثبت‌نام دوره ←</a>
                </div>
              </div>
            </div>
          </article>`;
};

function renderCourses(head, courseList) {
  if (!courseList.length) return "";
  const slides = courseList.map((c) => courseSlide(c)).join("\n        ");
  const allLink = linkOrDefault(head.cta && head.cta.link);
  const allLabel = (head.cta && head.cta.label) || "همه دوره‌ها";
  return `<!-- COURSES -->
    <section class="section courses" id="courses">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">${esc(head.eyebrow)}</span>
          <h2>${esc(head.title)}</h2>
          <p>${esc(head.subtitle)}</p>
          <div class="section-head-actions">
            <a class="btn btn-navy btn-sm" href="${allLink}">${esc(allLabel)} ←</a>
          </div>
        </div>
        <div class="course-stage" data-stage>
          <button class="cs-arw prev" type="button" aria-label="دورهٔ قبلی">→</button>
          <div class="course-track" data-scroller>
            ${slides}
          </div>
          <button class="cs-arw next" type="button" aria-label="دورهٔ بعدی">←</button>
        </div>
      </div>
    </section>`;
}

/* ---------- صفحهٔ فهرست اطلاعیه‌ها (همهٔ اطلاعیه‌ها با چیدمان کارت مثل صفحهٔ اصلی) ---------- */
function renderAnnListPage(newsList) {
  const cards = newsList.map((n) => newsCard(n)).join("\n        ");
  const body = [
    `<main>
      <section class="page-hero">
        <div class="container">
          <div class="crumbs"><a href="index.html">خانه</a><span class="sep">/</span>اطلاعیه‌ها</div>
          <h1>اطلاعیه‌های پلتفرم</h1>
          <p>همه فراخوان‌ها، دوره‌ها و رویدادهای دانشگاه؛ جدیدترین‌ها اول.</p>
        </div>
      </section>
      <section class="section" style="padding-top:0">
        <div class="container">
          <div class="news-grid">
            ${cards}
          </div>
        </div>
      </section>
    </main>`
  ];
return assemble(
    open,
    " اطلاعیه\u200cهای پلتفرم | " + site.brand_name,
    "همه اطلاعیه\u200cها و اخبار پلتفرم دانشگاه سمنان؛ به ترتیب تاریخ، جدیدترین\u200cها اول.",
    header,
    body,
    footer,
    close
  );
}

/* ---------- صفحهٔ یک اطلاعیه (پوشهٔ ettelaieh/) ---------- */
function renderAnnPage(n) {
  const prefix = "../";
  const openN = open.replace('href="assets/css/style.css"', 'href="' + prefix + 'assets/css/style.css"');
  const closeN = close.replace('src="assets/js/main.js"', 'src="' + prefix + 'assets/js/main.js"');
  const headerN = renderHeaderN(prefix);
  const footerN = renderFooterN(prefix);

  const img = imageOrNull(n.image);
  const bannerImg = img
    ? `<div class="ann-img"><img src="${prefix}${esc(img)}" alt="${esc(n.title)}" loading="lazy"></div>`
    : "";
  const content = mdToHtml(n.body || "") || `<p>${esc(n.summary || "")}</p>`;

  let linkBtn = "";
  if (n.link) {
    const ext = ABS_URI.test(n.link);
    const local = LOCAL_LINK.test(n.link);
    if (ext || local) {
      const href = ext ? esc(n.link) : "../" + esc(n.link.replace(/^\.\//, ""));
      linkBtn = `<a class="btn btn-gold" href="${href}" target="_blank" rel="noopener">مشاهده در منبع ←</a>`;
    }
  }

  const body = [
    `<main>
      <section class="section ann-single">
        <div class="container ann-open">
          <article>
            <div class="crumbs">
              <a href="${prefix}index.html">خانه</a><span class="sep">/</span><a href="${prefix}ettelaieh.html">اطلاعیه‌ها</a><span class="sep">/</span>
            </div>
            <div class="ann-head">
              <span class="n-chip">${esc(n.category || "خبر")}</span>
              <span class="ann-date" data-date="${esc(n.date || "")}"></span>
            </div>
            <h1 class="ann-title">${esc(n.title)}</h1>
            ${bannerImg}
            <div class="ann-body">${content}</div>
            <div class="ann-cta">
              <a class="btn btn-navy" href="${prefix}ettelaieh.html">→ بازگشت به اطلاعیه‌ها</a>
              ${linkBtn}
            </div>
          </article>
        </div>
      </section>
    </main>`
  ];
return assemble(
    openN,
    esc(n.title) + " | اطلاعیه\u200cهای پلتفرم",
    esc(n.summary || ""),
    headerN,
    body,
    footerN,
    closeN
  );
}

/* ---------- DISCOUNTS ---------- */
function renderDiscounts(head, discountList) {
  const items0 = discountList.slice().sort((a, b) => {
    const aOff = a && a.active === false ? 1 : 0;
    const bOff = b && b.active === false ? 1 : 0;
    return aOff - bOff;
  });
  if (!items0.length) {
    return `<!-- DISCOUNTS -->
    <section class="section discounts" id="discounts">
      <div class="container">
        <div class="discount-card reveal">
          <div class="discount-art">
            <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="60" cy="60" r="50" fill="#FFDC5F" fill-opacity=".12"/>
              <g transform="translate(60 60)">
                <circle r="34" fill="#001840"/>
                <circle r="34" fill="none" stroke="#FFDC5F" stroke-opacity=".4" stroke-width="1.5" stroke-dasharray="4 5"/>
                <g fill="#FFFDF0">
                  <circle cx="-13" cy="-8" r="4"/>
                  <circle cx="13" cy="-8" r="4"/>
                </g>
                <path d="M-11 12c4-4 8-6 11-6s7 2 11 6" stroke="#FFDC5F" stroke-width="2.5" stroke-linecap="round" fill="none"/>
                <path d="M-14 3l-6-6M14 3l6-6" stroke="#FFDC5F" stroke-width="2" stroke-linecap="round"/>
              </g>
              <circle cx="96" cy="22" r="4" fill="#FFDC5F" fill-opacity=".7"/>
              <circle cx="20" cy="94" r="5" fill="#FFDC5F" fill-opacity=".5"/>
              <path d="M14 26l6 6M20 26l-6 6" stroke="#FFFDF0" stroke-opacity=".4" stroke-width="2" stroke-linecap="round"/>
              <path d="M100 96l6 6M106 96l-6 6" stroke="#FFFDF0" stroke-opacity=".4" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="discount-txt">
            <span class="eyebrow">${esc(head.eyebrow)}</span>
            <h2>${esc(head.empty_title)}</h2>
            <p>${esc(head.empty_text)}</p>
            <a class="btn btn-gold" href="${esc(head.cta.link)}" target="_blank" rel="noopener">${teleSvg} ${esc(head.cta.label)}</a>
          </div>
        </div>
      </div>
    </section>`;
  }

  const gradients = [
    "linear-gradient(135deg, #102A71, #1b3a8b 50%, #244da0)",
    "linear-gradient(135deg, #0a1f54, #102A71 60%, #162f7a)",
    "linear-gradient(135deg, #001840, #0a2266 50%, #102A71)"
  ];

  const items = items0.map((d, i) => {
    const hasLink = !!(d.link && (ABS_URI.test(d.link) || LOCAL_LINK.test(d.link)));
    const link = esc(d.link);
    const code = d.code || "";
    const grad = gradients[i % gradients.length];
    const forever = !d.expires || d.expires === "همیشگی" || d.expires === "permanent";
    const dimmed = d.active === false ? " dc-off" : "";
    const expAttr = forever ? `data-exp="permanent"` : `data-exp="${esc(d.expires)}"`;
    const more = hasLink
      ? `<a class="dc-link" href="${link}" target="_blank" rel="noopener">اطلاعات بیشتر ←</a>`
      : `<span class="dc-link dc-link-none"></span>`;

    return `<div class="dc reveal${dimmed}" ${expAttr}>
    <div class="dc-inner" style="background:${grad}">
      <div class="dc-main">
        <div class="dc-badge-row">
          <span class="dc-badge">تخفیف دانشجویی</span>
          <span class="dc-badge dc-status"></span>
        </div>
        <div class="dc-body">
          <h3 class="dc-title">${esc(d.title)}</h3>
          <p class="dc-desc">${esc(d.description || "")}</p>
        </div>
        <div class="dc-exp">
          <svg class="dc-exp-ico" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="10" cy="10" r="8"/><path d="M10 5v5l3 3"/></svg>
          <span class="dc-exp-text"></span>
        </div>
        <div class="dc-foot">
          ${more}
          <div class="dc-bar"><div class="dc-bar-fill"></div></div>
        </div>
      </div>
      <div class="dc-side">
        <div class="dc-art" aria-hidden="true">
          <svg viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="36" stroke="#FFDC5F" stroke-width="2" stroke-dasharray="6 4" opacity=".45"/><circle cx="40" cy="40" r="26" fill="#FFDC5F" fill-opacity=".1"/><text x="40" y="48" text-anchor="middle" fill="#FFDC5F" font-size="26" font-weight="800" font-family="Vazirmatn,sans-serif">%</text></svg>
        </div>
        <div class="dc-code-row">
          <div class="dc-code-box">
            <span class="dc-code-lbl">کد تخفیف</span>
            <span class="dc-code">${esc(code)}</span>
          </div>
          <button class="dc-copy" type="button" data-code="${esc(code)}" aria-label="کپی کد تخفیف" title="کپی کد">
            <svg class="dc-ci" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            <span class="dc-copied" style="display:none">✓</span>
          </button>
        </div>
      </div>
    </div>
  </div>`;
  }).join("\n        ");

  return `<!-- DISCOUNTS -->
    <section class="section discounts" id="discounts">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">${esc(head.eyebrow)}</span>
          <h2>${esc(head.title || "تخفیف‌های دانشجویی")}</h2>
          <p>${esc(head.subtitle || "کدهای تخفیف فعال دانشجویی را بگیر و کمتر هزینه کن.")}</p>
        </div>
        <div class="dc-list">${items}</div>
      </div>
    </section>`;
}

/* ---------- JOIN ---------- */
function renderJoin(j) {
  return `<!-- JOIN -->
    <section class="section join">
      <div class="container">
        <div class="join-band reveal">
          <h2>${esc(j.title)}</h2>
          <p>${esc(j.text)}</p>
          <a class="btn btn-gold" href="${esc(j.cta.link)}" target="_blank" rel="noopener">${esc(j.cta.label)}</a>
        </div>
      </div>
    </section>`;
}

/* ---------- Assemble pages ---------- */
const open = P("_open.html");
const header = P("_header.html");
const footer = P("_footer.html");
const close = P("index-99-close.html");

const newsList = loadFolder("news");
const courseList = loadFolder("courses");
const discountList = loadFolder("discounts", true);

const index = assemble(
  open,
  home.seo.title,
  home.seo.description,
  header,
  [
    renderHero(home.hero),
    P("_marquee.html"),
    renderCourses(home.courses_head, courseList),
    renderAds(home.ads),
    renderNews(home.news_head, newsList),
    renderDiscounts(home.discounts_head, discountList),
    renderJoin(home.join)
  ],
  footer,
  close
);
fs.writeFileSync(path.join(ROOT, "index.html"), index, "utf8");
console.log("✔ index.html");

const amoozesh = assemble(
  open,
  "آموزش‌های مجازی | پلتفرم دانشگاه سمنان",
  "دوره‌های آموزش مجازی و مهارتی پلتفرم دانشگاه سمنان؛ گواهی معتبر، مدرس‌های حرفه‌ای و مسیر یادگیری آسان.",
  header,
  [P("amoozesh-part.html")],
  footer,
  close
);
fs.writeFileSync(path.join(ROOT, "amoozesh.html"), amoozesh, "utf8");
console.log("✔ amoozesh.html");

/* ---------- صفحات اطلاعیه‌ها ---------- */
fs.writeFileSync(path.join(ROOT, "ettelaieh.html"), renderAnnListPage(newsList), "utf8");
console.log("✔ ettelaieh.html");

const ETT_DIR = path.join(ROOT, "ettelaieh");
fs.mkdirSync(ETT_DIR, { recursive: true });
newsList.forEach((n) => {
  const file = path.join(ETT_DIR, n._slug + ".html");
  fs.writeFileSync(file, renderAnnPage(n), "utf8");
  console.log("✔", path.relative(ROOT, file));
});
if (!newsList.length) {
  fs.writeFileSync(path.join(ETT_DIR, ".gitkeep"), "", "utf8");
}
console.log("✔ صفحات اطلاعیه:", newsList.length, "فایل");