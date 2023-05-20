import express from 'express';
import { handler } from '../build/handler.js';

if (process.argv.includes('--migrate')) {
	const dbUrl = `postgres://${process.env.CROSSWORD_DB_USER || 'crossword_dev'}:${
		process.env.CROSSWORD_DB_PASSWORD || 'crossword_dev'
	}@${process.env.CROSSWORD_DB_HOST || '127.0.0.1'}:${
		Number(process.env.CROSSWORD_DB_PORT) || 5432
	}/${process.env.CROSSWORD_DB_NAME || 'crossword_dev'}`;

	console.log(`Migrating ${dbUrl}...`);
}

const app = express();

app.get('/health-check', (_, res) => {
	res.end('ok');
});

app.use(handler);

const port =
	Number(process.env.ORIGIN?.split(':')?.[2]) || Number(process.env.CROSSWORD_PORT) || 3000;

app.listen(port, () => {
	console.log(`Listening on port ${port}...`);
});
