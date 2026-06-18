import { describe, expect, test } from 'bun:test';
import {
	alignBands,
	buildCfBandRows,
	convergentsFromCf,
	countBandCrossings,
	displayCopiesForSequence,
	formatFractionCompact,
	parseIntegerSequence
} from '../src/lib/math/cf-band-sequence';

describe('continued-fraction band sequence helpers', () => {
	test('parses comma and space separated integers', () => {
		expect(parseIntegerSequence('0; 1, 1 1,2')).toEqual([0, 1, 1, 1, 2]);
	});

	test('computes all convergents for [0;1,1,1,2]', () => {
		const labels = convergentsFromCf([0, 1, 1, 1, 2]).map(formatFractionCompact);
		expect(labels).toEqual(['0', '1', '1/2', '2/3', '5/8']);
	});

	test('normalizes negative denominators', () => {
		const labels = convergentsFromCf([1, -2, 3]).map(formatFractionCompact);
		expect(labels).toEqual(['1', '1/2', '2/5']);
	});

	test('builds rows and aligns fixture bands by maximal overlap', () => {
		const rows = buildCfBandRows([0, 1, 1, 1, 2]);
		expect(rows.map((row) => row.fractionLabel)).toEqual(['0', '1', '1/2', '2/3', '5/8']);
		for (let i = 1; i < rows.length; i++) {
			const alignment = alignBands(rows[i - 1].letters, rows[i].letters);
			expect(alignment.overlapLength).toBeGreaterThanOrEqual(0);
		}
		expect(alignBands(rows[2].letters, rows[3].letters).containsPrevious).toBe(true);
		expect(alignBands(rows[3].letters, rows[4].letters).containsPrevious).toBe(true);
		expect(rows.map((row) => row.displayCopies)).toEqual([8, 8, 4, 2, 1]);
	});

	test('assigns copies backwards from the final two displayed lengths', () => {
		expect(displayCopiesForSequence([2, 2, 4, 6, 16])).toEqual([8, 8, 4, 2, 1]);
		expect(displayCopiesForSequence([4])).toEqual([1]);
		expect(displayCopiesForSequence([])).toEqual([]);
	});

	test('counts one crossing from band 0 to band 1 in the fixture', () => {
		const [zero, one] = buildCfBandRows([0, 1]);
		const count = countBandCrossings(zero.fraction, one.fraction, zero.band, one.band);
		expect(count.identical).toBe(false);
		expect(count.positive + count.negative).toBe(1);
	});

	test('detects identical bands up to rotation', () => {
		const [zero] = buildCfBandRows([0]);
		const count = countBandCrossings(zero.fraction, zero.fraction, zero.band, 'y|b^');
		expect(count.identical).toBe(true);
	});
});
