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

// Schemas Zod reutilizables.
export const dniSchema = z.string().trim().refine(isValidDni, { message: 'Invalid DNI' });

export const nieSchema = z.string().trim().refine(isValidNie, { message: 'Invalid NIE' });

export const cifSchema = z.string().trim().refine(isValidCif, { message: 'Invalid CIF' });

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: 'Invalid email address' });

export const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters' });
