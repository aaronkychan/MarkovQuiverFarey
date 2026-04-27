<script lang="ts">
	import StringViewer from './StringViewer.svelte';
	import { FareyPointToCFData, findCrossings } from '$lib/math/markov';
	import { selectColor, type DataState } from '$lib/context/keys.svelte';
	import { EndType } from '$lib/math/types';

	let {
		dataState
	}: {
		dataState: DataState;
	} = $props();

	const ptsData = $derived(
		[0, 1].map((i) => {
			const id = dataState.selected[i];
			const pt = id ? dataState.getPoint(id as string) : null;
			return pt ? FareyPointToCFData(pt) : null;
		})
	);

	const selectableInfStrings = ['band', 'ffPlus', 'ffMinus'];

	let selectedInfString = $state<string[]>(['band', 'band']);
	let endTypes = $derived<(EndType | null)[]>(
		[0, 1].map((i) =>
			ptsData[i]
				? ptsData[i].stringCollec.find((s) => s.name === selectedInfString[i])!.str.type
				: null
		)
	);

	const canFindCrossings = $derived(
		ptsData[0] !== null &&
			ptsData[1] !== null &&
			endTypes[0] === EndType.confined &&
			endTypes[1] === EndType.confined
	);

	function handleFindCrossings() {
		console.log('Finding crossings between selected confined strings...');
		const [st1, st2] = [0, 1].map(
			(i) => ptsData[i]!.stringCollec.find((s) => s.name === selectedInfString[i])!.str
		);
		const crossings = findCrossings(st1, st2);
		console.log('crossings: ', crossings);
	}
</script>

<div class="comparison-view">
	{#each { length: 2 }, i}
		{@const pd = ptsData[i]}
		<div class="point-section">
			<div class="section-header">
				<span style="font-weight:bold; margin: 0;" style:color={selectColor[i]}>
					Selected fraction
				</span>: {pd ? pd.frac : 'Click a vertex'}
				{#if pd}
					<button class="reselect-btn" onclick={() => dataState.reselect(i)}> Re-select </button>
				{/if}
			</div>

			{#if pd}
				<div class="unified-row">
					<div class="cf-block">
						<span><span class="label">Pos CF:</span> {pd?.pos}</span>
						<span><span class="label">Neg CF:</span> {pd?.neg}</span>
					</div>
					<div class="select-block">
						<span class="label">String:</span>
						<select bind:value={selectedInfString[i]}>
							{#each selectableInfStrings as s (s)}
								<option value={s}>{s}</option>
							{/each}
						</select>
					</div>
				</div>
				<StringViewer str={pd.stringCollec.find((s) => s.name === selectedInfString[i])!.str} />
			{/if}
		</div>

		{#if i === 0}
			<div class="comparison-divider">
				{#if canFindCrossings}
					<button class="action-btn" onclick={handleFindCrossings}>Find Crossings</button>
				{:else}
					<span>vs</span>
				{/if}
			</div>
		{/if}
	{/each}
</div>

<style>
	.comparison-view {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.section-header {
		margin-bottom: 0.5rem;
	}
	.reselect-btn {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		background-color: #f3f4f6;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		cursor: pointer;
	}
	.reselect-btn:hover {
		background-color: #e5e7eb;
	}

	.unified-row {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		margin: 1rem 0;
		flex-wrap: wrap;
		font-size: 0.9rem;
		background: #fff;
		padding: 0.75rem;
		border-radius: 6px;
		border: 1px solid #eee;
	}
	.cf-block {
		display: flex;
		gap: 1rem;
		color: #333;
	}
	.label {
		font-weight: 600;
		color: #666;
	}
	.select-block {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	select {
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		border: 1px solid #d1d5db;
		background-color: white;
	}

	.comparison-divider {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		color: #6b7280;
		font-size: 0.95rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.comparison-divider::before,
	.comparison-divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: #6b7280;
		min-width: 3rem;
	}
	.comparison-divider span {
		white-space: nowrap;
	}
	.action-btn {
		padding: 0.35rem 0.75rem;
		background-color: #3b82f6;
		color: white;
		border: none;
		border-radius: 9999px;
		font-weight: 600;
		cursor: pointer;
		min-width: 10rem;
	}
	.action-btn:hover {
		background-color: #2563eb;
	}
</style>
