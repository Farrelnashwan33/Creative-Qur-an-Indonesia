import { createBrowserClient } from '@supabase/ssr';
import { env } from '$env/dynamic/public';

// If env vars are missing, we will provide a dummy fallback just to allow the app to compile,
// but it will fail on actual network requests.
const supabaseUrl = env.PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY || 'dummy_key';

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
