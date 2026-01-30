'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase, isDemoPhone, DEMO_PHONE_FULL } from '@/lib/supabase';
import { ensureProfileExists } from '@/lib/profile';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handlePhoneChange = (text: string) => {
    let cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('91') && cleaned.length > 10) {
      cleaned = cleaned.substring(2);
    }
    cleaned = cleaned.substring(0, 10);
    setPhone(cleaned);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.trim();
    if (!digits || digits.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    if (cooldown > 0) return;

    const full = `+91${digits}`;
    setIsLoading(true);
    setError(null);

    // Demo phone - use anonymous auth
    if (isDemoPhone(digits)) {
      try {
        const { data, error: authError } = await supabase.auth.signInAnonymously();
        if (authError) {
          setError(`Demo login failed: ${authError.message}`);
          setIsLoading(false);
          return;
        }
        if (!data.session) {
          setError('Demo login failed: No session created');
          setIsLoading(false);
          return;
        }
        localStorage.setItem('hypehaus_authed', 'true');
        localStorage.setItem('hypehaus_phone', DEMO_PHONE_FULL);
        await ensureProfileExists();
        router.replace('/');
        return;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Demo login failed';
        setError(message);
        setIsLoading(false);
        return;
      }
    }

    // Regular OTP flow
    try {
      console.log('Sending OTP to:', full);
      const { error: otpError } = await supabase.auth.signInWithOtp({ phone: full, options: { channel: 'whatsapp' } });
      if (otpError) {
        // Handle specific rate limit errors
        if (otpError.message.includes('429') || otpError.message.toLowerCase().includes('rate limit') || otpError.message.includes('60203')) {
          setError('Too many attempts. Please wait 10 minutes before trying again.');
        } else {
          setError(otpError.message);
        }
        setIsLoading(false);
        return;
      }

      // Start cooldown on success to prevent spamming
      setCooldown(60);
      localStorage.setItem('hypehaus_phone', full);
      router.push('/otp');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden"
      style={{ background: '#0B0B0D' }}
    >
      {/* Glow blobs */}
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: '300px',
          height: '300px',
          top: '-100px',
          left: '-80px',
          background: '#2B124C',
          opacity: 0.3
        }}
      />
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: '300px',
          height: '300px',
          bottom: '-120px',
          right: '-80px',
          background: '#854F6C',
          opacity: 0.25
        }}
      />
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: '250px',
          height: '250px',
          bottom: '150px',
          left: '-60px',
          background: '#A34054',
          opacity: 0.2
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: 'linear-gradient(135deg, #8B5CF6 0%, #2B124C 100%)',
              boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)'
            }}
          >
            <span className="text-white font-bold text-2xl">H</span>
          </div>
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: 'rgba(255,255,255,0.95)' }}
          >
            HypeHaus
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>
            Find the night. Own the moment.
          </p>
        </div>

        {/* Login Card */}
        <div
          className="p-6 sm:p-8"
          style={{
            background: '#141519',
            borderRadius: '1.5rem',
            border: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          <h2
            className="text-xl font-semibold mb-1"
            style={{ color: 'rgba(255,255,255,0.95)' }}
          >
            Welcome back
          </h2>
          <p
            className="text-sm mb-6"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            Sign in to continue
          </p>

          <form onSubmit={handleSendOtp}>
            <div className="mb-5">
              <label
                className="block text-sm mb-2"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                Mobile Number
              </label>
              <div
                className="flex items-center overflow-hidden"
                style={{
                  background: '#1E1F24',
                  borderRadius: '1.125rem',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}
              >
                <span
                  className="px-4 py-3"
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.02)'
                  }}
                >
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="Enter phone number"
                  className="flex-1 px-4 py-3 bg-transparent"
                  style={{
                    color: 'rgba(255,255,255,0.95)',
                    fontSize: '1rem'
                  }}
                  maxLength={10}
                />
              </div>
            </div>

            {error && (
              <p
                className="text-sm mb-4"
                style={{ color: '#f87171' }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading || cooldown > 0}
              className="btn-primary w-full"
              style={{
                opacity: (isLoading || cooldown > 0) ? 0.7 : 1,
                cursor: (isLoading || cooldown > 0) ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading
                ? isDemoPhone(phone) ? 'Signing in...' : 'Sending OTP...'
                : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : isDemoPhone(phone) ? 'Demo Login' : 'Send OTP'
              }
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p
            className="text-xs leading-relaxed mb-4 px-4"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            We collect your phone number for OTP login, and your email, username, age and gender to create your profile. Payments are processed securely through Razorpay. By continuing, you agree to our Privacy Policy and Terms.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm">
            <Link
              href="https://hypehausco.in/privacy-policy"
              target="_blank"
              className="hover:underline transition-colors"
              style={{ color: '#854F6C' }}
            >
              Privacy Policy
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
            <Link
              href="https://hypehausco.in/terms"
              target="_blank"
              className="hover:underline transition-colors"
              style={{ color: '#854F6C' }}
            >
              Terms & Conditions
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
