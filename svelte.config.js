import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// GitHub Pages serves the app from a subpath (https://user.github.io/<repo>/).
// Set BASE_PATH at build time (e.g. BASE_PATH=/qdmr-web) so all links resolve.
// Locally and at the domain root, leave it empty.
const base = process.env.BASE_PATH ?? '';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// SPA: prerender the shell, fall back to index.html for client-side routing.
		adapter: adapter({
			pages: 'docs',
			assets: 'docs',
			fallback: 'index.html',
			precompress: false,
			strict: false
		}),
		paths: { base },
		// GitHub Pages does not serve a custom 404; the SPA fallback handles routing.
		alias: { $lib: 'src/lib' }
	}
};

export default config;
