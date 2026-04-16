<script lang="ts">
	import HyperbolicCanvas from '$lib/components/HyperbolicCanvas.svelte';
	// import TriangleSelector from '$lib/components/TriangleSelector.svelte';
	import AnimationControls from '$lib/components/AnimationControls.svelte';
	import ContinuedFractionPanel from '$lib/components/ContinuedFractionPanel.svelte';
	import ComparisonPanel from '$lib/components/ComparisonPanel.svelte';
	import { DataState } from '$lib/context/keys.svelte';
	import { type FareyPoint } from '$lib/math/farey';
	import { FareyPointToCFData } from '$lib/math/markov';

	const allowedDepth = [2, 3, 4, 5];
	let depth = $state(5);
	// let { triangles, points } = $derived(generateFareyTriangles(depth));

	const compareNum = 2;
	let isCompareMode = $state(false);
	let compareIds = $state<Array<string | null>>(new Array(compareNum).fill(null));
	let comparePts = $state<Array<FareyPoint | null>>(new Array(compareNum).fill(null));

	let selectedTriangle = $state<string | null>(null);
	let dataState = $derived(new DataState(depth));

	// Compute values for the panel locally
	const selectedPoint = $derived(dataState.selectedPoint);
	const selectedData = $derived(selectedPoint ? FareyPointToCFData(selectedPoint) : null);

	function handleTriangleSelect(id: string) {
		selectedTriangle = id;
		// Trigger animation
	}

	function handlePlay() {
		// Handle play
	}

	function handlePause() {
		// Handle pause
	}

	function handleReset() {
		// Handle reset
	}

	function handleVertexSelect(id: string | null) {
		if (isCompareMode) {
			if (!compareIds[0]) {
				compareIds[0] = id;
				comparePts[0] = dataState.getPoint(id);
			} else if (!compareIds[1]) {
				compareIds[1] = id;
				comparePts[1] = dataState.getPoint(id);
			}
		} else {
			dataState.select(id);
		}
	}
</script>

<main>
	<h1>Farey Tessellation Visualizer</h1>
	<div class="app-layout">
		<div class="controls">
			<label for="selDepth">Tessellation depth:</label>
			<select
				bind:value={depth}
				id="selDepth"
				onchange={(e) => {
					depth = Number((e.target as HTMLSelectElement).value);
				}}
			>
				{#each allowedDepth as d (d)}
					<option value={d}>{d}</option>
				{/each}
			</select>
			<!-- <TriangleSelector onSelectTriangle={handleTriangleSelect} /> -->
			<button
				class:active={isCompareMode}
				onclick={() => {
					isCompareMode = !isCompareMode;
					compareIds = new Array(compareNum).fill(null);
					comparePts = new Array(compareNum).fill(null);
				}}
			>
				{isCompareMode ? 'Exit Comparison' : 'Compare Bands'}
			</button>
			{#if isCompareMode}
				<button
					onclick={() => {
						compareIds = new Array(compareNum).fill(null);
						comparePts = new Array(compareNum).fill(null);
					}}
				>
					Reset Selection
				</button>
			{/if}
			<AnimationControls onPlay={handlePlay} onPause={handlePause} onReset={handleReset} />
		</div>
		<div class="main-content">
			<aside class="sidebar" class:compare-sidebar={isCompareMode}>
				{#if isCompareMode}
					<ComparisonPanel ptsData={comparePts.map((p) => p && FareyPointToCFData(p))} />
				{:else}
					<ContinuedFractionPanel pointData={selectedData} isActive={!!selectedPoint} />
				{/if}
			</aside>
			<div class="canvas-container">
				<HyperbolicCanvas
					triangles={dataState.triangles}
					{selectedTriangle}
					selectedVertex={isCompareMode ? null : dataState.selected}
					onSelectTriangle={handleTriangleSelect}
					onSelectVertex={handleVertexSelect}
				/>
			</div>
		</div>
	</div>
</main>

<style>
	.app-layout {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.main-content {
		font-family: Arial, Helvetica, sans-serif;
		display: grid;
		gap: 1rem;
		grid-template-columns: 1fr minmax(500px, 1fr);
		grid-template-rows: auto;
		align-items: start;
	}
	.sidebar {
		/* flex: 0 0 300px; */
		padding: 1rem;
		background-color: #f9f9f9;
		border-radius: 8px;
		border: 1px solid #ddd;
		height: 100%;
		overflow: auto;
	}
	.canvas-container {
		/* flex: 1; */
		justify-self: stretch;
		text-align: right;
	}
	.controls {
		display: flex;
		gap: 1rem;
		align-items: center;
		padding: 1rem;
		background-color: #f5f5f5;
		border-radius: 8px;
	}
</style>
