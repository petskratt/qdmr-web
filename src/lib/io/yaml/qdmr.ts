// qDMR extensible (YAML) codeplug codec.
//
// Import: tolerant parse that preserves every key, including unknown qDMR fields,
// device-extension blocks and custom tags (`!default`, `!selected`).
// Export: faithful re-serialization. With `dmrconfClean`, `wdmr*` attributes are
// stripped so dmrconf's verifier never sees keys it does not recognize.

import {
	Document,
	isMap,
	isScalar,
	isSeq,
	Pair,
	parseDocument,
	Scalar,
	YAMLMap,
	YAMLSeq,
	type Node,
	type ScalarTag
} from 'yaml';
import {
	COLLECTIONS,
	isWdmrKey,
	TaggedValue,
	type CollectionKey,
	type Dataset,
	type YamlValue
} from '../../model/types';
import { createDataset, createElement } from '../../model/dataset';

const COLLECTION_BY_YAML_KEY = new Map(COLLECTIONS.map((c) => [c.yamlKey, c.key]));

function isPlainObject(v: unknown): v is Record<string, YamlValue> {
	return (
		typeof v === 'object' &&
		v !== null &&
		!Array.isArray(v) &&
		!(v instanceof TaggedValue)
	);
}

function isLocalTag(tag: unknown): tag is string {
	return typeof tag === 'string' && tag.startsWith('!') && !tag.startsWith('!!');
}

// ── Import ───────────────────────────────────────────────────────────────────

function nodeToValue(node: unknown): YamlValue {
	if (node == null) return null;

	if (isScalar(node)) {
		if (isLocalTag(node.tag)) {
			const inner = node.value;
			// A bare tag (`vox: !default`) carries no content; normalize the empty
			// scalar to null so it re-serializes without a trailing value.
			const value = inner === undefined || inner === '' ? null : (inner as YamlValue);
			return new TaggedValue(node.tag.slice(1), value);
		}
		return (node.value ?? null) as YamlValue;
	}

	if (isSeq(node)) {
		return node.items.map((item) => nodeToValue(item));
	}

	if (isMap(node)) {
		const out: Record<string, YamlValue> = {};
		for (const pair of node.items) {
			const key = scalarKey(pair.key);
			if (key === null) continue;
			out[key] = nodeToValue(pair.value);
		}
		return out;
	}

	// Already a plain JS value (can happen for nested toJSON results).
	return node as YamlValue;
}

function scalarKey(key: unknown): string | null {
	if (typeof key === 'string') return key;
	if (isScalar(key)) return String(key.value);
	if (key == null) return null;
	return String(key);
}

function parseCollection(node: unknown, collection: CollectionKey, ds: Dataset): void {
	if (!isSeq(node)) return;
	for (const item of node.items) {
		const val = nodeToValue(item);
		if (!isPlainObject(val)) continue;
		const keys = Object.keys(val);
		if (keys.length === 1 && isPlainObject(val[keys[0]])) {
			// Wrapped element: { digital: {...} } / { dmr: {...} } / ...
			ds.collections[collection].push(
				createElement(keys[0], val[keys[0]] as Record<string, YamlValue>)
			);
		} else {
			ds.collections[collection].push(createElement('plain', val));
		}
	}
}

export function parseQdmrYaml(text: string, name = 'Imported codeplug'): Dataset {
	const doc = parseDocument(text, { strict: false, logLevel: 'silent' });
	const root = doc.contents;
	if (!isMap(root)) {
		throw new Error('Not a qDMR codeplug: expected a top-level YAML mapping.');
	}

	const ds = createDataset(name, 'qdmr-yaml');
	for (const pair of root.items) {
		const key = scalarKey(pair.key);
		if (key === null) continue;

		if (key === 'settings') {
			const val = nodeToValue(pair.value);
			ds.settings = isPlainObject(val) ? val : {};
			continue;
		}

		const collection = COLLECTION_BY_YAML_KEY.get(key);
		if (collection) {
			parseCollection(pair.value, collection, ds);
			continue;
		}

		// Unknown top-level key (version, device extension, ...): preserve verbatim.
		ds.extensions[key] = nodeToValue(pair.value);
	}
	return ds;
}

// ── Export ───────────────────────────────────────────────────────────────────

/** Recursively drop `wdmr*` keys from any value (for dmrconf-clean output). */
function stripWdmr(value: YamlValue): YamlValue {
	if (Array.isArray(value)) return value.map(stripWdmr);
	if (isPlainObject(value)) {
		const out: Record<string, YamlValue> = {};
		for (const [k, v] of Object.entries(value)) {
			if (isWdmrKey(k)) continue;
			out[k] = stripWdmr(v);
		}
		return out;
	}
	return value;
}

/** Collect every distinct custom-tag name used anywhere in a value tree. */
function collectTags(value: YamlValue, into: Set<string>): void {
	if (value instanceof TaggedValue) {
		into.add(value.tag);
		collectTags(value.value, into);
	} else if (Array.isArray(value)) {
		for (const v of value) collectTags(v, into);
	} else if (isPlainObject(value)) {
		for (const v of Object.values(value)) collectTags(v, into);
	}
}

/**
 * Build a yaml schema scalar-tag for each custom tag present, so a bare
 * `!default` / `!selected` stringifies without a trailing `null`.
 */
function customTagsFor(tagNames: Set<string>): ScalarTag[] {
	// eemeli emits the tag itself; stringify returns only the value part, so a
	// null value yields a bare `!default` (with a trailing space we trim later).
	return [...tagNames].map((name) => ({
		tag: `!${name}`,
		identify: (v: unknown) => v instanceof TaggedValue && v.tag === name,
		resolve: () => new TaggedValue(name),
		stringify: (item: unknown) => {
			const v = (item as { value?: unknown })?.value;
			return v === null || v === undefined ? '' : String(v);
		}
	}));
}

function buildNode(value: YamlValue, doc: Document): Node {
	if (value instanceof TaggedValue) {
		const scalar = new Scalar(value.value instanceof TaggedValue ? null : value.value);
		scalar.tag = `!${value.tag}`;
		return scalar;
	}
	if (Array.isArray(value)) {
		const seq = new YAMLSeq();
		for (const item of value) seq.items.push(buildNode(item, doc));
		return seq;
	}
	if (isPlainObject(value)) {
		const map = new YAMLMap();
		for (const [k, v] of Object.entries(value)) {
			map.items.push(new Pair(new Scalar(k), buildNode(v, doc)));
		}
		return map;
	}
	return new Scalar(value);
}

export interface QdmrExportOptions {
	/** Strip `wdmr*` attributes so dmrconf accepts the file. Default: false. */
	dmrconfClean?: boolean;
}

/** Build the ordered plain-object representation of a dataset (qDMR layout). */
function datasetToObject(ds: Dataset, clean: boolean): Record<string, YamlValue> {
	const wrap = (v: YamlValue): YamlValue => (clean ? stripWdmr(v) : v);
	const root: Record<string, YamlValue> = {};

	// Preserve a top-level `version` first if present in extensions.
	if ('version' in ds.extensions) root.version = wrap(ds.extensions.version);

	if (Object.keys(ds.settings).length > 0) root.settings = wrap({ ...ds.settings });

	for (const meta of COLLECTIONS) {
		const elements = ds.collections[meta.key];
		if (elements.length === 0) continue;
		root[meta.yamlKey] = elements.map((el) => {
			const fields = wrap({ ...el.fields });
			return el.type === 'plain' ? fields : { [el.type]: fields };
		});
	}

	for (const [k, v] of Object.entries(ds.extensions)) {
		if (k === 'version') continue;
		root[k] = wrap(v);
	}
	return root;
}

export function datasetToQdmrYaml(ds: Dataset, opts: QdmrExportOptions = {}): string {
	const root = datasetToObject(ds, opts.dmrconfClean ?? false);
	const tagNames = new Set<string>();
	collectTags(root, tagNames);
	const doc = new Document(undefined, { customTags: customTagsFor(tagNames) });
	doc.contents = buildNode(root, doc) as Document['contents'];
	// lineWidth: 0 keeps long channel-id sequences on one line (no wrapping).
	// Trim trailing whitespace (bare custom tags emit a stray space).
	return doc.toString({ lineWidth: 0 }).replace(/[ \t]+$/gm, '');
}
