import { fareyDepth, generateFareySequence, printFrac } from './farey';
import { findBandCrossings, invertString } from './markov';
import { CrossingDirection, EndType, type Fraction } from './types';

export interface CfBandRow {
	index: number;
	cf: number[];
	cfLines: string[];
	fraction: Fraction;
	fractionLabel: string;
	band: string;
	letters: string[];
	offset: number;
	displayCopies: number;
}

export interface BandAlignment {
	offset: number;
	overlapLength: number;
	previousStart: number;
	currentStart: number;
	containsPrevious: boolean;
}

export interface BandCrossingCount {
	positive: number;
	negative: number;
	identical: boolean;
}

export function parseIntegerSequence(input: string): number[] {
	const trimmed = input.trim();
	if (!trimmed) throw new Error('Enter at least one integer.');

	const parts = trimmed.split(/[\s,;]+/).filter(Boolean);
	const values = parts.map((part) => {
		if (!/^[+-]?\d+$/.test(part)) {
			throw new Error(`Invalid integer: ${part}`);
		}
		return Number(part);
	});

	if (!values.every(Number.isSafeInteger)) {
		throw new Error('All entries must be safe integers.');
	}
	return values;
}

export function convergentsFromCf(cf: number[]): Fraction[] {
	if (cf.length === 0) throw new Error('Enter at least one integer.');

	let pPrev2 = 0;
	let pPrev1 = 1;
	let qPrev2 = 1;
	let qPrev1 = 0;
	const result: Fraction[] = [];

	for (const a of cf) {
		const p = a * pPrev1 + pPrev2;
		const q = a * qPrev1 + qPrev2;
		if (q === 0) {
			throw new Error('An intermediate convergent has denominator 0.');
		}
		result.push(normalizeDenominator({ p, q }));
		pPrev2 = pPrev1;
		pPrev1 = p;
		qPrev2 = qPrev1;
		qPrev1 = q;
	}

	return result;
}

export function formatFractionCompact(fraction: Fraction): string {
	return fraction.q === 1 ? String(fraction.p) : printFrac(fraction);
}

export function formatContinuedFractionLines(cf: number[]): string[] {
	if (cf.length === 0) return [];
	if (cf.length === 1) return [`[${cf[0]}]`];

	const lines = [`[${cf[0]};`];
	const tail = cf.slice(1);
	for (let start = 0; start < tail.length; start += 5) {
		const end = Math.min(start + 5, tail.length);
		const isLast = end === tail.length;
		lines.push(`${tail.slice(start, end).join(', ')}${isLast ? ']' : ','}`);
	}
	return lines;
}

export function bandForFraction(fraction: Fraction): string {
	const normalized = normalizeDenominator(fraction);
	const depth = Math.max(0, fareyDepth(normalized.p, normalized.q));
	const points = generateFareySequence(depth);
	const key = printFrac(normalized);
	const point = points.find((p) => printFrac(p.f) === key);
	if (!point) {
		throw new Error(`Could not construct band for ${formatFractionCompact(normalized)}.`);
	}
	return point.band;
}

export function buildCfBandRows(cf: number[]): CfBandRow[] {
	const convergents = convergentsFromCf(cf);
	const rows = convergents.map((fraction, index) => {
		const band = bandForFraction(fraction);
		return {
			index,
			cf: cf.slice(0, index + 1),
			cfLines: formatContinuedFractionLines(cf.slice(0, index + 1)),
			fraction,
			fractionLabel: formatFractionCompact(fraction),
			band,
			letters: splitWord(band),
			offset: 0,
			displayCopies: 1
		};
	});

	const offsets = [0];
	for (let index = 1; index < rows.length; index++) {
		const previous = rows[index - 1];
		const alignment = alignBands(previous.letters, rows[index].letters);
		if (!isExceptionalConvergent(previous.fraction) && !alignment.containsPrevious) {
			throw new Error(
				`Band ${previous.fractionLabel} is not a subword of band ${rows[index].fractionLabel}.`
			);
		}
		offsets.push(offsets[index - 1] + alignment.offset);
	}

	const displayCopies = displayCopiesForSequence(rows.map((row) => row.letters.length));
	return rows.map((row, index) => ({
		...row,
		offset: offsets[index],
		displayCopies: displayCopies[index]
	}));
}

export function displayCopiesForSequence(lengths: number[]): number[] {
	if (lengths.length === 0) return [];
	const copies = Array(lengths.length).fill(1);
	if (lengths.length === 1) return copies;

	copies[lengths.length - 2] = 2;
	const targetLength = Math.max(
		lengths[lengths.length - 1],
		lengths[lengths.length - 2] * copies[lengths.length - 2]
	);
	for (let index = lengths.length - 3; index >= 0; index--) {
		copies[index] = Math.max(1, Math.floor(targetLength / lengths[index]));
	}
	return copies;
}

export function alignBands(previous: string[] | string, current: string[] | string): BandAlignment {
	const prev = Array.isArray(previous) ? previous : splitWord(previous);
	const curr = Array.isArray(current) ? current : splitWord(current);
	const currentStart = indexOfSubarray(curr, prev);
	if (currentStart >= 0) {
		return {
			offset: -currentStart,
			overlapLength: prev.length,
			previousStart: 0,
			currentStart,
			containsPrevious: true
		};
	}

	const previousStart = indexOfSubarray(prev, curr);
	if (previousStart >= 0) {
		return {
			offset: previousStart,
			overlapLength: curr.length,
			previousStart,
			currentStart: 0,
			containsPrevious: false
		};
	}

	let best = { previousStart: 0, currentStart: 0, overlapLength: 0 };
	for (let i = 0; i < prev.length; i++) {
		for (let j = 0; j < curr.length; j++) {
			let len = 0;
			while (i + len < prev.length && j + len < curr.length && prev[i + len] === curr[j + len]) {
				len++;
			}
			if (len > best.overlapLength) {
				best = { previousStart: i, currentStart: j, overlapLength: len };
			}
		}
	}

	return {
		offset: best.previousStart - best.currentStart,
		...best,
		containsPrevious: false
	};
}

export function computeStackOffsets(bands: string[][]): number[] {
	if (bands.length === 0) return [];
	const offsets = [0];
	for (let i = 1; i < bands.length; i++) {
		const alignment = alignBands(bands[i - 1], bands[i]);
		offsets.push(offsets[i - 1] + alignment.offset);
	}
	return offsets;
}

export function countBandCrossings(
	_a: Fraction,
	_b: Fraction,
	bandA: string,
	bandB: string
): BandCrossingCount {
	const lettersA = primitivePeriod(splitWord(bandA));
	const lettersB = primitivePeriod(splitWord(bandB));
	if (isSameCyclicBand(lettersA, lettersB)) {
		return { positive: 0, negative: 0, identical: true };
	}

	const crossings = findBandCrossings(
		{ left: '', core: bandA, right: '', type: EndType.pureBand },
		{ left: '', core: bandB, right: '', type: EndType.pureBand }
	);
	return {
		positive: crossings.filter((crossing) => crossing.direction === CrossingDirection.positive)
			.length,
		negative: crossings.filter((crossing) => crossing.direction === CrossingDirection.negative)
			.length,
		identical: false
	};
}

export function formatBandCrossingCount(count: BandCrossingCount): string {
	return count.identical ? 'identical' : `(+${count.positive}, -${count.negative})`;
}

export function splitWord(word: string): string[] {
	return word.split('|').filter(Boolean);
}

function normalizeDenominator(fraction: Fraction): Fraction {
	if (fraction.q < 0) return { p: -fraction.p, q: -fraction.q };
	return fraction;
}

function isExceptionalConvergent(fraction: Fraction): boolean {
	return (
		fraction.q === 0 ||
		(fraction.p === 0 && fraction.q === 1) ||
		(fraction.p === 1 && fraction.q === 1)
	);
}

function indexOfSubarray(haystack: string[], needle: string[]): number {
	if (needle.length === 0 || needle.length > haystack.length) return -1;
	for (let i = 0; i <= haystack.length - needle.length; i++) {
		let found = true;
		for (let j = 0; j < needle.length; j++) {
			if (haystack[i + j] !== needle[j]) {
				found = false;
				break;
			}
		}
		if (found) return i;
	}
	return -1;
}

function primitivePeriod(word: string[]): string[] {
	for (let len = 1; len <= word.length; len++) {
		if (word.length % len !== 0) continue;
		const period = word.slice(0, len);
		let matches = true;
		for (let i = 0; i < word.length; i++) {
			if (word[i] !== period[i % len]) {
				matches = false;
				break;
			}
		}
		if (matches) return period;
	}
	return word;
}

function isSameCyclicBand(a: string[], b: string[]): boolean {
	if (a.length !== b.length) return false;
	const doubled = [...b, ...b];
	if (indexOfSubarray(doubled, a) >= 0) return true;
	const inverseB = splitWord(invertString(b.join('|')));
	return indexOfSubarray([...inverseB, ...inverseB], a) >= 0;
}
