import { createClient } from '@supabase/supabase-js';

export const supabaseBrowser = () =>
  createClient(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_ANON_KEY);

export const supabaseServer = () =>
  createClient(process.env.PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false }
  });
