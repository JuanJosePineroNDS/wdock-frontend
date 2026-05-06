import { XCircle } from 'lucide-react';

export function RejectedPage() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-100 p-8">
      <div className="max-w-2xl rounded-2xl border border-amber-300 bg-white p-12 text-center shadow-lg">
        <XCircle className="mx-auto h-16 w-16 text-amber-500" aria-hidden />
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">Rechazo registrado</h1>
        <p className="mt-3 text-lg text-slate-600">
          Hemos comunicado el rechazo al sistema. Ya puedes devolver el dispositivo.
        </p>
      </div>
    </div>
  );
}
