# @wdock/api-client

Cliente API tipado para WDock. **Los tipos se generan automáticamente** desde el OpenAPI del backend (`drf-spectacular`).

## Filosofía

- `src/generated/schema.ts` es **autogenerado**. Nunca se edita a mano.
- El cliente usa `openapi-fetch` con esos tipos, así frontend y backend nunca divergen.
- Si el backend añade o cambia un endpoint, regeneramos y TypeScript señala los puntos del frontend afectados.

## Regenerar el cliente

Con el backend WDock corriendo (por defecto en `http://localhost:8000/api/schema/`):

```bash
pnpm run generate:api
# o desde la raíz del repo:
# pnpm --filter @wdock/api-client generate
```

Para apuntar a otro entorno:

```bash
OPENAPI_URL=https://staging.wdock.example.com/api/schema/ pnpm run generate
```

## Estado actual del schema

`src/generated/schema.ts` contiene un **placeholder** mínimo (login, refresh, me) usado como semilla mientras el backend no está disponible. Será reemplazado completamente al regenerar.

## API pública

```ts
import { createApiClient, authStorage } from '@wdock/api-client';

const api = createApiClient({ baseUrl: 'http://localhost:8000' });

// Login
const { data, error } = await api.POST('/api/auth/login/', {
  body: { email: 'a@b.com', password: 'secret' },
});
if (data) {
  authStorage.setTokens(data.access, data.refresh);
}
```

El cliente:

- Añade `Authorization: Bearer <access>` automáticamente a las requests autenticadas.
- Detecta `401`, llama a `/api/auth/refresh/` con el refresh token, reintenta la petición original.
- Si el refresh falla, dispara el evento `auth:logout` (configurable) para que la app cierre sesión.

## Errores

```ts
import { ApiError, AuthError, ValidationError } from '@wdock/api-client';
```

`ValidationError.fieldErrors` es un mapa `{ campo: [mensajes] }` cuando el backend responde 400 con errores por campo (formato DRF).
