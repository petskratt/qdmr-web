import { nanoid } from 'nanoid';
import {
	COLLECTION_KEYS,
	type CodeplugElement,
	type CollectionKey,
	type Dataset,
	type DatasetSource,
	type ElementType,
	type YamlValue
} from './types';

export function emptyCollections(): Record<CollectionKey, CodeplugElement[]> {
	const out = {} as Record<CollectionKey, CodeplugElement[]>;
	for (const key of COLLECTION_KEYS) out[key] = [];
	return out;
}

export function createDataset(name: string, source: DatasetSource = 'new'): Dataset {
	const now = Date.now();
	return {
		id: nanoid(),
		name,
		source,
		createdAt: now,
		updatedAt: now,
		settings: {},
		extensions: {},
		collections: emptyCollections()
	};
}

export function createElement(
	type: ElementType,
	fields: Record<string, YamlValue> = {}
): CodeplugElement {
	return { uid: nanoid(), type, fields };
}

/** The qDMR reference id of an element (`fields.id`), or undefined. */
export function elementId(el: CodeplugElement): string | undefined {
	const id = el.fields.id;
	return typeof id === 'string' ? id : undefined;
}

/** Best-effort human label: name, else id, else the uid. */
export function elementName(el: CodeplugElement): string {
	const name = el.fields.name;
	if (typeof name === 'string' && name.length > 0) return name;
	return elementId(el) ?? el.uid;
}

/** Total element count across all collections (handy for tab badges). */
export function elementCount(ds: Dataset): number {
	let n = 0;
	for (const key of COLLECTION_KEYS) n += ds.collections[key].length;
	return n;
}

/**
 * Generate a qDMR reference id that is unique within the dataset. qDMR ids are
 * arbitrary unique strings; we use a short prefix + counter (e.g. `ch7`).
 */
export function nextElementId(ds: Dataset, prefix: string): string {
	const used = new Set<string>();
	for (const key of COLLECTION_KEYS) {
		for (const el of ds.collections[key]) {
			const id = elementId(el);
			if (id) used.add(id);
		}
	}
	let i = 1;
	let candidate = `${prefix}${i}`;
	while (used.has(candidate)) {
		i += 1;
		candidate = `${prefix}${i}`;
	}
	return candidate;
}

const ID_PREFIX: Record<CollectionKey, string> = {
	radioIDs: 'id',
	contacts: 'cont',
	groupLists: 'grp',
	channels: 'ch',
	zones: 'zone',
	scanLists: 'scan',
	positioning: 'gps',
	roamingChannels: 'rch',
	roamingZones: 'roam'
};

export function idPrefixFor(key: CollectionKey): string {
	return ID_PREFIX[key];
}
