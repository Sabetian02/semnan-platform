/*
 * ابزارهای رسانه‌ای استاتیک — اندازهٔ تصویر، جاسازی ویدیو/فرم/نقشه و فایل‌ها.
 * همه‌چیز در زمان ساخت سایت محاسبه می‌شود تا صفحهٔ نهایی سریع و بدون پرش بماند.
 */
const fs = require("fs");
const path = require("path");

/* ---------- اندازهٔ تصویر: از هدر خود فایل خوانده می‌شود ---------- */
function imageSize(file) {
  let buf;
  try {
    buf = fs.readFileSync(file);
  } catch (_) {
    return null;
  }
  if (!buf || buf.length < 16) return null;
  const b = buf;

  /* PNG */
  if (b.readUInt32BE(0) === 0x89504e47) {
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  }
  /* GIF */
  if (b.toString("ascii", 0, 3) === "GIF") {
    return { w: b.readUInt16LE(6), h: b.readUInt16LE(8) };
  }
  /* WebP */
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const fmt = b.toString("ascii", 12, 16);
    if (fmt === "VP8X") {
      const w = 1 + (b[24] | (b[25] << 8) | (b[26] << 16));
      const h = 1 + (b[27] | (b[28] << 8) | (b[29] << 16));
      return { w, h };
    }
    if (fmt === "VP8L") {
      const bits = b.readUInt32LE(21);
      return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (fmt === "VP8 ") {
      return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    }
    return null;
  }
  /* JPEG */
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length - 9) {
      if (b[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = b[i + 1];
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        i += 2;
        continue;
      }
      const len = b.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
    return null;
  }
  /* SVG */
  if (/<svg/i.test(b.toString("utf8", 0, 400))) {
    const head = b.toString("utf8", 0, 1200);
    const vb = head.match(/viewBox\s*=\s*["']([\d.\s-]+)["']/i);
    if (vb) {
      const p = vb[1].trim().split(/[\s,]+/).map(Number);
      if (p.length === 4 && p[2] && p[3]) return { w: p[2], h: p[3] };
    }
    const w = head.match(/\bwidth\s*=\s*["']([\d.]+)/i);
    const h = head.match(/\bheight\s*=\s*["']([\d.]+)/i);
    if (w && h) return { w: +w[1], h: +h[1] };
  }
  return null;
}

/* ---------- حجم فایل: خوانا و فارسی ---------- */
function fileSize(file) {
  try {
    const n = fs.statSync(file).size;
    if (n < 1024) return n + " بایت";
    if (n < 1024 * 1024) return Math.round(n / 1024) + " کیلوبایت";
    return (Math.round((n / (1024 * 1024)) * 10) / 10).toString().replace(".", "٫") + " مگابایت";
  } catch (_) {
    return "";
  }
}

const EXT_KIND = {
  pdf: { kind: "pdf", label: "PDF" },
  doc: { kind: "doc", label: "Word" },
  docx: { kind: "doc", label: "Word" },
  xls: { kind: "sheet", label: "Excel" },
  xlsx: { kind: "sheet", label: "Excel" },
  ppt: { kind: "slide", label: "PowerPoint" },
  pptx: { kind: "slide", label: "PowerPoint" },
  zip: { kind: "zip", label: "ZIP" },
  rar: { kind: "zip", label: "RAR" },
  mp3: { kind: "audio", label: "صوت" },
  wav: { kind: "audio", label: "صوت" },
  m4a: { kind: "audio", label: "صوت" },
  mp4: { kind: "video", label: "ویدیو" },
  webm: { kind: "video", label: "ویدیو" },
  mov: { kind: "video", label: "ویدیو" },
  png: { kind: "image", label: "تصویر" },
  jpg: { kind: "image", label: "تصویر" },
  jpeg: { kind: "image", label: "تصویر" },
  webp: { kind: "image", label: "تصویر" },
  txt: { kind: "text", label: "متن" }
};
const fileKind = (name) => {
  const ext = String(name || "").split(".").pop().toLowerCase();
  return EXT_KIND[ext] || { kind: "file", label: ext ? ext.toUpperCase() : "فایل" };
};

/* ---------- ویدیو: آپارات، یوتیوب، ویمئو، فایل مستقیم یا لینک ---------- */
const VIDEO_RE = {
  aparat: /(?:aparat\.com)\/(?:v\/|video\/video\/embed\/videohash\/)([A-Za-z0-9_-]+)/i,
  youtube:
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i,
  vimeo: /(?:vimeo\.com\/(?!video\/)|player\.vimeo\.com\/video\/)(\d+)/i
};
const DIRECT_VIDEO = /\.(mp4|webm|mov|ogg)(?:$|[?#])/i;

function videoEmbed(url) {
  const u = String(url || "").trim();
  if (!u) return null;
  const a = u.match(VIDEO_RE.aparat);
  if (a) {
    return {
      kind: "embed",
      src: "https://www.aparat.com/video/video/embed/videohash/" + a[1] + "/vt/frame",
      allow: "autoplay; fullscreen; picture-in-picture",
      label: "آپارات"
    };
  }
  const y = u.match(VIDEO_RE.youtube);
  if (y) {
    return {
      kind: "embed",
      src: "https://www.youtube-nocookie.com/embed/" + y[1],
      allow: "autoplay; fullscreen; encrypted-media; picture-in-picture",
      label: "یوتیوب",
      thumb: "https://i.ytimg.com/vi/" + y[1] + "/hqdefault.jpg"
    };
  }
  const v = u.match(VIDEO_RE.vimeo);
  if (v) {
    return {
      kind: "embed",
      src: "https://player.vimeo.com/video/" + v[1],
      allow: "autoplay; fullscreen; picture-in-picture",
      label: "Vimeo"
    };
  }
  if (DIRECT_VIDEO.test(u) && /^https?:/i.test(u)) return { kind: "file", src: u, label: "ویدیو" };
  if (/^https?:/i.test(u)) return { kind: "link", src: u, label: "ویدیو" };
  return null;
}

/* ---------- فرم گوگل: فقط آدرس معتبر docs.google.com/forms پذیرفته می‌شود ---------- */
function formEmbed(url, height) {
  const u = String(url || "").trim();
  if (!u) return null;
  let ok = false;
  try {
    const x = new URL(u);
    ok = /(^|\.)docs\.google\.com$/.test(x.hostname) && /^\/forms\//.test(x.pathname);
  } catch (_) {
    ok = false;
  }
  if (ok) {
    const base = u.replace(/\?.*$/, "").replace(/\/$/, "");
    const src = /\/viewform$/.test(base)
      ? base + "?embedded=true"
      : base.replace(/\/(edit|viewform)$/, "") + "/viewform?embedded=true";
    return { kind: "form", src, height: Number(height) > 200 ? Number(height) : 900 };
  }
  /* هر فرم بیرونی دیگر (مثل پرس‌لاین/ایوند) فقط به‌شکل دکمه نمایش داده می‌شود */
  if (/^https?:/i.test(u)) return { kind: "link", src: u };
  return null;
}

/* ---------- نقشه: کد آیفریم، نشان یا گوگل‌مپ ---------- */
const IFRAME_SRC = /<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i;
const IFRAME_TITLE = /<iframe\b[^>]*\btitle\s*=\s*["']([^"']+)["']/i;
const isIframeCode = (s) => /^<iframe\b/i.test(String(s || "").trim());

function googleEmbed(u, x) {
  if (/output=embed/.test(u)) return { src: u };
  const q = x.searchParams.get("q");
  if (q) return { src: "https://maps.google.com/maps?q=" + encodeURIComponent(q.trim()) + "&output=embed" };
  const fromPath = decodeURIComponent(x.pathname.replace(/^\/(maps|place)\//, "")).trim();
  if (fromPath) return { src: "https://maps.google.com/maps?q=" + encodeURIComponent(fromPath) + "&output=embed" };
  return null;
}

function mapEmbed(url) {
  const u = String(url || "").trim();
  if (!u) return null;
  if (isIframeCode(u)) {
    const m = u.match(IFRAME_SRC);
    if (m && /^https?:/i.test(m[1])) {
      return { src: m[1], provider: "custom", title: (u.match(IFRAME_TITLE) || [])[1] || "نقشه" };
    }
  }
  try {
    const x = new URL(u);
    const host = x.hostname.replace(/^www\./, "");
    if (host === "neshan.org" || host.endsWith(".neshan.org")) {
      const place = x.pathname.match(/\/maps\/places\/([^/]+)/);
      if (place) return { src: "https://neshan.org/maps/iframe/places/" + place[1], provider: "neshan" };
      return { src: u, provider: "neshan" };
    }
    if (host === "nshn.ir" || host.endsWith(".nshn.ir")) return { src: u, provider: "neshan" };
    const isGoogle =
      host === "maps.google.com" ||
      host === "google.com" ||
      host === "google.ir" ||
      /^[^.]*\.google\.(com|ir)$/.test(host);
    if (isGoogle && (x.pathname.startsWith("/maps") || x.pathname.startsWith("/place") || x.searchParams.has("q"))) {
      const e = googleEmbed(u, x);
      if (e) return { src: e.src, provider: "google" };
    }
  } catch (_) {}
  return null;
}

module.exports = { imageSize, fileSize, fileKind, videoEmbed, formEmbed, mapEmbed, path };
