// Presentation helpers for codeplug field values. These produce plain strings;
// Svelte escapes them on render, so there is no XSS surface here.

import { TaggedValue, type YamlValue } from '../model/types';

/** Render a field value as a compact, human-readable cell string. */
export function formatCell(value: YamlValue | undefined): string {
	if (value === undefined || value === null) return '';
	if (value instanceof TaggedValue) {
		return value.value === null || value.value === undefined
			? `!${value.tag}`
			: `!${value.tag} ${formatCell(value.value)}`;
	}
	if (Array.isArray(value)) {
		// Arrays of scalars (id lists) read best comma-joined; nested objects -> JSON.
		if (value.every((v) => isScalar(v))) return value.map((v) => formatCell(v)).join(', ');
		return JSON.stringify(value);
	}
	if (typeof value === 'object') return JSON.stringify(value);
	return String(value);
}

function isScalar(v: YamlValue): boolean {
	return (
		v === null ||
		v instanceof TaggedValue ||
		typeof v === 'string' ||
		typeof v === 'number' ||
		typeof v === 'boolean'
	);
}

/** True for values the simple scalar editor can handle directly. */
export function isEditableScalar(value: YamlValue | undefined): boolean {
	return (
		value === undefined ||
		value === null ||
		typeof value === 'string' ||
		typeof value === 'number' ||
		typeof value === 'boolean'
	);
}

/** Union of field names present across a set of elements, in first-seen order. */
export function collectFieldNames(records: Record<string, YamlValue>[]): string[] {
	const seen: string[] = [];
	const set = new Set<string>();
	for (const rec of records) {
		for (const k of Object.keys(rec)) {
			if (!set.has(k)) {
				set.add(k);
				seen.push(k);
			}
		}
	}
	return seen;
}
