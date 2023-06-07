import { sanitizeServerError } from '$lib/api/errors';
import { pool } from '$lib/db';
import { makeServerError } from '$lib/errors/server';
import type { Handle, HandleServerError } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve: handlerFn }) => {
	event.locals.db = pool;
	return handlerFn(event);
};

export const handleError: HandleServerError = async ({ error }) => {
	console.error('Unexpected Server Error:', error);
	return sanitizeServerError(
		makeServerError('ERR_GENERIC_SERVER_NON_RETRYABLE', 'Unexpected server error')
	);
};
