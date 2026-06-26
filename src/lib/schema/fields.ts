// Field schemas for each collection / element type, derived from the qDMR
// extensible codeplug manual (ch03). The editor renders these; widgets are
// reusable so changing how, say, an enum or reference list is presented is a
// one-component change.
//
// https://static.dm3mat.de/qdmr/manual/ch03.html

import type { CollectionKey, ElementType } from '../model/types';

export type FieldWidget =
	| 'text'
	| 'frequency'
	| 'number'
	| 'enum'
	| 'boolean'
	| 'ref'
	| 'refList'
	| 'tone'
	| 'list';

export interface FieldDef {
	/** Dot-path within `element.fields` (e.g. `name`, `extended.talkaround`). */
	path: string;
	label: string;
	widget: FieldWidget;
	group: 'basic' | 'extended';
	/** enum: allowed values. */
	options?: readonly string[];
	/** ref / refList: which collection to reference. */
	refCollection?: CollectionKey;
	/** ref / refList: restrict to elements of this wrapper type. */
	refType?: ElementType;
	/** ref: also allow the `!selected` sentinel. */
	selectable?: boolean;
	/** Value may be `!default` (renders a Default checkbox / option). */
	defaultable?: boolean;
	min?: number;
	max?: number;
	help?: string;
}

const POWER = ['Min', 'Low', 'Mid', 'High', 'Max'] as const;
const TIMESLOT = ['TS1', 'TS2'] as const;

const channelCommon: FieldDef[] = [
	{ path: 'name', label: 'Name', widget: 'text', group: 'basic' },
	{ path: 'rxFrequency', label: 'Rx Frequency', widget: 'frequency', group: 'basic' },
	{ path: 'txFrequency', label: 'Tx Frequency', widget: 'frequency', group: 'basic' },
	{ path: 'power', label: 'Power', widget: 'enum', group: 'basic', options: POWER, defaultable: true },
	{ path: 'timeout', label: 'Tx Timeout (s)', widget: 'number', group: 'basic', min: 0, defaultable: true },
	{ path: 'vox', label: 'VOX Level', widget: 'number', group: 'basic', min: 0, max: 10, defaultable: true },
	{ path: 'rxOnly', label: 'Rx Only', widget: 'boolean', group: 'basic' },
	{ path: 'scanList', label: 'Scan List', widget: 'ref', group: 'basic', refCollection: 'scanLists' }
];

const channelDigital: FieldDef[] = [
	...channelCommon,
	{ path: 'admit', label: 'Tx Admit', widget: 'enum', group: 'basic', options: ['Always', 'Free', 'ColorCode'] },
	{ path: 'colorCode', label: 'Color Code', widget: 'number', group: 'basic', min: 0, max: 16 },
	{ path: 'timeSlot', label: 'Time Slot', widget: 'enum', group: 'basic', options: TIMESLOT },
	{ path: 'radioID', label: 'DMR ID', widget: 'ref', group: 'basic', refCollection: 'radioIDs', defaultable: true },
	{ path: 'groupList', label: 'Rx Group List', widget: 'ref', group: 'basic', refCollection: 'groupLists' },
	{ path: 'contact', label: 'Tx Contact', widget: 'ref', group: 'basic', refCollection: 'contacts', refType: 'dmr' },
	{ path: 'aprs', label: 'Positioning System', widget: 'ref', group: 'basic', refCollection: 'positioning' },
	{ path: 'roaming', label: 'Roaming Zone', widget: 'ref', group: 'basic', refCollection: 'roamingZones', defaultable: true },
	{ path: 'extended.talkaround', label: 'Talkaround', widget: 'boolean', group: 'extended' },
	{ path: 'extended.privateCallConfirm', label: 'Private Call Confirm', widget: 'boolean', group: 'extended' },
	{ path: 'extended.smsConfirm', label: 'SMS Confirm', widget: 'boolean', group: 'extended' },
	{ path: 'extended.dataConfirm', label: 'Data Confirm', widget: 'boolean', group: 'extended' },
	{ path: 'extended.sms', label: 'SMS', widget: 'boolean', group: 'extended' },
	{ path: 'extended.dcdm', label: 'Dual-Capacity Direct Mode', widget: 'boolean', group: 'extended' },
	{ path: 'extended.loneWorker', label: 'Lone Worker', widget: 'boolean', group: 'extended' }
];

const channelAnalog: FieldDef[] = [
	...channelCommon,
	{ path: 'admit', label: 'Tx Admit', widget: 'enum', group: 'basic', options: ['Always', 'Free', 'Tone'] },
	{ path: 'squelch', label: 'Squelch', widget: 'number', group: 'basic', min: 0, max: 10, defaultable: true },
	{ path: 'bandwidth', label: 'Bandwidth', widget: 'enum', group: 'basic', options: ['Narrow', 'Wide'] },
	{ path: 'rxTone', label: 'Rx Tone', widget: 'tone', group: 'basic' },
	{ path: 'txTone', label: 'Tx Tone', widget: 'tone', group: 'basic' },
	{ path: 'aprs', label: 'APRS System', widget: 'ref', group: 'basic', refCollection: 'positioning', refType: 'aprs' },
	{ path: 'extended.talkaround', label: 'Talkaround', widget: 'boolean', group: 'extended' },
	{ path: 'extended.reverseBurst', label: 'Reverse Burst', widget: 'boolean', group: 'extended' }
];

const contactDmr: FieldDef[] = [
	{ path: 'name', label: 'Name', widget: 'text', group: 'basic' },
	{ path: 'type', label: 'Type', widget: 'enum', group: 'basic', options: ['PrivateCall', 'GroupCall', 'AllCall'] },
	{ path: 'number', label: 'DMR ID', widget: 'number', group: 'basic', min: 0, max: 16777215 },
	{ path: 'ring', label: 'Ring', widget: 'boolean', group: 'basic' }
];

const contactDtmf: FieldDef[] = [
	{ path: 'name', label: 'Name', widget: 'text', group: 'basic' },
	{ path: 'number', label: 'DTMF Number', widget: 'text', group: 'basic' },
	{ path: 'ring', label: 'Ring', widget: 'boolean', group: 'basic' }
];

const radioIdDmr: FieldDef[] = [
	{ path: 'name', label: 'Name', widget: 'text', group: 'basic' },
	{ path: 'number', label: 'DMR ID', widget: 'number', group: 'basic', min: 0, max: 16777215 }
];

const groupList: FieldDef[] = [
	{ path: 'name', label: 'Name', widget: 'text', group: 'basic' },
	{ path: 'contacts', label: 'Contacts', widget: 'refList', group: 'basic', refCollection: 'contacts', refType: 'dmr' }
];

const zone: FieldDef[] = [
	{ path: 'name', label: 'Name', widget: 'text', group: 'basic' },
	{ path: 'A', label: 'VFO A', widget: 'refList', group: 'basic', refCollection: 'channels' },
	{ path: 'B', label: 'VFO B', widget: 'refList', group: 'basic', refCollection: 'channels' }
];

const scanList: FieldDef[] = [
	{ path: 'name', label: 'Name', widget: 'text', group: 'basic' },
	{ path: 'primary', label: 'Primary', widget: 'ref', group: 'basic', refCollection: 'channels', selectable: true },
	{ path: 'secondary', label: 'Secondary', widget: 'ref', group: 'basic', refCollection: 'channels', selectable: true },
	{ path: 'revert', label: 'Revert', widget: 'ref', group: 'basic', refCollection: 'channels', selectable: true },
	{ path: 'channels', label: 'Channels', widget: 'refList', group: 'basic', refCollection: 'channels' }
];

const positioningDmr: FieldDef[] = [
	{ path: 'name', label: 'Name', widget: 'text', group: 'basic' },
	{ path: 'period', label: 'Period (s)', widget: 'number', group: 'basic', min: 0 },
	{ path: 'contact', label: 'Contact', widget: 'ref', group: 'basic', refCollection: 'contacts', refType: 'dmr' },
	{ path: 'revert', label: 'Revert Channel', widget: 'ref', group: 'basic', refCollection: 'channels', selectable: true }
];

const positioningAprs: FieldDef[] = [
	{ path: 'name', label: 'Name', widget: 'text', group: 'basic' },
	{ path: 'period', label: 'Period (s)', widget: 'number', group: 'basic', min: 0 },
	{ path: 'revert', label: 'Revert Channel', widget: 'ref', group: 'basic', refCollection: 'channels', selectable: true },
	{ path: 'destination', label: 'Destination (CALL-SSID)', widget: 'text', group: 'basic' },
	{ path: 'source', label: 'Source (CALL-SSID)', widget: 'text', group: 'basic' },
	{ path: 'path', label: 'Path', widget: 'list', group: 'basic' },
	{ path: 'icon', label: 'Icon', widget: 'text', group: 'basic' },
	{ path: 'message', label: 'Message', widget: 'text', group: 'basic' }
];

const roamingChannel: FieldDef[] = [
	{ path: 'name', label: 'Name', widget: 'text', group: 'basic' },
	{ path: 'rxFrequency', label: 'Rx Frequency', widget: 'frequency', group: 'basic' },
	{ path: 'txFrequency', label: 'Tx Frequency', widget: 'frequency', group: 'basic' },
	{ path: 'colorCode', label: 'Color Code', widget: 'number', group: 'basic', min: 0, max: 16 },
	{ path: 'timeSlot', label: 'Time Slot', widget: 'enum', group: 'basic', options: TIMESLOT }
];

const roamingZone: FieldDef[] = [
	{ path: 'name', label: 'Name', widget: 'text', group: 'basic' },
	{ path: 'channels', label: 'Roaming Channels', widget: 'refList', group: 'basic', refCollection: 'roamingChannels' }
];

const SCHEMAS: Partial<Record<CollectionKey, Partial<Record<ElementType, FieldDef[]>>>> = {
	channels: { digital: channelDigital, analog: channelAnalog },
	contacts: { dmr: contactDmr, dtmf: contactDtmf },
	radioIDs: { dmr: radioIdDmr },
	groupLists: { plain: groupList },
	zones: { plain: zone },
	scanLists: { plain: scanList },
	positioning: { dmr: positioningDmr, aprs: positioningAprs },
	roamingChannels: { plain: roamingChannel },
	roamingZones: { plain: roamingZone }
};

/** Schema fields for a given collection + element type (empty if unknown). */
export function schemaFor(collection: CollectionKey, type: ElementType): FieldDef[] {
	const byType = SCHEMAS[collection];
	if (!byType) return [];
	return byType[type] ?? byType['plain'] ?? [];
}

/** The set of `fields` keys that the schema manages (top-level only). */
export function schemaTopLevelKeys(collection: CollectionKey, type: ElementType): Set<string> {
	const keys = new Set<string>(['id']); // id is schema-managed (read-only) but never a widget
	for (const f of schemaFor(collection, type)) keys.add(f.path.split('.')[0]);
	return keys;
}
