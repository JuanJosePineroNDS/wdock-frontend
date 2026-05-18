import { LinkIcon } from 'lucide-react';

import { PageShell } from '@/components/PageShell';

export function InvalidTokenState() {
  return (
    <PageShell>
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <LinkIcon className="h-7 w-7 text-slate-500" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-semibold text-slate-900">Enlace no válido</h1>
        <p className="text-sm text-slate-600">
          Comprueba que has abierto el enlace completo del SMS. Si el problema persiste, contacta
          con quien te lo envió.
        </p>
      </div>
    </PageShell>
  );
}
