// String <-> YamlValue conversion for the simple field editor. Kept pure so it
// can be unit-tested without a DOM. A full JSON-tree editor arrives in a later
// milestone; this covers the common field shapes (scalars, id lists, custom
// tags) and falls back to JSON for anything nested.

import { TaggedValue, type YamlValue } from '../model/types';

export type FieldMode = 'scalar' | 'list' | 'tag' | 'json';

export interface FieldDraft {
	mode: FieldMode;
	text: string;
}

/** Pick an editor mode and string representation for a value. */
export function valueToDraft(value: YamlValue | undefined): FieldDraft {
	if (value === undefined || value === null) return { mode: 'scalar', text: '' };
	if (value instanceof TaggedValue) {
		return {
			mode: 'tag',
			text: value.value === null || value.value === undefined ? `!${value.tag}` : `!${value.tag} ${String(value.value)}`
		};
	}
	if (Array.isArray(value)) {
		if (value.every((v) => typeof v === 'string' || typeof v === 'number')) {
			return { mode: 'list', text: value.join(', ') };
		}
		return { mode: 'json', text: JSON.stringify(value) };
	}
	if (typeof value === 'object') return { mode: 'json', text: JSON.stringify(value) };
	return { mode: 'scalar', text: String(value) };
}

/** Parse the edited string back into a value for the chosen mode. */
export function draftToValue(draft: FieldDraft): YamlValue {
	const text = draft.text.trim();
	switch (draft.mode) {
		case 'tag': {
			const m = text.match(/^!\s*([^\s]+)\s*(.*)$/);
			if (!m) return new TaggedValue(text.replace(/^!/, '') || 'default');
			const rest = m[2].trim();
			return new TaggedValue(m[1], rest === '' ? null : coerceScalar(rest));
		}
		case 'list':
			if (text === '') return [];
			return text
				.split(',')
				.map((s) => s.trim())
				.filter((s) => s.length > 0);
		case 'json':
			return JSON.parse(text) as YamlValue;
		case 'scalar':
		default:
			return text === '' ? '' : coerceScalar(text);
	}
}

/** Turn "439.5625" -> number, "true" -> boolean, else keep the string. */
function coerceScalar(text: string): YamlValue {
	if (text === 'true') return true;
	if (text === 'false') return false;
	if (text === 'null') return null;
	if (/^-?\d+(\.\d+)?$/.test(text)) {
		const n = Number(text);
		if (Number.isFinite(n)) return n;
	}
	return text;
}
