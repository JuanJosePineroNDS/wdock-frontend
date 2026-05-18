import { describe, expect, it } from 'vitest';

import { normalizeDNI, validateSpanishDNI } from '../validators';

describe('validateSpanishDNI', () => {
  it('accepts valid DNI 12345678Z', () => {
    expect(validateSpanishDNI('12345678Z').valid).toBe(true);
  });

  it('accepts valid DNI in lowercase with spaces', () => {
    expect(validateSpanishDNI('  12345678z ').valid).toBe(true);
  });

  it('rejects DNI with wrong check letter', () => {
    const result = validateSpanishDNI('12345678A');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Letra');
  });

  it('accepts valid NIE X1234567L', () => {
    expect(validateSpanishDNI('X1234567L').valid).toBe(true);
  });

  it('accepts valid NIE Y0000001S', () => {
    expect(validateSpanishDNI('Y0000001S').valid).toBe(true);
  });

  it('rejects NIE with wrong letter', () => {
    expect(validateSpanishDNI('X1234567A').valid).toBe(false);
  });

  it('rejects malformed input', () => {
    expect(validateSpanishDNI('').valid).toBe(false);
    expect(validateSpanishDNI('123').valid).toBe(false);
    expect(validateSpanishDNI('A1234567B').valid).toBe(false);
  });
});

describe('normalizeDNI', () => {
  it('trims and uppercases', () => {
    expect(normalizeDNI(' 12345678z ')).toBe('12345678Z');
  });
});
