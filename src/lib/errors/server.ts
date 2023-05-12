import { omitKeys, zodEnumFromObjKeys } from '$lib/types/helpers';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

export type ServerErrorCode = keyof typeof serverErrorCodes;
export const serverErrorCodes = {
	ERR_GENERIC_SERVER_RETRYABLE: StatusCodes.INTERNAL_SERVER_ERROR,
	ERR_GENERIC_SERVER_NON_RETRYABLE: StatusCodes.INTERNAL_SERVER_ERROR,
	ERR_MALFORMED_REQUEST: StatusCodes.BAD_REQUEST,
	ERR_NOT_AUTHORIZED: StatusCodes.UNAUTHORIZED
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
			code: zodEnumFromObjKeys(omitKeys(serverErrorCodes, ['ERR_MALFORMED_REQUEST']))
		})
	])
);
