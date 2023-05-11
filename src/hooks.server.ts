import { pool } from '$lib/db/db';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve: handlerFn }) => {
	let resolve: (value: Response | PromiseLike<Response>) => void;
	const resp = new Promise<Response>((res) => {
		resolve = res;
	});

	await pool.connect(async (dbConn) => {
		event.locals.db = dbConn;
		const resp = await handlerFn(event);
		resolve(resp);
	});

	return resp;
};
