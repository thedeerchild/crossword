import { pool } from '$lib/db';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve: handlerFn }) => {
	event.locals.db = pool;
	return handlerFn(event);
};
