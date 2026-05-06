import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';
import {
  DOCUMENT_TIPO_LABELS,
  formatIsoDateTime,
  getDocumentStateMeta,
} from '@wdock/shared';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDocumentsList } from '@/hooks/useDocuments';

const PAGE_SIZE = 25;

export function DocumentsListPage() {
  const [page, setPage] = useState(1);
  const query = useDocumentsList({ page, pageSize: PAGE_SIZE });

  return (
    <div className="space-y-4">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Documentos</h1>
          <p className="text-sm text-muted-foreground">
            Albaranes recibidos desde los sistemas ERP conectados.
          </p>
        </div>
        {query.data && (
          <p className="text-sm text-slate-500" data-testid="documents-total">
            {query.data.count} en total
          </p>
        )}
      </header>

      {query.isError && (
        <Alert variant="destructive" data-testid="documents-error">
          <AlertTitle>No se han podido cargar los documentos</AlertTitle>
          <AlertDescription>
            {query.error instanceof Error ? query.error.message : 'Error desconocido'}
          </AlertDescription>
        </Alert>
      )}

      {query.isLoading && (
        <div className="space-y-2" data-testid="documents-loading">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {query.data && query.data.results.length === 0 && (
        <div
          className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center"
          data-testid="documents-empty"
        >
          <FileText className="mx-auto h-12 w-12 text-slate-300" aria-hidden />
          <h2 className="mt-4 text-lg font-medium text-slate-700">Aun no hay documentos</h2>
          <p className="mt-1 text-sm text-slate-500">
            Tu ERP debe enviarlos por API para que aparezcan aqui.
          </p>
        </div>
      )}

      {query.data && query.data.results.length > 0 && (
        <Table data-testid="documents-table">
          <TableHeader>
            <TableRow>
              <TableHead>Numero origen</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Recibido</TableHead>
              <TableHead>Vehiculos</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.data.results.map((doc) => {
              const meta = getDocumentStateMeta(doc.estado);
              return (
                <TableRow key={doc.id} data-testid={`row-${doc.id}`}>
                  <TableCell className="font-medium">
                    <Link to={`/documents/${doc.id}`} className="text-blue-700 hover:underline">
                      {doc.numero_origen}
                    </Link>
                  </TableCell>
                  <TableCell>{DOCUMENT_TIPO_LABELS[doc.tipo] ?? doc.tipo}</TableCell>
                  <TableCell>
                    <Badge className={meta.badgeClass}>{meta.label}</Badge>
                  </TableCell>
                  <TableCell>{formatIsoDateTime(doc.creado_en)}</TableCell>
                  <TableCell>{doc.vehiculos.length}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      to={`/documents/${doc.id}`}
                      className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-blue-700 hover:bg-blue-50"
                    >
                      Ver
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {query.data && (
        <Pager
          page={page}
          pageSize={PAGE_SIZE}
          total={query.data.count}
          hasPrev={query.data.previous !== null}
          hasNext={query.data.next !== null}
          onPageChange={setPage}
          isFetching={query.isFetching}
        />
      )}
    </div>
  );
}

interface PagerProps {
  page: number;
  pageSize: number;
  total: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPageChange: (page: number) => void;
  isFetching: boolean;
}

function Pager({ page, pageSize, total, hasPrev, hasNext, onPageChange, isFetching }: PagerProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  return (
    <nav
      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2"
      aria-label="Paginacion de documentos"
      data-testid="documents-pager"
    >
      <p className="text-sm text-slate-600">
        Mostrando {start}–{end} de {total}
      </p>
      <div className="flex items-center gap-2">
        {isFetching && <Loader2 className="h-4 w-4 animate-spin text-slate-400" aria-hidden />}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev}
          aria-label="Pagina anterior"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden /> Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
          aria-label="Pagina siguiente"
        >
          Siguiente <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
