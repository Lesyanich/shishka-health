// Route remote dish photos through Vercel's Image Optimization.
//
// Why: the site is served from Vercel (reachable from Russia), but the photos
// live on Supabase Storage behind Cloudflare, which Russian ISPs throttle — so
// 1–2 MB PNGs never finish downloading there. Sending them through
//   /_vercel/image?url=<encoded>&w=<width>&q=<quality>
// makes Vercel fetch the origin server-side (not affected by the throttling),
// re-encode to a small WebP, and serve it from the site's own domain. Guests
// only ever talk to Vercel. Bonus: the menu gets much lighter for everyone.
//
// Only hosts we control are routed through the optimizer; anything else (e.g.
// the handful of Google Drive drinks) is returned untouched so it can't regress
// for users outside Russia. Locally (`vite dev`) the /_vercel/image endpoint
// doesn't exist, so we serve the original URL.

// Must stay in sync with `images.sizes` in vercel.json — Vercel rejects any `w`
// that isn't in that list.
const WIDTHS = [96, 128, 256, 384, 640, 828, 1080, 1200, 1920];

const ALLOWED_HOSTS = new Set([
  "qcqgtcsjoacuktcewpvo.supabase.co", // Supabase Storage (behind Cloudflare)
  "d8j0ntlcm91z4.cloudfront.net", // legacy CloudFront-hosted render
]);

function snapWidth(w) {
  return WIDTHS.find((x) => x >= w) ?? WIDTHS[WIDTHS.length - 1];
}

/**
 * Rewrite a remote image URL to go through Vercel Image Optimization.
 * Falls back to the original URL for local dev, non-http URLs, same-origin
 * assets, and any host not in the allowlist.
 *
 * @param {string|null|undefined} url   original image URL
 * @param {number} width                intended rendered width in CSS px (retina-safe upper bound)
 * @param {number} [quality=75]         WebP quality 1–100
 */
export function optimizedSrc(url, width = 640, quality = 75) {
  if (!url || !/^https?:\/\//i.test(url)) return url;
  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    return url;
  }
  if (!ALLOWED_HOSTS.has(host)) return url;
  // /_vercel/image only exists on Vercel deployments, not in `vite dev`.
  if (!import.meta.env.PROD) return url;
  const w = snapWidth(width);
  return `/_vercel/image?url=${encodeURIComponent(url)}&w=${w}&q=${quality}`;
}
