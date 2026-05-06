# wdock-frontend

Plataforma documental WDock — frontend monorepo. Sustituye a DocuWare para la gestión de albaranes con firma biométrica.

## Estado del proyecto

Setup inicial completado. La Semana 1 (cimientos del monorepo + apps básicas) está en desarrollo en la rama `feature/week-1-foundations`.

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
