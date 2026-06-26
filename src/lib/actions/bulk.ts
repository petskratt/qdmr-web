// Bulk actions over a selection of elements. Pure mutations on the dataset so
// they can be unit-tested; the UI calls them then persists via touchDataset.
// New actions slot in here and get surfaced by BulkActionsBar.

import type { CodeplugElement, CollectionKey, Dataset, YamlValue } from '../model/types';
import { TaggedValue } from '../model/types';
import { elementId } from '../model/dataset';
import { setPath } from '../schema/values';

function elementsByUid(list: CodeplugElement[], uids: Set<string>): CodeplugElement[] {
	return list.filter((e) => uids.has(e.uid));
}

/** Resolve a set of channel uids to their qDMR reference ids. */
function refIds(list: CodeplugElement[], uids: Set<string>): string[] {
	return elementsByUid(list, uids)
		.map((e) => elementId(e))
		.filter((id): id is string => typeof id === 'string');
}

/** Append a list of ref ids into a target element's id-list field, de-duped. */
function appendUnique(target: CodeplugElement, path: string, ids: string[]): void {
	const cur = target.fields[path];
	const existing = Array.isArray(cur) ? cur.filter((x): x is string => typeof x === 'string') : [];
	const merged = [...existing];
	for (const id of ids) if (!merged.includes(id)) merged.push(id);
	target.fields[path] = merged;
}

/** Add the selected channels to a zone's VFO A list. Returns channels added. */
export function addChannelsToZone(
	dataset: Dataset,
	channelUids: Set<string>,
	zoneUid: string
): number {
	const zone = dataset.collections.zones.find((z) => z.uid === zoneUid);
	if (!zone) return 0;
	const ids = refIds(dataset.collections.channels, channelUids);
	appendUnique(zone, 'A', ids);
	return ids.length;
}

/** Add the selected channels to a scan list. Returns channels added. */
export function addChannelsToScanList(
	dataset: Dataset,
	channelUids: Set<string>,
	scanUid: string
): number {
	const scan = dataset.collections.scanLists.find((s) => s.uid === scanUid);
	if (!scan) return 0;
	const ids = refIds(dataset.collections.channels, channelUids);
	appendUnique(scan, 'channels', ids);
	return ids.length;
}

/** Set a (possibly nested) field on every selected element. */
export function setFieldOnSelection(
	dataset: Dataset,
	collection: CollectionKey,
	uids: Set<string>,
	path: string,
	value: YamlValue
): number {
	const els = elementsByUid(dataset.collections[collection], uids);
	for (const el of els) setPath(el.fields, path, value);
	return els.length;
}

export const WDMR_TAG_FIELD = 'wdmrTag';

/** Add a wdmr tag to each selected element's `wdmrTag` list (de-duped). */
export function addTagToSelection(
	dataset: Dataset,
	collection: CollectionKey,
	uids: Set<string>,
	tag: string
): number {
	const clean = tag.trim();
	if (clean === '') return 0;
	const els = elementsByUid(dataset.collections[collection], uids);
	for (const el of els) {
		const cur = el.fields[WDMR_TAG_FIELD];
		const tags = Array.isArray(cur) ? cur.filter((x): x is string => typeof x === 'string') : [];
		if (!tags.includes(clean)) tags.push(clean);
		el.fields[WDMR_TAG_FIELD] = tags;
	}
	return els.length;
}

/** Delete the selected elements from a collection. Returns count removed. */
export function deleteSelection(
	dataset: Dataset,
	collection: CollectionKey,
	uids: Set<string>
): number {
	const before = dataset.collections[collection].length;
	dataset.collections[collection] = dataset.collections[collection].filter((e) => !uids.has(e.uid));
	return before - dataset.collections[collection].length;
}

/** Convenience: the `!default` power value. */
export const DEFAULT_VALUE = new TaggedValue('default');
