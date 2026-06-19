<script lang="ts">
	import HyperbolicCanvas from '$lib/components/HyperbolicCanvas.svelte';
	// import TriangleSelector from '$lib/components/TriangleSelector.svelte';
	import AnimationControls from '$lib/components/AnimationControls.svelte';
	import ContinuedFractionPanel from '$lib/components/ContinuedFractionPanel.svelte';
	import ComparisonPanel from '$lib/components/ComparisonPanel.svelte';
	import CFBandSequencePanel from '$lib/components/CFBandSequencePanel.svelte';
	import { DataState } from '$lib/context/keys.svelte';
	import { fareyDepth, printFrac } from '$lib/math/farey';
	import {
		applyTransformSequence,
		projectFareyPtToDisk,
		getAnimationParameter,
		type TransformParameter
	} from '$lib/math/hyperbolic';
	import type { Fraction } from '$lib/math/types';
	import { gsap } from 'gsap';

	const allowedDepth = [2, 3, 4, 5];
	let depth = $state(3);
	let appMode = $state<'crossingDetection' | 'bandData' | 'bandSequence'>('crossingDetection');
	// let { triangles, points } = $derived(generateFareyTriangles(depth));

	let selectedTriangle = $state<string | null>(null);
	let animationProgress = $state(0);
	let animationTimeline = $state<gsap.core.Timeline | null>(null);
	let committedTransforms = $state<TransformParameter[]>([]);
	let svgcanvas = $state<SVGSVGElement | null>(null);
	let sequenceSvgcanvas = $state<SVGSVGElement | null>(null);
	let sequenceFractions = $state<Fraction[]>([]);
	let sequenceSelectedTriangle = $state<string | null>(null);
	let sequenceAnimationProgress = $state(0);
	let sequenceAnimationTimeline = $state<gsap.core.Timeline | null>(null);
	let sequenceCommittedTransforms = $state<TransformParameter[]>([]);

	const currentTransform = $derived.by(() => {
		if (selectedTriangle) {
			const tri = dataState.triangles.find(
				(t) => `${printFrac(t.v1.f)}-${printFrac(t.v2.f)}-${printFrac(t.v3.f)}` === selectedTriangle
			);
			if (tri) {
				const z1 = applyTransformSequence(projectFareyPtToDisk(tri.v1), committedTransforms);
				const z2 = applyTransformSequence(projectFareyPtToDisk(tri.v2), committedTransforms);
				const z3 = applyTransformSequence(projectFareyPtToDisk(tri.v3), committedTransforms);
				return getAnimationParameter(z1, z2, z3);
			}
			return null;
		} else {
			return null;
		}
	});

	const dataState = $derived(new DataState(depth));
	const sequenceDepth = $derived(
		Math.max(0, ...sequenceFractions.map((fraction) => fareyDepth(fraction.p, fraction.q)))
	);
	const sequenceDataState = $derived(new DataState(sequenceDepth));
	const sequenceHighlightedEdges = $derived(
		sequenceFractions
			.slice(1)
			.map((fraction, index) =>
				[printFrac(sequenceFractions[index]), printFrac(fraction)].sort().join('|')
			)
	);
	const sequenceCurrentTransform = $derived.by(() => {
		if (!sequenceSelectedTriangle) return null;
		const triangle = sequenceDataState.triangles.find(
			(t) =>
				`${printFrac(t.v1.f)}-${printFrac(t.v2.f)}-${printFrac(t.v3.f)}` ===
				sequenceSelectedTriangle
		);
		if (!triangle) return null;
		return getAnimationParameter(
			applyTransformSequence(projectFareyPtToDisk(triangle.v1), sequenceCommittedTransforms),
			applyTransformSequence(projectFareyPtToDisk(triangle.v2), sequenceCommittedTransforms),
			applyTransformSequence(projectFareyPtToDisk(triangle.v3), sequenceCommittedTransforms)
		);
	});

	// Compute values for the panel locally

	function handleTriangleSelect(id: string) {
		selectedTriangle = id;
		// Animation starts only when the user requests centering.
	}

	function handleCenterTriangle() {
		if (currentTransform && !animationTimeline) {
			const transform = currentTransform;
			const target = { progress: 0 };
			animationProgress = 0;
			animationTimeline = gsap.timeline().pause();
			animationTimeline.to(
				target,
				{
					progress: 1,
					duration: 1,
					ease: 'power2.inOut',
					onUpdate: () => {
						animationProgress = target.progress;
					},
					onComplete: () => {
						committedTransforms = [...committedTransforms, transform];
						animationProgress = 0;
						animationTimeline = null;
					}
				},
				0
			);
		}
		animationTimeline?.play();
	}

	function handleReset() {
		animationTimeline?.kill();
		animationTimeline = null;
		animationProgress = 0;
		committedTransforms = [];
		selectedTriangle = null;
	}

	function handleVertexSelect(id: string | null) {
		dataState.selected[dataState.selecting] = id;
		if (appMode === 'crossingDetection') {
			dataState.selecting =
				dataState.selected[0] === null
					? 0
					: dataState.selected[1] === null
						? 1
						: dataState.selecting;
		}
	}

	function handleSequenceChange(fractions: Fraction[]) {
		sequenceAnimationTimeline?.kill();
		sequenceFractions = fractions;
		sequenceSelectedTriangle = null;
		sequenceAnimationProgress = 0;
		sequenceAnimationTimeline = null;
		sequenceCommittedTransforms = [];
	}

	function handleCenterSequenceTriangle() {
		if (sequenceCurrentTransform && !sequenceAnimationTimeline) {
			const transform = sequenceCurrentTransform;
			const target = { progress: 0 };
			sequenceAnimationProgress = 0;
			sequenceAnimationTimeline = gsap.timeline().pause();
			sequenceAnimationTimeline.to(target, {
				progress: 1,
				duration: 1,
				ease: 'power2.inOut',
				onUpdate: () => {
					sequenceAnimationProgress = target.progress;
				},
				onComplete: () => {
					sequenceCommittedTransforms = [...sequenceCommittedTransforms, transform];
					sequenceAnimationProgress = 0;
					sequenceAnimationTimeline = null;
				}
			});
		}
		sequenceAnimationTimeline?.play();
	}

	function handleResetSequence() {
		sequenceAnimationTimeline?.kill();
		sequenceAnimationTimeline = null;
		sequenceAnimationProgress = 0;
		sequenceCommittedTransforms = [];
		sequenceSelectedTriangle = null;
	}

	// function blobToDL(blob: Blob, filename: string) {
	// 	const downloadUrl = URL.createObjectURL(blob);
	// 	const a = document.createElement('a');
	// 	a.href = downloadUrl;
	// 	a.download = filename;
	// 	a.click();
	// 	URL.revokeObjectURL(downloadUrl);
	// }

	// async function handleExportPic(inPNG: boolean) {
	// 	if (!svgcanvas) return;

	// 	// Get the rendered size of the SVG
	// 	const clientWidth = svgcanvas.clientWidth;
	// 	const clientHeight = svgcanvas.clientHeight;

	// 	// Add small padding around the circle
	// 	const padding = 0.1; // small padding in viewBox units
	// 	const viewBoxSize = 2 + 2 * padding; // 2 for diameter + padding on both sides

	// 	// Create a new SVG element with viewBox focused on the circle with padding
	// 	const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	// 	newSvg.setAttribute('viewBox', `${-1 - padding} ${-1 - padding} ${viewBoxSize} ${viewBoxSize}`);
	// 	newSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
	// 	newSvg.setAttribute('width', clientWidth.toString());
	// 	newSvg.setAttribute('height', clientHeight.toString());

	// 	// Copy all child elements from the original SVG, excluding text elements
	// 	for (const child of svgcanvas.children) {
	// 		// <!--TODO
	// 		// TODO: Remove `style="cursor:pointer;"`, remove all comments <!----> text
	// 		// -->
	// 		const clonedChild = child.cloneNode(true) as Element;
	// 		// Remove all text elements from the cloned child
	// 		const textElements = clonedChild.querySelectorAll('text');
	// 		textElements.forEach((textEl) => textEl.remove());
	// 		newSvg.appendChild(clonedChild);
	// 	}

	// 	// Serialize the new SVG
	// 	const svgData = new XMLSerializer().serializeToString(newSvg);
	// 	const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });

	// 	if (!inPNG) {
	// 		// Export as SVG
	// 		blobToDL(svgBlob, 'hyperbolic-disk.svg');
	// 	} else {
	// 		// Export as PNG - continue with canvas conversion
	// 		const url = URL.createObjectURL(svgBlob);

	// 		// Calculate canvas size - scale the padded viewBox to match the original proportions
	// 		const originalViewBoxWidth = 2.8;
	// 		const canvasSize = Math.round(clientWidth * (viewBoxSize / originalViewBoxWidth));

	// 		const canvas = document.createElement('canvas');
	// 		canvas.width = canvasSize;
	// 		canvas.height = canvasSize;

	// 		const ctx = canvas.getContext('2d')!;

	// 		const img = new Image();
	// 		img.onload = () => {
	// 			// Draw the entire image to fill the canvas
	// 			ctx.drawImage(img, 0, 0, canvasSize, canvasSize);
	// 			// Convert to PNG and download
	// 			canvas.toBlob((blob) => (blob ? blobToDL(blob, 'hyperbolic-disk.png') : null), 'image/png');
	// 			URL.revokeObjectURL(url);
	// 		};
	// 		img.src = url;
	// 	}
	// }

	function selectAppMode(mode: 'crossingDetection' | 'bandData' | 'bandSequence') {
		appMode = mode;
		if (mode === 'bandData') {
			dataState.clearSelection(1);
			dataState.inComparison = false;
		} else if (mode === 'crossingDetection') {
			dataState.inComparison = true;
			if (dataState.selected[0] !== null) dataState.selecting = 1;
		}
	}
</script>

<main>
	<h1>Farey Tessellation Visualizer</h1>
	<div class="app-layout">
		<div class="controls">
			<div class="mode-tabs">
				<button
					class:active={appMode === 'crossingDetection'}
					onclick={() => selectAppMode('crossingDetection')}
				>
					Crossing detection
				</button>
				<button class:active={appMode === 'bandData'} onclick={() => selectAppMode('bandData')}>
					Band data
				</button>
				<button
					class:active={appMode === 'bandSequence'}
					onclick={() => selectAppMode('bandSequence')}
				>
					Continued fraction sequence
				</button>
			</div>
			{#if appMode !== 'bandSequence'}
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
				{#if appMode === 'crossingDetection'}
					<button
						onclick={() => {
							dataState.clearSelection();
						}}
					>
						Reset Selection
					</button>
				{/if}
			{/if}
		</div>
		{#if appMode === 'bandSequence'}
			<div class="sequence-content">
				<CFBandSequencePanel onSequenceChange={handleSequenceChange} />
				<div class="sequence-tessellation">
					<AnimationControls
						onCenter={handleCenterSequenceTriangle}
						onReset={handleResetSequence}
					/>
					<HyperbolicCanvas
						triangles={sequenceDataState.triangles}
						selectedTriangle={sequenceSelectedTriangle}
						selected={[]}
						currentTransform={sequenceCurrentTransform}
						currentT={sequenceAnimationProgress}
						baseTransforms={sequenceCommittedTransforms}
						onSelectTriangle={(id) => (sequenceSelectedTriangle = id)}
						onSelectVertex={() => {}}
						highlightedEdges={sequenceHighlightedEdges}
						bind:svg={sequenceSvgcanvas}
					/>
				</div>
			</div>
		{:else}
			<div class="main-content">
				<aside class="sidebar" class:compare-sidebar={appMode === 'crossingDetection'}>
					{#if appMode === 'crossingDetection'}
						<ComparisonPanel {dataState} />
					{:else}
						<ContinuedFractionPanel
							pointData={dataState.selectedPointsData[0] ?? null}
							isActive={dataState.selected[0] !== null}
						/>
					{/if}
				</aside>
				<div class="canvas-container">
					<AnimationControls
						onCenter={handleCenterTriangle}
						onReset={handleReset}
						// onExport={handleExportPic}
					/>
					<HyperbolicCanvas
						triangles={dataState.triangles}
						{selectedTriangle}
						selected={dataState.selected}
						{currentTransform}
						currentT={animationProgress}
						baseTransforms={committedTransforms}
						onSelectTriangle={handleTriangleSelect}
						onSelectVertex={handleVertexSelect}
						bind:svg={svgcanvas}
					/>
				</div>
			</div>
		{/if}
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
	.sequence-content {
		display: grid;
		grid-template-columns: minmax(0, 1.35fr) minmax(380px, 0.65fr);
		gap: 1rem;
		align-items: start;
		min-width: 0;
	}
	.sequence-tessellation {
		position: sticky;
		top: 1rem;
		min-width: 0;
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
		flex-wrap: wrap;
		padding: 1rem;
		background-color: #f5f5f5;
		border-radius: 8px;
	}
	.mode-tabs {
		display: inline-flex;
		gap: 0.25rem;
		padding: 0.2rem;
		background: #e5e7eb;
		border-radius: 6px;
	}
	.mode-tabs button,
	.controls > button {
		padding: 0.45rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		background: white;
		cursor: pointer;
	}
	.mode-tabs button.active {
		background: #2563eb;
		color: white;
		border-color: #2563eb;
	}

	@media (max-width: 1000px) {
		.sequence-content {
			grid-template-columns: minmax(0, 1fr);
		}

		.sequence-tessellation {
			position: static;
			max-width: 640px;
		}
	}
</style>
