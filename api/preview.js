// Public metadata only: never retrieve the private image or consume its one-time token.
module.exports = (req, res) => {
  const code = String(req.query.code || "");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  res.setHeader("Content-Security-Policy", "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src https://placehold.co; base-uri 'none'; frame-ancestors 'none'");
  if (!/^[A-Za-z0-9_-]{22}$/.test(code)) {
    return res.status(404).setHeader("Content-Type", "text/plain; charset=utf-8").end("Invalid photo link");
  }
  const canonical = "https://snapexpire.vercel.app/p/" + code;
  const destination = "https://snapexpire.vercel.app/#code=" + code;
  // Show preview metadata to WhatsApp/social crawlers only.
  // For real people, use an immediate HTTP redirect instead of loading
  // an intermediate HTML page and waiting for its JavaScript.
  const agent = String(req.headers["user-agent"] || "");
  const crawler = /WhatsApp|facebookexternalhit|Facebot|Twitterbot|TelegramBot|LinkedInBot|Slackbot|Discordbot|Googlebot|bingbot/i.test(agent);
  if (!crawler) return res.status(302).setHeader("Location", destination).end();
  res.status(200).setHeader("Content-Type", "text/html; charset=utf-8").end(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="no-referrer">
<meta property="og:type" content="website">\n<meta property="og:site_name" content="Photo">\n<meta property="og:title" content="Photo">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="https://placehold.co/1200x630/10241f/ffffff.png?text=%F0%9F%93%B7">
<meta property="og:image:secure_url" content="https://placehold.co/1200x630/10241f/ffffff.png?text=%F0%9F%93%B7">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<title>Photo</title>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;padding:24px;font:16px system-ui,-apple-system,sans-serif;background:radial-gradient(circle at 50% 10%,#1d4036,#0b1515 70%);color:#f1fff8}
main{width:min(100%,380px);text-align:center}.photo{margin:auto auto 25px;width:210px;height:240px;border-radius:22px;background:linear-gradient(150deg,#2e5d50,#142a28);border:1px solid #638d7d;display:grid;place-items:center;box-shadow:0 20px 65px #0007;position:relative}.photo:after{content:"1× VIEW";position:absolute;bottom:16px;letter-spacing:.14em;font-size:11px;color:#c6e8d7}.symbol{font-size:70px}h1{font-size:26px;letter-spacing:-.03em;margin:0 0 12px}p{line-height:1.5;color:#b8d0c6;margin:0 0 24px}a{display:block;text-decoration:none;border-radius:15px;padding:16px 24px;background:#7ee6b6;color:#08231a;font-weight:800}small{display:block;margin-top:20px;color:#8ba69c;line-height:1.5}
</style></head><body><main><div class="photo" aria-hidden="true"><span class="symbol">🔒</span></div><h1>Someone sent you a private photo</h1><p>Open it once in SnapExpire. The real photo stays hidden from WhatsApp previews.</p><a href="${destination}">Open private photo →</a><small>One-time viewing • Screenshots cannot be prevented</small></main>
<script>location.replace(${JSON.stringify(destination)});</script></body></html>`);
};
