'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase, DEMO_PHONE_FULL, DEMO_USER_EMAIL } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { getCurrentProfile, isProfileComplete } from '@/lib/profile';
import { cn } from '@/lib/utils';

const genders = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        router.replace('/login');
        return;
      }

      // Check for demo user
      const storedPhone = localStorage.getItem('hypehaus_phone');
      const isDemo = user.is_anonymous || storedPhone === DEMO_PHONE_FULL;

      if (isDemo) {
        // Pre-fill demo user data
        setName('Demo User');
        setAge('25');
        setGender('prefer_not_to_say');
        setEmail(DEMO_USER_EMAIL);
        setLoading(false);
        return;
      }

      // Load existing profile
      const profile = await getCurrentProfile();
      if (profile) {
        if (isProfileComplete(profile)) {
          router.replace('/');
          return;
        }
        if (profile.full_name) setName(profile.full_name);
        if (profile.email) setEmail(profile.email);
        if (typeof profile.age === 'number') setAge(String(profile.age));
        if (profile.gender) setGender(profile.gender);
      }
      setLoading(false);
    };

    checkProfile();
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !age.trim() || !gender) {
      alert('Please fill in all required fields');
      return;
    }

    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: name.trim(),
          age: parseInt(age),
          gender,
          email: email.trim() || null,
        })
        .eq('id', user.id);

      if (error) throw error;
      router.replace('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save profile';
      alert(message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-pulse text-[var(--text-tertiary)]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Complete Your Profile</h1>
          <p className="text-[var(--text-secondary)]">Tell us a bit about yourself</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@email.com"
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">
              Age <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Your age"
              className="input"
              min={13}
              max={120}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">
              Gender <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {genders.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGender(g.value)}
                  className={cn(
                    'px-4 py-2 rounded-[var(--radius-md)] text-sm font-semibold transition-colors border',
                    gender === g.value
                      ? 'bg-[var(--primary-dark)] border-transparent text-[var(--text)]'
                      : 'bg-[var(--background-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-medium)]'
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className={cn(
              'btn-primary w-full mt-4',
              saving && 'opacity-70 cursor-not-allowed'
            )}
          >
            {saving ? 'Saving...' : 'Continue'}
          </button>
        </form>

        <p className="text-xs text-center text-[var(--text-disabled)] mt-6 px-4">
          We collect this information to personalize your experience and ensure you receive relevant event recommendations.
        </p>
      </motion.div>
    </div>
  );
}


