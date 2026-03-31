// utils/dateUtils.js
// Utility helpers for date formatting and countdown used across the app.

/**
 * Returns how many days remain from today to the given expiry date.
 * Handles Firestore Timestamps (with .toDate()), Date objects, and strings.
 * Returns 0 if expired or invalid.
 *
 * @param {any} expiry — Firestore Timestamp | Date | string | null
 * @returns {number}
 */
export function daysLeft(expiry) {
  if (!expiry) return 0;
  try {
    const target = expiry?.toDate ? expiry.toDate() : new Date(expiry);
    if (isNaN(target.getTime())) return 0;
    const diff = target - Date.now();
    return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
  } catch (_) {
    return 0;
  }
}

/**
 * Formats a date for display. Handles Firestore Timestamps, Date objects,
 * ISO strings, and null/undefined gracefully.
 *
 * @param {any} date — Firestore Timestamp | Date | string | null
 * @returns {string}  e.g. "17 Mar 2026"  or  "—" if not available
 */
export function fmtDate(date) {
  if (!date) return '—';
  try {
    const d = date?.toDate ? date.toDate() : new Date(date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', {
      day:   '2-digit',
      month: 'short',
      year:  'numeric',
    });
  } catch (_) {
    return '—';
  }
}

/**
 * Returns a relative time string, e.g. "2 days ago", "just now".
 * Useful for article/call timestamps.
 *
 * @param {any} date — Firestore Timestamp | Date | string | null
 * @returns {string}
 */
export function timeAgo(date) {
  if (!date) return '';
  try {
    const d     = date?.toDate ? date.toDate() : new Date(date);
    const diff  = Date.now() - d.getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 1)   return 'just now';
    if (mins < 60)  return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7)   return `${days}d ago`;
    return fmtDate(date);
  } catch (_) {
    return '';
  }
}
