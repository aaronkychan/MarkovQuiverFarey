<script lang="ts">
	import {
		f_t,
		geodesicArcForSVG,
		projectFareyPtToDisk,
		type TransformParameter
	} from '$lib/math/hyperbolic';
	import { printFrac } from '$lib/math/farey';
	import type { FareyPoint, FareyTriangle } from '$lib/math/types';
	import { selectColor } from '$lib/context/keys.svelte';

	let {
		triangles,
		selectedTriangle = $bindable(),
		selected,
		currentTransform,
		currentT,
		onSelectTriangle,
		onSelectVertex,
		svg = $bindable()
	}: {
		triangles: FareyTriangle[];
		selectedTriangle: string | null;
		selected: (string | null)[];
		currentTransform: TransformParameter | null;
		currentT: number;
		onSelectTriangle: (id: string) => void;
		onSelectVertex: (id: string | null) => void;
		svg: SVGSVGElement | null;
	} = $props();

	// let currentTransform = $state<MobiusMatrix>(identityMobius());

	interface SVGCoord {
		x: number;
		y: number;
	}
	const SVGCoordToComplex = ({ x, y }: SVGCoord) => {
		return {
			re: x,
			im: -y
		};
	};

	const selectedColor = (frac: string) => selectColor.at(selected[0] === frac ? 0 : 1);

	function closedPathFromArcs(p1: string, p2: string, p3: string): string {
		// parse "M x1 y1 A rx ry rot laf sf x2 y2"
		function parseArc(d: string) {
			// match floats + scientific notation
			const nums = (d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []).map(Number);

			if (nums.length < 9) {
				throw new Error('Invalid arc string: ' + d);
			}

			return {
				x1: nums[0],
				y1: nums[1],
				rx: nums[2],
				ry: nums[3],
				rot: nums[4],
				laf: nums[5],
				sf: nums[6],
				x2: nums[7],
				y2: nums[8],
				raw: d
			};
		}

		// check if two points match (tolerate float error)
		function samePoint(a: SVGCoord, b: SVGCoord, eps = 1e-6) {
			return Math.abs(a.x - b.x) < eps && Math.abs(a.y - b.y) < eps;
		}

		const parsed = [p1, p2, p3].map(parseArc);

		// start from first arc
		let current = parsed[0];
		const final = [parsed[0]];

		for (const p of [parsed[1], parsed[2]]) {
			const end = { x: current.x2, y: current.y2 };
			// forward match
			if (samePoint({ x: p.x1, y: p.y1 }, end)) {
				current = p;
				final.push(p);
				// console.log('forward match');
			} else {
				// reverse match → flip arc
				const flipped = {
					...p,
					x1: p.x2,
					y1: p.y2,
					x2: p.x1,
					y2: p.y1,
					sf: p.sf ^ 1 // flip sweep flag
				};
				current = flipped;
				final.push(flipped);
				// console.log('reverse match');
			}
		}

		// build final path
		let d = `M ${final[0].x1} ${final[0].y1}`;

		for (const a of final) {
			d += ` A ${a.rx} ${a.ry} ${a.rot} ${a.laf} ${a.sf} ${a.x2} ${a.y2}`;
		}

		return d + ' Z';
	}

	function generateRenderData() {
		const vertexSet: Record<string, { x: number; y: number; labelShift: number; fpt: FareyPoint }> =
			{};
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const edgeSet = new Set();
		const arcPaths: Array<{ edgeKey: string; path: string }> = [];
		const trianglePaths: Array<{ id: string; path: string }> = [];

		for (const tri of triangles) {
			[tri.v1, tri.v2, tri.v3].forEach((fpt) => {
				const key = printFrac(fpt.f);
				if (!vertexSet[key]) {
					let diskPos = projectFareyPtToDisk(fpt);
					if (currentTransform) {
						// Apply transformation
						diskPos = f_t(diskPos, currentTransform, currentT);
					}
					// Negate Y for SVG coordinate system (Y-axis points down in SVG, up in math)
					vertexSet[key] = {
						x: diskPos.re,
						y: -diskPos.im,
						labelShift: 0.06 + 0.02 * (1 + fpt.depth),
						fpt: fpt
					};
				}
			});

			const edges = [
				[tri.v1, tri.v2],
				[tri.v2, tri.v3],
				[tri.v1, tri.v3]
			];
			// const edgeKeys = [tri.v1, tri.v2, tri.v3].map((v) => printFrac(v.f));

			let triPaths = [];
			for (const [a, b] of edges) {
				// canonical key to avoid duplicates
				// note: Farey triple is always arranged in v1 < v2 < v3 order
				const keyA = printFrac(a.f);
				const keyB = printFrac(b.f);
				const edgeKey = `${keyA}|${keyB}`;

				if (edgeSet.has(edgeKey)) {
					triPaths.push(arcPaths.find((a) => a.edgeKey === edgeKey)?.path);
					continue;
				}
				edgeSet.add(edgeKey);

				const path = geodesicArcForSVG(
					SVGCoordToComplex(vertexSet[keyA]),
					SVGCoordToComplex(vertexSet[keyB])
				);
				arcPaths.push({ edgeKey, path });
				triPaths.push(path);
			}

			// Generate closed hyperbolic triangle path for selection and fill
			// console.log(
			// 	`${printFrac(tri.v1.f)}-${printFrac(tri.v2.f)}-${printFrac(tri.v3.f)}: `,
			// 	trianglePath
			// );
			// console.log(triPaths);
			// console.log(closedPathFromArcs(...triPaths));
			trianglePaths.push({
				id: `${printFrac(tri.v1.f)}-${printFrac(tri.v2.f)}-${printFrac(tri.v3.f)}`,
				path: closedPathFromArcs(...(triPaths as [string, string, string]))
			});
		}

		const vertices = Object.entries(vertexSet).map(([frac, { x, y, labelShift, fpt }]) => {
			// Compute angle θ from origin to vertex
			const theta = Math.atan2(y, x);
			// Place label at offset r in direction θ from vertex
			const labelX = x + labelShift * Math.cos(theta);
			const labelY = y + labelShift * Math.sin(theta);

			return {
				frac,
				x,
				y,
				labelX,
				labelY,
				fpt
			};
		});

		return { vertices, arcPaths, trianglePaths };
	}

	const renderData = $derived(generateRenderData());
	const selectedVertex = $derived(selected.filter((id) => id !== null));
	// $inspect(vertices);
</script>

<div class="svg-wrapper">
	<svg viewBox="-1.4 -1.4 2.8 2.8" preserveAspectRatio="xMidYMid meet" bind:this={svg}>
		<!-- Boundary circle of Poincaré disk -->
		<circle cx="0" cy="0" r="1" stroke="black" stroke-width="0.01" fill="none" />

		<!-- Clickable Triangle Areas -->
		{#each renderData.trianglePaths as tri (tri.id)}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<path
				d={tri.path}
				fill={selectedTriangle === tri.id ? 'yellow' : 'transparent'}
				onclick={() => onSelectTriangle(tri.id)}
				style="cursor: pointer;"
			/>
		{/each}

		<!-- Hyperbolic Edges -->
		{#each renderData.arcPaths as a (a.edgeKey)}
			<path d={`M ${a.path}`} stroke="#0000ff" stroke-width="0.005" fill="none" />}
		{/each}

		<!-- Vertices as red dots -->
		{#each renderData.vertices as vertex (vertex.frac)}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<g onclick={() => onSelectVertex(vertex.frac)} style="cursor: pointer;">
				<circle cx={vertex.x} cy={vertex.y} r="0.015" fill="#44aa00" />

				{#if selectedVertex.includes(vertex.frac)}
					<circle
						cx={vertex.x}
						cy={vertex.y}
						r="0.035"
						fill="none"
						stroke={selectedColor(vertex.frac)}
						stroke-width="0.01"
					/>
				{/if}

				<!-- Vertex label -->
				<text
					x={vertex.labelX}
					y={vertex.labelY}
					font-size="0.05"
					fill="#000"
					text-anchor="middle"
					dominant-baseline="middle"
					style:text-decoration={selectedVertex.includes(vertex.frac) ? 'underline' : ''}
					style:text-decoration-color={selectedVertex.includes(vertex.frac)
						? selectedColor(vertex.frac)
						: ''}
					style="text-decoration-thickness:3;"
					style:font-weight={selectedVertex.includes(vertex.frac) ? 'bolder' : ''}
				>
					{vertex.frac}
				</text>
			</g>
		{/each}
	</svg>
</div>

<style>
	.svg-wrapper {
		width: 100%;
		max-width: 800px;
		/* margin: 0 auto; */
		aspect-ratio: 1;
		background: #fafafa;
		border: 1px solid black;
	}

	svg {
		width: 100%;
		height: 100%;
		display: block;
	}
</style>
