/**
 * Decap CMS OAuth gateway + Web Push relay (پلتفرم دانشگاه سمنان)
 * Deploy: npx wrangler deploy        (inside ./worker)
 * Test dev: npx wrangler dev --local   (uses .dev.vars for secrets)
 *
 * Env secrets (set via: npx wrangler secret put <NAME>):
 *   GITHUB_CLIENT_ID      — OAuth App Client ID (from GitHub)
 *   GITHUB_CLIENT_SECRET  — OAuth App Client Secret
 *   VAPID_PRIVATE_KEY     — private half of the VAPID keypair
 *   ADMIN_KEY             — secret to trigger /api/_cron manually
 *
 * Routes (OAuth):
 *   /auth?client_id=..&redirect_uri=..&scope=..&state=..
 *     -> redirect to GitHub authorize
 *   /auth/callback?code=..&state=..
 *     -> exchange code for token, redirect back with #access_token=..
 *
 * Routes (Web Push):
 *   POST /api/subscribe    {endpoint,p256dh,auth} -> store PushSubscription
 *   POST /api/unsubscribe  {endpoint}            -> remove subscription
 *   GET  /api/health       -> { ok, subs }
 *   GET  /api/_cron?key=<ADMIN_KEY> -> run publish loop manually (testing)
 *
 * Scheduled (every 2 min):
 *   fetch https://semnanplatform.ir/latest.json, diff ids against the KV
 *   snapshot, then Web-Push ONLY the newly added items (no history burst).
 */
import webPush from "web-push";

const GITHUB_AUTH = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN = "https://github.com/login/oauth/access_token";
const FALLBACK_REDIRECT = "https://semnanplatform.ir/admin/index.html";
const ORIGIN = "https://semnanplatform.ir";
const K_SUBS = "notif:subs";
const K_IDS = "notif:snapshot_ids";
const MAX_SUBS = 2000;

function htmlPage(title, body) {
  return new Response(
    `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8">
     <meta name="viewport" content="width=device-width, initial-scale=1">
     <title>${title}</title>
     <style>
       body{font-family:Vazirmatn,Arial,sans-serif;background:#FFFDF0;color:#001840;
            display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}
       .box{max-width:520px;background:#fff;border:1px solid #ffdc5f;border-radius:16px;
            padding:32px;box-shadow:0 20px 40px -30px rgba(0,24,64,.4)}
       h1{font-size:1.2rem;margin:0 0 12px} p{color:#52525b;font-size:.95rem}
       code{background:#102A7112;border-radius:6px;padding:2px 8px}
       a{color:#102A71;font-weight:700}
     </style></head><body><div class="box">${body}</div></body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Max-Age": "86400"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...CORS }
  });
}

async function getSubs(env) {
  const v = await env.NOTIF_SUBS.get(K_SUBS, "json");
  return Array.isArray(v) ? v : [];
}

async function setSubs(env, subs) {
  await env.NOTIF_SUBS.put(K_SUBS, JSON.stringify(subs.slice(0, MAX_SUBS)));
}

async function getIds(env) {
  const v = await env.NOTIF_SUBS.get(K_IDS, "json");
  return Array.isArray(v) ? v : null;
}

async function setIds(env, ids) {
  await env.NOTIF_SUBS.put(K_IDS, JSON.stringify(ids));
}

/* Payload دقیقاً همان قالب اعلان صفحه (main.js) — فقط از سمت SW نمایش داده می‌شود */
function toPayload(it, origin) {
  const title = it.title || "";
  const url =
    it.link && /^https?:/.test(it.link) ? it.link : origin + (it.link || "/");
  let ntitle, body;
  if (it.type === "course") {
    ntitle = "دوره‌ی آموزشی جدید 📚 " + title;
    body = it.teacher ? it.teacher + (it.price ? " · " + it.price : "") : it.summary || "";
  } else if (it.type === "discount") {
    ntitle = "تخفیف جدید 🎁 " + title;
    body = it.summary || "";
    if (it.code) body = (body ? body + " — " : "") + "کد تخفیف: " + it.code;
  } else {
    ntitle = "اطلاعیه‌ی جدید 📣 " + title;
    body = it.summary || "";
  }
  return {
    id: it.id,
    title: ntitle,
    body,
    url,
    tag: "spn-" + it.id,
    icon: origin + "/assets/images/SVG/logo.svg"
  };
}

async function sendPush(sub, payload, env) {
  const details = webPush.generateRequestDetails(sub, JSON.stringify(payload), {
    TTL: 86400,
    urgency: "normal",
    vapidDetails: {
      subject: "mailto:pouyab.team@gmail.com",
      publicKey: env.VAPID_PUBLIC_KEY,
      privateKey: env.VAPID_PRIVATE_KEY
    }
  });
  const res = await fetch(details.endpoint, {
    method: details.method,
    headers: details.headers,
    body: details.body
  });
  if (res.status !== 201 && res.status !== 202 && res.status !== 204) {
    const err = new Error("push HTTP " + res.status + " " + (await res.text()).slice(0, 120));
    err.statusCode = res.status;
    throw err;
  }
  return details;
}

/* اولین اجرا فقط اسنپ‌شات می‌گیرد (silent baseline)؛
   فقط آیتم‌های «جدیدتر» از اسنپ‌شات قبلی push می‌شوند — تاریخچه پخش نمی‌شود */
async function processNewItems(env) {
  const origin = (env && env.SITE_ORIGIN) || ORIGIN;
  let latest = null;
  try {
    const res = await fetch(origin + "/latest.json", {
      headers: { accept: "application/json" },
      cf: { cacheTtl: 30 }
    });
    if (!res.ok) throw new Error("latest.json HTTP " + res.status);
    latest = await res.json();
  } catch (e) {
    console.error("latest.json fetch failed:", e.message);
    return;
  }
  const items = Array.isArray(latest && latest.items) ? latest.items : [];
  const ids = items.map((i) => i && i.id).filter(Boolean);
  if (ids.length === 0) return;

  const prev = await getIds(env);
  if (prev === null) {
    await setIds(env, ids); // باری اول: بی‌صدا
    return;
  }

  const newItems = items.filter((i) => i.id && prev.indexOf(i.id) === -1);
  if (newItems.length > 0) {
    const subs = await getSubs(env);
    for (const item of newItems) {
      const payload = toPayload(item, ORIGIN);
      await Promise.allSettled(
        subs.map((sub) =>
          sendPush(sub, payload, env).catch((err) => {
            const status = err && err.statusCode;
            if (status === 404 || status === 410) {
              console.log("removing stale sub:", sub.endpoint.slice(0, 60));
              return removeSub(env, sub.endpoint);
            }
            console.error("push failed:", status || err.message);
          })
        )
      );
    }
  }
  await setIds(env, ids);
}

async function removeSub(env, endpoint) {
  const subs = await getSubs(env);
  const next = subs.filter((s) => s.endpoint !== endpoint);
  if (next.length !== subs.length) await setSubs(env, next);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;

    /* ---------- CORS preflight ---------- */
    if (request.method === "OPTIONS" && pathname.startsWith("/api/")) {
      return new Response(null, { status: 204, headers: CORS });
    }

    /* ---------- Web Push API ---------- */
    if (pathname === "/api/subscribe" && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch (_) {
        return json({ error: "bad json" }, 400);
      }
      const sub = body.subscription || body;
      if (!sub || !sub.endpoint || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) {
        return json({ error: "invalid subscription" }, 400);
      }
      const record = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
        at: new Date().toISOString()
      };
      const subs = await getSubs(env);
      const idx = subs.findIndex((s) => s.endpoint === sub.endpoint);
      if (idx >= 0) subs[idx] = record;
      else subs.push(record);
      await setSubs(env, subs);
      return json({ ok: true, subs: subs.length });
    }

    if (pathname === "/api/unsubscribe" && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch (_) {
        return json({ error: "bad json" }, 400);
      }
      if (!body || !body.endpoint) return json({ error: "endpoint required" }, 400);
      const subs = await getSubs(env);
      const next = subs.filter((s) => s.endpoint !== body.endpoint);
      if (next.length !== subs.length) await setSubs(env, next);
      return json({ ok: true });
    }

    if (pathname === "/api/health") {
      const subs = await getSubs(env);
      return json({ ok: true, subs: subs.length });
    }

    if (pathname === "/api/_cron") {
      if (!env.ADMIN_KEY || searchParams.get("key") !== env.ADMIN_KEY) {
        return json({ error: "forbidden" }, 403);
      }
      await processNewItems(env);
      return json({ ok: true });
    }

    /* تشخیصی: push تستی به همه اشتراک‌ها + نتیجه دقیق هر کدام */
    if (pathname === "/api/_testpush") {
      if (!env.ADMIN_KEY || searchParams.get("key") !== env.ADMIN_KEY) {
        return json({ error: "forbidden" }, 403);
      }
      const sid = searchParams.get("sub") || "";
      const payload = {
        id: "test:manual",
        title: "🧪 تست اعلان پس‌زمینه",
        body: "اگر این را دیدی، push کاملاً کار می‌کند",
        url: ORIGIN + "/",
        tag: "spn-test:manual",
        icon: ORIGIN + "/assets/images/SVG/logo.svg"
      };
      const subs = await getSubs(env);
      const targets = sid ? subs.filter((s) => s.endpoint.includes(sid)) : subs;
      const results = [];
      for (const sub of targets) {
        try {
          await sendPush(sub, payload, env);
          results.push({ ok: true, endpoint: sub.endpoint.slice(0, 60) });
        } catch (err) {
          results.push({
            ok: false,
            endpoint: sub.endpoint.slice(0, 60),
            status: err && err.statusCode,
            message: err && err.message ? err.message : String(err)
          });
        }
      }
      return json({ ok: true, total: subs.length, sent: results });
    }

    /* تشخیصی: لیست کامل اشتراک‌ها (بدون کلیدهای حساس) */
    if (pathname === "/api/_listsubs") {
      if (!env.ADMIN_KEY || searchParams.get("key") !== env.ADMIN_KEY) {
        return json({ error: "forbidden" }, 403);
      }
      const subs = await getSubs(env);
      return json({
        ok: true,
        count: subs.length,
        subs: subs.map((s, i) => ({
          index: i + 1,
          shorten: s.endpoint.slice(0, 90),
          host: (s.endpoint.split("/")[2] || "").split(".").slice(-2).join("."),
          registered: s.at
        }))
      });
    }

    /* ---------- OAuth (داشبورد) ---------- */
    if (pathname === "/") {
      return htmlPage("دروازه ورود داشبورد", `
        <h1>سرویس ورود به داشبورد پلتفرم دانشگاه سمنان</h1>
        <p>این نقطه، احراز هویت گیت‌هاب برای <code>/admin</code> را انجام می‌دهد.
        برای شروع، به <a href="/auth?redirect_uri=${encodeURIComponent(FALLBACK_REDIRECT)}&scope=repo">این لینک</a> بروید.</p>`);
    }

    if (pathname === "/auth") {
      const client_id = searchParams.get("client_id") || env.GITHUB_CLIENT_ID;
      const scope = searchParams.get("scope") || "repo";
      const redirect_uri = searchParams.get("redirect_uri") || FALLBACK_REDIRECT;
      const state = searchParams.get("state") || "cms";

      if (!client_id || !env.GITHUB_CLIENT_SECRET) {
        return htmlPage("خطا در پیکربندی", `
          <h1>Client ID/Secret تعریف نشده است</h1>
          <p>مقادیر <code>GITHUB_CLIENT_ID</code> و <code>GITHUB_CLIENT_SECRET</code> را با
          <code>npx wrangler secret put ...</code> تنظیم کنید.</p>`);
      }

      const authUrl = new URL(GITHUB_AUTH);
      authUrl.searchParams.set("client_id", client_id);
      authUrl.searchParams.set("redirect_uri", url.origin + "/auth/callback");
      authUrl.searchParams.set("scope", scope);
      authUrl.searchParams.set("state", JSON.stringify({ redirect_uri, state }));
      return Response.redirect(authUrl.toString(), 302);
    }

    if (pathname === "/auth/callback") {
      const code = searchParams.get("code");
      const stateRaw = searchParams.get("state") || "{}";
      let redirect_uri = FALLBACK_REDIRECT;
      let decapState = "";
      try {
        const parsed = JSON.parse(stateRaw);
        redirect_uri = parsed.redirect_uri || FALLBACK_REDIRECT;
        decapState = parsed.state || "";
      } catch (_) {
        /* ignore malformed state */
      }

      if (!code) {
        return htmlPage("خطا", `<h1>کد تأیید دریافت نشد</h1><p>به <a href="/">صفحه اصلی دروازه</a> برگردید.</p>`);
      }

      const client_id = env.GITHUB_CLIENT_ID;
      const client_secret = env.GITHUB_CLIENT_SECRET;

      const tokenRes = await fetch(GITHUB_TOKEN, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json"
        },
        body: JSON.stringify({ client_id, client_secret, code })
      });

      const data = await tokenRes.json();

      if (!data.access_token) {
        return htmlPage("خطای تأیید", `
          <h1>توکن دریافت نشد</h1>
          <p>${data.error_description || data.error || "خطای ناشناخته"}</p>
          <p><a href="/auth?redirect_uri=${encodeURIComponent(FALLBACK_REDIRECT)}&scope=repo">تلاش مجدد</a></p>`);
      }

      const back = new URL(redirect_uri);
      back.hash =
        `access_token=${encodeURIComponent(data.access_token)}` +
        (data.scope ? `&scope=${encodeURIComponent(data.scope)}` : "") +
        `&token_type=bearer` +
        (decapState ? `&state=${encodeURIComponent(decapState)}` : "");

      return Response.redirect(back.toString(), 302);
    }

    return htmlPage("یافت نشد", `<h1>صفحه پیدا نشد</h1><p>مسیرهای مجاز: <code>/</code>، <code>/auth</code>، <code>/auth/callback</code> و API اعلان‌ها</p>`);
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(processNewItems(env));
  }
};