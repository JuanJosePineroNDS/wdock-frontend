import type { PropsWithChildren } from 'react';

/**
 * Minimal page shell: a single centered card with the WDock brand at the top.
 * Mobile-first; widens gracefully on desktop.
 */
export function PageShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto flex max-w-md flex-col">
        <header className="mb-4 flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-900">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-sm font-bold text-white">
              W
            </div>
            <span className="text-base font-semibold">WDock</span>
          </div>
        </header>
        <main className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">{children}</main>
        <footer className="mt-4 text-center text-xs text-slate-500">
          Firma digital de albaranes
        </footer>
      </div>
    </div>
  );
}
