import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatIsoDateTime } from '@wdock/shared/utils';

import {
  isSmsTerminalStatus,
  useSmsDispatch,
  useSmsDispatches,
  type SmsDispatch,
} from '@/features/sms-dispatches/hooks';
import { SmsStatusBadge } from './SmsStatusBadge';

export interface ShipmentDispatchHistoryProps {
  shipmentId: string;
}

export function ShipmentDispatchHistory({ shipmentId }: ShipmentDispatchHistoryProps) {
  const { data, isLoading } = useSmsDispatches({
    shipment: shipmentId,
    ordering: '-initiated_at',
  });

  if (isLoading) {
    return <p className="text-sm text-slate-500">Cargando historial…</p>;
  }
  if (!data || data.results.length === 0) {
    return <p className="text-sm text-slate-500">Sin envíos SMS asociados todavía.</p>;
  }

  const active = data.results.find((d) => !isSmsTerminalStatus(d.status));

  return (
    <div className="space-y-3">
      {active && <ActivePoller dispatchId={active.id} />}
      <ul className="space-y-2">
        {data.results.map((dispatch) => (
          <DispatchItem key={dispatch.id} dispatch={dispatch} />
        ))}
      </ul>
    </div>
  );
}

function ActivePoller({ dispatchId }: { dispatchId: string }) {
  // useSmsDispatch with polling will refetch the list query through its onSuccess
  // is not enough — we rely on the same query key 'sms-dispatches' to refresh.
  // Instead, we manually invalidate via the polled detail.
  useSmsDispatch(dispatchId, { pollingIntervalMs: 5000 });
  return (
    <p className="text-xs text-blue-700">
      Hay un envío en curso. El estado se actualiza automáticamente cada 5 segundos.
    </p>
  );
}

function DispatchItem({ dispatch }: { dispatch: SmsDispatch }) {
  const [expanded, setExpanded] = useState(false);
  const callbacks = Array.isArray(dispatch.delivery_callbacks)
    ? (dispatch.delivery_callbacks as unknown[])
    : [];

  return (
    <li className="rounded-md border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={expanded}
        data-testid="dispatch-item"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-500" aria-hidden />
          )}
          <div>
            <p className="text-sm font-medium text-slate-900">{dispatch.phone_snapshot}</p>
            <p className="text-xs text-slate-500">
              Iniciado {formatIsoDateTime(dispatch.initiated_at)}
              {dispatch.sent_at ? ` · Enviado ${formatIsoDateTime(dispatch.sent_at)}` : ''}
            </p>
          </div>
        </div>
        <SmsStatusBadge status={dispatch.status} />
      </button>
      {expanded && (
        <div className="space-y-2 border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs">
          <KeyValue label="Token" value={dispatch.token} />
          <KeyValue label="Expira" value={formatIsoDateTime(dispatch.expires_at)} />
          <KeyValue label="Reintentos" value={String(dispatch.retry_count)} />
          {dispatch.provider_message_id && (
            <KeyValue label="Provider ID" value={dispatch.provider_message_id} />
          )}
          {dispatch.failed_at && (
            <KeyValue label="Falló el" value={formatIsoDateTime(dispatch.failed_at)} />
          )}
          {dispatch.signed_at && (
            <KeyValue label="Firmado el" value={formatIsoDateTime(dispatch.signed_at)} />
          )}
          {dispatch.failure_reason && (
            <div>
              <p className="font-medium uppercase tracking-wide text-slate-500">Motivo del fallo</p>
              <p className="text-slate-700">{dispatch.failure_reason}</p>
            </div>
          )}
          {callbacks.length > 0 && (
            <details className="rounded border border-slate-200 bg-white p-2">
              <summary className="cursor-pointer text-slate-700">
                Callbacks ({callbacks.length})
              </summary>
              <pre className="mt-2 max-h-48 overflow-auto text-[10px] leading-tight text-slate-700">
                {JSON.stringify(callbacks, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </li>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-32 uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-slate-900 break-all">{value}</span>
    </div>
  );
}
