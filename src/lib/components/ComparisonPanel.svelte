<script lang="ts">
	import StringViewer from './StringViewer.svelte';
	import CrossingDiagram from './CrossingDiagram.svelte';
	import { FareyPointToCFData, findCrossings } from '$lib/math/markov';
	import { geomIntersectionNumber, parseFrac } from '$lib/math/farey';
	import { selectColor, type DataState } from '$lib/context/keys.svelte';
	import { EndType, type Crossing } from '$lib/math/types';

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
	// let turnings = $derived(
	// 	ptsData[0] ? ptsData[0].stringCollec.find((s) => s.name == 'ffPlus') : null
	// );
	// $effect(() => {
	// 	if (turnings) {
	// 		console.log('Turnings: ', findTurnings(turnings.str));
	// 	}
	// });

	const canFindCrossings = $derived(
		ptsData[0] !== null &&
			ptsData[1] !== null &&
			endTypes[0] === EndType.confined &&
			endTypes[1] === EndType.confined
	);
	const geomIntNum = $derived(
		ptsData[0] && ptsData[1]
			? geomIntersectionNumber(parseFrac(ptsData[0].frac), parseFrac(ptsData[1].frac))
			: null
	);
	let hasSearchedForCrossings = $state(false);
	let crossings = $state<Crossing[]>([]);
	let selectedCrossing = $state<Crossing | null>(null);

	// Reset found crossings only when the actual vertex selection changes.
	// We track the IDs specifically so that changing string types (dropdowns) does not clear results.
	$effect(() => {
		void dataState.selected[0];
		void dataState.selected[1];
		void selectedInfString[0];
		void selectedInfString[1];

		crossings = [];
		selectedCrossing = null;
		hasSearchedForCrossings = false; // Reset this too
	});

	// Automatically update selectedCrossing based on the findings.
	// If exactly one crossing is found, it is selected; otherwise, we wait for user input.
	$effect(() => {
		if (crossings.length === 1) {
			selectedCrossing = crossings[0];
		} else if (crossings.length === 0) {
			selectedCrossing = null;
		}
	});

	function handleFindCrossings() {
		const [st1, st2] = [0, 1].map(
			(i) => ptsData[i]!.stringCollec.find((s) => s.name === selectedInfString[i])!.str
		);
		crossings = findCrossings(st1, st2);
		hasSearchedForCrossings = true; // Set to true after attempting to find crossings
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

		{#if i == 0}
			<div class="comparison-divider">
				{#if canFindCrossings}
					{#if !hasSearchedForCrossings}
						<button class="action-btn" onclick={handleFindCrossings}>Find Crossings</button>
					{:else if crossings.length > 0}
						<span>Crossings:</span>
					{:else}
						<span class="no-crossings-message">No crossings found.</span>
					{/if}
				{:else}
					<span>vs</span>
				{/if}
			</div>

			{#if crossings.length > 0}
				{#if crossings.length > 1}
					<div class="crossing-selection">
						<h4>Select a crossing:</h4>
						<div class="crossing-buttons">
							{#each crossings as crossing, index (index)}
								<button class="crossing-btn" onclick={() => (selectedCrossing = crossing)}>
									{index + 1} ({crossing.direction})
								</button>
							{/each}
						</div>
					</div>
				{/if}
				{#if selectedCrossing}
					<CrossingDiagram
						str1={ptsData[0]!.stringCollec.find((s) => s.name === selectedInfString[0])!.str}
						str2={ptsData[1]!.stringCollec.find((s) => s.name === selectedInfString[1])!.str}
						crossing={selectedCrossing}
					/>
				{/if}
				{#if geomIntNum !== null}
					<div class="geom-int-num">
						Geometric intersection number: {geomIntNum}
					</div>
				{/if}
				<div class="comparison-divider">END OF crossing data</div>
			{/if}
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

	.crossing-selection h4 {
		margin: 0 0 0.5rem 0;
		color: #374151;
		font-size: 1rem;
		font-weight: 600;
	}

	.crossing-buttons {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.crossing-btn {
		padding: 0.5rem 1rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background-color 0.2s;
	}

	.crossing-btn:hover {
		background: #2563eb;
	}

	.no-crossings-message {
		color: #ef4444; /* A shade of red */
		font-weight: 600;
	}

	.geom-int-num {
		margin: 1rem 0;
		padding: 0.75rem;
		background: #f0f9ff;
		border: 1px solid #bae6fd;
		border-radius: 6px;
		color: #0c4a6e;
		font-weight: 600;
		text-align: center;
	}
</style>
