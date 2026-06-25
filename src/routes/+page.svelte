<script lang="ts">
	import { onMount } from 'svelte';
	import {
		activeDataset,
		addDataset,
		initWorkspace,
		workspace
	} from '$lib/state/workspace.svelte';
	import { createDataset } from '$lib/model/dataset';
	import { datasetToQdmrYaml, parseQdmrYaml } from '$lib/io/yaml/qdmr';
	import { baseName, downloadText } from '$lib/io/files';
	import DatasetTabs from '$lib/components/DatasetTabs.svelte';
	import EntitySidebar from '$lib/components/EntitySidebar.svelte';
	import EntityTable from '$lib/components/EntityTable.svelte';

	let fileInput = $state<HTMLInputElement | null>(null);
	let importError = $state<string | null>(null);
	let exportOpen = $state(false);

	const active = $derived(activeDataset());

	onMount(() => {
		void initWorkspace();
	});

	async function newCodeplug() {
		await addDataset(createDataset('Untitled codeplug'));
	}

	async function onImport(event: Event) {
		const input = event.target as HTMLInputElement;
		const files = input.files;
		if (!files) return;
		importError = null;
		for (const file of Array.from(files)) {
			try {
				const text = await file.text();
				await addDataset(parseQdmrYaml(text, baseName(file.name)));
			} catch (err) {
				importError = `${file.name}: ${(err as Error).message}`;
			}
		}
		input.value = '';
	}

	function exportYaml(clean: boolean) {
		exportOpen = false;
		const ds = active;
		if (!ds) return;
		const yaml = datasetToQdmrYaml(ds, { dmrconfClean: clean });
		downloadText(`${ds.name}${clean ? '.dmrconf' : ''}.yaml`, yaml);
	}
</script>

<div class="app-shell">
	<header class="d-flex align-items-center gap-2 px-3 py-2 border-bottom">
		<strong class="me-2"><i class="bi bi-broadcast" aria-hidden="true"></i> qdmr-web</strong>

		<button type="button" class="btn btn-sm btn-outline-primary" onclick={newCodeplug}>
			<i class="bi bi-file-earmark-plus" aria-hidden="true"></i> New
		</button>

		<button type="button" class="btn btn-sm btn-outline-primary" onclick={() => fileInput?.click()}>
			<i class="bi bi-upload" aria-hidden="true"></i> Import YAML
		</button>
		<input
			bind:this={fileInput}
			type="file"
			accept=".yaml,.yml,text/yaml"
			multiple
			class="d-none"
			onchange={onImport}
		/>

		<div class="position-relative">
			<button
				type="button"
				class="btn btn-sm btn-outline-primary"
				disabled={!active}
				aria-expanded={exportOpen}
				onclick={() => (exportOpen = !exportOpen)}
			>
				<i class="bi bi-download" aria-hidden="true"></i> Export
			</button>
			{#if exportOpen}
				<div class="dropdown-menu show mt-1" style="position:absolute">
					<button type="button" class="dropdown-item" onclick={() => exportYaml(true)}>
						qDMR YAML (dmrconf-clean)
					</button>
					<button type="button" class="dropdown-item" onclick={() => exportYaml(false)}>
						qDMR YAML (with wdmr tags)
					</button>
				</div>
			{/if}
		</div>

		{#if importError}
			<span class="text-danger small ms-2">{importError}</span>
		{/if}
	</header>

	<DatasetTabs />

	{#if !workspace.ready}
		<div class="empty-state"><span class="spinner-border" aria-hidden="true"></span></div>
	{:else if active}
		<div class="workspace">
			<EntitySidebar dataset={active} />
			<section class="entity-content">
				<EntityTable dataset={active} />
			</section>
		</div>
	{:else}
		<div class="empty-state">
			<i class="bi bi-broadcast-pin fs-1" aria-hidden="true"></i>
			<div>
				<p class="mb-1">No codeplug open.</p>
				<button type="button" class="btn btn-primary btn-sm me-2" onclick={newCodeplug}>
					New codeplug
				</button>
				<button type="button" class="btn btn-outline-primary btn-sm" onclick={() => fileInput?.click()}>
					Import qDMR YAML
				</button>
			</div>
		</div>
	{/if}
</div>
