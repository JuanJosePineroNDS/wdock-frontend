import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import type { components } from '@app/api-client';
import { emailSchema } from '@app/shared/utils';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApiClient } from '@/hooks/useApiClient';
import { useAuthStore } from '@/stores/authStore';

type Invitation = components['schemas']['Invitation'];
type AuthRole = components['schemas']['AuthRole'];
type StatusFilter = 'ALL' | components['schemas']['StatusEnum'];

const createSchema = z.object({
  email: emailSchema,
  role: z.enum(['ADMIN', 'OPERATOR', 'AUDITOR', 'READONLY']),
  tenant_id: z.string().uuid().optional().or(z.literal('').transform(() => undefined)),
});
type CreateFormValues = z.infer<typeof createSchema>;

export function InvitationsListPage() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.role === 'SUPERADMIN';

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const invitationsQuery = useQuery({
    queryKey: ['invitations'],
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/auth/invitations');
      if (error || !data) throw new Error('Failed to load invitations');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: CreateFormValues) => {
      const { data, error, response } = await api.POST('/api/v1/auth/invitations', {
        body: {
          email: values.email,
          role: values.role,
          ...(values.tenant_id ? { tenant_id: values.tenant_id } : {}),
        },
      });
      if (error || !data) {
        const status = response.status;
        if (status === 409) throw new Error('A pending invitation already exists for that email.');
        throw new Error('Failed to create invitation.');
      }
      return data;
    },
    onSuccess: (invitation) => {
      setCreatedToken(invitation.token);
      setCreateError(null);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
    onError: (err: Error) => {
      setCreateError(err.message);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { data, error } = await api.POST(
        '/api/v1/auth/invitations/{invitation_id}/cancel',
        { params: { path: { invitation_id: invitationId } } },
      );
      if (error || !data) throw new Error('Failed to cancel invitation');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { email: '', role: 'OPERATOR', tenant_id: '' },
  });

  const onCreate = form.handleSubmit((values) => {
    setCreatedToken(null);
    createMutation.mutate(values);
  });

  const invitations = invitationsQuery.data ?? [];
  const filteredInvitations =
    statusFilter === 'ALL'
      ? invitations
      : invitations.filter((inv) => inv.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invitations</h1>
          <p className="text-sm text-muted-foreground">
            Invite users to join your tenant. Share the generated token manually with each user.
          </p>
        </div>
        <Button onClick={() => setShowForm((value) => !value)}>
          {showForm ? 'Close' : 'New invitation'}
        </Button>
      </div>

      {createdToken && (
        <CreatedTokenCallout token={createdToken} onDismiss={() => setCreatedToken(null)} />
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New invitation</CardTitle>
            <CardDescription>
              The user will receive no email — copy the token shown after creation and deliver it manually.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onCreate} className="space-y-4" noValidate>
              {createError && (
                <Alert variant="destructive" data-testid="invitation-create-error">
                  <AlertTitle>Could not create invitation</AlertTitle>
                  <AlertDescription>{createError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={Boolean(form.formState.errors.email)}
                  {...form.register('email')}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <select
                  id="invite-role"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...form.register('role')}
                >
                  <option value="ADMIN">Admin</option>
                  <option value="OPERATOR">Operator</option>
                  <option value="AUDITOR">Auditor</option>
                  <option value="READONLY">Read-only</option>
                </select>
              </div>
              {isSuperAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="invite-tenant">Tenant ID (optional)</Label>
                  <Input
                    id="invite-tenant"
                    placeholder="UUID"
                    {...form.register('tenant_id')}
                  />
                  {form.formState.errors.tenant_id && (
                    <p className="text-sm text-destructive">{form.formState.errors.tenant_id.message}</p>
                  )}
                </div>
              )}
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create invitation'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2 text-sm">
        <Label htmlFor="status-filter">Filter:</Label>
        <select
          id="status-filter"
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="ALL">All</option>
          <option value="PENDING">Pending</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="EXPIRED">Expired</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {invitationsQuery.isLoading && (
        <p role="status" className="text-sm text-slate-500">Loading invitations…</p>
      )}
      {invitationsQuery.isError && (
        <Alert variant="destructive">
          <AlertTitle>Could not load invitations</AlertTitle>
          <AlertDescription>Please try again later.</AlertDescription>
        </Alert>
      )}
      {!invitationsQuery.isLoading && !invitationsQuery.isError && filteredInvitations.length === 0 && (
        <p className="text-sm text-slate-500">No invitations to display.</p>
      )}

      {filteredInvitations.length > 0 && (
        <InvitationsTable
          invitations={filteredInvitations}
          onCancel={(id) => cancelMutation.mutate(id)}
          cancellingId={cancelMutation.isPending ? cancelMutation.variables ?? null : null}
        />
      )}
    </div>
  );
}

function InvitationsTable({
  invitations,
  onCancel,
  cancellingId,
}: {
  invitations: Invitation[];
  onCancel: (id: string) => void;
  cancellingId: string | null;
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Expires</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invitations.map((inv) => (
            <tr key={inv.id} className="border-t border-slate-100">
              <td className="px-4 py-3">{inv.email}</td>
              <td className="px-4 py-3 uppercase">{inv.role as AuthRole}</td>
              <td className="px-4 py-3">{inv.status}</td>
              <td className="px-4 py-3 text-slate-500">{formatDateTime(inv.expires_at)}</td>
              <td className="px-4 py-3 text-right">
                {inv.status === 'PENDING' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCancel(inv.id)}
                    disabled={cancellingId === inv.id}
                  >
                    {cancellingId === inv.id ? 'Cancelling…' : 'Cancel'}
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CreatedTokenCallout({ token, onDismiss }: { token: string; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Alert data-testid="created-token">
      <AlertTitle>Invitation created</AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          This token is only shown once. Copy it and deliver it to the invited user.
        </p>
        <div className="flex items-center gap-2">
          <code
            className="flex-1 rounded bg-slate-100 px-2 py-1 font-mono text-xs"
            data-testid="created-token-value"
          >
            {token}
          </code>
          <Button type="button" size="sm" onClick={copy}>
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
