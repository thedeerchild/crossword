import { base } from '$app/paths';
import { checkAndForwardApiError, makeApiCall } from '$lib/api/client';
import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ fetch, request }) => {
		const formData = await request.formData();
		const resp = await makeApiCall(fetch, 'CreatePuzzle', undefined, {
			name: (formData.get('name') as string) || 'Untitled',
			width: Number(formData.get('width'))
		});

		const newPuzzle = checkAndForwardApiError(resp);
		throw redirect(302, `${base}/puzzles/${newPuzzle.body.id}/edit`);
	}
};
