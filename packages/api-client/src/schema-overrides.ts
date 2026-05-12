/**
 * Re-export of the generated paths and convenient aliases for the most
 * frequently used schemas (User, login request/response).
 *
 * When the backend describes an endpoint fully, the generated types are the
 * single source of truth. This module exists so the rest of the app can
 * `import type { User, AppPaths } from '@app/api-client'` without reaching
 * into `./generated`.
 */

import type { paths as GeneratedPaths, components } from './generated/schema';

export type AppPaths = GeneratedPaths;

export type User = components['schemas']['Me'];
export type LoginRequest = components['schemas']['LoginRequest'];
export type LoginResponse = components['schemas']['LoginResponse'];
