// Farey sequence and tessellation utilities

import { inf2, mInf3, one2, zero1, one1, zero3 } from './markov';
import type { Fraction, FareyTriangle, FareyPoint } from './types';

export const fareyZero = {
		f: { p: 0, q: 1 },
		parents: [],
		depth: 0,
		cf: [0],
		negcf: [0],
		SBpath: [],
		band: zero1
	},
	fareyOne = {
		f: { p: 1, q: 1 },
		parents: [],
		depth: 0,
		cf: [1],
		negcf: [1],
		SBpath: [],
		band: one2
	},
	fareyInf = {
		f: { p: 1, q: 0 },
		parents: [],
		depth: 0,
		cf: [],
		negcf: [],
		SBpath: [],
		band: inf2
	};
const quadrantToBoundary = [
	[fareyZero, { ...fareyOne, band: one1 }],
	[fareyOne, fareyInf],
	[
		{ ...fareyInf, f: { p: -1, q: 0 }, band: mInf3 },
		{ ...fareyZero, band: zero3 }
	]
];

function gcd(a: number, b: number): number {
	return b === 0 ? a : gcd(b, a % b);
}

export const printFrac = (f: Fraction): string => `${f.q === 0 ? 1 : f.p}/${f.q}`;
export const printPositiveCFrac = (cf: number[]): string =>
	cf.length > 0 ? `[ ${cf[0]} ; ${cf.slice(1).join(', ')} ]` : '[;]';
export const printNegativeCFrac = (cf: number[]): string =>
	cf.length > 0 ? `[[ ${cf[0]} ; ${cf.slice(1).join(', ')} ]]` : '[[;]]';

// effectively Euclidean algorithm
// 0/1 -> [0], 1/1 -> [1], 1/0 -> []
export function continued_fraction(p: number, q: number): number[] {
	const a = [];
	while (q) {
		const t = Math.floor(p / q);
		a.push(t);
		[p, q] = [q, p - t * q];
	}
	return a;
}

export function CFtoRational(cf: number[], negative: boolean = false): Fraction {
	if (cf.length === 0) return { p: 1, q: 0 };
	let hPrev2 = 0; // h_{i-2}
	let hPrev1 = 1; // h_{i-1}
	let kPrev2 = negative ? -1 : 1; // k_{i-2}
	let kPrev1 = 0; // k_{i-1}

	for (const a of cf) {
		const h = a * hPrev1 + (negative ? -hPrev2 : hPrev2);
		const k = a * kPrev1 + (negative ? -kPrev2 : kPrev2);

		// Update for next iteration
		hPrev2 = hPrev1;
		hPrev1 = h;
		kPrev2 = kPrev1;
		kPrev1 = k;
	}

	return {
		p: hPrev1,
		q: kPrev1
	};
}

// return continued fraction [a_0; a_1]
export function normalizeCF(cf: number[]): number[] {
	if (cf.length === 0) return cf;
	if (cf[0] > 0) {
		return cf.length % 2 === 1 ? cf : ((cf[cf.length] -= 1), cf.push(1), cf);
	} else {
		return cf.length % 2 === 0 ? cf : ((cf[cf.length] -= 1), cf.push(1), cf);
	}
}

function regularCFToNegativeForLargeQ(cf: number[]): number[] {
	if (cf.length === 0) return [];
	if (cf[0] <= 0) {
		throw new Error('Rational number needs to be >1 to translate regular CF to negative');
	}
	if (cf.length === 1) return cf;

	const ncf = normalizeCF(cf); // ncf.length is even
	let res: number[] = [];
	for (let i = 0; i < ncf.length / 2; i = i + 2) {
		res.push(ncf[i] + (i == 0 ? 1 : 2));
		res = res.concat(new Array(ncf[i + 1] - 1).fill(2));
	}
	return res;
}

export function negative_continued_fraction(
	p: number,
	q: number,
	cf: number[] | null = null
): number[] {
	let res: number[] = [];
	if (p == 0) return [0];
	if (q == 0) return [];
	if (p == 1 && q == 1) return [1];

	// console.log(`Running negative_continued_fraction: p/q=${p}/${q} , cf=[${cf}]`);

	if (p > 0) {
		if (p > q) {
			return regularCFToNegativeForLargeQ(cf === null ? continued_fraction(p, q) : cf);
		} else {
			res = [0, ...negative_continued_fraction(q, p)];
		}
	} else {
		if (q == 1) return [p];
		cf = cf === null ? continued_fraction(p, q) : cf; // q \neq 1 => cf.length > 1, so cf[1] is fine
		const cf2 =
			cf[1] > 1
				? [1, cf[1] - 1, ...cf.slice(2)]
				: cf.length === 2
					? []
					: [cf[2] + 1, ...cf.slice(3)];
		// console.log(` cf2=[${cf2}]`);
		res = [cf[0] + 1, ...regularCFToNegativeForLargeQ(cf2)];
	}
	return res;
}

export const fareyDepth = (p: number, q: number): number =>
	continued_fraction(p, q).reduce((sum, curr, i) => (i === 0 ? Math.abs(curr) : sum + curr), 0) - 1;

export const SternBrocotPath = (p: number, q: number): number[] => {
	const sign = Math.sign(p) || 1;
	const cf = continued_fraction(Math.abs(p), q);
	if (q == 0 || p == 0 || p == q) return [];
	return cf.flatMap((a, i) =>
		Array(a - (i === cf.length - 1 ? 1 : 0)).fill((i % 2 ? -1 : 1) * sign)
	);
};

function fareySum(a: Fraction, b: Fraction): Fraction {
	const p = a.p + b.p;
	const q = a.q + b.q;
	if (q === 0) return { p: 1, q: 0 };
	const g = Math.abs(gcd(p, q));
	return { p: p / g, q: q / g };
}

// quadrant is 0, 1, 2, where 0 means we generate vertices in the interval [0,1] up to given depth
// when 2, this means we generate in the negative numebrs: [1/0=-1/0,0/1]
export function generateFareyLayer(
	quadrant: number,
	depth: number,
	prevLayer: FareyPoint[] = []
): FareyPoint[] {
	const bdry = quadrantToBoundary[quadrant];
	if (depth === 0) return bdry;

	const prev = prevLayer.length == 0 ? generateFareyLayer(quadrant, depth - 1) : prevLayer;
	const result = [];
	for (let i = 0; i < prev.length - 1; i++) {
		result.push(prev[i]);
		const newFrac = fareySum(prev[i].f, prev[i + 1].f),
			newCF = continued_fraction(newFrac.p, newFrac.q);
		// console.log(`newFrac: ${newFrac.p}/${newFrac.q}, cf=[${newCF}]`);
		const newpt: FareyPoint = {
			f: newFrac,
			parents: [prev[i], prev[i + 1]],
			depth: depth,
			cf: newCF,
			negcf: negative_continued_fraction(newFrac.p, newFrac.q, newCF),
			SBpath: [],
			band: prev[i].band + '|' + prev[i + 1].band
		};
		//todo:  generate other MarkovStrings: adic, Prufer, p+, p-, etc.
		newpt.SBpath = SternBrocotPath(newpt.f.p, newpt.f.q);
		result.push(newpt);
	}
	result.push(bdry[1]);

	return result;
}

export function generateFareySequence(depth: number): FareyPoint[] {
	if (depth === 0) return [fareyZero, fareyOne, fareyInf];

	const result = [];
	for (const q of [0, 1, 2]) {
		const res = generateFareyLayer(q, depth);
		res.pop();
		result.push(...res);
	}

	return result;
}

function normalizeAndSortTriple(f1: FareyPoint, f2: FareyPoint, f3: FareyPoint): FareyPoint[] {
	let arr = [f1, f2, f3];

	// --- Step 1: normalize infinities ---
	const hasInfinity = arr.some((f) => f.f.q === 0);

	if (hasInfinity) {
		const hasPositive = arr.some((f) => f.f.q !== 0 && f.f.p / f.f.q > 0);

		arr = arr.map((f) => {
			if (f.f.q !== 0) return f;
			f.f = hasPositive ? { p: 1, q: 0 } : { p: -1, q: 0 };
			f.cf = continued_fraction(f.f.p, f.f.q);
			return f;
		});
	}

	// --- Step 2: numeric comparator ---
	const value = (f: Fraction) => {
		if (f.q === 0) return f.p > 0 ? Infinity : -Infinity;
		return f.p / f.q;
	};

	arr.sort((a, b) => value(a.f) - value(b.f));

	return arr;
}

function isFareyTriple(a: Fraction, b: Fraction, c: Fraction): boolean {
	// For Farey neighbors a/b and c/d: |ad - bc| = 1
	return (
		Math.abs(a.p * b.q - a.q * b.p) === 1 &&
		Math.abs(b.p * c.q - b.q * c.p) === 1 &&
		Math.abs(c.p * a.q - c.q * a.p) === 1
	);
}

// Generate Farey triangles up to given depth using Stern-Brocot tree
export function generateFareyTriangles(depth: number): {
	triangles: FareyTriangle[];
	points: FareyPoint[];
} {
	const triangles: FareyTriangle[] = [];
	const visited = new Set<string>();

	// Generate fractions up to given depth
	const points = generateFareySequence(depth);
	// console.log(points);

	// Find all Farey triangles
	for (let i = 0; i < points.length; i++) {
		for (let j = i + 1; j < points.length; j++) {
			for (let k = j + 1; k < points.length; k++) {
				const f1 = points[i];
				const f2 = points[j];
				const f3 = points[k];

				if (isFareyTriple(f1.f, f2.f, f3.f)) {
					const key = `${f1.f.p}/${f1.f.q}-${f2.f.p}/${f2.f.q}-${f3.f.p}/${f3.f.q}`;
					if (!visited.has(key)) {
						const [a, b, c] = normalizeAndSortTriple(f1, f2, f3);

						const key = `${a.f.p}/${a.f.q}-${b.f.p}/${b.f.q}-${c.f.p}/${c.f.q}`;
						if (!visited.has(key)) {
							triangles.push({ v1: a, v2: b, v3: c });
							visited.add(key);
						}
						visited.add(key);
					}
				}
			}
		}
	}

	return { triangles, points };
}

export function getAdjacentFractions(
	fraction: Fraction,
	sequence: Fraction[]
): [Fraction, Fraction] {
	const index = sequence.findIndex((f) => f.p === fraction.p && f.q === fraction.q);
	return [sequence[index - 1] || sequence[0], sequence[index + 1] || sequence[sequence.length - 1]];
}
