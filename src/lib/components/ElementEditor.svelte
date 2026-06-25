<script lang="ts">
	import { untrack } from 'svelte';
	import type { CodeplugElement, CollectionMeta, Dataset, YamlValue } from '$lib/model/types';
	import { touchDataset } from '$lib/state/workspace.svelte';
	import { draftToValue, valueToDraft, type FieldMode } from '$lib/ui/fieldEdit';
	import { elementName } from '$lib/model/dataset';

	interface Props {
		dataset: Dataset;
		meta: CollectionMeta;
		element: CodeplugElement;
		onclose: () => void;
	}

	let { dataset, meta, element, onclose }: Props = $props();

	interface Row {
		key: string;
		mode: FieldMode;
		text: string;
	}

	const MODES: FieldMode[] = ['scalar', 'list', 'tag', 'json'];

	// One-time working copy: the editor is remounted per element (keyed by uid),
	// so capturing the initial prop value with untrack is intentional.
	let draftType = $state(untrack(() => element.type));
	let rows = $state<Row[]>(
		untrack(() => Object.entries(element.fields).map(([key, value]) => ({ key, ...valueToDraft(value) })))
	);
	let error = $state<string | null>(null);

	const showTypeSelect = $derived(meta.types.length > 1);

	function addRow() {
		rows.push({ key: '', mode: 'scalar', text: '' });
	}

	function removeRow(i: number) {
		rows.splice(i, 1);
	}

	async function save() {
		const fields: Record<string, YamlValue> = {};
		for (const row of rows) {
			const key = row.key.trim();
			if (key === '') continue;
			try {
				fields[key] = draftToValue(row);
			} catch (e) {
				error = `Field "${key}": ${(e as Error).message}`;
				return;
			}
		}
		element.type = draftType;
		element.fields = fields;
		error = null;
		await touchDataset(dataset);
		onclose();
	}
</script>

<div
	class="qdmr-modal-backdrop"
	role="button"
	tabindex="-1"
	onclick={(e) => {
		if (e.target === e.currentTarget) onclose();
	}}
	onkeydown={(e) => {
		if (e.key === 'Escape') onclose();
	}}
>
	<div class="qdmr-modal" role="dialog" aria-modal="true" aria-label="Edit element">
		<div class="qdmr-modal-header">
			<strong>Edit {meta.label.replace(/s$/, '')}: {elementName(element)}</strong>
			<button type="button" class="btn-close" aria-label="Close" onclick={onclose}></button>
		</div>

		<div class="qdmr-modal-body">
			{#if showTypeSelect}
				<div class="mb-3">
					<label class="form-label" for="el-type">Type</label>
					<select id="el-type" class="form-select form-select-sm" bind:value={draftType}>
						{#each meta.types as t (t)}
							<option value={t}>{t}</option>
						{/each}
					</select>
				</div>
			{/if}

			{#if error}
				<div class="alert alert-danger py-2" role="alert">{error}</div>
			{/if}

			<div class="field-row text-secondary small">
				<span>Field</span>
				<span>Mode</span>
				<span>Value</span>
				<span></span>
			</div>

			{#each rows as row, i (i)}
				<div class="field-row">
					<input class="form-control form-control-sm" placeholder="name" bind:value={row.key} />
					<select class="form-select form-select-sm" bind:value={row.mode}>
						{#each MODES as m (m)}
							<option value={m}>{m}</option>
						{/each}
					</select>
					{#if row.mode === 'json'}
						<textarea class="form-control form-control-sm" rows="2" bind:value={row.text}></textarea>
					{:else}
						<input class="form-control form-control-sm" bind:value={row.text} />
					{/if}
					<button
						type="button"
						class="btn btn-sm btn-outline-danger"
						aria-label="Remove field"
						onclick={() => removeRow(i)}
					>
						<i class="bi bi-trash" aria-hidden="true"></i>
					</button>
				</div>
			{/each}

			<button type="button" class="btn btn-sm btn-outline-secondary mt-2" onclick={addRow}>
				<i class="bi bi-plus-lg" aria-hidden="true"></i> Add field
			</button>
		</div>

		<div class="qdmr-modal-footer">
			<small class="text-secondary">
				modes: scalar, list (comma-separated), tag (!default), json
			</small>
			<div class="d-flex gap-2">
				<button type="button" class="btn btn-sm btn-secondary" onclick={onclose}>Cancel</button>
				<button type="button" class="btn btn-sm btn-primary" onclick={save}>Save</button>
			</div>
		</div>
	</div>
</div>
