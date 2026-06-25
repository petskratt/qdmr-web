#!/usr/bin/env node
// Generate src/lib/data/radios.json from qdmr's upstream radio registry.
//
// Source of truth: lib/radioinfo.cc (`_radiosByName` = the exact dmrconf
// `--radio=<key>` keys, `_radiosById` = canonical class per enum) plus each
// device's `defaultRadioInfo()` which carries the display name, manufacturer and
// alias keys. We pin to a tag so upstream churn never silently changes our data;
// bump TAG and re-run `npm run gen:radios` to update.
//
// Run: node scripts/gen-radios.mjs   (needs network access to raw.githubusercontent.com)

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TAG = 'v0.15.1';
const BASE = `https://raw.githubusercontent.com/hmatuschek/qdmr/${TAG}/lib`;
const OUT = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	'../src/lib/data/radios.json'
);

async function fetchText(url) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Fetch failed (${res.status}): ${url}`);
	return res.text();
}

/** Extract the `{ ... }` initializer body for a named QHash. */
function hashBody(src, declRe) {
	const m = src.match(declRe);
	if (!m) throw new Error(`Could not locate ${declRe} in radioinfo.cc`);
	const start = m.index + m[0].length;
	const end = src.indexOf('};', start);
	if (end < 0) throw new Error(`Unterminated initializer for ${declRe}`);
	return src.slice(start, end);
}

/** Slice a `ClassName::defaultRadioInfo() { ... }` function body. */
function defaultRadioInfoBody(src, className) {
	const sig = `${className}::defaultRadioInfo()`;
	const at = src.indexOf(sig);
	if (at < 0) return null;
	const open = src.indexOf('{', at);
	// Function body is short; the first column-0 `}` closes it.
	const close = src.indexOf('\n}', open);
	return src.slice(open, close < 0 ? undefined : close);
}

// A `RadioInfo(RadioInfo::ENUM, <strings...>, {interfaces})` call. Two forms
// appear in the wild: with an explicit key (enum, "key", "name", "manufacturer")
// for primaries, and without (enum, "name", "manufacturer") for aliases. We
// capture the enum plus the argument blob up to the interfaces `{`.
const CALL_RE = /RadioInfo\(\s*RadioInfo::(\w+)\s*,\s*([^{]*?)\{/g;

/** Pull name + manufacturer out of one RadioInfo(...) argument blob. */
function metaFromCall(enumName, blob) {
	const strings = [...blob.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
	if (strings.length >= 3) return { name: strings[1], manufacturer: strings[2] }; // key,name,manuf
	if (strings.length === 2) return { name: strings[0], manufacturer: strings[1] }; // name,manuf
	if (strings.length === 1) return { name: strings[0], manufacturer: '' };
	return { name: enumName, manufacturer: '' };
}

/** Parse the enum block of radioinfo.hh into { aliasEnum -> canonicalEnum }. */
function parseEnumAliases(headerSrc) {
	const m = headerSrc.match(/enum\s+Radio\s*\{([\s\S]*?)\}/);
	if (!m) throw new Error('Could not find enum Radio in radioinfo.hh');
	const aliases = {};
	for (const part of m[1].split(',')) {
		const eq = part.match(/(\w+)\s*=\s*(\w+)/);
		if (eq) aliases[eq[1]] = eq[2];
	}
	return aliases;
}

async function main() {
	const radioinfo = await fetchText(`${BASE}/radioinfo.cc`);
	const enumAliases = parseEnumAliases(await fetchText(`${BASE}/radioinfo.hh`));

	// key -> enum constant (authoritative list of dmrconf keys, in source order)
	const byName = [];
	for (const m of hashBody(radioinfo, /_radiosByName\s*=\s*QHash<[^>]*>\{/).matchAll(
		/\{\s*"([^"]+)"\s*,\s*RadioInfo::(\w+)\s*\}/g
	)) {
		byName.push({ key: m[1], enum: m[2] });
	}
	if (byName.length === 0) throw new Error('Parsed zero radios from _radiosByName');

	// enum constant -> canonical class providing defaultRadioInfo()
	const classByEnum = {};
	for (const m of hashBody(radioinfo, /_radiosById\s*=\s*QHash<[^>]*>\{/).matchAll(
		/\{\s*RadioInfo::(\w+)\s*,\s*(\w+)::defaultRadioInfo\(\)\s*\}/g
	)) {
		classByEnum[m[1]] = m[2];
	}

	// Fetch each unique device file and collect metadata keyed by enum constant
	// (the stable join to _radiosByName; alias tuples carry their own enum).
	const classes = [...new Set(Object.values(classByEnum))];
	const metaByEnum = new Map(); // enum -> { name, manufacturer }
	for (const cls of classes) {
		const src = await fetchText(`${BASE}/${cls.toLowerCase()}.cc`);
		const body = defaultRadioInfoBody(src, cls);
		if (!body) {
			console.warn(`! No defaultRadioInfo() body for ${cls}, skipping enrichment`);
			continue;
		}
		for (const m of body.matchAll(CALL_RE)) {
			const [, enumName, blob] = m;
			if (!metaByEnum.has(enumName)) metaByEnum.set(enumName, metaFromCall(enumName, blob));
		}
	}

	// canonical enum -> the _radiosByName key that names that same enum directly
	const keyByEnum = {};
	for (const { key, enum: e } of byName) if (!(e in keyByEnum)) keyByEnum[e] = key;

	const radios = byName.map(({ key, enum: enumName }) => {
		const meta = metaByEnum.get(enumName) ?? { name: key, manufacturer: '' };
		const canonicalEnum = enumAliases[enumName] ?? enumName;
		const canonicalKey = keyByEnum[canonicalEnum] ?? key;
		return {
			key,
			name: meta.name,
			manufacturer: meta.manufacturer,
			enum: enumName,
			aliasOf: canonicalKey === key ? null : canonicalKey
		};
	});

	// Stable sort: manufacturer, then name.
	radios.sort(
		(a, b) =>
			a.manufacturer.localeCompare(b.manufacturer) || a.name.localeCompare(b.name)
	);

	const out = {
		generatedFrom: { repo: 'hmatuschek/qdmr', tag: TAG },
		generatedAt: new Date().toISOString(),
		count: radios.length,
		radios
	};

	await mkdir(path.dirname(OUT), { recursive: true });
	await writeFile(OUT, JSON.stringify(out, null, '\t') + '\n', 'utf8');
	console.log(`Wrote ${radios.length} radios -> ${path.relative(process.cwd(), OUT)} (qdmr ${TAG})`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
