import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { throwErrorResponse } from './errors';
import { API_ROUTES, type RouteName } from './routes';

export async function parseApiRequest(routeName: RouteName, req: Request) {
	const schema = API_ROUTES[routeName].requestSchema;

	let data;
	try {
		data = await req.json();
	} catch (e) {
		throwErrorResponse('ERR_MALFORMED_REQUEST', 'Error parsing request body as JSON');
	}

	if (!data) {
		throwErrorResponse('ERR_MALFORMED_REQUEST', 'Missing JSON request body');
	}

	try {
		return schema.parse(data);
	} catch (e) {
		if (e instanceof z.ZodError) {
			throwErrorResponse('ERR_MALFORMED_REQUEST', 'Schema error while parsing request', {
				fields: Object.fromEntries(e.issues.map((x) => [x.path.join('.'), x.message]))
			});
		}

		console.error('Error parsing request:', JSON.stringify(e));
		throwErrorResponse('ERR_MALFORMED_REQUEST', 'Error parsing request');
	}
}

export function makeApiResponse(routeName: RouteName, data: unknown) {
	const schema = API_ROUTES[routeName].responseSchema;

	try {
		return json(schema.parse(data));
	} catch (e) {
		// Don't bother checking for specifically for `z.ZodError`, since a schema error here is a server bug anyways.
		console.error('Error serializing response:', JSON.stringify(e));
		throwErrorResponse('ERR_GENERIC_SERVER_NON_RETRYABLE', 'Error serializing response');
	}
}
