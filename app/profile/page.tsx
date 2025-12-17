'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Icon } from '@/components/icons';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { getCurrentProfile, type Profile } from '@/lib/profile';

const genderOptions = [
  { key: 'male', label: 'Male' },
  { key: 'female', label: 'Female' },
  { key: 'non_binary', label: 'Non-binary' },
  { key: 'prefer_not_to_say', label: 'Prefer not to say' },
] as const;

type GenderType = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | '';

export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Editable fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [originalPhone, setOriginalPhone] = useState('');
  const [gender, setGender] = useState<GenderType>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [reminders, setReminders] = useState(true);
  const [marketing, setMarketing] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const p = await getCurrentProfile();
        if (p) {
          setName(p.full_name || '');
          setEmail(p.email || '');
          const profilePhone = p.phone || '';
          setPhone(profilePhone);
          setOriginalPhone(profilePhone);
          setGender((p as Profile & { gender?: GenderType }).gender || '');
          setAvatarUrl(p.avatar_url || null);
          setMarketing(p.marketing_consent || false);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  // Realtime subscription for profile updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('profile_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as Profile;
          if (row) {
            setName(row.full_name || '');
            setEmail(row.email || '');
            setPhone(row.phone || '');
            setAvatarUrl(row.avatar_url || null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  // Compress image using canvas
  const compressImage = async (file: File, maxSizeKB: number = 30): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Calculate new dimensions (max 400px)
        let width = img.width;
        let height = img.height;
        const maxDim = 400;

        if (width > height && width > maxDim) {
          height = (height / width) * maxDim;
          width = maxDim;
        } else if (height > maxDim) {
          width = (width / height) * maxDim;
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        // Try different quality levels
        let quality = 0.8;
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }
              if (blob.size > maxSizeKB * 1024 && quality > 0.1) {
                quality -= 0.1;
                tryCompress();
              } else {
                resolve(blob);
              }
            },
            'image/jpeg',
            quality
          );
        };
        tryCompress();
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setMessage(null);

    try {
      // Compress image
      const compressed = await compressImage(file, 30);
      const path = `${user.id}/${Date.now()}.jpg`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, compressed, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      const newAvatarUrl = publicUrlData.publicUrl;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', user.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setAvatarUrl(newAvatarUrl);
      setMessage({ type: 'success', text: 'Profile picture updated!' });
    } catch (err) {
      const error = err as Error;
      setMessage({ type: 'error', text: error.message || 'Failed to upload image' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      // Validate phone format
      const fullPhone = phone?.startsWith('+') ? phone : phone ? `+91${phone.replace(/[^0-9]/g, '')}` : null;

      // Phone number cannot be changed once set
      if (originalPhone && fullPhone && fullPhone !== originalPhone) {
        setMessage({ type: 'error', text: 'Phone number cannot be changed once set.' });
        setSaving(false);
        return;
      }

      // Update email in auth if changed
      if (email && email !== user.email) {
        const { error: authErr } = await supabase.auth.updateUser({ email });
        if (authErr) {
          setMessage({ type: 'error', text: authErr.message });
          setSaving(false);
          return;
        }
      }

      // Update profile
      const phoneToSave = originalPhone || fullPhone;
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: name || null,
          phone: phoneToSave,
          gender: gender || null,
          email: email || null,
          marketing_consent: marketing,
        })
        .eq('id', user.id);

      if (error) {
        if (error.code === '23505') {
          setMessage({ type: 'error', text: 'This phone number is already linked to another account.' });
        } else {
          setMessage({ type: 'error', text: error.message });
        }
      } else {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        if (!originalPhone && phoneToSave) {
          setOriginalPhone(phoneToSave);
        }
      }
    } catch (err) {
      const error = err as Error;
      setMessage({ type: 'error', text: error.message || 'Failed to save profile' });
    } finally {
      setSaving(false);
    }
  };

  // Not logged in
  if (!loading && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#0B0B0D' }}>
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: '#1E1F24', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Icon name="user" size={40} style={{ color: 'rgba(255,255,255,0.45)' }} />
        </div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.95)' }}>
          Sign in to view your profile
        </h2>
        <p className="text-center mb-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Access your tickets, wishlist, and account settings
        </p>
        <Link href="/login" className="btn-primary">
          Sign In
        </Link>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#0B0B0D' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-28 h-28 skeleton rounded-full mb-4" />
            <div className="h-6 skeleton rounded-lg w-40 mb-2" />
            <div className="h-4 skeleton rounded-lg w-32" />
          </div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 skeleton rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Get avatar display URL
  const displayAvatarUrl = avatarUrl?.startsWith('http')
    ? avatarUrl
    : avatarUrl
      ? supabase.storage.from('avatars').getPublicUrl(avatarUrl).data.publicUrl
      : null;

  return (
    <div className="min-h-screen pb-12" style={{ background: '#0B0B0D' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'rgba(255,255,255,0.95)' }}>
          Profile Settings
        </h1>

        {/* Avatar Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full overflow-hidden"
              style={{
                background: '#1E1F24',
                border: '2px solid rgba(255,255,255,0.08)'
              }}
            >
              {displayAvatarUrl ? (
                <Image src={displayAvatarUrl} alt="Avatar" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {(name || email || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={{
              background: '#1E1F24',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.9)',
              opacity: uploading ? 0.6 : 1,
            }}
          >
            <Icon name="camera" size={16} />
            {uploading ? 'Uploading...' : 'Change photo'}
          </button>
        </motion.div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl"
            style={{
              background: message.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: message.type === 'success' ? '#22c55e' : '#f87171',
            }}
          >
            {message.text}
          </motion.div>
        )}

        {/* Form Fields */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-4 mb-8"
        >
          {/* Name */}
          <div>
            <label className="block text-sm mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{
                background: '#1E1F24',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.95)',
              }}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@email.com"
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{
                background: '#1E1F24',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.95)',
              }}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              disabled={!!originalPhone}
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{
                background: originalPhone ? '#141519' : '#1E1F24',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.95)',
                opacity: originalPhone ? 0.6 : 1,
              }}
            />
            {originalPhone && (
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Phone number cannot be changed once set
              </p>
            )}
          </div>
        </motion.div>

        {/* Gender Selection */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <label className="block text-sm mb-3 font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>Gender</label>
          <div className="flex flex-wrap gap-2">
            {genderOptions.map((g) => (
              <button
                key={g.key}
                onClick={() => setGender(g.key)}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: gender === g.key ? '#2B124C' : '#1E1F24',
                  border: `1px solid ${gender === g.key ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: gender === g.key ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
                }}
              >
                {g.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Notification Toggles */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <label className="block text-sm mb-3 font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>Notifications</label>
          <div className="space-y-3">
            {/* Event Reminders */}
            <div
              className="flex items-center justify-between p-4 rounded-xl"
              style={{
                background: '#1E1F24',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex items-center gap-3">
                <Icon name="clock" size={18} style={{ color: '#8B5CF6' }} />
                <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.95)' }}>Event reminders</span>
              </div>
              <button
                onClick={() => setReminders(!reminders)}
                className="w-12 h-7 rounded-full p-1 transition-colors"
                style={{ background: reminders ? '#2B124C' : '#25262C' }}
              >
                <div
                  className="w-5 h-5 rounded-full transition-transform"
                  style={{
                    background: 'rgba(255,255,255,0.9)',
                    transform: reminders ? 'translateX(20px)' : 'translateX(0)',
                  }}
                />
              </button>
            </div>

            {/* Marketing Emails */}
            <div
              className="flex items-center justify-between p-4 rounded-xl"
              style={{
                background: '#1E1F24',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex items-center gap-3">
                <Icon name="sparkle" size={18} style={{ color: '#8B5CF6' }} />
                <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.95)' }}>Marketing emails</span>
              </div>
              <button
                onClick={() => setMarketing(!marketing)}
                className="w-12 h-7 rounded-full p-1 transition-colors"
                style={{ background: marketing ? '#2B124C' : '#25262C' }}
              >
                <div
                  className="w-5 h-5 rounded-full transition-transform"
                  style={{
                    background: 'rgba(255,255,255,0.9)',
                    transform: marketing ? 'translateX(20px)' : 'translateX(0)',
                  }}
                />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-xl font-bold text-white transition-opacity"
          style={{
            background: 'linear-gradient(135deg, #8B5CF6 0%, #2B124C 100%)',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </motion.button>

        {/* Sign Out */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          onClick={handleSignOut}
          className="flex items-center justify-center gap-3 w-full p-4 rounded-xl mt-6 transition-colors"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171'
          }}
        >
          <Icon name="logout" size={20} />
          <span className="font-semibold">Sign Out</span>
        </motion.button>

        {/* Footer Links */}
        <div className="text-center mt-10">
          <div className="flex items-center justify-center gap-3 text-sm">
            <Link
              href="https://hypehausco.in/privacy-policy"
              target="_blank"
              className="transition-colors hover:underline"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              Privacy Policy
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
            <Link
              href="https://hypehausco.in/terms"
              target="_blank"
              className="transition-colors hover:underline"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              Terms
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
            <Link
              href="https://hypehausco.in/delete-account"
              target="_blank"
              className="transition-colors hover:underline"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              Delete Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
