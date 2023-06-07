import { makeApiResponse } from '$lib/api/parsers';
import { getPuzzle } from '$lib/queries/puzzles';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params: { id }, locals: { db } }) => {
	const puzzle = await getPuzzle(db, id);
	return makeApiResponse('GetPuzzle', {
		puzzle
	});
};
