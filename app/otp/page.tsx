'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { ensureProfileExists, getCurrentProfile, isProfileComplete } from '@/lib/profile';
import { cn } from '@/lib/utils';

export default function OtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  // inputRefs no longer needed

  useEffect(() => {
    const storedPhone = localStorage.getItem('hypehaus_phone');
    if (!storedPhone) {
      router.replace('/login');
      return;
    }
    setPhone(storedPhone);
  }, [router]);

  // Handlers simplified to just one onChange for the transparent input
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(val);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms',
      });

      if (verifyError) {
        setError(verifyError.message);
        setIsLoading(false);
        return;
      }

      localStorage.setItem('hypehaus_authed', 'true');
      await ensureProfileExists();

      const profile = await getCurrentProfile();
      if (!isProfileComplete(profile)) {
        router.replace('/onboarding');
      } else {
        router.replace('/');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      setError(message);
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!phone) return;
    setError(null);

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({ phone });
      if (otpError) {
        setError(otpError.message);
        return;
      }
      alert('OTP sent!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resend OTP';
      setError(message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Glow blobs */}
      <div className="absolute top-[-80px] left-[-60px] w-64 h-64 rounded-full bg-[var(--primary-dark)] opacity-25 blur-3xl" />
      <div className="absolute bottom-[-120px] right-[-80px] w-64 h-64 rounded-full bg-[var(--primary-light)] opacity-20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Verify Phone</h1>
          <p className="text-[var(--text-secondary)]">
            Enter the code sent to {phone}
          </p>
        </div>

        {/* OTP Card */}
        <div className="card p-6">
          <form onSubmit={handleVerify}>

            {/* Single Hidden Input + Visual Boxes */}
            <div className="relative w-full mb-6 h-14">
              <input
                type="text"
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={otp}
                onChange={handleOtpChange}
                className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-text"
                autoFocus
                style={{ fontSize: '16px' }} // Prevent zoom on mobile
              />
              <div className="flex justify-between w-full h-full pointer-events-none">
                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const isActive = otp.length === index;
                  const isFilled = otp.length > index;
                  return (
                    <div
                      key={index}
                      className="w-12 h-14 flex items-center justify-center transition-all duration-200"
                      style={{
                        background: '#1E1F24',
                        border: isActive || isFilled ? '1px solid #8B5CF6' : '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '0.75rem',
                        color: 'white',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        boxShadow: isActive ? '0 0 0 2px rgba(139, 92, 246, 0.2)' : 'none'
                      }}
                    >
                      {otp[index] || ''}
                    </div>
                  );
                })}
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center mb-4">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'btn-primary w-full',
                isLoading && 'opacity-70 cursor-not-allowed'
              )}
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={handleResend}
              className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            >
              Didn&apos;t receive code? <span className="text-[var(--primary)]">Resend</span>
            </button>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.back()}
            className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          >
            ← Back to Login
          </button>
        </div>
      </motion.div>
    </div>
  );
}



