import {
	makeServerError,
	serverErrorCodes,
	serverErrorSchema,
	type ServerError,
	type ServerErrorInternal
} from '$lib/errors/server';
import { error } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

/**
 * Sanitizes an internal server error for return.
 */
export function sanitizeServerError(e: ServerErrorInternal): ServerError {
	try {
		return serverErrorSchema.parse({ ...e, originalError: undefined, stackTrace: undefined });
	} catch (e) {
		console.error('Unable to serialize error response:', JSON.stringify(e));
		return {
			code: 'ERR_GENERIC_SERVER_NON_RETRYABLE',
			message: 'Unable to serialize error response'
		};
	}
}

/**
 * Throws an API error response and closes out the response handler.
 */
export function throwServerErrorResponse(e: ServerErrorInternal): never {
	const httpStatus = serverErrorCodes[e.code];
	if (!httpStatus) {
		console.error(`Unrecognized error code "${e.code}" when returning error response`, {
			error: e,
			originalError: e.originalError
		});
		throw error(
			StatusCodes.INTERNAL_SERVER_ERROR,
			sanitizeServerError(
				makeServerError('ERR_GENERIC_SERVER_NON_RETRYABLE', 'Unrecognized error code')
			)
		);
	}

	const resp = sanitizeServerError(e);
	console.error('Returning server error', { error: resp, originalError: e.originalError });
	throw error(httpStatus, resp);
}
