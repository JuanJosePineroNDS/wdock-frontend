import { Eraser } from 'lucide-react';
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import SignaturePadLib from 'signature_pad';
import { cn } from '@wdock/shared/utils';

import { computeSignatureMetadata, type SignatureMetadata, type SignaturePoint } from '@/types/signature';

export interface SignaturePadHandle {
  /** Returns a snapshot of the captured points and derived metadata. */
  collect(): { points: SignaturePoint[]; metadata: SignatureMetadata };
  /** Wipes the canvas and the captured points. */
  clear(): void;
  /** Whether at least one stroke has been drawn. */
  isEmpty(): boolean;
}

export interface SignaturePadProps {
  /** Notified after every stroke ends. The parent can enable / disable the submit button from here. */
  onChange?(state: { isEmpty: boolean; numPoints: number }): void;
  /** Optional aria-label override. */
  ariaLabel?: string;
  className?: string;
}

interface RawStroke {
  points: { x: number; y: number; pressure: number; time: number }[];
}

function flatten(strokes: RawStroke[]): SignaturePoint[] {
  if (strokes.length === 0) return [];
  // signature_pad gives us absolute timestamps per point. We rebase to the first
  // captured point so the backend receives ``t`` relative to the first stroke.
  let earliest = Number.POSITIVE_INFINITY;
  for (const s of strokes) {
    for (const p of s.points) {
      if (p.time < earliest) earliest = p.time;
    }
  }
  const out: SignaturePoint[] = [];
  for (const s of strokes) {
    for (const p of s.points) {
      out.push({
        x: p.x,
        y: p.y,
        t: Math.max(0, Math.round(p.time - earliest)),
        p: typeof p.pressure === 'number' && p.pressure > 0 ? p.pressure : 0.5,
      });
    }
  }
  return out;
}

export function SignaturePad({
  onChange,
  ariaLabel = 'Area de firma',
  className,
  innerRef,
}: SignaturePadProps & { innerRef?: React.Ref<SignaturePadHandle | null> }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<SignaturePadLib | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [numPoints, setNumPoints] = useState(0);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    // jsdom returns null from getContext('2d'); skip the scale + clear in that case.
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    padRef.current?.clear();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pad = new SignaturePadLib(canvas, {
      backgroundColor: 'rgba(255,255,255,0)',
      penColor: '#0f172a',
      minWidth: 0.6,
      maxWidth: 2.6,
      throttle: 8,
      minDistance: 1,
    });
    padRef.current = pad;

    const handleEnd = () => {
      const empty = pad.isEmpty();
      const data = pad.toData() as RawStroke[];
      const points = flatten(data);
      setIsEmpty(empty);
      setNumPoints(points.length);
      onChangeRef.current?.({ isEmpty: empty, numPoints: points.length });
    };
    pad.addEventListener('endStroke', handleEnd);

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => {
      pad.removeEventListener('endStroke', handleEnd);
      pad.off();
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [resizeCanvas]);

  const clear = useCallback(() => {
    padRef.current?.clear();
    setIsEmpty(true);
    setNumPoints(0);
    onChangeRef.current?.({ isEmpty: true, numPoints: 0 });
  }, []);

  const collect = useCallback(() => {
    const pad = padRef.current;
    if (!pad) return { points: [], metadata: computeSignatureMetadata([]) };
    const points = flatten(pad.toData() as RawStroke[]);
    return { points, metadata: computeSignatureMetadata(points) };
  }, []);

  useImperativeHandle(
    innerRef,
    () => ({
      collect,
      clear,
      isEmpty: () => isEmpty,
    }),
    [collect, clear, isEmpty],
  );

  const placeholder = useMemo(
    () => (isEmpty ? <span className="select-none text-slate-400">Firme aqui</span> : null),
    [isEmpty],
  );

  return (
    <div
      className={cn(
        'relative h-full w-full overflow-hidden rounded-lg border-2 border-slate-300 bg-white',
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none"
        style={{ touchAction: 'none' }}
        role="img"
        aria-label={ariaLabel}
        data-testid="signature-pad-canvas"
        data-empty={isEmpty}
        data-points={numPoints}
      />
      {placeholder && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-2xl">
          {placeholder}
        </div>
      )}
      <button
        type="button"
        onClick={clear}
        disabled={isEmpty}
        aria-label="Limpiar firma"
        className={cn(
          'absolute right-3 top-3 inline-flex h-12 w-12 items-center justify-center rounded-full',
          'border border-slate-300 bg-white text-slate-700 shadow-sm transition-colors',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-400',
          'hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50',
        )}
        data-testid="signature-pad-clear"
      >
        <Eraser className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}
