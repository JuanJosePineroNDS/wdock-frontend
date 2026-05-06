# wdock-frontend

Plataforma documental WDock — frontend monorepo. Sustituye a DocuWare para la gestión de albaranes con firma biométrica.

## Estado del proyecto

**Semanas 2-3 (MVP vertical) completadas** en `feature/week-2-3-signature-and-admin` (PR pendiente de revisión hacia `develop`).

Esta entrega cubre el camino de extremo a extremo "ERP envía documento → admin crea sesión → conductor firma en tablet → backend procesa". Quedan fuera, para PRs posteriores, RGPD/geolocalización, modo offline, polish de PWA, gestión de usuarios e integraciones ERP.

### Lo que sí está incluido en este MVP

**Tablet:**
- `SignaturePad` real con `signature_pad@5`, captura por Pointer Events de cada punto `{x, y, t (ms relativo), p (presión)}` y metadata derivada (duración, presiones, velocidad media). Botón "Limpiar" con tamaño táctil.
- `PdfViewer` con `pdfjs-dist@4`, navegación entre páginas, zoom 50–200%, manejo de carga y error.
- `SignaturePage` E2E: carga la `PublicSession` por token, calcula el SHA-256 del PDF en cliente con Web Crypto, valida contra `hash_documento_esperado`, envía el `SignSubmitRequest` tipado y redirige a `/sign/done`. Botón "Rechazar" exige razón no vacía y navega a `/sign/rejected`.

**Admin:**
- Hook global `useAuthLogoutListener` montado en App: el evento `auth:logout` (que dispara el cliente API tras refresh fallido) limpia el store y redirige a `/login` desde cualquier pantalla.
- Listado de documentos `/documents` con TanStack Query, paginación, badges de estado (mapeados desde `@wdock/shared/constants`), skeleton, error y empty state.
- Detalle `/documents/:id` con datos básicos, lista de vehículos y vista previa del PDF en iframe (apunta al endpoint que redirige al presigned MinIO).
- Modal "Crear sesión de firma" con `modalidad`/`firmante_nombre`/`firmante_dni`/`ttl_minutes`, llamada al endpoint del backend y vista de éxito con QR (`qrcode.react`) + copiar URL.

### Lo que se queda fuera (PRs separados)

- 1.3 Geolocalización con consentimiento.
- 1.4 Aviso legal RGPD.
- 1.6 Modo offline con IndexedDB.
- 1.7 Pulido PWA (orientación, gestos, iconos finales).
- 2.5 Gestión de usuarios.
- 2.6 Gestión de integraciones ERP.
- Filtros avanzados en listado y tabs (Evidencias / Historial / Versiones) en detalle.

### Tests

78 verdes (10 api-client + 30 shared + 23 tablet + 15 admin).

## Stack tecnológico

- **React 18** + **Vite** + **TypeScript estricto**
- **Tailwind CSS** + **shadcn/ui** como sistema de diseño
- **TanStack Query** para gestión de estado servidor
- **React Hook Form** + **Zod** para formularios validados
- **Zustand** para estado cliente cuando hace falta
- **openapi-fetch** + **openapi-typescript** para cliente API tipado generado
- **pnpm workspaces** para el monorepo
- **Vitest** + **Testing Library** para tests
- **vite-plugin-pwa** para la app tablet offline
- **signature_pad** para captura biométrica de firma
- **GitHub Actions** para CI

## Estructura del monorepo

```
wdock-frontend/
├── apps/
│   ├── admin/      # SPA web para administradores y operadores internos
│   ├── tablet/     # PWA tablet para firma biométrica del conductor
│   └── operator/   # SPA simplificada para operarios (v2)
└── packages/
    ├── shared/     # Utilidades, hooks y validadores comunes
    └── api-client/ # Cliente API y tipos TypeScript GENERADOS desde el OpenAPI
```

## Requisitos previos

- **Node.js** >= 20 (ver `.nvmrc`)
- **pnpm** >= 9 — instalar con `npm install -g pnpm` o seguir https://pnpm.io/installation

## Inicio rápido

```bash
pnpm install
pnpm run generate:api    # Solo si el backend está corriendo
pnpm run dev:admin       # Levanta admin en http://localhost:5173
pnpm run dev:tablet      # Levanta tablet en http://localhost:5174
```

## Cliente API tipado

El paquete `@wdock/api-client` contiene tipos y un cliente API **generados automáticamente** desde el OpenAPI del backend. Esto garantiza que frontend y backend nunca divergen.

### Cómo regenerar

Cuando el backend cambia un endpoint o un tipo:

1. Asegúrate de que el backend de WDock está corriendo (por defecto en `http://localhost:8000/api/schema/`).
2. Ejecuta desde la raíz: `pnpm run generate:api`.
3. Si hay cambios, hacer commit con mensaje `chore(api-client): regenerate types from backend OpenAPI`.

### Variable de entorno opcional

```bash
OPENAPI_URL=https://staging.wdock.example.com/api/schema/ pnpm run generate:api
```

### Reglas

- **Nunca edites a mano** archivos en `packages/api-client/src/generated/`. Si necesitas un tipo distinto, cámbialo en el backend y regenera.
- Los archivos generados **se commitean** para que el repo sea utilizable sin tener el backend corriendo localmente.

## Variables de entorno

Cada app puede tener su propio `.env.local` (no se commitea). Variables típicas:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | URL base de la API backend | `http://localhost:8000` |

## Reglas de contribución

- La rama base es `develop`. **Nunca commits directos a `main`.**
- Cada fase/semana se desarrolla en una rama `feature/...` que sale de `develop`.
- Al terminar una fase: PR a `develop`. Espera revisión humana.
- A `main` solo se mergea desde `develop` con PR.
- Mensajes de commit siguen [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`.

## Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `pnpm run dev:admin` | Inicia la app admin en modo dev (puerto 5173) |
| `pnpm run dev:tablet` | Inicia la app tablet en modo dev (puerto 5174) |
| `pnpm run lint` | Ejecuta ESLint sobre todo el repo |
| `pnpm run typecheck` | Verifica tipos en todos los workspaces |
| `pnpm run test` | Ejecuta los tests de todos los workspaces |
| `pnpm run build` | Construye todos los workspaces |
| `pnpm run format` | Aplica Prettier al repo |
| `pnpm run format:check` | Verifica formato sin escribir |
| `pnpm run generate:api` | Regenera el cliente API desde el OpenAPI del backend |
