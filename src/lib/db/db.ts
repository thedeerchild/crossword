import postgres from 'postgres';
import { createPostgresBridge } from 'postgres-bridge';

const PostgresBridge = createPostgresBridge(postgres);
const pool = new PostgresBridge({
	database: import.meta.env.CROSSWORD_DB_NAME || 'crossword_dev',
	user: import.meta.env.CROSSWORD_DB_USER || 'crossword_dev',
	host: import.meta.env.CROSSWORD_DB_HOST || '127.0.0.1',
	password: import.meta.env.CROSSWORD_DB_PASSWORD || 'crossword_dev',
	port: Number(import.meta.env.CROSSWORD_DB_PORT) || 5432
});

export const connect = async () => await pool.connect();
