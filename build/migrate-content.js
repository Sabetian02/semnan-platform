/*
 * One-time migration: legacy build/*.json + hardcoded sections -> content/ (CMS-managed)
 * Run: node build/migrate-content.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CONTENT = path.join(ROOT, "content");
const read = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, f), "utf8"));

function ensure(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function dumpProfiles(list, folder) {
  const dir = path.join(CONTENT, folder);
  ensure(dir);
  for (const it of list) {
    const file = path.join(dir, it.id + ".json");
    fs.writeFileSync(
      file,
      JSON.stringify(
        {
          slug: it.id,
          name: it.name,
          short: it.short,
          cat: it.cat,
          icon: it.icon,
          telegram: it.telegram || "",
          desc: it.desc,
          activities: it.activities || [],
          events: it.events || [],
          classes: it.classes || []
        },
        null,
        2
      ) + "\n",
      "utf8"
    );
    console.log("✔", path.relative(ROOT, file));
  }
}

function loadFolder(folder) {
  const dir = path.join(CONTENT, folder);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
}

/* --- profiles (from legacy data) --- */
dumpProfiles(read("kanonha-data.json"), "kanonha");
dumpProfiles(read("anjomanha-data-a.json").concat(read("anjomanha-data-b.json")), "anjomanha");

/* --- news (seed from current homepage cards) --- */
const news = [
  {
    slug: "dorehaye-maharati",
    title: "ثبت‌نام دوره‌های مهارتی جدید",
    summary: "دوره‌های فن بیان، اکسل حرفه‌ای و هوش مصنوعی با ظرفیت محدود آغاز شد.",
    category: "دوره",
    link: "amoozesh.html",
    image: "",
    date: "2026-09-01T10:00:00.000Z",
    active: true
  },
  {
    slug: "hafte-farhang-honar",
    title: "هفته فرهنگ و هنر دانشگاه",
    summary: "ویژه‌برنامه‌های کانون‌های فرهنگی تا پایان ماه برگزار می‌شود.",
    category: "رویداد",
    link: "kanonha.html",
    image: "",
    date: "2026-08-20T10:00:00.000Z",
    active: true
  },
  {
    slug: "jozb-ozv-anjomanha",
    title: "جذب عضو انجمن‌های علمی",
    summary: "انجمن‌های رشته‌ای عضو جدید می‌پذیرند؛ از پروفایل هر انجمن شروع کن.",
    category: "فراخوان",
    link: "anjomanha.html",
    image: "",
    date: "2026-08-10T10:00:00.000Z",
    active: true
  },
  {
    slug: "taghvim-rooydadhaye-platform",
    title: "تقویم رویدادهای پلتفرم",
    summary: "همه اطلاعیه‌ها و فراخوان‌ها لحظه‌ای در کانال تلگرام پلتفرم منتشر می‌شود.",
    category: "اطلاع‌رسانی",
    link: "https://t.me/PlatformSem",
    image: "",
    date: "2026-08-01T10:00:00.000Z",
    active: true
  }
];
ensure(path.join(CONTENT, "news"));
for (const n of news) {
  fs.writeFileSync(path.join(CONTENT, "news", n.slug + ".json"), JSON.stringify(n, null, 2) + "\n", "utf8");
  console.log("✔", path.relative(ROOT, path.join(CONTENT, "news", n.slug + ".json")));
}

/* --- discounts (empty, keep design's empty-state) --- */
ensure(path.join(CONTENT, "discounts"));
fs.writeFileSync(path.join(CONTENT, "discounts", ".gitkeep"), "", "utf8");

/* --- home --- */
const home = {
  hero: {
    badge: "🎓 پلتفرم رسمی اطلاع‌رسانی فعالیت‌های دانشجویی دانشگاه سمنان",
    title_before: "دانشگاه فقط کلاس و امتحان نیست؛ ",
    title_highlight: "تجربه‌اش کن!",
    lead: "پلتفرم دانشگاه سمنان، تمام فعالیت‌های فرهنگی، آموزشی و علمی دانشگاه را بررسی، جمع‌بندی و در یک مسیر ساده در اختیار تو می‌گذارد؛ فرصت‌هایی که شاید هیچ‌وقت از آن‌ها خبر نداشتی — همین‌جاست که پیدایشان می‌کنی.",
    telegram_url: "https://t.me/PlatformSem",
    cta_tele_text: "عضو پلتفرم شو",
    stats: [
      { number: "+۴۰", label: "کانون فرهنگی و انجمن علمی" },
      { number: "+۲۰", label: "دوره و آموزش مهارتی" },
      { number: "+۳۰۰۰", label: "دانشجوی عضو" }
    ],
    card_items: [
      { icon: "🎤", tone: "", title: "ایونت و رویداد", subtitle: "مسابقات، کارگاه‌ها و جشن‌ها", link: "#news" },
      { icon: "🎓", tone: "navy", title: "کانون‌ها و انجمن‌ها", subtitle: "۴۶ تشکل فعال دانشجویی", link: "kanonha.html" },
      { icon: "📚", tone: "", title: "آموزش و مهارت", subtitle: "دوره‌های کاربردی و مجازی", link: "amoozesh.html" }
    ],
    float1: { icon: "🔔", text: "اطلاعیه‌های دانشجویی", link: "#news" },
    float2: { icon: "🎁", text: "تخفیف‌های دانشجویی", link: "#discounts" }
  },
  ticker: [
    { icon: "✦", label: "اطلاعیه", text: "ثبت‌نام کانون‌های فرهنگی و انجمن‌های علمی آغاز شد" },
    { icon: "📣", label: "", text: "برای عضویت در کانال پلتفرم، همین حالا به t.me/PlatformSem بپیوند" },
    { icon: "🎁", label: "", text: "تخفیف‌های دانشجویی پلتفرم فعال شد؛ بیشتر استفاده کن، کمتر هزینه کن" },
    { icon: "🎓", label: "", text: "جشن استقبال از دانشجویان جدید به‌زودی برگزار می‌شود" },
    { icon: "💻", label: "", text: "دوره‌های آموزش مجازی با گواهی معتبر در حال برگزاری است" }
  ],
  ads: {
    slot1: { image: "assets/images/ad1.webp", link: "https://t.me/PlatformSem", active: true },
    slot2: { image: "assets/images/ad2.webp", link: "https://t.me/PlatformSem", active: true },
    reserve: { label: "رزرو تبلیغات", link: "https://t.me/PlatformSem" }
  },
  news_head: {
    eyebrow: "تازه‌ها و اطلاعیه‌ها",
    title: "از جدیدترین رویدادها جا نمان",
    subtitle: "فراخوان‌ها، دوره‌ها و رویدادهای دانشگاه را اینجا ببین؛ جزئیات کامل همیشه در کانال پلتفرم منتشر می‌شود."
  },
  discounts_head: {
    eyebrow: "تخفیف‌های دانشجویی",
    empty_title: "فعلاً تخفیفی وجود نداره!",
    empty_text: "تخفیف‌های دانشجویی پلتفرم فعلاً خالیه. به محض فعال‌شدن، همین‌جا (و در کانال تلگرام) اولین نفری باش که خبرشو می‌گیره.",
    cta: { label: "مطلع شو", link: "https://t.me/PlatformSem" }
  },
  join: {
    title: "همه رویدادها و اطلاعیه‌ها در کانال پلتفرم",
    text: "عضویت در کانال تلگرام پلتفرم، سریع‌ترین راه برای جا نماندن از فراخوان‌ها، دوره‌ها و تخفیف‌های دانشجویی است.",
    cta: { label: "عضویت در کانال پلتفرم", link: "https://t.me/PlatformSem" }
  },
  seo: {
    title: "پلتفرم دانشگاه سمنان | تجربه‌ای متفاوت از دانشگاه",
    description: "پلتفرم دانشگاه سمنان؛ فعالیت‌های فرهنگی، آموزشی و علمی دانشگاه را بررسی و جمع‌بندی می‌کند. رویدادها، کانون‌ها، انجمن‌های علمی، آموزش‌های مجازی، تخفیف‌های دانشجویی و خدمات روز دانشگاه را یک‌جا تجربه کن."
  }
};
fs.writeFileSync(path.join(CONTENT, "home.json"), JSON.stringify(home, null, 2) + "\n", "utf8");
console.log("✔ content/home.json");

/* --- site --- */
const site = {
  brand_name: "پلتفرم دانشگاه سمنان",
  brand_tagline: "دانشگاه رو فقط نگذرون؛ تجربه‌اش کن",
  telegram_url: "https://t.me/PlatformSem",
  nav: [
    { label: "خانه", link: "index.html" },
    { label: "کانون‌های فرهنگی", link: "kanonha.html" },
    { label: "انجمن‌های علمی", link: "anjomanha.html" },
    { label: "آموزش مجازی", link: "amoozesh.html" }
  ],
  cta: { label: "ورود به کانال پلتفرم", link: "https://t.me/PlatformSem" },
  footer: {
    slogan: "تجربهٔ دانشگاه؛ نه فقط گذراندنش",
    about: "مرجع جامع اطلاع‌رسانی فعالیت‌های فرهنگی، علمی و آموزشی دانشگاه سمنان؛ همه تشکل‌ها، رویدادها و دوره‌های مهارتی را یک‌جا بشناس.",
    quick_title: "دسترسی سریع",
    quick: [
      { label: "خانه", link: "index.html" },
      { label: "کانون‌های فرهنگی", link: "kanonha.html" },
      { label: "انجمن‌های علمی", link: "anjomanha.html" },
      { label: "آموزش‌های مجازی", link: "amoozesh.html" }
    ],
    services_title: "خدمات پلتفرم",
    services: [
      { label: "دوره‌های مهارتی", link: "amoozesh.html" },
      { label: "راهنمای کانون‌ها", link: "kanonha.html" },
      { label: "راهنمای انجمن‌های علمی", link: "anjomanha.html" },
      { label: "اطلاع‌رسانی و تبلیغات", link: "https://t.me/PlatformSem" }
    ],
    right_text: "دانشگاه سمنان"
  }
};
fs.writeFileSync(path.join(CONTENT, "site.json"), JSON.stringify(site, null, 2) + "\n", "utf8");
console.log("✔ content/site.json");

console.log("\nمهاجرت انجام شد. تعداد در content/:",
  "kanonha:", loadFolder("kanonha").length,
  "| anjomanha:", loadFolder("anjomanha").length,
  "| news:", loadFolder("news").length);