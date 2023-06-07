import { throwServerErrorResponse } from '$lib/api/errors';
import { getConn } from '$lib/db';
import { makeServerError } from '$lib/errors/server';
import { Grid } from '$lib/models/grid';
import {
	NotFoundError,
	UniqueIntegrityConstraintViolationError,
	sql,
	type DatabasePool
} from 'slonik';
import { z } from 'zod';

export async function createPuzzle(db: Promise<DatabasePool>, grid: Grid, name: string) {
	const conn = await getConn(db);
	try {
		const { id } = await conn.one(
			sql.type(z.object({ id: z.string().ulid() }).strict())`
      INSERT INTO puzzles (name, grid, answers)
      VALUES (${name}, ${JSON.stringify(grid)}, ${JSON.stringify({
				t: 'answers',
				v: 1,
				d: { answers: new Array(grid.squares.length).fill(null) }
			})})
      RETURNING uuid_to_ulid(id) AS id
    `
		);
		return id;
	} catch (e) {
		if (e instanceof UniqueIntegrityConstraintViolationError) {
			throwServerErrorResponse(
				makeServerError('ERR_ALREADY_EXISTS', 'Puzzle name must be unique', e)
			);
		}

		throwServerErrorResponse(
			makeServerError('ERR_GENERIC_SERVER_RETRYABLE', 'Could not create puzzle in database', e)
		);
	}
}

export async function getPuzzle(db: Promise<DatabasePool>, id: string) {
	const conn = await getConn(db);
	try {
		return await conn.one(
			sql.type(
				z
					.object({
						name: z.string(),
						grid: z.string().transform((subject) => {
							return Grid.fromJSON(subject);
						}),
						createdAt: z.coerce.date(),
						updatedAt: z.coerce.date()
					})
					.strict()
			)`
      SELECT name, grid, created_at as "createdAt", updated_at as "updatedAt"
      FROM puzzles
      WHERE id = ulid_to_uuid(${id})
    `
		);
	} catch (e) {
		if (e instanceof NotFoundError) {
			throwServerErrorResponse(
				makeServerError('ERR_NOT_FOUND', `Puzzle with id "${id}" does not exist`, e)
			);
		}

		throwServerErrorResponse(
			makeServerError('ERR_GENERIC_SERVER_RETRYABLE', 'Could not fetch puzzle from database', e)
		);
	}
}
