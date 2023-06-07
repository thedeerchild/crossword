import { z } from 'zod';

export const API_ROUTES = {
	CreatePuzzle: {
		method: 'POST',
		path: () => '/puzzles',
		requestSchema: z
			.object({
				name: z.string(),
				width: z.number().min(1).max(21)
			})
			.strict(),
		responseSchema: z
			.object({
				success: z.boolean(),
				id: z.string().ulid().nullable()
			})
			.strict()
	}
} as const;

export type RouteName = keyof typeof API_ROUTES;
