import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
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

import {
  ROLE_OPTIONS,
  useCreateUser,
  useUpdateUser,
  type AuthRole,
  type UserListItem,
} from './hooks';

type Mode = 'create' | 'edit';

export interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  user?: UserListItem;
}

interface FormState {
  email: string;
  full_name: string;
  role: AuthRole;
  password: string;
}

const emptyState: FormState = {
  email: '',
  full_name: '',
  role: 'OPERADOR',
  password: '',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export function UserFormDialog({ open, onOpenChange, mode, user }: UserFormDialogProps) {
  const [form, setForm] = useState<FormState>(emptyState);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const create = useCreateUser();
  const update = useUpdateUser(user?.id ?? '');
  const pending = create.isPending || update.isPending;

  useEffect(() => {
    if (!open) return;
    if (user) {
      setForm({
        email: user.email,
        full_name: user.full_name ?? '',
        role: user.role,
        password: '',
      });
    } else {
      setForm(emptyState);
    }
    setFieldErrors({});
    setServerError(null);
  }, [open, user]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (mode === 'create') {
      if (!form.email.trim()) {
        next.email = 'Email requerido.';
      } else if (!EMAIL_REGEX.test(form.email.trim())) {
        next.email = 'Formato de email inválido.';
      }
      if (form.password.length < 8) {
        next.password = 'Mínimo 8 caracteres.';
      }
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setServerError(null);

    if (mode === 'create') {
      const payload = {
        email: form.email.trim(),
        full_name: form.full_name.trim() || undefined,
        role: form.role,
        password: form.password,
      };
      create.mutate(payload, {
        onSuccess: (created) => {
          toast.success(`Usuario ${created.email} creado`);
          onOpenChange(false);
        },
        onError: (err) => {
          setServerError(extractServerError(err, 'No se pudo crear el usuario.'));
        },
      });
    } else {
      const payload = {
        full_name: form.full_name.trim(),
        role: form.role,
      };
      update.mutate(payload, {
        onSuccess: () => {
          toast.success('Usuario actualizado');
          onOpenChange(false);
        },
        onError: (err) => {
          setServerError(extractServerError(err, 'No se pudo actualizar el usuario.'));
        },
      });
    }
  };

  const title = mode === 'create' ? 'Nuevo usuario' : `Editar ${user?.email ?? 'usuario'}`;
  const description =
    mode === 'create'
      ? 'El usuario podrá entrar inmediatamente con el email y la contraseña indicadas.'
      : 'Email no editable. El rol cambia el alcance de las acciones que puede ejecutar.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange} blocking={pending}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <form onSubmit={onSubmit} noValidate>
        <DialogBody className="space-y-4">
          <Field label="Email" id="user-email" error={fieldErrors.email}>
            <Input
              id="user-email"
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              disabled={mode === 'edit'}
              autoFocus={mode === 'create'}
              data-testid="user-email"
            />
          </Field>
          <Field label="Nombre completo" id="user-full-name">
            <Input
              id="user-full-name"
              value={form.full_name}
              onChange={(e) => setField('full_name', e.target.value)}
              maxLength={150}
              data-testid="user-full-name"
            />
          </Field>
          <Field label="Rol" id="user-role">
            <select
              id="user-role"
              value={form.role}
              onChange={(e) => setField('role', e.target.value as AuthRole)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-testid="user-role"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
          {mode === 'create' && (
            <Field
              label="Contraseña"
              id="user-password"
              error={fieldErrors.password}
              help="Mínimo 8 caracteres. El usuario podrá cambiarla luego desde su perfil."
            >
              <Input
                id="user-password"
                type="password"
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                autoComplete="new-password"
                data-testid="user-password"
              />
            </Field>
          )}
          {serverError && (
            <Alert variant="destructive">
              <AlertTitle>No se pudo guardar</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={pending} data-testid="user-form-submit">
            {pending ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

interface FieldProps {
  label: string;
  id: string;
  error?: string;
  help?: string;
  children: ReactNode;
}

function Field({ label, id, error, help, children }: FieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {help && !error && <p className="text-xs text-slate-500">{help}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
