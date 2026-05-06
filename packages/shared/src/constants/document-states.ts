/**
 * Mirrors the backend DocumentEstado enum 1:1. The real source of truth is
 * components.schemas.DocumentEstado in @wdock/api-client; this file only
 * adds presentation metadata (label + badge classes) so apps don't reinvent
 * it everywhere.
 */
export type DocumentState =
  | 'RECIBIDO'
  | 'PROCESANDO'
  | 'PROCESADO'
  | 'PENDIENTE_REVISION'
  | 'PENDIENTE_FIRMA'
  | 'FIRMADO'
  | 'ARCHIVADO'
  | 'ERROR'
  | 'ANULADO';

export interface DocumentStateMeta {
  label: string;
  badgeClass: string;
}

export const DOCUMENT_STATES: Record<DocumentState, DocumentStateMeta> = {
  RECIBIDO: {
    label: 'Recibido',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  PROCESANDO: {
    label: 'Procesando',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
  },
  PROCESADO: {
    label: 'Procesado',
    badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  },
  PENDIENTE_REVISION: {
    label: 'Pendiente de revision',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  PENDIENTE_FIRMA: {
    label: 'Pendiente de firma',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  FIRMADO: {
    label: 'Firmado',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  ARCHIVADO: {
    label: 'Archivado',
    badgeClass: 'bg-stone-100 text-stone-700 border-stone-200',
  },
  ERROR: {
    label: 'Error',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  ANULADO: {
    label: 'Anulado',
    badgeClass: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  },
};

export function getDocumentStateMeta(state: DocumentState): DocumentStateMeta {
  return (
    DOCUMENT_STATES[state] ?? {
      label: state,
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    }
  );
}

export type DocumentTipo = 'ALBARAN_RECEPCION' | 'ALBARAN_ENTREGA' | 'OTRO';
export const DOCUMENT_TIPO_LABELS: Record<DocumentTipo, string> = {
  ALBARAN_RECEPCION: 'Albaran de recepcion',
  ALBARAN_ENTREGA: 'Albaran de entrega',
  OTRO: 'Otro',
};
