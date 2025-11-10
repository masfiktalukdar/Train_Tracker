import { createClient } from '@supabase/supabase-js';
import env from 'dotenv';
env.config();
const supabaseUrl = process.env.SUPABASE_URL;
// Use the new SERVICE KEY instead of the ANON KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL and Service Key must be provided.');
}
// Create the client using the service key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        // This disables auto-refreshing the token, which is good for server-side
        autoRefreshToken: false,
        persistSession: false
    }
});
export default supabase;
//# sourceMappingURL=supabaseClient.js.map