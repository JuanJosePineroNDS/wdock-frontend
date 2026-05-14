import { Loader2 } from 'lucide-react';

import { PageShell } from '@/components/PageShell';

export function LoadingState() {
  return (
    <PageShell>
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-slate-500" aria-hidden="true" />
        <p className="text-slate-700">Cargando albarán…</p>
      </div>
    </PageShell>
  );
}
