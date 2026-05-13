import { cn } from '@wdock/shared/utils';

import type { SmsDispatchStatus } from '@/features/sms-dispatches/hooks';

const STATUS_LABEL: Record<SmsDispatchStatus, string> = {
  PENDING: 'Pendiente',
  SENT: 'Enviado',
  DELIVERED: 'Entregado',
  FAILED: 'Fallido',
  SIGNED: 'Firmado',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
};

const STATUS_CLASS: Record<SmsDispatchStatus, string> = {
  PENDING: 'bg-slate-100 text-slate-700 border-slate-200',
  SENT: 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse',
  DELIVERED: 'bg-sky-50 text-sky-700 border-sky-200',
  FAILED: 'bg-red-50 text-red-700 border-red-200',
  SIGNED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  EXPIRED: 'bg-amber-50 text-amber-700 border-amber-200',
  CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200',
};

export interface SmsStatusBadgeProps {
  status: SmsDispatchStatus;
  className?: string;
}

export function SmsStatusBadge({ status, className }: SmsStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        STATUS_CLASS[status],
        className,
      )}
      data-testid="sms-status-badge"
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export const SMS_STATUS_LABELS = STATUS_LABEL;
