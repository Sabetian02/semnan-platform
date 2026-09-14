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

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const TELE_URL = (home.hero && home.hero.telegram_url) || "https://t.me/PlatformSem";
const teleSvg = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L6.74 13.3 2.64 12c-.88-.25-.89-.86.2-1.3L20.03 4.7c.73-.33 1.43.18 1.15 1.3l-3.7 17.42c-.25 1.16-.95 1.44-1.92.9l-5.29-3.9-2.55 2.2c-.29.28-.53.46-1.1.46l.32-4.9z"/></svg>`;

/* فقط URLهای مطلق (http/https/mailto/tel) اجازه ورود دارند؛
   هر مقدار اشتباه در محتوای CMS نباید publish را بشکند — به تلگرام برمی‌گردد. */
const ABS_URI = /^(https?:|mailto:|tel:)/i;
const linkOrDefault = (link) => (link && ABS_URI.test(link) ? link : TELE_URL);
const imageOrNull = (img) =>
  img && (ABS_URI.test(img) || fs.existsSync(path.join(ROOT, img))) ? img : "";

function loadFolder(folder) {
  const dir = path.join(CONTENT, folder);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson(path.join(dir, f)))
    .filter((it) => it.active !== false)
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

function renderNews(head, newsList) {
  if (!newsList.length) return "";
  let svgId = 1;
  const cards = newsList.slice(0, 6).map((n) => {
    const ban = NEWS_BANNERS[n.category] || NEWS_BANNER_DEFAULT;
    const img = imageOrNull(n.image);
    const banner = img
      ? `<div class="n-banner" style="--ban:${ban.color}">
              <img class="n-img" src="${esc(img)}" alt="${esc(n.title)}" loading="lazy">
            </div>`
      : `<div class="n-banner" style="--ban:${ban.color}">
              <svg viewBox="0 0 96 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                ${ban.svg}
                ${svgId++ % 3 === 0 ? "" : ""}
              </svg>
            </div>`;
    const chip = `<span class="n-chip-svg"><span class="n-chip">${esc(n.category || "خبر")}</span></span>`;
    const link = esc(linkOrDefault(n.link));
    return `<article class="n-card reveal">
            ${banner.replace("</div>", chip + "</div>")}
            <div class="n-body">
              <h3>${esc(n.title)}</h3>
              <p>${esc(n.summary)}</p>
              <a class="btn btn-navy btn-sm n-more" href="${link}">اطلاعات بیشتر ←</a>
            </div>
          </article>`;
  }).join("\n          ");
  return `<!-- NEWS -->
    <section class="section" id="news">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">${esc(head.eyebrow)}</span>
          <h2>${esc(head.title)}</h2>
          <p>${esc(head.subtitle)}</p>
        </div>
        <div class="news-grid">
          ${cards}
        </div>
      </div>
    </section>`;
}

/* ---------- DISCOUNTS ---------- */
function renderDiscounts(head, discountList) {
  const active = discountList.filter((d) => d.active !== false);
  if (!active.length) {
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
  const items = active.map((d) => {
    const link = esc(linkOrDefault(d.link));
    return `<div class="discount-item reveal">
            <div class="d-txt">
              <div class="d-top"><span class="eyebrow">${esc(head.eyebrow)}</span>${d.expires ? `<span class="d-expires">تا ${esc(d.expires)}</span>` : ""}</div>
              <h3>${esc(d.title)}</h3>
              <p>${esc(d.description || "")}</p>
            </div>
            <div class="d-actions">
              ${d.code ? `<span class="discount-code">کد تخفیف: ${esc(d.code)}</span>` : ""}
              <a class="btn btn-navy" href="${esc(link)}" target="_blank" rel="noopener">دریافت تخفیف</a>
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
        <div class="discount-grid">
          ${items}
        </div>
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
const discountList = loadFolder("discounts");

const index = assemble(
  open,
  home.seo.title,
  home.seo.description,
  header,
  [
    renderHero(home.hero),
    P("_marquee.html"),
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