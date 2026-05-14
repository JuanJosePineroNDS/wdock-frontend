import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import SignaturePadLib from 'signature_pad';
import { Eraser } from 'lucide-react';

export interface SignaturePadHandle {
  isEmpty: () => boolean;
  clear: () => void;
  toDataURL: () => string | null;
}

interface SignaturePadProps {
  onChange?: (dataUrl: string | null) => void;
  ariaLabel?: string;
}

/**
 * Canvas-based signature pad built on top of `signature_pad`.
 *
 * Resize handling: when the canvas size changes (e.g. orientation change), the
 * underlying `signature_pad` instance must be rescaled by `devicePixelRatio`.
 * We clear the canvas on resize — preserving the trace across resizes is
 * non-trivial and not required for our flow (the user can re-sign in a second).
 */
export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(function SignaturePad(
  { onChange, ariaLabel = 'Recuadro de firma' },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<SignaturePadLib | null>(null);
  const [hasStroke, setHasStroke] = useState(false);

  const emitChange = useCallback(() => {
    if (!padRef.current) {
      onChange?.(null);
      return;
    }
    if (padRef.current.isEmpty()) {
      setHasStroke(false);
      onChange?.(null);
      return;
    }
    setHasStroke(true);
    onChange?.(padRef.current.toDataURL('image/png'));
  }, [onChange]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(ratio, ratio);
    }
    padRef.current?.clear();
    setHasStroke(false);
    onChange?.(null);
  }, [onChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const pad = new SignaturePadLib(canvas, {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      penColor: '#0f172a',
      minWidth: 1,
      maxWidth: 2.5,
    });
    padRef.current = pad;
    pad.addEventListener('endStroke', emitChange);

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => {
      pad.removeEventListener('endStroke', emitChange);
      pad.off();
      padRef.current = null;
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [emitChange, resizeCanvas]);

  useImperativeHandle(
    ref,
    () => ({
      isEmpty: () => padRef.current?.isEmpty() ?? true,
      clear: () => {
        padRef.current?.clear();
        setHasStroke(false);
        onChange?.(null);
      },
      toDataURL: () => {
        if (!padRef.current || padRef.current.isEmpty()) return null;
        return padRef.current.toDataURL('image/png');
      },
    }),
    [onChange],
  );

  const handleClear = () => {
    padRef.current?.clear();
    setHasStroke(false);
    onChange?.(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative rounded-lg border-2 border-dashed border-slate-300 bg-white">
        <canvas
          ref={canvasRef}
          aria-label={ariaLabel}
          className="block h-[200px] w-full touch-none rounded-lg"
          style={{ touchAction: 'none' }}
        />
        {!hasStroke ? (
          <p
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-400"
            aria-hidden="true"
          >
            Firma con el dedo dentro del recuadro
          </p>
        ) : null}
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleClear}
          disabled={!hasStroke}
          className="inline-flex h-9 items-center gap-1 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
        >
          <Eraser className="h-3.5 w-3.5" aria-hidden="true" />
          Borrar
        </button>
      </div>
    </div>
  );
});
