import { base } from '$app/paths';
import type { ServerError } from '$lib/errors/server';
import { error } from '@sveltejs/kit';
import type { z } from 'zod';
import { API_ROUTES, type RouteName } from './routes';

type ApiCallResult<RespSchema> =
	| {
			isError: false;
			status: number;
			body: RespSchema;
	  }
	| {
			isError: true;
			status: number;
			body: ServerError;
	  };

export async function makeApiCall<Route extends RouteName>(
	fetch: (input: RequestInfo | URL, init?: RequestInit | undefined) => Promise<Response>,
	routeName: Route,
	routeParams: Parameters<(typeof API_ROUTES)[Route]['path']>[0],
	data: z.infer<(typeof API_ROUTES)[Route]['requestSchema']>
): Promise<ApiCallResult<z.infer<(typeof API_ROUTES)[Route]['responseSchema']>>> {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const res = await fetch(`${base}${API_ROUTES[routeName].path(routeParams)}`, {
		method: API_ROUTES[routeName].method,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json'
		},
		body: data ? JSON.stringify(data) : undefined
	});

	return {
		isError: res.status >= 400,
		status: res.status,
		body: await res.json()
	};
}

/**
 * For use in actions and loaders. Returns the provided `ApiCallResult` if `isError` is false, otherwise throws an HTTPError to forward the API's error response to the client.
 */
export function checkAndForwardApiError<T>(resp: ApiCallResult<T>) {
	if (resp.isError) {
		throw error(resp.status, resp.body);
	}

	return resp;
}
