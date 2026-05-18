import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { ApiError, ValidationError } from '@wdock/api-client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useResetUserPassword, type UserListItem } from './hooks';

export interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserListItem | null;
}

function extractServerError(error: unknown, fallback: string): string {
  if (error instanceof ValidationError) {
    const first = Object.entries(error.fieldErrors)[0];
    if (first) return `${first[0]}: ${first[1].join(' · ')}`;
    return 'Datos inválidos.';
  }
  if (error instanceof ApiError) {
    const detail = (error.body as { detail?: unknown } | null)?.detail;
    if (typeof detail === 'string') return detail;
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export function ResetPasswordDialog({ open, onOpenChange, user }: ResetPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const reset = useResetUserPassword(user?.id ?? '');

  useEffect(() => {
    if (open) {
      setNewPassword('');
      setConfirmPassword('');
      setServerError(null);
    }
  }, [open]);

  if (!user) return null;

  const tooShort = newPassword.length > 0 && newPassword.length < 8;
  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmit = newPassword.length >= 8 && newPassword === confirmPassword && !reset.isPending;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setServerError(null);
    reset.mutate(
      { new_password: newPassword },
      {
        onSuccess: () => {
          toast.success(`Contraseña reseteada para ${user.email}`);
          onOpenChange(false);
        },
        onError: (err) => {
          setServerError(extractServerError(err, 'No se pudo resetear la contraseña.'));
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} blocking={reset.isPending}>
      <DialogHeader>
        <DialogTitle>Resetear contraseña</DialogTitle>
        <DialogDescription>
          Asigna una nueva contraseña para <strong>{user.email}</strong>. Esta acción también
          desbloquea la cuenta y resetea los intentos fallidos. El usuario podrá cambiarla luego
          desde su perfil.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={onSubmit}>
        <DialogBody className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="reset-new-password">Nueva contraseña</Label>
            <Input
              id="reset-new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              data-testid="reset-new-password"
            />
            {tooShort && <p className="text-xs text-red-600">Mínimo 8 caracteres.</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="reset-confirm-password">Repetir contraseña</Label>
            <Input
              id="reset-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              data-testid="reset-confirm-password"
            />
            {mismatch && <p className="text-xs text-red-600">No coincide.</p>}
          </div>
          {serverError && (
            <Alert variant="destructive">
              <AlertTitle>No se pudo resetear</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={reset.isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={!canSubmit} data-testid="reset-submit">
            {reset.isPending ? 'Reseteando…' : 'Resetear contraseña'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
