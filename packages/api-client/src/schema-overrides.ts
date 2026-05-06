/**
 * Re-exports + (eventual) overrides sobre el schema OpenAPI generado.
 *
 * Tras el PR de "enriquecer schemas" en el backend, login / refresh /
 * me / documents / signature ya estan completamente tipados en el
 * OpenAPI. Aqui solo aliasamos los tipos comunes para mantener un
 * import publico estable y reservar el patron de override por si en
 * el futuro algun endpoint vuelve a quedarse sin describir.
 */

import type { paths as GeneratedPaths, components } from './generated/schema';

export type User = components['schemas']['Me'];
export type LoginRequest = components['schemas']['LoginRequest'];
export type LoginResponse = components['schemas']['LoginResponse'];

// Por ahora WdockPaths es el schema generado tal cual. Si alguna vez
// hace falta sobreescribir un endpoint, basta con declarar PathOverrides
// y combinar con Omit<GeneratedPaths, keyof PathOverrides> & PathOverrides.
export type WdockPaths = GeneratedPaths;
