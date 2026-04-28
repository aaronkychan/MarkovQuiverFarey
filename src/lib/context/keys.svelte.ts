import { generateFareyTriangles, printFrac } from '$lib/math/farey';
import { FareyPointToCFData } from '$lib/math/markov';
import type { FareyPoint, FareyTriangle, PointData } from '$lib/math/types';

export const selectedVertexKey = Symbol('selectedVertex');

export const selectColor = ['#d6ad00', '#ff0000'];

export class DataState {
	points = $state<FareyPoint[]>([]);
	triangles = $state<FareyTriangle[]>([]);
	inComparison = $state<boolean>(true);

	selecting = 0;

	selected = $state<(string | null)[]>([null, null]);
	selectedPoints: FareyPoint[] = $derived.by(() => {
		const selectedIds = this.selected.filter((id) => id !== null) as string[];
		if (selectedIds.length === 0) return [];
		return this.points.filter((p) => selectedIds.includes(printFrac(p.f)));
	});

	selectedPointsData: (PointData | null)[] = $derived(
		this.selected.map((id) => (id !== null ? FareyPointToCFData(this.getPoint(id)!) : null))
	);

	constructor(depth: number) {
		const { triangles, points } = generateFareyTriangles(depth);
		this.points = points;
		this.triangles = triangles;
	}

	// Sets the first selected point in the array.
	select(id: string | null) {
		this.selected[this.selecting] = id;
		if (this.selecting === 0) this.selecting = 1;
	}

	reselect(idx: number) {
		this.selecting = idx;
		// this.selected[idx] = null;
	}

	isBothSelected() {
		return this.selected[0] !== null && this.selected[1] !== null;
	}

	clearSelection(idx: number = -1) {
		if (idx === 0 || idx === 1) {
			this.selected[idx] = null;
		} else {
			this.selected = [null, null];
		}
		this.selecting = 0;
	}

	getPoint(id: string | null) {
		return this.points.find((p) => printFrac(p.f) === id) ?? null;
	}
}
