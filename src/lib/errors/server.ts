import { zodEnumFromObjKeys, type KeysOfUnion } from '$lib/types/helpers';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import { toError } from './catch';

export type ServerErrorCode = keyof typeof serverErrorCodes;
export const serverErrorCodes = {
	ERR_GENERIC_SERVER_RETRYABLE: StatusCodes.INTERNAL_SERVER_ERROR,
	ERR_GENERIC_SERVER_NON_RETRYABLE: StatusCodes.INTERNAL_SERVER_ERROR,
	ERR_MALFORMED_REQUEST: StatusCodes.BAD_REQUEST,
	ERR_NOT_AUTHORIZED: StatusCodes.UNAUTHORIZED,
	ERR_ALREADY_EXISTS: StatusCodes.CONFLICT,
	ERR_NOT_FOUND: StatusCodes.NOT_FOUND
	// New error mappings added here must also be added to the definition of `serverErrorSchema` below.
	// TODO: Write a unit test to assert that these mappings stay in sync.
} as const;

export type ServerErrorBase = z.infer<typeof serverErrorBaseSchema>;
export const serverErrorBaseSchema = z.object({
	code: zodEnumFromObjKeys(serverErrorCodes),
	message: z.string()
});

export type ServerError = z.infer<typeof serverErrorSchema>;
export const serverErrorSchema = z.intersection(
	serverErrorBaseSchema,
	z.discriminatedUnion('code', [
		z.object({
			code: z.literal('ERR_MALFORMED_REQUEST'),
			fields: z.record(z.string()).optional()
		}),
		z.object({
			code: z.enum([
				'ERR_GENERIC_SERVER_RETRYABLE',
				'ERR_GENERIC_SERVER_NON_RETRYABLE',
				'ERR_NOT_AUTHORIZED',
				'ERR_ALREADY_EXISTS',
				'ERR_NOT_FOUND'
				// New error codes added here must also be added to the mapping in `serverErrorCodes` above.
				// TODO: Write a unit test to assert that these mappings stay in sync.
			])
		})
	])
);

export type ServerErrorInternal = ServerError & {
	originalError?: { message: string };
	stackTrace?: string;
};

/**
 * Constructs a server error
 * @param code The app-specific error category
 * @param message User-facing error message
 * @param originalError Caught error to log
 * @param additional Additional fields, if allowed for the code-specific schema
 */
export function makeServerError(
	code: ServerErrorCode,
	message: string,
	originalError?: unknown,
	additional?: {
		[key in Exclude<
			KeysOfUnion<z.infer<typeof serverErrorSchema>>,
			keyof z.infer<typeof serverErrorBaseSchema>
		>]: unknown;
	}
): ServerErrorInternal {
	return {
		code,
		message,
		...additional,
		originalError: toError(originalError),
		stackTrace: new Error().stack
	} as ServerErrorInternal;
}
