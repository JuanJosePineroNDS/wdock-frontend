import { useMutation, useQuery } from '@tanstack/react-query';

import { unwrapError, type components } from '@wdock/api-client';

import { useApiClient } from '@/hooks/useApiClient';

export type Signature = components['schemas']['Signature'];
export type SignatureStatus = components['schemas']['SignatureStatusEnum'];

/**
 * Resolves the Signature attached to the SIGNED dispatch of a Shipment.
 * Returns null when there is no signed dispatch yet, or when the signature row
 * is not visible to the caller. Performs two GETs (dispatches → signatures);
 * the query key is stable so refetches are cheap.
 */
export function useShipmentSignature(shipmentId: string | undefined) {
  const client = useApiClient();
  return useQuery<Signature | null, Error>({
    queryKey: ['shipments', shipmentId, 'signature'],
    queryFn: async () => {
      if (!shipmentId) {
        throw new Error('Missing shipment id');
      }
      const {
        data: dispatchData,
        error: dispatchError,
        response: dispatchResponse,
      } = await client.GET('/api/v1/sms-dispatches/', {
        params: { query: { shipment: shipmentId, status: 'SIGNED' } },
      });
      if (dispatchError || !dispatchData) {
        throw await unwrapError(dispatchResponse);
      }
      const signedDispatch = dispatchData.results[0];
      if (!signedDispatch) {
        return null;
      }
      const {
        data: signatureData,
        error: signatureError,
        response: signatureResponse,
      } = await client.GET('/api/v1/signatures/', {
        params: { query: { sms_dispatch: signedDispatch.id } },
      });
      if (signatureError || !signatureData) {
        throw await unwrapError(signatureResponse);
      }
      return signatureData.results[0] ?? null;
    },
    enabled: Boolean(shipmentId),
  });
}

/**
 * Fetches a short-lived presigned URL for the signed PDF of a given signature.
 * The backend operation is documented as returning the presigned URL even
 * though the OpenAPI schema declares the response type as `Signature`; we read
 * `download_url` defensively so a future schema fix does not break the client.
 */
export function useDownloadSignedPdf() {
  const client = useApiClient();
  return useMutation<string, Error, string>({
    mutationFn: async (signatureId) => {
      const { data, error, response } = await client.GET('/api/v1/signatures/{id}/download/', {
        params: { path: { id: signatureId } },
      });
      if (error || !data) {
        throw await unwrapError(response);
      }
      const url = (data as unknown as { download_url?: string }).download_url;
      if (!url) {
        throw new Error('La respuesta no contiene un enlace de descarga.');
      }
      return url;
    },
  });
}
