import { redirect } from '@sveltejs/kit';
import { ulid } from 'ulid';

export const load = () => {
	throw redirect(302, `${ulid()}/edit`);
};
