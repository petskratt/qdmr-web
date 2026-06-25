// Pure client-side SPA: no server, all data lives in the browser.
// Prerender the static shell so GitHub Pages can serve it; the SPA fallback
// (index.html) handles every route after that.
export const ssr = false;
export const prerender = true;
export const trailingSlash = 'ignore';
