import { supabase, DEMO_PHONE_FULL, DEMO_USER_EMAIL } from './supabase';

export interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  age: number | null;
  gender: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | null;
  marketing_consent: boolean;
  created_at: string;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data as Profile;
}

export function isProfileComplete(profile: Profile | null): boolean {
  if (!profile) return false;
  
  // Demo users are always complete
  if (profile.email === DEMO_USER_EMAIL || profile.phone === DEMO_PHONE_FULL) {
    return true;
  }
  
  return !!(
    profile.full_name &&
    profile.phone &&
    typeof profile.age === 'number' &&
    profile.gender
  );
}

export async function ensureProfileExists(): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return;

  const { data } = await supabase
    .from('profiles')
    .select('id, phone')
    .eq('id', user.id)
    .maybeSingle();

  // Check if this is a demo user
  const storedPhone = typeof window !== 'undefined' ? localStorage.getItem('hypehaus_phone') : null;
  const isDemo = user.is_anonymous || storedPhone === DEMO_PHONE_FULL;

  if (!data) {
    if (isDemo) {
      // Create complete demo profile
      await supabase.from('profiles').upsert({
        id: user.id,
        email: DEMO_USER_EMAIL,
        phone: DEMO_PHONE_FULL,
        full_name: 'Demo User',
        age: 25,
        gender: 'prefer_not_to_say',
      });
    } else {
      // Create regular profile
      const full_name = (user.user_metadata as { full_name?: string })?.full_name || null;
      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        phone: user.phone,
        full_name,
      });
    }
  } else if (isDemo && data.phone !== DEMO_PHONE_FULL) {
    // Update existing profile to demo profile
    await supabase.from('profiles').update({
      email: DEMO_USER_EMAIL,
      phone: DEMO_PHONE_FULL,
      full_name: 'Demo User',
      age: 25,
      gender: 'prefer_not_to_say',
    }).eq('id', user.id);
  }
}



