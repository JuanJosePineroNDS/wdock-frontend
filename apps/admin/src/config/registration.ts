export type RegistrationMode = 'CLOSED' | 'INVITATION' | 'PUBLIC';

const REGISTRATION_MODES: ReadonlyArray<RegistrationMode> = ['CLOSED', 'INVITATION', 'PUBLIC'];

function parseMode(value: string | undefined): RegistrationMode {
  if (value && (REGISTRATION_MODES as readonly string[]).includes(value)) {
    return value as RegistrationMode;
  }
  return 'CLOSED';
}

export const registrationMode: RegistrationMode = parseMode(
  import.meta.env.VITE_REGISTRATION_MODE,
);

export function isPublicRegistrationEnabled(): boolean {
  return registrationMode === 'PUBLIC';
}

export function isInvitationRegistrationEnabled(): boolean {
  return registrationMode === 'INVITATION';
}
