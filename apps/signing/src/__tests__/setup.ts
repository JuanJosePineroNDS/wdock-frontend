import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom does not implement PointerEvent. `signature_pad` listens for pointer
// events to capture strokes, so tests need a minimal polyfill.
type PointerInit = MouseEventInit & {
  pointerId?: number;
  pointerType?: string;
  pressure?: number;
  tiltX?: number;
  tiltY?: number;
  width?: number;
  height?: number;
};

class PointerEventPolyfill extends MouseEvent {
  pointerId: number;
  pointerType: string;
  pressure: number;
  tiltX: number;
  tiltY: number;
  width: number;
  height: number;

  constructor(type: string, params: PointerInit = {}) {
    super(type, params);
    this.pointerId = params.pointerId ?? 1;
    this.pointerType = params.pointerType ?? 'mouse';
    this.pressure = params.pressure ?? 0.5;
    this.tiltX = params.tiltX ?? 0;
    this.tiltY = params.tiltY ?? 0;
    this.width = params.width ?? 1;
    this.height = params.height ?? 1;
  }
}

if (typeof globalThis.PointerEvent === 'undefined') {
  Object.defineProperty(globalThis, 'PointerEvent', {
    configurable: true,
    writable: true,
    value: PointerEventPolyfill,
  });
}

// jsdom canvas does not implement setPointerCapture/releasePointerCapture.
if (typeof HTMLElement !== 'undefined') {
  if (!HTMLElement.prototype.setPointerCapture) {
    HTMLElement.prototype.setPointerCapture = function setPointerCapture() {
      /* noop */
    };
  }
  if (!HTMLElement.prototype.releasePointerCapture) {
    HTMLElement.prototype.releasePointerCapture = function releasePointerCapture() {
      /* noop */
    };
  }
  if (!HTMLElement.prototype.hasPointerCapture) {
    HTMLElement.prototype.hasPointerCapture = function hasPointerCapture() {
      return false;
    };
  }
}

afterEach(() => {
  cleanup();
});
