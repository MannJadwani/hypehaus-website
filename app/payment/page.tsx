'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { motion } from 'framer-motion';
import { Icon } from '@/components/icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { formatPrice, formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

// Razorpay types
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
}

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
  hero_image_url: string | null;
  start_at: string | null;
  venue_name: string | null;
  city: string | null;
  allow_cab?: boolean;
}

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const eventId = searchParams.get('eventId');
  const tierId = searchParams.get('tierId');
  const initialQty = parseInt(searchParams.get('qty') || '1');

  const [event, setEvent] = useState<Event | null>(null);
  const [tier, setTier] = useState<TicketTier | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Form fields
  const [qty, setQty] = useState(initialQty);
  const [attendeeNames, setAttendeeNames] = useState<string[]>(['']);
  const [email, setEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [needCab, setNeedCab] = useState(false);

  // Check if Razorpay is already loaded (for client-side navigation)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      setRazorpayLoaded(true);
      console.log('Razorpay SDK already loaded on mount');
    }
  }, []);

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!eventId || !tierId) {
        setError('Missing event or ticket information');
        setLoading(false);
        return;
      }

      try {
        // Fetch event, tier, and user profile
        const [eventRes, tierRes] = await Promise.all([
          supabase.from('events').select('*').eq('id', eventId).single(),
          supabase.from('ticket_tiers').select('*').eq('id', tierId).single(),
        ]);

        if (eventRes.error || !eventRes.data) {
          throw new Error('Event not found');
        }
        if (tierRes.error || !tierRes.data) {
          throw new Error('Ticket tier not found');
        }

        setEvent(eventRes.data);
        setTier(tierRes.data);

        // Fetch user profile for auto-fill
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email, phone')
            .eq('id', user.id)
            .single();

          if (profile) {
            // Auto-fill email
            setEmail(profile.email || user.email || '');

            // Auto-fill phone (extract last 10 digits)
            if (profile.phone) {
              const phoneDigits = profile.phone.replace(/^\+91/, '').slice(-10);
              setWhatsappNumber(phoneDigits);
            }

            // Initialize attendee names with user's name
            if (profile.full_name) {
              setAttendeeNames(Array(initialQty).fill(profile.full_name));
            } else {
              setAttendeeNames(Array(initialQty).fill(''));
            }
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load payment details';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId, tierId, user, initialQty]);

  // Update attendee names when quantity changes
  useEffect(() => {
    setAttendeeNames(currentNames => {
      if (qty > currentNames.length) {
        // Add empty names for new tickets
        const newNames = Array(qty - currentNames.length).fill('');
        return [...currentNames, ...newNames];
      } else if (qty < currentNames.length) {
        // Remove excess names
        return currentNames.slice(0, qty);
      }
      return currentNames;
    });
  }, [qty]);

  // Timeout for Razorpay SDK load
  useEffect(() => {
    if (!razorpayLoaded) {
      const timer = setTimeout(() => {
        if (!razorpayLoaded) {
          console.error('Razorpay SDK load timeout');
          setError('Payment system is taking too long to load. Check your internet connection or disable ad blockers.');
        }
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [razorpayLoaded]);

  const subtotal = (tier?.price_cents || 0) * qty;

  // Fee calculations: 2% convenience fee + 18% GST on convenience fee
  const convenienceFee = Math.round(subtotal * 0.02);
  const gstOnFee = Math.round(convenienceFee * 0.18);
  const totalAmount = subtotal + convenienceFee + gstOnFee;

  const updateAttendeeName = (index: number, value: string) => {
    const newNames = [...attendeeNames];
    newNames[index] = value;
    setAttendeeNames(newNames);
  };

  const validateForm = (): boolean => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!whatsappNumber || whatsappNumber.length !== 10) {
      setError('Please enter a valid 10-digit WhatsApp number');
      return false;
    }
    if (qty < 1) {
      setError('Quantity must be at least 1');
      return false;
    }
    if (attendeeNames.length !== qty || attendeeNames.some(name => !name.trim())) {
      setError('Please enter names for all attendees');
      return false;
    }
    return true;
  };

  const handlePayment = async () => {
    console.log('handlePayment initiated');
    if (!user || !event || !tier) {
      console.warn('Missing user, event, or tier');
      return;
    }

    if (!validateForm()) {
      console.warn('Form validation failed');
      return;
    }

    if (!razorpayLoaded || !window.Razorpay) {
      setError('Payment system is loading. Please try again in a moment.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      console.log('Getting session...');
      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Generate receipt ID
      const receiptId = `HYPEHAUS-WEB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      console.log('Creating Razorpay order...');
      // Call Edge Function to create Razorpay order (not payment link)
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          mode: 'order', // Use Order mode for Checkout.js (not Payment Link)
          amount: totalAmount,
          currency: (tier.currency || 'INR').toLowerCase(),
          receipt: receiptId,
          customer: {
            name: attendeeNames[0] || 'Guest',
            email: email,
            contact: `+91${whatsappNumber}`,
          },
          notes: {
            event_id: eventId,
            tier_id: tierId,
            quantity: String(qty),
            event_title: event.title,
            tier_name: tier.name,
            attendee_names: JSON.stringify(attendeeNames.filter(name => name.trim())),
            whatsapp_number: whatsappNumber,
            need_cab: needCab ? 'true' : 'false',
            email: email,
          },
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });



      if (orderError) {
        console.error('Edge Function error:', orderError);
        throw new Error(orderError.message || 'Failed to create order');
      }

      // Handle FREE tickets - skip Razorpay modal
      if (orderData?.is_free) {
        console.log('FREE TICKET BOOKED - Skipping Razorpay modal');
        setError('Free ticket booked successfully!');
        setTimeout(() => {
          router.push('/tickets');
        }, 1500);
        return;
      }

      if (!orderData?.order_id || !orderData?.key_id) {
        console.error('Missing order_id or key_id:', orderData);
        throw new Error('Invalid order response: ' + JSON.stringify(orderData));
      }

      console.log('Opening Razorpay options...');
      // Open Razorpay checkout modal
      const options: RazorpayOptions = {
        key: orderData.key_id, // Use key from Edge Function response
        amount: totalAmount,
        currency: (tier.currency || 'INR').toUpperCase(),
        name: 'HypeHaus',
        description: `${event.title} - ${tier.name} x ${qty}`,
        order_id: orderData.order_id,
        prefill: {
          name: attendeeNames[0] || '',
          email: email,
          contact: `+91${whatsappNumber}`,
        },
        notes: {
          event_id: eventId || '',
          tier_id: tierId || '',
          quantity: String(qty),
        },
        theme: {
          color: '#8B5CF6',
        },
        handler: async (response: RazorpayResponse) => {
          // Payment successful - verify and create tickets

          setVerifying(true);
          setProcessing(false);

          // Capture values at callback time to prevent closure issues
          const orderDataToSend = {
            event_id: eventId,
            tier_id: tierId,
            quantity: qty,
            total_amount_cents: totalAmount,
            currency: (tier?.currency || 'INR').toUpperCase(),
            attendee_names: attendeeNames.filter(name => name.trim()),
            email: email,
            whatsapp_number: whatsappNumber,
            need_cab: needCab,
          };

          console.log('Order data to send:', orderDataToSend);

          try {
            // Get FRESH session for verification
            const { data: { session: freshSession } } = await supabase.auth.getSession();
            if (!freshSession) {
              console.error('No session found for verification');
              setError('Session expired. Please refresh and try again.');
              setVerifying(false);
              return;
            }

            console.log('Calling verify-payment with:', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              has_signature: !!response.razorpay_signature,
              order_data: orderDataToSend,
            });

            const { data: verifyResponse, error: verifyError } = await supabase.functions.invoke('verify-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_data: orderDataToSend,
              },
              headers: {
                Authorization: `Bearer ${freshSession.access_token}`,
              },
            });

            console.log('Verify-payment response:', verifyResponse);
            console.log('Verify-payment error:', verifyError);

            if (verifyError) {
              console.error('Verification error:', verifyError);
              // Payment went through but verification failed - still redirect to tickets
              setError('Payment received! Tickets are being processed...');
              setTimeout(() => {
                router.push('/tickets');
              }, 2000);
              return;
            }

            const verified = verifyResponse?.success === true || !!verifyResponse?.order_id;

            if (verified) {
              // Success - redirect to tickets
              console.log('Payment verified successfully!');
              router.push('/tickets');
            } else {
              // Verification returned but no success flag - might still be processing
              console.log('Verification response unclear:', verifyResponse);
              setError('Payment received! Redirecting to tickets...');
              setTimeout(() => {
                router.push('/tickets');
              }, 2000);
            }
          } catch (err) {
            console.error('Verification exception:', err);
            setError('Payment received! Please check your tickets.');
            setTimeout(() => {
              router.push('/tickets');
            }, 3000);
          } finally {
            setVerifying(false);
          }
        },
        modal: {
          ondismiss: () => {
            console.log('Razorpay modal dismissed');
            setProcessing(false);
            setError('Payment was cancelled.');
          },
          escape: true,
          backdropclose: false,
        },
      };

      console.log('Initializing Razorpay instance...');
      const rzp = new window.Razorpay(options);
      rzp.open();
      // NOTE: Do NOT setProcessing(false) here. It should stay true until modal action.
      // previous code had setProcessing(false) here which caused "Loading" to disappear prematurely?
      // User says "keeps loading" -> so processing is TRUE.
      // If I remove setProcessing(false), it stays loading until modal opens?
      // Razorpay modal opening is sync? No.
      // rzp.open() is sync but overlay appears.

      // If I setProcessing(false) immediately, the button becomes clickable again.
      // Usually we keep it disabled.
      // BUT if the modal fails to open, we are stuck.
      // Razorpay doesn't provide a callback for "modal opened".
      // I will keep processing=false immediately to allow retry if needed, OR use a timeout.
      // Actually, standard practice is to keep it loading.
      // But if user says "nothing happens", maybe modal is blocked?
      // I'll setProcessing(false) after a small delay? 
      // No, let's keep it simple: setProcessing(false) ONLY in ondismiss/handler.
      // wait, `rzp.open()` returns void.

    } catch (err: unknown) {
      console.error('handlePayment exception:', err);
      const message = err instanceof Error ? err.message : 'Payment failed';
      setError(message);
      setProcessing(false);
      setVerifying(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#0B0B0D' }}>
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: '#1E1F24', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Icon name="user" size={40} style={{ color: 'rgba(255,255,255,0.45)' }} />
        </div>
        <p className="text-[var(--text-tertiary)] mb-4">Please log in to continue</p>
        <Link href="/login" className="btn-primary inline-block">
          Log In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#0B0B0D' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <div className="space-y-6">
            <div className="h-32 skeleton rounded-[var(--radius-lg)]" />
            <div className="h-8 skeleton rounded w-1/2" />
            <div className="h-12 skeleton rounded" />
            <div className="h-14 skeleton rounded" />
          </div>
        </div>
      </div>
    );
  }



  if (error && !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#0B0B0D' }}>
        <p className="text-red-400 mb-4">{error}</p>
        <Link href="/" className="btn-secondary inline-block">
          Back to Events
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Load Razorpay Checkout Script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => {
          console.log('Razorpay SDK Loaded');
          setRazorpayLoaded(true);
        }}
        onError={(e) => {
          console.error('Razorpay SDK Load Error', e);
          setError('Failed to load payment system');
        }}
      />

      <div className="min-h-screen pb-12" style={{ background: '#0B0B0D' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link
              href={`/events/${eventId}`}
              className="inline-flex items-center gap-2 mb-6 transition-colors"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              <Icon name="chevron-left" size={18} />
              Back to Event
            </Link>

            <h1 className="text-2xl font-bold mb-6" style={{ color: 'rgba(255,255,255,0.95)' }}>
              Checkout
            </h1>

            {/* Event Summary */}
            <div
              className="p-4 mb-6 rounded-[18px]"
              style={{
                background: '#141519',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            >
              <div className="flex gap-4">
                <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0">
                  <Image
                    src={event?.hero_image_url || 'https://images.unsplash.com/photo-1549451371-64aa98a6f660?q=80&w=2070&auto=format&fit=crop'}
                    alt={event?.title || ''}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h2 className="font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.95)' }}>
                    {event?.title}
                  </h2>
                  <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {formatDateTime(event?.start_at, null)}
                  </p>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {event?.venue_name}{event?.city ? `, ${event.city}` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div
              className="p-4 mb-6 rounded-[18px]"
              style={{
                background: '#141519',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            >
              <h3 className="font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.95)' }}>
                Order Summary
              </h3>
              <div className="flex justify-between items-center mb-2">
                <span style={{ color: 'rgba(255,255,255,0.65)' }}>{tier?.name}</span>
                <span style={{ color: 'rgba(255,255,255,0.95)' }}>{formatPrice(tier?.price_cents, tier?.currency)}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span style={{ color: 'rgba(255,255,255,0.65)' }}>Quantity</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{ background: '#1E1F24', border: '1px solid rgba(255,255,255,0.06)' }}
                    disabled={qty <= 1}
                  >
                    <Icon name="minus" size={16} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  </button>
                  <span className="w-8 text-center font-semibold" style={{ color: 'rgba(255,255,255,0.95)' }}>
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{ background: '#1E1F24', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <Icon name="plus" size={16} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span style={{ color: 'rgba(255,255,255,0.65)' }}>Subtotal</span>
                <span style={{ color: 'rgba(255,255,255,0.95)' }}>{formatPrice(subtotal, tier?.currency)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span style={{ color: 'rgba(255,255,255,0.65)' }}>Convenience Fee (2%)</span>
                <span style={{ color: 'rgba(255,255,255,0.95)' }}>{formatPrice(convenienceFee, tier?.currency)}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span style={{ color: 'rgba(255,255,255,0.65)' }}>GST on Fee (18%)</span>
                <span style={{ color: 'rgba(255,255,255,0.95)' }}>{formatPrice(gstOnFee, tier?.currency)}</span>
              </div>
              <hr style={{ borderColor: 'rgba(255,255,255,0.06)' }} className="mb-4" />
              <div className="flex justify-between items-center text-lg font-bold">
                <span style={{ color: 'rgba(255,255,255,0.95)' }}>Total</span>
                <span style={{ color: 'rgba(255,255,255,0.95)' }}>{formatPrice(totalAmount, tier?.currency)}</span>
              </div>
            </div>

            {/* Contact Details */}
            <div
              className="p-4 mb-6 rounded-[18px]"
              style={{
                background: '#141519',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            >
              <h3 className="font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.95)' }}>
                Contact Details
              </h3>

              <label className="block text-sm mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                className="w-full px-4 py-3 rounded-2xl mb-4 outline-none transition-colors"
                style={{
                  background: '#1E1F24',
                  color: 'rgba(255,255,255,0.95)',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}
              />

              <label className="block text-sm mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                WhatsApp Number
              </label>
              <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Where we&apos;ll send your tickets
              </p>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="px-4 py-3 rounded-2xl"
                  style={{
                    background: '#1E1F24',
                    color: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}
                >
                  +91
                </span>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  className="flex-1 px-4 py-3 rounded-2xl outline-none transition-colors"
                  style={{
                    background: '#1E1F24',
                    color: 'rgba(255,255,255,0.95)',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}
                />
              </div>
            </div>

            {/* Attendee Names */}
            <div
              className="p-4 mb-6 rounded-[18px]"
              style={{
                background: '#141519',
                border: '1px solid rgba(255,255,255,0.06)'
              }}
            >
              <h3 className="font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.95)' }}>
                Attendee Names
              </h3>
              <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Enter name for each ticket holder
              </p>

              {attendeeNames.map((name, index) => (
                <div key={index} className="mb-3">
                  <label className="block text-sm mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Ticket {index + 1}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => updateAttendeeName(index, e.target.value)}
                    placeholder={`Attendee ${index + 1} name`}
                    className="w-full px-4 py-3 rounded-2xl outline-none transition-colors"
                    style={{
                      background: '#1E1F24',
                      color: 'rgba(255,255,255,0.95)',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Cab Option */}
            {event?.allow_cab && (
              <div
                className="p-4 mb-6 rounded-[18px]"
                style={{
                  background: '#141519',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}
              >
                <label className="flex items-center gap-3 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => setNeedCab(!needCab)}
                    className={cn(
                      'w-5 h-5 rounded-md flex items-center justify-center transition-all',
                      needCab ? 'bg-purple-500' : ''
                    )}
                    style={{
                      border: needCab ? 'none' : '1px solid rgba(255,255,255,0.25)',
                      background: needCab ? '#8B5CF6' : 'transparent'
                    }}
                  >
                    {needCab && <Icon name="check" size={14} style={{ color: 'white' }} />}
                  </button>
                  <span style={{ color: 'rgba(255,255,255,0.65)' }}>Need a cab to the event?</span>
                </label>
              </div>
            )}

            {error && (
              <p className="text-red-400 text-sm mb-4 px-1">{error}</p>
            )}

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={processing || verifying || !razorpayLoaded}
              className={cn(
                'w-full py-4 rounded-[18px] font-semibold flex items-center justify-center gap-2 transition-all',
                (processing || verifying || !razorpayLoaded) ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'
              )}
              style={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #2B124C 100%)',
                color: 'rgba(255,255,255,0.95)'
              }}
            >
              {!razorpayLoaded ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Initializing...
                </>
              ) : processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : verifying ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Confirming Tickets...
                </>
              ) : (
                <>
                  <Icon name="ticket" size={20} />
                  Pay {formatPrice(totalAmount, tier?.currency)}
                </>
              )}
            </button>

            <p className="text-xs text-center mt-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Payments are processed securely through Razorpay. By completing this purchase, you agree to our terms and conditions.
            </p>
          </motion.div>
        </div>

        {/* Verifying Overlay */}
        {verifying && (
          <div
            className="fixed inset-0 flex items-center justify-center p-6 z-50"
            style={{ background: 'rgba(0,0,0,0.8)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-[20px] max-w-sm w-full text-center"
              style={{
                background: '#141519',
                border: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <div className="w-12 h-12 mx-auto mb-4 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.95)' }}>
                Confirming your tickets…
              </h3>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
                This usually takes a few seconds. Please don&apos;t close this page.
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen" style={{ background: '#0B0B0D' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <div className="space-y-6">
            <div className="h-32 skeleton rounded-[var(--radius-lg)]" />
            <div className="h-8 skeleton rounded w-1/2" />
            <div className="h-12 skeleton rounded" />
            <div className="h-14 skeleton rounded" />
          </div>
        </div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}

