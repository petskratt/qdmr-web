// Internal model for qdmr-web.
//
// The model is a *superset* of the qDMR extensible (YAML) codeplug format. It is
// deliberately open: every element keeps a free-form `fields` map so that we
// never lose unknown qDMR keys or device-specific extension blocks (e.g.
// `openGD77`) on an import -> export round trip. On top of that we layer our own
// `wdmr*` attributes (wdmrTag, wdmrSource, ...) which are app-only and get
// stripped from any YAML destined for dmrconf.

/** A value as it can appear in a qDMR YAML document. */
export type YamlValue =
	| string
	| number
	| boolean
	| null
	| TaggedValue
	| YamlValue[]
	| { [key: string]: YamlValue };

/**
 * Represents a qDMR YAML custom tag scalar such as `!default` or `!selected`.
 * These appear in reference fields (e.g. `vox: !default`, `primary: !selected`)
 * and must survive round-trips, so we model them explicitly rather than coercing
 * to null.
 */
export class TaggedValue {
	constructor(
		public readonly tag: string,
		public readonly value: YamlValue = null
	) {}
}

export function isTaggedValue(v: unknown): v is TaggedValue {
	return v instanceof TaggedValue;
}

/** Prefix marking app-only extended attributes that dmrconf must never see. */
export const WDMR_PREFIX = 'wdmr';

export function isWdmrKey(key: string): boolean {
	return key.startsWith(WDMR_PREFIX);
}

/**
 * Wrapper-type discriminator. In qDMR YAML several list items are single-entry
 * maps whose key is the type: channels are `{digital|analog: {...}}`, contacts
 * `{dmr|dtmf: {...}}`, radio IDs `{dmr: {...}}`, positioning `{dmr|aprs: {...}}`.
 * `plain` means the element has no wrapper key (zones, scan lists, group lists,
 * roaming). The codec preserves any wrapper key it sees, so the type is an open
 * string with the well-known values called out for autocompletion.
 */
export type KnownElementType = 'digital' | 'analog' | 'dmr' | 'dtmf' | 'aprs' | 'plain';
// eslint-disable-next-line @typescript-eslint/ban-types
export type ElementType = KnownElementType | (string & {});

/** Keys of the list-shaped codeplug collections (everything except `settings`). */
export type CollectionKey =
	| 'radioIDs'
	| 'contacts'
	| 'groupLists'
	| 'channels'
	| 'zones'
	| 'scanLists'
	| 'positioning'
	| 'roamingChannels'
	| 'roamingZones';

/** A single row in a collection (a channel, contact, zone, ...). */
export interface CodeplugElement {
	/** Internal, stable identity. Never written to any export. */
	uid: string;
	/** Wrapper-type discriminator (see {@link ElementType}). */
	type: ElementType;
	/**
	 * The element body: the qDMR `id`, `name`, all known and unknown qDMR fields,
	 * nested device-extension maps, and any `wdmr*` attributes.
	 */
	fields: Record<string, YamlValue>;
}

export type DatasetSource =
	| 'new'
	| 'qdmr-yaml'
	| 'qdmr-conf'
	| 'csv'
	| 'sral'
	| 'repeaterbook'
	| 'native-json';

/** One open codeplug / dataset (a horizontal tab in the UI). */
export interface Dataset {
	/** Internal, stable identity. */
	id: string;
	name: string;
	source: DatasetSource;
	createdAt: number;
	updatedAt: number;
	/** Radio-wide settings (`settings:` block). Free-form, round-trip safe. */
	settings: Record<string, YamlValue>;
	/**
	 * Unknown / device-specific top-level keys that are not one of the modelled
	 * collections or `settings`. Preserved verbatim for round-trip.
	 */
	extensions: Record<string, YamlValue>;
	collections: Record<CollectionKey, CodeplugElement[]>;
}

/** Static description of each collection for the UI and import/export logic. */
export interface CollectionMeta {
	key: CollectionKey;
	/** YAML key under the document root. */
	yamlKey: string;
	/** Singular + plural labels for the UI. */
	label: string;
	/** Bootstrap-icon name (without the `bi-` prefix). */
	icon: string;
	/**
	 * Allowed wrapper types for new elements. Empty array means `plain`
	 * (no wrapper key).
	 */
	types: ElementType[];
	/** Columns shown by default in the table view (qDMR field names). */
	defaultColumns: string[];
}

export const COLLECTIONS: CollectionMeta[] = [
	{
		key: 'radioIDs',
		yamlKey: 'radioIDs',
		label: 'Radio IDs',
		icon: 'person-badge',
		types: ['dmr'],
		defaultColumns: ['id', 'name', 'number']
	},
	{
		key: 'contacts',
		yamlKey: 'contacts',
		label: 'Contacts',
		icon: 'person-lines-fill',
		types: ['dmr', 'dtmf'],
		defaultColumns: ['id', 'name', 'type', 'number', 'ring']
	},
	{
		key: 'groupLists',
		yamlKey: 'groupLists',
		label: 'Group Lists',
		icon: 'people',
		types: ['plain'],
		defaultColumns: ['id', 'name', 'contacts']
	},
	{
		key: 'channels',
		yamlKey: 'channels',
		label: 'Channels',
		icon: 'broadcast-pin',
		types: ['digital', 'analog'],
		defaultColumns: ['id', 'name', 'rxFrequency', 'txFrequency', 'power', 'timeSlot', 'colorCode']
	},
	{
		key: 'zones',
		yamlKey: 'zones',
		label: 'Zones',
		icon: 'grid-3x3-gap',
		types: ['plain'],
		defaultColumns: ['id', 'name', 'A', 'B']
	},
	{
		key: 'scanLists',
		yamlKey: 'scanLists',
		label: 'Scan Lists',
		icon: 'search',
		types: ['plain'],
		defaultColumns: ['id', 'name', 'channels']
	},
	{
		key: 'positioning',
		yamlKey: 'positioning',
		label: 'GPS / Positioning',
		icon: 'geo-alt',
		types: ['dmr', 'aprs'],
		defaultColumns: ['id', 'name', 'destination', 'period']
	},
	{
		key: 'roamingChannels',
		yamlKey: 'roamingChannels',
		label: 'Roaming Channels',
		icon: 'arrow-repeat',
		types: ['plain'],
		defaultColumns: ['id', 'name', 'rxFrequency', 'txFrequency', 'colorCode', 'timeSlot']
	},
	{
		key: 'roamingZones',
		yamlKey: 'roamingZones',
		label: 'Roaming Zones',
		icon: 'bounding-box',
		types: ['plain'],
		defaultColumns: ['id', 'name', 'channels']
	}
];

export const COLLECTION_KEYS: CollectionKey[] = COLLECTIONS.map((c) => c.key);

export function collectionMeta(key: CollectionKey): CollectionMeta {
	const meta = COLLECTIONS.find((c) => c.key === key);
	if (!meta) throw new Error(`Unknown collection: ${key}`);
	return meta;
}
