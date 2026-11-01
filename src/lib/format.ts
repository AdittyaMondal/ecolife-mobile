export function formatKg(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  const places = abs >= 100 ? 0 : digits;
  return value.toFixed(places);
}

export function formatInrFromPaise(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  }).format(rupees);
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat('en-IN').format(Math.round(value));
}

export function coinsForPaise(paise: number, coinsPerRupee = 10): number {
  return Math.round((paise / 100) * coinsPerRupee);
}

export function greetingFor(date = new Date(), timeZone = 'Asia/Kolkata'): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone }).format(date),
  );
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function firstName(name: string): string {
  const part = name.trim().split(/\s+/)[0];
  return part || name;
}

export function formatDay(iso: string, timeZone = 'Asia/Kolkata'): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone,
  }).format(date);
}

export function formatWhen(iso: string, timeZone = 'Asia/Kolkata'): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(date);
}

export function formatShortDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(date);
}

export function weekdayLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return '';
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat('en-IN', { weekday: 'short', timeZone: 'UTC' }).format(date);
}

export function categoryShare(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export function signedKg(value: number): string {
  const body = formatKg(Math.abs(value));
  if (value < -0.05) return `−${body} kg`;
  if (value > 0.05) return `+${body} kg`;
  return `${body} kg`;
}
