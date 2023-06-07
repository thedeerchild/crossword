import { writable } from 'svelte/store';
import type { Grid, GridWord } from '../models/grid';

export type Direction = 'across' | 'down';
export function flipDirection(d: Direction) {
	return d === 'across' ? 'down' : 'across';
}

export type GridCursor = {
	index: number;
	direction: Direction;
};

export type ClueCursor = {
	descriptor: GridWord;
	type: 'primary' | 'secondary';
};

export type PuzzleCursors = {
	across: ClueCursor | null;
	down: ClueCursor | null;
	gridRun: number[] | null;
};

export const puzzleCursorsStore = (function () {
	const { subscribe, set, update } = writable<PuzzleCursors>({
		across: null,
		down: null,
		gridRun: null
	});

	return {
		subscribe,

		setGridCursor(grid: Grid, cursor: GridCursor | null) {
			if (!cursor) {
				update((oldVal) => {
					return {
						...oldVal,
						gridRun: null
					};
				});
				return;
			}

			const { across, down } = grid.getCurrentWord(cursor.index);
			set({
				across:
					across !== null
						? {
								descriptor: across,
								type: cursor.direction === 'across' ? 'primary' : 'secondary'
						  }
						: null,
				down:
					down !== null
						? {
								descriptor: down,
								type: cursor.direction === 'down' ? 'primary' : 'secondary'
						  }
						: null,
				gridRun: grid.getCurrentWordRun(cursor)
			});
		},

		setPrimaryClueCursor(grid: Grid, cursor: GridCursor | null) {
			if (!cursor) {
				set({
					across: null,
					down: null,
					gridRun: null
				});
				return;
			}

			set({
				across: null,
				down: null,
				gridRun: grid.getCurrentWordRun(cursor)
			});
		}
	};
})();
