'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Icon } from '@/components/icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { formatPrice, formatDate, formatDateTime, isPastEvent } from '@/lib/utils';

interface TicketTier {
  id: string;
  name: string;
  price_cents: number;
  currency: string | null;
  total_quantity: number;
  sold_quantity: number;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  hero_image_url: string | null;
  start_at: string | null;
  end_at: string | null;
  venue_name: string | null;
  address_line: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  category: string | null;
}

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [tiers, setTiers] = useState<TicketTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [checkingWishlist, setCheckingWishlist] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null);
  const [quantity, setQuantity] = useState(1);

  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: eventData, error: eventErr } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();

        if (eventErr || !eventData) {
          throw new Error(eventErr?.message || 'Event not found');
        }

        const { data: tiersData } = await supabase
          .from('ticket_tiers')
          .select('*')
          .eq('event_id', eventId)
          .order('price_cents', { ascending: true });

        setEvent(eventData);
        setTiers(tiersData || []);

        if (user) {
          const { data: wishlistData } = await supabase
            .from('event_wishlist')
            .select('id')
            .eq('user_id', user.id)
            .eq('event_id', eventId)
            .maybeSingle();
          setIsWishlisted(!!wishlistData);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load event';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) fetchEvent();
  }, [eventId, user]);

  const eventStart = useMemo(() => {
    if (!event?.start_at) return null;
    return new Date(event.start_at);
  }, [event?.start_at]);

  const past = isPastEvent(event?.start_at);

  useEffect(() => {
    if (!eventStart) return;

    const update = () => {
      if (past) {
        const formattedDate = eventStart.toLocaleDateString(undefined, {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
        setTimeLeft(`Was on ${formattedDate}`);
        return;
      }

      const diff = eventStart.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Live Now');
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      setTimeLeft(`${pad(d)}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`);
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [eventStart, past]);

  const handleWishlistToggle = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (checkingWishlist) return;

    setCheckingWishlist(true);
    const newWishlisted = !isWishlisted;

    try {
      if (newWishlisted) {
        await supabase.from('event_wishlist').insert({ user_id: user.id, event_id: eventId });
      } else {
        await supabase.from('event_wishlist').delete().eq('user_id', user.id).eq('event_id', eventId);
      }
      setIsWishlisted(newWishlisted);
    } catch {
      setIsWishlisted(!newWishlisted);
    } finally {
      setCheckingWishlist(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/events/${eventId}`;
    const shareText = `Check out "${event?.title}" on HypeHaus!`;

    if (navigator.share) {
      await navigator.share({ title: event?.title, text: shareText, url: shareUrl });
    } else {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      alert('Link copied to clipboard!');
    }
  };

  const handleBookTickets = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (tiers.length === 0) return;
    if (tiers.length === 1) {
      router.push(`/payment?eventId=${eventId}&tierId=${tiers[0].id}&qty=1`);
    } else {
      setSelectedTier(tiers[0]);
      setShowModal(true);
    }
  };

  const handleContinueToPayment = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!selectedTier) return;
    setShowModal(false);
    router.push(`/payment?eventId=${eventId}&tierId=${selectedTier.id}&qty=${quantity}`);
  };

  const formatLocation = () => {
    if (!event) return '';
    const parts = [];
    if (event.venue_name) parts.push(event.venue_name);
    if (event.address_line) parts.push(event.address_line);
    if (event.city) parts.push(event.city);
    return parts.join(', ') || 'Location TBA';
  };



  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#0B0B0D' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="space-y-6">
            <div className="h-80 skeleton rounded-3xl" />
            <div className="h-8 skeleton rounded-lg w-2/3" />
            <div className="h-4 skeleton rounded-lg w-1/2" />
            <div className="h-24 skeleton rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen" style={{ background: '#0B0B0D' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
          <p style={{ color: '#f87171' }} className="mb-4">{error || 'Event not found'}</p>
          <Link href="/" className="btn-secondary inline-flex items-center gap-2">
            <Icon name="chevron-left" size={18} />
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const heroImage = event.hero_image_url || 'https://images.unsplash.com/photo-1549451371-64aa98a6f660?q=80&w=2070&auto=format&fit=crop';

  return (
    <>
      <div className="min-h-screen pb-32" style={{ background: '#0B0B0D' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative h-72 sm:h-[420px] overflow-hidden mb-6"
            style={{ borderRadius: '1.5rem' }}
          >
            <Image src={heroImage} alt={event.title} fill className="object-cover" priority />
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.3) 100%)'
              }}
            />

            {/* Top row */}
            <div className="absolute top-4 left-4 right-4 flex items-center gap-3">
              <Link
                href="/"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                style={{
                  background: 'rgba(20,21,25,0.85)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <Icon name="chevron-left" size={20} style={{ color: 'rgba(255,255,255,0.9)' }} />
              </Link>
              <div className="flex-1" />

              {/* Countdown */}
              <div
                className="px-3 py-1.5 rounded-xl text-sm font-semibold"
                style={{
                  background: 'rgba(20,21,25,0.85)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.9)'
                }}
              >
                {timeLeft}
              </div>

              <button
                onClick={handleShare}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                style={{
                  background: 'rgba(20,21,25,0.85)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <Icon name="share" size={18} style={{ color: 'rgba(255,255,255,0.9)' }} />
              </button>
              <button
                onClick={handleWishlistToggle}
                disabled={checkingWishlist}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                style={{
                  background: 'rgba(20,21,25,0.85)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                <Icon
                  name="heart"
                  size={18}
                  style={{
                    color: isWishlisted ? '#A34054' : 'rgba(255,255,255,0.9)',
                    fill: isWishlisted ? '#A34054' : 'none'
                  }}
                />
              </button>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-4 left-4 right-4">
              <h1
                className="text-2xl sm:text-4xl font-bold mb-2"
                style={{ color: 'rgba(255,255,255,0.95)' }}
              >
                {event.title}
              </h1>
              <div className="flex items-center gap-2" style={{ color: '#8B5CF6' }}>
                <Icon name="send" size={16} />
                <span className="font-semibold">{event.venue_name || event.city || 'HypeHaus'}</span>
              </div>
            </div>
          </motion.div>

          {/* Date Badge */}
          {event.start_at && (
            <div
              className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold mb-4"
              style={{
                background: '#1E1F24',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.9)'
              }}
            >
              {formatDate(event.start_at)}
            </div>
          )}

          {/* Description */}
          {event.description && (
            <p
              className="leading-relaxed mb-6"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              {event.description}
            </p>
          )}

          {/* Info Rows */}
          <div className="space-y-3 mb-8">
            {event.start_at && (
              <div
                className="flex items-center gap-3"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                <Icon name="clock" size={18} />
                <span>{formatDateTime(event.start_at, event.end_at)}</span>
              </div>
            )}
            <div
              className="flex items-center gap-3"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              <Icon name="map-pin" size={18} />
              <span>{formatLocation()}</span>
            </div>
          </div>

          {/* Ticket Tiers */}
          {tiers.length > 0 && (
            <div className="mb-8">
              <h2
                className="text-lg font-bold mb-4"
                style={{ color: 'rgba(255,255,255,0.95)' }}
              >
                Ticket Options
              </h2>
              <div className="space-y-3">
                {tiers.map((tier) => (
                  <div
                    key={tier.id}
                    className="flex items-center justify-between p-4"
                    style={{
                      background: '#141519',
                      borderRadius: '1.125rem',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    <div>
                      <h3 className="font-semibold" style={{ color: 'rgba(255,255,255,0.95)' }}>
                        {tier.name}
                      </h3>
                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {tier.total_quantity - tier.sold_quantity} available
                      </p>
                    </div>
                    <span className="text-lg font-bold" style={{ color: 'rgba(255,255,255,0.95)' }}>
                      {formatPrice(tier.price_cents, tier.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Map */}
          {event.latitude && event.longitude && (
            <div className="mb-8">
              <h2
                className="text-lg font-bold mb-4"
                style={{ color: 'rgba(255,255,255,0.95)' }}
              >
                Location
              </h2>
              <div
                className="relative overflow-hidden"
                style={{
                  borderRadius: '1.125rem',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}
              >
                {/* Google Maps Embed */}
                <iframe
                  src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3000!2d${event.longitude}!3d${event.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1`}
                  width="100%"
                  height="224"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-t-[1.125rem]"
                />

                {/* Open in Google Maps Link */}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 transition-colors hover:bg-opacity-80"
                  style={{
                    background: '#1E1F24',
                    color: '#8B5CF6',
                    fontWeight: 600
                  }}
                >
                  <Icon name="map-pin" size={18} />
                  Open in Google Maps
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      {!past && (
        <div
          className="fixed bottom-0 left-0 right-0 p-4"
          style={{
            background: '#0B0B0D',
            borderTop: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          <div className="max-w-4xl mx-auto">
            <button onClick={handleBookTickets} className="btn-primary w-full flex items-center justify-center gap-3">
              <Icon name="ticket" size={20} />
              Book Tickets
            </button>
          </div>
        </div>
      )}

      {/* Ticket Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.75)' }}
            onClick={() => setShowModal(false)}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="relative w-full max-w-lg p-6"
            style={{
              background: '#141519',
              borderRadius: '1.5rem 1.5rem 0 0',
              border: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            <div
              className="w-10 h-1 rounded-full mx-auto mb-4 sm:hidden"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            />
            <h2
              className="text-xl font-bold mb-4"
              style={{ color: 'rgba(255,255,255,0.95)' }}
            >
              Select Ticket
            </h2>

            <div className="space-y-3 mb-6">
              {tiers.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setSelectedTier(tier)}
                  className="w-full flex items-center justify-between p-4 rounded-xl transition-all text-left"
                  style={{
                    background: selectedTier?.id === tier.id ? 'rgba(139,92,246,0.1)' : '#1E1F24',
                    border: `1px solid ${selectedTier?.id === tier.id ? '#8B5CF6' : 'rgba(255,255,255,0.06)'}`
                  }}
                >
                  <div>
                    <h3 className="font-semibold" style={{ color: 'rgba(255,255,255,0.95)' }}>
                      {tier.name}
                    </h3>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {tier.total_quantity - tier.sold_quantity} available
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold" style={{ color: 'rgba(255,255,255,0.95)' }}>
                      {formatPrice(tier.price_cents, tier.currency)}
                    </span>
                    {selectedTier?.id === tier.id && (
                      <div
                        className="w-5 h-5 rounded-full"
                        style={{ background: '#8B5CF6' }}
                      />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <label
                className="block text-sm font-semibold mb-3"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
                  style={{
                    background: '#1E1F24',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}
                >
                  <Icon name="minus" size={18} style={{ color: 'rgba(255,255,255,0.9)' }} />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 h-12 text-center font-bold rounded-xl"
                  style={{
                    background: '#1E1F24',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.95)'
                  }}
                  min={1}
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
                  style={{
                    background: '#1E1F24',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}
                >
                  <Icon name="plus" size={18} style={{ color: 'rgba(255,255,255,0.9)' }} />
                </button>
              </div>
            </div>

            <button onClick={handleContinueToPayment} className="btn-primary w-full">
              Continue to Payment ({formatPrice((selectedTier?.price_cents || 0) * quantity, selectedTier?.currency)})
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
}
