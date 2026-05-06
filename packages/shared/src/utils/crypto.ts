function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < bytes.length; i += 1) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * SHA-256 de un Blob/File usando Web Crypto API.
 * El navegador moderno soporta `crypto.subtle.digest('SHA-256', ...)`.
 */
async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  // Modern browsers expose Blob#arrayBuffer; fall back to FileReader otherwise.
  if (typeof blob.arrayBuffer === 'function') {
    return blob.arrayBuffer();
  }
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsArrayBuffer(blob);
  });
}

export async function sha256(input: Blob | ArrayBuffer | ArrayBufferView | string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('Web Crypto API no disponible en este entorno');
  }

  let bytes: Uint8Array;
  if (typeof input === 'string') {
    bytes = new TextEncoder().encode(input);
  } else if (ArrayBuffer.isView(input)) {
    const view = input as ArrayBufferView;
    bytes = new Uint8Array(view.buffer as ArrayBuffer, view.byteOffset, view.byteLength);
  } else if (typeof (input as Blob).arrayBuffer === 'function') {
    bytes = new Uint8Array(await blobToArrayBuffer(input as Blob));
  } else {
    bytes = new Uint8Array(input as ArrayBuffer);
  }

  // Copy into a freshly allocated ArrayBuffer to satisfy lib.dom's BufferSource
  // (which excludes SharedArrayBuffer) and to be safe across realms.
  const owned = new Uint8Array(bytes.byteLength);
  owned.set(bytes);
  const digest = await subtle.digest('SHA-256', owned);
  return bufferToHex(digest);
}
