import { connect } from '$lib/db/db';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals = { ...event.locals, db: await connect() };
	return resolve(event);
};
