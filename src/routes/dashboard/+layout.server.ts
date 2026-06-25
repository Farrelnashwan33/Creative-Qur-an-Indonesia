import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw redirect(303, '/login');
	}

	const role = locals.userRole || 'santri';

	// We can fetch additional profile data here if needed,
	// for now we just return user and role
	return {
		user,
		role
	};
};
