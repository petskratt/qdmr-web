import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// Single-route SPA: prerender `/` to docs/index.html (no fallback page).
		// The fallback page always emits absolute asset URLs; a prerendered page
		// honors `paths.relative` below, which is what makes the build portable.
		adapter: adapter({
			pages: 'docs',
			assets: 'docs',
			precompress: false,
			strict: false
		}),
		// Emit asset/link URLs relative to index.html (e.g. ./_app/...) instead of
		// absolute (/_app/...). This makes the docs/ build location-independent: it
		// works at a domain root, at a GitHub Pages subpath (/<repo>/), or opened
		// straight from disk, with no BASE_PATH needed. Safe here because the app is
		// a single-route SPA (no deep links that would break relative resolution).
		paths: { relative: true },
		alias: { $lib: 'src/lib' }
	}
};

export default config;
