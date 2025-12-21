import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !anonKey) {
  console.warn('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(url, anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Demo account constants
export const DEMO_PHONE_NUMBER = '0000000000';
export const DEMO_PHONE_FULL = '+910000000000';
export const DEMO_USER_EMAIL = 'demo@hypehaus.app';

export function isDemoPhone(phone: string): boolean {
  const cleaned = phone.replace(/[^0-9]/g, '');
  return cleaned === DEMO_PHONE_NUMBER ||
         cleaned === '910000000000' ||
         cleaned === '0000000000';
}



