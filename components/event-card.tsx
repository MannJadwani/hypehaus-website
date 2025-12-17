'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Icon } from './icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { isPastEvent } from '@/lib/utils';

export interface EventItem {
  id: string;
  title: string;
  image: string;
  price: string;
  location: string;
  date: string;
  category: string;
  start_at?: string | null;
}

interface EventCardProps {
  event: EventItem;
  onWishlistChange?: (eventId: string, isWishlisted: boolean) => void;
}

export function EventCard({ event, onWishlistChange }: EventCardProps) {
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
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Link href={`/events/${event.id}`} className="block">
        <div
          className="card overflow-hidden group cursor-pointer"
          style={{
            background: '#141519',
            borderRadius: '1.375rem',
            border: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          {/* Image */}
          <div className="relative h-48 overflow-hidden">
            <Image
              src={event.image || '/placeholder.jpg'}
              alt={event.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {/* Gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to top, rgba(20,21,25,0.95) 0%, rgba(20,21,25,0.6) 40%, transparent 100%)'
              }}
            />

            {/* Price badge */}
            <div
              className="absolute top-3 right-3 px-3 py-1.5 rounded-xl text-sm font-bold"
              style={{
                background: '#A34054',
                color: 'rgba(255,255,255,0.95)',
                boxShadow: '0 4px 12px rgba(163,64,84,0.4)'
              }}
            >
              {event.price}
            </div>
          </div>

          {/* Meta */}
          <div className="p-4 space-y-3">
            <h3
              className="text-base font-semibold line-clamp-1"
              style={{ color: 'rgba(255,255,255,0.95)' }}
            >
              {event.title}
            </h3>
            <p
              className="text-sm line-clamp-1"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              {event.location} • {event.date}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleWishlistToggle}
                disabled={isLoading}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: '#1E1F24',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                }}
              >
                <Icon
                  name="heart"
                  size={18}
                  style={{
                    color: isWishlisted ? '#A34054' : 'rgba(255,255,255,0.7)',
                    fill: isWishlisted ? '#A34054' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                />
              </button>

              <button
                onClick={handleShare}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: '#1E1F24',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                }}
              >
                <Icon name="share" size={18} style={{ color: 'rgba(255,255,255,0.7)' }} />
              </button>

              {!past && (
                <Link
                  href={`/events/${event.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #2B124C 100%)',
                    color: 'rgba(255,255,255,0.95)',
                    boxShadow: '0 4px 16px rgba(139,92,246,0.4)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <Icon name="ticket" size={16} />
                  Book Now
                </Link>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
