/*
 * Helpers مشترک تشکل‌ها (کانون‌ها و انجمن‌های علمی)
 * لوگو، نشان جایگزین و ابزارهای امن‌سازی متن — مشترک بین build.js و index-build.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
/* خروجی امن برای داخل attribute های HTML */
const escA = (s) => esc(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/* نگاشت اسلاگ → نام فایل لوگو در assets/images/SVG.
   هر تشکلی که لوگو ندارد، نشان جایگزین (مونوگرام) می‌گیرد. */
const LOGO_DIR = "لوگو انجمن های علمی/";
const LOGO_MAP = {
  "zaban-farsi": LOGO_DIR + "انجمن زبان و ادبیات فارسی.svg",
  "adyan-erfan": LOGO_DIR + "انجمن علمی ادیان و عرفان.svg",
  "eghtesad": LOGO_DIR + "انجمن علمی اقتصاد.svg",
  "hesabdari": LOGO_DIR + "انجمن علمی حسابداری.svg",
  "dampezeshki": LOGO_DIR + "انجمن علمی دکتری دامپزشکی.svg",
  "robotics-ai": LOGO_DIR + "انجمن علمی رباتیک و هوش مصنوعی.svg",
  "ravanshenasi": LOGO_DIR + "انجمن علمی روانشناسی.svg",
  "zaban-anglisi": LOGO_DIR + "انجمن علمی زبان و ادبیات انگلیسی دانشگاه سمنان.svg",
  "zist-seloli": LOGO_DIR + "انجمن علمی زیست شناسی دانشگاه سمنان.svg",
  "shahrsazi": LOGO_DIR + "انجمن علمی شهرسازی.svg",
  "anjoman-sanaye-dasti": LOGO_DIR + "انجمن علمی صنایع دستی.svg",
  "tarahi-parche": LOGO_DIR + "انجمن علمی طراحی پارچه.svg",
  "olum-azmayeshgahi": LOGO_DIR + "انجمن علمی علوم آزمایشگاهی دامپزشکی.svg",
  "aks-semnan": LOGO_DIR + "انجمن علمی عکاسی.svg",
  "farsh": LOGO_DIR + "انجمن علمی فرش.svg",
  "modiriat": LOGO_DIR + "انجمن علمی مدیریت.svg",
  "memari": LOGO_DIR + "انجمن علمی معماری.svg",
  "manabe-tabii": LOGO_DIR + "انجمن علمی منابع طبیعی.svg",
  "mohandesi-barg": LOGO_DIR + "انجمن علمی مهندسی برق.svg",
  "ie-semnan-uni": LOGO_DIR + "انجمن علمی مهندسی صنایع.svg",
  "mavad-va-metallurgi": LOGO_DIR + "انجمن علمی مهندسی مواد و متالورژی.svg",
  "naft-va-gaz": LOGO_DIR + "انجمن علمی مهندسی نفت.svg",
  "mohandesi-kamyuter": LOGO_DIR + "انجمن علمی مهندسی کامپیوتر دانشگاه سمنان.svg",
  "graphik": LOGO_DIR + "انجمن علمی گرافیک.svg",
  "shimi": LOGO_DIR + "لوگو انجمن علمی شیمی.svg",
  "mohandesi-mekanik": LOGO_DIR + "لوگو انجمن علمی مهندسی مکانیک.svg",
  "hoghoogh-feqh": LOGO_DIR + "لوگوی انجمن علمی حقوق و فقه.svg",
  "govandegi-va-ecra": "لوگوی_کانون_فرهنگی_گویندگی_و_اجرا.svg",
  "kooir-shenasi": LOGO_DIR + "لوگو انجمن علمی کویرشناسی.svg",
  "anjoman-gardeshgari": LOGO_DIR + "انجمن علمی گردشگری.svg",
  "zist-farzanegan": LOGO_DIR + "انجمن علمی زیست شناسی فرزانگان.svg",
  "olum-kamyuter": LOGO_DIR + "انجمن علمی علوم کامپیوتر.svg",
  "omran": LOGO_DIR + "انجمن علمی عمران.svg",
  "mohandesi-shimi": LOGO_DIR + "انجمن علمی مهندسی شیمی.svg",
  "naghashi": LOGO_DIR + "انجمن علمی نقاشی.svg"
};

const LOGO_SUBDIR = "assets/images/SVG/";
const imgExists = (rel) => fs.existsSync(path.join(ROOT, rel));

/* نشان جایگزین موقت — طرح یکسان برای همهٔ تشکل‌های بدون لوگو */
function orgPlaceholder(name, cls) {
  const ch = String(name || "؟").trim().charAt(0) || "؟";
  return `<svg class="${cls || "org-mono"}" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><circle cx="50" cy="50" r="46" fill="#102A71"/><circle cx="50" cy="50" r="46" fill="none" stroke="#F5C400" stroke-width="2.5" stroke-dasharray="5 8" stroke-opacity=".85"/><text x="50" y="50" text-anchor="middle" dominant-baseline="central" font-family="Vazirmatn, Tahoma, sans-serif" font-size="42" font-weight="800" fill="#FFDC5F">${esc(ch)}</text></svg>`;
}

/* لوگوی تشکل: اول فیلد logo در محتوا، بعد نگاشت اسلاگ؛ در نبود هر دو → نشان جایگزین.
   prefix برای صفحات داخل پوشه ("../") لازم است. */
function orgLogo(it, prefix, imgClass, monoClass) {
  const file = String(it.logo || LOGO_MAP[it.slug] || "").trim();
  if (file) {
    if (/^https?:\/\//.test(file)) {
      return `<img class="${imgClass}" src="${escA(file)}" alt="لوگوی ${escA(it.name)}" loading="lazy" decoding="async">`;
    }
    const rel = file.indexOf("assets/") === 0 ? file : LOGO_SUBDIR + file;
    if (imgExists(rel)) {
      return `<img class="${imgClass}" src="${encodeURI(prefix + rel)}" alt="لوگوی ${escA(it.name)}" loading="lazy" decoding="async">`;
    }
  }
  return orgPlaceholder(it.short || it.name, monoClass);
}

/* مسیر تصویر محتوایی (آپلود داخلی یا URL) → با prefix مناسب؛ در غیر این‌صورت "" */
function orgImage(src, prefix, alt) {
  const s = String(src || "").trim();
  if (!s) return "";
  if (/^https?:\/\//.test(s)) return `<img src="${escA(s)}" alt="${escA(alt)}" loading="lazy" decoding="async">`;
  const rel = s.replace(/^\.\//, "");
  if (!imgExists(rel)) return "";
  return `<img src="${encodeURI(prefix + rel)}" alt="${escA(alt)}" loading="lazy" decoding="async">`;
}

/* تشکل مرجعِ یک اطلاعیه (کانون/انجمن).
   اطلاعیه‌ها از «بخش اطلاعیهٔ اصلی» می‌آیند و فیلد kanon/anjoman آن‌ها را به
   پروفایل تشکل‌ها وصل می‌کند؛ در نتیجه دسته‌بندی‌ها همیشه همان دسته‌بندی منطبق
   بر تنظیمات اصلی است و نیازی به کپی نیست.
   برگزارکننده‌ها می‌توانند چندتایی باشند: فیلدهای تکی (kanon/anjoman) برای
   سازگاری قبلی + فیلدهای لیستی (kanons/anjomans و co_kanons/co_anjomans).
   هر آیتم لیست می‌تواند `"slug"` یا `{ kanon: "slug" }` باشد — هر دو نرمال می‌شود. */
function slugFromItem(item) {
  if (item == null) return "";
  return typeof item === "string" ? item : item.kanon || item.anjoman || item.slug || "";
}
function newsOrgs(n, kanonha, anjomanha) {
  if (!n) return [];
  const slots = [];
  const addSlot = (key) => {
    const v = n[key];
    const list = Array.isArray(v) ? v : v ? [v] : [];
    list.forEach((x) => {
      const s = String(slugFromItem(x) || "").trim();
      if (s) slots.push({ key, slug: s });
    });
  };
  addSlot("kanon");
  addSlot("kanons");
  addSlot("co_kanons");
  addSlot("anjoman");
  addSlot("anjomans");
  addSlot("co_anjomans");
  const out = [];
  const seen = {};
  slots.forEach((sl) => {
    const coll = sl.key.indexOf("kanon") === 0 ? kanonha : anjomanha;
    if (!Array.isArray(coll)) return;
    const m = coll.find((x) => x && x.slug === sl.slug);
    if (!m) return;
    const kind = sl.key.indexOf("kanon") === 0 ? "کانون" : "انجمن";
    const base = sl.key.indexOf("kanon") === 0 ? "kanonha" : "anjomanha";
    const tag = kind + ":" + m.slug;
    if (seen[tag]) return;
    seen[tag] = true;
    out.push({ slug: m.slug, name: m.name, kind, base });
  });
  return out;
}

/* تشکل مرجع یک اطلاعیه — برای سازگاری با کدهای قبلی همان عنصر اول را برمی‌گرداند */
function newsOrg(n, kanonha, anjomanha) {
  return newsOrgs(n, kanonha, anjomanha)[0] || null;
}

/* لینک تلگرام طوری که مستقیم در اپ باز شود: https://t.me/user → tg://resolve?domain=user
   لینک‌های share تلگرام (https://t.me/share/…) دست نمی‌خورند تا دکمهٔ اشتراک‌گذاری
   همچنان وب‌شیت تلگرام را باز کند. */
function tgHref(link) {
  const s = String(link || "").trim();
  const m = s.match(/^https?:\/\/(?:www\.)?t\.me\/([A-Za-z0-9_]+)(?:[/?#].*)?$/);
  if (!m || m[1] === "share") return s;
  const domain = m[1];
  return "tg://resolve?domain=" + domain;
}

module.exports = { ROOT, esc, escA, LOGO_MAP, orgLogo, orgPlaceholder, orgImage, newsOrg, newsOrgs, tgHref };
