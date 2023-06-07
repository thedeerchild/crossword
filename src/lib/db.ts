import { env } from '$env/dynamic/private';
import { throwServerErrorResponse } from '$lib/api/errors';
import {
	SchemaValidationError,
	createPool,
	type DatabasePool,
	type Interceptor,
	type QueryResultRow,
	type SerializableValue
} from 'slonik';
import { makeServerError } from './errors/server';
import { promiseWithTimeout } from './promises/timeout';

/**
 * Duration in ms a handler will wait for the DB pool to initialize (i.e. until it's able to start trying to acquire a connection), before returning an error.
 */
const POOL_INIT_TIMEOUT_MS = 3000;

const dbUrl = `postgres://${env.CROSSWORD_DB_USER || 'crossword_dev'}:${
	env.CROSSWORD_DB_PASSWORD || 'crossword_dev'
}@${env.CROSSWORD_DB_HOST || '127.0.0.1'}:${Number(env.CROSSWORD_DB_PORT) || 5432}/${
	env.CROSSWORD_DB_NAME || 'crossword_dev'
}`;

/**
 * Promise that resolves to a database pool, allowing the app to resolve the pool lazily.
 */
export const pool = new Promise<DatabasePool>((resolve) => {
	initDbPool(resolve, 1);
});

// Example code from Slonik docs here: https://github.com/gajus/slonik#result-parser-interceptor
const createResultParserInterceptor = (): Interceptor => {
	return {
		// If you are not going to transform results using Zod, then you should use `afterQueryExecution` instead.
		// Future versions of Zod will provide a more efficient parser when parsing without transformations.
		// You can even combine the two – use `afterQueryExecution` to validate results, and (conditionally)
		// transform results as needed in `transformRow`.
		transformRow: (executionContext, actualQuery, row) => {
			const { resultParser } = executionContext;

			if (!resultParser) {
				return row;
			}

			const validationResult = resultParser.safeParse(row);

			if (!validationResult.success) {
				throw new SchemaValidationError(
					actualQuery,
					row as SerializableValue,
					validationResult.error.issues
				);
			}

			return validationResult.data as QueryResultRow;
		}
	};
};

/**
 * Recursive initializer for the DB pool, which will retry connecting to the DB indefinitely with exponential back-off (max 27.5s) and jitter.
 */
async function initDbPool(
	resolve: (value: DatabasePool | PromiseLike<DatabasePool>) => void,
	retryNum: number
) {
	try {
		const pool = await createPool(dbUrl, {
			interceptors: [createResultParserInterceptor()]
		});

		return resolve(pool);
	} catch (e) {
		console.error(`Error connecting to database, attempting retry ${retryNum}...`);

		const retryOffset = Math.max(retryNum, 5);

		setTimeout(() => {
			initDbPool(resolve, retryNum + 1);
		}, retryOffset * retryOffset * 1000 + retryOffset * (Math.random() - 0.5) * 1000);
	}
}

/**
 * Accepts a DB pool promise times out if a connection can't be acquired in time.
 */
export async function getConn(db: Promise<DatabasePool>) {
	const promiseResult = await promiseWithTimeout(db, POOL_INIT_TIMEOUT_MS);

	if (promiseResult.isTimeout) {
		throwServerErrorResponse(
			makeServerError('ERR_GENERIC_SERVER_RETRYABLE', 'Timed out acquiring database connection')
		);
	}

	return promiseResult.result;
}
