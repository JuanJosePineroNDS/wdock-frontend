import { Clock } from 'lucide-react';

import { PageShell } from '@/components/PageShell';

export function ExpiredState() {
  return (
    <PageShell>
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <Clock className="h-8 w-8 text-amber-600" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-semibold text-slate-900">Enlace caducado</h1>
        <p className="text-sm text-slate-600">
          Este enlace ya no es válido. Contacta con quien te lo envió para que te reenvíe uno nuevo.
        </p>
      </div>
    </PageShell>
  );
}
