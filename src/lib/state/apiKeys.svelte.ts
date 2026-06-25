// API endpoint configuration (base URLs + keys), persisted in localStorage.
// SECURITY: browser storage is not a secret vault. Keys here are only as safe as
// the device; we never send them anywhere except their configured host.

import { loadPref, savePref } from './storage';

const KEY = 'qdmr:api';

export interface ApiConfig {
	/** automatic.sral.fi base URL (no key required for public read endpoints). */
	sralBaseUrl: string;
	/** RepeaterBook API key (optional; often needs a CORS proxy in FE-only mode). */
	repeaterbookKey: string;
}

const DEFAULTS: ApiConfig = {
	sralBaseUrl: 'https://automatic.sral.fi/api',
	repeaterbookKey: ''
};

export const apiConfig = $state<ApiConfig>(loadPref<ApiConfig>(KEY, DEFAULTS));

export function saveApiConfig(): void {
	savePref(KEY, { ...apiConfig });
}
