/* Link verification — run: node build/verify.js */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const htmls = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (p.split(path.sep).includes("build")) continue;
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (f.endsWith(".html")) htmls.push(p);
  }
})(ROOT);
htmls.sort();

let problems = 0;
const teleSeen = {};
let teleCount = 0;

for (const file of htmls) {
  const src = fs.readFileSync(file, "utf8");
  const rel = path.relative(ROOT, file);
  const re = /(?:href|src)="([^"#]+?)(?:#[^"]*)?"/g;
  let m;
  while ((m = re.exec(src))) {
    const raw = m[1];
    if (/^(https?:|mailto:|tel:|data:|tg:)/.test(raw)) continue;
    let decoded = raw;
    try { decoded = decodeURIComponent(raw); } catch (e) {}
    const clean = decoded.split("?")[0].replace(/\/+$/, "");
    if (!clean) continue;
    const target = path.resolve(path.dirname(file), clean);
    if (!fs.existsSync(target)) {
      console.log("✖ Broken link:", rel, "→", raw, "(target:", path.relative(ROOT, target), ")");
      problems++;
    }
  }
  // count telegram brand mentions (web or app scheme)
  const tg = src.match(/(?:t\.me|tg:\/\/resolve\?domain=)\/?(PlatformSem(?:[?#].*)?)/g);
  if (tg) teleCount += tg.length;
  tg && tg.forEach(() => { teleSeen[rel] = (teleSeen[rel] || 0) + 1; });
}

console.log("\nScanned", htmls.length, "HTML files");
console.log("Broken local links:", problems);
console.log("Telegram PlatformSem references:", teleCount, "across", Object.keys(teleSeen).length, "pages");

// check telegram channel presence in profile pages
const profileFiles = htmls.filter((f) => /(kanonha|anjomanha)\\/.test(f));
let missing = 0;
for (const f of profileFiles) {
  const src = fs.readFileSync(f, "utf8");
  if (!/https:\/\/t\.me\/\S+|tg:\/\/resolve\?domain=\S+/.test(src)) {
    console.log("✖ No telegram link in", path.relative(ROOT, f));
    missing++;
  }
}
console.log("Profile pages without telegram:", missing);
process.exit(problems ? 1 : 0);