import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseQdmrYaml } from '../io/yaml/qdmr';
import {
	addChannelsToScanList,
	addChannelsToZone,
	addTagToSelection,
	deleteSelection,
	setFieldOnSelection,
	WDMR_TAG_FIELD
} from './bulk';
import { TaggedValue, type Dataset } from '../model/types';
import { elementId } from '../model/dataset';

async function fixture(): Promise<Dataset> {
	return parseQdmrYaml(await readFile(path.resolve('sampledata/example.qdmr.yaml'), 'utf8'));
}

function channelUids(ds: Dataset, ...ids: string[]): Set<string> {
	return new Set(
		ds.collections.channels.filter((c) => ids.includes(elementId(c) ?? '')).map((c) => c.uid)
	);
}

describe('bulk actions', () => {
	it('adds channels to a zone VFO A without duplicates', async () => {
		const ds = await fixture();
		const zoneUid = ds.collections.zones[0].uid;
		// zone1 already has [ch5, ch76]; add ch5 + ch76 again => no change, count reflects attempt
		addChannelsToZone(ds, channelUids(ds, 'ch5', 'ch76'), zoneUid);
		expect(ds.collections.zones[0].fields.A).toEqual(['ch5', 'ch76']);
	});

	it('adds channels to a scan list', async () => {
		const ds = await fixture();
		// remove ch76 from scan to test append
		ds.collections.scanLists[0].fields.channels = ['ch5'];
		addChannelsToScanList(ds, channelUids(ds, 'ch76'), ds.collections.scanLists[0].uid);
		expect(ds.collections.scanLists[0].fields.channels).toEqual(['ch5', 'ch76']);
	});

	it('sets a field on every selected element', async () => {
		const ds = await fixture();
		const n = setFieldOnSelection(ds, 'channels', channelUids(ds, 'ch5', 'ch76'), 'power', 'Low');
		expect(n).toBe(2);
		expect(ds.collections.channels.map((c) => c.fields.power)).toEqual(['Low', 'Low']);
	});

	it('sets a !default tag value', async () => {
		const ds = await fixture();
		setFieldOnSelection(ds, 'channels', channelUids(ds, 'ch5'), 'power', new TaggedValue('default'));
		expect(ds.collections.channels[0].fields.power).toBeInstanceOf(TaggedValue);
	});

	it('adds a wdmr tag without duplicates', async () => {
		const ds = await fixture();
		const uids = channelUids(ds, 'ch76');
		addTagToSelection(ds, 'channels', uids, 'fav');
		addTagToSelection(ds, 'channels', uids, 'fav');
		const ch76 = ds.collections.channels.find((c) => elementId(c) === 'ch76');
		expect(ch76?.fields[WDMR_TAG_FIELD]).toEqual(['fav']);
	});

	it('deletes the selected elements', async () => {
		const ds = await fixture();
		const removed = deleteSelection(ds, 'channels', channelUids(ds, 'ch5'));
		expect(removed).toBe(1);
		expect(ds.collections.channels).toHaveLength(1);
		expect(elementId(ds.collections.channels[0])).toBe('ch76');
	});
});
