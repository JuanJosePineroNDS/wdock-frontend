import { useState } from 'react';
import { Ban, Pencil, RotateCcw, Send } from 'lucide-react';
import { toast } from 'sonner';
import { ApiError } from '@wdock/api-client';

import { Button } from '@/components/ui/button';
import { CancelConfirmDialog } from '@/features/shipments/CancelConfirmDialog';
import { DispatchDialog } from '@/features/shipments/DispatchDialog';
import { ShipmentEditDialog } from '@/features/shipments/ShipmentEditDialog';
import { useResendShipment, type Shipment } from '@/features/shipments/hooks';

export interface ShipmentActionsProps {
  shipment: Shipment;
  /** When true, renders compact icon-only buttons (for table rows). */
  compact?: boolean;
}

export function ShipmentActions({ shipment, compact = false }: ShipmentActionsProps) {
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const resend = useResendShipment(shipment.id);

  const canDispatch = shipment.status === 'PROGRAMMED';
  const canResend = shipment.status === 'IN_PROCESS' || shipment.status === 'PROGRAMMED';
  const canEdit = shipment.status === 'PROGRAMMED' || shipment.status === 'IN_PROCESS';
  const canCancel = shipment.status === 'PROGRAMMED' || shipment.status === 'IN_PROCESS';

  const onResend = () => {
    resend.mutate(undefined, {
      onSuccess: () => toast.success('Reenviando SMS al transportista'),
      onError: (err) => {
        if (err instanceof ApiError && err.status === 429) {
          toast.error('Espera unos segundos antes de reintentar (cooldown).');
        } else if (err instanceof ApiError && err.status === 409) {
          toast.error('Ya existe un envío activo hoy para esta salida.');
        } else if (err instanceof ApiError && err.status === 404) {
          toast.error('No hay envío previo para esta salida.');
        } else {
          toast.error(err.message || 'No se pudo reenviar.');
        }
      },
    });
  };

  const button = (
    label: string,
    icon: React.ReactNode,
    onClick: () => void,
    options: {
      disabled?: boolean;
      variant?: 'default' | 'outline' | 'ghost' | 'destructive';
      testid?: string;
    } = {},
  ) => {
    const { disabled, variant, testid } = options;
    if (compact) {
      return (
        <Button
          size="sm"
          variant={variant ?? 'ghost'}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          aria-label={label}
          disabled={disabled}
          data-testid={testid}
        >
          {icon}
        </Button>
      );
    }
    return (
      <Button
        variant={variant ?? 'outline'}
        onClick={onClick}
        disabled={disabled}
        data-testid={testid}
      >
        {icon}
        {label}
      </Button>
    );
  };

  return (
    <div className={compact ? 'flex justify-end gap-1' : 'flex flex-wrap gap-2'}>
      {canDispatch &&
        button(
          'Iniciar envío',
          <Send className="h-4 w-4" aria-hidden />,
          () => setDispatchOpen(true),
          {
            variant: 'default',
            testid: 'shipment-action-dispatch',
          },
        )}
      {canResend &&
        button('Reenviar', <RotateCcw className="h-4 w-4" aria-hidden />, onResend, {
          disabled: resend.isPending,
          testid: 'shipment-action-resend',
        })}
      {canEdit &&
        button('Editar', <Pencil className="h-4 w-4" aria-hidden />, () => setEditOpen(true), {
          testid: 'shipment-action-edit',
        })}
      {canCancel &&
        button('Cancelar', <Ban className="h-4 w-4" aria-hidden />, () => setCancelOpen(true), {
          variant: 'destructive',
          testid: 'shipment-action-cancel',
        })}

      {dispatchOpen && (
        <DispatchDialog open={dispatchOpen} onOpenChange={setDispatchOpen} shipment={shipment} />
      )}
      {editOpen && (
        <ShipmentEditDialog open={editOpen} onOpenChange={setEditOpen} shipment={shipment} />
      )}
      {cancelOpen && (
        <CancelConfirmDialog open={cancelOpen} onOpenChange={setCancelOpen} shipment={shipment} />
      )}
    </div>
  );
}
