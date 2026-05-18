import { CheckCircle2 } from 'lucide-react';

import { PageShell } from '@/components/PageShell';

export function AlreadySignedState() {
  return (
    <PageShell>
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-semibold text-slate-900">Albarán ya firmado</h1>
        <p className="text-sm text-slate-600">
          Este albarán ya ha sido firmado. No es necesario hacer nada más.
        </p>
      </div>
    </PageShell>
  );
}
