export type Direction = 'across' | 'down';
export function flipDirection(d: Direction) {
	return d === 'across' ? 'down' : 'across';
}

export type GridCursor = {
	index: number;
	direction: Direction;
};
