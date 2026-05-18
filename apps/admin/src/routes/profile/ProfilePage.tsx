import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { ApiError, ValidationError, type User } from '@wdock/api-client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useChangePassword, useMe, useUpdateMe } from '@/features/auth/hooks';

function extractServerError(error: unknown, fallback: string): string {
  if (error instanceof ValidationError) {
    const first = Object.entries(error.fieldErrors)[0];
    if (first) return `${first[0]}: ${first[1].join(' · ')}`;
    const detail = (error.body as { detail?: unknown } | null)?.detail;
    if (typeof detail === 'string') return detail;
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

export function ProfilePage() {
  const { data: me, isLoading, isError, error } = useMe();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">
          Datos de tu cuenta y opciones de seguridad.
        </p>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>No se pudo cargar el perfil</AlertTitle>
          <AlertDescription>{error?.message ?? 'Inténtalo de nuevo.'}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos de la cuenta</CardTitle>
          <CardDescription>
            Email y rol los gestiona un superadmin desde Usuarios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading || !me ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-40" />
            </div>
          ) : (
            <ProfileForm me={me} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cambiar contraseña</CardTitle>
          <CardDescription>
            Necesitas tu contraseña actual. La nueva debe tener al menos 8 caracteres.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}

interface ProfileFormProps {
  me: User;
}

function ProfileForm({ me }: ProfileFormProps) {
  const [fullName, setFullName] = useState(me.full_name ?? '');
  const update = useUpdateMe();

  useEffect(() => {
    setFullName(me.full_name ?? '');
  }, [me.full_name]);

  const dirty = fullName.trim() !== (me.full_name ?? '').trim();
  const canSubmit = dirty && !update.isPending && fullName.trim().length > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    try {
      await update.mutateAsync({ full_name: fullName.trim() });
      toast.success('Perfil actualizado');
    } catch (err) {
      toast.error(extractServerError(err, 'No se pudo actualizar el perfil.'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ReadOnlyField label="Email" value={me.email} />
      <ReadOnlyField label="Rol" value={me.role} />
      <ReadOnlyField label="Tenant" value={me.tenant_name ?? '—'} />
      <div className="space-y-1">
        <Label htmlFor="profile-full-name">Nombre completo</Label>
        <Input
          id="profile-full-name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          maxLength={150}
          placeholder="Nombre y apellidos"
          data-testid="profile-full-name"
          autoComplete="name"
        />
      </div>
      <Button type="submit" disabled={!canSubmit} data-testid="profile-save">
        {update.isPending ? 'Guardando…' : 'Guardar cambios'}
      </Button>
    </form>
  );
}

interface ReadOnlyFieldProps {
  label: string;
  value: string;
}

function ReadOnlyField({ label, value }: ReadOnlyFieldProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm text-slate-900">{value}</p>
    </div>
  );
}

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const change = useChangePassword();

  const newTooShort = newPassword.length > 0 && newPassword.length < 8;
  const confirmMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;
  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    confirmPassword === newPassword &&
    !change.isPending;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    try {
      await change.mutateAsync({
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success('Contraseña actualizada');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(extractServerError(err, 'No se pudo cambiar la contraseña.'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="current-password">Contraseña actual</Label>
        <Input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          autoComplete="current-password"
          data-testid="current-password"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="new-password">Nueva contraseña</Label>
        <Input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          autoComplete="new-password"
          data-testid="new-password"
        />
        {newTooShort && (
          <p className="text-xs text-red-600">Mínimo 8 caracteres.</p>
        )}
      </div>
      <div className="space-y-1">
        <Label htmlFor="confirm-password">Repetir nueva contraseña</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          data-testid="confirm-password"
        />
        {confirmMismatch && (
          <p className="text-xs text-red-600">No coincide con la nueva contraseña.</p>
        )}
      </div>
      <Button type="submit" disabled={!canSubmit} data-testid="change-password-submit">
        {change.isPending ? 'Cambiando…' : 'Cambiar contraseña'}
      </Button>
    </form>
  );
}
