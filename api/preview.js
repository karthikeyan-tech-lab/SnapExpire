// Generic preview only. Never fetch or embed the private photo.
module.exports = (req, res) => {
  const code = String(req.query.code || "");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Security-Policy", "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src https://placehold.co; base-uri 'none'; frame-ancestors 'none'");
  if (!/^[A-Za-z0-9_-]{22}$/.test(code)) {
    res.status(404).setHeader("Content-Type", "text/plain; charset=utf-8").end("Invalid photo link");
    return;
  }
  const canonical = "https://snapexpire.vercel.app/p/" + code;
  const destination = "https://snapexpire.vercel.app/#code=" + code;
  res.status(200).setHeader("Content-Type", "text/html; charset=utf-8").end(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="no-referrer">
<meta property="og:type" content="website">
<meta property="og:title" content="📸 SnapExpire · Private View Once Photo">
<meta property="og:description" content="You've received a private one-time photo. Open it in SnapExpire before the link expires.">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="https://placehold.co/1200x630/101827/72e4b0.png?text=SnapExpire+Private+Photo">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<title>Private Photo · SnapExpire</title>
<style>body{font-family:system-ui;background:#101827;color:white;display:grid;place-items:center;min-height:90vh;text-align:center}a{background:#72e4b0;color:#092b1b;padding:14px 24px;border-radius:12px;font-weight:bold}</style></head>
<body><main><h1>📸 SnapExpire</h1><p>Private View Once photo</p><p><a id="open" href="${destination}">Open private photo</a></p><small>Only the first opening is allowed. Screenshots cannot be prevented.</small></main>
<script>location.replace(${JSON.stringify(destination)});</script></body></html>`);
};
