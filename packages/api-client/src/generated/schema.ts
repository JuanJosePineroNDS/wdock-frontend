// PLACEHOLDER - regenerar con `pnpm run generate:api` cuando el backend este disponible.
// Una vez generado, este archivo es REEMPLAZADO automaticamente. No editar a mano.

export interface paths {
  // Endpoints de ejemplo para que el cliente sea funcional aun sin schema real.
  // Seran sobreescritos al regenerar contra el backend WDock.
  '/api/auth/login/': {
    post: {
      requestBody: {
        content: {
          'application/json': { email: string; password: string };
        };
      };
      responses: {
        200: {
          content: {
            'application/json': {
              access: string;
              refresh: string;
              user: components['schemas']['User'];
            };
          };
        };
        401: { content: { 'application/json': { detail: string } } };
      };
    };
  };
  '/api/auth/refresh/': {
    post: {
      requestBody: {
        content: { 'application/json': { refresh: string } };
      };
      responses: {
        200: { content: { 'application/json': { access: string; refresh?: string } } };
        401: { content: { 'application/json': { detail: string } } };
      };
    };
  };
  '/api/auth/me/': {
    get: {
      responses: {
        200: { content: { 'application/json': components['schemas']['User'] } };
        401: { content: { 'application/json': { detail: string } } };
      };
    };
  };
}

export interface components {
  schemas: {
    User: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      role: 'admin' | 'operator' | 'viewer';
      tenant_id: string;
    };
  };
}

export type webhooks = Record<string, never>;
export type operations = Record<string, never>;
export type $defs = Record<string, never>;
