<script lang="ts">
	import StringViewer from './StringViewer.svelte';
	import { bandStrToInfString, type PointData } from '$lib/math/markov';

	let { ptsData }: { ptsData: Array<PointData | null> } = $props();
</script>

<div class="comparison-view">
	{#each ptsData.filter(Boolean) as pd (pd)}
		<div class="point-section">
			<h3>Fraction: {pd ? pd.frac : 'Click a vertex'}</h3>
			{#if pd}
				<div class="stats">
					<div><span class="label">Positive CF:</span> {pd?.pos}</div>
					<div><span class="label">Negative CF:</span> {pd?.neg}</div>
				</div>
				<div class="diagram-label">Band Diagram:</div>
				<StringViewer str={bandStrToInfString(pd?.band)} />
			{/if}
		</div>

		<hr />
	{/each}
</div>

<style>
	.comparison-view {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.point-section h3 {
		margin: 0 0 0.5rem 0;
		color: #374151;
	}
	.stats {
		font-size: 0.9rem;
		margin-bottom: 1rem;
	}
	.label {
		font-weight: 600;
		color: #6b7280;
	}
	.diagram-label {
		font-weight: bold;
		font-size: 0.85rem;
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		color: #9ca3af;
	}
	hr {
		border: 0;
		border-top: 1px solid #e5e7eb;
		margin: 0;
	}
</style>
