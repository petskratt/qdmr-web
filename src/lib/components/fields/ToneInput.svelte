<script lang="ts">
	import type { YamlValue } from '$lib/model/types';
	import type { FieldDef } from '$lib/schema/fields';
	import {
		CTCSS_FREQUENCIES,
		deletePath,
		getPath,
		parseTone,
		setPath,
		toneToValue,
		type ToneType
	} from '$lib/schema/values';

	interface Props {
		fields: Record<string, YamlValue>;
		def: FieldDef;
	}
	let { fields, def }: Props = $props();

	const tone = $derived(parseTone(getPath(fields, def.path)));

	function write(type: ToneType, value: number | null) {
		const v = toneToValue({ type, value });
		if (v === undefined) deletePath(fields, def.path);
		else setPath(fields, def.path, v);
	}

	function onType(type: ToneType) {
		if (type === 'none') write('none', null);
		else if (type === 'ctcss') write('ctcss', tone.value ?? CTCSS_FREQUENCIES[0]);
		else write('dcs', tone.value ?? 23);
	}

	function onValue(raw: string) {
		const n = Number(raw);
		if (!Number.isFinite(n)) return;
		write(tone.type, n);
	}

	function onInverted(inverted: boolean) {
		const mag = Math.abs(tone.value ?? 23);
		write('dcs', inverted ? -mag : mag);
	}
</script>

<div class="tone-input">
	<select
		class="form-select form-select-sm"
		value={tone.type}
		onchange={(e) => onType(e.currentTarget.value as ToneType)}
	>
		<option value="none">None</option>
		<option value="ctcss">CTCSS</option>
		<option value="dcs">DCS</option>
	</select>

	{#if tone.type === 'ctcss'}
		<input
			class="form-control form-control-sm"
			type="number"
			step="0.1"
			list="ctcss-freqs"
			value={tone.value ?? ''}
			onchange={(e) => onValue(e.currentTarget.value)}
		/>
		<span class="input-suffix">Hz</span>
		<datalist id="ctcss-freqs">
			{#each CTCSS_FREQUENCIES as f (f)}<option value={f}></option>{/each}
		</datalist>
	{:else if tone.type === 'dcs'}
		<input
			class="form-control form-control-sm"
			type="number"
			step="1"
			value={Math.abs(tone.value ?? 0)}
			onchange={(e) => onValue(String(Math.abs(Number(e.currentTarget.value)) * ((tone.value ?? 0) < 0 ? -1 : 1)))}
		/>
		<label class="input-suffix">
			<input
				type="checkbox"
				class="form-check-input"
				checked={(tone.value ?? 0) < 0}
				onchange={(e) => onInverted(e.currentTarget.checked)}
			/> inv
		</label>
	{/if}
</div>
