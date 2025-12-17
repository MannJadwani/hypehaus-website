'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Icon } from '@/components/icons';
import { EventCard, EventItem } from '@/components/event-card';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatDateShort } from '@/lib/utils';

export default function WishlistPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data: wishlist } = await supabase
          .from('event_wishlist')
          .select('event_id')
          .eq('user_id', user.id);

        if (!wishlist || wishlist.length === 0) {
          setEvents([]);
          setLoading(false);
          return;
        }

        const eventIds = wishlist.map((w: { event_id: string }) => w.event_id);

        const { data: eventsData } = await supabase
          .from('events')
          .select('*')
          .in('id', eventIds)
          .eq('status', 'published');

        // Fetch cheapest tier per event
        let minPriceByEvent: Record<string, { price_cents: number; currency: string | null }> = {};
        if (eventIds.length > 0) {
          const { data: tiers } = await supabase
            .from('ticket_tiers')
            .select('event_id, price_cents, currency')
            .in('event_id', eventIds);

          for (const t of tiers || []) {
            const prev = minPriceByEvent[t.event_id];
            if (!prev || t.price_cents < prev.price_cents) {
              minPriceByEvent[t.event_id] = { price_cents: t.price_cents, currency: t.currency };
            }
          }
        }

        const toLocation = (city?: string | null, venue?: string | null) => {
          if (venue && city) return `${venue}, ${city}`;
          return venue || city || '';
        };

        const mapped: EventItem[] = (eventsData || []).map((e: {
          id: string;
          title: string;
          hero_image_url: string | null;
          base_price_cents: number | null;
          currency: string | null;
          city: string | null;
          venue_name: string | null;
          start_at: string | null;
          category: string | null;
        }) => {
          const minTier = minPriceByEvent[e.id];
          const priceCents = minTier ? minTier.price_cents : e.base_price_cents;
          const priceCurrency = minTier ? minTier.currency : e.currency;

          return {
            id: e.id,
            title: e.title,
            image: e.hero_image_url || 'https://images.unsplash.com/photo-1549451371-64aa98a6f660?q=80&w=2070&auto=format&fit=crop',
            price: formatPrice(priceCents, priceCurrency),
            location: toLocation(e.city, e.venue_name),
            date: formatDateShort(e.start_at),
            category: e.category || 'Other',
            start_at: e.start_at,
          };
        });

        setEvents(mapped);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [user]);

  const handleWishlistChange = (eventId: string, isWishlisted: boolean) => {
    if (!isWishlisted) {
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#0B0B0D' }}>
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: '#1E1F24', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Icon name="heart" size={40} style={{ color: 'rgba(255,255,255,0.45)' }} />
        </div>
        <h2
          className="text-xl font-semibold mb-2"
          style={{ color: 'rgba(255,255,255,0.95)' }}
        >
          Sign in to view your wishlist
        </h2>
        <p className="text-center mb-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Save events you&apos;re interested in for later
        </p>
        <Link href="/login" className="btn-primary">
          Sign In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#0B0B0D' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl font-bold mb-6" style={{ color: 'rgba(255,255,255,0.95)' }}>
            Wishlist
          </h1>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="overflow-hidden"
                style={{
                  background: '#141519',
                  borderRadius: '1.375rem',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}
              >
                <div className="h-48 skeleton" />
                <div className="p-4 space-y-3">
                  <div className="h-5 skeleton rounded-lg w-3/4" />
                  <div className="h-4 skeleton rounded-lg w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12" style={{ background: '#0B0B0D' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'rgba(255,255,255,0.95)' }}>
          Wishlist
        </h1>

        {events.length === 0 ? (
          <div className="text-center py-20">
            <Icon
              name="heart"
              size={56}
              className="mx-auto mb-4"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            />
            <h3
              className="text-xl font-semibold mb-2"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              Your wishlist is empty
            </h3>
            <p className="mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Save events you&apos;re interested in by tapping the heart icon
            </p>
            <Link href="/" className="btn-primary">
              Browse Events
            </Link>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.05 } },
            }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ delay: index * 0.05 }}
              >
                <EventCard event={event} onWishlistChange={handleWishlistChange} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
