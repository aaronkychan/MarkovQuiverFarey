<script lang="ts">
	import { buildBandGeometry } from '$lib/math/band-geometry';

	let {
		letters,
		offset = 0,
		selected = false
	}: {
		letters: string[];
		offset?: number;
		selected?: boolean;
	} = $props();

	const SCALE = 34;
	const geometry = $derived(buildBandGeometry(letters, offset));
</script>

{#if geometry}
	<svg
		class:selected
		width={Math.max(220, geometry.viewBox.w * SCALE)}
		height={geometry.viewBox.h * SCALE}
		viewBox="{geometry.viewBox.x * SCALE} {geometry.viewBox.y * SCALE} {geometry.viewBox.w *
			SCALE} {geometry.viewBox.h * SCALE}"
	>
		{#each geometry.segments as segment (segment.index)}
			<line
				x1={segment.x1 * SCALE}
				y1={segment.y1 * SCALE}
				x2={segment.x2 * SCALE}
				y2={segment.y2 * SCALE}
				stroke={segment.color}
				stroke-width="4"
				stroke-linecap="round"
			/>
		{/each}

		{#each geometry.corners as corner, i (i)}
			<g transform="translate({corner.x * SCALE}, {corner.y * SCALE})">
				<circle r="4.5" fill="white" stroke="#333" stroke-width="1.5" />
				<text y={corner.isTop ? '-11' : '22'} text-anchor="middle" class="corner-label">
					{corner.label}
				</text>
			</g>
		{/each}
	</svg>
{/if}

<style>
	svg {
		display: block;
		overflow: visible;
	}

	svg.selected {
		filter: drop-shadow(0 0 0.25rem rgba(37, 99, 235, 0.45));
	}

	.corner-label {
		font-size: 12px;
		font-weight: 800;
		font-family: ui-monospace, monospace;
		fill: #1f2937;
	}
</style>
