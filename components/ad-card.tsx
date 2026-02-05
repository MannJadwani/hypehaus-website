'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import type { ReactNode } from 'react';
import type { AdItem } from '@/components/ad-reel-card';

function AdLink({
  href,
  children,
}: {
  href: { kind: 'event'; id: string } | { kind: 'url'; url: string };
  children: ReactNode;
}) {
  if (href.kind === 'event') {
    return <Link href={`/events/${href.id}`}>{children}</Link>;
  }
  return (
    <a href={href.url} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

export function AdCard({ ad }: { ad: AdItem }) {
  const href = ad.event_id
    ? ({ kind: 'event', id: ad.event_id } as const)
    : ({ kind: 'url', url: ad.target_url || '#' } as const);

  return (
    <AdLink href={href}>
      <div
        className="overflow-hidden transition-transform duration-200 hover:scale-[1.01]"
        style={{
          background: '#141519',
          borderRadius: '1.375rem',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="relative h-48">
          <Image src={ad.image_url} alt={ad.title} fill className="object-cover" sizes="(min-width: 768px) 33vw, 100vw" />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 100%)' }}
          />
          <div
            className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
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
        </div>
        <div className="p-4 space-y-2">
          <div className="text-white font-bold text-lg leading-tight">{ad.title}</div>
          {ad.subtitle && <div className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{ad.subtitle}</div>}
          <div className="pt-2">
            <span
              className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-bold"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,1) 0%, rgba(43,18,76,1) 100%)',
                color: 'rgba(255,255,255,0.95)',
                boxShadow: '0 6px 20px rgba(139,92,246,0.25)',
              }}
            >
              {ad.cta_text || 'Learn more'}
              <Icon name="chevron-right" size={14} />
            </span>
          </div>
        </div>
      </div>
    </AdLink>
  );
}

