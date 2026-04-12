<script lang="ts">
	/**
	 * BandDiagram component
	 * Renders a sequence of directed letters (a,b,c,x,y,z) and their inverses
	 * as a diagonal path with vertex labels at turning points.
	 *
	 * (vibe-coded component)
	 */
	let { band = '' }: { band: string } = $props();

	// Metadata mapping for letters to vertices (source/target)
	// Inverses swap src and tgt.
	const letterMeta = {
		a: { src: 1, tgt: 2 },
		b: { src: 2, tgt: 3 },
		c: { src: 3, tgt: 1 },
		x: { src: 1, tgt: 3 },
		y: { src: 3, tgt: 2 },
		z: { src: 2, tgt: 1 }
	};

	const blueLetters = new Set(['a', 'c', 'y']);
	const SCALE = 40; // Pixels per grid unit

	let hoveredIndex = $state<number | null>(null);
	const letters = $derived(band.split('|').filter(Boolean));

	const geometry = $derived.by(() => {
		if (letters.length === 0) return null;

		let cx = 0;
		let cy = 0;
		const lines = [];
		const corners = [];

		for (let i = 0; i < letters.length; i++) {
			const char = letters[i];
			const isInverse = char.includes('^');
			const base = char.replace('^', '') as keyof typeof letterMeta;
			const meta = letterMeta[base];

			if (!meta) continue;

			const x1 = cx;
			const y1 = cy;

			// Update coordinates for left-to-right flow
			// Directed (\): x increases, y increases (goes down)
			// Inverse (/): x increases, y decreases (goes up)
			cx += 1;
			if (!isInverse) {
				cy += 1;
			} else {
				cy -= 1;
			}

			const x2 = cx;
			const y2 = cy;

			lines.push({
				x1,
				y1,
				x2,
				y2,
				color: blueLetters.has(base) ? '#3b82f6' : '#f97316'
			});

			// Check for a turning point (change in direction)
			if (i < letters.length - 1) {
				const nextIsInverse = letters[i + 1].includes('^');
				if (isInverse !== nextIsInverse) {
					// The label at the corner is the target vertex of the current letter
					// (or source of its inverse)
					corners.push({
						x: x2,
						y: y2,
						label: Math.abs(meta.tgt),
						isValley: !isInverse && nextIsInverse // Directed (\) then Inverse (/) creates a bottom point
					});
				}
			}
		}

		const allX = [0, ...lines.flatMap((l) => [l.x1, l.x2])];
		const allY = [0, ...lines.flatMap((l) => [l.y1, l.y2])];

		const minX = Math.min(...allX);
		const maxX = Math.max(...allX);
		const minY = Math.min(...allY);
		const maxY = Math.max(...allY);

		return {
			lines,
			corners,
			maxX,
			viewBox: {
				x: minX - 0.5,
				y: minY - 1.2, // Room for top labels
				w: maxX - minX + 1,
				h: maxY - minY + 2.5
			}
		};
	});
</script>

<div class="infotext">
	<strong>Band:</strong>
	{#each letters as letter, i (i)}
		<span class:highlight={hoveredIndex === i}>{letter}</span>{#if i < letters.length - 1}|{/if}
	{/each}
</div>

{#if geometry}
	<div class="band-wrapper">
		<svg
			width={geometry.viewBox.w * SCALE}
			height={geometry.viewBox.h * SCALE}
			viewBox="{geometry.viewBox.x * SCALE} {geometry.viewBox.y * SCALE} {geometry.viewBox.w *
				SCALE} {geometry.viewBox.h * SCALE}"
		>
			<!-- Boundary indicators -->
			<line
				x1="0"
				y1={geometry.viewBox.y * SCALE}
				x2="0"
				y2={(geometry.viewBox.y + geometry.viewBox.h) * SCALE}
				stroke="black"
				stroke-width="1"
				stroke-dasharray="4"
			/>
			<line
				x1={geometry.maxX * SCALE}
				y1={geometry.viewBox.y * SCALE}
				x2={geometry.maxX * SCALE}
				y2={(geometry.viewBox.y + geometry.viewBox.h) * SCALE}
				stroke="black"
				stroke-width="1"
				stroke-dasharray="4"
			/>

			{#each geometry.lines as line, i (i)}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<line
					x1={line.x1 * SCALE}
					y1={line.y1 * SCALE}
					x2={line.x2 * SCALE}
					y2={line.y2 * SCALE}
					stroke={line.color}
					stroke-width={hoveredIndex === i ? 8 : 4}
					stroke-linecap="round"
					onmouseenter={() => (hoveredIndex = i)}
					onmouseleave={() => (hoveredIndex = null)}
					style="cursor: pointer; transition: stroke-width 0.1s ease-out;"
				/>
			{/each}

			{#each geometry.corners as corner, i (i)}
				<g transform="translate({corner.x * SCALE}, {corner.y * SCALE})">
					<circle r="5" fill="white" stroke="#333" stroke-width="1.5" />
					<text y={corner.isValley ? '25' : '-12'} text-anchor="middle" class="label">
						{corner.label}
					</text>
				</g>
			{/each}
		</svg>
	</div>
{/if}

<style>
	.infotext {
		padding: 0 0 1rem 0;
	}
	.band-wrapper {
		padding: 1rem;
		background: #fff;
		border: 1px solid #eee;
		border-radius: 4px;
		width: 100%;
		overflow-x: auto;
		overflow-y: hidden;
	}
	svg {
		display: block;
		margin: 0;
	}
	.highlight {
		background-color: #fde047;
		padding: 0 2px;
		border-radius: 2px;
	}
	.label {
		font-size: 14px;
		font-weight: 800;
		font-family: ui-monospace, monospace;
		fill: #1f2937;
	}
</style>
