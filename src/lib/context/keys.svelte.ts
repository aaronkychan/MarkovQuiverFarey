import { type FareyPoint, printFrac } from '$lib/math/farey';

export const selectedVertexKey = Symbol('selectedVertex');

export class VertexState {
	points = $state<FareyPoint[]>([]);
	selected = $state<string | null>(null);

	selectedPoint = $derived.by(() => {
		if (!this.selected) return null;
		return this.points.find((p) => printFrac(p.f) === this.selected) ?? null;
	});

	select(id: string | null) {
		this.selected = id;
	}
}
