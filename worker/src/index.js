/**
 * Decap CMS OAuth gateway — GitHub external OAuth for GitHub Pages.
 * Deploy: npx wrangler deploy (inside ./worker)
 *
 * Env secrets (set via wrangler secret put):
 *   GITHUB_CLIENT_ID     — OAuth App Client ID (from GitHub)
 *   GITHUB_CLIENT_SECRET — OAuth App Client Secret
 *
 * Flow:
 *   /auth?client_id=..&redirect_uri=..&scope=..&state=..
 *     -> redirect to GitHub authorize
 *   /auth/callback?code=..&state=..
 *     -> exchange code for token, redirect back to redirect_uri with #access_token=..
 */
const GITHUB_AUTH = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN = "https://github.com/login/oauth/access_token";
const FALLBACK_REDIRECT = "https://semnanplatform.ir/admin/index.html";

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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;

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

    return htmlPage("یافت نشد", `<h1>صفحه پیدا نشد</h1><p>مسیرهای مجاز: <code>/</code>، <code>/auth</code>، <code>/auth/callback</code></p>`);
  }
};