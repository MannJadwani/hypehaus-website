'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@/components/icons';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { formatDate, formatPrice } from '@/lib/utils';

interface Ticket {
  id: string;
  qr_code_url: string | null;
  qr_code_data: string | null;
  attendee_name: string | null;
  event_id: string;
  tier_id: string | null;
  status: string;
  event_title: string;
  event_image: string;
  event_start_at: string | null;
  event_venue: string | null;
  event_city: string | null;
  tier_name: string | null;
  tier_price_cents: number | null;
  tier_currency: string | null;
}

export default function TicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setError(null);

        const { data: ticketsData, error: ticketsError } = await supabase
          .from('tickets')
          .select(`
            id,
            attendee_name,
            qr_code_data,
            status,
            event_id,
            tier_id,
            order_id,
            orders!inner (
              id,
              user_id
            )
          `)
          .eq('orders.user_id', user.id)
          .in('status', ['active', 'used', 'cancelled'])
          .order('created_at', { ascending: false });

        if (ticketsError) {
          console.error('Tickets error:', ticketsError);
          throw new Error(ticketsError.message);
        }

        if (!ticketsData || ticketsData.length === 0) {
          setTickets([]);
          setLoading(false);
          return;
        }

        // Fetch event details
        const eventIds = [...new Set(ticketsData.map((t: { event_id: string }) => t.event_id))];
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('id, title, hero_image_url, start_at, venue_name, city')
          .in('id', eventIds);

        if (eventsError) {
          console.error('Events error:', eventsError);
          throw new Error(eventsError.message);
        }

        // Fetch tier details
        const tierIds = [...new Set(ticketsData.map((t: { tier_id: string | null }) => t.tier_id).filter(Boolean))];
        let tiersData: { id: string; name: string; price_cents: number; currency: string | null }[] = [];
        if (tierIds.length > 0) {
          const { data: tiers, error: tiersError } = await supabase
            .from('ticket_tiers')
            .select('id, name, price_cents, currency')
            .in('id', tierIds);

          if (tiersError) {
            console.error('Tiers error:', tiersError);
          } else {
            tiersData = tiers || [];
          }
        }

        // Create lookup maps
        const eventsMap = new Map((eventsData || []).map((e: { id: string; title: string; hero_image_url: string | null; start_at: string | null; venue_name: string | null; city: string | null }) => [e.id, e]));
        const tiersMap = new Map(tiersData.map((t) => [t.id, t]));

        // Format tickets
        const formattedTickets: Ticket[] = ticketsData.map((ticket: { id: string; attendee_name: string | null; qr_code_data: string | null; status: string; event_id: string; tier_id: string | null }) => {
          const event = eventsMap.get(ticket.event_id);
          const tier = ticket.tier_id ? tiersMap.get(ticket.tier_id) : null;

          // Generate QR code URL from qr_code_data (larger size for modal)
          const qrData = ticket.qr_code_data || JSON.stringify({ ticket_id: ticket.id });
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

          return {
            id: ticket.id,
            qr_code_url: qrUrl,
            qr_code_data: ticket.qr_code_data,
            attendee_name: ticket.attendee_name,
            event_id: ticket.event_id,
            tier_id: ticket.tier_id,
            status: ticket.status,
            event_title: event?.title || 'Unknown Event',
            event_image: event?.hero_image_url || 'https://images.unsplash.com/photo-1549451371-64aa98a6f660?q=80&w=400',
            event_start_at: event?.start_at ?? null,
            event_venue: event?.venue_name ?? null,
            event_city: event?.city ?? null,
            tier_name: tier?.name || 'General',
            tier_price_cents: tier?.price_cents || 0,
            tier_currency: tier?.currency || 'INR',
          };
        });

        setTickets(formattedTickets);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load tickets';
        setError(message);
        console.error('Error fetching tickets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#0B0B0D' }}>
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: '#1E1F24', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Icon name="ticket" size={40} style={{ color: 'rgba(255,255,255,0.45)' }} />
        </div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.95)' }}>
          Sign in to view your tickets
        </h2>
        <p className="text-center mb-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Your purchased tickets will appear here
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
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl font-bold mb-6" style={{ color: 'rgba(255,255,255,0.95)' }}>
            My Tickets
          </h1>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl" style={{ background: '#141519' }}>
                <div className="w-20 h-20 skeleton rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 skeleton rounded-lg w-3/4" />
                  <div className="h-4 skeleton rounded-lg w-1/2" />
                  <div className="h-4 skeleton rounded-lg w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ background: '#0B0B0D' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl font-bold mb-6" style={{ color: 'rgba(255,255,255,0.95)' }}>
            My Tickets
          </h1>
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12" style={{ background: '#0B0B0D' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'rgba(255,255,255,0.95)' }}>
          My Tickets
        </h1>

        {tickets.length === 0 ? (
          <div className="text-center py-20">
            <Icon
              name="ticket"
              size={56}
              className="mx-auto mb-4"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            />
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.9)' }}>
              No tickets yet
            </h3>
            <p className="mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Start exploring events and book your first ticket!
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
            className="space-y-4"
          >
            {tickets.map((ticket) => {
              const isUsed = ticket.status === 'used';
              const isCancelled = ticket.status === 'cancelled';

              return (
                <motion.div
                  key={ticket.id}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <div
                    className={`overflow-hidden rounded-xl transition-colors ${isUsed ? 'opacity-70' : ''} ${isCancelled ? 'opacity-60' : ''}`}
                    style={{
                      background: '#141519',
                      border: `1px solid ${isUsed ? 'rgba(34, 197, 94, 0.3)' : isCancelled ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.06)'}`
                    }}
                  >
                    {/* Image Header */}
                    <div className="relative h-32">
                      <Image
                        src={ticket.event_image}
                        alt={ticket.event_title}
                        fill
                        className={`object-cover ${(isUsed || isCancelled) ? 'opacity-50' : ''}`}
                      />
                      <div
                        className="absolute inset-0"
                        style={{ background: 'linear-gradient(to top, rgba(20,21,25,0.9) 0%, rgba(20,21,25,0.5) 50%, transparent 100%)' }}
                      />

                      {/* Tier Badge */}
                      <div
                        className="absolute top-3 right-3 px-3 py-1.5 rounded-xl text-xs font-bold"
                        style={{ background: '#2B124C', color: 'rgba(255,255,255,0.95)' }}
                      >
                        {ticket.tier_name}
                      </div>

                      {/* Status Badge */}
                      {(isUsed || isCancelled) && (
                        <div
                          className="absolute top-3 left-3 px-3 py-1.5 rounded-xl text-xs font-bold"
                          style={{
                            background: isUsed ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            border: `1px solid ${isUsed ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`,
                            color: 'rgba(255,255,255,0.95)'
                          }}
                        >
                          {isUsed ? 'USED' : 'CANCELLED'}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3
                        className={`font-semibold line-clamp-1 mb-1 ${(isUsed || isCancelled) ? 'opacity-60' : ''}`}
                        style={{ color: 'rgba(255,255,255,0.95)' }}
                      >
                        {ticket.event_title}
                      </h3>
                      <p className={`text-sm mb-1 ${(isUsed || isCancelled) ? 'opacity-50' : ''}`} style={{ color: 'rgba(255,255,255,0.55)' }}>
                        {ticket.event_venue || ticket.event_city || 'TBA'} • {formatDate(ticket.event_start_at)}
                      </p>
                      {ticket.attendee_name && (
                        <p className={`text-sm ${(isUsed || isCancelled) ? 'opacity-50' : ''}`} style={{ color: 'rgba(255,255,255,0.5)' }}>
                          Attendee: {ticket.attendee_name}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-sm font-semibold" style={{ color: '#8B5CF6' }}>
                          {formatPrice(ticket.tier_price_cents, ticket.tier_currency)}
                        </p>
                        <button
                          onClick={() => setSelectedTicket(ticket)}
                          className="text-sm font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-2"
                          style={{
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #2B124C 100%)',
                            color: 'rgba(255,255,255,0.95)'
                          }}
                        >
                          <Icon name="grid" size={16} />
                          View QR
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.85)' }}
              onClick={() => setSelectedTicket(null)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
            >
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: '#141519',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                }}
              >
                {/* Modal Header */}
                <div className="relative p-4 text-center" style={{ background: '#0E0F15' }}>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                    style={{ background: '#25262C' }}
                  >
                    <Icon name="x" size={18} style={{ color: 'rgba(255,255,255,0.8)' }} />
                  </button>

                  <h2 className="text-lg font-bold mb-1" style={{ color: 'rgba(255,255,255,0.95)' }}>
                    {selectedTicket.event_title}
                  </h2>
                  {selectedTicket.attendee_name && (
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      Attendee: {selectedTicket.attendee_name}
                    </p>
                  )}

                  {/* Status Badge in Modal */}
                  {(selectedTicket.status === 'used' || selectedTicket.status === 'cancelled') && (
                    <div
                      className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl text-sm font-bold"
                      style={{
                        background: selectedTicket.status === 'used' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        border: `1px solid ${selectedTicket.status === 'used' ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`,
                        color: selectedTicket.status === 'used' ? '#22c55e' : '#f87171'
                      }}
                    >
                      {selectedTicket.status === 'used' ? '✓ USED' : '✗ CANCELLED'}
                    </div>
                  )}
                </div>

                {/* QR Code */}
                <div className="p-6 flex flex-col items-center">
                  <div
                    className="p-4 mb-4"
                    style={{
                      background: '#0B0B0D',
                      border: '1px solid rgba(255,255,255,0.1)',
                      opacity: (selectedTicket.status === 'used' || selectedTicket.status === 'cancelled') ? 0.5 : 1
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedTicket.qr_code_url || ''}
                      alt="QR Code"
                      width={220}
                      height={220}

                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>

                  {/* Ticket Details */}
                  <div className="w-full space-y-2 mb-4">
                    <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      <Icon name="clock" size={16} style={{ color: '#8B5CF6' }} />
                      <span className="text-sm">{formatDate(selectedTicket.event_start_at)}</span>
                    </div>
                    <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      <Icon name="map-pin" size={16} style={{ color: '#8B5CF6' }} />
                      <span className="text-sm">{selectedTicket.event_venue || selectedTicket.event_city || 'TBA'}</span>
                    </div>
                    <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      <Icon name="ticket" size={16} style={{ color: '#8B5CF6' }} />
                      <span className="text-sm">{selectedTicket.tier_name}</span>
                    </div>
                  </div>

                  {/* Ticket ID */}
                  <p
                    className="text-xs font-mono pt-3 border-t w-full text-center"
                    style={{
                      color: 'rgba(255,255,255,0.4)',
                      borderColor: 'rgba(255,255,255,0.1)'
                    }}
                  >
                    REF: TKT-{selectedTicket.id.substring(0, 8).toUpperCase()}
                  </p>
                </div>

                {/* Close Button */}
                <div className="px-6 pb-6">
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="w-full py-3 rounded-xl font-semibold transition-colors"
                    style={{
                      background: '#25262C',
                      color: 'rgba(255,255,255,0.9)'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
