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

/* نشان جایگزین موقت — مونوگرام تک‌حرفی هم‌رنگِ ظرف (currentColor) */
function orgPlaceholder(name, cls) {
  const ch = String(name || "؟").trim().charAt(0) || "؟";
  return `<svg class="${cls || "org-mono"}" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><text x="50" y="52" text-anchor="middle" dominant-baseline="central" font-family="Vazirmatn, Tahoma, sans-serif" font-size="68" font-weight="800" fill="currentColor">${esc(ch)}</text></svg>`;
}

/* لوگوی تشکل: اول فیلد logo در محتوا، بعد نگاشت اسلاگ؛ در نبود هر دو → نشان جایگزین.
   لوگوی واقعی به‌صورت ماسک رندر می‌شود تا هم‌رنگِ ظرف (آبی تیره در فهرست، سفید در پروفایل) شود.
   prefix برای صفحات داخل پوشه ("../") لازم است. */
function orgLogo(it, prefix, imgClass, monoClass) {
  const file = String(it.logo || LOGO_MAP[it.slug] || "").trim();
  if (file) {
    let src = "";
    if (/^https?:\/\//.test(file)) {
      src = file;
    } else {
      const rel = file.indexOf("assets/") === 0 ? file : LOGO_SUBDIR + file;
      if (imgExists(rel)) src = encodeURI(prefix + rel);
    }
    if (src) {
      return `<span class="${imgClass} org-logo-mask" role="img" aria-label="لوگوی ${escA(it.name)}" style="--l:url('${escA(src)}')"></span>`;
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
   بر تنظیمات اصلی است و نیازی به کپی نیست. */
function newsOrg(n, kanonha, anjomanha) {
  const k = n && n.kanon;
  if (k && Array.isArray(kanonha)) {
    const m = kanonha.find((x) => x && x.slug === k);
    if (m) return { slug: m.slug, name: m.name, kind: "کانون", base: "kanonha" };
  }
  const a = n && n.anjoman;
  if (a && Array.isArray(anjomanha)) {
    const m = anjomanha.find((x) => x && x.slug === a);
    if (m) return { slug: m.slug, name: m.name, kind: "انجمن", base: "anjomanha" };
  }
  return null;
}

module.exports = { ROOT, esc, escA, LOGO_MAP, orgLogo, orgPlaceholder, orgImage, newsOrg };
