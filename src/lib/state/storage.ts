// Browser persistence. Per the project's "all data in the browser" requirement:
//   - small UI prefs + a dataset index live in localStorage (sync, tiny),
//   - full dataset payloads live in IndexedDB (codeplugs easily exceed the ~5MB
//     localStorage cap).
// Everything is funnelled through this one module so swapping the backing store
// (or forcing pure localStorage) is a one-file change.

import { createStore, del, get, set } from 'idb-keyval';
import type { Dataset, DatasetSource } from '../model/types';
import { elementCount } from '../model/dataset';
import { deserializeDataset, serializeDataset } from './serialize';

const INDEX_KEY = 'qdmr:index';
const dsStore = browser() ? createStore('qdmr-web', 'datasets') : undefined;

function browser(): boolean {
	return typeof indexedDB !== 'undefined' && typeof localStorage !== 'undefined';
}

/** Lightweight metadata for the dataset list, kept in localStorage. */
export interface DatasetIndexEntry {
	id: string;
	name: string;
	source: DatasetSource;
	createdAt: number;
	updatedAt: number;
	elements: number;
}

export function loadIndex(): DatasetIndexEntry[] {
	if (!browser()) return [];
	try {
		const raw = localStorage.getItem(INDEX_KEY);
		return raw ? (JSON.parse(raw) as DatasetIndexEntry[]) : [];
	} catch {
		return [];
	}
}

function writeIndex(entries: DatasetIndexEntry[]): void {
	if (!browser()) return;
	localStorage.setItem(INDEX_KEY, JSON.stringify(entries));
}

function indexEntry(ds: Dataset): DatasetIndexEntry {
	return {
		id: ds.id,
		name: ds.name,
		source: ds.source,
		createdAt: ds.createdAt,
		updatedAt: ds.updatedAt,
		elements: elementCount(ds)
	};
}

function upsertIndex(ds: Dataset): void {
	const entries = loadIndex();
	const i = entries.findIndex((e) => e.id === ds.id);
	const entry = indexEntry(ds);
	if (i >= 0) entries[i] = entry;
	else entries.push(entry);
	writeIndex(entries);
}

export async function saveDataset(ds: Dataset): Promise<void> {
	if (!dsStore) return;
	await set(`ds:${ds.id}`, serializeDataset(ds), dsStore);
	upsertIndex(ds);
}

export async function loadDataset(id: string): Promise<Dataset | undefined> {
	if (!dsStore) return undefined;
	const text = await get<string>(`ds:${id}`, dsStore);
	return text ? deserializeDataset(text) : undefined;
}

export async function deleteDataset(id: string): Promise<void> {
	if (!dsStore) return;
	await del(`ds:${id}`, dsStore);
	writeIndex(loadIndex().filter((e) => e.id !== id));
}

// ── Generic JSON prefs (UI state, API keys) ──────────────────────────────────

export function loadPref<T>(key: string, fallback: T): T {
	if (!browser()) return fallback;
	try {
		const raw = localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : fallback;
	} catch {
		return fallback;
	}
}

export function savePref<T>(key: string, value: T): void {
	if (!browser()) return;
	localStorage.setItem(key, JSON.stringify(value));
}
