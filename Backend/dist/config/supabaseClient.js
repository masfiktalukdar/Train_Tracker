import { createClient } from '@supabase/supabase-js';
import env from 'dotenv';
env.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL and Service Key must be provided.');
}
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
export default supabase;
//# sourceMappingURL=supabaseClient.js.map