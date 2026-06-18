<script lang="ts">
	import { buildBandGeometry, type BandGeometry } from '$lib/math/band-geometry';
	import {
		alignBands,
		countBandCrossings,
		type BandCrossingCount,
		type CfBandRow
	} from '$lib/math/cf-band-sequence';

	let {
		rows,
		selectedRows,
		onToggleRow
	}: {
		rows: CfBandRow[];
		selectedRows: number[];
		onToggleRow: (index: number) => void;
	} = $props();

	interface CanvasRow {
		row: CfBandRow;
		geometry: BandGeometry;
		translateY: number;
		top: number;
		bottom: number;
		boundaries: number[];
		embeddedFromPrevious: { start: number; length: number } | null;
	}

	interface CrossingRailItem {
		count: BandCrossingCount;
		top: number;
		bottom: number;
	}

	const ROW_GAP = 1.45;
	const layout = $derived.by(() => {
		let cursor = 0;
		const canvasRows: CanvasRow[] = [];

		for (const [rowIndex, row] of rows.entries()) {
			const displayLetters = Array.from({ length: row.displayCopies }, () => row.letters).flat();
			const geometry = buildBandGeometry(displayLetters, row.offset);
			if (!geometry) continue;

			const top = cursor;
			const bottom = top + geometry.viewBox.h;
			const previousAlignment =
				rowIndex > 0 ? alignBands(rows[rowIndex - 1].letters, row.letters) : null;
			canvasRows.push({
				row,
				geometry,
				translateY: top - geometry.viewBox.y,
				top,
				bottom,
				embeddedFromPrevious: previousAlignment?.containsPrevious
					? {
							start: previousAlignment.currentStart,
							length: previousAlignment.overlapLength
						}
					: null,
				boundaries: Array.from(
					{ length: row.displayCopies + 1 },
					(_, index) => row.offset + index * row.letters.length
				)
			});
			cursor = bottom + ROW_GAP;
		}

		const plotMinX = Math.min(...canvasRows.map((item) => item.geometry.viewBox.x), 0);
		const plotMaxX = Math.max(
			...canvasRows.map((item) => item.geometry.viewBox.x + item.geometry.viewBox.w),
			1
		);
		const labelX = plotMinX - 0.8;
		const railX = labelX - 0.15;
		const viewX = plotMinX - 6.5;
		const viewWidth = plotMaxX + 0.8 - viewX;
		const viewHeight = Math.max(1, cursor - ROW_GAP);
		const pixelWidth = Math.max(640, Math.ceil(viewWidth * 26));
		const rail: CrossingRailItem[] = canvasRows.slice(0, -1).map((item, index) => ({
			count: countBandCrossings(
				item.row.fraction,
				canvasRows[index + 1].row.fraction,
				item.row.band,
				canvasRows[index + 1].row.band
			),
			top: item.bottom + 0.12,
			bottom: canvasRows[index + 1].top - 0.12
		}));

		return {
			canvasRows,
			labelX,
			railX,
			rail,
			plotMaxX,
			viewX,
			viewWidth,
			viewHeight,
			pixelWidth
		};
	});

	function handleRowKeydown(event: KeyboardEvent, index: number) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onToggleRow(index);
		}
	}

	function handleRowClick(event: MouseEvent, index: number) {
		(event.currentTarget as SVGGElement).focus();
		onToggleRow(index);
	}

	function isEmbeddedSegment(item: CanvasRow, segmentIndex: number) {
		const overlap = item.embeddedFromPrevious;
		return (
			overlap !== null &&
			segmentIndex >= overlap.start &&
			segmentIndex < overlap.start + overlap.length
		);
	}
</script>

<div class="canvas-shell" style:width="{layout.pixelWidth}px">
	<svg
		aria-label="Aligned continued-fraction band sequence"
		role="img"
		viewBox="{layout.viewX} -0.4 {layout.viewWidth} {layout.viewHeight + 0.8}"
		width={layout.pixelWidth}
		height={Math.max(280, layout.viewHeight * 18)}
		preserveAspectRatio="xMinYMin meet"
	>
		<defs>
			<marker
				id="crossing-arrow"
				viewBox="0 0 10 10"
				refX="8"
				refY="5"
				markerWidth="5"
				markerHeight="5"
				orient="auto-start-reverse"
			>
				<path d="M 0 0 L 10 5 L 0 10 z" fill="#166534" />
			</marker>
		</defs>

		{#each layout.canvasRows as item, index (item.row.index)}
			<g
				class="band-line"
				class:selected={selectedRows.includes(index)}
				role="button"
				tabindex="0"
				aria-label="Select band {item.row.fractionLabel}"
				onclick={(event) => handleRowClick(event, index)}
				onkeydown={(event) => handleRowKeydown(event, index)}
			>
				<rect
					class="row-hit"
					x={layout.viewX + 0.15}
					y={item.top + 0.08}
					width={layout.plotMaxX - layout.viewX + 0.4}
					height={item.bottom - item.top - 0.16}
					rx="0.22"
				/>

				<text class="fraction" x={layout.labelX} y={item.top + 1.25} text-anchor="end">
					{item.row.fractionLabel}
				</text>
				<text class="cf" x={layout.labelX} y={item.top + 2.05} text-anchor="end">
					[{item.row.cf.join('; ')}]
				</text>

				<g transform="translate(0 {item.translateY})">
					{#each item.boundaries as boundary, boundaryIndex (`${item.row.index}-${boundaryIndex}`)}
						<line
							class="period-boundary"
							x1={boundary}
							y1={item.geometry.viewBox.y + 0.25}
							x2={boundary}
							y2={item.geometry.viewBox.y + item.geometry.viewBox.h - 0.25}
						/>
					{/each}

					{#each item.geometry.segments as segment (`${item.row.index}-${segment.index}`)}
						{#if isEmbeddedSegment(item, segment.index)}
							<line
								class="overlap-highlight"
								x1={segment.x1}
								y1={segment.y1}
								x2={segment.x2}
								y2={segment.y2}
								stroke-linecap="round"
							/>
						{/if}
						<line
							x1={segment.x1}
							y1={segment.y1}
							x2={segment.x2}
							y2={segment.y2}
							stroke={segment.color}
							stroke-width="0.18"
							stroke-linecap="round"
						/>
					{/each}

					{#each item.geometry.corners as corner, cornerIndex (`${item.row.index}-${cornerIndex}`)}
						<g transform="translate({corner.x} {corner.y})">
							<circle r="0.18" fill="white" stroke="#334155" stroke-width="0.07" />
							<text class="corner-label" y={corner.isTop ? -0.38 : 0.58} text-anchor="middle">
								{corner.label}
							</text>
						</g>
					{/each}
				</g>
			</g>
		{/each}

		{#each layout.rail as item, index (index)}
			{#if item.count.identical}
				<text
					class="identical-label"
					x={layout.railX}
					y={(item.top + item.bottom) / 2}
					text-anchor="middle"
				>
					identical
				</text>
			{:else}
				{#if item.count.positive > 0}
					<line
						class="crossing-arrow"
						x1={layout.railX + (item.count.negative > 0 ? -0.28 : 0)}
						y1={item.top}
						x2={layout.railX + (item.count.negative > 0 ? -0.28 : 0)}
						y2={item.bottom}
						marker-end="url(#crossing-arrow)"
					/>
					<text
						class="plus-label"
						x={layout.railX + (item.count.negative > 0 ? -0.72 : 0.3)}
						y={(item.top + item.bottom) / 2}
					>
						+{item.count.positive > 1 ? ` x${item.count.positive}` : ''}
					</text>
				{/if}
				{#if item.count.negative > 0}
					<line
						class="crossing-arrow"
						x1={layout.railX + 0.32}
						y1={item.bottom}
						x2={layout.railX + 0.32}
						y2={item.top}
						marker-end="url(#crossing-arrow)"
					/>
					<text class="plus-label" x={layout.railX + 0.58} y={(item.top + item.bottom) / 2}>
						+{item.count.negative > 1 ? ` x${item.count.negative}` : ''}
					</text>
				{/if}
			{/if}
		{/each}
	</svg>
</div>

<style>
	.canvas-shell {
		max-width: 100%;
		overflow-x: auto;
		border: 1px solid #d8dee8;
		border-radius: 6px;
		background: #ffffff;
	}

	svg {
		display: block;
	}

	.band-line {
		cursor: pointer;
		outline: none;
	}

	.row-hit {
		fill: transparent;
		stroke: transparent;
		stroke-width: 0.06;
	}

	.band-line:hover .row-hit,
	.band-line:focus .row-hit {
		fill: #f8fafc;
		stroke: #94a3b8;
	}

	.band-line.selected .row-hit {
		fill: #eff6ff;
		stroke: #2563eb;
	}

	.period-boundary {
		stroke: #64748b;
		stroke-width: 0.055;
		stroke-dasharray: 0.18 0.14;
		pointer-events: none;
	}

	.overlap-highlight {
		stroke: #fde047;
		stroke-width: 0.52;
		opacity: 0;
		pointer-events: none;
		transition: opacity 120ms ease-out;
	}

	.band-line:hover + .band-line .overlap-highlight,
	.band-line:focus + .band-line .overlap-highlight {
		opacity: 0.9;
	}

	.fraction {
		font-size: 0.82px;
		font-weight: 800;
		fill: #111827;
	}

	.cf {
		font-size: 0.66px;
		font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
		fill: #64748b;
	}

	.corner-label {
		font-size: 0.48px;
		font-weight: 800;
		font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
		fill: #1f2937;
	}

	.crossing-arrow {
		stroke: #166534;
		stroke-width: 0.09;
	}

	.plus-label,
	.identical-label {
		font-size: 0.5px;
		font-weight: 800;
		fill: #166534;
		dominant-baseline: middle;
	}

	.identical-label {
		font-size: 0.42px;
		fill: #475569;
	}
</style>
