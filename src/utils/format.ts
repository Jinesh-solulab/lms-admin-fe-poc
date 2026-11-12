import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ar';

dayjs.extend(relativeTime);

export const fmtDate = (d?: string | Date | null) => (d ? dayjs(d).format('DD MMM YYYY, HH:mm') : '—');
export const fmtDay = (d?: string | Date | null) => (d ? dayjs(d).format('DD MMM YYYY') : '—');
export const fromNow = (d?: string | Date | null) => (d ? dayjs(d).fromNow() : '');
export const isPast = (d?: string | Date | null) => !!d && dayjs(d).isBefore(dayjs());

export function fmtBytes(n?: number | null): string {
  if (!n) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);
