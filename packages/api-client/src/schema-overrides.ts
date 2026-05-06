/**
 * Overrides locales sobre el schema OpenAPI generado.
 *
 * El backend WDock todavia no describe completamente algunos endpoints
 * (login y /auth/me no exponen request/response bodies en el OpenAPI). Aqui
 * definimos esos contratos manualmente para que el cliente este completamente
 * tipado mientras tanto.
 *
 * Cuando el backend los describa correctamente, basta con regenerar y
 * eliminar las entradas correspondientes de este archivo.
 */

import type { paths as GeneratedPaths } from './generated/schema';

export interface User {
  id: string;
  email: string;
  rol: string;
  activo: boolean;
  is_staff: boolean;
  tenant_id: string;
  tenant_nombre: string;
  ultimo_login: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

interface ErrorBody {
  detail?: string;
  [key: string]: unknown;
}

interface JsonOperation<Req, Res> {
  parameters: { query?: never; header?: never; path?: never; cookie?: never };
  requestBody: { content: { 'application/json': Req } };
  responses: {
    200: { headers: Record<string, unknown>; content: { 'application/json': Res } };
    400: { headers: Record<string, unknown>; content: { 'application/json': ErrorBody } };
    401: { headers: Record<string, unknown>; content: { 'application/json': ErrorBody } };
    default: {
      headers: Record<string, unknown>;
      content: { 'application/json': ErrorBody };
    };
  };
}

interface JsonGetOperation<Res> {
  parameters: { query?: never; header?: never; path?: never; cookie?: never };
  responses: {
    200: { headers: Record<string, unknown>; content: { 'application/json': Res } };
    401: { headers: Record<string, unknown>; content: { 'application/json': ErrorBody } };
    default: {
      headers: Record<string, unknown>;
      content: { 'application/json': ErrorBody };
    };
  };
}

interface PathOverrides {
  '/api/v1/auth/login': {
    parameters: { query?: never; header?: never; path?: never; cookie?: never };
    get?: never;
    put?: never;
    post: JsonOperation<LoginRequest, LoginResponse>;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/api/v1/auth/me': {
    parameters: { query?: never; header?: never; path?: never; cookie?: never };
    get: JsonGetOperation<User>;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}

export type WdockPaths = Omit<GeneratedPaths, keyof PathOverrides> & PathOverrides;
