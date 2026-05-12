import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { authStorage } from '@app/api-client';
import { emailSchema, passwordSchema } from '@app/shared/utils';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isPublicRegistrationEnabled } from '@/config/registration';
import { useApiClient } from '@/hooks/useApiClient';
import { useAuthStore } from '@/stores/authStore';

const registerFormSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export function RegisterPage() {
  const api = useApiClient();
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { email: '', password: '', confirm: '' },
  });

  if (!isPublicRegistrationEnabled()) {
    return <Navigate to="/login" replace />;
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    const { data, error, response } = await api.POST('/api/v1/auth/register/public', {
      body: { email: values.email, password: values.password },
    });

    if (error || !data) {
      if (response.status === 403) {
        setServerError('Public registration is disabled on this server.');
      } else if (response.status === 409) {
        setServerError('An account already exists with that email.');
      } else if (response.status >= 500) {
        setServerError('Cannot reach the server. Please try again in a few minutes.');
      } else {
        setServerError('Registration failed. Please review the form and try again.');
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
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Sign up to start using App.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {serverError && (
              <Alert variant="destructive" data-testid="register-error">
                <AlertTitle>Registration failed</AlertTitle>
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
                autoComplete="new-password"
                aria-invalid={Boolean(form.formState.errors.password)}
                {...form.register('password')}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
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
                <p className="text-sm text-destructive">{form.formState.errors.confirm.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Creating account…' : 'Create account'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
