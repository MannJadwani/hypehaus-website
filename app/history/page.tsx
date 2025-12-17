'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Icon } from '@/components/icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { formatPrice, formatDateTime } from '@/lib/utils';

interface Order {
  id: string;
  event_title: string;
  created_at: string;
  total_amount_cents: number;
  currency: string;
  status: string;
  ticket_count: number;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          event_id,
          created_at,
          total_amount_cents,
          currency,
          status,
          tickets (count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw new Error(ordersError.message);

      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Fetch event details
      const eventIds = [...new Set(ordersData.map((o) => o.event_id))];
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, title')
        .in('id', eventIds);

      const eventsMap = new Map((eventsData || []).map((e) => [e.id, e]));

      const formatted: Order[] = ordersData.map((o: {
        id: string;
        event_id: string;
        created_at: string;
        total_amount_cents: number;
        currency: string;
        status: string;
        tickets: { count: number }[];
      }) => ({
        id: o.id,
        event_title: eventsMap.get(o.event_id)?.title || 'Unknown Event',
        created_at: o.created_at,
        total_amount_cents: o.total_amount_cents,
        currency: o.currency,
        status: o.status,
        ticket_count: o.tickets?.[0]?.count || 0,
      }));

      setOrders(formatted);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load history';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <Icon name="history" size={48} className="mx-auto mb-4 text-[var(--text-tertiary)]" />
        <h1 className="text-xl font-bold mb-2">Purchase History</h1>
        <p className="text-[var(--text-tertiary)] mb-6">Please log in to view your history</p>
        <Link href="/login" className="btn-primary inline-block">
          Log In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Purchase History</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-5 skeleton rounded w-2/3 mb-3" />
              <div className="h-4 skeleton rounded w-1/3 mb-2" />
              <div className="h-4 skeleton rounded w-1/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={fetchOrders} className="btn-secondary">
          Retry
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <Icon name="history" size={48} className="mx-auto mb-4 text-[var(--text-tertiary)]" />
        <h1 className="text-xl font-bold mb-2">No purchase history</h1>
        <p className="text-[var(--text-tertiary)] mb-6">Your purchases will appear here</p>
        <Link href="/" className="btn-primary inline-block">
          Browse Events
        </Link>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'cancelled':
        return 'text-red-400';
      default:
        return 'text-[var(--text-tertiary)]';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold mb-6">Purchase History</h1>

        <div className="space-y-4">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card p-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="font-semibold mb-1">{order.event_title}</h3>
                  <p className="text-sm text-[var(--text-tertiary)]">
                    {new Date(order.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm text-[var(--text-secondary)]">
                      {order.ticket_count} ticket{order.ticket_count !== 1 ? 's' : ''}
                    </span>
                    <span className={`text-sm font-semibold capitalize ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold">
                    {formatPrice(order.total_amount_cents, order.currency)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}


