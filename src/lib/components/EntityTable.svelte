<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import type { CodeplugElement, Dataset } from '$lib/model/types';
	import { collectionMeta } from '$lib/model/types';
	import { touchDataset, workspace } from '$lib/state/workspace.svelte';
	import { createElement, elementName, idPrefixFor, nextElementId } from '$lib/model/dataset';
	import { columnsFor } from '$lib/ui/columns';
	import ElementEditor from './ElementEditor.svelte';
	import BulkActionsBar from './BulkActionsBar.svelte';

	let { dataset }: { dataset: Dataset } = $props();

	const meta = $derived(collectionMeta(workspace.activeCollection));
	const elements = $derived(dataset.collections[workspace.activeCollection]);
	const columns = $derived(columnsFor(workspace.activeCollection));

	// Per-collection view state. The parent remounts this component via {#key}
	// when the dataset or collection changes, so these start fresh each time.
	// Track the element being edited by uid and resolve it back through the
	// reactive array, so the editor mutates the proxied object (not a stale ref).
	let editingUid = $state<string | null>(null);
	const editing = $derived(editingUid ? (elements.find((e) => e.uid === editingUid) ?? null) : null);
	let filter = $state('');
	let sortCol = $state<string | null>(null);
	let sortDir = $state<1 | -1>(1);
	const selected = new SvelteSet<string>();

	const rows = $derived.by(() => {
		const q = filter.trim().toLowerCase();
		let out = elements;
		if (q !== '') {
			out = out.filter((el) =>
				columns
					.map((c) => c.render(el))
					.join(' ')
					.toLowerCase()
					.includes(q)
			);
		}
		if (sortCol) {
			const col = columns.find((c) => c.id === sortCol);
			if (col) {
				out = [...out].sort((a, b) => {
					const av = col.sort(a);
					const bv = col.sort(b);
					return (av < bv ? -1 : av > bv ? 1 : 0) * sortDir;
				});
			}
		}
		return out;
	});

	const allSelected = $derived(rows.length > 0 && rows.every((el) => selected.has(el.uid)));

	function toggleSort(id: string) {
		if (sortCol === id) sortDir = sortDir === 1 ? -1 : 1;
		else {
			sortCol = id;
			sortDir = 1;
		}
	}

	function toggleAll(on: boolean) {
		if (on) for (const el of rows) selected.add(el.uid);
		else selected.clear();
	}

	function toggleOne(uid: string, on: boolean) {
		if (on) selected.add(uid);
		else selected.delete(uid);
	}

	async function addElement() {
		const id = nextElementId(dataset, idPrefixFor(meta.key));
		const el = createElement(meta.types[0] ?? 'plain', { id, name: '' });
		elements.push(el);
		await touchDataset(dataset);
		editingUid = el.uid;
	}

	async function removeElement(el: CodeplugElement) {
		const i = elements.indexOf(el);
		if (i >= 0) elements.splice(i, 1);
		selected.delete(el.uid);
		await touchDataset(dataset);
	}
</script>

<div class="d-flex align-items-center justify-content-between mb-3 gap-2">
	<h5 class="mb-0">
		<i class={`bi bi-${meta.icon}`} aria-hidden="true"></i>
		{meta.label}
		<span class="text-secondary fs-6">({elements.length})</span>
	</h5>
	<div class="d-flex align-items-center gap-2">
		<input
			class="form-control form-control-sm"
			style="width:14rem"
			placeholder="Filter…"
			bind:value={filter}
		/>
		<button type="button" class="btn btn-sm btn-primary" onclick={addElement}>
			<i class="bi bi-plus-lg" aria-hidden="true"></i> Add
		</button>
	</div>
</div>

{#if selected.size > 0}
	<BulkActionsBar {dataset} {meta} {selected} ondone={() => selected.clear()} />
{/if}

{#if elements.length === 0}
	<p class="text-secondary">No {meta.label.toLowerCase()} yet. Use <em>Add</em> to create one.</p>
{:else}
	<div class="table-responsive">
		<table class="table table-sm table-hover align-middle">
			<thead>
				<tr>
					<th scope="col" style="width:2rem">
						<input
							type="checkbox"
							class="form-check-input"
							aria-label="Select all"
							checked={allSelected}
							onchange={(e) => toggleAll(e.currentTarget.checked)}
						/>
					</th>
					{#each columns as col (col.id)}
						<th scope="col">
							<button type="button" class="th-sort" onclick={() => toggleSort(col.id)}>
								{col.label}
								{#if sortCol === col.id}
									<i
										class={`bi bi-caret-${sortDir === 1 ? 'up' : 'down'}-fill`}
										aria-hidden="true"
									></i>
								{/if}
							</button>
						</th>
					{/each}
					<th scope="col" class="text-end">actions</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as el (el.uid)}
					<tr class:table-active={selected.has(el.uid)}>
						<td>
							<input
								type="checkbox"
								class="form-check-input"
								aria-label={`Select ${elementName(el)}`}
								checked={selected.has(el.uid)}
								onchange={(e) => toggleOne(el.uid, e.currentTarget.checked)}
							/>
						</td>
						{#each columns as col (col.id)}
							<td>
								{#if col.badge}
									<span class="badge text-bg-secondary">{col.render(el)}</span>
								{:else}
									{col.render(el)}
								{/if}
							</td>
						{/each}
						<td class="text-end text-nowrap">
							<button
								type="button"
								class="btn btn-sm btn-outline-secondary"
								aria-label={`Edit ${elementName(el)}`}
								onclick={() => (editingUid = el.uid)}
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
		<ElementEditor {dataset} {meta} element={editing} onclose={() => (editingUid = null)} />
	{/key}
{/if}
