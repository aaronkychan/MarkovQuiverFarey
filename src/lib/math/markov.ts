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

export const hooks = {
	'1': 'a|b|c|x|y|z',
	'2': 'b|c|x|y|z|a',
	'3': 'c|x|y|z|a|b',
	'-1': 'x|y|z|a|b|c',
	'-2': 'y|z|a|b|c|x',
	'-3': 'z|a|b|c|x|y'
};

export enum EndType {
	confined = 'CONFINED',
	confined_band = 'LC_RB',
	band_confined = 'LB_RC',
	pureBand = 'BAND',
	LRBand = 'LB_RB',
	irrational = 'IRRATIONAL'
}

export interface InfString {
	left: string;
	core: string;
	right: string;
	type: EndType;
}

export interface NamedInfString {
	name: string;
	str: InfString;
}

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
		// { name: 'turnPM', str: { left: band, core: '', right: band, type: EndType.LRBand } },
		// { name: 'turnMP', str: { left: band, core: '', right: band, type: EndType.LRBand } },
		// { name: 'turnLONG', str: { left: band, core: '', right: band, type: EndType.LRBand } }
	];
}
