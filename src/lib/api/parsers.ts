import { makeServerError } from '$lib/errors/server';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { throwServerErrorResponse } from './errors';
import { API_ROUTES, type RouteName } from './routes';

export async function parseApiRequest(routeName: RouteName, req: Request) {
	const schema = API_ROUTES[routeName].requestSchema;

	let data;
	try {
		data = await req.json();
	} catch (e) {
		throwServerErrorResponse(
			makeServerError('ERR_MALFORMED_REQUEST', 'Error parsing request body as JSON')
		);
	}

	if (!data) {
		throwServerErrorResponse(makeServerError('ERR_MALFORMED_REQUEST', 'Missing JSON request body'));
	}

	try {
		return schema.parse(data);
	} catch (e) {
		if (e instanceof z.ZodError) {
			throwServerErrorResponse(
				makeServerError('ERR_MALFORMED_REQUEST', 'Schema error while parsing request', e, {
					fields: Object.fromEntries(e.issues.map((x) => [x.path.join('.'), x.message]))
				})
			);
		}

		throwServerErrorResponse(
			makeServerError(
				'ERR_MALFORMED_REQUEST',
				`Error parsing request for API method '${routeName}'`,
				e
			)
		);
	}
}

export function makeApiResponse(routeName: RouteName, data: unknown) {
	const schema = API_ROUTES[routeName].responseSchema;

	try {
		return json(schema.parse(data));
	} catch (e) {
		// Don't bother checking for specifically for `z.ZodError`, since a schema error here is a server bug anyways.
		throwServerErrorResponse(
			makeServerError(
				'ERR_GENERIC_SERVER_NON_RETRYABLE',
				`Error serializing response for API method '${routeName}'`,
				e
			)
		);
	}
}
