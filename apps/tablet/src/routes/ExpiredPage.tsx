import { AlertTriangle } from 'lucide-react';

export function ExpiredPage() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-100 p-8">
      <div className="max-w-2xl rounded-2xl border border-amber-300 bg-white p-12 text-center shadow-lg">
        <AlertTriangle className="mx-auto h-16 w-16 text-amber-500" aria-hidden />
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">
          Sesion de firma caducada
        </h1>
        <p className="mt-3 text-lg text-slate-600">
          El enlace que has utilizado ya no es valido. Pide a quien te facilito el documento que vuelva a generar la
          sesion de firma.
        </p>
      </div>
    </div>
  );
}
