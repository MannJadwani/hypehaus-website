'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Icon } from './icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { isPastEvent } from '@/lib/utils';
import type { EventItem } from './event-card';

interface EventReelCardProps {
  event: EventItem;
  onWishlistChange?: (eventId: string, isWishlisted: boolean) => void;
}

export function EventReelCard({ event, onWishlistChange }: EventReelCardProps) {
  const { user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkWishlist = async () => {
      const { data } = await supabase
        .from('event_wishlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_id', event.id)
        .maybeSingle();
      setIsWishlisted(!!data);
    };

    checkWishlist();
  }, [user, event.id]);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      window.location.href = '/login';
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    const newWishlisted = !isWishlisted;

    try {
      if (newWishlisted) {
        await supabase
          .from('event_wishlist')
          .insert({ user_id: user.id, event_id: event.id });
      } else {
        await supabase
          .from('event_wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', event.id);
      }

      setIsWishlisted(newWishlisted);
      onWishlistChange?.(event.id, newWishlisted);
    } catch {
      setIsWishlisted(!newWishlisted);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = `${window.location.origin}/events/${event.id}`;
    const shareText = `Check out "${event.title}" on HypeHaus!\n\n${event.location} • ${event.date}`;

    if (navigator.share) {
      await navigator.share({
        title: event.title,
        text: shareText,
        url: shareUrl,
      });
    } else {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      alert('Link copied to clipboard!');
    }
  };

  const past = isPastEvent(event.start_at);

  return (
    <motion.div
      className="relative w-full snap-start"
      style={{ height: '100svh' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/events/${event.id}`} className="block h-full">
        <div className="relative h-full w-full overflow-hidden bg-[#0B0B0D]">
          <Image
            src={event.image || '/placeholder.jpg'}
            alt={event.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority={false}
            style={{ objectPosition: 'center 20%' }}
          />

          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.85) 100%)',
            }}
          />

          <div className="absolute top-28 left-6 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background: 'rgba(20,21,25,0.7)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Icon name="grid" size={14} />
            {event.category}
          </div>

          <div
            className="absolute top-28 right-6 px-3 py-1.5 rounded-full text-sm font-bold"
            style={{
              background: '#A34054',
              color: 'rgba(255,255,255,0.95)',
              boxShadow: '0 4px 12px rgba(163,64,84,0.4)'
            }}
          >
            {event.price}
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
                boxShadow: '0 16px 40px rgba(0,0,0,0.45)'
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
                {event.title}
              </h2>
              <p
                className="text-xs mb-2"
                style={{
                  color: 'rgba(255,255,255,0.7)',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {event.location} • {event.date}
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleWishlistToggle}
                  disabled={isLoading}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: 'rgba(30,31,36,0.8)',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}
                >
                  <Icon
                    name="heart"
                    size={16}
                    style={{
                      color: isWishlisted ? '#A34054' : 'rgba(255,255,255,0.8)',
                      fill: isWishlisted ? '#A34054' : 'none'
                    }}
                  />
                </button>

                <button
                  onClick={handleShare}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: 'rgba(30,31,36,0.8)',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}
                >
                  <Icon name="share" size={16} style={{ color: 'rgba(255,255,255,0.8)' }} />
                </button>

                {!past && (
                  <span className="ml-auto">
                    <Link
                      href={`/events/${event.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-bold transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #8B5CF6 0%, #2B124C 100%)',
                        color: 'rgba(255,255,255,0.95)',
                        boxShadow: '0 6px 20px rgba(139,92,246,0.5)'
                      }}
                    >
                      <Icon name="ticket" size={14} />
                      Book Now
                    </Link>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
