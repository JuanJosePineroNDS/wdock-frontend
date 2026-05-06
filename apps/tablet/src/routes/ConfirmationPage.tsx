import { CheckCircle2 } from 'lucide-react';

export function ConfirmationPage() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-100 p-8">
      <div className="max-w-2xl rounded-2xl border border-emerald-300 bg-white p-12 text-center shadow-lg">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" aria-hidden />
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">Firma registrada</h1>
        <p className="mt-3 text-lg text-slate-600">Gracias. Ya puedes devolver el dispositivo.</p>
      </div>
    </div>
  );
}
