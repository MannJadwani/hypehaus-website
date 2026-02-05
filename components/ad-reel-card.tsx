'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Icon } from '@/components/icons';

export type AdItem = {
  id: string;
  placement: 'home_feed';
  title: string;
  subtitle: string | null;
  image_url: string;
  cta_text: string;
  target_url: string | null;
  event_id: string | null;
};

function AdLink({
  href,
  children,
}: {
  href: { kind: 'event'; id: string } | { kind: 'url'; url: string };
  children: ReactNode;
}) {
  if (href.kind === 'event') {
    return (
      <Link href={`/events/${href.id}`} className="block h-full">
        {children}
      </Link>
    );
  }

  return (
    <a href={href.url} target="_blank" rel="noreferrer" className="block h-full">
      {children}
    </a>
  );
}

export function AdReelCard({ ad }: { ad: AdItem }) {
  const href = ad.event_id
    ? ({ kind: 'event', id: ad.event_id } as const)
    : ({ kind: 'url', url: ad.target_url || '#' } as const);

  return (
    <motion.div
      className="relative w-full snap-start"
      style={{ height: '100svh' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <AdLink href={href}>
        <div className="relative h-full w-full overflow-hidden bg-[#0B0B0D]">
          <Image
            src={ad.image_url}
            alt={ad.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority={false}
            style={{ objectPosition: 'center 20%' }}
          />

          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.88) 100%)',
            }}
          />

          <div
            className="absolute top-28 left-6 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background: 'rgba(20,21,25,0.7)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Icon name="sparkle" size={14} />
            Ad
          </div>

          <div
            className="absolute inset-x-0 bottom-0 px-3"
            style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
          >
            <div
              className="rounded-2xl border border-white/10 px-4 py-3"
              style={{
                background: 'rgba(10,10,12,0.55)',
                backdropFilter: 'blur(18px)',
                boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
              }}
            >
              <h2
                className="text-xl font-bold mb-1"
                style={{
                  color: 'rgba(255,255,255,0.98)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {ad.title}
              </h2>

              {ad.subtitle && (
                <p
                  className="text-xs mb-2"
                  style={{
                    color: 'rgba(255,255,255,0.72)',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {ad.subtitle}
                </p>
              )}

              <div className="flex items-center gap-3">
                <span className="ml-auto">
                  <span
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-bold transition-all"
                    style={{
                      background: 'linear-gradient(135deg, rgba(139,92,246,1) 0%, rgba(43,18,76,1) 100%)',
                      color: 'rgba(255,255,255,0.95)',
                      boxShadow: '0 6px 20px rgba(139,92,246,0.35)',
                    }}
                  >
                    <Icon name="chevron-right" size={14} />
                    {ad.cta_text || 'Learn more'}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </AdLink>
    </motion.div>
  );
}
