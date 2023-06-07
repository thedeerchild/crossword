import { checkAndForwardApiError, makeApiCall } from '$lib/api/client';

export const load = async ({ params, fetch }) => {
	const {
		body: { puzzle }
	} = await checkAndForwardApiError(
		await makeApiCall(fetch, 'GetPuzzle', { id: params.id }, undefined)
	);

	return {
		...puzzle,
		grid: JSON.stringify(puzzle.grid)
	};
};
