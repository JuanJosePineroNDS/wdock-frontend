import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ApiError } from '@wdock/api-client';
import { AlertTriangle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCancelShipment, type Shipment } from '@/features/shipments/hooks';

export interface CancelConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: Shipment;
}

export function CancelConfirmDialog({ open, onOpenChange, shipment }: CancelConfirmDialogProps) {
  const [reason, setReason] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const cancel = useCancelShipment(shipment.id);

  useEffect(() => {
    if (open) {
      setReason('');
      setServerError(null);
    }
  }, [open]);

  const onConfirm = () => {
    setServerError(null);
    cancel.mutate(reason.trim() ? { reason: reason.trim() } : undefined, {
      onSuccess: () => {
        toast.success(`Salida ${shipment.crm_external_id} cancelada`);
        onOpenChange(false);
      },
      onError: (err) => {
        if (err instanceof ApiError && err.status === 409) {
          setServerError(
            'La salida ya no se puede cancelar (probablemente está firmada o ya cancelada).',
          );
        } else {
          setServerError(err.message || 'No se pudo cancelar la salida.');
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} blocking={cancel.isPending}>
      <DialogHeader>
        <DialogTitle>
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden />
            ¿Cancelar la salida {shipment.crm_external_id}?
          </span>
        </DialogTitle>
        <DialogDescription>
          Los SMS pendientes asociados a esta salida también se cancelarán. Esta acción no se puede deshacer.
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="cancel-reason">
            Motivo (opcional)
          </label>
          <textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej.: Cliente reprogramó, error en datos…"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-testid="cancel-reason"
          />
        </div>
        {serverError && (
          <Alert variant="destructive">
            <AlertTitle>No se pudo cancelar</AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={cancel.isPending}>
          Volver
        </Button>
        <Button
          variant="destructive"
          onClick={onConfirm}
          disabled={cancel.isPending}
          data-testid="cancel-submit"
        >
          {cancel.isPending ? 'Cancelando…' : 'Cancelar salida'}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
