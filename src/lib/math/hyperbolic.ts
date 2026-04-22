// Möbius transformations and hyperbolic disk utilities
import { SternBrocotPath, fareyZero, fareyOne, fareyInf, type FareyPoint } from './farey';

export interface Complex {
	re: number;
	im: number;
}

export const CC = {
	add: (a: Complex, b: Complex) => ({ re: a.re + b.re, im: a.im + b.im }),
	sub: (a: Complex, b: Complex) => ({ re: a.re - b.re, im: a.im - b.im }),
	mul: (a: Complex, b: Complex) => ({
		re: a.re * b.re - a.im * b.im,
		im: a.re * b.im + a.im * b.re
	}),
	div: (a: Complex, b: Complex) => {
		const d = b.re * b.re + b.im * b.im;
		return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
	},
	negate: (z: Complex) => ({ re: -z.re, im: -z.im }),
	conj: (z: Complex) => ({ re: z.re, im: -z.im }),
	expi: (t: number) => ({ re: Math.cos(t), im: Math.sin(t) }),
	scale: (z: Complex, s: number) => ({ re: z.re * s, im: z.im * s }),
	fromPolar: (r: number, theta: number) => ({ re: r * Math.cos(theta), im: r * Math.sin(theta) }),
	Arg: (z: Complex) => Math.atan2(z.im, z.re)
};

export interface TransformParameter {
	a: Complex;
	alpha: number;
}

const AngleOfZero = -1 / 6; // use number of Math.PI

//
//#region Farey to geometry

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
	// return { re: Math.cos(angle), im: Math.sin(angle) };
	return CC.fromPolar(1, angle);
}

const ptZero = projectFareyPtToDisk(fareyZero);
const ptOne = projectFareyPtToDisk(fareyOne);
const ptInf = projectFareyPtToDisk(fareyInf);

//
//#region Animation stuff
//  includes computation of cross ratio and Mobius transformation needed to animate

// cross ratio
function crossratio(z: Complex, z1: Complex, z2: Complex, z3: Complex): Complex {
	return CC.div(CC.mul(CC.sub(z, z1), CC.sub(z2, z3)), CC.mul(CC.sub(z, z3), CC.sub(z2, z1)));
}

// inverse cross ratio
function crossratioInv(w: Complex, w1: Complex, w2: Complex, w3: Complex): Complex {
	const A = CC.sub(w2, w3);
	const B = CC.sub(w2, w1);
	const num = CC.sub(CC.mul(w, CC.mul(w3, B)), CC.mul(w1, A));
	const den = CC.sub(CC.mul(w, B), A);
	return CC.div(num, den);
}

// use cross ratio to figure out what center a and rotation angle alpha we have
// the final transformation will map current (z1, z2, z3) to (w1, w2, w3)
// so in Farey context, we want w1=point of 0, w2=point of 1, w3=point of infinity
export function getAnimationParameter(
	z1: Complex,
	z2: Complex,
	z3: Complex,
	w1: Complex = ptZero,
	w2: Complex = ptOne,
	w3: Complex = ptInf
): TransformParameter {
	// logic:
	// R(z) = crossratio(z,z1,z2,z3), S(w) = crossratio(w,w1,w2,w3)
	// T(z) = S^{-1}( R(z) ) = exp(i \alpha)\frac{z-a}{1-\bar{a}z}
	// then \alpha = Arg(T'(0)) and a=-exp(i\alpha)T(0)
	// In theory, alpha = Arg( w_1 \frac{1-\bar{a}z_1}{z_1-a} )
	// and a can be solved from using w_1 = \frac{-T(0)}{a}\frac{z_1-a}{1-\bar{a}z_1}
	// but computationally it is probably cheaper to use numerical derivative in the following
	// probe at z = 0
	const z0: Complex = { re: 0, im: 0 };
	const t0 = crossratio(z0, z1, z2, z3);
	const w0 = crossratioInv(t0, w1, w2, w3); // w0 = T(0)

	// finite difference for derivative
	const eps = 1e-6;
	const z_eps: Complex = { re: eps, im: 0 };
	const t_eps = crossratio(z_eps, z1, z2, z3);
	const w_eps = crossratioInv(t_eps, w1, w2, w3);
	const dT = CC.div(CC.sub(w_eps, w0), { re: eps, im: 0 });

	// extract rotation
	const alpha = Math.atan2(dT.im, dT.re);
	return { a: CC.negate(CC.mul(CC.expi(-alpha), w0)), alpha };
}

// function for animating circle-preserving Mobius transformation
// f_t(z) = exp(i \alpha t) \frac{z-at}{1-\bar{a}tz}
export function f_t(z: Complex, param: TransformParameter, t: number): Complex {
	const at = CC.scale(param.a, t);
	const num = CC.sub(z, at);
	const den = CC.sub({ re: 1, im: 0 }, CC.mul(CC.conj(at), z));
	const frac = CC.div(num, den);

	return CC.mul(CC.expi(param.alpha * t), frac);
}

//
//#region Output to SVG
//
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
