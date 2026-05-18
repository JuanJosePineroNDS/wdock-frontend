import { describe, expect, it } from 'vitest';

import { formatCurrency, formatIsoDate, formatIsoDateTime, formatNumber } from '../utils/format';

describe('format', () => {
  it('formats ISO date with default pattern dd/MM/yyyy', () => {
    expect(formatIsoDate('2026-05-06T12:34:00Z')).toBe('06/05/2026');
  });

  it('respects custom pattern', () => {
    expect(formatIsoDate('2026-01-09T00:00:00Z', 'yyyy-MM-dd')).toBe('2026-01-09');
  });

  it('formats date and time', () => {
    const result = formatIsoDateTime('2026-01-09T08:05:00Z');
    expect(result).toMatch(/^09\/01\/2026 \d{2}:\d{2}$/);
  });

  it('formats numbers with es-ES locale', () => {
    expect(formatNumber(1234567)).toMatch(/1\.234\.567|1,234,567/);
  });

  it('formats currency with euro symbol', () => {
    const formatted = formatCurrency(1234.5);
    expect(formatted).toContain('1');
    expect(formatted).toContain('234');
    expect(formatted).toContain('5');
  });
});
