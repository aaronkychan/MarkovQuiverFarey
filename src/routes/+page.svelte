<script lang="ts">
	import HyperbolicCanvas from '$lib/components/HyperbolicCanvas.svelte';
	import TriangleSelector from '$lib/components/TriangleSelector.svelte';
	import AnimationControls from '$lib/components/AnimationControls.svelte';
	import ContinuedFractionPanel from '$lib/components/ContinuedFractionPanel.svelte';
	import { VertexState } from '$lib/context/keys.svelte';
	import { generateFareyTriangles, printNegativeCFrac, printPositiveCFrac } from '$lib/math/farey';

	const DEPTH = 5;
	const { triangles, points } = generateFareyTriangles(DEPTH);

	let selectedTriangle = $state<string | null>(null);
	const vertexState = new VertexState();
	vertexState.points = points;

	// Compute values for the panel locally
	const selectedPoint = $derived(vertexState.selectedPoint);
	const positiveCF = $derived(selectedPoint ? printPositiveCFrac(selectedPoint.cf) : '');
	const negativeCF = $derived(selectedPoint ? printNegativeCFrac(selectedPoint.negcf) : '');
	const band = $derived(selectedPoint ? selectedPoint.band.toString() : '');

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
</script>

<main>
	<h1>Farey Tessellation Visualizer</h1>
	<div class="app-layout">
		<div class="controls">
			<TriangleSelector onSelectTriangle={handleTriangleSelect} />
			<AnimationControls onPlay={handlePlay} onPause={handlePause} onReset={handleReset} />
		</div>
		<div class="main-content">
			<aside class="sidebar">
				<ContinuedFractionPanel
					selected={vertexState.selected}
					{positiveCF}
					{negativeCF}
					{band}
					isActive={!!selectedPoint}
				/>
			</aside>
			<div class="canvas-container">
				<HyperbolicCanvas
					{triangles}
					{selectedTriangle}
					selectedVertex={vertexState.selected}
					onSelectTriangle={handleTriangleSelect}
					onSelectVertex={(id) => vertexState.select(id)}
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
		grid-template-columns: minmax(0, max-content) minmax(400px, 1fr);
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
	}
	.canvas-container {
		/* border: 1px solid red; */
		flex: 1;
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
