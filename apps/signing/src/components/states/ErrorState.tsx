import { AlertTriangle } from 'lucide-react';

import { PageShell } from '@/components/PageShell';

interface ErrorStateProps {
  onRetry?: () => void;
  message?: string;
}

export function ErrorState({ onRetry, message }: ErrorStateProps) {
  return (
    <PageShell>
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-8 w-8 text-red-600" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-semibold text-slate-900">Algo ha ido mal</h1>
        <p className="text-sm text-slate-600">
          {message ?? 'Comprueba tu conexión y vuelve a intentarlo.'}
        </p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 h-11 w-full rounded-lg bg-slate-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          >
            Reintentar
          </button>
        ) : null}
      </div>
    </PageShell>
  );
}
