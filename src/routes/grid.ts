import { type Cursor, flipDirection, type Direction } from './cursor';

type WordStart = {
	index: number;
	direction: Direction | 'both';
};

export enum GridSquare {
	LETTER,
	WALL
}

export class Grid {
	private _squares: GridSquare[];
	width: number;

	private _wordStarts: WordStart[] = [];

	static fromString(diagram: string) {
		const clean = diagram.replaceAll('-', '').replaceAll('|', '').trim().replaceAll(' ', '');
		const width = clean.indexOf('\n');
		const squares = clean
			.replaceAll('\n', '')
			.split('')
			.map((x) => (x === 'W' ? GridSquare.WALL : GridSquare.LETTER));

		return new Grid(squares, width);
	}

	constructor(squares: GridSquare[], width?: number) {
		this._squares = squares;
		this.width = width || Math.floor(Math.sqrt(this.squares.length));
		// TODO: assert squares are symmetric
		this.refreshWordStarts();
	}

	get squares() {
		return this._squares;
	}

	getWordLabelForSquare(idx: number) {
		const label = this._wordStarts.findIndex((x) => x.index === idx);
		return label > -1 ? label + 1 : null;
	}

	/**
	 * Returns an array of square indexes indicating the word run which contains the cursor, or an empty array if the cursor is not on a valid run (e.g. a wall or single-letter run).
	 */
	getCurrentWordRun(current: Cursor): number[] {
		if (
			current.index < 0 ||
			current.index >= this._squares.length ||
			this._wordStarts.length < 1 ||
			this._squares[current.index] === GridSquare.WALL
		) {
			return [];
		}

		const run = [];

		if (current.direction === 'across') {
			const rowStart = Math.floor(current.index / this.width) * this.width;
			const rowEnd = this.width - (current.index % this.width) + current.index - 1;

			for (let i = current.index - 1; i >= rowStart; i--) {
				if (this._squares[i] === GridSquare.WALL) {
					break;
				}
				run.push(i);
			}

			run.reverse();
			run.push(current.index);

			for (let i = current.index + 1; i <= rowEnd; i++) {
				if (this._squares[i] === GridSquare.WALL) {
					break;
				}
				run.push(i);
			}
		} else {
			const colStart = current.index % this.width;
			const colEnd = (this._squares.length / this.width - 1) * this.width + colStart;

			for (let i = current.index - this.width; i >= colStart; i -= this.width) {
				if (this._squares[i] === GridSquare.WALL) {
					break;
				}
				run.push(i);
			}

			run.reverse();
			run.push(current.index);

			for (let i = current.index + this.width; i <= colEnd; i += this.width) {
				if (this._squares[i] === GridSquare.WALL) {
					break;
				}
				run.push(i);
			}
		}

		return run;
	}

	/**
	 * Returns a cursor to the current word start, given a cursor within the word. Returns the input cursor in the case of a single letter run or wall square.
	 */
	getCurrentWordStart(current: Cursor): Cursor {
		if (this._squares[current.index] === GridSquare.WALL) {
			return current;
		}

		const validWordStarts = this._wordStarts.filter((x) =>
			[current.direction, 'both'].includes(x.direction)
		);

		if (current.direction === 'across') {
			for (
				let iter = current.index;
				iter >= Math.floor(current.index / this.width) * this.width;
				iter--
			) {
				if (this._squares[iter] === GridSquare.WALL) {
					break;
				}

				const start = validWordStarts.find((x) => x.index === iter);
				if (start) {
					return { index: start.index, direction: current.direction };
				}
			}

			return current;
		}

		for (let iter = current.index; iter >= 0; iter -= this.width) {
			if (this._squares[iter] === GridSquare.WALL) {
				break;
			}

			const start = validWordStarts.find((x) => x.index === iter);
			if (start) {
				return { index: start.index, direction: current.direction };
			}
		}

		return current;
	}

	/**
	 * Returns a cursor pointing to the next word start in the same direction, or wraps to the first word start in the other direction. Wrapping falls back to the first word start in the same direction, or to a cursor at the beginning of the grid in the case where there are no valid word starts (e.g. the entire grid is walls).
	 */
	getNextWordStart(current: Cursor): Cursor {
		// No valid word starts or invalid cursor, so construct one at the start of the grid.
		if (current.index < 0 || current.index >= this._squares.length || this._wordStarts.length < 1) {
			return { index: 0, direction: flipDirection(current.direction) };
		}

		if (this._squares[current.index] === GridSquare.WALL) {
			return {
				index: (current.index + 1) % this._squares.length,
				direction:
					current.index + 1 >= this._squares.length
						? flipDirection(current.direction)
						: current.direction
			};
		}

		const matchingWordStarts = this._wordStarts.filter(
			(x) => x.direction !== flipDirection(current.direction)
		);

		const currentWS = this.getCurrentWordStart(current);

		// Couldn't find an exact match, so start from the last valid word match before the cursor location.
		let currentWSIndex = matchingWordStarts.findIndex((x) => x.index === currentWS.index);
		if (currentWSIndex < 0) {
			currentWSIndex = matchingWordStarts.findIndex((x) => x.index > current.index) - 1;
			// No remaining fuzzy matches either, so we'll need to trigger a wraparound.
			if (currentWSIndex < -1) {
				currentWSIndex = matchingWordStarts.length;
			}
		}

		// If we're at the end of the matching word starts, wrap around and switch direction.
		if (currentWSIndex >= matchingWordStarts.length - 1) {
			const wrapped = this._wordStarts.find((x) => x.direction !== current.direction);

			// Fall back to wrapping in the same direction, if there isn't a matching start in the other direction.
			if (!wrapped) {
				return { index: matchingWordStarts[0].index, direction: current.direction };
			}

			return {
				index: wrapped.index,
				direction: flipDirection(current.direction)
			};
		}

		return {
			index: matchingWordStarts[currentWSIndex + 1].index,
			direction: current.direction
		};
	}

	/**
	 * Returns the grid index of the previous word start in the same direction. If at the beginning of the grid the returned word start will wrap around to the ;ast word start in the other direction, falling back to the last word start in the same direction. Returns a word start at the end of the grid in the case where there are no valid word starts (e.g. the entire grid is walls).
	 */
	getPrevWordStart(current: Cursor): Cursor {
		// No valid word starts or invalid cursor, so construct one at the end of the grid.
		if (current.index < 0 || current.index >= this._squares.length || this._wordStarts.length < 1) {
			return { index: this._squares.length, direction: flipDirection(current.direction) };
		}

		if (this._squares[current.index] === GridSquare.WALL) {
			return {
				index: (current.index + this._squares.length - 1) % this._squares.length,
				direction: current.index - 1 < 0 ? flipDirection(current.direction) : current.direction
			};
		}

		const matchingWordStarts = this._wordStarts.filter(
			(x) => x.direction !== flipDirection(current.direction)
		);

		const currentWS = this.getCurrentWordStart(current);

		// Couldn't find an exact match, so start from the last valid word match after the cursor location.
		let currentWSIndex = matchingWordStarts.findIndex((x) => x.index === currentWS.index);
		if (currentWSIndex < 0) {
			currentWSIndex = matchingWordStarts.findIndex((x) => x.index < current.index) + 1;

			// No remaining fuzzy matches either, so we'll need to trigger a wraparound.
			if (currentWSIndex > matchingWordStarts.length) {
				currentWSIndex = -1;
			}
		}

		// Wrap around and switch direction.
		if (currentWSIndex <= 0) {
			const wrapped = this._wordStarts.findLast((x) => x.direction !== current.direction);

			// Fall back to wrapping in the same direction.
			if (!wrapped) {
				return {
					index: matchingWordStarts[matchingWordStarts.length - 1].index,
					direction: current.direction
				};
			}

			return {
				index: wrapped.index,
				direction: flipDirection(current.direction)
			};
		}

		return {
			index: matchingWordStarts[currentWSIndex - 1].index,
			direction: current.direction
		};
	}

	/**
	 * Toggles the square at idx (and its symmetric counterpart), returning true if the square is being set to a Wall (and its content should be cleared).
	 */
	toggleSquare(idx: number) {
		const newSquare =
			this._squares[idx] === GridSquare.LETTER ? GridSquare.WALL : GridSquare.LETTER;
		this._squares[idx] = newSquare;
		this._squares[this._squares.length - 1 - idx] = newSquare;

		this.refreshWordStarts();

		return newSquare === GridSquare.WALL;
	}

	private refreshWordStarts() {
		const wordStarts: WordStart[] = [];
		for (let i = 0; i < this._squares.length; i++) {
			const isLetter = this._squares[i] === GridSquare.LETTER;
			const hasEdgeLeft = i % this.width === 0;
			const hasWallLeft = i > 0 && this._squares[i - 1] === GridSquare.WALL;
			const hasLetterRight =
				i % this.width < this.width - 1 && this._squares[i + 1] === GridSquare.LETTER;
			const hasEdgeTop = i < this.width;
			const hasWallTop = this._squares[i - this.width] === GridSquare.WALL;
			const hasLetterBottom =
				i + this.width < this._squares.length - 1 &&
				this._squares[i + this.width] === GridSquare.LETTER;

			const isStartOfAcross = (hasEdgeLeft || hasWallLeft) && hasLetterRight;
			const isStartOfDown = (hasEdgeTop || hasWallTop) && hasLetterBottom;

			if (isLetter) {
				if (isStartOfAcross && isStartOfDown) {
					wordStarts.push({ index: i, direction: 'both' });
				} else if (isStartOfAcross) {
					wordStarts.push({ index: i, direction: 'across' });
				} else if (isStartOfDown) {
					wordStarts.push({ index: i, direction: 'down' });
				}
			}
		}

		this._wordStarts = wordStarts;
	}

	toString() {
		const out = [' ' + '-'.repeat(this.width) + ' '];

		for (let i = 0; i < this.squares.length / this.width; i++) {
			out.push(
				'|' +
					this.squares
						.slice(i * this.width, (i + 1) * this.width)
						.map((x) => (x === GridSquare.WALL ? 'W' : '.'))
						.join('') +
					'|'
			);
		}

		out.push(' ' + '-'.repeat(this.width) + ' ');

		return out.join('\n');
	}
}
