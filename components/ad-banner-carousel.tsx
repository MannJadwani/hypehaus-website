'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons';

export type AdBannerItem = {
  id: string;
  placement: 'home_feed';
  title: string;
  subtitle: string | null;
  image_url: string;
  cta_text: string;
  target_url: string | null;
  event_id: string | null;
};

function BannerLink({
  ad,
  children,
}: {
  ad: AdBannerItem;
  children: ReactNode;
}) {
  if (ad.event_id) {
    return <Link href={`/events/${ad.event_id}`} className="block h-full w-full">{children}</Link>;
  }

  if (ad.target_url) {
    return (
      <a href={ad.target_url} target="_blank" rel="noreferrer" className="block h-full w-full">
        {children}
      </a>
    );
  }

  return <div className="h-full w-full">{children}</div>;
}

export function AdBannerCarousel({ ads }: { ads: AdBannerItem[] }) {
  const items = useMemo(() => ads.filter((ad) => !!ad.image_url), [ads]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImageIds, setFailedImageIds] = useState<Record<string, boolean>>({});

  const hasMultiple = items.length > 1;
  const displayIndex = items.length ? activeIndex % items.length : 0;

  useEffect(() => {
    if (!hasMultiple) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [hasMultiple, items.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  if (!items.length) return null;

  return (
    <section className="relative w-full sm:w-[calc(100%+3rem)] sm:-mx-6">
      <div
        className="relative overflow-hidden border-y"
        style={{
          height: 'clamp(170px, 28vw, 280px)',
          borderColor: 'rgba(255,255,255,0.08)',
          background: '#141519',
        }}
      >
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${displayIndex * 100}%)` }}
        >
          {items.map((ad) => (
            <div key={ad.id} className="relative h-full min-w-full">
              <BannerLink ad={ad}>
                {!failedImageIds[ad.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ad.image_url}
                    alt={ad.title}
                    className="absolute inset-0 h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={() => {
                      setFailedImageIds((prev) => ({ ...prev, [ad.id]: true }));
                    }}
                  />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(120deg, rgba(43,18,76,0.95) 0%, rgba(20,21,25,0.98) 60%, rgba(11,11,13,1) 100%)',
                    }}
                  />
                )}
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(to right, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.18) 100%)',
                  }}
                />

                <div className="absolute inset-0 p-5 md:p-6 flex flex-col justify-between">
                  <div className="flex items-center">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                      style={{
                        background: 'rgba(20,21,25,0.7)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.92)',
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      <Icon name="sparkle" size={12} />
                      Sponsored
                    </span>
                  </div>

                  <div className="flex items-end justify-between gap-4">
                    <div className="min-w-0">
                      <h2
                        className="text-lg md:text-2xl font-bold"
                        style={{
                          color: 'rgba(255,255,255,0.98)',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {ad.title}
                      </h2>
                      {ad.subtitle && (
                        <p
                          className="text-xs md:text-sm mt-1"
                          style={{
                            color: 'rgba(255,255,255,0.74)',
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
                        boxShadow: '0 6px 20px rgba(139,92,246,0.25)',
                      }}
                    >
                      {ad.cta_text || 'Learn more'}
                      <Icon name="chevron-right" size={14} />
                    </span>
                  </div>
                </div>
              </BannerLink>
            </div>
          ))}
        </div>

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(11,11,13,0.65)', border: '1px solid rgba(255,255,255,0.14)' }}
              aria-label="Previous ad"
            >
              <Icon name="chevron-left" size={16} style={{ color: 'rgba(255,255,255,0.9)' }} />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(11,11,13,0.65)', border: '1px solid rgba(255,255,255,0.14)' }}
              aria-label="Next ad"
            >
              <Icon name="chevron-right" size={16} style={{ color: 'rgba(255,255,255,0.9)' }} />
            </button>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {items.map((ad, idx) => (
                <button
                  key={ad.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: displayIndex === idx ? 20 : 8,
                    background: displayIndex === idx ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.45)',
                  }}
                  aria-label={`Go to ad ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
