import { env } from '$env/dynamic/private';
import { throwErrorResponse } from '$lib/api/errors';
import { createPool, type ConnectionRoutine, type DatabasePool } from 'slonik';
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

/**
 * Recursive initializer for the DB pool, which will retry connecting to the DB indefinitely with exponential back-off (max 27.5s) and jitter.
 */
async function initDbPool(
	resolve: (value: DatabasePool | PromiseLike<DatabasePool>) => void,
	retryNum: number
) {
	try {
		const pool = await createPool(dbUrl, {});

		return resolve(pool);
	} catch (e) {
		console.error(`Error connecting to database, attempting retry ${retryNum}:`, JSON.stringify(e));

		const retryOffset = Math.max(retryNum, 5);

		setTimeout(() => {
			initDbPool(resolve, retryNum + 1);
		}, retryOffset * retryOffset * 1000 + retryOffset * (Math.random() - 0.5) * 1000);
	}
}

/**
 * Accepts a DB pool and a callback to execute once a DB connection has been acquired.
 */
export async function getConn<T>(
	db: Promise<DatabasePool>,
	connectionRoutine: ConnectionRoutine<T>
) {
	const promiseResult = await promiseWithTimeout(db, POOL_INIT_TIMEOUT_MS);

	if (promiseResult.isTimeout) {
		throwErrorResponse('ERR_GENERIC_SERVER_RETRYABLE', 'Timed out acquiring database connection');
	}

	return promiseResult.result.connect(connectionRoutine);
}
