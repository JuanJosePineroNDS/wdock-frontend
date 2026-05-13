import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ApiError } from '@wdock/api-client';
import { Send } from 'lucide-react';

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
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useCarriers, type Carrier } from '@/features/carriers/hooks';
import { useDispatchShipment, type Shipment } from '@/features/shipments/hooks';

export interface DispatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: Shipment;
}

function buildSmsPreview(shipment: Shipment, carrier: Carrier | undefined): string {
  if (!carrier) {
    return 'Selecciona un transportista para previsualizar el SMS.';
  }
  return (
    `WDock — Salida ${shipment.crm_external_id} para ${carrier.full_name}. ` +
    `Confirma con tu firma: https://wdock.app/sign/<token>`
  );
}

export function DispatchDialog({ open, onOpenChange, shipment }: DispatchDialogProps) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [serverError, setServerError] = useState<string | null>(null);

  const carriersQuery = useCarriers({
    active: true,
    search: search || undefined,
    ordering: 'full_name',
  });

  const dispatch = useDispatchShipment(shipment.id);
  const carriers = useMemo<Carrier[]>(
    () => carriersQuery.data?.results ?? [],
    [carriersQuery.data],
  );
  const selected = useMemo(
    () => carriers.find((c) => c.id === selectedId),
    [carriers, selectedId],
  );

  const onSubmit = () => {
    if (!selectedId) return;
    setServerError(null);
    dispatch.mutate(
      { carrier_id: selectedId },
      {
        onSuccess: () => {
          toast.success('SMS enviado al transportista');
          onOpenChange(false);
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 409) {
            setServerError(
              'Ya se envió un SMS hoy para este transportista. Si necesitas reintentar, usa "Reenviar".',
            );
          } else if (err instanceof ApiError && err.status === 404) {
            setServerError('Transportista no encontrado en el tenant.');
          } else {
            setServerError(err.message || 'No se pudo iniciar el envío.');
          }
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} blocking={dispatch.isPending}>
      <DialogHeader>
        <DialogTitle>Iniciar envío SMS</DialogTitle>
        <DialogDescription>
          Selecciona el transportista que recibirá el SMS de firma para la salida {shipment.crm_external_id}.
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="dispatch-search">
            Buscar transportista
          </label>
          <Input
            id="dispatch-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nombre, DNI o móvil"
          />
        </div>
        <div className="max-h-56 overflow-y-auto rounded-md border border-slate-200">
          {carriersQuery.isLoading ? (
            <div className="p-3 space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : carriers.length > 0 ? (
            <ul role="listbox" className="divide-y divide-slate-100">
              {carriers.map((carrier) => (
                <li key={carrier.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(carrier.id)}
                    className={
                      'flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 ' +
                      (selectedId === carrier.id ? 'bg-primary/10 font-medium text-primary' : '')
                    }
                    data-testid="dispatch-carrier-option"
                  >
                    <span>{carrier.full_name}</span>
                    <span className="text-xs text-slate-500">{carrier.mobile_phone}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-4 text-center text-sm text-slate-500">
              No hay transportistas activos que coincidan.
            </p>
          )}
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          <p className="mb-1 font-medium uppercase tracking-wide text-slate-500">Vista previa del SMS</p>
          <p data-testid="dispatch-preview">{buildSmsPreview(shipment, selected)}</p>
        </div>
        {serverError && (
          <Alert variant="destructive">
            <AlertTitle>No se pudo iniciar el envío</AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={dispatch.isPending}>
          Cancelar
        </Button>
        <Button
          onClick={onSubmit}
          disabled={!selectedId || dispatch.isPending}
          data-testid="dispatch-submit"
        >
          <Send className="h-4 w-4" aria-hidden />
          {dispatch.isPending ? 'Enviando…' : 'Enviar SMS'}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
