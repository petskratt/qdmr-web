<script lang="ts">
	import type { Dataset, YamlValue } from '$lib/model/types';
	import { elementId, elementName } from '$lib/model/dataset';
	import type { FieldDef } from '$lib/schema/fields';
	import { deletePath, getPath, isDefault, isSelected, setPath } from '$lib/schema/values';
	import { TaggedValue } from '$lib/model/types';

	interface Props {
		fields: Record<string, YamlValue>;
		def: FieldDef;
		dataset: Dataset;
	}
	let { fields, def, dataset }: Props = $props();

	const NONE = '';
	const DEFAULT = '$default';
	const SELECTED = '$selected';

	const options = $derived(
		(def.refCollection ? dataset.collections[def.refCollection] : [])
			.filter((e) => !def.refType || e.type === def.refType)
			.map((e) => ({ id: elementId(e) ?? '', label: elementName(e) }))
			.filter((o) => o.id !== '')
	);

	const current = $derived.by(() => {
		const v = getPath(fields, def.path);
		if (isDefault(v)) return DEFAULT;
		if (isSelected(v)) return SELECTED;
		return typeof v === 'string' ? v : NONE;
	});

	function onChange(sel: string) {
		if (sel === NONE) deletePath(fields, def.path);
		else if (sel === DEFAULT) setPath(fields, def.path, new TaggedValue('default'));
		else if (sel === SELECTED) setPath(fields, def.path, new TaggedValue('selected'));
		else setPath(fields, def.path, sel);
	}
</script>

<select
	class="form-select form-select-sm"
	value={current}
	onchange={(e) => onChange(e.currentTarget.value)}
>
	<option value={NONE}>[None]</option>
	{#if def.defaultable}<option value={DEFAULT}>[Default]</option>{/if}
	{#if def.selectable}<option value={SELECTED}>[Selected]</option>{/if}
	{#each options as o (o.id)}
		<option value={o.id}>{o.label}</option>
	{/each}
</select>
