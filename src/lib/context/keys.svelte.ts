import {
	type FareyPoint,
	type FareyTriangle,
	generateFareyTriangles,
	printFrac
} from '$lib/math/farey';

export const selectedVertexKey = Symbol('selectedVertex');

export class DataState {
	points = $state<FareyPoint[]>([]);
	triangles = $state<FareyTriangle[]>([]);
	selected = $state<string | null>(null);

	selectedPoint = $derived.by(() => {
		if (!this.selected) return null;
		return this.points.find((p) => printFrac(p.f) === this.selected) ?? null;
	});

	constructor(depth: number) {
		const { triangles, points } = generateFareyTriangles(depth);
		this.points = points;
		this.triangles = triangles;
	}

	select(id: string | null) {
		this.selected = id;
	}

	getPoint(id: string | null) {
		return this.points.find((p) => printFrac(p.f) === id) ?? null;
	}
}
