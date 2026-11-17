const DISPLAY_TIMEZONE =
  process.env.NEXT_PUBLIC_DISPLAY_TIMEZONE || 'Asia/Makassar';

/**
 * Format integer Rupiah ke string lokal Indonesia (contoh: Rp 28.500.000)
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

/**
 * Format angka ribuan (contoh: 12.500)
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '0';
  }
  return new Intl.NumberFormat('id-ID').format(value);
}

/**
 * Format tanggal ke zona waktu WITA (Asia/Makassar) sesuai PRD Bab 5.1
 */
export function formatDateWita(isoDate?: string | null): string {
  if (!isoDate) return '-';
  try {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return isoDate;
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: DISPLAY_TIMEZONE,
    }).format(date);
  } catch {
    return isoDate;
  }
}

/**
 * Format tanggal & jam lengkap ke zona waktu WITA (Asia/Makassar)
 */
export function formatDateTimeWita(isoDate?: string | null): string {
  if (!isoDate) return '-';
  try {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return isoDate;
    const formatted = new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: DISPLAY_TIMEZONE,
    }).format(date);
    return `${formatted} WITA`;
  } catch {
    return isoDate;
  }
}

/**
 * Konversi nomor telepon lokal (08xx / +628xx) ke tautan WhatsApp
 */
export function formatWhatsAppUrl(
  phone?: string | null,
  text?: string
): string | null {
  if (!phone) return null;
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  const encoded = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${cleaned}${encoded}`;
}
