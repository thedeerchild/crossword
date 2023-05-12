// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types

import type { ServerErrorBase } from '$lib/errors/server';
import type { DatabasePoolConnection } from 'slonik';

declare global {
	declare namespace App {
		interface Locals {
			db: DatabasePoolConnection;
		}
		interface Error extends ServerErrorBase {
			// Allow arbitrary additional fields and only enforce `ServerErrorBase`, since I couldn't get this to play nice with the full (discriminated union) server error.
			[key: string]: unknown;
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
