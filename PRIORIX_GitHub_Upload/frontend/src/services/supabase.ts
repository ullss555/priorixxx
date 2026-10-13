import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isConfigured = 
  Boolean(supabaseUrl) && 
  Boolean(supabaseAnonKey) && 
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your_supabase');

export const isSupabaseConfigured = (): boolean => isConfigured;

export const supabase: SupabaseClient | null = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function supabaseSignIn(email: string, password: string) {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function supabaseSignOut() {
  if (supabase) {
    await supabase.auth.signOut();
  }
}
