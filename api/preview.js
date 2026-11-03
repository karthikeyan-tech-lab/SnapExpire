// Minimal short-link redirect. No Open Graph metadata or private photo in previews.
module.exports = (req, res) => {
  const code = String(req.query.code || "");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  if (!/^[A-Za-z0-9_-]{22}$/.test(code)) {
    return res.status(404).setHeader("Content-Type", "text/plain; charset=utf-8").end("Invalid link");
  }
  const target = "https://snapexpire.vercel.app/#code=" + code;
  // The redirect is only to the viewer. WhatsApp never receives the photo bytes.
  res.status(302).setHeader("Location", target).end();
};
