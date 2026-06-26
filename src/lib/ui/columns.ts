// Table column descriptors per collection. `id` is intentionally never shown
// (internal reference only). Channels show the rep type after the name and, for
// FM channels, the opening (rx) sub-tone.

import { TaggedValue, type CodeplugElement, type CollectionKey, type YamlValue } from '../model/types';
import { formatCell } from './format';
import { formatTone, getPath } from '../schema/values';

export interface TableColumn {
	id: string;
	label: string;
	render: (el: CodeplugElement) => string;
	sort: (el: CodeplugElement) => string | number;
	badge?: boolean;
}

function sortKey(v: YamlValue | undefined): string | number {
	if (typeof v === 'number') return v;
	if (v instanceof TaggedValue) return `!${v.tag}`;
	if (Array.isArray(v)) return v.length;
	if (v === null || v === undefined) return '';
	return String(v).toLowerCase();
}

function field(path: string, label = path): TableColumn {
	return {
		id: path,
		label,
		render: (el) => formatCell(getPath(el.fields, path)),
		sort: (el) => sortKey(getPath(el.fields, path))
	};
}

function tone(path: string, label: string): TableColumn {
	return {
		id: path,
		label,
		render: (el) => formatTone(getPath(el.fields, path)),
		sort: (el) => formatTone(getPath(el.fields, path))
	};
}

function count(path: string, label: string): TableColumn {
	return {
		id: path,
		label,
		render: (el) => {
			const v = getPath(el.fields, path);
			return Array.isArray(v) ? String(v.length) : formatCell(v);
		},
		sort: (el) => {
			const v = getPath(el.fields, path);
			return Array.isArray(v) ? v.length : sortKey(v);
		}
	};
}

const KIND: TableColumn = {
	id: '__type',
	label: 'type',
	render: (el) => el.type,
	sort: (el) => el.type,
	badge: true
};

const TAGS = field('wdmrTag', 'tags');

const COLUMNS: Record<CollectionKey, TableColumn[]> = {
	channels: [
		field('name'),
		KIND,
		field('rxFrequency', 'rx'),
		field('txFrequency', 'tx'),
		field('power'),
		field('timeSlot', 'ts'),
		field('colorCode', 'cc'),
		tone('rxTone', 'tone'),
		TAGS
	],
	contacts: [KIND, field('name'), field('type'), field('number'), field('ring'), TAGS],
	radioIDs: [field('name'), field('number')],
	groupLists: [field('name'), count('contacts', 'contacts')],
	zones: [field('name'), count('A', 'A'), count('B', 'B')],
	scanLists: [field('name'), count('channels', 'channels')],
	positioning: [KIND, field('name'), field('period'), field('contact'), field('destination')],
	roamingChannels: [
		field('name'),
		field('rxFrequency', 'rx'),
		field('txFrequency', 'tx'),
		field('colorCode', 'cc'),
		field('timeSlot', 'ts')
	],
	roamingZones: [field('name'), count('channels', 'channels')]
};

export function columnsFor(collection: CollectionKey): TableColumn[] {
	return COLUMNS[collection];
}
