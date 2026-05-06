// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { sha256 } from '../utils/crypto';

describe('sha256', () => {
  it('produces the expected digest for a known string', async () => {
    const result = await sha256('hello world');
    // Reference SHA-256 hex of "hello world".
    expect(result).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
  });

  it('hashes binary data', async () => {
    const buffer = new TextEncoder().encode('hello world').buffer as ArrayBuffer;
    const result = await sha256(buffer);
    expect(result).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
  });

  it('hashes a Blob built from a Uint8Array', async () => {
    const bytes = new TextEncoder().encode('hello world');
    const blob = new Blob([bytes], { type: 'application/octet-stream' });
    const result = await sha256(blob);
    expect(result).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
  });
});
