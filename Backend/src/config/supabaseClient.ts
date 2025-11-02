import { createClient } from '@supabase/supabase-js';
import env from 'dotenv';

env.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Service Key must be provided.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;