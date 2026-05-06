import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock signature_pad with a controllable fake. Both the FakePad class and the
// shared `lastInstance` have to be defined inside `vi.hoisted` because vi.mock
// factories are hoisted above all imports.
const { FakePad, lastInstance } = vi.hoisted(() => {
  class FakePad {
    isEmptyValue = true;
    data: { points: { x: number; y: number; pressure: number; time: number }[] }[] = [];
    endHandlers: Array<() => void> = [];
    destroyed = false;
    constructor(_canvas: HTMLCanvasElement) {
      lastInstance.current = this;
    }
    isEmpty() {
      return this.isEmptyValue;
    }
    toData() {
      return this.data;
    }
    clear() {
      this.isEmptyValue = true;
      this.data = [];
    }
    addEventListener(name: string, handler: () => void) {
      if (name === 'endStroke') this.endHandlers.push(handler);
    }
    removeEventListener(name: string, handler: () => void) {
      if (name === 'endStroke') {
        this.endHandlers = this.endHandlers.filter((h) => h !== handler);
      }
    }
    off() {
      this.destroyed = true;
    }
    emitEnd() {
      for (const h of this.endHandlers) h();
    }
  }
  const lastInstance: { current: null | FakePad } = { current: null };
  return { FakePad, lastInstance };
});

vi.mock('signature_pad', () => ({
  default: FakePad,
}));

import { SignaturePad } from '@/components/SignaturePad';

describe('SignaturePad', () => {
  beforeEach(() => {
    lastInstance.current = null;
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the canvas with placeholder text and a disabled clear button', () => {
    render(<SignaturePad />);
    expect(screen.getByTestId('signature-pad-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('signature-pad-canvas')).toHaveAttribute('data-empty', 'true');
    expect(screen.getByText('Firme aqui')).toBeInTheDocument();
    expect(screen.getByTestId('signature-pad-clear')).toBeDisabled();
  });

  it('notifies the parent and updates state when a stroke ends', () => {
    const onChange = vi.fn();
    render(<SignaturePad onChange={onChange} />);
    const pad = lastInstance.current!;
    pad.isEmptyValue = false;
    pad.data = [
      {
        points: [
          { x: 1, y: 1, pressure: 0.4, time: 1000 },
          { x: 2, y: 2, pressure: 0.5, time: 1100 },
        ],
      },
    ];
    act(() => {
      pad.emitEnd();
    });
    expect(onChange).toHaveBeenCalledWith({ isEmpty: false, numPoints: 2 });
  });

  it('exposes collect() that returns flattened, time-rebased points and metadata', () => {
    const handle: { current: null | { collect: () => unknown; clear: () => void; isEmpty: () => boolean } } = {
      current: null,
    };
    render(<SignaturePad innerRef={handle} />);
    const pad = lastInstance.current!;
    pad.isEmptyValue = false;
    pad.data = [
      {
        points: [
          { x: 0, y: 0, pressure: 0, time: 5000 },
          { x: 10, y: 0, pressure: 0.3, time: 5100 },
        ],
      },
      {
        points: [
          { x: 30, y: 0, pressure: 0.7, time: 5300 },
        ],
      },
    ];
    const result = handle.current!.collect() as {
      points: { x: number; y: number; t: number; p: number }[];
      metadata: { num_puntos: number; duracion_ms: number };
    };
    expect(result.points).toHaveLength(3);
    // Time is rebased to the first captured point.
    expect(result.points[0].t).toBe(0);
    expect(result.points[1].t).toBe(100);
    expect(result.points[2].t).toBe(300);
    // Pressure 0 is replaced by the 0.5 default per backend contract.
    expect(result.points[0].p).toBe(0.5);
    expect(result.points[1].p).toBeCloseTo(0.3);
    expect(result.metadata.num_puntos).toBe(3);
    expect(result.metadata.duracion_ms).toBe(300);
  });

  it('clears the pad on the clear button and resets state', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SignaturePad onChange={onChange} />);
    const pad = lastInstance.current!;
    // Simulate a stroke first so the button enables.
    pad.isEmptyValue = false;
    pad.data = [{ points: [{ x: 0, y: 0, pressure: 0.5, time: 0 }] }];
    act(() => {
      pad.emitEnd();
    });
    expect(screen.getByTestId('signature-pad-clear')).not.toBeDisabled();
    onChange.mockClear();

    await user.click(screen.getByTestId('signature-pad-clear'));
    expect(pad.data).toEqual([]);
    expect(pad.isEmptyValue).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith({ isEmpty: true, numPoints: 0 });
  });
});
