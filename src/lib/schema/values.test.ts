import { describe, expect, it } from 'vitest';
import {
	deletePath,
	formatTone,
	getPath,
	isDefault,
	parseTone,
	setPath,
	toneToValue
} from './values';
import { TaggedValue, type YamlValue } from '../model/types';

describe('path access', () => {
	it('gets nested values', () => {
		const f: Record<string, YamlValue> = { name: 'x', extended: { talkaround: true } };
		expect(getPath(f, 'name')).toBe('x');
		expect(getPath(f, 'extended.talkaround')).toBe(true);
		expect(getPath(f, 'extended.missing')).toBeUndefined();
		expect(getPath(f, 'nope.deep')).toBeUndefined();
	});

	it('sets nested values, creating intermediates', () => {
		const f: Record<string, YamlValue> = {};
		setPath(f, 'extended.talkaround', true);
		expect(f).toEqual({ extended: { talkaround: true } });
		setPath(f, 'name', 'hello');
		expect(f.name).toBe('hello');
	});

	it('deletes nested values and prunes empty parents', () => {
		const f: Record<string, YamlValue> = { extended: { talkaround: true }, name: 'x' };
		deletePath(f, 'extended.talkaround');
		expect(f).toEqual({ name: 'x' });
	});
});

describe('default tag', () => {
	it('detects !default', () => {
		expect(isDefault(new TaggedValue('default'))).toBe(true);
		expect(isDefault(new TaggedValue('selected'))).toBe(false);
		expect(isDefault('High')).toBe(false);
	});
});

describe('tone', () => {
	it('parses ctcss and dcs maps', () => {
		expect(parseTone({ ctcss: 67 })).toEqual({ type: 'ctcss', value: 67 });
		expect(parseTone({ dcs: 23 })).toEqual({ type: 'dcs', value: 23 });
		expect(parseTone(undefined)).toEqual({ type: 'none', value: null });
	});

	it('round-trips through toneToValue', () => {
		expect(toneToValue({ type: 'ctcss', value: 82.5 })).toEqual({ ctcss: 82.5 });
		expect(toneToValue({ type: 'none', value: null })).toBeUndefined();
	});

	it('formats tones for display', () => {
		expect(formatTone({ ctcss: 67 })).toBe('CTCSS 67 Hz');
		expect(formatTone({ dcs: 23 })).toBe('DCS 23N');
		expect(formatTone({ dcs: -23 })).toBe('DCS 23I');
		expect(formatTone(undefined)).toBe('');
	});
});
