import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: { port: 5173 },
	css: {
		preprocessorOptions: {
			scss: {
				// Silence Bootstrap 5.3's known deprecations so our own SCSS warnings
				// stay visible. (sass-embedded already uses the modern compiler API.)
				silenceDeprecations: [
					'import',
					'global-builtin',
					'color-functions',
					'legacy-js-api',
					'if-function',
					'abs-percent',
					'slash-div'
				]
			}
		}
	}
});
