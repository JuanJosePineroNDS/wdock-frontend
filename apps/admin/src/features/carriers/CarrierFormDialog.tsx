import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ApiError, ValidationError } from '@wdock/api-client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  normalizeSpanishMobile,
  parsePlatesInput,
  validateSpanishDNI,
  validateSpanishMobile,
} from '@/lib/validators';

import {
  useCreateCarrier,
  useUpdateCarrier,
  type Carrier,
  type CarrierWriteRequest,
  type PatchedCarrierWriteRequest,
} from './hooks';

type Mode = 'create' | 'edit';

export interface CarrierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  carrier?: Carrier;
  onSaved?: (carrier: Carrier | { id?: string }) => void;
}

interface FormState {
  dni: string;
  full_name: string;
  mobile_phone: string;
  platesRaw: string;
  notes: string;
}

const emptyState: FormState = {
  dni: '',
  full_name: '',
  mobile_phone: '',
  platesRaw: '',
  notes: '',
};

function asPlateList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  return [];
}

function initialFromCarrier(carrier: Carrier | undefined): FormState {
  if (!carrier) return emptyState;
  return {
    dni: carrier.dni,
    full_name: carrier.full_name,
    mobile_phone: carrier.mobile_phone,
    platesRaw: asPlateList(carrier.license_plates).join(', '),
    notes: carrier.notes ?? '',
  };
}

function extractServerError(error: unknown, fallback: string): string {
  if (error instanceof ValidationError) {
    const first = Object.entries(error.fieldErrors)[0];
    if (first) return `${first[0]}: ${first[1].join(' · ')}`;
    if (typeof (error.body as { detail?: unknown })?.detail === 'string') {
      return (error.body as { detail: string }).detail;
    }
    return 'Datos inválidos.';
  }
  if (error instanceof ApiError) {
    const body = error.body as { detail?: unknown } | null;
    if (body && typeof body.detail === 'string') return body.detail;
    return error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export function CarrierFormDialog({
  open,
  onOpenChange,
  mode,
  carrier,
  onSaved,
}: CarrierFormDialogProps) {
  const [form, setForm] = useState<FormState>(emptyState);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const create = useCreateCarrier();
  const update = useUpdateCarrier(carrier?.id ?? '');
  const isPending = create.isPending || update.isPending;

  useEffect(() => {
    if (open) {
      setForm(initialFromCarrier(carrier));
      setFieldErrors({});
      setServerError(null);
    }
  }, [open, carrier]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.full_name.trim()) next.full_name = 'Nombre requerido.';

    const dniResult = validateSpanishDNI(form.dni);
    if (!dniResult.valid) next.dni = dniResult.reason;

    const mobileResult = validateSpanishMobile(form.mobile_phone);
    if (!mobileResult.valid) next.mobile_phone = mobileResult.reason;

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildPayload = (): CarrierWriteRequest => ({
    dni: form.dni.trim().toUpperCase(),
    full_name: form.full_name.trim(),
    mobile_phone: normalizeSpanishMobile(form.mobile_phone),
    license_plates: parsePlatesInput(form.platesRaw),
    notes: form.notes.trim(),
  });

  const buildPatchPayload = (): PatchedCarrierWriteRequest => buildPayload();

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setServerError(null);

    if (mode === 'create') {
      create.mutate(buildPayload(), {
        onSuccess: ({ carrier: created, reactivated }) => {
          toast.success(
            reactivated
              ? `Transportista ${created.full_name} reactivado`
              : `Transportista ${created.full_name} creado`,
          );
          onSaved?.({ id: undefined });
          onOpenChange(false);
        },
        onError: (err) => {
          setServerError(extractServerError(err, 'No se pudo crear el transportista.'));
        },
      });
    } else {
      update.mutate(buildPatchPayload(), {
        onSuccess: (updated) => {
          toast.success(`Transportista ${updated.full_name} actualizado`);
          onSaved?.({ id: carrier?.id });
          onOpenChange(false);
        },
        onError: (err) => {
          setServerError(extractServerError(err, 'No se pudo actualizar el transportista.'));
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} blocking={isPending}>
      <DialogHeader>
        <DialogTitle>
          {mode === 'create'
            ? 'Nuevo transportista'
            : `Editar ${carrier?.full_name ?? 'transportista'}`}
        </DialogTitle>
        <DialogDescription>
          {mode === 'create'
            ? 'Si ya existe un transportista con el mismo DNI, se reactivará con los nuevos datos.'
            : 'Actualiza los datos del transportista. El DNI se puede modificar.'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={onSubmit}>
        <DialogBody className="space-y-4">
          <FormField label="DNI / NIE" id="carrier-dni" error={fieldErrors.dni}>
            <Input
              id="carrier-dni"
              value={form.dni}
              onChange={(e) => setField('dni', e.target.value.toUpperCase())}
              placeholder="12345678Z"
              autoFocus={mode === 'create'}
              data-testid="carrier-dni"
            />
          </FormField>
          <FormField label="Nombre completo" id="carrier-name" error={fieldErrors.full_name}>
            <Input
              id="carrier-name"
              value={form.full_name}
              onChange={(e) => setField('full_name', e.target.value)}
              placeholder="Pedro Pérez Gómez"
              data-testid="carrier-name"
            />
          </FormField>
          <FormField label="Móvil" id="carrier-mobile" error={fieldErrors.mobile_phone}>
            <Input
              id="carrier-mobile"
              value={form.mobile_phone}
              onChange={(e) => setField('mobile_phone', e.target.value)}
              placeholder="+34666111222"
              data-testid="carrier-mobile"
            />
          </FormField>
          <FormField
            label="Matrículas (separadas por coma)"
            id="carrier-plates"
            error={fieldErrors.platesRaw}
          >
            <Input
              id="carrier-plates"
              value={form.platesRaw}
              onChange={(e) => setField('platesRaw', e.target.value)}
              placeholder="1234ABC, 4321XYZ"
              data-testid="carrier-plates"
            />
          </FormField>
          <FormField label="Notas" id="carrier-notes">
            <textarea
              id="carrier-notes"
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-testid="carrier-notes"
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
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending} data-testid="carrier-submit">
            {isPending
              ? 'Guardando…'
              : mode === 'create'
                ? 'Crear transportista'
                : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

interface FormFieldProps {
  label: string;
  id: string;
  error?: string;
  children: React.ReactNode;
}

function FormField({ label, id, error, children }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
