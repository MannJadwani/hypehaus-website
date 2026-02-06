'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { EventCard, EventItem } from '@/components/event-card';
import { EventReelCard } from '@/components/event-reel-card';
import { AdBannerCarousel, type AdBannerItem } from '@/components/ad-banner-carousel';
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
  const [ads, setAds] = useState<AdBannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        const adsPromise = supabase
          .from('ads')
          .select('id, placement, title, subtitle, image_url, cta_text, target_url, event_id')
          .eq('placement', 'home_feed')
          .order('priority', { ascending: false })
          .order('created_at', { ascending: false });

        const { data, error: fetchError } = await supabase
          .from('events')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (fetchError) throw new Error(fetchError.message);

        const eventRows = data || [];

        // Fetch cheapest tier per event
        const eventIds = eventRows.map((e: { id: string }) => e.id);
        const minPriceByEvent: Record<string, { price_cents: number; currency: string | null }> = {};

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

        type AdRow = {
          id: string;
          placement: 'home_feed';
          title: string;
          subtitle: string | null;
          image_url: string;
          cta_text: string | null;
          target_url: string | null;
          event_id: string | null;
        };

        const { data: adsData, error: adsError } = await adsPromise;
        if (adsError) {
          // If ads table is missing in a dev env, don't take down the home page.
          console.warn('Failed to fetch ads:', adsError.message);
          setAds([]);
        } else {
          const mappedAds: AdBannerItem[] = ((adsData || []) as AdRow[]).map((a) => ({
            id: a.id,
            placement: a.placement,
            title: a.title,
            subtitle: a.subtitle ?? null,
            image_url: a.image_url,
            cta_text: a.cta_text || 'Learn more',
            target_url: a.target_url ?? null,
            event_id: a.event_id ?? null,
          }));
          setAds(mappedAds);
        }
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

  const isSearching = searchQuery.trim().length > 0;
  const mobilePadClass = isSearching ? 'pt-24' : 'pt-16';

  useEffect(() => {
    const open = () => setSearchOpen(true);
    const close = () => setSearchOpen(false);
    window.addEventListener('hh:search:open', open);
    window.addEventListener('hh:search:close', close);
    return () => {
      window.removeEventListener('hh:search:open', open);
      window.removeEventListener('hh:search:close', close);
    };
  }, []);

  useEffect(() => {
    if (!searchOpen) {
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [searchOpen]);

  const SearchControls = (
    <div className="space-y-4">
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={(e) => {
          e.preventDefault();
          setSearchOpen(false);
        }}
      >
        <div className="relative max-w-2xl mx-auto reels-overlay-card">
          <Icon
            name="search"
            size={20}
            className="absolute left-6 top-1/2 -translate-y-1/2"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, artists, venues..."
            className="input pl-12 w-full"
            style={{
              background: 'transparent',
              border: 'none',
              borderRadius: '1.25rem',
              padding: '0.9rem 1rem 0.9rem 2.75rem',
              fontSize: '1rem',
              color: 'rgba(255,255,255,0.95)',
            }}
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              Clear
            </button>
          )}
        </div>
      </motion.form>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="overflow-x-auto hide-scrollbar reels-overlay-chips"
      >
        <div className="flex gap-3 min-w-max justify-center">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200"
              style={{
                background: activeCategory === cat.id ? '#2B124C' : 'rgba(30,31,36,0.85)',
                border: `1px solid ${activeCategory === cat.id ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
                color: activeCategory === cat.id ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)',
              }}
            >
              <Icon name={cat.icon} size={16} />
              {cat.label}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#0B0B0D' }}>
      <div className="mx-auto px-0 sm:px-6 py-0 sm:py-6">
        {/* Mobile */}
        <div className="md:hidden">
          {!loading && ads.length > 0 && !searchOpen && !isSearching && (
            <div className="pt-16">
              <AdBannerCarousel ads={ads} />
            </div>
          )}

          {searchOpen && (
            <div className="fixed inset-0 z-[60]">
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={() => setSearchOpen(false)}
              />
              <div className="relative z-10 px-4 pt-20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    Search
                  </span>
                  <button
                    onClick={() => setSearchOpen(false)}
                    className="text-sm"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    Close
                  </button>
                </div>
                {SearchControls}

                <div className="mt-5">
                  {filteredEvents.length === 0 ? (
                    <div className="text-center py-10">
                      <Icon
                        name="search"
                        size={40}
                        className="mx-auto mb-3"
                        style={{ color: 'rgba(255,255,255,0.3)' }}
                      />
                      <p style={{ color: 'rgba(255,255,255,0.6)' }}>No matching events</p>
                    </div>
                  ) : (
                    <div className="max-h-[60vh] overflow-y-auto pr-1">
                      <div className="grid gap-4">
                        {filteredEvents.map((event) => (
                          <div key={event.id} onClick={() => setSearchOpen(false)}>
                            <EventCard event={event} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className={`text-center ${mobilePadClass} px-4`}>
              <p style={{ color: '#f87171' }} className="mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="btn-secondary"
              >
                Try Again
              </button>
            </div>
          )}

          {loading && (
            <div className={`grid gap-6 ${mobilePadClass} px-4`}>
              {[...Array(4)].map((_, i) => (
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

          {!loading && !error && (
            <>
              {filteredEvents.length === 0 ? (
                <div className={`text-center ${mobilePadClass} px-4`}>
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
              ) : isSearching ? (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: {
                      transition: { staggerChildren: 0.06 },
                    },
                  }}
                  className={`grid gap-6 ${mobilePadClass} px-4`}
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
              ) : (
                <div className="reels-container">
                  {filteredEvents.map((event) => (
                    <EventReelCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Desktop */}
        <div className="hidden md:block">
          <div className="sticky top-0 z-30 pt-6 pb-4 bg-[rgba(11,11,13,0.9)] backdrop-blur-md">
            {SearchControls}
          </div>

          {!loading && ads.length > 0 && (
            <div className="mb-6">
              <AdBannerCarousel ads={ads} />
            </div>
          )}

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

          {loading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
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
                  className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto"
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
    </div>
  );
}
