const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';
const NIE_PREFIX_VALUE: Record<string, number> = { X: 0, Y: 1, Z: 2 };

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

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

  return { valid: false, reason: 'Formato inválido (esperado: 12345678X o X1234567X)' };
}

export function validateSpanishMobile(phone: string): ValidationResult {
  if (!phone) return { valid: false, reason: 'Móvil requerido' };
  const cleaned = phone.trim().replace(/\s/g, '');
  if (/^\+34[67]\d{8}$/.test(cleaned)) return { valid: true };
  if (/^[67]\d{8}$/.test(cleaned)) return { valid: true };
  return { valid: false, reason: 'Formato inválido (esperado: +34666111222 o 666111222)' };
}

export function normalizeSpanishMobile(phone: string): string {
  const cleaned = phone.trim().replace(/\s/g, '');
  if (/^[67]\d{8}$/.test(cleaned)) return `+34${cleaned}`;
  return cleaned;
}

export function parsePlatesInput(raw: string): string[] {
  return raw
    .split(/[\s,;\n]+/)
    .map((p) => p.trim().toUpperCase())
    .filter(Boolean);
}
