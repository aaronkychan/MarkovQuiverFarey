import { arrows, letterColor } from './markov';

export interface BandSegment {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	color: string;
	index: number;
}

export interface BandCorner {
	x: number;
	y: number;
	label: number;
	isTop: boolean;
}

export interface BandGeometry {
	segments: BandSegment[];
	corners: BandCorner[];
	viewBox: {
		x: number;
		y: number;
		w: number;
		h: number;
	};
}

export function buildBandGeometry(letters: string[], offset: number = 0): BandGeometry | null {
	if (letters.length === 0) return null;

	let cx = offset;
	let cy = 0;
	const segments: BandSegment[] = [];
	const corners: BandCorner[] = [];

	for (let i = 0; i < letters.length; i++) {
		const char = letters[i];
		const isDirected = !char.includes('^');
		const base = char.replace('^', '') as keyof typeof arrows;
		const srctgt = arrows[base];
		if (!srctgt) continue;

		const x1 = cx;
		const y1 = cy;
		cx += 1;
		cy += isDirected ? 1 : -1;

		segments.push({
			x1,
			y1,
			x2: cx,
			y2: cy,
			color: letterColor(base),
			index: i
		});

		if (i < letters.length - 1) {
			const nextIsDirected = !letters[i + 1].includes('^');
			if (isDirected !== nextIsDirected) {
				corners.push({
					x: cx,
					y: cy,
					label: Math.abs(isDirected ? srctgt.tgt : srctgt.src),
					isTop: !isDirected && nextIsDirected
				});
			}
		}
	}

	const allX = [offset, ...segments.flatMap((segment) => [segment.x1, segment.x2])];
	const allY = [0, ...segments.flatMap((segment) => [segment.y1, segment.y2])];
	const minX = Math.min(...allX);
	const maxX = Math.max(...allX);
	const minY = Math.min(...allY);
	const maxY = Math.max(...allY);

	return {
		segments,
		corners,
		viewBox: {
			x: minX - 0.5,
			y: minY - 1.2,
			w: maxX - minX + 1,
			h: maxY - minY + 2.5
		}
	};
}
