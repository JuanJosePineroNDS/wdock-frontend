/**
 * Types for the public signing endpoint.
 *
 * The OpenAPI schema for `/api/v1/sign/{token}/` uses generic `additionalProperties: {}`,
 * so we define explicit types here matching the documented contract.
 */

export interface SigningSession {
  shipment_external_id: string;
  scheduled_date: string;
  cargo_description: string;
  carrier_name: string;
  status: 'pending' | string;
  document_url: string | null;
  expires_at: string;
}

export interface Geolocation {
  lat: number;
  lng: number;
  accuracy: number;
}

export interface SubmitSignaturePayload {
  signature_image: string;
  signer_dni: string;
  geolocation?: Geolocation;
  accepted_terms: boolean;
}

export interface SubmitSignatureResponse {
  status?: string;
  signature_id?: string;
  [key: string]: unknown;
}

export type SigningSessionState =
  | 'loading'
  | 'signable'
  | 'already_signed'
  | 'expired'
  | 'invalid'
  | 'error';

export interface SigningErrorBody {
  detail?: string;
  [key: string]: unknown;
}
