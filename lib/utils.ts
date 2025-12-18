import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(cents: number | null | undefined, currency?: string | null): string {
  if (cents == null) return 'Free';
  if (cents === 0) return 'Free';
  const val = cents / 100;
  const cur = currency?.toUpperCase() || 'INR';
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: cur, minimumFractionDigits: 0 }).format(val);
  } catch {
    return `₹${val.toLocaleString('en-IN')}`;
  }
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  });
}

export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  });
}

export function formatDateTime(startStr: string | null | undefined, endStr?: string | null): string {
  if (!startStr) return '';
  const start = new Date(startStr);
  const time = start.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
  const date = start.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
  
  if (endStr) {
    const end = new Date(endStr);
    const endTime = end.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
    return `${date}, ${time} – ${endTime}`;
  }
  
  return `${date}, ${time}`;
}

export function isPastEvent(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const eventDate = new Date(dateStr);
  const today = new Date();
  const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return eventDateOnly.getTime() < todayOnly.getTime();
}
