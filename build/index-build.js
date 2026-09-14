/*
 * Assembles hand-authored HTML pages using shared header/footer parts.
 * Run: node build/index-build.js
 */
const fs = require("fs");
const path = require("path");

const P = (f) => fs.readFileSync(path.join(__dirname, "parts", f), "utf8");
const ROOT = path.join(__dirname, "..");

function assemble(open, title, header, bodyParts, footer, close) {
  return (
    open.replace("<!--TITLE-->", "<title>" + title + "</title>").replace("<!--HEADER-->", header) +
    bodyParts.join("\n") +
    footer +
    "\n" +
    close
  );
}

const open = P("_open.html");
const header = P("_header.html");
const footer = P("_footer.html");
const close = P("index-99-close.html");

const index = assemble(
  open,
  "پلتفرم دانشگاه سمنان | تجربه‌ای متفاوت از دانشگاه",
  header,
  [P("index-01-head.html"), P("_marquee.html"), P("index-04-ads.html"), P("index-03-news.html"), P("index-06-discounts.html"), P("index-05-join.html")],
  footer,
  close
);
fs.writeFileSync(path.join(ROOT, "index.html"), index, "utf8");
console.log("✔ index.html");

const amoozesh = assemble(
  open,
  "آموزش‌های مجازی | پلتفرم دانشگاه سمنان",
  header,
  [P("amoozesh-part.html")],
  footer,
  close
);
fs.writeFileSync(path.join(ROOT, "amoozesh.html"), amoozesh, "utf8");
console.log("✔ amoozesh.html");