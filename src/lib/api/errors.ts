import { serverErrorCodes, serverErrorSchema, type ServerErrorCode } from '$lib/errors/server';
import type { KeysOfUnion } from '$lib/types/helpers';
import { error } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';
import type { z } from 'zod';

/**
 * Throws an API error response
 * @param code The app-specific error category
 * @param message User-facing error message
 * @param additional Additional fields, if allowed for the code-specific schema
 */
export function throwErrorResponse(
	code: ServerErrorCode,
	message: string,
	additional?: {
		[key in Exclude<KeysOfUnion<z.infer<typeof serverErrorSchema>>, 'code' | 'message'>]: unknown;
	}
): never {
	const httpStatus = serverErrorCodes[code];
	if (!httpStatus) {
		console.error('Unrecognized error code:', code);
		throw error(StatusCodes.INTERNAL_SERVER_ERROR, {
			code: 'ERR_GENERIC_SERVER_NON_RETRYABLE',
			message: 'Unrecognized error code'
		});
	}

	let body;
	try {
		body = serverErrorSchema.parse({
			code,
			message,
			...additional
		});
	} catch (e) {
		console.error('Unable to serialize error response:', JSON.stringify(e));
		throw error(StatusCodes.INTERNAL_SERVER_ERROR, {
			code: 'ERR_GENERIC_SERVER_NON_RETRYABLE',
			message: 'Unable to serialize error response'
		});
	}

	throw error(httpStatus, body);
}
