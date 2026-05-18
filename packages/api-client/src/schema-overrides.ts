/**
 * Ergonomic re-exports of generated OpenAPI types.
 *
 * Previously this file contained manual overrides for auth endpoints that the
 * backend OpenAPI schema did not describe. After the backend cleanup those
 * endpoints are fully documented, so this file is now just a thin alias layer
 * so consumers can keep importing `User`, `LoginRequest`, `LoginResponse` and
 * `WdockPaths` from `@wdock/api-client` without poking into the generated
 * module.
 */

import type { components, paths as GeneratedPaths } from './generated/schema';

export type User = components['schemas']['Me'];
export type LoginRequest = components['schemas']['LoginRequest'];
export type LoginResponse = components['schemas']['LoginResponse'];

export type WdockPaths = GeneratedPaths;
