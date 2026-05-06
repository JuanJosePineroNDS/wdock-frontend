import { format as formatDate, parseISO } from 'date-fns';

export function formatIsoDate(iso: string, pattern = 'dd/MM/yyyy'): string {
  return formatDate(parseISO(iso), pattern);
}

export function formatIsoDateTime(iso: string): string {
  return formatDate(parseISO(iso), 'dd/MM/yyyy HH:mm');
}

const numberFormatter = new Intl.NumberFormat('es-ES');
const currencyFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
});

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}
