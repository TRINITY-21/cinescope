import { format, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns';

export function formatAirDate(dateStr) {
  if (!dateStr) return 'TBA';
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
}

export function formatYear(dateStr) {
  if (!dateStr) return '';
  return format(parseISO(dateStr), 'yyyy');
}

export function formatRuntime(minutes) {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatRating(avg) {
  if (avg == null) return { value: 0, percentage: 0, display: 'N/A' };
  return {
    value: avg,
    percentage: Math.round(avg * 10),
    display: avg.toFixed(1),
  };
}

export function formatEpisodeCode(season, number) {
  const s = String(season).padStart(2, '0');
  const e = String(number).padStart(2, '0');
  return `S${s}E${e}`;
}

export function formatScheduleDays(days, time) {
  if (!days || days.length === 0) return '';
  const dayStr = days.join(', ');
  return time ? `${dayStr} at ${time}` : dayStr;
}

export function formatCurrency(amount) {
  if (!amount || amount === 0) return null;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}
