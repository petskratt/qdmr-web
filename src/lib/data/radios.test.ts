import { describe, expect, it } from 'vitest';
import {
	isKnownRadioKey,
	radioByKey,
	radioCatalog,
	radios,
	radiosByManufacturer
} from './radios';

describe('radio catalog', () => {
	it('was generated from a pinned qdmr tag', () => {
		expect(radioCatalog.generatedFrom.repo).toBe('hmatuschek/qdmr');
		expect(radioCatalog.generatedFrom.tag).toMatch(/^v\d+\.\d+/);
		expect(radios.length).toBeGreaterThan(20);
		expect(radioCatalog.count).toBe(radios.length);
	});

	it('contains the well-known dmrconf keys', () => {
		for (const key of ['d878uv', 'uv390', 'opengd77', 'rd5r', 'd868uve']) {
			expect(isKnownRadioKey(key)).toBe(true);
		}
		expect(isKnownRadioKey('totally-not-a-radio')).toBe(false);
	});

	it('every entry has a key, name and unique key', () => {
		const seen = new Set<string>();
		for (const r of radios) {
			expect(r.key).toBeTruthy();
			expect(r.name).toBeTruthy();
			expect(seen.has(r.key)).toBe(false);
			seen.add(r.key);
		}
	});

	it('resolves known aliases to canonical keys that exist', () => {
		expect(radioByKey('rt3s')?.aliasOf).toBe('uv390');
		expect(radioByKey('uv380')?.aliasOf).toBe('uv390');
		expect(radioByKey('md380')?.aliasOf).toBe('md390');
		// canonical radios alias nothing
		expect(radioByKey('uv390')?.aliasOf).toBeNull();
		// every aliasOf target is itself a real key
		for (const r of radios) {
			if (r.aliasOf) expect(isKnownRadioKey(r.aliasOf)).toBe(true);
		}
	});

	it('groups by manufacturer', () => {
		const groups = radiosByManufacturer();
		expect(groups.length).toBeGreaterThan(1);
		const anytone = groups.find((g) => g.manufacturer === 'AnyTone');
		expect(anytone?.radios.some((r) => r.key === 'd878uv')).toBe(true);
	});
});
