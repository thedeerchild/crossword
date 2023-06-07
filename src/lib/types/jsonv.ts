import { makeServerError } from '$lib/errors/server';
import { z } from 'zod';

export class JsonWrapper<Identifier extends string, T extends z.Schema> {
	constructor(readonly tag: Identifier, readonly currentSchema: T) {}

	fromJSON(json: string): z.infer<typeof this.currentSchema> {
		const wrapperSchema = z
			.object({
				t: z.literal(this.tag),
				v: z.literal(1),
				d: z.any()
			})
			.strict();

		let wrapper: z.infer<typeof wrapperSchema>;
		try {
			wrapper = wrapperSchema.parse(JSON.parse(json));
		} catch (e) {
			throw makeServerError(
				'ERR_GENERIC_SERVER_NON_RETRYABLE',
				'Attempted to deserialize invalid wrapped JSON',
				e
			);
		}

		if (wrapper.v === 1) {
			return this.currentSchema.parse(wrapper.d);
		}
	}

	wrapJson(data: z.infer<typeof this.currentSchema>) {
		return { t: this.tag, v: 1, d: data };
	}
}
