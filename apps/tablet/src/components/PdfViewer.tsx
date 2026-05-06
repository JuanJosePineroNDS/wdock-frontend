import { ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
// Vite serves the worker as a static module; the ?url suffix gives a stable URL.
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { cn } from '@wdock/shared/utils';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

interface PdfViewerProps {
  url?: string | null;
  className?: string;
}

const ZOOM_STEPS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
const DEFAULT_ZOOM_INDEX = 2; // 1.0

export function PdfViewer({ url, className }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);

  // Load the document whenever the URL changes.
  useEffect(() => {
    if (!url) {
      setPdf(null);
      setStatus('idle');
      return;
    }
    let cancelled = false;
    setStatus('loading');
    setError(null);
    setPageNumber(1);
    const task = pdfjs.getDocument({ url, withCredentials: false });
    task.promise.then(
      (doc) => {
        if (cancelled) {
          doc.destroy();
          return;
        }
        setPdf(doc);
        setStatus('ready');
      },
      (err: unknown) => {
        if (cancelled) return;
        setStatus('error');
        setError(err instanceof Error ? err.message : 'No se pudo cargar el documento');
      },
    );
    return () => {
      cancelled = true;
      task.destroy();
    };
  }, [url]);

  // Render the current page whenever pdf, page or zoom change.
  useEffect(() => {
    if (!pdf || status !== 'ready') return;
    let cancelled = false;
    pdf.getPage(pageNumber).then((page) => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scale = ZOOM_STEPS[zoomIndex];
      const viewport = page.getViewport({ scale });
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * ratio);
      canvas.height = Math.floor(viewport.height * ratio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      const task = page.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = task;
      task.promise.catch((err: unknown) => {
        // RenderingCancelledException is expected when the effect re-runs.
        const name = (err as { name?: string }).name;
        if (name === 'RenderingCancelledException' || cancelled) return;
        setError(err instanceof Error ? err.message : 'No se pudo renderizar la pagina');
      });
    });
    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
    };
  }, [pdf, pageNumber, zoomIndex, status]);

  const numPages = pdf?.numPages ?? 0;
  const goPrev = useCallback(() => {
    setPageNumber((n) => Math.max(1, n - 1));
  }, []);
  const goNext = useCallback(() => {
    setPageNumber((n) => Math.min(numPages, n + 1));
  }, [numPages]);
  const zoomIn = useCallback(() => {
    setZoomIndex((i) => Math.min(ZOOM_STEPS.length - 1, i + 1));
  }, []);
  const zoomOut = useCallback(() => {
    setZoomIndex((i) => Math.max(0, i - 1));
  }, []);

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-lg border border-slate-300 bg-white',
        className,
      )}
      data-testid="pdf-viewer"
      data-status={status}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goPrev}
            disabled={pageNumber <= 1 || status !== 'ready'}
            aria-label="Pagina anterior"
            className={iconBtn}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <div className="px-2 text-sm tabular-nums text-slate-700" data-testid="pdf-pager">
            {status === 'ready' ? `Pagina ${pageNumber} de ${numPages}` : '—'}
          </div>
          <button
            type="button"
            onClick={goNext}
            disabled={pageNumber >= numPages || status !== 'ready'}
            aria-label="Pagina siguiente"
            className={iconBtn}
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={zoomOut}
            disabled={zoomIndex <= 0 || status !== 'ready'}
            aria-label="Reducir zoom"
            className={iconBtn}
          >
            <ZoomOut className="h-5 w-5" aria-hidden />
          </button>
          <div className="px-2 text-sm tabular-nums text-slate-700" data-testid="pdf-zoom">
            {Math.round(ZOOM_STEPS[zoomIndex] * 100)}%
          </div>
          <button
            type="button"
            onClick={zoomIn}
            disabled={zoomIndex >= ZOOM_STEPS.length - 1 || status !== 'ready'}
            aria-label="Ampliar zoom"
            className={iconBtn}
          >
            <ZoomIn className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-slate-100 p-4">
        {status === 'loading' && (
          <div className="flex h-full flex-col items-center justify-center text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
            <p className="mt-2">Cargando documento...</p>
          </div>
        )}
        {status === 'error' && (
          <div
            role="alert"
            className="mx-auto max-w-md rounded-lg border border-rose-300 bg-rose-50 p-4 text-rose-700"
            data-testid="pdf-error"
          >
            <p className="font-semibold">No se pudo cargar el documento</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        {status === 'idle' && !url && (
          <div className="flex h-full items-center justify-center text-slate-400">Sin documento</div>
        )}
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            className={cn('shadow', status !== 'ready' && 'hidden')}
            data-testid="pdf-canvas"
          />
        </div>
      </div>
    </div>
  );
}

const iconBtn =
  'inline-flex h-11 w-11 items-center justify-center rounded-md text-slate-700 transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-400 ' +
  'hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40';
