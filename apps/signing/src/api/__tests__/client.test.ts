import { describe, expect, it, vi } from 'vitest';

import { fetchSigningSession, SigningApiError, submitSignature } from '../client';

function makeFetch(status: number, body: unknown): typeof fetch {
  return vi.fn(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
  ) as unknown as typeof fetch;
}

describe('fetchSigningSession', () => {
  it('returns the session on 200', async () => {
    const fakeFetch = makeFetch(200, {
      shipment_external_id: 'SIGN-TEST-1',
      scheduled_date: '2026-05-15',
      cargo_description: 'Material',
      carrier_name: 'Juan',
      status: 'pending',
      document_url: null,
      expires_at: '2026-05-16T14:59:09Z',
    });
    const data = await fetchSigningSession('tok', fakeFetch);
    expect(data.shipment_external_id).toBe('SIGN-TEST-1');
  });

  it('throws SigningApiError with 404 on invalid token', async () => {
    const fakeFetch = makeFetch(404, { detail: 'Not found' });
    await expect(fetchSigningSession('bad', fakeFetch)).rejects.toMatchObject({
      name: 'SigningApiError',
      status: 404,
    });
  });

  it('throws SigningApiError with 409 on already signed', async () => {
    const fakeFetch = makeFetch(409, { detail: 'Already signed' });
    try {
      await fetchSigningSession('tok', fakeFetch);
      throw new Error('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(SigningApiError);
      expect((error as SigningApiError).status).toBe(409);
    }
  });

  it('throws SigningApiError with 410 on expired', async () => {
    const fakeFetch = makeFetch(410, { detail: 'Expired' });
    await expect(fetchSigningSession('tok', fakeFetch)).rejects.toMatchObject({
      name: 'SigningApiError',
      status: 410,
    });
  });
});

describe('submitSignature', () => {
  it('posts the payload and returns response body on 201', async () => {
    const fakeFetch = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = init?.body as string;
      expect(JSON.parse(body)).toEqual({
        signature_image: 'data:image/png;base64,xx',
        signer_dni: '12345678Z',
        accepted_terms: true,
      });
      return new Response(JSON.stringify({ status: 'received' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as unknown as typeof fetch;

    const res = await submitSignature(
      'tok',
      {
        signature_image: 'data:image/png;base64,xx',
        signer_dni: '12345678Z',
        accepted_terms: true,
      },
      fakeFetch,
    );
    expect(res.status).toBe('received');
  });

  it('maps 400 validation errors', async () => {
    const fakeFetch = makeFetch(400, { signer_dni: ['DNI inválido'] });
    await expect(
      submitSignature(
        'tok',
        { signature_image: 'data:image/png;base64,xx', signer_dni: 'bad', accepted_terms: true },
        fakeFetch,
      ),
    ).rejects.toMatchObject({ status: 400 });
  });
});
