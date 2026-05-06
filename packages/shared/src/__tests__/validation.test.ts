import { describe, expect, it } from 'vitest';

import { isValidCif, isValidDni, isValidNie, isValidVin } from '../utils/validation';

describe('isValidDni', () => {
  it('accepts well-known valid DNIs', () => {
    expect(isValidDni('00000000T')).toBe(true);
    expect(isValidDni('12345678Z')).toBe(true);
  });

  it('is case-insensitive and trims', () => {
    expect(isValidDni(' 12345678z ')).toBe(true);
  });

  it('rejects bad checksum', () => {
    expect(isValidDni('12345678A')).toBe(false);
  });

  it('rejects malformed input', () => {
    expect(isValidDni('1234567Z')).toBe(false);
    expect(isValidDni('123456789')).toBe(false);
    expect(isValidDni('')).toBe(false);
  });
});

describe('isValidNie', () => {
  it('accepts valid NIEs starting with X, Y, Z', () => {
    expect(isValidNie('X1234567L')).toBe(true);
    expect(isValidNie('Y1234567X')).toBe(true);
    expect(isValidNie('Z1234567R')).toBe(true);
  });

  it('rejects bad letter or wrong checksum', () => {
    expect(isValidNie('X1234567A')).toBe(false);
    expect(isValidNie('A1234567L')).toBe(false);
  });
});

describe('isValidCif', () => {
  it('accepts valid CIFs requiring digit control', () => {
    // A58818501 is a real example (Telefonica historic). Control digit = 1.
    expect(isValidCif('A58818501')).toBe(true);
    // B82846833.
    expect(isValidCif('B82846833')).toBe(true);
  });

  it('accepts valid CIFs requiring letter control', () => {
    // P1234567D: prefijo P (letter-only control). Calculado: control digit 4 -> letra D.
    expect(isValidCif('P1234567D')).toBe(true);
  });

  it('rejects bad checksum', () => {
    expect(isValidCif('A58818500')).toBe(false);
  });

  it('rejects malformed input', () => {
    expect(isValidCif('Z12345678')).toBe(false);
    expect(isValidCif('A1234567')).toBe(false);
  });
});

describe('isValidVin', () => {
  it('accepts a valid Hyundai VIN with control digit X', () => {
    // 1HGCM82633A004352 -> Honda Accord. Position 9 must be 3.
    expect(isValidVin('1HGCM82633A004352')).toBe(true);
  });

  it('rejects forbidden letters I, O, Q', () => {
    expect(isValidVin('1HGCM8263OA004352')).toBe(false);
    expect(isValidVin('IHGCM82633A004352')).toBe(false);
  });

  it('rejects wrong length', () => {
    expect(isValidVin('1HGCM82633A00435')).toBe(false);
    expect(isValidVin('1HGCM82633A0043522')).toBe(false);
  });

  it('rejects bad control digit', () => {
    expect(isValidVin('1HGCM82634A004352')).toBe(false);
  });
});
