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
      className="w-full snap-none px-4 py-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <AdLink href={href}>
        <div
          className="relative w-full overflow-hidden rounded-2xl border border-white/10"
          style={{
            height: 132,
            background: '#141519',
            boxShadow: '0 14px 34px rgba(0,0,0,0.45)',
          }}
        >
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
              background: 'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.15) 100%)',
            }}
          />

          <div
            className="absolute inset-0 p-4 flex flex-col justify-between"
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{
                  background: 'rgba(20,21,25,0.7)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Icon name="sparkle" size={12} />
                Sponsored
              </span>
            </div>

            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <div
                  className="text-base font-bold"
                  style={{
                    color: 'rgba(255,255,255,0.98)',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {ad.title}
                </div>

                {ad.subtitle && (
                <p
                  className="text-xs mt-1"
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
              </div>

              <span
                className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-bold"
                style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,1) 0%, rgba(43,18,76,1) 100%)',
                  color: 'rgba(255,255,255,0.95)',
                  boxShadow: '0 6px 20px rgba(139,92,246,0.35)',
                }}
              >
                {ad.cta_text || 'Learn more'}
                <Icon name="chevron-right" size={14} />
              </span>
            </div>
          </div>
        </div>
      </AdLink>
    </motion.div>
  );
}
