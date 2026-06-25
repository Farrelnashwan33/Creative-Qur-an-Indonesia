import { createServerClient } from '@supabase/ssr';
import { env } from '$env/dynamic/public';
import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

const supabaseUrl = env.PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY || 'dummy_key';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll() {
				return event.cookies.getAll();
			},
			setAll(cookiesToSet) {
				/**
				 * Note: You have to add the `path` variable to the
				 * set and remove method due to sveltekit's cookie API
				 * requiring this to be set, setting the path to an empty string
				 * will replicate previous/standard behavior (https://kit.svelte.dev/docs/adapter-node#environment-variables)
				 */
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});

	/**
	 * Unlike `supabase.auth.getSession()`, which returns the session _without_
	 * validating the JWT, this function also calls `getUser()` to validate the
	 * JWT on the server. This yields safer session data.
	 */
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		if (!session) {
			return { session: null, user: null };
		}

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		if (error) {
			// JWT validation has failed
			return { session: null, user: null };
		}

		return { session, user };
	};

	const { session, user } = await event.locals.safeGetSession();

	// Fetch user role if user exists
	let userRole = null;
	if (user) {
		const { data: profile } = await event.locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', user.id)
			.single();
		userRole = profile?.role || 'santri';
	}
    
    event.locals.user = user;
    event.locals.userRole = userRole;

	// Route protection middleware
	const path = event.url.pathname;
    
	if (path.startsWith('/dashboard')) {
		if (!user) {
			throw redirect(303, '/login');
		}
        
        // Role-based protection for sub-dashboards
        if (path.startsWith('/dashboard/admin') && userRole !== 'admin') {
            throw redirect(303, '/403');
        }
        if (path.startsWith('/dashboard/ustadz') && userRole !== 'ustadz' && userRole !== 'admin') {
            throw redirect(303, '/403');
        }
        if (path.startsWith('/dashboard/santri') && userRole !== 'santri' && userRole !== 'admin') {
            throw redirect(303, '/403');
        }
        if (path.startsWith('/dashboard/wali') && userRole !== 'wali' && userRole !== 'admin') {
            throw redirect(303, '/403');
        }
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
