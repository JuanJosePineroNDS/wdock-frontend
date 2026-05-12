# Getting started

## Prerequisites

- **Node.js** 20+ (see `.nvmrc`)
- **pnpm** 9+ (`npm install -g pnpm`)
- A running backend exposing `/api/v1/*` and `/api/schema/`. The companion template is `wtemplate-backend` (defaults to `http://localhost:8000`).

## First run

```bash
pnpm install
pnpm run generate:api      # only if the backend is running
pnpm run dev:admin         # starts the admin SPA on http://localhost:5173
```

The dev server proxies `/api` to `http://localhost:8000`. Override with `VITE_API_BASE_URL` if your backend lives elsewhere.

## Environment

Copy `apps/admin/.env.example` to `apps/admin/.env.local` (gitignored) and adjust as needed:

| Variable                 | Description                                                  | Default  |
| ------------------------ | ------------------------------------------------------------ | -------- |
| `VITE_API_BASE_URL`      | Backend base URL. Empty in dev to use the Vite proxy.        | (empty)  |
| `VITE_APP_NAME`          | Display name shown in titles.                                | `App`    |
| `VITE_REGISTRATION_MODE` | `CLOSED`, `INVITATION`, or `PUBLIC`. Must match the backend. | `CLOSED` |

## Scripts

| Command                 | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `pnpm run dev:admin`    | Start the admin SPA in dev mode                    |
| `pnpm run typecheck`    | Type-check all workspaces                          |
| `pnpm run lint`         | Run ESLint across the repo                         |
| `pnpm run test`         | Run tests in every workspace                       |
| `pnpm run build`        | Build every workspace                              |
| `pnpm run format`       | Apply Prettier                                     |
| `pnpm run generate:api` | Regenerate the API client from the backend OpenAPI |

## First login

The companion backend bootstraps a default tenant and a default admin user on startup. The exact credentials are printed by the backend; the typical default is:

- Email: `admin@example.local`
- Password: `Admin1234!`

Change the password immediately after the first login.
