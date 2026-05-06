export function NotFoundPage() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-100 p-8">
      <div className="max-w-2xl rounded-2xl border border-slate-300 bg-white p-12 text-center shadow-lg">
        <h1 className="text-3xl font-semibold text-slate-900">Pagina no encontrada</h1>
        <p className="mt-3 text-lg text-slate-600">
          El enlace que has abierto no existe. Comprueba que has recibido la URL correcta.
        </p>
      </div>
    </div>
  );
}
