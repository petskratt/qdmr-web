import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { datasetToQdmrYaml, parseQdmrYaml } from './qdmr';
import { elementId, elementName } from '../../model/dataset';
import { TaggedValue, isWdmrKey } from '../../model/types';

const FIXTURE = path.resolve('sampledata/example.qdmr.yaml');

async function loadFixture(): Promise<string> {
	return readFile(FIXTURE, 'utf8');
}

describe('parseQdmrYaml', () => {
	it('parses the example codeplug into the modelled collections', async () => {
		const ds = parseQdmrYaml(await loadFixture(), 'Example');

		expect(ds.name).toBe('Example');
		expect(ds.source).toBe('qdmr-yaml');
		expect(ds.settings.introLine1).toBe('qDMR');
		expect(ds.collections.radioIDs).toHaveLength(1);
		expect(ds.collections.contacts).toHaveLength(3);
		expect(ds.collections.groupLists).toHaveLength(1);
		expect(ds.collections.channels).toHaveLength(2);
		expect(ds.collections.zones).toHaveLength(1);
		expect(ds.collections.scanLists).toHaveLength(1);
		expect(ds.collections.roamingChannels).toHaveLength(1);
		expect(ds.collections.roamingZones).toHaveLength(1);
	});

	it('preserves wrapper types and element identities', async () => {
		const ds = parseQdmrYaml(await loadFixture());

		const [digital, analog] = ds.collections.channels;
		expect(digital.type).toBe('digital');
		expect(analog.type).toBe('analog');
		expect(elementId(digital)).toBe('ch5');
		expect(elementName(digital)).toBe('BB DB0LDS TS2');

		const contactTypes = ds.collections.contacts.map((c) => c.type);
		expect(contactTypes).toEqual(['dmr', 'dmr', 'dtmf']);

		const zone = ds.collections.zones[0];
		expect(zone.type).toBe('plain');
		expect(zone.fields.A).toEqual(['ch5', 'ch76']);
	});

	it('keeps custom tags (!default / !selected) as TaggedValue', async () => {
		const ds = parseQdmrYaml(await loadFixture());
		const digital = ds.collections.channels[0];
		expect(digital.fields.vox).toBeInstanceOf(TaggedValue);
		expect((digital.fields.vox as TaggedValue).tag).toBe('default');

		const scan = ds.collections.scanLists[0];
		expect((scan.fields.primary as TaggedValue).tag).toBe('selected');
	});

	it('preserves device-extension blocks verbatim', async () => {
		const ds = parseQdmrYaml(await loadFixture());
		const digital = ds.collections.channels[0];
		expect(digital.fields.openGD77).toEqual({ scanZoneSkip: false, beep: true });
	});
});

describe('datasetToQdmrYaml', () => {
	it('round-trips structure and tags through parse -> export -> parse', async () => {
		const ds1 = parseQdmrYaml(await loadFixture());
		const yaml = datasetToQdmrYaml(ds1);
		const ds2 = parseQdmrYaml(yaml);

		expect(ds2.collections.channels).toHaveLength(2);
		expect(ds2.collections.contacts.map((c) => c.type)).toEqual(['dmr', 'dmr', 'dtmf']);
		expect((ds2.collections.channels[0].fields.vox as TaggedValue).tag).toBe('default');
		expect((ds2.collections.scanLists[0].fields.primary as TaggedValue).tag).toBe('selected');
		expect(ds2.collections.channels[0].fields.openGD77).toEqual({
			scanZoneSkip: false,
			beep: true
		});
	});

	it('renders bare custom tags (no trailing null)', async () => {
		const ds = parseQdmrYaml(await loadFixture());
		const yaml = datasetToQdmrYaml(ds);
		expect(yaml).toMatch(/vox:\s*!default\s*$/m);
		expect(yaml).not.toMatch(/!default null/);
	});

	it('keeps wdmr* attributes by default but strips them when dmrconf-clean', async () => {
		const ds = parseQdmrYaml(await loadFixture());

		const normal = datasetToQdmrYaml(ds);
		expect(normal).toContain('wdmrTag');

		const clean = datasetToQdmrYaml(ds, { dmrconfClean: true });
		expect(clean).not.toContain('wdmrTag');
		expect(clean).not.toMatch(/wdmr/i);
		// but the rest of the channel survives
		expect(clean).toContain('BB DB0LDS TS2');

		const reparsed = parseQdmrYaml(clean);
		const fields = reparsed.collections.channels[0].fields;
		expect(Object.keys(fields).some(isWdmrKey)).toBe(false);
	});
});
