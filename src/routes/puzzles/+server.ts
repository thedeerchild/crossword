import { Grid } from '$lib/stores/grid';
import { ulid } from 'ulid';

import { makeApiResponse, parseApiRequest } from '$lib/api/parsers';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals: { db } }) => {
	const params = await parseApiRequest('CreatePuzzle', request);
	const id = ulid();
	return makeApiResponse('CreatePuzzle', {
		success: true,
		id
	});
};
