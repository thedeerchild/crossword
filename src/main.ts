import express from 'express';
import { handler } from '../build/handler.js';
import { runMigrations } from './migrate';

if (process.argv.includes('--migrate')) {
	console.log(`Running migrations...`);
	try {
		const progress = await runMigrations();
		if (progress.num) {
			console.log(`Migrated ${progress.direction} by ${progress.num} versions successfully`);
		} else {
			console.log(`No migrations needed`);
		}
		process.exit(0);
	} catch (e) {
		console.error(e);
		process.exit(1);
	}
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
