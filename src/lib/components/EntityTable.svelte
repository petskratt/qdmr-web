<script lang="ts">
	import type { CodeplugElement, Dataset } from '$lib/model/types';
	import { collectionMeta } from '$lib/model/types';
	import { workspace, touchDataset } from '$lib/state/workspace.svelte';
	import { createElement, elementName, idPrefixFor, nextElementId } from '$lib/model/dataset';
	import { formatCell } from '$lib/ui/format';
	import ElementEditor from './ElementEditor.svelte';

	let { dataset }: { dataset: Dataset } = $props();

	const meta = $derived(collectionMeta(workspace.activeCollection));
	const elements = $derived(dataset.collections[workspace.activeCollection]);
	const showKind = $derived(meta.types.length > 1);

	let editing = $state<CodeplugElement | null>(null);

	async function addElement() {
		const id = nextElementId(dataset, idPrefixFor(meta.key));
		const el = createElement(meta.types[0] ?? 'plain', { id, name: '' });
		elements.push(el);
		await touchDataset(dataset);
		editing = el;
	}

	async function removeElement(el: CodeplugElement) {
		const i = elements.indexOf(el);
		if (i >= 0) elements.splice(i, 1);
		await touchDataset(dataset);
	}
</script>

<div class="d-flex align-items-center justify-content-between mb-3">
	<h5 class="mb-0">
		<i class={`bi bi-${meta.icon}`} aria-hidden="true"></i>
		{meta.label}
		<span class="text-secondary fs-6">({elements.length})</span>
	</h5>
	<button type="button" class="btn btn-sm btn-primary" onclick={addElement}>
		<i class="bi bi-plus-lg" aria-hidden="true"></i> Add
	</button>
</div>

{#if elements.length === 0}
	<p class="text-secondary">No {meta.label.toLowerCase()} yet. Use <em>Add</em> to create one.</p>
{:else}
	<div class="table-responsive">
		<table class="table table-sm table-hover align-middle">
			<thead>
				<tr>
					{#if showKind}<th scope="col">kind</th>{/if}
					{#each meta.defaultColumns as col (col)}
						<th scope="col">{col}</th>
					{/each}
					<th scope="col" class="text-end">actions</th>
				</tr>
			</thead>
			<tbody>
				{#each elements as el (el.uid)}
					<tr>
						{#if showKind}<td><span class="badge text-bg-secondary">{el.type}</span></td>{/if}
						{#each meta.defaultColumns as col (col)}
							<td>{formatCell(el.fields[col])}</td>
						{/each}
						<td class="text-end text-nowrap">
							<button
								type="button"
								class="btn btn-sm btn-outline-secondary"
								aria-label={`Edit ${elementName(el)}`}
								onclick={() => (editing = el)}
							>
								<i class="bi bi-pencil" aria-hidden="true"></i>
							</button>
							<button
								type="button"
								class="btn btn-sm btn-outline-danger"
								aria-label={`Delete ${elementName(el)}`}
								onclick={() => removeElement(el)}
							>
								<i class="bi bi-trash" aria-hidden="true"></i>
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

{#if editing}
	{#key editing.uid}
		<ElementEditor {dataset} {meta} element={editing} onclose={() => (editing = null)} />
	{/key}
{/if}
