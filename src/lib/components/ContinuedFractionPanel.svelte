<script lang="ts">
	import type { PointData } from '$lib/math/types';

	// import BandDiagram from './BandDiagram.svelte';
	import StringViewer from './StringViewer.svelte';

	let { pointData, isActive }: { pointData: PointData | null; isActive: boolean } = $props();

	let selectedView = $state('band');
	let selectedString = $derived(
		pointData?.stringCollec.find((s) => s.name === selectedView)?.str ?? null
	);
</script>

<div class="panel">
	{#if isActive}
		<h3>Data for {pointData?.frac}</h3>
		<div class="unified-row">
			<div class="cf-block">
				<span><span class="label">Pos CF:</span> {pointData?.pos}</span>
				<span><span class="label">Neg CF:</span> {pointData?.neg}</span>
			</div>
			<div class="select-block">
				<span class="label">View:</span>
				<select bind:value={selectedView}>
					{#each pointData?.stringCollec as str (str.name)}
						<option value={str.name}>{str.name}</option>
					{/each}
				</select>
			</div>
		</div>
		<StringViewer str={selectedString} />
	{:else}
		<p>Select a vertex to see continued fractions.</p>
	{/if}
</div>

<style>
	.panel {
		padding: 1rem;
		/* background-color: #f9f9f9;
		border-radius: 8px;
		border: 1px solid #ddd; */
		min-height: 10em;
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
</style>
