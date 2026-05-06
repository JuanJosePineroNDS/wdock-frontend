import { useParams } from 'react-router-dom';

import { OnlineIndicator } from '@/components/OnlineIndicator';
import { PdfViewer } from '@/components/PdfViewer';
import { SignaturePad } from '@/components/SignaturePad';
import { Button } from '@/components/ui/Button';
import { useSignatureSession, type UseSignatureSessionOptions } from '@/hooks/useSignatureSession';
import { ExpiredPage } from './ExpiredPage';
import { NotFoundPage } from './NotFoundPage';

interface SignaturePageProps {
  /** Permite inyectar un fetch / baseUrl en tests sin tocar window.fetch global. */
  sessionOptions?: UseSignatureSessionOptions;
}

export function SignaturePage({ sessionOptions }: SignaturePageProps = {}) {
  const { token } = useParams<{ token: string }>();
  const session = useSignatureSession(token, sessionOptions);

  if (session.state === 'loading') {
    return (
      <div className="flex h-screen w-screen items-center justify-center text-lg text-slate-600">
        Cargando documento...
      </div>
    );
  }

  if (session.state === 'expired') return <ExpiredPage />;
  if (session.state === 'not-found') return <NotFoundPage />;
  if (session.state === 'error') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-100 p-8">
        <div className="max-w-xl rounded-2xl border border-rose-300 bg-white p-10 text-center shadow-lg">
          <h1 className="text-2xl font-semibold text-rose-700">No se ha podido cargar la sesion</h1>
          <p className="mt-3 text-slate-600">{session.message}</p>
        </div>
      </div>
    );
  }

  const { document, carrier } = session.data;

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-100 p-4">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900" data-testid="document-title">
            {document.title}
          </h1>
          {carrier && (
            <p className="text-sm text-slate-600">
              {carrier.name}
              {carrier.plate ? ` - ${carrier.plate}` : ''}
            </p>
          )}
        </div>
        <OnlineIndicator />
      </header>
      <div className="grid flex-1 grid-cols-2 gap-4">
        <PdfViewer url={document.pdf_url} />
        <SignaturePad disabled />
      </div>
      <footer className="mt-4 flex items-center justify-end gap-4">
        <Button variant="secondary" data-testid="cancel-button">
          Cancelar
        </Button>
        <Button data-testid="sign-button" disabled aria-disabled>
          Firmar
        </Button>
      </footer>
    </div>
  );
}
