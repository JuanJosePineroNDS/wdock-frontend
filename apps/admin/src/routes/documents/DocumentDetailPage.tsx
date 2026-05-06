import { ArrowLeft, FileDown, PenLine } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  DOCUMENT_TIPO_LABELS,
  formatIsoDateTime,
  getDocumentStateMeta,
} from '@wdock/shared';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDocument } from '@/hooks/useDocuments';
import { CreateSignatureSessionModal } from './CreateSignatureSessionModal';

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useDocument(id);
  const [createOpen, setCreateOpen] = useState(false);

  if (query.isLoading) {
    return (
      <div className="space-y-4" data-testid="document-loading">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (query.isError || !query.data) {
    return (
      <Alert variant="destructive" data-testid="document-error">
        <AlertTitle>No se pudo cargar el documento</AlertTitle>
        <AlertDescription>
          {query.error instanceof Error ? query.error.message : 'Error desconocido'}
        </AlertDescription>
      </Alert>
    );
  }

  const doc = query.data;
  const meta = getDocumentStateMeta(doc.estado);
  const pdfUrl = pdfRedirectUrl(doc.id);
  const canCreateSignature =
    doc.estado === 'PROCESADO' || doc.estado === 'PENDIENTE_FIRMA';

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Link to="/documents" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800">
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden /> Volver al listado
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{doc.numero_origen}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span>{DOCUMENT_TIPO_LABELS[doc.tipo] ?? doc.tipo}</span>
            <span>·</span>
            <Badge className={meta.badgeClass} data-testid="document-state-badge">
              {meta.label}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-input bg-white px-4 text-sm font-medium hover:bg-slate-50"
            data-testid="download-pdf"
          >
            <FileDown className="h-4 w-4" aria-hidden />
            Descargar PDF
          </a>
          {canCreateSignature && (
            <Button onClick={() => setCreateOpen(true)} data-testid="create-signature-button">
              <PenLine className="h-4 w-4" aria-hidden />
              Crear sesion de firma
            </Button>
          )}
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Datos</CardTitle>
            <CardDescription>Identificadores y metadatos del documento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Field label="ID interno" value={doc.id} mono />
            <Field label="Hash SHA-256" value={doc.hash_sha256} mono break />
            <Field label="MIME" value={doc.mime_type} />
            <Field label="Tamano" value={`${formatBytes(doc.size_bytes)}`} />
            <Field label="Recibido" value={formatIsoDateTime(doc.creado_en)} />
            <Field label="Actualizado" value={formatIsoDateTime(doc.actualizado_en)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Vehiculos</CardTitle>
            <CardDescription>
              {doc.vehiculos.length === 0
                ? 'El documento no incluye vehiculos.'
                : `${doc.vehiculos.length} vehiculo(s) en el albaran.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {doc.vehiculos.length > 0 ? (
              <ul className="divide-y divide-slate-200 text-sm" data-testid="vehicles-list">
                {doc.vehiculos.map((v) => (
                  <li key={v.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-wider">{v.bastidor}</p>
                      <p className="text-xs text-slate-500">
                        {[v.marca, v.modelo].filter(Boolean).join(' ') || '—'}
                      </p>
                    </div>
                    <span className="font-medium">{v.matricula || '—'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vista previa</CardTitle>
          <CardDescription>El visor abre el PDF servido por la API en una pestana nueva.</CardDescription>
        </CardHeader>
        <CardContent>
          <iframe
            src={pdfUrl}
            title={`PDF ${doc.numero_origen}`}
            className="h-[600px] w-full rounded border border-slate-200"
            data-testid="document-iframe"
          />
        </CardContent>
      </Card>

      {createOpen && (
        <CreateSignatureSessionModal
          documentId={doc.id}
          documentName={doc.numero_origen}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </div>
  );
}

function pdfRedirectUrl(id: string): string {
  // Backend returns 302 -> presigned MinIO URL.
  const base = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
  return `${base}/api/v1/documents/${encodeURIComponent(id)}/pdf`;
}

function Field({
  label,
  value,
  mono,
  break: breakWord,
}: {
  label: string;
  value: string;
  mono?: boolean;
  break?: boolean;
}) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-2">
      <span className="text-slate-500">{label}</span>
      <span
        className={mono ? 'font-mono' : undefined}
        style={breakWord ? { wordBreak: 'break-all' } : undefined}
      >
        {value || '—'}
      </span>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

