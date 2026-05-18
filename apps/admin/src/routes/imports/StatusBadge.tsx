import { cn } from '@wdock/shared/utils';

import type { ExcelImportStatus } from '@/features/imports/hooks';

const STATUS_LABEL: Record<ExcelImportStatus, string> = {
  PENDING: 'Pendiente',
  PROCESSING: 'Procesando',
  COMPLETED: 'Completado',
  FAILED: 'Fallido',
};

const STATUS_CLASS: Record<ExcelImportStatus, string> = {
  PENDING: 'bg-slate-100 text-slate-700 border-slate-200',
  PROCESSING: 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  FAILED: 'bg-red-50 text-red-700 border-red-200',
};

export interface ImportStatusBadgeProps {
  status: ExcelImportStatus;
  className?: string;
}

export function ImportStatusBadge({ status, className }: ImportStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        STATUS_CLASS[status],
        className,
      )}
      data-testid="import-status-badge"
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
