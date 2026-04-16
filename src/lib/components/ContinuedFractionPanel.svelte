<script lang="ts">
	// import BandDiagram from './BandDiagram.svelte';
	import StringViewer from './StringViewer.svelte';
	import { rationalBandToStringCollec } from '../math/markov';

	let { pointData, isActive } = $props();

	let selectedView = $state('band');
	let stringCollec = $derived(selectedView ? rationalBandToStringCollec(pointData.band) : []);
	let selectedString = $derived(stringCollec.find((s) => s.name === selectedView)?.str ?? null);
</script>

<div class="panel">
	{#if isActive}
		<h3>Data for {pointData.frac}</h3>
		<p><strong>Positive continued fraction:</strong> {pointData.pos}</p>
		<p><strong>Negative continued fraction:</strong> {pointData.neg}</p>
		<select bind:value={selectedView}>
			{#each stringCollec as str (str.name)}
				<option value={str.name}>{str.name}</option>
			{/each}
		</select>
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
</style>
