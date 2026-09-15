<script lang="ts">
	type Props = {
		id: string;
		label: string;
		value: number;
		min: number;
		max: number;
		step?: number | string;
		unit?: string;
		readout?: string;
		inputmode?: 'numeric' | 'decimal';
		disabled?: boolean;
		oninput: (value: number) => void;
		onchange?: (value: number) => void;
	};

	let {
		id,
		label,
		value,
		min,
		max,
		step = 1,
		unit,
		readout,
		inputmode = 'numeric',
		disabled = false,
		oninput,
		onchange
	}: Props = $props();

	function handleInput(event: Event): void {
		const nextValue = Number((event.currentTarget as HTMLInputElement).value);
		if (Number.isFinite(nextValue)) oninput(nextValue);
	}

	function resyncValue(event: Event): void {
		(event.currentTarget as HTMLInputElement).value = String(value);
	}

	function handleChange(event: Event): void {
		resyncValue(event);
		const nextValue = Number((event.currentTarget as HTMLInputElement).value);
		onchange?.(Number.isFinite(nextValue) ? nextValue : value);
	}
</script>

<div>
	<div class="mb-1 flex items-center justify-between gap-3">
		<label id={`${id}-label`} for={id}>{label}</label>
		<div class="flex items-center gap-2">
			<input
				type="number"
				{id}
				class="input input-sm w-24 text-right"
				{inputmode}
				{min}
				{max}
				{step}
				{value}
				{disabled}
				oninput={handleInput}
				onchange={handleChange}
				onblur={resyncValue}
			/>
			{#if unit || readout}
				<output for={id}>
					{#if unit}{unit}{/if}
					{#if readout}<span class="ml-1">{readout}</span>{/if}
				</output>
			{/if}
		</div>
	</div>
	<input
		type="range"
		id={`${id}-range`}
		class="range w-full"
		aria-labelledby={`${id}-label`}
		{min}
		{max}
		{step}
		{value}
		{disabled}
		oninput={handleInput}
		onchange={handleChange}
	/>
</div>
