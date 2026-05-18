import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileSpreadsheet, Upload } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ApiError } from '@wdock/api-client';

import { useUploadExcel } from '@/features/imports/hooks';
import { cn } from '@wdock/shared/utils';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.xlsx', '.xlsm'] as const;
const ALLOWED_MIME = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel.sheet.macroenabled.12',
] as const;

function hasAllowedExtension(name: string): boolean {
  const lower = name.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function isAllowedMime(mime: string): boolean {
  // Browsers occasionally send empty MIME for .xlsm — fall back to extension check.
  if (!mime) return true;
  return (ALLOWED_MIME as readonly string[]).includes(mime);
}

function validateFile(file: File): string | null {
  if (!hasAllowedExtension(file.name) || !isAllowedMime(file.type)) {
    return 'Formato no soportado. Sube un archivo .xlsx o .xlsm.';
  }
  if (file.size > MAX_FILE_BYTES) {
    return `El archivo supera el límite de 10 MB (tamaño: ${(file.size / 1024 / 1024).toFixed(1)} MB).`;
  }
  return null;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function extractServerError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 503) {
      return 'El servicio de almacenamiento no está disponible, intenta más tarde.';
    }
    const body = error.body as { detail?: unknown } | null;
    if (body && typeof body === 'object' && typeof body.detail === 'string') {
      return body.detail;
    }
    return error.message || 'No se pudo subir el archivo.';
  }
  if (error instanceof Error) return error.message;
  return 'No se pudo subir el archivo.';
}

export function ImportUploadPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const upload = useUploadExcel();

  const handleSelect = useCallback((candidate: File | undefined) => {
    if (!candidate) return;
    const validation = validateFile(candidate);
    if (validation) {
      setClientError(validation);
      setFile(null);
      return;
    }
    setClientError(null);
    setFile(candidate);
  }, []);

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleSelect(event.target.files?.[0]);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleSelect(event.dataTransfer.files?.[0]);
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onSubmit = async () => {
    if (!file) return;
    upload.mutate(
      { file },
      {
        onSuccess: (data) => {
          navigate(`/imports/${data.id}`);
        },
      },
    );
  };

  const serverError = upload.isError ? extractServerError(upload.error) : null;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-1">
        <Link
          to="/imports"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Volver a imports
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Subir Excel</h1>
        <p className="text-sm text-muted-foreground">
          Sube el Excel de Ixnet con las columnas DNI, Nombre, Móvil, Matrícula, Albarán, Fecha y
          Mercancía.
        </p>
      </div>

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed bg-white p-10 text-center transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-slate-400',
        )}
        data-testid="excel-dropzone"
      >
        <FileSpreadsheet className="h-10 w-10 text-slate-400" aria-hidden />
        <div>
          <p className="text-sm font-medium text-slate-900">
            Arrastra el Excel aquí o haz clic para seleccionarlo
          </p>
          <p className="mt-1 text-xs text-slate-500">.xlsx o .xlsm · máximo 10 MB</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={onInputChange}
          data-testid="excel-input"
        />
      </div>

      {file && (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <div className="font-medium text-slate-900">{file.name}</div>
          <div className="text-xs text-slate-500">{formatSize(file.size)}</div>
        </div>
      )}

      {clientError && (
        <Alert variant="destructive">
          <AlertTitle>Archivo no válido</AlertTitle>
          <AlertDescription>{clientError}</AlertDescription>
        </Alert>
      )}

      {serverError && (
        <Alert variant="destructive">
          <AlertTitle>No se pudo subir el archivo</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-end gap-2">
        <Link to="/imports">
          <Button variant="outline" type="button">
            Cancelar
          </Button>
        </Link>
        <Button onClick={onSubmit} disabled={!file || upload.isPending} data-testid="excel-submit">
          <Upload className="h-4 w-4" aria-hidden />
          {upload.isPending ? 'Subiendo…' : 'Subir y procesar'}
        </Button>
      </div>
    </div>
  );
}
