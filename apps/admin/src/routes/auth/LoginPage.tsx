import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { authStorage } from '@app/api-client';
import { emailSchema, passwordSchema } from '@app/shared/utils';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  isInvitationRegistrationEnabled,
  isPublicRegistrationEnabled,
} from '@/config/registration';
import { useApiClient } from '@/hooks/useApiClient';
import { useAuthStore } from '@/stores/authStore';

const loginFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginPage() {
  const api = useApiClient();
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    const { data, error, response } = await api.POST('/api/v1/auth/login', {
      body: values,
    });

    if (error || !data) {
      if (response.status === 401) {
        setServerError('Invalid credentials. Check your email and password.');
      } else if (response.status >= 500) {
        setServerError('Cannot reach the server. Please try again in a few minutes.');
      } else {
        setServerError('Sign-in failed. Please review the form and try again.');
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
          <CardTitle>Sign in to App Admin</CardTitle>
          <CardDescription>Use your account to access the admin panel.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {serverError && (
              <Alert variant="destructive" data-testid="login-error">
                <AlertTitle>Sign-in failed</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(form.formState.errors.password)}
                {...form.register('password')}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
            {isPublicRegistrationEnabled() && (
              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link
                  to="/register"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Sign up
                </Link>
              </p>
            )}
            {isInvitationRegistrationEnabled() && (
              <p className="text-center text-xs text-muted-foreground">
                Got an invitation? Use the link you received to set your password.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
