import { cn } from '@wdock/shared/utils';

import type { ShipmentStatus } from '@/features/shipments/hooks';

const STATUS_LABEL: Record<ShipmentStatus, string> = {
  PROGRAMMED: 'Programado',
  IN_PROCESS: 'En curso',
  SIGNED: 'Firmado',
  EXPIRED: 'Caducado',
  CANCELLED: 'Cancelado',
};

const STATUS_CLASS: Record<ShipmentStatus, string> = {
  PROGRAMMED: 'bg-slate-100 text-slate-700 border-slate-200',
  IN_PROCESS: 'bg-blue-50 text-blue-700 border-blue-200',
  SIGNED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  EXPIRED: 'bg-amber-50 text-amber-700 border-amber-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

export interface ShipmentStatusBadgeProps {
  status: ShipmentStatus;
  className?: string;
}

export function ShipmentStatusBadge({ status, className }: ShipmentStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        STATUS_CLASS[status],
        className,
      )}
      data-testid="shipment-status-badge"
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export const SHIPMENT_STATUS_LABELS = STATUS_LABEL;
