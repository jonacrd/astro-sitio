// Importar configuración centralizada
import { createSupabaseClient, createSupabaseServerClient } from './supabase-config';

export const supabaseBrowser = createSupabaseClient;
export const supabaseServer = createSupabaseServerClient;
