import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { authStorage, type components } from '@app/api-client';
import { passwordSchema } from '@app/shared/utils';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApiClient } from '@/hooks/useApiClient';
import { useAuthStore } from '@/stores/authStore';

type InvitationPublic = components['schemas']['InvitationPublic'];

const acceptFormSchema = z
  .object({
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

type AcceptFormValues = z.infer<typeof acceptFormSchema>;

export function AcceptInvitationPage() {
  const api = useApiClient();
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const setSession = useAuthStore((state) => state.setSession);

  const [invitation, setInvitation] = useState<InvitationPublic | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const form = useForm<AcceptFormValues>({
    resolver: zodResolver(acceptFormSchema),
    defaultValues: { password: '', confirm: '' },
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) {
        setLoadError('Missing invitation token.');
        setLoading(false);
        return;
      }
      const { data, error, response } = await api.GET('/api/v1/auth/invitations/{token}', {
        params: { path: { token } },
      });
      if (cancelled) return;
      if (data) {
        setInvitation(data);
      } else if (response.status === 410) {
        setLoadError('This invitation is no longer valid (expired, used, or cancelled).');
      } else if (error) {
        setLoadError('Cannot load this invitation. Please try again later.');
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [api, token]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!token) return;
    setServerError(null);
    const { data, error, response } = await api.POST('/api/v1/auth/invitations/{token}/accept', {
      params: { path: { token } },
      body: { password: values.password },
    });
    if (error || !data) {
      if (response.status === 410) {
        setServerError('This invitation is no longer valid.');
      } else if (response.status === 409) {
        setServerError('An account already exists with that email.');
      } else if (response.status >= 500) {
        setServerError('Cannot reach the server. Please try again in a few minutes.');
      } else {
        setServerError('Cannot accept this invitation. Please try again later.');
      }
      return;
    }
    authStorage.setTokens(data.access, data.refresh);
    setSession(data.user);
    navigate('/dashboard', { replace: true });
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept your invitation</CardTitle>
          <CardDescription>Choose a password to finish creating your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div role="status" aria-live="polite" className="text-sm text-slate-500">
              Loading invitation…
            </div>
          )}
          {!loading && loadError && (
            <Alert variant="destructive" data-testid="invitation-load-error">
              <AlertTitle>Invalid invitation</AlertTitle>
              <AlertDescription>
                {loadError}{' '}
                <Link to="/login" className="font-medium underline-offset-4 hover:underline">
                  Go to sign in
                </Link>
              </AlertDescription>
            </Alert>
          )}
          {!loading && invitation && (
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <dl className="space-y-1 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Email</dt>
                  <dd className="font-medium">{invitation.email}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Role</dt>
                  <dd className="font-medium uppercase">{invitation.role}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Tenant</dt>
                  <dd className="font-medium">{invitation.tenant_name}</dd>
                </div>
              </dl>
              {serverError && (
                <Alert variant="destructive" data-testid="invitation-error">
                  <AlertTitle>Could not accept invitation</AlertTitle>
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(form.formState.errors.password)}
                  {...form.register('password')}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(form.formState.errors.confirm)}
                  {...form.register('confirm')}
                />
                {form.formState.errors.confirm && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.confirm.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Accepting…' : 'Accept invitation'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
