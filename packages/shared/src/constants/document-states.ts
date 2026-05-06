export type DocumentState =
  | 'draft'
  | 'pending_review'
  | 'pending_signature'
  | 'signed'
  | 'rejected'
  | 'voided';

export interface DocumentStateMeta {
  label: string;
  badgeClass: string;
}

export const DOCUMENT_STATES: Record<DocumentState, DocumentStateMeta> = {
  draft: {
    label: 'Borrador',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  pending_review: {
    label: 'Pendiente de revision',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  pending_signature: {
    label: 'Pendiente de firma',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  signed: {
    label: 'Firmado',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  rejected: {
    label: 'Rechazado',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  voided: {
    label: 'Anulado',
    badgeClass: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  },
};

export function getDocumentStateMeta(state: DocumentState): DocumentStateMeta {
  return DOCUMENT_STATES[state];
}
