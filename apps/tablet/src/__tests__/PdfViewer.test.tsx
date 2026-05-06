import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock pdfjs-dist with a controllable factory. ?url import is mocked separately.
const { state, getDocument } = vi.hoisted(() => {
  const state = {
    pageCount: 3,
    numCalls: 0,
    rejectWith: null as Error | null,
  };
  const getDocument = vi.fn((opts: { url: string }) => {
    state.numCalls += 1;
    void opts;
    let cancelled = false;
    const promise = new Promise((resolve, reject) => {
      queueMicrotask(() => {
        if (cancelled) return;
        if (state.rejectWith) {
          reject(state.rejectWith);
          return;
        }
        const fakeRenderTask = {
          promise: Promise.resolve(),
          cancel: vi.fn(),
        };
        const fakePage = {
          getViewport: ({ scale }: { scale: number }) => ({
            width: 100 * scale,
            height: 150 * scale,
          }),
          render: vi.fn(() => fakeRenderTask),
        };
        const fakeDoc = {
          numPages: state.pageCount,
          getPage: vi.fn(() => Promise.resolve(fakePage)),
          destroy: vi.fn(),
        };
        resolve(fakeDoc);
      });
    });
    return {
      promise,
      destroy: vi.fn(() => {
        cancelled = true;
      }),
    };
  });
  return { state, getDocument };
});

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument,
}));
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: 'worker-stub' }));

import { PdfViewer } from '@/components/PdfViewer';

describe('PdfViewer', () => {
  beforeEach(() => {
    state.pageCount = 3;
    state.numCalls = 0;
    state.rejectWith = null;
    getDocument.mockClear();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows the empty state when no URL is given', () => {
    render(<PdfViewer />);
    expect(screen.getByText('Sin documento')).toBeInTheDocument();
    expect(screen.getByTestId('pdf-viewer')).toHaveAttribute('data-status', 'idle');
  });

  it('loads the document and exposes the page navigator', async () => {
    render(<PdfViewer url="https://files/example.pdf" />);
    await waitFor(() =>
      expect(screen.getByTestId('pdf-viewer')).toHaveAttribute('data-status', 'ready'),
    );
    expect(screen.getByTestId('pdf-pager')).toHaveTextContent('Pagina 1 de 3');
    expect(screen.getByLabelText('Pagina anterior')).toBeDisabled();
    expect(screen.getByLabelText('Pagina siguiente')).not.toBeDisabled();
  });

  it('navigates between pages with the arrow controls', async () => {
    const user = userEvent.setup();
    render(<PdfViewer url="https://files/example.pdf" />);
    await waitFor(() =>
      expect(screen.getByTestId('pdf-viewer')).toHaveAttribute('data-status', 'ready'),
    );
    await user.click(screen.getByLabelText('Pagina siguiente'));
    expect(screen.getByTestId('pdf-pager')).toHaveTextContent('Pagina 2 de 3');
    await user.click(screen.getByLabelText('Pagina siguiente'));
    expect(screen.getByTestId('pdf-pager')).toHaveTextContent('Pagina 3 de 3');
    expect(screen.getByLabelText('Pagina siguiente')).toBeDisabled();
  });

  it('zooms in / out around the default 100% step', async () => {
    const user = userEvent.setup();
    render(<PdfViewer url="https://files/example.pdf" />);
    await waitFor(() =>
      expect(screen.getByTestId('pdf-viewer')).toHaveAttribute('data-status', 'ready'),
    );
    expect(screen.getByTestId('pdf-zoom')).toHaveTextContent('100%');
    await user.click(screen.getByLabelText('Ampliar zoom'));
    expect(screen.getByTestId('pdf-zoom')).toHaveTextContent('125%');
    await user.click(screen.getByLabelText('Reducir zoom'));
    await user.click(screen.getByLabelText('Reducir zoom'));
    expect(screen.getByTestId('pdf-zoom')).toHaveTextContent('75%');
  });

  it('shows an error message when getDocument rejects', async () => {
    state.rejectWith = new Error('Network error');
    render(<PdfViewer url="https://broken/example.pdf" />);
    await waitFor(() =>
      expect(screen.getByTestId('pdf-viewer')).toHaveAttribute('data-status', 'error'),
    );
    expect(screen.getByTestId('pdf-error')).toHaveTextContent(/Network error/);
  });

  it('reloads when the URL prop changes', async () => {
    const { rerender } = render(<PdfViewer url="https://files/a.pdf" />);
    await waitFor(() => expect(state.numCalls).toBe(1));
    await act(async () => {
      rerender(<PdfViewer url="https://files/b.pdf" />);
    });
    await waitFor(() => expect(state.numCalls).toBe(2));
  });
});
