import { env } from '$env/dynamic/private';
import { createPool } from 'slonik';

const config = {
	database: env.CROSSWORD_DB_NAME || 'crossword_dev',
	user: env.CROSSWORD_DB_USER || 'crossword_dev',
	host: env.CROSSWORD_DB_HOST || '127.0.0.1',
	password: env.CROSSWORD_DB_PASSWORD || 'crossword_dev',
	port: Number(env.CROSSWORD_DB_PORT) || 5432
} as const;

export const pool = await createPool(
	`postgres://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`,
	{}
);
