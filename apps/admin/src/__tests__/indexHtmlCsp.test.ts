import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const HTML_PATH = resolve(__dirname, '../../index.html');

function readHtml(): string {
  return readFileSync(HTML_PATH, 'utf-8');
}

function getCspContent(html: string): string {
  const match = html.match(/Content-Security-Policy"\s+content="([^"]+)"/);
  if (!match) {
    throw new Error('Content-Security-Policy meta tag not found');
  }
  return match[1];
}

describe('admin index.html security meta tags', () => {
  it('includes a Content-Security-Policy meta tag', () => {
    expect(readHtml()).toContain('http-equiv="Content-Security-Policy"');
  });

  it('CSP disallows unsafe-inline in script-src', () => {
    const csp = getCspContent(readHtml());
    const scriptSrc = csp.split(';').find((d) => d.trim().startsWith('script-src'));
    expect(scriptSrc).toBeDefined();
    expect(scriptSrc).not.toMatch(/unsafe-inline/);
    expect(scriptSrc).not.toMatch(/unsafe-eval/);
  });

  it('CSP omits frame-ancestors (browsers ignore it via <meta>; X-Frame-Options HTTP header covers anti-clickjacking)', () => {
    const csp = getCspContent(readHtml());
    expect(csp).not.toMatch(/frame-ancestors/);
  });

  it('CSP forbids plugins/embeds via object-src none', () => {
    const csp = getCspContent(readHtml());
    expect(csp).toMatch(/object-src\s+'none'/);
  });

  it('CSP whitelists the known backend origins for connect-src', () => {
    const csp = getCspContent(readHtml());
    const connectSrc = csp.split(';').find((d) => d.trim().startsWith('connect-src'));
    expect(connectSrc).toBeDefined();
    expect(connectSrc).toContain("'self'");
    expect(connectSrc).toContain('http://localhost:8000');
    expect(connectSrc).toContain('https://api.wdock.es');
  });

  it('includes a strict referrer policy', () => {
    expect(readHtml()).toMatch(/name="referrer"\s+content="same-origin"/);
  });

  it('includes X-Content-Type-Options nosniff', () => {
    expect(readHtml()).toMatch(/http-equiv="X-Content-Type-Options"\s+content="nosniff"/);
  });
});
