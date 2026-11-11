/**
 * Formatting helpers written by hand (no Intl) so they behave the same
 * on every Android version, including old low-end phones.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

export function formatMoney(amount: number, currency = 'USD'): string {
  const [whole, cents] = Math.abs(amount).toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${amount < 0 ? '-' : ''}${currency} ${grouped}.${cents}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${formatDate(iso)}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function relativeTime(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Groups a token into blocks of four digits so it is easy to read out and type in. */
export function formatToken(token: string): string {
  const digits = token.replace(/\s/g, '');
  return digits.replace(/(.{4})(?=.)/g, '$1 ');
}

/** Parses what the user typed in an amount box. Returns null when it is not a positive number. */
export function parseAmount(text: string): number | null {
  const cleaned = text.replace(',', '.').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return value > 0 ? value : null;
}
