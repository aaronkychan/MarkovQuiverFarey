<script lang="ts">
	import { arrows, getSequence, invertInfString, letterColor, isLetter } from '$lib/math/markov';
	import { type Crossing, type InfString, Direction } from '$lib/math/types';

	let { str1, str2, crossing }: { str1: InfString; str2: InfString; crossing: Crossing } = $props();

	const SCALE = 40;
	const STRING_VERTICAL_OFFSET = 1.4;

	interface SequenceGeometry {
		seqs: string[];
		points: Array<{ x: number; y: number }>;
		segments: Array<{
			start: { x: number; y: number };
			end: { x: number; y: number };
			letter: string;
			color: string;
			index: number;
		}>;
		markers: Array<{ x: number; y: number; label: string; index: number }>;
	}

	function buildDiagramGeometry(sequence: string[]): SequenceGeometry {
		const points: Array<{ x: number; y: number }> = [];
		const segments: Array<{
			start: { x: number; y: number };
			end: { x: number; y: number };
			letter: string;
			color: string;
			index: number;
		}> = [];
		const markers: Array<{ x: number; y: number; label: string; index: number }> = [];

		let x = 0;
		let y = 0;
		for (let i = 0; i < sequence.length; i++) {
			const symbol = sequence[i];
			points.push({ x, y });

			if (isLetter(symbol)) {
				const isInverse = symbol.endsWith('^');
				const base = symbol.replace('^', '') as keyof typeof arrows;
				const nextX = x + 1;
				const nextY = y + (isInverse ? -1 : 1);
				segments.push({
					start: { x, y },
					end: { x: nextX, y: nextY },
					letter: symbol,
					color: letterColor(base),
					index: i
				});
				x = nextX;
				y = nextY;
			} else {
				markers.push({ x, y, label: symbol, index: i });
			}
		}

		return { seqs: sequence, points, segments, markers };
	}

	const effectiveStr1 = $derived(
		crossing.stringOrientation[0] === Direction.directed ? str1 : invertInfString(str1)
	);
	const effectiveStr2 = $derived(
		crossing.stringOrientation[1] === Direction.directed ? str2 : invertInfString(str2)
	);

	const str1Seq = $derived(getSequence(effectiveStr1, 1, 1));
	const str2Seq = $derived(getSequence(effectiveStr2, 1, 1));

	const str1Data = $derived(buildDiagramGeometry(str1Seq.seqs));
	const str2Data = $derived(buildDiagramGeometry(str2Seq.seqs));

	const str1StartPoint = $derived(str1Data.points[crossing.start1] ?? { x: 0, y: 0 });
	const str2StartPoint = $derived(str2Data.points[crossing.start2] ?? { x: 0, y: 0 });
	const str2ShiftX = $derived(str1StartPoint.x - str2StartPoint.x);

	const overlapIndices1 = $derived.by(() => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const set = new Set<number>();
		for (let i = 0; i < crossing.len; i++) {
			set.add(crossing.start1 + i);
		}
		return set;
	});
	const overlapIndices2 = $derived.by(() => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const set = new Set<number>();
		for (let i = 0; i < crossing.len; i++) {
			set.add(crossing.start2 + i);
		}
		return set;
	});

	function transformPoint(point: { x: number; y: number }, dx: number, dy: number) {
		return { x: point.x + dx, y: point.y + dy };
	}

	function buildVisualData(
		data: SequenceGeometry,
		yShift: number,
		xShift: number,
		overlapSet: Set<number>
	) {
		return {
			segments: data.segments.map((segment) => ({
				start: transformPoint(segment.start, xShift, yShift),
				end: transformPoint(segment.end, xShift, yShift),
				color: segment.color,
				index: segment.index,
				highlight: overlapSet.has(segment.index)
			})),
			markers: data.markers.map((marker) => ({
				...transformPoint(marker, xShift, yShift),
				label: marker.label,
				index: marker.index,
				highlight: overlapSet.has(marker.index)
			}))
		};
	}

	const path1 = $derived(buildVisualData(str1Data, -STRING_VERTICAL_OFFSET, 0, overlapIndices1));
	const path2 = $derived(
		buildVisualData(str2Data, STRING_VERTICAL_OFFSET, str2ShiftX, overlapIndices2)
	);

	const allPoints = $derived([
		...path1.segments.flatMap((segment) => [segment.start, segment.end]),
		...path1.markers,
		...path2.segments.flatMap((segment) => [segment.start, segment.end]),
		...path2.markers
	]);

	const minX = $derived(Math.min(...allPoints.map((pt) => pt.x)) - 0.8);
	const maxX = $derived(Math.max(...allPoints.map((pt) => pt.x)) + 0.8);
	const minY = $derived(Math.min(...allPoints.map((pt) => pt.y)) - 1.4);
	const maxY = $derived(Math.max(...allPoints.map((pt) => pt.y)) + 1.4);

	const viewBox = $derived({
		x: minX * SCALE,
		y: minY * SCALE,
		w: (maxX - minX) * SCALE,
		h: (maxY - minY) * SCALE
	});

	const alignmentX = $derived(str1StartPoint.x);
</script>

{#if !str1 || !str2 || !crossing}
	<div class="message">Crossing diagram requires `str1`, `str2`, and `crossing` props.</div>
{:else}
	<div class="diagram-wrapper">
		<svg width="100%" height={viewBox.h} viewBox="{viewBox.x} {viewBox.y} {viewBox.w} {viewBox.h}">
			<line
				x1={alignmentX * SCALE}
				y1={viewBox.y}
				x2={alignmentX * SCALE}
				y2={viewBox.y + viewBox.h}
				stroke="#999"
				stroke-dasharray="4"
				stroke-width="1"
			/>

			{#each path2.segments as segment, i (i)}
				<line
					x1={segment.start.x * SCALE}
					y1={segment.start.y * SCALE}
					x2={segment.end.x * SCALE}
					y2={segment.end.y * SCALE}
					stroke={segment.highlight ? segment.color : '#9ca3af'}
					stroke-width={segment.highlight ? 6 : 4}
					stroke-linecap="round"
					opacity={segment.highlight ? '0.85' : '0.45'}
				/>
			{/each}

			{#each path1.segments as segment, i (i)}
				<line
					x1={segment.start.x * SCALE}
					y1={segment.start.y * SCALE}
					x2={segment.end.x * SCALE}
					y2={segment.end.y * SCALE}
					stroke={segment.highlight ? segment.color : '#9ca3af'}
					stroke-width={segment.highlight ? 6 : 4}
					stroke-linecap="round"
				/>
			{/each}

			{#each path2.markers as marker, i (i)}
				<g transform="translate({marker.x * SCALE}, {marker.y * SCALE})">
					<circle r="4" fill={marker.highlight ? '#f97316' : '#9ca3af'} />
					<text y="-8" text-anchor="middle" class="marker-text">{marker.label}</text>
				</g>
			{/each}

			{#each path1.markers as marker, i (i)}
				<g transform="translate({marker.x * SCALE}, {marker.y * SCALE})">
					<circle r="4" fill={marker.highlight ? '#2563eb' : '#9ca3af'} />
					<text y="-8" text-anchor="middle" class="marker-text">{marker.label}</text>
				</g>
			{/each}
		</svg>
	</div>

	<div class="legend">
		<div class="legend-item">
			<span class="legend-swatch str1"></span>
			<span>String 1 ({crossing.stringOrientation[0]})</span>
		</div>
		<div class="legend-item">
			<span class="legend-swatch str2"></span>
			<span>String 2 ({crossing.stringOrientation[1]})</span>
		</div>
		<div class="legend-item">
			<span class="legend-swatch overlap"></span>
			<span>Crossing overlap</span>
		</div>
	</div>
{/if}

<style>
	.diagram-wrapper {
		padding: 1rem;
		background: #fff;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		overflow: auto;
	}

	.marker-text {
		font-size: 12px;
		font-family: ui-monospace, monospace;
		fill: #111827;
	}

	.legend {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		margin-top: 0.75rem;
		font-size: 0.95rem;
		color: #334155;
	}

	.legend-item {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.legend-swatch {
		display: inline-block;
		width: 1rem;
		height: 1rem;
		border-radius: 3px;
		border: 1px solid #cbd5e1;
	}

	.legend-swatch.str1 {
		background: #60a5fa;
	}

	.legend-swatch.str2 {
		background: #fb923c;
	}

	.legend-swatch.overlap {
		background: linear-gradient(135deg, #2563eb 0%, #f97316 100%);
	}

	.message {
		padding: 1rem;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		color: #475569;
	}
</style>
