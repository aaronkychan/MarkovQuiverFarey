export interface Fraction {
	p: number;
	q: number;
}

export interface Complex {
	re: number;
	im: number;
}
export interface FareyPoint {
	f: Fraction;
	parents: FareyPoint[];
	depth: number;
	cf: number[];
	negcf: number[];
	SBpath: number[];
	band: string;
}

export interface FareyTriangle {
	v1: FareyPoint;
	v2: FareyPoint;
	v3: FareyPoint;
}

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

export interface PointData {
	frac: string;
	pos: string;
	neg: string;
	stringCollec: NamedInfString[];
	// band: string;
}

export enum Direction {
	directed = 'DIRECTED',
	inverse = 'INVERSE'
}

export enum CrossingDirection {
	positive = 'POSITIVE',
	negative = 'NEGATIVE',
	NC = 'NC'
}

export interface Crossing {
	seqs: [string[], string[]];
	turnings: [gPosition[], gPosition[]];
	direction: CrossingDirection;
	stringOrientation: [Direction, Direction];
	start1: number;
	start2: number;
	len: number;
	nbhdStr1: [string, string];
	nbhdStr2: [string, string];
}

export interface Repeatance {
	left: number;
	right: number;
}

export interface gPosition {
	vertex: number;
	position: number;
	isTop: boolean;
}
