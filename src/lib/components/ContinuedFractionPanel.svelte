<script lang="ts">
	import BandDiagram from './BandDiagram.svelte';

	let { selected, positiveCF, negativeCF, band, isActive } = $props();
</script>

<div class="panel">
	{#if isActive}
		<h3>Data for {selected}</h3>
		<p><strong>Positive continued fraction:</strong> {positiveCF}</p>
		<p><strong>Negative continued fraction:</strong> {negativeCF}</p>
		<BandDiagram {band} />
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
</style>
