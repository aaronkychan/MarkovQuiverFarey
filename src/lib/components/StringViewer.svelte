<script lang="ts">
	import { arrows } from '$lib/math/markov';
	import { EndType, type InfString } from '$lib/math/types';

	/**
	 * BandDiagram component
	 * Renders a sequence of directed letters (a,b,c,x,y,z) and their inverses
	 * as a diagonal path with vertex labels at turning points.
	 *
	 */
	let { str }: { str: InfString | null } = $props();

	let extraLeftCopies = $state(0);
	let extraRightCopies = $state(0);

	$effect(() => {
		void str;
		extraLeftCopies = 0;
		extraRightCopies = 0;
	});
	// Inverses swap src and tgt.
	// const letterMeta = {
	// 	a: { src: 1, tgt: 2 },
	// 	b: { src: 2, tgt: 3 },
	// 	c: { src: 3, tgt: 1 },
	// 	x: { src: 1, tgt: 3 },
	// 	y: { src: 3, tgt: 2 },
	// 	z: { src: 2, tgt: 1 }
	// };

	const blueLetters = new Set(['a', 'c', 'y']);
	const letterColor = (letter: keyof typeof arrows) =>
		blueLetters.has(letter) ? '#3b82f6' : '#f97316';
	const SCALE = 40; // Pixels per grid unit

	let hoveredIndex = $state<number | null>(null);
	let highlightIndex = $derived.by(() => {
		if (hoveredIndex === null) return null;
		const leftCopyLen = leftCopyLetters.length;
		const rightCopyLen = rightCopyLetters.length;
		const totalLeftCopiesLen = extraLeftCopies * leftCopyLen;
		const totalLeft = totalLeftCopiesLen + leftLetters.length;
		const totalCoreEnd = totalLeft + coreLetters.length;
		const totalRightCopiesLen = extraRightCopies * rightCopyLen;
		if (hoveredIndex < totalLeftCopiesLen) {
			const pos = hoveredIndex % leftCopyLen;
			return leftCopyLetters === leftLetters ? pos : pos + leftLetters.length;
		} else if (hoveredIndex < totalLeft) {
			return hoveredIndex - totalLeftCopiesLen;
		} else if (hoveredIndex < totalCoreEnd) {
			return hoveredIndex - totalLeft + leftLetters.length;
		} else if (hoveredIndex < totalCoreEnd + totalRightCopiesLen) {
			const pos = (hoveredIndex - totalCoreEnd) % rightCopyLen;
			return rightCopyLetters === rightLetters
				? pos + leftLetters.length + coreLetters.length
				: pos + leftLetters.length;
		} else {
			return (
				hoveredIndex - totalCoreEnd - totalRightCopiesLen + leftLetters.length + coreLetters.length
			);
		}
	});
	const leftLetters = $derived(str?.left.split('|').filter(Boolean) ?? []);
	const coreLetters = $derived(str?.core.split('|').filter(Boolean) ?? []);
	const rightLetters = $derived(str?.right.split('|').filter(Boolean) ?? []);

	const leftBand = $derived(
		str
			? str.type == EndType.pureBand ||
					str.type === EndType.LRBand ||
					str.type === EndType.band_confined
			: false
	);
	const rightBand = $derived(
		str
			? str.type == EndType.pureBand ||
					str.type === EndType.LRBand ||
					str.type === EndType.confined_band
			: false
	);

	const leftCopyLetters = $derived(leftLetters.length > 0 ? leftLetters : coreLetters);
	const rightCopyLetters = $derived(rightLetters.length > 0 ? rightLetters : coreLetters);

	const geometry = $derived.by(() => {
		const letters = [];
		for (let i = 0; i < extraLeftCopies; i++) {
			letters.push(...leftCopyLetters);
		}
		letters.push(...leftLetters, ...coreLetters);
		for (let i = 0; i < extraRightCopies; i++) {
			letters.push(...rightCopyLetters);
		}
		letters.push(...rightLetters);
		if (letters.length === 0) return null;

		let cx = 0;
		let cy = 0;
		const lines = [];
		const corners = [];

		for (let i = 0; i < letters.length; i++) {
			const char = letters[i];
			const isInverse = char.includes('^');
			const base = char.replace('^', '') as keyof typeof arrows;
			const srctgt = arrows[base];

			if (!srctgt) continue;

			const x1 = cx;
			const y1 = cy;

			// Update coordinates for left-to-right flow
			// Directed (\): x increases, y increases (goes down)
			// Inverse (/): x increases, y decreases (goes up)
			cx += 1;
			cy += isInverse ? -1 : 1;

			lines.push({
				x1,
				y1,
				x2: cx,
				y2: cy,
				color: letterColor(base)
			});

			// Check for a turning point (change in direction)
			if (i < letters.length - 1) {
				const nextIsInverse = letters[i + 1].includes('^');
				if (isInverse !== nextIsInverse) {
					// The label at the corner is the target vertex of the current letter
					// (or source of its inverse)
					corners.push({
						x: cx,
						y: cy,
						label: isInverse ? Math.abs(srctgt.src) : Math.abs(srctgt.tgt),
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

		const totalLeftLength = extraLeftCopies * leftCopyLetters.length + leftLetters.length;
		const totalCoreLength = coreLetters.length;

		return {
			lines,
			corners,
			maxX,
			dividerX1: totalLeftLength,
			dividerX2: totalLeftLength + totalCoreLength,
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
	<div>
		<strong>Left:</strong>
		{#if leftLetters.length > 0}
			{#each leftLetters as letter, i (i)}
				<span class:highlight={highlightIndex === i}>{letter}</span
				>{#if i < leftLetters.length - 1}|{/if}
			{/each}
		{:else}
			<span class="muted">empty</span>
		{/if}
		{#if leftBand}
			<span class="band-tag">
				(band x{extraLeftCopies + (str?.type !== EndType.pureBand ? 1 : 0)})
			</span>
			<button onclick={() => extraLeftCopies++}>+</button>
		{/if}
	</div>
	<div>
		<strong>Core:</strong>
		{#if coreLetters.length > 0}
			{#each coreLetters as letter, i (i)}
				<span class:highlight={highlightIndex === i + leftLetters.length}> {letter} </span>
				{#if i < coreLetters.length - 1}|{/if}
			{/each}
		{:else}
			<span class="muted">empty</span>
		{/if}
	</div>
	<div>
		<strong>Right:</strong>
		{#if rightLetters.length > 0}
			{#each rightLetters as letter, i (i)}
				<span class:highlight={highlightIndex === i + leftLetters.length + coreLetters.length}>
					{letter}
				</span>
				{#if i < rightLetters.length - 1}|{/if}
			{/each}
		{:else}
			<span class="muted">empty</span>
		{/if}
		{#if rightBand}
			<span class="band-tag">
				(band x{extraRightCopies + (str?.type !== EndType.pureBand ? 1 : 0)})
			</span>
			<button onclick={() => extraRightCopies++}>+</button>
		{/if}
	</div>
</div>

{#if geometry}
	<div class="band-wrapper">
		<svg
			width={geometry.viewBox.w * SCALE}
			height={geometry.viewBox.h * SCALE}
			viewBox="{geometry.viewBox.x * SCALE} {geometry.viewBox.y * SCALE} {geometry.viewBox.w *
				SCALE} {geometry.viewBox.h * SCALE}"
		>
			<!-- Boundaries -->
			{#if leftBand}
				<line
					x1={extraLeftCopies * leftCopyLetters.length * SCALE}
					y1={geometry.viewBox.y * SCALE}
					x2={extraLeftCopies * leftCopyLetters.length * SCALE}
					y2={(geometry.viewBox.y + geometry.viewBox.h) * SCALE}
					stroke="black"
					stroke-width="1"
					stroke-dasharray="5"
				/>
			{/if}
			{#if rightBand}
				<line
					x1={(geometry.dividerX2 + rightLetters.length) * SCALE}
					y1={geometry.viewBox.y * SCALE}
					x2={(geometry.dividerX2 + rightLetters.length) * SCALE}
					y2={(geometry.viewBox.y + geometry.viewBox.h) * SCALE}
					stroke="black"
					stroke-width="1"
					stroke-dasharray="5"
				/>
			{/if}

			<!-- Separators for copies -->
			<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
			{#each Array(extraLeftCopies) as _, i (i)}
				<line
					x1={i * leftCopyLetters.length * SCALE}
					y1={geometry.viewBox.y * SCALE}
					x2={i * leftCopyLetters.length * SCALE}
					y2={(geometry.viewBox.y + geometry.viewBox.h) * SCALE}
					stroke="black"
					stroke-width="1"
					stroke-dasharray="5"
				/>
			{/each}

			<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
			{#each Array(extraRightCopies) as _, i (i)}
				<line
					x1={(geometry.dividerX2 + rightLetters.length + (i + 1) * rightCopyLetters.length) *
						SCALE}
					y1={geometry.viewBox.y * SCALE}
					x2={(geometry.dividerX2 + rightLetters.length + (i + 1) * rightCopyLetters.length) *
						SCALE}
					y2={(geometry.viewBox.y + geometry.viewBox.h) * SCALE}
					stroke="black"
					stroke-width="1"
					stroke-dasharray="5"
				/>
			{/each}

			<!-- Dividers -->
			<line
				x1={geometry.dividerX1 * SCALE}
				y1={geometry.viewBox.y * SCALE}
				x2={geometry.dividerX1 * SCALE}
				y2={(geometry.viewBox.y + geometry.viewBox.h) * SCALE}
				stroke="#666"
				stroke-width="1"
				stroke-dasharray="2"
			/>
			<line
				x1={geometry.dividerX2 * SCALE}
				y1={geometry.viewBox.y * SCALE}
				x2={geometry.dividerX2 * SCALE}
				y2={(geometry.viewBox.y + geometry.viewBox.h) * SCALE}
				stroke="#666"
				stroke-width="1"
				stroke-dasharray="2"
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
	.muted {
		color: #9ca3af;
	}
	.band-tag {
		color: #6b7280;
		font-style: italic;
	}
	button {
		margin-left: 0.5rem;
		padding: 0 0.25rem;
		font-size: 0.8rem;
		border: 1px solid #ccc;
		border-radius: 3px;
		background: #f9f9f9;
		cursor: pointer;
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
