import { readdir, readFile } from 'fs';
import { createPool, sql, type DatabasePool } from 'slonik';
import { promisify } from 'util';
import { z } from 'zod';

const MIGRATION_DIR = './db/migrations';
const MIGRATION_TABLE = 'schema_migrations';

const DB_URL = `postgres://${process.env.CROSSWORD_DB_USER || 'crossword_dev'}:${
	process.env.CROSSWORD_DB_PASSWORD || 'crossword_dev'
}@${process.env.CROSSWORD_DB_HOST || '127.0.0.1'}:${
	Number(process.env.CROSSWORD_DB_PORT) || 5432
}/${process.env.CROSSWORD_DB_NAME || 'crossword_dev'}`;

type DownMigration = {
	name: string;
	version: number;
	downQuery: string;
};

type UpMigration = {
	name: string;
	version: number;
	upQuery: string;
	// Up migrations also include the down migration so it can be stored in the database.
	downQuery: string;
};

const voidSchema = z.object({}).strict();
const ls = promisify(readdir);
const read = promisify(readFile);

async function getLatestMigrationFileVersion() {
	const files = await ls(MIGRATION_DIR);
	const migrations = files.filter((file) => {
		const nameParts = file.split('.');
		return nameParts.length === 3 && nameParts[2] === 'sql' && nameParts[1] === 'up';
	});
	return migrations.length > 0 ? Number(migrations[migrations.length - 1].split('_')[0]) : 0;
}

async function getMigrationFilesInRange({
	start = 0,
	end
}: {
	start?: number;
	end?: number;
}): Promise<UpMigration[]> {
	const highestVersion = end || (await getLatestMigrationFileVersion());

	const files = await ls(MIGRATION_DIR);
	return await Promise.all(
		files
			.filter((file) => {
				const nameParts = file.split('.');
				return nameParts.length === 3 && nameParts[2] === 'sql' && nameParts[1] === 'up';
			})
			.map((file) => ({
				name: file.split('.')[0],
				version: Number(file.split('_')[0])
			}))
			.filter((file) => {
				return file.version >= start && file.version <= highestVersion;
			})
			.map(async (file) => ({
				...file,
				upQuery: await read(`${MIGRATION_DIR}/${file.name}.up.sql`, {
					encoding: 'utf-8'
				}),
				downQuery: await read(`${MIGRATION_DIR}/${file.name}.down.sql`, {
					encoding: 'utf-8'
				})
			}))
	);
}

async function checkSchemaTableExists(db: DatabasePool) {
	const exists = await db.exists(sql.type(voidSchema)`
      SELECT FROM information_schema.tables 
      WHERE  table_schema = 'public'
      AND    table_name   = ${MIGRATION_TABLE}
  `);

	return exists;
}

async function createSchemaTable(db: DatabasePool) {
	await db.query(sql.type(voidSchema)`
    CREATE TABLE ${sql.identifier([MIGRATION_TABLE])}(
      version bigint NOT NULL,
      name TEXT NOT NULL,
      down_query TEXT
    );
  `);
}

async function getSchemaVersion(db: DatabasePool) {
	const result = await db.maybeOne(sql.type(z.object({ version: z.number() }))`
    SELECT version 
    FROM ${sql.identifier([MIGRATION_TABLE])}
    ORDER BY version DESC
    LIMIT 1;
  `);

	return result?.version || 0;
}

async function getPendingDownMigrations(
	db: DatabasePool,
	targetVersion: number
): Promise<readonly DownMigration[]> {
	return db.many(sql.type(
		z.object({ version: z.number(), name: z.string(), downQuery: z.string() }).strict()
	)`
    SELECT version, name, down_query as "downQuery"
    FROM ${sql.identifier([MIGRATION_TABLE])}
    WHERE version > ${targetVersion}
    ORDER BY version DESC;
  `);
}

async function updateDownMigrationContent(db: DatabasePool, m: DownMigration) {
	return db.query(sql.type(voidSchema)`
    UPDATE ${sql.identifier([MIGRATION_TABLE])} SET
      down_query = ${m.downQuery},
      name = ${m.name}
    WHERE
      version = ${m.version}
  `);
}

async function applyUpMigration(db: DatabasePool, m: UpMigration) {
	return db.transaction(async (tx) => {
		await tx.query(sql.unsafe`${sql.fragment([m.upQuery])}`);
		await tx.query(sql.type(voidSchema)`
      INSERT INTO ${sql.identifier([MIGRATION_TABLE])}
        (version, name, down_query)
      VALUES
        (${m.version}, ${m.name}, ${m.downQuery})
    `);
	});
}

async function applyDownMigration(db: DatabasePool, m: DownMigration) {
	return db.transaction(async (tx) => {
		await tx.query(sql.unsafe`${sql.fragment([m.downQuery])}`);
		await tx.query(sql.type(voidSchema)`
      DELETE FROM ${sql.identifier([MIGRATION_TABLE])}
      WHERE version = ${m.version}
    `);
	});
}

export async function runMigrations() {
	const db = await createPool(DB_URL, {});

	// Initialize table to hold migration state.
	if (!(await checkSchemaTableExists(db))) {
		await createSchemaTable(db);
	}

	const targetVersion = await getLatestMigrationFileVersion();
	const currentVersion = await getSchemaVersion(db);

	// Re-sync down migrations below the current version, in case they've changed on disk.
	const down = await getMigrationFilesInRange({ end: currentVersion });
	for (const m of down) {
		console.log(`Confirming down migration content for ${m.name}...`);
		await updateDownMigrationContent(db, m);
	}

	// Run pending up migrations.
	if (targetVersion > currentVersion) {
		const up = await getMigrationFilesInRange({ start: currentVersion + 1 });

		for (const m of up) {
			console.log(`Running up migration ${m.name}...`);
			await applyUpMigration(db, m);
		}

		return { direction: 'up', num: up.length };
	}

	// Run pending down migrations.
	if (targetVersion < currentVersion) {
		const down = await getPendingDownMigrations(db, targetVersion);

		for (const m of down) {
			console.log(`Running down migration ${m.name}...`);
			await applyDownMigration(db, m);
		}

		return { direction: 'down', num: down.length };
	}

	return { num: 0 };
}
