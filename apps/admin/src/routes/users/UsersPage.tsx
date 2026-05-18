import { useState } from 'react';
import { KeyRound, Pencil, Plus, Shield, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { formatIsoDateTime } from '@wdock/shared/utils';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/authStore';
import {
  ROLE_OPTIONS,
  useActivateUser,
  useDeactivateUser,
  useUsers,
  type UserListItem,
} from '@/features/users/hooks';
import { UserFormDialog } from '@/features/users/UserFormDialog';
import { ResetPasswordDialog } from '@/features/users/ResetPasswordDialog';

function roleLabel(role: string): string {
  return ROLE_OPTIONS.find((opt) => opt.value === role)?.label ?? role;
}

export function UsersPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | undefined>(undefined);
  const [toggleTarget, setToggleTarget] = useState<UserListItem | null>(null);
  const [resetTarget, setResetTarget] = useState<UserListItem | null>(null);

  const isSuperadmin = currentUser?.role === 'SUPERADMIN';
  const { data, isLoading, isError, error } = useUsers({
    search: search || undefined,
    ordering: 'email',
    showInactive,
    enabled: isSuperadmin,
  });

  const onCreate = () => {
    setEditingUser(undefined);
    setFormOpen(true);
  };
  const onEdit = (user: UserListItem) => {
    setEditingUser(user);
    setFormOpen(true);
  };

  if (currentUser && !isSuperadmin) {
    return (
      <div className="max-w-xl space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
        <Alert variant="destructive">
          <AlertTitle>Sin permisos</AlertTitle>
          <AlertDescription>
            Solo un superadmin puede gestionar usuarios. Si crees que es un error, contacta
            con un administrador.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isForbidden =
    isError && error && 'status' in error && (error as { status?: number }).status === 403;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Listado de usuarios del tenant. Solo accesible para superadmins.
          </p>
        </div>
        <Button onClick={onCreate} data-testid="users-new">
          <Plus className="h-4 w-4" aria-hidden />
          Nuevo usuario
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="grow space-y-1">
          <label className="text-xs font-medium text-slate-600" htmlFor="users-search">
            Búsqueda
          </label>
          <Input
            id="users-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Email o nombre"
          />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
            data-testid="users-show-inactive"
          />
          Mostrar inactivos
        </label>
      </div>

      {isForbidden ? (
        <Alert variant="destructive">
          <AlertTitle>Sin permisos</AlertTitle>
          <AlertDescription>
            El backend rechaza la petición (403). Solo un superadmin puede listar usuarios.
          </AlertDescription>
        </Alert>
      ) : (
        isError && (
          <Alert variant="destructive">
            <AlertTitle>No se pudo cargar el listado</AlertTitle>
            <AlertDescription>{error?.message ?? 'Inténtalo de nuevo.'}</AlertDescription>
          </Alert>
        )
      )}

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : data && data.results.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Último acceso</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.results.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-slate-50"
                  data-testid="users-row"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">{row.email}</td>
                  <td className="px-4 py-3 text-slate-700">{row.full_name || '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{roleLabel(row.role)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        row.is_active_in_tenant
                          ? 'inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700'
                          : 'inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500'
                      }
                    >
                      {row.is_active_in_tenant ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {row.last_login_at ? formatIsoDateTime(row.last_login_at) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <UserActionButtons
                      user={row}
                      isSelf={row.id === currentUser?.id}
                      onEdit={() => onEdit(row)}
                      onToggleActive={() => setToggleTarget(row)}
                      onResetPassword={() => setResetTarget(row)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !isLoading && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-sm text-slate-700">
              No hay usuarios que coincidan con los filtros.
            </p>
          </div>
        )
      )}

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={editingUser ? 'edit' : 'create'}
        user={editingUser}
      />
      <ToggleActiveConfirm
        user={toggleTarget}
        isSelf={toggleTarget?.id === currentUser?.id}
        onClose={() => setToggleTarget(null)}
      />
      <ResetPasswordDialog
        open={resetTarget !== null}
        onOpenChange={(open) => {
          if (!open) setResetTarget(null);
        }}
        user={resetTarget}
      />
    </div>
  );
}

interface UserActionButtonsProps {
  user: UserListItem;
  isSelf: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
  onResetPassword: () => void;
}

function UserActionButtons({
  user,
  isSelf,
  onEdit,
  onToggleActive,
  onResetPassword,
}: UserActionButtonsProps) {
  return (
    <div className="flex justify-end gap-1">
      <Button
        size="sm"
        variant="ghost"
        onClick={onEdit}
        aria-label="Editar"
        data-testid="users-row-edit"
      >
        <Pencil className="h-4 w-4" aria-hidden />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onResetPassword}
        aria-label="Resetear contraseña"
        data-testid="users-row-reset"
      >
        <KeyRound className="h-4 w-4 text-slate-700" aria-hidden />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onToggleActive}
        disabled={isSelf && user.is_active_in_tenant}
        aria-label={user.is_active_in_tenant ? 'Desactivar' : 'Activar'}
        data-testid="users-row-toggle"
      >
        {user.is_active_in_tenant ? (
          <ShieldOff className="h-4 w-4 text-red-600" aria-hidden />
        ) : (
          <Shield className="h-4 w-4 text-emerald-600" aria-hidden />
        )}
      </Button>
    </div>
  );
}

interface ToggleActiveConfirmProps {
  user: UserListItem | null;
  isSelf: boolean;
  onClose: () => void;
}

function ToggleActiveConfirm({ user, isSelf, onClose }: ToggleActiveConfirmProps) {
  const deactivate = useDeactivateUser(user?.id ?? '');
  const activate = useActivateUser(user?.id ?? '');
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const willDeactivate = user.is_active_in_tenant;
  const pending = willDeactivate ? deactivate.isPending : activate.isPending;

  const onConfirm = () => {
    setError(null);
    const onSuccess = () => {
      toast.success(
        willDeactivate
          ? `Usuario ${user.email} desactivado`
          : `Usuario ${user.email} activado`,
      );
      onClose();
    };
    const onError = (err: Error) => {
      setError(err.message || 'No se pudo completar la acción.');
    };
    if (willDeactivate) {
      deactivate.mutate(undefined, { onSuccess, onError });
    } else {
      activate.mutate(undefined, { onSuccess, onError });
    }
  };

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={willDeactivate ? `¿Desactivar ${user.email}?` : `¿Activar ${user.email}?`}
      description={
        willDeactivate
          ? isSelf
            ? 'No puedes desactivarte a ti mismo. Pide a otro superadmin que lo haga.'
            : 'El usuario no podrá iniciar sesión. Sus datos se conservan y puedes reactivarlo más tarde.'
          : 'El usuario volverá a poder iniciar sesión con su email y su contraseña actual.'
      }
      confirmLabel={willDeactivate ? 'Desactivar' : 'Activar'}
      destructive={willDeactivate}
      pending={pending}
      error={error}
      onConfirm={onConfirm}
    />
  );
}
