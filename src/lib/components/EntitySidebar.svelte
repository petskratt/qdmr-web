<script lang="ts">
	import { COLLECTIONS, type Dataset } from '$lib/model/types';
	import { setActiveCollection, workspace } from '$lib/state/workspace.svelte';

	let { dataset }: { dataset: Dataset } = $props();
</script>

<nav class="entity-sidebar" aria-label="Codeplug sections">
	{#each COLLECTIONS as meta (meta.key)}
		<button
			type="button"
			class="entity-link"
			class:active={meta.key === workspace.activeCollection}
			onclick={() => setActiveCollection(meta.key)}
		>
			<span>
				<i class={`bi bi-${meta.icon}`} aria-hidden="true"></i>
				{meta.label}
			</span>
			<span class="entity-count">{dataset.collections[meta.key].length}</span>
		</button>
	{/each}
</nav>
