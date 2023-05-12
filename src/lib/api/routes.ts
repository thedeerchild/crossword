import { z } from 'zod';

export const API_ROUTES = {
	CreatePuzzle: {
		path: '/puzzles',
		requestSchema: z.object({
			width: z.number().min(1).max(21)
		}),
		responseSchema: z.object({
			success: z.boolean(),
			id: z.string().ulid().nullable()
		})
	}
} as const;

export type RouteName = keyof typeof API_ROUTES;
