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
const LOGO_MAP = {
  "hoghoogh-feqh": "لوگوی انجمن علمی حقوق و فقه.svg",
  "govandegi-va-ecra": "لوگوی_کانون_فرهنگی_گویندگی_و_اجرا.svg",
  "kooir-shenasi": "لوگو انجمن علمی کویرشناسی.svg"
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

module.exports = { ROOT, esc, escA, LOGO_MAP, orgLogo, orgPlaceholder, orgImage };
