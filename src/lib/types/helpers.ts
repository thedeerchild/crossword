import { z } from 'zod';

/**
 * Returns all keys in all branches of a type union as a union of strings.
 *
 * E.g. `KeysOfUnion<{ A: any; } | { B: any; }> = 'A' | 'B';`
 */
export type KeysOfUnion<T> = T extends T ? keyof T : never;

/**
 * Creates a Zod Enum schema based on the keys of a provided object.
 */
export function zodEnumFromObjKeys<K extends string>(
	obj: Record<K, unknown>
): z.ZodEnum<[K, ...K[]]> {
	const [firstKey, ...otherKeys] = Object.keys(obj) as K[];
	return z.enum([firstKey, ...otherKeys]);
}

/**
 * Creates a `Partial<T>` of `obj` with the `keys` removed
 *
 * @param obj Object to remove the keys from
 * @param keys Array of keys to remove
 * @returns Object with only the keys not named in the `keys` array
 */
export function omitKeys<K extends string, T extends Record<K, unknown>>(
	obj: T,
	keys: (keyof T)[]
): Record<K, unknown> {
	let remaining: Partial<T> = obj;
	keys.forEach((key) => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { [key as keyof T]: _, ...rest } = remaining;
		remaining = rest as Partial<T>;
	});

	return remaining as Record<K, unknown>;
}
