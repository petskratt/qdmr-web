<script lang="ts">
	import { closeDataset, setActive, workspace } from '$lib/state/workspace.svelte';
	import { elementCount } from '$lib/model/dataset';
</script>

<div class="dataset-tabbar" role="tablist" aria-label="Open codeplugs">
	{#each workspace.open as ds (ds.id)}
		<div class="dataset-tab" class:active={ds.id === workspace.activeId}>
			<button
				type="button"
				class="dataset-tab-label"
				role="tab"
				aria-selected={ds.id === workspace.activeId}
				onclick={() => setActive(ds.id)}
			>
				<i class="bi bi-hdd-stack" aria-hidden="true"></i>
				<span>{ds.name}</span>
				<span class="entity-count">{elementCount(ds)}</span>
			</button>
			<button
				type="button"
				class="dataset-tab-close"
				aria-label={`Close ${ds.name}`}
				onclick={() => closeDataset(ds.id)}
			>
				<i class="bi bi-x" aria-hidden="true"></i>
			</button>
		</div>
	{/each}
</div>
