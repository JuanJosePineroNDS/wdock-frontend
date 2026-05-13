import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ApiError, ValidationError } from '@wdock/api-client';

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
import {
  useEditShipment,
  type Shipment,
  type ShipmentEditRequest,
} from '@/features/shipments/hooks';

export interface ShipmentEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: Shipment;
}

interface FormState {
  expected_carrier_name: string;
  expected_carrier_phone: string;
  expected_license_plate: string;
  cargo_description: string;
  scheduled_date: string;
  notes: string;
}

function initial(shipment: Shipment): FormState {
  return {
    expected_carrier_name: shipment.expected_carrier_name ?? '',
    expected_carrier_phone: shipment.expected_carrier_phone ?? '',
    expected_license_plate: shipment.expected_license_plate ?? '',
    cargo_description: shipment.cargo_description ?? '',
    scheduled_date: shipment.scheduled_date ?? '',
    notes: shipment.notes ?? '',
  };
}

function diff(original: FormState, current: FormState): ShipmentEditRequest {
  const body: ShipmentEditRequest = {};
  (Object.keys(current) as (keyof FormState)[]).forEach((key) => {
    if (current[key] !== original[key]) {
      body[key] = current[key];
    }
  });
  return body;
}

function extractServerError(error: unknown): string {
  if (error instanceof ValidationError) {
    const first = Object.entries(error.fieldErrors)[0];
    if (first) return `${first[0]}: ${first[1].join(' · ')}`;
    return 'Datos inválidos.';
  }
  if (error instanceof ApiError) {
    const body = error.body as { detail?: unknown } | null;
    if (body && typeof body.detail === 'string') return body.detail;
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'No se pudo guardar.';
}

export function ShipmentEditDialog({ open, onOpenChange, shipment }: ShipmentEditDialogProps) {
  const [form, setForm] = useState<FormState>(() => initial(shipment));
  const [original, setOriginal] = useState<FormState>(() => initial(shipment));
  const [serverError, setServerError] = useState<string | null>(null);
  const edit = useEditShipment(shipment.id);

  useEffect(() => {
    if (open) {
      const next = initial(shipment);
      setForm(next);
      setOriginal(next);
      setServerError(null);
    }
  }, [open, shipment]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const body = diff(original, form);
    if (Object.keys(body).length === 0) {
      onOpenChange(false);
      return;
    }
    setServerError(null);
    edit.mutate(body, {
      onSuccess: () => {
        toast.success('Salida actualizada');
        onOpenChange(false);
      },
      onError: (err) => setServerError(extractServerError(err)),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} blocking={edit.isPending}>
      <DialogHeader>
        <DialogTitle>Editar salida {shipment.crm_external_id}</DialogTitle>
        <DialogDescription>
          El identificador externo (CRM) no se puede cambiar. Solo cambian los campos modificados.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={onSubmit}>
        <DialogBody className="space-y-4">
          <FormField label="Transportista esperado" id="edit-carrier-name">
            <Input
              id="edit-carrier-name"
              value={form.expected_carrier_name}
              onChange={(e) => setField('expected_carrier_name', e.target.value)}
              data-testid="edit-carrier-name"
            />
          </FormField>
          <FormField label="Teléfono esperado" id="edit-carrier-phone">
            <Input
              id="edit-carrier-phone"
              value={form.expected_carrier_phone}
              onChange={(e) => setField('expected_carrier_phone', e.target.value)}
              data-testid="edit-carrier-phone"
            />
          </FormField>
          <FormField label="Matrícula esperada" id="edit-plate">
            <Input
              id="edit-plate"
              value={form.expected_license_plate}
              onChange={(e) => setField('expected_license_plate', e.target.value.toUpperCase())}
              data-testid="edit-plate"
            />
          </FormField>
          <FormField label="Mercancía" id="edit-cargo">
            <Input
              id="edit-cargo"
              value={form.cargo_description}
              onChange={(e) => setField('cargo_description', e.target.value)}
              data-testid="edit-cargo"
            />
          </FormField>
          <FormField label="Fecha programada" id="edit-date">
            <Input
              id="edit-date"
              type="date"
              value={form.scheduled_date}
              onChange={(e) => setField('scheduled_date', e.target.value)}
              data-testid="edit-date"
            />
          </FormField>
          <FormField label="Notas" id="edit-notes">
            <textarea
              id="edit-notes"
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-testid="edit-notes"
            />
          </FormField>
          {serverError && (
            <Alert variant="destructive">
              <AlertTitle>No se pudo guardar</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={edit.isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={edit.isPending} data-testid="edit-submit">
            {edit.isPending ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

interface FormFieldProps {
  label: string;
  id: string;
  children: React.ReactNode;
}

function FormField({ label, id, children }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}
