<script lang="ts">
	import HyperbolicCanvas from '$lib/components/HyperbolicCanvas.svelte';
	// import TriangleSelector from '$lib/components/TriangleSelector.svelte';
	import AnimationControls from '$lib/components/AnimationControls.svelte';
	import ContinuedFractionPanel from '$lib/components/ContinuedFractionPanel.svelte';
	import ComparisonPanel from '$lib/components/ComparisonPanel.svelte';
	import { DataState } from '$lib/context/keys.svelte';
	import { type FareyPoint, printFrac } from '$lib/math/farey';
	import { FareyPointToCFData } from '$lib/math/markov';
	import { projectFareyPtToDisk, getAnimationParameter } from '$lib/math/hyperbolic';
	import { gsap } from 'gsap';

	const allowedDepth = [2, 3, 4, 5];
	let depth = $state(3);
	// let { triangles, points } = $derived(generateFareyTriangles(depth));

	const compareNum = 2;
	let isCompareMode = $state(false);
	let compareIds = $state<Array<string | null>>(new Array(compareNum).fill(null));
	let comparePts = $state<Array<FareyPoint | null>>(new Array(compareNum).fill(null));

	let selectedTriangle = $state<string | null>(null);
	let animationProgress = $state(0);
	let animationTimeline = $state<gsap.core.Timeline | null>(null);
	let svgcanvas = $state<SVGSVGElement | null>(null);

	const currentTransform = $derived.by(() => {
		if (selectedTriangle) {
			const tri = dataState.triangles.find(
				(t) => `${printFrac(t.v1.f)}-${printFrac(t.v2.f)}-${printFrac(t.v3.f)}` === selectedTriangle
			);
			if (tri) {
				const z1 = projectFareyPtToDisk(tri.v1);
				const z2 = projectFareyPtToDisk(tri.v2);
				const z3 = projectFareyPtToDisk(tri.v3);
				return getAnimationParameter(z1, z2, z3);
			}
			return null;
		} else {
			return null;
		}
	});

	const dataState = $derived(new DataState(depth));

	// Compute values for the panel locally

	function resetComparisonData() {
		compareIds = new Array(compareNum).fill(null);
		comparePts = new Array(compareNum).fill(null);
	}
	const selectedPoint = $derived(dataState.selectedPoint);
	const selectedData = $derived(selectedPoint ? FareyPointToCFData(selectedPoint) : null);

	function handleTriangleSelect(id: string) {
		selectedTriangle = id;
		// Animation will be triggered by play
	}

	function handlePlay() {
		if (currentTransform && !animationTimeline) {
			const target = { progress: 0 };
			animationTimeline = gsap.timeline().pause();
			animationTimeline.to(
				target,
				{
					progress: 1,
					duration: 1,
					ease: 'power2.inOut',
					onUpdate: () => {
						animationProgress = target.progress;
					}
				},
				0
			);
		}
		animationTimeline?.play();
	}

	function handlePause() {
		animationTimeline?.pause();
	}

	function handleReset() {
		animationTimeline?.kill();
		animationTimeline = null;
		animationProgress = 0;
		selectedTriangle = null;
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

	function blobToDL(blob: Blob, filename: string) {
		const downloadUrl = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = downloadUrl;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(downloadUrl);
	}

	async function handleExportPic(inPNG: boolean) {
		if (!svgcanvas) return;

		// Get the rendered size of the SVG
		const clientWidth = svgcanvas.clientWidth;
		const clientHeight = svgcanvas.clientHeight;

		// Add small padding around the circle
		const padding = 0.1; // small padding in viewBox units
		const viewBoxSize = 2 + 2 * padding; // 2 for diameter + padding on both sides

		// Create a new SVG element with viewBox focused on the circle with padding
		const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		newSvg.setAttribute('viewBox', `${-1 - padding} ${-1 - padding} ${viewBoxSize} ${viewBoxSize}`);
		newSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
		newSvg.setAttribute('width', clientWidth.toString());
		newSvg.setAttribute('height', clientHeight.toString());

		// Copy all child elements from the original SVG, excluding text elements
		for (const child of svgcanvas.children) {
			const clonedChild = child.cloneNode(true) as Element;
			// Remove all text elements from the cloned child
			const textElements = clonedChild.querySelectorAll('text');
			textElements.forEach((textEl) => textEl.remove());
			newSvg.appendChild(clonedChild);
		}

		// Serialize the new SVG
		const svgData = new XMLSerializer().serializeToString(newSvg);
		const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });

		if (!inPNG) {
			// Export as SVG
			blobToDL(svgBlob, 'hyperbolic-disk.svg');
		} else {
			// Export as PNG - continue with canvas conversion
			const url = URL.createObjectURL(svgBlob);

			// Calculate canvas size - scale the padded viewBox to match the original proportions
			const originalViewBoxWidth = 2.8;
			const canvasSize = Math.round(clientWidth * (viewBoxSize / originalViewBoxWidth));

			const canvas = document.createElement('canvas');
			canvas.width = canvasSize;
			canvas.height = canvasSize;

			const ctx = canvas.getContext('2d')!;

			const img = new Image();
			img.onload = () => {
				// Draw the entire image to fill the canvas
				ctx.drawImage(img, 0, 0, canvasSize, canvasSize);
				// Convert to PNG and download
				canvas.toBlob((blob) => (blob ? blobToDL(blob, 'hyperbolic-disk.png') : null), 'image/png');
				URL.revokeObjectURL(url);
			};
			img.src = url;
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
					resetComparisonData();
				}}
			>
				{isCompareMode ? 'Exit Comparison' : 'Compare Bands'}
			</button>
			{#if isCompareMode}
				<button
					onclick={() => {
						resetComparisonData();
					}}
				>
					Reset Selection
				</button>
			{/if}
			<AnimationControls
				onPlay={handlePlay}
				onPause={handlePause}
				onReset={handleReset}
				onExport={handleExportPic}
			/>
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
					{currentTransform}
					currentT={animationProgress}
					onSelectTriangle={handleTriangleSelect}
					onSelectVertex={handleVertexSelect}
					bind:svg={svgcanvas}
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
