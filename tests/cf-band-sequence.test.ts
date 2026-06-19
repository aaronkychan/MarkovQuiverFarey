import { describe, expect, test } from 'bun:test';
import {
	alignBands,
	bandForFraction,
	buildCfBandRows,
	convergentsFromCf,
	countBandCrossings,
	displayCopiesForSequence,
	formatContinuedFractionLines,
	formatFractionCompact,
	parseIntegerSequence
} from '../src/lib/math/cf-band-sequence';
import { findBandCrossings } from '../src/lib/math/markov';
import { EndType } from '../src/lib/math/types';

describe('continued-fraction band sequence helpers', () => {
	test('parses comma and space separated integers', () => {
		expect(parseIntegerSequence('0; 1, 1 1,2')).toEqual([0, 1, 1, 1, 2]);
	});

	test('computes all convergents for [0;1,1,1,2]', () => {
		const labels = convergentsFromCf([0, 1, 1, 1, 2]).map(formatFractionCompact);
		expect(labels).toEqual(['0', '1', '1/2', '2/3', '5/8']);
	});

	test('formats continued fractions with one semicolon and five tail terms per line', () => {
		expect(formatContinuedFractionLines([3])).toEqual(['[3]']);
		expect(formatContinuedFractionLines([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])).toEqual([
			'[0;',
			'1, 2, 3, 4, 5,',
			'6, 7, 8, 9, 10,',
			'11]'
		]);
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

	test('assigns each consecutive fixture pair to only one crossing direction', () => {
		const rows = buildCfBandRows([0, 1, 1, 1, 2]);
		const counts = [];
		for (let index = 0; index < rows.length - 1; index++) {
			const first = rows[index];
			const second = rows[index + 1];
			const count = countBandCrossings(
				first.fraction,
				second.fraction,
				first.band,
				second.band
			);
			counts.push([count.positive, count.negative]);
		}

		expect(counts).toEqual([
			[1, 0],
			[0, 3],
			[1, 0],
			[0, 1]
		]);
	});

	test('counts six positive and one negative crossing from 3/4 to 4/3', () => {
		const first = { p: 3, q: 4 };
		const second = { p: 4, q: 3 };
		const count = countBandCrossings(
			first,
			second,
			bandForFraction(first),
			bandForFraction(second)
		);

		expect(count).toEqual({ positive: 6, negative: 1, identical: false });
	});

	test('detects identical bands up to rotation', () => {
		const [zero] = buildCfBandRows([0]);
		const count = countBandCrossings(zero.fraction, zero.fraction, zero.band, 'y|b^');
		expect(count.identical).toBe(true);
	});

	test('builds one wrapped crossing diagram using complete band copies', () => {
		const firstBand = bandForFraction({ p: 2, q: 3 });
		const secondBand = bandForFraction({ p: 5, q: 8 });
		const [crossing] = findBandCrossings(
			{ left: '', core: firstBand, right: '', type: EndType.pureBand },
			{ left: '', core: secondBand, right: '', type: EndType.pureBand }
		);

		expect(crossing).toBeDefined();
		expect(crossing.start1).toBeGreaterThan(0);
		expect(crossing.start2).toBeGreaterThan(0);
		expect(crossing.start1 + crossing.len).toBeLessThan(crossing.seqs[0].length);
		expect(crossing.start2 + crossing.len).toBeLessThan(crossing.seqs[1].length);
	});
});
