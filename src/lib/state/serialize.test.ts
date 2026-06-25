import { describe, expect, it } from 'vitest';
import { deserializeDataset, serializeDataset } from './serialize';
import { parseQdmrYaml } from '../io/yaml/qdmr';
import { TaggedValue } from '../model/types';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

describe('dataset serialization', () => {
	it('round-trips a dataset including TaggedValue instances', async () => {
		const yaml = await readFile(path.resolve('sampledata/example.qdmr.yaml'), 'utf8');
		const ds = parseQdmrYaml(yaml);

		const revived = deserializeDataset(serializeDataset(ds));

		expect(revived.collections.channels).toHaveLength(2);
		const vox = revived.collections.channels[0].fields.vox;
		expect(vox).toBeInstanceOf(TaggedValue);
		expect((vox as TaggedValue).tag).toBe('default');
		expect(revived.collections.channels[0].fields.openGD77).toEqual({
			scanZoneSkip: false,
			beep: true
		});
		expect(revived.name).toBe(ds.name);
		expect(revived.id).toBe(ds.id);
	});
});
