// export interface Arrow {
// 	name: string;
// 	src: number; // +/- 1,2,3
// 	tgt: number;
// }

export interface Letter {
	name: string;
	inv: boolean;
	src: number;
	tgt: number;
}

export const [a, b, c, x, y, z, ainv, binv, cinv, xinv, yinv, zinv] = [
	{ name: 'a', inv: false, src: 1, tgt: 2 },
	{ name: 'b', inv: false, src: 2, tgt: 3 },
	{ name: 'c', inv: false, src: 3, tgt: -1 },
	{ name: 'x', inv: false, src: -1, tgt: -2 },
	{ name: 'y', inv: false, src: -2, tgt: -3 },
	{ name: 'z', inv: false, src: -3, tgt: 1 },
	{ name: 'a', inv: true, src: 2, tgt: 1 },
	{ name: 'b', inv: true, src: 3, tgt: 2 },
	{ name: 'c', inv: true, src: -1, tgt: 3 },
	{ name: 'x', inv: true, src: -2, tgt: -1 },
	{ name: 'y', inv: true, src: -3, tgt: -2 },
	{ name: 'z', inv: true, src: 1, tgt: -3 }
];

export const Alphabets = [a, b, c, x, y, z, ainv, binv, cinv, xinv, yinv, zinv];
export const DirectedAlphabets = [a, b, c, x, y, z];
export const InverseAlphabets = [ainv, binv, cinv, xinv, yinv, zinv];

export const invertLetter = (l: Letter) => {
	return { ...l, inv: !l.inv };
};

export function strToMString(s: string): MarkovString {
	const letters = s
		.split('|')
		.map((l) => (l.length === 1 ? DirectedAlphabets : InverseAlphabets).find((a) => a.name === l)!);
	return new MarkovString(letters);
}

export class MarkovString {
	letters: Letter[];
	constructor(letters: Letter[]) {
		this.letters = letters;
	}

	src() {
		return this.letters[0].src;
	}

	tgt() {
		return this.letters.at(-1)?.tgt;
	}

	invert() {
		return new MarkovString([...this.letters.map(invertLetter)].reverse());
	}

	toString() {
		return this.letters.length > 0
			? this.letters.map((l) => l.name + (l.inv ? '^' : '')).join('|')
			: '0';
	}

	append(suffix: MarkovString) {
		if (this.letters.length === 0) return new MarkovString(suffix.letters);
		if (suffix.letters.length === 0) return new MarkovString(this.letters);

		if (
			this.letters.at(-1)?.tgt ===
			suffix.letters[0].src * (this.letters.at(-1)?.inv === suffix.letters[0].inv ? 1 : -1)
		) {
			return new MarkovString([...this.letters, ...suffix.letters]);
		} else {
			return null;
		}
	}

	// return an array of consecutive letters of the same direction
	segmentation() {
		const pieces: Letter[][] = [];
		let piece: Letter[] = [];
		let lastDirection = this.letters[0].inv;
		for (const l of this.letters.slice(1)) {
			if (l.inv !== lastDirection) {
				pieces.push(piece);
				piece = [];
				lastDirection = l.inv;
			} else {
				piece.push(l);
			}
		}
		return pieces;
	}

	print(groupInverses: boolean = false) {
		if (this.letters.length === 0) {
			return '∅';
		} else {
			if (!groupInverses) {
				return this.letters.reduce((s, l) => (s += l.name + l.inv ? '^' : ''), '');
			} else {
				const pieces = [];
				let piece = '';
				let lastDirection = this.letters[0].inv;
				for (const l of this.letters.slice(1)) {
					if (l.inv !== lastDirection) {
						pieces.push(piece);
						piece = '';
						lastDirection = l.inv;
					} else {
						if (!lastDirection) {
							// last letter and this letter both directed
							piece += l.name;
						} else {
							piece = l.name + piece;
						}
					}
				}
				// Boolean(a) !== Boolean(b) mean "a XOR b"
				return pieces.reduce(
					(s, p, i) => (s += `(${p})${Boolean(this.letters[0].inv) !== Boolean(i % 2) ? '^' : ''}`),
					''
				);
			}
		}
	}

	isValid() {
		for (let i = 1; i < this.letters.length; i++) {
			if (this.letters[i - 1].inv !== this.letters[i].inv) {
				// forbid   aa^ or a^a
				if (this.letters[i - 1].name === this.letters[i].name) return false;

				// ab^ is invalid if t(a)!=s(b^).  Need "negation" because they need to be different half-edge
				if (this.letters[i - 1].tgt !== -this.letters[i].src) return false;
			} else {
				if (this.letters[i - 1].tgt !== this.letters[i].src) return false;
			}
		}
		return true;
	}

	isShort() {
		if (!this.isValid()) return false;
		const pieces = this.segmentation();
		for (const p of pieces) {
			// this only makes sense to Markov
			if (p.length > 5) return false;
		}
		return true;
	}
}

export const concatMString = (s1: MarkovString, s2: MarkovString) => s1.append(s2);
