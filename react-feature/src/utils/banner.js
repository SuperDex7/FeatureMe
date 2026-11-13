// Artist banner as a CSS background. A gradient picked from the username sits
// underneath, so artists without a banner (or with a banner that fails to load)
// still get a consistent color.
const FALLBACK_BANNERS = [
  "linear-gradient(135deg, #974d9e, #5491cd)",
  "linear-gradient(135deg, #6a5fb4, #3fb8a6)",
  "linear-gradient(135deg, #e0884f, #974d9e)",
  "linear-gradient(135deg, #5491cd, #3fb8a6)",
  "linear-gradient(135deg, #974d9e, #e0884f)",
  "linear-gradient(135deg, #3f4a8a, #8f7ef5)",
];

export function bannerStyle(user) {
  const name = user?.userName || "";
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const fallback = FALLBACK_BANNERS[hash % FALLBACK_BANNERS.length];
  const banner = user?.banner;
  return {
    backgroundImage: banner ? `url("${String(banner).replace(/"/g, '\\"')}"), ${fallback}` : fallback,
  };
}
