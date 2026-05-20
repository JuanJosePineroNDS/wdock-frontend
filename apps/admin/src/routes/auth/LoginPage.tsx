import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { authStorage } from '@wdock/api-client';
import { emailSchema, passwordSchema } from '@wdock/shared/utils';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
      const backendDetail =
        error && typeof (error as { detail?: unknown }).detail === 'string'
          ? ((error as { detail?: string }).detail ?? '').trim()
          : '';

      if (response.status >= 500) {
        setServerError(
          'No se ha podido conectar con el servidor. Vuelve a intentarlo en unos minutos.',
        );
      } else if (backendDetail) {
        setServerError(backendDetail);
      } else {
        setServerError('Credenciales incorrectas. Revisa el email y la contrasena.');
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
          <CardTitle>Acceso a WDock Admin</CardTitle>
          <CardDescription>
            Inicia sesion con tu cuenta corporativa para gestionar la plataforma documental.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {serverError && (
              <Alert variant="destructive" data-testid="login-error">
                <AlertTitle>No se ha podido iniciar sesion</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Correo electronico</Label>
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
              <Label htmlFor="password">Contrasena</Label>
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
              {form.formState.isSubmitting ? 'Iniciando sesion...' : 'Iniciar sesion'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
