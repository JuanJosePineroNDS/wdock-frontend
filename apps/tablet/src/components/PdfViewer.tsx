interface PdfViewerProps {
  url?: string | null;
}

/**
 * Placeholder del visor PDF. La implementacion real con pdfjs-dist llega en la
 * Semana 2 (Checklist 2.1). Para esta semana solo mostramos un area visual
 * con la indicacion de que el PDF se cargara desde la URL recibida.
 */
export function PdfViewer({ url }: PdfViewerProps) {
  return (
    <div
      data-testid="pdf-viewer-placeholder"
      className="flex h-full w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white text-center text-slate-500"
    >
      <p className="text-lg font-medium text-slate-700">Vista previa del documento</p>
      {url ? (
        <p className="mt-2 max-w-md break-all text-xs text-slate-400">{url}</p>
      ) : (
        <p className="mt-2 text-sm">Sin documento cargado.</p>
      )}
      <p className="mt-4 text-xs text-slate-400">
        El visor PDF interactivo se incorpora en la Semana 2.
      </p>
    </div>
  );
}
