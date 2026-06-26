// Pure helpers shared by the schema-driven editor and field widgets. No DOM here
// so everything is unit-testable.

import { TaggedValue, type YamlValue } from '../model/types';

// ── Nested path access (e.g. "extended.talkaround") ──────────────────────────

export function getPath(fields: Record<string, YamlValue>, path: string): YamlValue | undefined {
	const parts = path.split('.');
	let cur: YamlValue | undefined = fields;
	for (const part of parts) {
		if (cur === null || typeof cur !== 'object' || Array.isArray(cur) || cur instanceof TaggedValue) {
			return undefined;
		}
		cur = (cur as Record<string, YamlValue>)[part];
	}
	return cur;
}

export function setPath(fields: Record<string, YamlValue>, path: string, value: YamlValue): void {
	const parts = path.split('.');
	let cur = fields as Record<string, YamlValue>;
	for (let i = 0; i < parts.length - 1; i++) {
		const part = parts[i];
		const next = cur[part];
		if (next === null || typeof next !== 'object' || Array.isArray(next) || next instanceof TaggedValue) {
			cur[part] = {};
		}
		cur = cur[part] as Record<string, YamlValue>;
	}
	cur[parts[parts.length - 1]] = value;
}

/** Remove a (possibly nested) key; prunes empty parent objects it creates. */
export function deletePath(fields: Record<string, YamlValue>, path: string): void {
	const parts = path.split('.');
	const stack: Record<string, YamlValue>[] = [fields];
	let cur = fields as Record<string, YamlValue>;
	for (let i = 0; i < parts.length - 1; i++) {
		const next = cur[parts[i]];
		if (next === null || typeof next !== 'object' || Array.isArray(next) || next instanceof TaggedValue) {
			return; // path does not exist
		}
		cur = next as Record<string, YamlValue>;
		stack.push(cur);
	}
	delete cur[parts[parts.length - 1]];
	// prune empty intermediates
	for (let i = stack.length - 1; i > 0; i--) {
		if (Object.keys(stack[i]).length === 0) delete stack[i - 1][parts[i - 1]];
		else break;
	}
}

/** Deep clone a value, preserving TaggedValue instances (structuredClone drops the prototype). */
export function cloneValue(v: YamlValue): YamlValue {
	if (v instanceof TaggedValue) return new TaggedValue(v.tag, cloneValue(v.value));
	if (Array.isArray(v)) return v.map(cloneValue);
	if (v !== null && typeof v === 'object') {
		const out: Record<string, YamlValue> = {};
		for (const [k, val] of Object.entries(v)) out[k] = cloneValue(val);
		return out;
	}
	return v;
}

// ── Custom-tag helpers ───────────────────────────────────────────────────────

export function isDefault(value: YamlValue | undefined): boolean {
	return value instanceof TaggedValue && value.tag === 'default';
}

export function isSelected(value: YamlValue | undefined): boolean {
	return value instanceof TaggedValue && value.tag === 'selected';
}

export const DEFAULT_TAG = new TaggedValue('default');
export const SELECTED_TAG = new TaggedValue('selected');

// ── Sub-tone (CTCSS / DCS) ───────────────────────────────────────────────────

export type ToneType = 'none' | 'ctcss' | 'dcs';

export interface ToneValue {
	type: ToneType;
	/** CTCSS frequency in Hz, or DCS code (negative = inverted). */
	value: number | null;
}

export function parseTone(value: YamlValue | undefined): ToneValue {
	if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof TaggedValue)) {
		const obj = value as Record<string, YamlValue>;
		if ('ctcss' in obj && typeof obj.ctcss === 'number') return { type: 'ctcss', value: obj.ctcss };
		if ('dcs' in obj && typeof obj.dcs === 'number') return { type: 'dcs', value: obj.dcs };
	}
	return { type: 'none', value: null };
}

/** Build the YAML representation of a tone, or undefined for "none". */
export function toneToValue(tone: ToneValue): YamlValue | undefined {
	if (tone.type === 'none' || tone.value === null) return undefined;
	return tone.type === 'ctcss' ? { ctcss: tone.value } : { dcs: tone.value };
}

export function formatTone(value: YamlValue | undefined): string {
	const t = parseTone(value);
	if (t.type === 'none' || t.value === null) return '';
	if (t.type === 'ctcss') return `CTCSS ${t.value} Hz`;
	return t.value < 0 ? `DCS ${-t.value}I` : `DCS ${t.value}N`;
}

// Common CTCSS frequencies (Hz) for the tone dropdown.
export const CTCSS_FREQUENCIES = [
	67, 69.3, 71.9, 74.4, 77, 79.7, 82.5, 85.4, 88.5, 91.5, 94.8, 97.4, 100, 103.5, 107.2, 110.9,
	114.8, 118.8, 123, 127.3, 131.8, 136.5, 141.3, 146.2, 151.4, 156.7, 162.2, 167.9, 173.8, 179.9,
	186.2, 192.8, 203.5, 210.7, 218.1, 225.7, 233.6, 241.8, 250.3
];
