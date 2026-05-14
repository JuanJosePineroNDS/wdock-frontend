import { describe, expect, it, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';

import { SignaturePad, type SignaturePadHandle } from '../SignaturePad';

// jsdom lacks Canvas2D; provide a stub with the surface area signature_pad uses.
function createCanvasContext() {
  const ctx: Record<string, unknown> = {};
  const methods = [
    'scale',
    'translate',
    'rotate',
    'clearRect',
    'fillRect',
    'strokeRect',
    'beginPath',
    'closePath',
    'moveTo',
    'lineTo',
    'bezierCurveTo',
    'quadraticCurveTo',
    'arc',
    'arcTo',
    'rect',
    'fill',
    'stroke',
    'save',
    'restore',
    'setTransform',
    'resetTransform',
    'putImageData',
    'drawImage',
    'getImageData',
    'createLinearGradient',
    'createPattern',
    'createRadialGradient',
    'setLineDash',
    'measureText',
    'isPointInPath',
    'isPointInStroke',
    'transform',
  ];
  methods.forEach((m) => {
    ctx[m] = vi.fn();
  });
  // mutable properties signature_pad reads/writes
  Object.assign(ctx, {
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    lineCap: 'round',
    lineJoin: 'round',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    font: '10px sans-serif',
    canvas: null,
  });
  ctx.getImageData = vi.fn(() => ({ data: new Uint8ClampedArray(4) }));
  return ctx;
}

beforeAll(() => {
  // Always overwrite to ensure a fresh stub regardless of jsdom version.
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: vi.fn(() => createCanvasContext()),
  });
  Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
    configurable: true,
    value: vi.fn(() => 'data:image/png;base64,stub'),
  });
});

describe('SignaturePad', () => {
  it('renders the canvas and placeholder hint', () => {
    render(<SignaturePad />);
    expect(screen.getByLabelText(/recuadro de firma/i)).toBeInTheDocument();
    expect(screen.getByText(/firma con el dedo/i)).toBeInTheDocument();
  });

  it('exposes a clear() handle that notifies via onChange(null)', async () => {
    const ref = createRef<SignaturePadHandle>();
    const onChange = vi.fn();
    render(<SignaturePad ref={ref} onChange={onChange} />);

    expect(ref.current?.isEmpty()).toBe(true);

    // Programmatic clear via handle.
    ref.current?.clear();
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('the "Borrar" button is disabled while the pad is empty', async () => {
    render(<SignaturePad />);
    const button = screen.getByRole('button', { name: /borrar/i });
    expect(button).toBeDisabled();
    // Clicking a disabled button is a no-op but should not crash.
    await userEvent.click(button);
    expect(button).toBeDisabled();
  });
});
