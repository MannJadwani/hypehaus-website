'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { ensureProfileExists, getCurrentProfile, isProfileComplete } from '@/lib/profile';
import { cn } from '@/lib/utils';

export default function OtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const storedPhone = localStorage.getItem('hypehaus_phone');
    if (!storedPhone) {
      router.replace('/login');
      return;
    }
    setPhone(storedPhone);
  }, [router]);

  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    if (pasted.length === 6) {
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone,
        token: code,
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
            <div className="flex justify-center gap-2 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className={cn(
                    'w-12 h-14 text-center text-2xl font-bold',
                    'bg-[var(--background-elevated)] rounded-[var(--radius-md)]',
                    'border border-[var(--border)] focus:border-[var(--primary)]',
                    'transition-colors'
                  )}
                  maxLength={1}
                />
              ))}
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


