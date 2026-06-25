// Typed access to the generated qdmr radio catalog (see scripts/gen-radios.mjs).
// This list is BOTH the UI's radio-type dropdown source and the allowlist for the
// backend's dmrconf `--radio=<key>` argument.

import catalog from './radios.json';

export interface RadioEntry {
	/** dmrconf `--radio=` key (lower-case). */
	key: string;
	/** Display name, e.g. "AT-D878UV". */
	name: string;
	/** Manufacturer, e.g. "AnyTone". */
	manufacturer: string;
	/** Upstream enum constant (debugging / traceability). */
	enum: string;
	/** Canonical key this radio is an alias of, or null if it is canonical. */
	aliasOf: string | null;
}

export interface RadioCatalog {
	generatedFrom: { repo: string; tag: string };
	generatedAt: string;
	count: number;
	radios: RadioEntry[];
}

export const radioCatalog: RadioCatalog = catalog as RadioCatalog;
export const radios: RadioEntry[] = radioCatalog.radios;

const KEYS = new Set(radios.map((r) => r.key));

/** True if `key` is a valid dmrconf radio key (use before passing to a backend). */
export function isKnownRadioKey(key: string): boolean {
	return KEYS.has(key);
}

export function radioByKey(key: string): RadioEntry | undefined {
	return radios.find((r) => r.key === key);
}

/** Radios grouped by manufacturer, for an <optgroup>-style dropdown. */
export function radiosByManufacturer(): { manufacturer: string; radios: RadioEntry[] }[] {
	const groups = new Map<string, RadioEntry[]>();
	for (const r of radios) {
		const list = groups.get(r.manufacturer) ?? [];
		list.push(r);
		groups.set(r.manufacturer, list);
	}
	return [...groups.entries()]
		.map(([manufacturer, list]) => ({ manufacturer, radios: list }))
		.sort((a, b) => a.manufacturer.localeCompare(b.manufacturer));
}
