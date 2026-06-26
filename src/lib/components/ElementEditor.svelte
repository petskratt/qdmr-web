<script lang="ts">
	import { untrack } from 'svelte';
	import type { CodeplugElement, CollectionMeta, Dataset, YamlValue } from '$lib/model/types';
	import { touchDataset } from '$lib/state/workspace.svelte';
	import { elementId, elementName } from '$lib/model/dataset';
	import { schemaFor, schemaTopLevelKeys } from '$lib/schema/fields';
	import { cloneValue } from '$lib/schema/values';
	import FieldInput from './fields/FieldInput.svelte';

	interface Props {
		dataset: Dataset;
		meta: CollectionMeta;
		element: CodeplugElement;
		onclose: () => void;
	}
	let { dataset, meta, element, onclose }: Props = $props();

	// Working copy; discarded on Cancel, written back on Save.
	let draftType = $state(untrack(() => element.type));
	let fields = $state<Record<string, YamlValue>>(
		untrack(() => cloneValue({ ...element.fields }) as Record<string, YamlValue>)
	);

	interface OtherRow {
		key: string;
		text: string;
		error: string | null;
	}
	// Device-extension / unknown keys not covered by the schema (advanced editing).
	let otherRows = $state<OtherRow[]>(
		untrack(() => {
			const managed = schemaTopLevelKeys(meta.key, element.type);
			return Object.entries(element.fields)
				.filter(([k]) => !managed.has(k))
				.map(([k, v]) => ({ key: k, text: JSON.stringify(cloneValue(v)), error: null }));
		})
	);

	let tab = $state<'basic' | 'extensions'>('basic');
	let saveError = $state<string | null>(null);

	const schema = $derived(schemaFor(meta.key, draftType));
	const basicFields = $derived(schema.filter((f) => f.group === 'basic'));
	const extendedFields = $derived(schema.filter((f) => f.group === 'extended'));
	const showTypeSelect = $derived(meta.types.length > 1);
	const hasExtensions = $derived(extendedFields.length > 0 || otherRows.length > 0);

	function addOther() {
		otherRows.push({ key: '', text: 'null', error: null });
	}
	function removeOther(i: number) {
		otherRows.splice(i, 1);
	}

	function save() {
		saveError = null;
		// Apply the advanced "other" rows: drop current unmanaged keys, re-add parsed.
		const managed = schemaTopLevelKeys(meta.key, draftType);
		for (const k of Object.keys(fields)) if (!managed.has(k)) delete fields[k];
		for (const row of otherRows) {
			const key = row.key.trim();
			if (key === '') continue;
			try {
				fields[key] = JSON.parse(row.text) as YamlValue;
				row.error = null;
			} catch (e) {
				row.error = (e as Error).message;
				saveError = `Field "${key}": invalid JSON`;
				return;
			}
		}
		element.type = draftType;
		element.fields = fields;
		void touchDataset(dataset);
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
			<div>
				<strong>Edit {meta.label.replace(/s$/, '')}: {elementName(element)}</strong>
				<code class="ms-2 text-secondary small">id: {elementId(element) ?? '—'}</code>
			</div>
			<button type="button" class="btn-close" aria-label="Close" onclick={onclose}></button>
		</div>

		<div class="qdmr-modal-subhead">
			{#if showTypeSelect}
				<div class="d-flex align-items-center gap-2">
					<span class="text-secondary small">Type</span>
					<select class="form-select form-select-sm w-auto" bind:value={draftType}>
						{#each meta.types as t (t)}<option value={t}>{t}</option>{/each}
					</select>
				</div>
			{/if}
			{#if hasExtensions}
				<ul class="nav nav-pills nav-sm ms-auto">
					<li class="nav-item">
						<button
							type="button"
							class="nav-link"
							class:active={tab === 'basic'}
							onclick={() => (tab = 'basic')}>Basic</button
						>
					</li>
					<li class="nav-item">
						<button
							type="button"
							class="nav-link"
							class:active={tab === 'extensions'}
							onclick={() => (tab = 'extensions')}>Extensions</button
						>
					</li>
				</ul>
			{/if}
		</div>

		<div class="qdmr-modal-body">
			{#if saveError}<div class="alert alert-danger py-2" role="alert">{saveError}</div>{/if}

			{#if tab === 'basic'}
				{#if basicFields.length === 0}
					<p class="text-secondary">No known fields for this type. See the Extensions tab.</p>
				{/if}
				{#each basicFields as def (def.path)}
					<div class="form-field">
						<label class="form-label" for={`f-${def.path}`}>{def.label}</label>
						<div id={`f-${def.path}`}><FieldInput {fields} {def} {dataset} /></div>
					</div>
				{/each}
			{:else}
				{#each extendedFields as def (def.path)}
					<div class="form-field">
						<label class="form-label" for={`f-${def.path}`}>{def.label}</label>
						<div id={`f-${def.path}`}><FieldInput {fields} {def} {dataset} /></div>
					</div>
				{/each}

				<hr />
				<div class="d-flex align-items-center justify-content-between mb-2">
					<span class="text-secondary small">Device extensions &amp; custom (wdmr*) keys — raw JSON</span>
					<button type="button" class="btn btn-sm btn-outline-secondary" onclick={addOther}>
						<i class="bi bi-plus-lg" aria-hidden="true"></i> Add key
					</button>
				</div>
				{#each otherRows as row, i (i)}
					<div class="other-row">
						<input class="form-control form-control-sm" placeholder="key" bind:value={row.key} />
						<textarea class="form-control form-control-sm font-monospace" rows="1" bind:value={row.text}
						></textarea>
						<button
							type="button"
							class="btn btn-sm btn-outline-danger"
							aria-label="Remove key"
							onclick={() => removeOther(i)}><i class="bi bi-trash" aria-hidden="true"></i></button
						>
						{#if row.error}<small class="text-danger">{row.error}</small>{/if}
					</div>
				{/each}
			{/if}
		</div>

		<div class="qdmr-modal-footer">
			<small class="text-secondary">id is fixed; mandatory fields follow the qDMR format</small>
			<div class="d-flex gap-2">
				<button type="button" class="btn btn-sm btn-secondary" onclick={onclose}>Cancel</button>
				<button type="button" class="btn btn-sm btn-primary" onclick={save}>Save</button>
			</div>
		</div>
	</div>
</div>
