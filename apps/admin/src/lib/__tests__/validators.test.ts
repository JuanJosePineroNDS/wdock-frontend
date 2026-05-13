import { describe, expect, it } from 'vitest';

import {
  normalizeSpanishMobile,
  parsePlatesInput,
  validateSpanishDNI,
  validateSpanishMobile,
} from '@/lib/validators';

describe('validateSpanishDNI', () => {
  it('accepts a valid DNI', () => {
    expect(validateSpanishDNI('12345678Z')).toEqual({ valid: true });
  });

  it('accepts a valid lowercase DNI by uppercasing it', () => {
    expect(validateSpanishDNI('12345678z')).toEqual({ valid: true });
  });

  it('accepts a valid NIE', () => {
    expect(validateSpanishDNI('X1234567L')).toEqual({ valid: true });
  });

  it('rejects DNI with wrong check letter', () => {
    const result = validateSpanishDNI('12345678A');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/letra del DNI/i);
  });

  it('rejects NIE with wrong check letter', () => {
    const result = validateSpanishDNI('X1234567A');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/letra del NIE/i);
  });

  it('rejects an empty value', () => {
    expect(validateSpanishDNI('')).toEqual({ valid: false, reason: 'DNI requerido' });
  });

  it('rejects an unknown format', () => {
    const result = validateSpanishDNI('not-a-dni');
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/Formato inválido/);
  });
});

describe('validateSpanishMobile', () => {
  it('accepts +34 mobile', () => {
    expect(validateSpanishMobile('+34666111222')).toEqual({ valid: true });
  });

  it('accepts 9-digit national mobile', () => {
    expect(validateSpanishMobile('666111222')).toEqual({ valid: true });
  });

  it('strips whitespace before validating', () => {
    expect(validateSpanishMobile(' +34 666 111 222 ')).toEqual({ valid: true });
  });

  it('rejects landlines starting with 9', () => {
    const result = validateSpanishMobile('912345678');
    expect(result.valid).toBe(false);
  });

  it('rejects empty input', () => {
    expect(validateSpanishMobile('')).toEqual({ valid: false, reason: 'Móvil requerido' });
  });
});

describe('normalizeSpanishMobile', () => {
  it('adds +34 prefix to a national mobile', () => {
    expect(normalizeSpanishMobile('666111222')).toBe('+34666111222');
  });

  it('leaves an international mobile untouched', () => {
    expect(normalizeSpanishMobile('+34666111222')).toBe('+34666111222');
  });

  it('strips whitespace before normalizing', () => {
    expect(normalizeSpanishMobile(' 666 111 222 ')).toBe('+34666111222');
  });
});

describe('parsePlatesInput', () => {
  it('splits by comma', () => {
    expect(parsePlatesInput('1234ABC, 4321XYZ')).toEqual(['1234ABC', '4321XYZ']);
  });

  it('splits by whitespace and newlines', () => {
    expect(parsePlatesInput('1234ABC\n4321XYZ 9999ZZZ')).toEqual([
      '1234ABC',
      '4321XYZ',
      '9999ZZZ',
    ]);
  });

  it('drops empty entries and uppercases', () => {
    expect(parsePlatesInput('abc123, , def456')).toEqual(['ABC123', 'DEF456']);
  });

  it('returns an empty list for an empty input', () => {
    expect(parsePlatesInput('')).toEqual([]);
  });
});
