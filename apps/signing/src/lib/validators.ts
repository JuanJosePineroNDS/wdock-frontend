const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';
const NIE_PREFIX_VALUE: Record<string, number> = { X: 0, Y: 1, Z: 2 };

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validate a Spanish DNI or NIE following the official check-letter algorithm.
 * Mirrors the admin app validator (kept in sync intentionally).
 */
export function validateSpanishDNI(dni: string): ValidationResult {
  if (!dni) return { valid: false, reason: 'DNI requerido' };
  const cleaned = dni.trim().toUpperCase();

  const nieMatch = /^([XYZ])(\d{7})([A-Z])$/.exec(cleaned);
  if (nieMatch) {
    const [, prefix, digits, letter] = nieMatch;
    const prefixValue = NIE_PREFIX_VALUE[prefix];
    const number = parseInt(`${prefixValue}${digits}`, 10);
    const expected = DNI_LETTERS[number % 23];
    return letter === expected
      ? { valid: true }
      : { valid: false, reason: 'Letra del NIE incorrecta' };
  }

  const dniMatch = /^(\d{8})([A-Z])$/.exec(cleaned);
  if (dniMatch) {
    const [, digits, letter] = dniMatch;
    const expected = DNI_LETTERS[parseInt(digits, 10) % 23];
    return letter === expected
      ? { valid: true }
      : { valid: false, reason: 'Letra del DNI incorrecta' };
  }

  return { valid: false, reason: 'Formato no válido (ejemplo: 12345678Z o X1234567L)' };
}

export function normalizeDNI(dni: string): string {
  return dni.trim().toUpperCase();
}
