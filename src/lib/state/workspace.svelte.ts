// Reactive workspace: which datasets are open (tabs), which is active, and which
// collection (entity) is selected. Datasets are loaded from IndexedDB on demand
// and written back on mutation. UI selection is mirrored to localStorage so a
// reload restores the same tabs.

import type { CollectionKey, Dataset } from '../model/types';
import {
	deleteDataset,
	loadDataset,
	loadIndex,
	loadPref,
	savePref,
	saveDataset,
	type DatasetIndexEntry
} from './storage';

const OPEN_KEY = 'qdmr:open';
const ACTIVE_KEY = 'qdmr:active';
const COLLECTION_KEY = 'qdmr:collection';

interface WorkspaceState {
	index: DatasetIndexEntry[];
	open: Dataset[];
	activeId: string | null;
	activeCollection: CollectionKey;
	ready: boolean;
}

export const workspace = $state<WorkspaceState>({
	index: [],
	open: [],
	activeId: null,
	activeCollection: 'channels',
	ready: false
});

function persistOpenList(): void {
	savePref(
		OPEN_KEY,
		workspace.open.map((d) => d.id)
	);
	savePref(ACTIVE_KEY, workspace.activeId);
}

/** Load the index and re-open the tabs that were open last session. */
export async function initWorkspace(): Promise<void> {
	if (workspace.ready) return;
	workspace.index = loadIndex();
	workspace.activeCollection = loadPref<CollectionKey>(COLLECTION_KEY, 'channels');

	const openIds = loadPref<string[]>(OPEN_KEY, []);
	const restored: Dataset[] = [];
	for (const id of openIds) {
		const ds = await loadDataset(id);
		if (ds) restored.push(ds);
	}
	workspace.open = restored;

	const savedActive = loadPref<string | null>(ACTIVE_KEY, null);
	workspace.activeId =
		savedActive && restored.some((d) => d.id === savedActive)
			? savedActive
			: (restored[0]?.id ?? null);

	workspace.ready = true;
}

export function activeDataset(): Dataset | null {
	return workspace.open.find((d) => d.id === workspace.activeId) ?? null;
}

/** Add a freshly created/imported dataset, persist it, and focus it. */
export async function addDataset(ds: Dataset): Promise<void> {
	workspace.open.push(ds);
	workspace.activeId = ds.id;
	await saveDataset(ds);
	workspace.index = loadIndex();
	persistOpenList();
}

/** Open an existing (stored) dataset as a tab. */
export async function openDataset(id: string): Promise<void> {
	if (workspace.open.some((d) => d.id === id)) {
		workspace.activeId = id;
		persistOpenList();
		return;
	}
	const ds = await loadDataset(id);
	if (!ds) return;
	workspace.open.push(ds);
	workspace.activeId = id;
	persistOpenList();
}

/** Close a tab (keeps the dataset in storage). */
export function closeDataset(id: string): void {
	const i = workspace.open.findIndex((d) => d.id === id);
	if (i < 0) return;
	workspace.open.splice(i, 1);
	if (workspace.activeId === id) {
		workspace.activeId = workspace.open[Math.max(0, i - 1)]?.id ?? null;
	}
	persistOpenList();
}

/** Close a tab AND permanently delete the dataset from storage. */
export async function removeDataset(id: string): Promise<void> {
	closeDataset(id);
	await deleteDataset(id);
	workspace.index = loadIndex();
}

export function setActive(id: string): void {
	workspace.activeId = id;
	persistOpenList();
}

export function setActiveCollection(key: CollectionKey): void {
	workspace.activeCollection = key;
	savePref(COLLECTION_KEY, key);
}

/** Mark a dataset changed: bump timestamp and persist it. */
export async function touchDataset(ds: Dataset): Promise<void> {
	ds.updatedAt = Date.now();
	await saveDataset(ds);
	workspace.index = loadIndex();
}
