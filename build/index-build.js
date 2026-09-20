/*
 * Assembles homepage + amoozesh from CMS content (./content).
 * Run: node build/build.js && node build/index-build.js
 */
const fs = require("fs");
const path = require("path");

const P = (f) => fs.readFileSync(path.join(__dirname, "parts", f), "utf8");
/* ROOT پروژه (پوشهٔ site) */
const ROOT = path.join(__dirname, "..");
const CONTENT = path.join(ROOT, "content");
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const home = readJson(path.join(CONTENT, "home.json"));
const MAX_SLIDES = 10;
const site = readJson(path.join(CONTENT, "site.json"));
const ads = readJson(path.join(CONTENT, "ads.json"));

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
/* خروجی امن برای داخل attribute های HTML */
const escA = (s) => esc(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
/* عدد فارسی برای شمارنده‌های استاتیک صفحهٔ فهرست */
const faNum = (n) => String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);

const TELE_URL = (home.hero && home.hero.telegram_url) || "https://t.me/PlatformSem";
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
/* تصویر محتوا: اول فایل آپلودی (image)، بعد آدرس اینترنتی (image_url) */
const pickImage = (it) => imageOrNull(it.image) || imageOrNull(it.image_url);

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
        <button class="nav-bell notif-bell" type="button" aria-label="اعلان‌ها" aria-pressed="false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </button>
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
        <button class="mm-notif notif-bell" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span class="notif-label">فعال کردن اعلان</span>
        </button>
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

/* ---------- تبدیل Markdown به HTML (متن کامل اطلاعیه‌ها و دوره‌ها) ----------
   پشتیبانی: تیتر با شناسهٔ یکتا (برای فهرست مطالب)، پاراگراف، لیست نشانه‌دار و
   ترتیبی، نقل‌قول، جداکننده، بلوک کد، تصویر، لینک، پررنگ و ایتالیک. */
function mdUrl(u, localPrefix) {
  const s = String(u == null ? "" : u).trim().replace(/^<|>$/g, "");
  if (!s || /^\s*(javascript|data|vbscript):/i.test(s)) return "";
  /* لینک داخلی نوشته‌شده از داشبورد نسبت به ریشهٔ سایت است؛ در صفحه‌های داخل
     پوشه باید با "../" شروع شود تا لینک شکسته نشود. */
  if (localPrefix && /^[\w.\u0600-\u06FF-]+\.html(?:[?#].*)?$/i.test(s)) {
    return localPrefix + s.replace(/"/g, "%22").replace(/\s/g, "%20");
  }
  return s.replace(/"/g, "%22").replace(/\s/g, "%20");
}
/* قالب‌بندی درون‌خطی — لینک/تصویر/کد جدا می‌شوند تا اسکیپ‌شدن به آن‌ها آسیب نزند */
function inlineMd(raw, localPrefix) {
  const stash = [];
  const keep = (html) => {
    stash.push(html);
    return "\u0000" + (stash.length - 1) + "\u0000";
  };
  const text = (t) =>
    esc(String(t == null ? "" : t))
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
      .replace(/__([^_]+)__/g, "<b>$1</b>")
      .replace(/(^|[\s(«])\*([^*\n]+)\*/g, "$1<i>$2</i>");
  let s = String(raw == null ? "" : raw);
  s = s.replace(/`([^`]+)`/g, (m, c) => keep("<code>" + esc(c) + "</code>"));
  s = s.replace(/!\[([^\]]*)\]\(([^()\s]+)\)/g, (m, alt, url) => {
    const u = mdUrl(url, localPrefix);
    if (!u) return alt ? esc(alt) : "";
    return keep(`<img class="ap-inline-img" src="${escA(u)}" alt="${escA(alt || "")}" loading="lazy" decoding="async">`);
  });
  s = s.replace(/\[([^\]]+)\]\(([^()\s]+)\)/g, (m, label, url) => {
    const u = mdUrl(url, localPrefix);
    if (!u) return text(label);
    const ext = /^(https?:|mailto:|tel:)/i.test(u);
    return keep(`<a href="${escA(u)}"${ext ? ' target="_blank" rel="noopener"' : ""}>${text(label)}</a>`);
  });
  s = text(s);
  return s.replace(/\u0000(\d+)\u0000/g, (m, i) => stash[+i]);
}

function mdParse(src, opts) {
  const idPrefix = (opts && opts.idPrefix) || "md-";
  const localPrefix = (opts && opts.localPrefix) || "";
  const md = (t) => inlineMd(t, localPrefix);
  const toc = [];
  if (!src) return { html: "", toc };
  const lines = String(src).replace(/\r\n?/g, "\n").split("\n");
  let out = "";
  let para = [];
  let list = null;
  let quote = [];
  let code = null;
  let hid = 0;
  const flushPara = () => {
    if (para.length) {
      out += "<p>" + para.join("<br>") + "</p>";
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      out += "<" + list.type + ">" + list.items.map((li) => "<li>" + li + "</li>").join("") + "</" + list.type + ">";
      list = null;
    }
  };
  const flushQuote = () => {
    if (quote.length) {
      out += "<blockquote>" + quote.map((q) => "<p>" + q + "</p>").join("") + "</blockquote>";
      quote = [];
    }
  };
  const flushAll = () => {
    flushList();
    flushQuote();
    flushPara();
  };
  lines.forEach((line) => {
    if (code !== null) {
      if (/^\s*```/.test(line)) {
        out += "<pre><code>" + esc(code.join("\n")) + "</code></pre>";
        code = null;
      } else {
        code.push(line);
      }
      return;
    }
    if (/^\s*```/.test(line)) {
      flushAll();
      code = [];
      return;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushAll();
      const lvl = Math.min(h[1].length + 1, 4);
      let id = "";
      if (lvl <= 3) {
        id = idPrefix + "h" + ++hid;
        toc.push({ id, text: h[2].replace(/[*_`]/g, "").trim(), level: lvl });
      }
      out += `<h${lvl}${id ? ' id="' + id + '"' : ""}>${md(h[2])}</h${lvl}>`;
      return;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      flushAll();
      out += '<hr class="ap-hr">';
      return;
    }
    const q = line.match(/^\s*>\s?(.*)$/);
    if (q) {
      flushList();
      flushPara();
      quote.push(md(q[1]));
      return;
    }
    const ul = line.match(/^\s*[-*+]\s+(.*)$/);
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (ul || ol) {
      flushPara();
      flushQuote();
      const type = ul ? "ul" : "ol";
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push(md((ul || ol)[1]));
      return;
    }
    if (/^\s*$/.test(line)) {
      flushAll();
      return;
    }
    flushList();
    flushQuote();
    para.push(md(line));
  });
  if (code !== null) out += "<pre><code>" + esc(code.join("\n")) + "</code></pre>";
  flushAll();
  return { html: out, toc };
}

/* نسخهٔ سازگار با فراخوانی‌های قدیمی */
const mdToHtml = (src) => mdParse(src).html;

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

/* پاک‌سازی: HTMLهای هر پوشهٔ تولیدی که دیگر در محتوا نیستند حذف می‌شوند (صفحات یتیم) */
function cleanPages(dir, keep) {
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  fs.readdirSync(dir)
    .filter((f) => f.endsWith(".html") && !keep.has(f))
    .forEach((f) => {
      fs.unlinkSync(path.join(dir, f));
      console.log("🗑 حذف صفحهٔ یتیم:", path.relative(ROOT, path.join(dir, f)));
      n++;
    });
  return n;
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
  )
    .replace(/(<link rel="stylesheet" href=")([^"]*style\.css)(")/g, "$1$2?v=" + ASSET_VER + "$3")
    .replace(/(<script src=")([^"]*main\.js)(")/g, "$1$2?v=" + ASSET_VER + "$3");
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
              <button class="btn btn-notif notif-bell" type="button">
                <span class="notif-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></span>
                <span class="notif-label">فعال کردن اعلان</span>
              </button>
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
function adSlots(a) {
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
  return slots.join("\n          ");
}

function renderAds(a) {
  if (!a) return "";
  const slots = adSlots(a);
  if (!slots) return "";
  const reserve = a.reserve && a.reserve.link
    ? `<div class="ad-reserve"><a class="btn btn-gold" href="${esc(a.reserve.link)}" target="_blank" rel="noopener">${teleSvg} ${esc(a.reserve.label || "رزرو تبلیغات")}</a></div>`
    : "";
  return `<!-- ADS BANNERS -->
    <section class="ads" id="ads">
      <div class="container">
        <div class="ad-slots reveal">
          ${slots}
        </div>
        ${reserve}
      </div>
    </section>`;
}

/* همان بنرهای صفحهٔ اصلی، بدون بخش رزرو — برای صفحات دوره‌ها و اطلاعیه‌ها */
function renderAdsBand(a) {
  const slots = adSlots(a);
  if (!slots) return "";
  return `<!-- ADS BANNERS (shared) -->
    <section class="ads ads--compact">
      <div class="container"><div class="ad-slots reveal">${slots}</div></div>
    </section>`;
}


/* ---------- صفحات فهرست (دوره‌ها و اطلاعیه‌ها): نوار کنترل، کارت‌ها، حالت خالی ---------- */
const LP_ICON = {
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15" aria-hidden="true"><path d="M19 12H5M13 18l-6-6 6-6"/></svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>`,
  layers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l9 5-9 5-9-5 9-5Z"/><path d="M3 13l9 5 9-5"/></svg>`,
  filter: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5h18l-7 8v5l-4 2v-7L3 5Z"/></svg>`,
  chev: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`
};

/* گروه رادیویی فیلتر (به سبک سایدبار eseminar) */
function lpRadios(name, attr, items) {
  return `<div class="lp-radios" data-${attr}>${items
    .map(
      (x, i) => `
              <label class="lp-radio">
                <input type="radio" name="${name}" value="${escA(x.value)}"${i === 0 ? " checked" : ""}>
                <span class="lp-radio-dot" aria-hidden="true"></span>
                <span class="lp-radio-label">${esc(x.label)}</span>${x.count != null ? `<span class="lp-radio-count">${faNum(x.count)}</span>` : ""}
              </label>`
    )
    .join("")}
            </div>`;
}

/* سایدبار فیلتر (دسکتاپ) + نوار مرتب‌سازی بالای گرید — جستجو، دسته، قیمت، مرتب‌سازی */
function renderLpSidebar(o) {
  const priceBox = o.price
    ? `
          <fieldset class="lp-fbox">
            <legend class="lp-fbox-title">هزینه</legend>
            ${lpRadios("lp-price", "lp-price", [
              { value: "", label: "همه" },
              { value: "free", label: "رایگان" },
              { value: "paid", label: "با هزینه" },
            ])}
          </fieldset>`
    : "";
  return `<div class="lp-layout">
        <aside class="lp-side" aria-label="فیلترها">
          <div class="lp-side-inner">
            <div class="lp-side-head">
              <span class="lp-side-title">${LP_ICON.filter}<span>فیلترها</span></span>
              <button class="lp-side-toggle" type="button" data-lp-toggle aria-expanded="false" aria-controls="lpFilters">
                <span>نمایش</span>
                ${LP_ICON.chev}
              </button>
            </div>
            <div class="lp-filters" id="lpFilters" data-lp-filters>
              <div class="lp-fbox">
                <label class="lp-fbox-title" for="lpSearch">جستجو</label>
                <div class="lp-search">
                  ${LP_ICON.search}
                  <input id="lpSearch" type="search" data-lp-search placeholder="${esc(o.searchPlaceholder)}" autocomplete="off">
                </div>
              </div>
              <fieldset class="lp-fbox">
                <legend class="lp-fbox-title">${esc(o.catName)}</legend>
                ${lpRadios("lp-cat", "lp-cat", o.cats)}
              </fieldset>${priceBox}
              <button class="lp-reset" type="button" data-lp-reset hidden>
                ${LP_ICON.x}
                <span>حذف فیلترها</span>
              </button>
            </div>
          </div>
        </aside>
        <div class="lp-main">
          <div class="lp-sortbar reveal">
            <span class="lp-sortbar-label">مرتب‌سازی براساس:</span>
            <div class="lp-chips" data-lp-sort>${o.sorts
              .map(
                (x, i) => `
              <label class="lp-chip">
                <input type="radio" name="lp-sort" value="${escA(x.value)}"${i === 0 ? " checked" : ""}>
                <span>${esc(x.label)}</span>
              </label>`
              )
              .join("")}
            </div>
          </div>
          <div class="lp-grid" data-lp-list>
            ${o.cards}
          </div>
          ${o.empty || ""}
        </div>
      </div>`;
}

/* ---------- فهرست کانون‌ها و انجمن‌ها (بدون فیلتر، فقط جستجو + کارت لوگومحور) ---------- */
/* لوگو/نشان جایگزین از build/org.js می‌آید (مشترک با صفحهٔ پروفایل) */
const { orgLogo, newsOrg } = require("./org");

function entityCard(it, base) {
  const search = [it.name, it.short, it.desc, (it.members || []).map((m) => `${m && m.name ? m.name : ""} ${m && m.major ? m.major : ""}`).join(" ")].join(" ");
  const tele = it.telegram && ABS_URI.test(it.telegram) ? it.telegram : "";
  return `<a class="kn-card reveal" href="${base}/${escA(it.slug)}.html" data-search="${escA(search)}"${tele ? ` data-telegram="${escA(tele)}"` : ""}>
        <span class="kn-logo">${orgLogo(it, "", "kn-logo-img", "kn-mono")}</span>
        <h3 class="kn-name">${esc(it.name)}</h3>
        <p class="kn-desc">${esc(it.desc)}</p>
        <span class="kn-foot"><span>مشاهده پروفایل</span>${LP_ICON.arrow}</span>
      </a>`;
}

/* صفحهٔ فهرست تشکل‌ها: مقدمهٔ برند + نوار جستجو + گرید کارت‌های لوگومحور + حالت خالی */
function renderEntityListPage(items, o) {
  const cards = items.map((it) => entityCard(it, o.base)).join("\n        ");
  const body = [
    `<main>
      ${renderLpIntro(o.crumb, o.title, o.desc, o.countLabel, items.length)}
      ${P("_marquee.html")}
      <section class="lp-page">
        <div class="container" data-lp>
          <header class="lp-list-head">
            <div>
              <span class="eyebrow">${esc(o.eyebrow)}</span>
              <h2>${esc(o.heading)}</h2>
            </div>
          </header>
          <div class="kn-toolbar reveal">
            <label class="lp-search">
              <span class="lp-vhidden">جستجو</span>
              ${LP_ICON.search}
              <input type="search" data-lp-search placeholder="${escA(o.searchPlaceholder)}" autocomplete="off">
            </label>
            <button class="lp-reset" type="button" data-lp-reset hidden>
              ${LP_ICON.x}
              <span>حذف جستجو</span>
            </button>
          </div>
          <div class="lp-grid" data-lp-list>
            ${cards}
          </div>
          ${renderLpEmpty(LP_ICON.search, o.emptyTitle, o.emptyHint, o.emptyReset)}
        </div>
      </section>
    </main>`
  ];
  return assemble(open, o.title + " | " + site.brand_name, o.metaDesc, header, body, footer, close);
}

/* کاور گرافیکی برند — جایگزین ایموجی برای دوره‌های بدون تصویر */
const COURSE_ART_SVG = `<svg class="lp-art" viewBox="0 0 240 130" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><g fill="none" stroke="#FFDC5F" stroke-width="2"><circle cx="201" cy="15" r="49" stroke-opacity=".5"/><circle cx="201" cy="15" r="31" stroke-opacity=".3"/><circle cx="27" cy="117" r="37" stroke-opacity=".28"/></g><g fill="#FFDC5F"><rect x="22" y="28" width="58" height="7" rx="3.5" fill-opacity=".85"/><rect x="22" y="46" width="40" height="7" rx="3.5" fill-opacity=".55"/><rect x="22" y="64" width="50" height="7" rx="3.5" fill-opacity=".35"/></g></svg>`;

/* کاور دوره: تصویر واقعی (در صورت وجود) وگرنه نقش گرافیکی برند — بدون ایموجی */
const courseCover = (c, prefix, href) => {
  const img = pickImage(c);
  const inner = img
    ? `<img class="lp-cover-img" src="${esc(ABS_URI.test(img) ? img : prefix + img)}" alt="" loading="lazy">`
    : COURSE_ART_SVG;
  const cls = "lp-cover " + (img ? "lp-cover--img" : "lp-cover--art");
  const style = img ? "" : ` style="--c1:${escA(c.cover_a || "#102A71")};--c2:${escA(c.cover_b || "#001840")}"`;
  return href
    ? `<a class="${cls}" href="${href}"${style} aria-hidden="true" tabindex="-1">${inner}</a>`
    : `<span class="${cls}"${style} aria-hidden="true">${inner}</span>`;
};

/* کارت دوره — کاور تصویری، دسته، تیتر، خلاصه، مدرس، جلسات، قیمت؛ لینک به صفحهٔ مجزای دوره */
const courseListCard = (c) => {
  const detail = "amoozesh/" + c._slug + ".html";
  const price = (c.price || "رایگان").trim();
  const free = /رایگان\s*$/.test(price) ? "free" : "paid";
  const teacher = c.teacher ? `<span class="lp-meta-i">${LP_ICON.user} ${esc(c.teacher)}</span>` : "";
  const lessons = c.lessons ? `<span class="lp-meta-i">${LP_ICON.layers} ${esc(c.lessons)}</span>` : "";
  const hay = [c.title, c.summary, c.category, c.teacher, price].filter(Boolean).join(" ");
  return `<article class="lp-card lp-course reveal"
          data-cat="${escA(c.category || "")}" data-price="${free}" data-title="${escA(c.title)}" data-search="${escA(hay)}">
        ${courseCover(c, "", detail)}
        <div class="lp-body">
          <span class="lp-cat-chip">${esc(c.category || "دوره")}</span>
          <h3 class="lp-title"><a href="${detail}">${esc(c.title)}</a></h3>
          <p class="lp-sum">${esc(c.summary || "")}</p>
          ${teacher || lessons ? `<div class="lp-meta">${teacher}${lessons}</div>` : ""}
          <div class="lp-foot">
            <span class="lp-price${free === "free" ? " lp-price--free" : ""}">${esc(price)}</span>
            <a class="btn btn-navy btn-sm lp-cta" href="${detail}">مشاهدهٔ دوره ${LP_ICON.arrow}</a>
          </div>
        </div>
      </article>`;
};

/* کارت اطلاعیه — استایل ادیتوریال: دسته + تاریخ، تیتر، خلاصه، لینک جزئیات */
const newsListCard = (n) => {
  const depth = "ettelaieh/" + n._slug + ".html";
  const date = n.date
    ? `<time class="lp-date" data-date="${escA(n.date)}"></time>`
    : `<span class="lp-date">اطلاعیه</span>`;
  const hay = [n.title, n.summary, n.category, n.author, ...(Array.isArray(n.tags) ? n.tags : [])]
    .filter(Boolean)
    .join(" ");
  return `<article class="lp-card lp-news lp-body reveal"
          data-cat="${escA(n.category || "خبر")}" data-dt="${escA(n.date || "")}" data-title="${escA(n.title)}" data-search="${escA(hay)}">
        <div class="lp-news-head">
          <span class="lp-cat-chip">${esc(n.category || "خبر")}</span>
          ${date}
        </div>
        <h3 class="lp-title"><a href="${depth}">${esc(n.title)}</a></h3>
        <p class="lp-sum">${esc(n.summary || "")}</p>
        <div class="lp-news-org">${newsOrgLabel(n)}</div>
        <div class="lp-foot">
          <a class="lp-link" href="${depth}">مشاهدهٔ اطلاعیه ${LP_ICON.arrow}</a>
        </div>
      </article>`;
};

/* نشان ‌تشکل مرجعِ اطلاعیه (کانون/انجمن) — لینک به پروفایل همان تشکل */
const newsOrgLabel = (n, prefix) => {
  const org = newsOrg(n, kanonhaList, anjomanhaList);
  if (!org) return "";
  return `<a class="lp-org-chip" href="${prefix || ""}${org.base}/${escA(org.slug)}.html">${esc(org.name)}</a>`;
};

/* مقدمهٔ صفحهٔ فهرست: crumbs + تیتر + توضیح + شمارنده */
function renderLpIntro(crumb, title, desc, countLabel, count) {
  return `<section class="lp-intro">
        <div class="container">
          <div class="crumbs"><a href="index.html">خانه</a><span class="sep">/</span>${crumb}</div>
          <div class="lp-intro-row">
            <div class="lp-intro-txt">
              <span class="lp-intro-line" aria-hidden="true"></span>
              <div>
                <h1>${esc(title)}</h1>
                <p>${esc(desc)}</p>
              </div>
            </div>
            <span class="lp-count-chip" aria-live="polite"><b data-lp-count>${faNum(count)}</b><small>${esc(countLabel)}</small></span>
          </div>
        </div>
      </section>`;
}

/* حالت خالی (پس از فیلتر بدون نتیجه) */
function renderLpEmpty(ico, title, hint, resetLabel) {
  return `<div class="lp-empty" data-lp-empty hidden>
          <span class="lp-empty-ico" aria-hidden="true">${ico}</span>
          <h3>${esc(title)}</h3>
          <p>${esc(hint)}</p>
          <button class="btn btn-navy" type="button" data-lp-reset>${esc(resetLabel)}</button>
        </div>`;
}

const distinctCats = (xs) => [...new Set(xs.filter(Boolean))].sort((a, b) => a.localeCompare(b, "fa"));

/* ---------- کارت اطلاعیه‌ٔ اسلایدر اصلی (به سبک webinarCard سایت eseminar) ---------- */
const CAT_EMOJI = { "دوره": "🎓", "رویداد": "🗓", "فراخوان": "📣", "اطلاع‌رسانی": "✉", "جدید": "✨", "خبر": "📰", "تخفیف": "🎟" };
const newsSlide = (n) => {
  const img = pickImage(n);
  const emoji = CAT_EMOJI[n.category] || "📰";
  const visual = img
    ? `<img class="wc-img" src="${esc(img)}" alt="${esc(n.title)}" loading="lazy">`
    : `<span class="wc-img wc-fallback" style="--c1:#102A71;--c2:#001840">${emoji}</span>`;
  const depth = "ettelaieh/" + n._slug + ".html";
  const initial = esc(String(n.title || "خ").trim().charAt(0));
  return `
          <div class="swiper-slide" dir="rtl">
            <div class="es-main-webinar-card">
              <article class="webinarCard">
                <a class="webinarCard-cover" href="${depth}">
                  ${visual}
                  <span class="webinarCard-cover-onCover">${esc(n.summary || "جزئیات اطلاعیه را مشاهده کنید")}</span>
                </a>
                <span class="wc-badge special-badge">${esc(n.category || "خبر")}</span>
                <div class="webinarCard-content es__webinarCardMainContent">
                  <div class="webinarCard-title"><a href="${depth}"><h3>${esc(n.title)}</h3></a></div>
                  <div class="webinarCard-detail es-webinar-card-detail-avatar-container-wide">
                    <div class="main-webinar-card-avatar-container"><span class="wc-avatar" aria-hidden="true">${initial}</span></div>
                    <div class="d-st1 m-w-56px wc-when" data-date="${esc(n.date || "")}"></div>
                  </div>
                </div>
                <div class="webinarCard-detail stickToBottom">
                  <div class="es__webinarCard-footer">
                    <div class="es__webinarCard-footerItem ft2 es-webinar-card-footer-items-inner">
                      <a class="eseminar-button eseminar-button--esmBtn-fill-navy eseminar-button--medium" href="${depth}">جزئیات</a>
                      <div class="price-wrapper"><span class="wc-cat-mini">${emoji} ${esc(n.category || "خبر")}</span></div>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>`;
};

function renderNews(head, newsList) {
  if (!newsList.length) return "";
  const slides = newsList.slice(0, MAX_SLIDES).map((n) => newsSlide(n)).join("\n        ");
  return `<!-- NEWS (اسلایدر به سبک es-main-page-slider-swiper-contianer سایت eseminar) -->
    <section class="es-news-section" id="news">
      <div class="es-main-page-slider-section">
        <div class="es__sectionTitle justify-content-between es-main-page-section-title" dir="rtl">
          <div class="double-color-slider-title-container">
            <h2>${esc(head.title)}</h2>
            ${head.subtitle ? `<p class="small-text">${esc(head.subtitle)}</p>` : ""}
          </div>
          <div class="es__sectionTitle-actions">
            <a class="eseminar-button eseminar-button--esmBtn-text-only eseminar-button--medium news-all" href="ettelaieh.html">
              <span>مشاهده همه</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>
            </a>
          </div>
        </div>
        <div class="es-slider-frame es-news-frame">
          <div class="es-main-page-slider-swiper-contianer swiper" data-stage>
            <div class="news-scroller swiper-wrapper" data-scroller>
              ${slides}
            </div>
          </div>
          <button class="swiper-button-prev" type="button" aria-label="اطلاعیهٔ بعدی"><span aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M19 12H6"/><path d="M12 19l-7-7 7-7"/></svg></span></button>
          <button class="swiper-button-next" type="button" aria-label="بازگشت به ابتدای اطلاعیه‌ها"><span aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M6 5v14"/><path d="M7 5l12 7-12 7V5Z"/></svg></span></button>
        </div>
      </div>
    </section>`;
}

/* ---------- اسلایدر آموزش‌های مجازی (به سبک es-home-page-slide-show سایت eseminar) ---------- */
const courseSlide = (c, idx) => {
  const link = linkOrDefault(c.link);
  const detail = "amoozesh/" + c._slug + ".html";
  const name = c.teacher || "مدرس دوره";
  const initial = esc(name.trim().charAt(0));
  const lessons = c.lessons ? `<span class="cs-lessons-mini">▸ ${esc(c.lessons)}</span>` : "";
  const img = pickImage(c);
  const cover = img
    ? `<span class="cs-cover cs-cover--img" style="background-image:url('${escA(img)}')" aria-hidden="true"></span>`
    : `<span class="cs-cover" style="--c1:${escA(c.cover_a || "#102A71")};--c2:${escA(c.cover_b || "#001840")}" aria-hidden="true">${COURSE_ART_SVG}</span>`;
  return `
          <div class="swiper-slide" dir="rtl">
            <article class="main-page-slide-show-container">
              <a class="main-page-slide-show-image-container" href="${detail}" id="slideshow_course_img_${idx}" aria-label="${esc(c.title)}">
                ${cover}
              </a>
              <div class="main-page-slide-show-content-container">
                <div class="main-page-slide-show-title-description-container">
                  <div class="main-page-slide-show-title-container">
                    <a href="${detail}" id="slideshow_course_title_${idx}">${esc(c.title)}</a>
                  </div>
                  <div class="main-page-slide-show-description-container">${esc(c.summary || "")}</div>
                </div>
                <div class="main-page-slide-show-detials-container">
                  <div class="avatarBox avatarBox-lg">
                    <div class="avatar-group is-webinar rtl">
                      <span class="avatar" aria-hidden="true">${initial}</span>
                      <span class="cs-teacher-name">${name}</span>
                    </div>
                  </div>
                  <div class="main-page-slide-show-price-btn-container">
                    <div class="main-page-slide-show-price-container">
                      ${lessons}
                      <div class="price main-slide-show-free-price">${esc(c.price || "رایگان")}</div>
                    </div>
                    <div class="main-page-slide-show-btn-container">
                      <a class="eseminar-button eseminar-button--esmBtn-fill-gold eseminar-button--medium" href="${link}">ثبت‌نام دوره</a>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>`;
};

function renderCourses(head, courseList) {
  if (!courseList.length) return "";
  const slides = courseList.slice(0, MAX_SLIDES).map((c, i) => courseSlide(c, i)).join("\n        ");
  const allLink = (head.cta && safeLink(head.cta.link)) || "amoozesh.html";
  const allLabel = (head.cta && head.cta.label) || "مشاهده همه دوره‌ها";
  return `<!-- COURSES (به سبک es-home-page-slide-show-container سایت eseminar) -->
    <section class="es-home-page-slide-show-container" id="courses">
      <div class="featured-head">
        <h2 class="featured-head-title">${esc(head.title)}</h2>
        <a class="eseminar-button eseminar-button--medium es-featured-all" href="${allLink}">
          <span>${esc(allLabel)}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>
        </a>
      </div>
      <div class="es-slider-frame courses-frame">
        <div class="featured-slider-stage swiper" data-stage data-autoplay>
          <div class="featured-slider-scroller swiper-wrapper" data-scroller>
            ${slides}
          </div>
        </div>
        <button class="swiper-button-prev" type="button" aria-label="دورهٔ بعدی"><span aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M19 12H6"/><path d="M12 19l-7-7 7-7"/></svg></span></button>
        <button class="swiper-button-next" type="button" aria-label="بازگشت به ابتدای دوره‌ها"><span aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M6 5v14"/><path d="M7 5l12 7-12 7V5Z"/></svg></span></button>
      </div>
    </section>`;
}

/* ---------- صفحهٔ فهرست اطلاعیه‌ها (همهٔ اطلاعیه‌ها؛ جستجو/فیلتر/مرتب‌سازی) ---------- */
function renderAnnListPage(newsList) {
  const cats = distinctCats(newsList.map((n) => n.category));
  const cards = newsList.map(newsListCard).join("\n        ");
  const body = [
    `<main>
      ${renderLpIntro(
        "اطلاعیه‌ها",
        "اطلاعیه‌های پلتفرم",
        "همهٔ فراخوان‌ها، دوره‌ها و رویدادهای دانشگاه یک‌جا؛ جدیدترین‌ها اول.",
        "اطلاعیه",
        newsList.length
      )}
      <section class="lp-page">
        <div class="container" data-lp>
          <header class="lp-list-head">
            <div>
              <span class="eyebrow">آرشیو اطلاع‌رسانی</span>
              <h2>همهٔ اطلاعیه‌ها و رویدادها</h2>
            </div>
          </header>
          ${renderLpSidebar({
            searchPlaceholder: "جستجوی تیتر یا متن اطلاعیه…",
            catName: "دسته‌بندی",
            cats: [{ value: "", label: "همهٔ دسته‌ها", count: newsList.length }].concat(
              cats.map((c) => ({ value: c, label: c, count: newsList.filter((x) => x.category === c).length }))
            ),
            sorts: [
              { value: "new", label: "جدیدترین" },
              { value: "old", label: "قدیمی‌ترین" },
              { value: "title", label: "عنوان (الف تا ی)" }
            ],
            cards,
            empty: renderLpEmpty(LP_ICON.search, "اطلاعیه‌ای با این مشخصات پیدا نشد", "عبارت دیگری جستجو کنید یا دسته‌بندی را عوض کنید.", "نمایش همهٔ اطلاعیه‌ها")
          })}
        </div>
      </section>
    </main>`
  ];
  return assemble(
    open,
    "اطلاعیه\u200cهای پلتفرم | " + site.brand_name,
    "همه اطلاعیه\u200cها و اخبار پلتفرم دانشگاه سمنان؛ به ترتیب تاریخ، جدیدترین\u200cها اول.",
    header,
    body,
    footer,
    close
  );
}

/* ---------- صفحهٔ فهرست دوره‌ها (از data واقعی content/courses؛ جستجو/فیلتر/مرتب‌سازی) ---------- */
function renderCourseListPage(courseList) {
  const list = courseList.slice().sort((a, b) => (a.sort || 0) - (b.sort || 0));
  const cats = distinctCats(list.map((c) => c.category));
  const cards = list.map(courseListCard).join("\n        ");
  const body = [
    `<main>
      ${renderLpIntro(
        "آموزش‌های مجازی",
        "آموزش‌های مجازی پلتفرم",
        "دوره‌ها و کارگاه‌های آنلاین پلتفرم با گواهی معتبر؛ از مهارت‌های نرم تا نرم‌افزارهای تخصصی. جستجو کن، فیلتر بزن و مسیر یادگیری‌ات را شروع کن.",
        "دوره",
        list.length
      )}
      ${P("_marquee.html")}
      <section class="lp-page">
        <div class="container" data-lp>
          <header class="lp-list-head">
            <div>
              <span class="eyebrow">کتابخانهٔ دوره‌ها</span>
              <h2>همهٔ دوره‌های آموزش مجازی</h2>
            </div>
          </header>
          ${renderLpSidebar({
            searchPlaceholder: "جستجوی عنوان، مدرس یا مهارت…",
            catName: "دسته‌بندی",
            cats: [{ value: "", label: "همهٔ دسته‌ها", count: list.length }].concat(
              cats.map((c) => ({ value: c, label: c, count: list.filter((x) => x.category === c).length }))
            ),
            price: true,
            sorts: [
              { value: "", label: "پیش‌فرض" },
              { value: "title", label: "عنوان (الف تا ی)" }
            ],
            cards,
            empty: renderLpEmpty(LP_ICON.search, "دوره‌ای با این مشخصات پیدا نشد", "عبارت دیگری جستجو کنید یا دسته‌بندی را عوض کنید.", "نمایش همهٔ دوره‌ها")
          })}
        </div>
      </section>
    </main>`
  ];
  return assemble(
    open,
    "آموزش\u200cهای مجازی | " + site.brand_name,
    "دوره\u200cهای آموزش مجازی و مهارتی پلتفرم دانشگاه سمنان؛ گواهی معتبر، مدرس‌های حرفه‌ای و مسیر یادگیری آسان.",
    header,
    body,
    footer,
    close
  );
}

/* ---------- صفحهٔ یک دوره (پوشهٔ amoozesh/) ---------- */
function renderCoursePage(c) {
  const prefix = "../";
  const openN = openFor(prefix);
  const closeN = closeFor(prefix);
  const headerN = renderHeaderN(prefix);
  const footerN = renderFooterN(prefix);

  const img = pickImage(c);
  const heroImg = img
    ? `<div class="ann-img"><img src="${ABS_URI.test(img) ? img : prefix + img}" alt="${esc(c.title)}" loading="lazy"></div>`
    : "";
  const content = mdParse(c.body || "", { idPrefix: "cr-", localPrefix: prefix }).html || `<p>${esc(c.summary || "")}</p>`;

  const facts = [
    c.teacher ? `<div><dt>مدرس</dt><dd>${esc(c.teacher)}</dd></div>` : "",
    c.lessons ? `<div><dt>ساختار دوره</dt><dd>${esc(c.lessons)}</dd></div>` : "",
    c.category ? `<div><dt>دسته‌بندی</dt><dd>${esc(c.category)}</dd></div>` : "",
    `<div><dt>هزینه</dt><dd>${esc(c.price || "رایگان")}</dd></div>`
  ].filter(Boolean).join("");

  /* لینک ثبت‌نام: URL بیرونی یا صفحهٔ داخلی؛ اگر لینک، همان صفحهٔ فهرست بود به کانال ثبت‌نام برمی‌گردد */
  const rawLink = safeLink(c.link);
  let regHref = TELE_URL;
  let regTarget = ` target="_blank" rel="noopener"`;
  if (rawLink && !/^\.?\/?amoozesh\.html$/i.test(rawLink)) {
    if (ABS_URI.test(rawLink)) {
      regHref = rawLink;
    } else {
      regHref = prefix + rawLink.replace(/^\.\//, "");
      regTarget = "";
    }
  }

  const body = [
    `<main>
      <section class="section ann-single">
        <div class="container ann-open">
          <article>
            <div class="crumbs">
              <a href="${prefix}index.html">خانه</a><span class="sep">/</span><a href="${prefix}amoozesh.html">آموزش‌های مجازی</a><span class="sep">/</span>
            </div>
            <div class="ann-head">
              <span class="n-chip">${esc(c.category || "دوره")}</span>
            </div>
            <h1 class="ann-title">${esc(c.title)}</h1>
            ${heroImg}
            <dl class="course-facts">${facts}</dl>
            <div class="ann-body">${content}</div>
            ${ads && ads.show_courses !== false ? renderAdsBand(ads) : ""}
            <div class="ann-cta">
              <a class="btn btn-gold" href="${esc(regHref)}"${regTarget}>ثبت‌نام دوره</a>
              <a class="btn btn-navy" href="${prefix}amoozesh.html">→ بازگشت به دوره‌ها</a>
            </div>
          </article>
        </div>
      </section>
    </main>`
  ];
  return assemble(
    openN,
    esc(c.title) + " | آموزش‌های مجازی",
    esc(c.summary || ""),
    headerN,
    body,
    footerN,
    closeN
  );
}

/* ---------- صفحهٔ یک اطلاعیه (پوشهٔ ettelaieh/) ----------
   قالب کامل و حرفه‌ای اطلاعیه در ماژول اختصاصی ./ann-page.js ساخته می‌شود;
   این‌جا فقط با ابزارهای مشترک همین فایل به آن وصل می‌شویم (پایین‌تر، بعد از
   بارگذاری محتوا) تا از وابستگی حلقوی جلوگیری شود. */
/* پیشوند‌گذاری خودکار همهٔ دارایی‌های محلی داخل قالب‌های مشترک */
const openFor = (prefix) => open.replace(/="(assets\/[^"]+)"/g, '="' + prefix + '$1"');
const closeFor = (prefix) => close.replace(/="(assets\/[^"]+)"/g, '="' + prefix + '$1"');

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
const bySort = (a, b) => (a.sort || 0) - (b.sort || 0) || String(a.name || "").localeCompare(String(b.name || ""), "fa");
const kanonhaList = loadFolder("kanonha").sort(bySort);
const anjomanhaList = loadFolder("anjomanha").sort(bySort);

/* ---------- قالب اطلاعیه (ann-page.js) با ابزارهای همین فایل ساخته می‌شود ---------- */
const renderAnnPage = require("./ann-page")({
  esc,
  escA,
  faNum,
  ROOT,
  site,
  TELE_URL,
  pickImage,
  safeLink,
  ABS_URI,
  LOCAL_LINK,
  renderHeaderN,
  renderFooterN,
  mdParse,
  allNews: newsList,
  kanonhaList,
  anjomanhaList,
  newsOrg,
  assetVer: ASSET_VER,
  ads: ads,
  open,
  close,
  openFor,
  closeFor,
  assemble
}).renderAnnPage;

const index = assemble(
  open,
  home.seo.title,
  home.seo.description,
  header,
  [
    renderHero(home.hero),
    P("_marquee.html"),
    renderCourses(home.courses_head, courseList),
    renderAds(ads && ads.show_home !== false ? ads : null),
    renderNews(home.news_head, newsList),
    renderDiscounts(home.discounts_head, discountList),
    renderJoin(home.join)
  ],
  footer,
  close
);
fs.writeFileSync(path.join(ROOT, "index.html"), index, "utf8");
console.log("✔ index.html");

fs.writeFileSync(path.join(ROOT, "amoozesh.html"), renderCourseListPage(courseList), "utf8");
console.log("✔ amoozesh.html");

/* ---------- فهرست کانون‌ها و انجمن‌ها ---------- */
fs.writeFileSync(
  path.join(ROOT, "kanonha.html"),
  renderEntityListPage(kanonhaList, {
    base: "kanonha",
    crumb: "کانون‌های فرهنگی",
    title: "کانون‌های فرهنگی دانشگاه سمنان",
    desc: "کانون‌های فرهنگی، قلبِ زندگی دانشجویی‌اند؛ از هنر و موسیقی تا رسانه و کارآفرینی. میان‌شان جستجو کن و پروفایل هر کانون را ببین.",
    metaDesc: "فهرست کانون‌های فرهنگی دانشگاه سمنان؛ فعالیت‌ها، رویدادها و کانال تلگرام هر کانون.",
    countLabel: "کانون فعال",
    eyebrow: "تشکل‌های دانشجویی",
    heading: "همهٔ کانون‌های فرهنگی",
    searchPlaceholder: "جستجوی نام کانون، دسته یا فعالیت…",
    emptyTitle: "کانونی با این مشخصات پیدا نشد",
    emptyHint: "عبارت دیگری جستجو کن یا فهرست کامل را ببین.",
    emptyReset: "نمایش همهٔ کانون‌ها"
  }),
  "utf8"
);
console.log("✔ kanonha.html (" + kanonhaList.length + " کانون)");

fs.writeFileSync(
  path.join(ROOT, "anjomanha.html"),
  renderEntityListPage(anjomanhaList, {
    base: "anjomanha",
    crumb: "انجمن‌های علمی",
    title: "انجمن‌های علمی دانشگاه سمنان",
    desc: "انجمن‌های علمی، پلِ میان کلاس و پژوهش‌اند؛ نشست تخصصی، کارگاه و رویداد. انجمن رشتهٔ خودت را پیدا کن و عضو شو.",
    metaDesc: "فهرست انجمن‌های علمی دانشگاه سمنان؛ فعالیت‌ها، رویدادها و کانال تلگرام هر انجمن.",
    countLabel: "انجمن فعال",
    eyebrow: "تشکل‌های دانشجویی",
    heading: "همهٔ انجمن‌های علمی",
    searchPlaceholder: "جستجوی نام انجمن، رشته یا فعالیت…",
    emptyTitle: "انجمنی با این مشخصات پیدا نشد",
    emptyHint: "عبارت دیگری جستجو کن یا فهرست کامل را ببین.",
    emptyReset: "نمایش همهٔ انجمن‌ها"
  }),
  "utf8"
);
console.log("✔ anjomanha.html (" + anjomanhaList.length + " انجمن)");

/* ---------- صفحات اطلاعیه‌ها ---------- */
fs.writeFileSync(path.join(ROOT, "ettelaieh.html"), renderAnnListPage(newsList), "utf8");
console.log("✔ ettelaieh.html");

const ETT_DIR = path.join(ROOT, "ettelaieh");
fs.mkdirSync(ETT_DIR, { recursive: true });
const ettKeep = new Set();
newsList.forEach((n) => {
  ettKeep.add(n._slug + ".html");
  fs.writeFileSync(path.join(ETT_DIR, n._slug + ".html"), renderAnnPage(n), "utf8");
});
const ettRemoved = cleanPages(ETT_DIR, ettKeep);
console.log("✔ صفحات اطلاعیه:", newsList.length, "فایل" + (ettRemoved ? " (" + ettRemoved + " یتیم حذف شد)" : ""));

/* ---------- صفحات دوره‌ها ---------- */
const AMO_DIR = path.join(ROOT, "amoozesh");
fs.mkdirSync(AMO_DIR, { recursive: true });
const amoKeep = new Set();
courseList.forEach((c) => {
  amoKeep.add(c._slug + ".html");
  fs.writeFileSync(path.join(AMO_DIR, c._slug + ".html"), renderCoursePage(c), "utf8");
});
const amoRemoved = cleanPages(AMO_DIR, amoKeep);
console.log("✔ صفحات دوره:", courseList.length, "فایل" + (amoRemoved ? " (" + amoRemoved + " یتیم حذف شد)" : ""));

/* ---------- latest.json: فهرست آخرین اطلاعیه‌ها و دوره‌ها (برای اعلان مرورگر) ---------- */
(function writeLatest() {
  const items = [];
  newsList.forEach((n) => {
    items.push({
      id: "news:" + n._slug,
      type: "news",
      title: n.title || "",
      summary: n.summary || "",
      link: "ettelaieh/" + n._slug + ".html",
      date: n.date || ""
    });
  });
  courseList.slice().forEach((c) => {
    items.push({
      id: "course:" + c._slug,
      type: "course",
      title: c.title || "",
      summary: c.summary || "",
      link: "amoozesh/" + c._slug + ".html",
      date: "",
      teacher: c.teacher || "",
      price: c.price || ""
    });
  });
  loadFolder("discounts").forEach((d) => {
    items.push({
      id: "discount:" + d._slug,
      type: "discount",
      title: d.title || "",
      summary: d.description || "",
      link: safeLink(d.link) || "#discounts",
      date: "",
      code: d.code || ""
    });
  });
  items.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const payload = { updated: new Date().toISOString(), items };
  fs.writeFileSync(path.join(ROOT, "latest.json"), JSON.stringify(payload), "utf8");
  console.log("✔ latest.json (" + items.length + " مورد)");
})();

/* ---------- sitemap.xml و robots.txt — ایندکس شدن درست در گوگل ---------- */
const SITE_URL = "https://semnanplatform.ir";
const isoDay = (d) => {
  const x = new Date(d || 0);
  return isNaN(x.getTime()) ? "" : x.toISOString().slice(0, 10);
};
(function writeSitemap() {
  const urls = [];
  const add = (loc, lastmod, priority, changefreq) => {
    urls.push(
      "  <url><loc>" + SITE_URL + "/" + encodeURI(loc) + "</loc>" +
        (lastmod ? "<lastmod>" + lastmod + "</lastmod>" : "") +
        (changefreq ? "<changefreq>" + changefreq + "</changefreq>" : "") +
        (priority ? "<priority>" + priority + "</priority>" : "") +
        "</url>"
    );
  };
  add("index.html", isoDay(new Date()), "1.0", "daily");
  add("ettelaieh.html", isoDay((newsList[0] || {}).date), "0.9", "daily");
  add("amoozesh.html", "", "0.8", "weekly");
  add("kanonha.html", "", "0.8", "weekly");
  add("anjomanha.html", "", "0.8", "weekly");
  newsList.forEach((n) => add("ettelaieh/" + n._slug + ".html", isoDay(n.date), "0.7", "monthly"));
  courseList.forEach((c) => add("amoozesh/" + c._slug + ".html", "", "0.6", "monthly"));
  kanonhaList.forEach((k) => add("kanonha/" + k.slug + ".html", "", "0.6", "monthly"));
  anjomanhaList.forEach((a) => add("anjomanha/" + a.slug + ".html", "", "0.6", "monthly"));
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.join("\n") +
    "\n</urlset>\n";
  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), xml, "utf8");
  console.log("✔ sitemap.xml (" + urls.length + " آدرس)");
})();
(function writeRobots() {
  const txt = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin/",
    "Disallow: /build/",
    "Disallow: /worker/",
    "",
    "Sitemap: " + SITE_URL + "/sitemap.xml",
    ""
  ].join("\n");
  fs.writeFileSync(path.join(ROOT, "robots.txt"), txt, "utf8");
  console.log("✔ robots.txt");
})();