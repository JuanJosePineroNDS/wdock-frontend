import { z } from 'zod';

const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';

export function isValidDni(input: string): boolean {
  const value = input.trim().toUpperCase();
  const match = /^([0-9]{8})([A-Z])$/.exec(value);
  if (!match) return false;
  const number = parseInt(match[1], 10);
  return DNI_LETTERS[number % 23] === match[2];
}

const NIE_PREFIX_TO_DIGIT: Record<string, string> = { X: '0', Y: '1', Z: '2' };

export function isValidNie(input: string): boolean {
  const value = input.trim().toUpperCase();
  const match = /^([XYZ])([0-9]{7})([A-Z])$/.exec(value);
  if (!match) return false;
  const numericPrefix = NIE_PREFIX_TO_DIGIT[match[1]];
  const number = parseInt(numericPrefix + match[2], 10);
  return DNI_LETTERS[number % 23] === match[3];
}

const CIF_LETTER_CONTROL = 'JABCDEFGHI';

export function isValidCif(input: string): boolean {
  const value = input.trim().toUpperCase();
  const match = /^([ABCDEFGHJNPQRSUVW])([0-9]{7})([0-9A-J])$/.exec(value);
  if (!match) return false;
  const [, organization, digits, control] = match;

  let evenSum = 0;
  let oddSum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    const n = parseInt(digits[i], 10);
    if (i % 2 === 0) {
      // Position 1, 3, 5, 7 -> doble. (0-indexado: pares).
      const doubled = n * 2;
      oddSum += Math.floor(doubled / 10) + (doubled % 10);
    } else {
      evenSum += n;
    }
  }

  const total = oddSum + evenSum;
  const controlDigit = (10 - (total % 10)) % 10;
  const controlLetter = CIF_LETTER_CONTROL[controlDigit];

  // Para organizaciones que requieren letra de control (P, Q, R, S, W, N).
  const lettersOnly = 'KPQRSNW';
  if (lettersOnly.includes(organization)) {
    return control === controlLetter;
  }
  // Para organizaciones que requieren digito (A, B, E, H).
  const digitsOnly = 'ABEH';
  if (digitsOnly.includes(organization)) {
    return control === String(controlDigit);
  }
  // Para el resto (C, D, F, G, J, U, V) ambos son validos.
  return control === String(controlDigit) || control === controlLetter;
}

const VIN_FORBIDDEN = /[IOQ]/;
const VIN_TRANSLITERATION: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
  0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9,
};
const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

/**
 * VIN ISO 3779 (17 caracteres) con dígito de control en la posición 9.
 * El cálculo de control sólo aplica de forma estricta en VINs norteamericanos,
 * pero ISO recomienda aplicarlo siempre. Validamos longitud, alfabeto y dígito de control.
 */
export function isValidVin(input: string): boolean {
  const value = input.trim().toUpperCase();
  if (value.length !== 17) return false;
  if (VIN_FORBIDDEN.test(value)) return false;
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(value)) return false;

  let sum = 0;
  for (let i = 0; i < 17; i += 1) {
    const transliterated = VIN_TRANSLITERATION[value[i]];
    if (transliterated === undefined) return false;
    sum += transliterated * VIN_WEIGHTS[i];
  }
  const remainder = sum % 11;
  const expected = remainder === 10 ? 'X' : String(remainder);
  return value[8] === expected;
}

// Schemas Zod reutilizables.
export const dniSchema = z
  .string()
  .trim()
  .refine(isValidDni, { message: 'DNI no valido' });

export const nieSchema = z
  .string()
  .trim()
  .refine(isValidNie, { message: 'NIE no valido' });

export const cifSchema = z
  .string()
  .trim()
  .refine(isValidCif, { message: 'CIF no valido' });

export const vinSchema = z
  .string()
  .trim()
  .refine(isValidVin, { message: 'VIN no valido (debe tener 17 caracteres y digito de control correcto)' });

export const emailSchema = z.string().trim().toLowerCase().email({ message: 'Email no valido' });

export const passwordSchema = z
  .string()
  .min(8, { message: 'La contrasena debe tener al menos 8 caracteres' });
