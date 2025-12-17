'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { EventCard, EventItem } from '@/components/event-card';
import { Icon, IconName } from '@/components/icons';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatDateShort } from '@/lib/utils';

const categories: { id: string; label: string; icon: IconName }[] = [
  { id: 'All', label: 'All', icon: 'grid' },
  { id: 'Music', label: 'Music', icon: 'music' },
  { id: 'Tech', label: 'Tech', icon: 'laptop' },
  { id: 'Comedy', label: 'Comedy', icon: 'theater' },
  { id: 'Art', label: 'Art', icon: 'palette' },
  { id: 'Sports', label: 'Sports', icon: 'sports' },
];

export default function HomePage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('events')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (fetchError) throw new Error(fetchError.message);

        const eventRows = data || [];

        // Fetch cheapest tier per event
        const eventIds = eventRows.map((e: { id: string }) => e.id);
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

        const mapped: EventItem[] = eventRows.map((e: {
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
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load events';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchesCategory = activeCategory === 'All' || e.category === activeCategory;
      const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [events, activeCategory, searchQuery]);

  return (
    <div
      className="min-h-screen"
      style={{ background: '#0B0B0D' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4"
            style={{ color: 'rgba(255,255,255,0.95)' }}
          >
            Find the night.{' '}
            <span className="gradient-text">Own the moment.</span>
          </h1>
          <p
            className="text-lg sm:text-xl max-w-2xl mx-auto"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            Discover the best events, concerts, and experiences in your city.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative max-w-xl mx-auto">
            <Icon
              name="search"
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events, artists, venues..."
              className="input pl-12 w-full"
              style={{
                background: '#1E1F24',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '1.25rem',
                padding: '1rem 1rem 1rem 3rem',
                fontSize: '1rem',
                color: 'rgba(255,255,255,0.95)'
              }}
            />
          </div>
        </motion.div>

        {/* Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-10 overflow-x-auto hide-scrollbar"
        >
          <div className="flex gap-3 min-w-max justify-center">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: activeCategory === cat.id ? '#2B124C' : '#1E1F24',
                  border: `1px solid ${activeCategory === cat.id ? 'transparent' : 'rgba(255,255,255,0.06)'}`,
                  color: activeCategory === cat.id ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)',
                }}
                onMouseEnter={(e) => {
                  if (activeCategory !== cat.id) {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeCategory !== cat.id) {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                  }
                }}
              >
                <Icon name={cat.icon} size={18} />
                {cat.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <p style={{ color: '#f87171' }} className="mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
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
                  <div className="flex gap-2 pt-2">
                    <div className="w-10 h-10 skeleton rounded-full" />
                    <div className="w-10 h-10 skeleton rounded-full" />
                    <div className="ml-auto w-28 h-10 skeleton rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Events Grid */}
        {!loading && !error && (
          <>
            {filteredEvents.length === 0 ? (
              <div className="text-center py-20">
                <Icon
                  name="search"
                  size={56}
                  className="mx-auto mb-4"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                />
                <h3
                  className="text-xl font-semibold mb-2"
                  style={{ color: 'rgba(255,255,255,0.9)' }}
                >
                  No events found
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Try adjusting your search or filter
                </p>
              </div>
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: { staggerChildren: 0.06 },
                  },
                }}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {filteredEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <EventCard event={event} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
