'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './icons';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/profile';

const navItems = [
  { href: '/', label: 'Events', icon: 'home' as const },
  { href: '/tickets', label: 'My Tickets', icon: 'ticket' as const },
  { href: '/wishlist', label: 'Wishlist', icon: 'heart' as const },
  { href: '/profile', label: 'Profile', icon: 'user' as const },
];

export function Header() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Fetch profile when user changes
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data) {
        setProfile(data as Profile);
      }
    };

    fetchProfile();
  }, [user]);

  // Get avatar URL - check if it's already a full URL or just a path
  const avatarUrl = profile?.avatar_url
    ? profile.avatar_url.startsWith('http')
      ? profile.avatar_url
      : supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl
    : null;

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(11, 11, 13, 0.9)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 1rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: '64px',
              position: 'relative',
            }}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2" style={{ flexShrink: 0 }}>
              <div
                className="w-8 h-8 rounded-lg relative overflow-hidden"
              >
                <Image
                  src="/logo.jpg"
                  alt="HypeHaus Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.95)' }}>
                HypeHaus
              </span>
            </Link>

            {/* Desktop Nav - Centered */}
            <nav
              className="hidden md:flex items-center gap-1"
              style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    background: isActive(item.href)
                      ? 'rgba(43, 18, 76, 0.6)'
                      : 'transparent',
                    color: isActive(item.href) ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive(item.href)) {
                      e.currentTarget.style.background = 'rgba(30, 31, 36, 0.6)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive(item.href)) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                    }
                  }}
                >
                  <Icon name={item.icon} size={16} />
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Desktop User Menu */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors"
                    style={{ background: profileMenuOpen ? '#1E1F24' : 'transparent' }}
                  >
                    <div
                      className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center"
                      style={{ background: '#25262C', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt="Profile"
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Icon name="user" size={16} style={{ color: 'rgba(255,255,255,0.7)' }} />
                      )}
                    </div>
                    <Icon
                      name="chevron-right"
                      size={16}
                      style={{
                        color: 'rgba(255,255,255,0.5)',
                        transform: profileMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                      }}
                    />
                  </button>

                  <AnimatePresence>
                    {profileMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setProfileMenuOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 top-full mt-2 w-48 py-2 rounded-xl shadow-2xl z-20"
                          style={{
                            background: '#141519',
                            border: '1px solid rgba(255,255,255,0.08)'
                          }}
                        >
                          <Link
                            href="/profile"
                            className="flex items-center gap-3 px-4 py-2 text-sm transition-colors"
                            style={{ color: 'rgba(255,255,255,0.7)' }}
                            onClick={() => setProfileMenuOpen(false)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#1E1F24';
                              e.currentTarget.style.color = 'rgba(255,255,255,0.95)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                            }}
                          >
                            <Icon name="settings" size={16} />
                            Settings
                          </Link>
                          <Link
                            href="/history"
                            className="flex items-center gap-3 px-4 py-2 text-sm transition-colors"
                            style={{ color: 'rgba(255,255,255,0.7)' }}
                            onClick={() => setProfileMenuOpen(false)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#1E1F24';
                              e.currentTarget.style.color = 'rgba(255,255,255,0.95)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                            }}
                          >
                            <Icon name="history" size={16} />
                            History
                          </Link>
                          <hr style={{ margin: '0.5rem 0', borderColor: 'rgba(255,255,255,0.08)' }} />
                          <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 px-4 py-2 text-sm w-full text-left transition-colors"
                            style={{ color: '#f87171' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <Icon name="logout" size={16} />
                            Sign Out
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="btn-primary"
                  style={{
                    padding: '0.625rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    borderRadius: '0.875rem',
                  }}
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl transition-colors"
              style={{ background: mobileMenuOpen ? '#1E1F24' : 'transparent' }}
            >
              <Icon name={mobileMenuOpen ? 'x' : 'menu'} size={24} style={{ color: 'rgba(255,255,255,0.9)' }} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: 'rgba(0,0,0,0.6)' }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-72 z-50 md:hidden"
              style={{ background: '#141519' }}
            >
              <div className="flex flex-col h-full">
                <div
                  className="flex items-center justify-between p-4"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <span className="text-lg font-bold" style={{ color: 'rgba(255,255,255,0.95)' }}>Menu</span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-xl"
                    style={{ background: '#1E1F24' }}
                  >
                    <Icon name="x" size={20} style={{ color: 'rgba(255,255,255,0.9)' }} />
                  </button>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
                      style={{
                        background: isActive(item.href) ? '#2B124C' : '#1E1F24',
                        color: isActive(item.href) ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
                      }}
                    >
                      <Icon name={item.icon} size={20} />
                      {item.label}
                    </Link>
                  ))}
                </nav>

                <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  {user ? (
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
                      style={{
                        background: 'rgba(239,68,68,0.1)',
                        color: '#f87171',
                        border: '1px solid rgba(239,68,68,0.2)'
                      }}
                    >
                      <Icon name="logout" size={20} />
                      Sign Out
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn-primary w-full text-center block"
                    >
                      Sign In
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
