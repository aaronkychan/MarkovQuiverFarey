import { printFrac, printNegativeCFrac, printPositiveCFrac } from './farey';
import {
	CrossingDirection,
	Direction,
	EndType,
	type Crossing,
	type FareyPoint,
	type gPosition,
	type InfString,
	type NamedInfString,
	type PointData,
	type Repeatance
} from './types';

export const arrows = {
	a: { src: 1, tgt: 2 },
	b: { src: 2, tgt: 3 },
	c: { src: 3, tgt: -1 },
	x: { src: -1, tgt: -2 },
	y: { src: -2, tgt: -3 },
	z: { src: -3, tgt: 1 }
};

const invertHalfedge = (v: number) => -v;

// 1st quadrant building block
export const zero1 = 'b^|y',
	one1 = 'z|c^';
export const one2 = 'c^|z',
	inf2 = 'a|x^';
export const mInf3 = 'a^|x',
	zero3 = 'y|b^';

export const FareySumBand = (b1: string, b2: string) => b1 + '|' + b2;

export const invertDirectedString = (s: string) =>
	s
		.split('|')
		.reverse()
		.map((l) => l + '^')
		.join('|');

export const invertString = (s: string) =>
	s
		.split('|')
		.reverse()
		.map((l) => (l[l.length - 1] === '^' ? l.slice(0, -1) : l + '^'))
		.join('|');

export const letterDirection = (s: string) =>
	s.length === 2 && s[1] === '^' ? Direction.inverse : Direction.directed;

export const blueLetters = new Set(['a', 'c', 'y']);
export const letterColor = (letter: string) =>
	blueLetters.has(letter.replace('^', '')) ? '#3b82f6' : '#f97316';

export const isLetter = (s: string): boolean => {
	const keys = Object.keys(arrows);
	const re = new RegExp(`^(${keys.join('|')})(\\^)?$`);
	return re.test(s);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isInfString(x: any): x is InfString {
	return typeof x === 'object' && x !== null && 'core' in x;
}

export function findTurnings(str: string | InfString | string[]): gPosition[] {
	const letters = isInfString(str)
		? [str.left, str.core, str.right].join('|').split('|')
		: typeof str === 'string'
			? str.split('|')
			: str;

	const res = [];
	for (let i = 0; i < letters.length; i++) {
		if (i < letters.length - 1) {
			if (letterDirection(letters[i]) !== letterDirection(letters[i + 1])) {
				const isDirected = letterDirection(letters[i]) === Direction.directed;
				const letter = (isDirected ? letters[i] : letters[i][0]) as keyof typeof arrows; // remove '^' if inverse
				res.push({
					vertex: isDirected ? Math.abs(arrows[letter].tgt) : Math.abs(arrows[letter].src), // maybe remove Math.abs?
					position: i,
					isTop: !isDirected
				});
			}
		}
	}
	return res;
}

export function invertInfString(str: InfString): InfString {
	const left = invertString(str.right),
		right = invertString(str.left);
	const type =
		str.type === EndType.band_confined
			? EndType.confined_band
			: str.type === EndType.confined_band
				? EndType.band_confined
				: str.type;
	return { type, left, right, core: invertString(str.core) };
}

export const hooks = {
	'1': 'a|b|c|x|y|z',
	'2': 'b|c|x|y|z|a',
	'3': 'c|x|y|z|a|b',
	'-1': 'x|y|z|a|b|c',
	'-2': 'y|z|a|b|c|x',
	'-3': 'z|a|b|c|x|y'
};

export const bandStrToInfString = (band: string): InfString => {
	return { left: '', core: band, right: '', type: EndType.pureBand };
};

export function rationalBandToStringCollec(band: string): NamedInfString[] {
	// ! assumption: band b starts with out-block "inverse|directed", ends with in-block "directed|inverse" (if length > 2)
	const letters = band.split('|');
	const outblock = [letters[0], letters[1]];
	const inblock = letters.slice(-2); // same as out if band is too short (i.e. slope = 0,1,infty)
	let dhookL = '';
	let dhookR = '';
	let uhookL = '';
	let uhookR = '';
	let u = '';
	let v = '';
	// use first letter to detect quadrant
	// const quadrant = letters[0] === 'b^' ? 0 : letters[0] === 'c^' ? 1 : 2;
	let top = (letters[0] === 'b^' ? '2' : letters[0] === 'c^' ? '3' : '1') as keyof typeof hooks;
	let mtop = String(invertHalfedge(Number(top))) as keyof typeof hooks;
	dhookL = invertDirectedString(hooks[top].slice(2));
	dhookR = hooks[mtop].slice(2);
	top = (letters[0] === 'b^' ? '1' : letters[0] === 'c^' ? '2' : '-3') as keyof typeof hooks;
	mtop = String(invertHalfedge(Number(top))) as keyof typeof hooks;
	uhookL = hooks[top].slice(0, -2);
	uhookR = invertDirectedString(hooks[mtop].slice(0, -2));
	if (letters.length < 4) {
		switch (top) {
			case '1': // (P1) slope 0 <=> band = 'b^|y' = zero1
				u = 'b^|a^|x|y';
				v = 'z|c^'; // mu_{ffPlus}^-( BcoC(band_0) ) = { adicLeft, adicRight, band|v|band }
				break;
			case '2': // slope 1
				u = 'c^|b^|y|z';
				v = 'a|x^';
				break;
			case '-3': // slope infty
				u = 'a^|z^|c|x';
				v = 'b|y^';
				break;
			default:
				throw new Error('Invalid band: ' + band);
		}
	} else {
		u = [...letters.slice(0, -2), ...outblock].join('|');
		v = [...inblock, ...letters.slice(2)].join('|');
	}

	return [
		{ name: 'band', str: { left: '', core: band, right: '', type: EndType.pureBand } },
		{ name: 'ffPlus', str: { left: dhookL, core: u, right: dhookR, type: EndType.confined } },
		{
			name: 'adicLeftPlus',
			str: { left: dhookL, core: '', right: band, type: EndType.confined_band }
		},
		{
			name: 'adicLeftMinus',
			str: { left: dhookL, core: u, right: band, type: EndType.confined_band }
		}, // may need to swap plus/minus, depends on convention
		{
			name: 'adicRightPlus',
			str: { left: band, core: '', right: dhookR, type: EndType.band_confined }
		},
		{
			name: 'adicRightMinus',
			str: { left: band, core: u, right: dhookR, type: EndType.band_confined }
		},
		{ name: 'ffMinus', str: { left: uhookL, core: v, right: uhookR, type: EndType.confined } },
		{
			name: 'PruferLeftPlus',
			str: { left: uhookL, core: v, right: band, type: EndType.confined_band }
		},
		{
			name: 'PruferLeftMinus',
			str: { left: uhookL, core: '', right: band, type: EndType.confined_band }
		},
		{
			name: 'PruferRightPlus',
			str: { left: band, core: v, right: uhookR, type: EndType.band_confined }
		},
		{
			name: 'PruferRightMinus',
			str: { left: band, core: '', right: uhookR, type: EndType.band_confined }
		},
		{ name: 'bpb', str: { left: band, core: u, right: band, type: EndType.LRBand } },
		{ name: 'bmb', str: { left: band, core: v, right: band, type: EndType.LRBand } }
		//TODO from here:
		// { name: 'adicLeftTurnAround', str: { left: band, core: '', right: band, type: EndType.LRBand } },
		// { name: 'PruferLeftTurnAround', str: { left: band, core: '', right: band, type: EndType.LRBand } },
		// { name: 'LeftTurnAround', str: { left: band, core: '', right: band, type: EndType.LRBand } }
	];
}

export const FareyPointToCFData = (p: FareyPoint): PointData => {
	return {
		frac: printFrac(p.f),
		pos: printPositiveCFrac(p.cf),
		neg: printNegativeCFrac(p.negcf),
		stringCollec: rationalBandToStringCollec(p.band)
		// band: p.band
	};
};

//
//#region Crossing detection

export function getSequence(infstr: InfString, leftRepeat: number, rightRepeat: number) {
	let l, r;
	switch (infstr.type) {
		case EndType.confined:
			l = infstr.left;
			r = infstr.right;
			break;
		case EndType.confined_band:
			l = infstr.left;
			r = Array(rightRepeat).fill(infstr.right).join('|');
			break;
		case EndType.band_confined:
			l = Array(leftRepeat).fill(infstr.left).join('|');
			r = infstr.right;
			break;
		case EndType.LRBand:
			l = Array(leftRepeat).fill(infstr.left).join('|');
			r = Array(rightRepeat).fill(infstr.right).join('|');
			break;
		case EndType.pureBand:
			l = Array(leftRepeat).fill(infstr.core).join('|');
			r = Array(rightRepeat).fill(infstr.core).join('|');
			break;
	}
	const res = [l, infstr.core, r].join('|').split('|');
	// insert turnings into res
	// process from right to left so original positions stay valid
	const turnings = findTurnings(res).toReversed();
	for (const t of turnings) {
		res.splice(Math.min(t.position + 1, res.length), 0, String(t.vertex));
	}
	return { seqs: res, turnings: turnings };
}

export function findCrossings(
	str1: InfString,
	str2: InfString,
	repeat1: Repeatance = { left: 1, right: 1 },
	repeat2: Repeatance = { left: 1, right: 1 }
): Array<Crossing> {
	//TODO: adjust lrepeat, rrepeat based on EndType
	const seqs = [
		{ s: str1, r: repeat1 },
		{ s: invertInfString(str1), r: { left: repeat1.right, right: repeat1.right } },
		{ s: str2, r: repeat2 }
	].map(({ s, r }) => getSequence(s, r.left, r.right));
	let crossings: Array<Crossing> = [];

	for (const i of [0, 1]) {
		const matches = maximalCommonSubsequence(seqs[i].seqs, seqs[2].seqs);
		let cr: Array<Crossing> = [];
		if (str1.type === EndType.confined && str2.type === EndType.confined) {
			cr = matches
				.map((m) => {
					// console.log('matching: ', m.start1, '|', m.start2, '|', m.len);
					// console.log('--seq[0]: ', seqs[i].seqs.slice(m.start1, m.start1 + m.len).join('|'));
					// console.log('--seq[1]: ', seqs[2].seqs.slice(m.start2, m.start2 + m.len).join('|'));
					const n = nbhdOfCommonSubsequence(seqs[i].seqs, seqs[2].seqs, m);
					// console.log('----nbhd: ', n);
					const cd = crossingType(n[0], n[1]);
					// console.log('---crossing type: ', cd, '( NC-check: ', cd !== CrossingDirection.NC, ')');
					return cd !== CrossingDirection.NC
						? {
								seqs: [seqs[i].seqs, seqs[2].seqs] as [string[], string[]],
								turnings: [seqs[i].turnings, seqs[2].turnings] as [gPosition[], gPosition[]],
								direction: cd,
								stringOrientation: [
									i === 0 ? Direction.directed : Direction.inverse,
									Direction.directed
								] as [Direction, Direction],
								start1: m.start1,
								start2: m.start2,
								len: m.len,
								nbhdStr1: n[0],
								nbhdStr2: n[1]
							}
						: null;
				})
				.filter((x): x is NonNullable<typeof x> => x !== null);
		}
		crossings = crossings.concat(cr);
	}
	//TODO: handle other string types (if ends is not confined, may add repeatance to that end)
	return crossings;
}

function crossingType(nbhd1: [string, string], nbhd2: [string, string]): CrossingDirection {
	const dir1 = nbhd1.map(letterDirection);
	const dir2 = nbhd2.map(letterDirection);
	if (dir1[0] === dir1[1] || dir2[0] === dir2[1]) return CrossingDirection.NC;

	if (dir1[0] === Direction.directed) {
		return dir2[0] === Direction.directed ? CrossingDirection.NC : CrossingDirection.positive;
	} else {
		return dir2[0] === Direction.directed ? CrossingDirection.negative : CrossingDirection.NC;
	}
}

function letterPrevNext(letter: string, prevnext: 'prev' | 'next') {
	const arrLabels = Object.keys(arrows);
	const searchArr =
		letterDirection(letter) === Direction.directed
			? arrLabels
			: arrLabels.map((l) => l + '^').reverse();
	searchArr.push(searchArr[0]);
	if (prevnext === 'prev') {
		return searchArr[searchArr.lastIndexOf(letter) - 1];
	} else {
		return searchArr[searchArr.indexOf(letter) + 1];
	}
}

function nbhdOfCommonSubsequence(
	seq1: string[],
	seq2: string[],
	match: { start1: number; start2: number; len: number }
): [[string, string], [string, string]] {
	const seqStEnd = [
		{ seq: seq1, start: match.start1, end: match.start1 + match.len - 1 },
		{ seq: seq2, start: match.start2, end: match.start2 + match.len - 1 }
	];
	return seqStEnd.map(({ seq, start, end }) => [
		start > 0
			? isLetter(seq[start - 1])
				? seq[start - 1]
				: seq[start - 2]
			: letterPrevNext(seq[0], 'prev'),
		end < seq.length - 1
			? isLetter(seq[end + 1])
				? seq[end + 1]
				: seq[end + 2]
			: letterPrevNext(seq[seq.length - 1], 'next')
	]) as [[string, string], [string, string]];
}

function maximalCommonSubsequence(seq1: string[], seq2: string[]) {
	const matches = [];

	for (let i = 0; i < seq1.length; i++) {
		for (let j = 0; j < seq2.length; j++) {
			// If we find a potential start of a common subsequence
			if (seq1[i] === seq2[j]) {
				// Ensure it's maximal on the left (cannot be extended backwards)
				if (i === 0 || j === 0 || seq1[i - 1] !== seq2[j - 1]) {
					let len = 0;
					// Extend as far as possible to the right
					while (
						i + len < seq1.length &&
						j + len < seq2.length &&
						seq1[i + len] === seq2[j + len]
					) {
						len++;
					}

					matches.push({
						start1: i,
						start2: j,
						len: len
						// before1: i > 0 ? seq1[i - 1] : null,
						// after1: i + len < seq1.length ? seq1[i + len] : null,
						// before2: j > 0 ? seq2[j - 1] : null,
						// after2: j + len < seq2.length ? seq2[j + len] : null
					});
				}
			}
		}
	}
	return matches;
}
