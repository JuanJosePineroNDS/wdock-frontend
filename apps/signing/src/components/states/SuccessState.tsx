import { CheckCircle2 } from 'lucide-react';

import { PageShell } from '@/components/PageShell';

interface SuccessStateProps {
  shipmentExternalId?: string;
}

export function SuccessState({ shipmentExternalId }: SuccessStateProps) {
  return (
    <PageShell>
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-12 w-12 text-emerald-600" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold text-slate-900">¡Firma enviada correctamente!</h1>
        {shipmentExternalId ? (
          <p className="text-sm text-slate-600">
            El albarán <span className="font-medium text-slate-900">{shipmentExternalId}</span> ha
            quedado registrado.
          </p>
        ) : (
          <p className="text-sm text-slate-600">El albarán ha quedado registrado.</p>
        )}
        <p className="text-sm text-slate-600">
          Se enviará una copia firmada al destinatario por email. Ya puedes cerrar esta ventana.
        </p>
      </div>
    </PageShell>
  );
}
