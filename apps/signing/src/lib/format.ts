/**
 * Formats an ISO date string (YYYY-MM-DD) as a Spanish long date.
 * Falls back to the raw input if parsing fails.
 */
export function formatSpanishDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}
