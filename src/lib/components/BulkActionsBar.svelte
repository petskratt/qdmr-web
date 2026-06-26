<script lang="ts">
	import type { CollectionMeta, Dataset } from '$lib/model/types';
	import { TaggedValue } from '$lib/model/types';
	import { elementName } from '$lib/model/dataset';
	import { touchDataset } from '$lib/state/workspace.svelte';
	import {
		addChannelsToScanList,
		addChannelsToZone,
		addTagToSelection,
		deleteSelection,
		setFieldOnSelection
	} from '$lib/actions/bulk';

	interface Props {
		dataset: Dataset;
		meta: CollectionMeta;
		selected: Set<string>;
		ondone: () => void;
	}
	let { dataset, meta, selected, ondone }: Props = $props();

	const POWER = ['Min', 'Low', 'Mid', 'High', 'Max'];

	let tag = $state('');
	let zoneUid = $state('');
	let scanUid = $state('');
	let power = $state('High');

	const isChannels = $derived(meta.key === 'channels');

	async function commit() {
		await touchDataset(dataset);
		ondone();
	}

	async function applyTag() {
		if (addTagToSelection(dataset, meta.key, selected, tag) > 0) {
			tag = '';
			await commit();
		}
	}

	async function applyDelete() {
		if (!confirm(`Delete ${selected.size} selected ${meta.label.toLowerCase()}?`)) return;
		deleteSelection(dataset, meta.key, selected);
		await commit();
	}

	async function applyZone() {
		if (!zoneUid) return;
		addChannelsToZone(dataset, selected, zoneUid);
		await commit();
	}

	async function applyScan() {
		if (!scanUid) return;
		addChannelsToScanList(dataset, selected, scanUid);
		await commit();
	}

	async function applyPower() {
		const value = power === 'Default' ? new TaggedValue('default') : power;
		setFieldOnSelection(dataset, meta.key, selected, 'power', value);
		await commit();
	}
</script>

<div class="bulk-bar">
	<span class="fw-semibold">{selected.size} selected</span>

	{#if isChannels}
		<div class="bulk-action">
			<select class="form-select form-select-sm" bind:value={zoneUid} aria-label="Zone">
				<option value="">Zone…</option>
				{#each dataset.collections.zones as z (z.uid)}<option value={z.uid}>{elementName(z)}</option>{/each}
			</select>
			<button type="button" class="btn btn-sm btn-outline-primary" disabled={!zoneUid} onclick={applyZone}>
				Add to zone
			</button>
		</div>

		<div class="bulk-action">
			<select class="form-select form-select-sm" bind:value={scanUid} aria-label="Scan list">
				<option value="">Scan list…</option>
				{#each dataset.collections.scanLists as s (s.uid)}<option value={s.uid}>{elementName(s)}</option>{/each}
			</select>
			<button type="button" class="btn btn-sm btn-outline-primary" disabled={!scanUid} onclick={applyScan}>
				Add to scan list
			</button>
		</div>

		<div class="bulk-action">
			<select class="form-select form-select-sm" bind:value={power} aria-label="Power">
				{#each POWER as p (p)}<option value={p}>{p}</option>{/each}
				<option value="Default">Default</option>
			</select>
			<button type="button" class="btn btn-sm btn-outline-primary" onclick={applyPower}>Set power</button>
		</div>
	{/if}

	<div class="bulk-action">
		<input class="form-control form-control-sm" placeholder="tag" bind:value={tag} style="width:8rem" />
		<button type="button" class="btn btn-sm btn-outline-primary" disabled={tag.trim() === ''} onclick={applyTag}>
			Add tag
		</button>
	</div>

	<button type="button" class="btn btn-sm btn-outline-danger ms-auto" onclick={applyDelete}>
		<i class="bi bi-trash" aria-hidden="true"></i> Delete
	</button>
</div>
