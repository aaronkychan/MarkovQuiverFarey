import { describe, expect, test } from 'bun:test';
import {
	applyTransformSequence,
	CC,
	getAnimationParameter,
	type TransformParameter
} from '../src/lib/math/hyperbolic';
import type { Complex } from '../src/lib/math/types';

function point(angle: number): Complex {
	return CC.fromPolar(1, angle);
}

function expectComplexClose(actual: Complex, expected: Complex) {
	expect(actual.re).toBeCloseTo(expected.re, 5);
	expect(actual.im).toBeCloseTo(expected.im, 5);
}

describe('hyperbolic transform composition', () => {
	test('centers a second triangle in the already transformed tessellation', () => {
		const target = [point(-0.4), point(1.7), point(3.8)] as const;
		const firstTriangle = [point(0.2), point(2.1), point(4.4)] as const;
		const secondTriangle = [point(0.8), point(2.7), point(5.2)] as const;
		const transforms: TransformParameter[] = [getAnimationParameter(...firstTriangle, ...target)];
		const transformedSecond = secondTriangle.map((z) => applyTransformSequence(z, transforms)) as [
			Complex,
			Complex,
			Complex
		];
		transforms.push(getAnimationParameter(...transformedSecond, ...target));

		secondTriangle.forEach((z, index) => {
			expectComplexClose(applyTransformSequence(z, transforms), target[index]);
		});
	});
});
