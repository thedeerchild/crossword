import { Grid, GridSquare } from '$lib/models/grid';

import { makeApiResponse, parseApiRequest } from '$lib/api/parsers';
import { createPuzzle } from '$lib/queries/puzzles';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals: { db } }) => {
	const params = await parseApiRequest('CreatePuzzle', request);
	const id = await createPuzzle(
		db,
		new Grid(new Array(params.width ** 2).fill(GridSquare.LETTER), params.width),
		params.name
	);
	return makeApiResponse('CreatePuzzle', {
		success: true,
		id
	});
};
