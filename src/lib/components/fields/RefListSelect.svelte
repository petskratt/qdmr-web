<script lang="ts">
	import type { Dataset, YamlValue } from '$lib/model/types';
	import { elementId, elementName } from '$lib/model/dataset';
	import type { FieldDef } from '$lib/schema/fields';
	import { getPath, setPath } from '$lib/schema/values';

	interface Props {
		fields: Record<string, YamlValue>;
		def: FieldDef;
		dataset: Dataset;
	}
	let { fields, def, dataset }: Props = $props();

	let filter = $state('');

	const options = $derived(
		(def.refCollection ? dataset.collections[def.refCollection] : [])
			.filter((e) => !def.refType || e.type === def.refType)
			.map((e) => ({ id: elementId(e) ?? '', label: elementName(e) }))
			.filter((o) => o.id !== '')
	);

	const selected = $derived.by(() => {
		const v = getPath(fields, def.path);
		return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
	});

	const visible = $derived(
		filter.trim() === ''
			? options
			: options.filter((o) =>
					`${o.label} ${o.id}`.toLowerCase().includes(filter.trim().toLowerCase())
				)
	);

	function toggle(id: string, on: boolean) {
		const next = on ? [...selected, id] : selected.filter((x) => x !== id);
		setPath(fields, def.path, next);
	}
</script>

<div class="ref-list">
	<input
		class="form-control form-control-sm mb-1"
		placeholder={`Filter ${def.label.toLowerCase()}...`}
		bind:value={filter}
	/>
	<div class="ref-list-box">
		{#each visible as o (o.id)}
			<label class="ref-list-item">
				<input
					type="checkbox"
					class="form-check-input"
					checked={selected.includes(o.id)}
					onchange={(e) => toggle(o.id, e.currentTarget.checked)}
				/>
				<span>{o.label}</span>
			</label>
		{:else}
			<div class="text-secondary small px-1">no matches</div>
		{/each}
	</div>
	<small class="text-secondary">{selected.length} selected</small>
</div>
