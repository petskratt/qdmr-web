<script lang="ts">
	import type { Dataset, YamlValue } from '$lib/model/types';
	import { TaggedValue } from '$lib/model/types';
	import type { FieldDef } from '$lib/schema/fields';
	import { deletePath, getPath, isDefault, setPath } from '$lib/schema/values';
	import RefSelect from './RefSelect.svelte';
	import RefListSelect from './RefListSelect.svelte';
	import ToneInput from './ToneInput.svelte';

	interface Props {
		fields: Record<string, YamlValue>;
		def: FieldDef;
		dataset: Dataset;
	}
	let { fields, def, dataset }: Props = $props();

	const value = $derived(getPath(fields, def.path));
	const usingDefault = $derived(def.defaultable === true && isDefault(value));

	function write(v: YamlValue | undefined) {
		if (v === undefined) deletePath(fields, def.path);
		else setPath(fields, def.path, v);
	}

	function concreteDefault(): YamlValue {
		if (def.widget === 'enum') return def.options?.[0] ?? '';
		if (def.widget === 'number') return def.min ?? 0;
		return '';
	}

	function toggleDefault(on: boolean) {
		write(on ? new TaggedValue('default') : concreteDefault());
	}

	function asText(): string {
		return value === null || value === undefined || value instanceof TaggedValue
			? ''
			: String(value);
	}

	function asList(): string {
		return Array.isArray(value) ? value.map((v) => String(v)).join(', ') : '';
	}

	function writeList(raw: string) {
		const items = raw
			.split(',')
			.map((s) => s.trim())
			.filter((s) => s.length > 0);
		write(items.length ? items : undefined);
	}

	function writeNumber(raw: string | number | null) {
		if (raw === null || raw === '') return write(undefined);
		const n = Number(raw);
		if (Number.isFinite(n)) write(n);
	}
</script>

<div class="field-input">
	{#if def.widget === 'ref'}
		<RefSelect {fields} {def} {dataset} />
	{:else if def.widget === 'refList'}
		<RefListSelect {fields} {def} {dataset} />
	{:else if def.widget === 'tone'}
		<ToneInput {fields} {def} />
	{:else if def.widget === 'boolean'}
		<div class="form-check">
			<input
				type="checkbox"
				class="form-check-input"
				bind:checked={() => value === true, (v) => write(v)}
			/>
		</div>
	{:else if usingDefault}
		<span class="text-secondary fst-italic">radio default</span>
	{:else if def.widget === 'enum'}
		<select
			class="form-select form-select-sm"
			bind:value={() => asText(), (v) => write(v)}
		>
			{#each def.options ?? [] as opt (opt)}<option value={opt}>{opt}</option>{/each}
		</select>
	{:else if def.widget === 'number'}
		<input
			class="form-control form-control-sm"
			type="number"
			min={def.min}
			max={def.max}
			bind:value={() => asText(), (v) => writeNumber(v)}
		/>
	{:else if def.widget === 'list'}
		<input
			class="form-control form-control-sm"
			placeholder="comma, separated"
			bind:value={() => asList(), (v) => writeList(v)}
		/>
	{:else if def.widget === 'frequency'}
		<input
			class="form-control form-control-sm font-monospace"
			bind:value={() => asText(), (v) => write(v === '' ? undefined : v)}
		/>
	{:else}
		<input
			class="form-control form-control-sm"
			bind:value={() => asText(), (v) => write(v === '' ? undefined : v)}
		/>
	{/if}

	{#if def.defaultable && def.widget !== 'ref'}
		<label class="default-check">
			<input
				type="checkbox"
				class="form-check-input"
				checked={usingDefault}
				onchange={(e) => toggleDefault(e.currentTarget.checked)}
			/> Default
		</label>
	{/if}
</div>
