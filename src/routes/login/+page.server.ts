import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// If already logged in, redirect to appropriate dashboard
	const { session } = await locals.safeGetSession();
	if (session) {
		const role = locals.userRole;
		if (role === 'admin') throw redirect(303, '/dashboard');
		if (role === 'ustadz') throw redirect(303, '/dashboard/ustadz');
		if (role === 'santri') throw redirect(303, '/dashboard/santri');
		if (role === 'wali') throw redirect(303, '/dashboard/wali');
		throw redirect(303, '/dashboard');
	}
	return {};
};

export const actions: Actions = {
	login: async ({ request, locals }) => {
		const body = Object.fromEntries(await request.formData());
		const email = body.email as string;
		const password = body.password as string;

		if (!email || !password) {
			return fail(400, {
				error: 'Email dan password wajib diisi',
				values: { email }
			});
		}

		const { data, error } = await locals.supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			return fail(400, {
				error: error.message || 'Login gagal. Periksa kembali email dan password.',
				values: { email }
			});
		}

		// Fetch role to redirect correctly
		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', data.user.id)
			.single();

		const role = profile?.role || 'santri';

		if (role === 'admin') throw redirect(303, '/dashboard');
		if (role === 'ustadz') throw redirect(303, '/dashboard/ustadz');
		if (role === 'santri') throw redirect(303, '/dashboard/santri');
		if (role === 'wali') throw redirect(303, '/dashboard/wali');

		throw redirect(303, '/dashboard');
	}
};
