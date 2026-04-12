// Möbius transformations and hyperbolic disk utilities
import { SternBrocotPath, type FareyPoint } from './farey';

export interface Complex {
	re: number;
	im: number;
}

const AngleOfZero = -1 / 6; // use number of Math.PI

// Compute the angle for a fraction on the unit circle using Stern-Brocot tree
export function fractionToAngle(p: number, q: number): number {
	// Handle special cases
	if (q === 0) return (AngleOfZero - 2 / 3) * Math.PI;
	if (p === 0) return AngleOfZero * Math.PI;

	// 1<<i is the same as 2^i = 2 ** i = 1<<i
	const angleShift = SternBrocotPath(p, q).reduce((s, c, i) => s + c / (1 << i), 0);

	const pos = p > 0;
	const base = AngleOfZero + (pos ? 2 / 3 : -1 / 3);
	const scale = pos ? 1 / 3 : 1 / 6;
	return (base + scale * angleShift) * Math.PI;
}

function fareyPtToAngle(pt: FareyPoint): number {
	// Handle special cases
	if (pt.f.q === 0) return (AngleOfZero - 2 / 3) * Math.PI;
	if (pt.f.p === 0) return AngleOfZero * Math.PI;

	// 1<<i is the same as 2^i = 2 ** i = 1<<i
	const angleShift = pt.SBpath.reduce((s, c, i) => s + c / (1 << i), 0);

	const pos = pt.f.p > 0;
	const base = AngleOfZero + (pos ? 2 / 3 : -1 / 3);
	const scale = pos ? 1 / 3 : 1 / 6;
	return (base + scale * angleShift) * Math.PI;
}

// Project a fraction to the Poincaré disk
export function projectFareyPtToDisk(pt: FareyPoint): Complex {
	// const angle = fractionToAngle(p, q);
	const angle = fareyPtToAngle(pt);
	// In Poincaré model, vertices lie on the unit circle
	return { re: Math.cos(angle), im: Math.sin(angle) };
}

export function mobiusTransform(
	z: Complex,
	a: Complex,
	b: Complex,
	c: Complex,
	d: Complex
): Complex {
	// (a*z + b) / (c*z + d)
	const numRe = a.re * z.re - a.im * z.im + b.re;
	const numIm = a.re * z.im + a.im * z.re + b.im;
	const denRe = c.re * z.re - c.im * z.im + d.re;
	const denIm = c.re * z.im + c.im * z.re + d.im;

	const denMagSq = denRe * denRe + denIm * denIm;
	return {
		re: (numRe * denRe + numIm * denIm) / denMagSq,
		im: (numIm * denRe - numRe * denIm) / denMagSq
	};
}

export function geodesicArcForSVG(z1: Complex, z2: Complex): string {
	// SVG syntax: A rx ry x-axis-rotation large-arc-flag=0 sweep-flag x y
	// data needed to be computed: start point, end point, radius, 2 boolean flags

	const x1 = z1.re,
		y1 = z1.im,
		x2 = z2.re,
		y2 = z2.im;
	// tolerance test if z1 z2 are opposite point first
	const eps = 1e-6;
	if (Math.abs(x1 + x2) < eps && Math.abs(y1 + y2) < eps) return `M ${x1} ${y1} L ${x2} ${y2}`;

	//compute center (in Complex)
	const l = x1 * y2 - x2 * y1;
	const c = { re: (y2 - y1) / l, im: (x1 - x2) / l };
	//compute radius
	const r = Math.sqrt((x1 - c.re) ** 2 + (y1 - c.im) ** 2);
	//compute angles
	const theta1 = Math.atan2(y1 - c.im, x1 - c.re);
	const theta2 = Math.atan2(y2 - c.im, x2 - c.re);
	//normalise to (-pi,pi)
	let diff = theta2 - theta1;
	if (diff > Math.PI) diff -= 2 * Math.PI;
	if (diff < -Math.PI) diff += 2 * Math.PI;
	const sweepFlag = diff > 0 ? 0 : 1;
	return `${x1} ${-y1} A ${r} ${r} 0 0 ${sweepFlag} ${x2} ${-y2}`;
}
