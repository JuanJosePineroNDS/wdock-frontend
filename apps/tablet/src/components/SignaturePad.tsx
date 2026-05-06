interface SignaturePadProps {
  disabled?: boolean;
}

/**
 * Placeholder del canvas de firma. La integracion real con signature_pad y
 * captura biometrica via Pointer Events llega en la Semana 2 (Checklist 2.1).
 */
export function SignaturePad({ disabled }: SignaturePadProps) {
  return (
    <div
      data-testid="signature-pad-placeholder"
      data-disabled={disabled ? 'true' : 'false'}
      className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-slate-400 bg-white text-slate-500"
    >
      <div className="text-center">
        <p className="text-lg font-medium text-slate-700">Area de firma</p>
        <p className="mt-2 text-sm">
          La captura biometrica (signature_pad + Pointer Events) se habilita en la Semana 2.
        </p>
      </div>
    </div>
  );
}
