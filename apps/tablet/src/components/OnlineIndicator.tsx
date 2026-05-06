import { CloudOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '@wdock/shared/hooks';
import { cn } from '@wdock/shared/utils';

export function OnlineIndicator() {
  const online = useOnlineStatus();
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="online-indicator"
      data-online={online}
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium',
        online
          ? 'bg-emerald-100 text-emerald-800'
          : 'bg-amber-100 text-amber-800',
      )}
    >
      {online ? <Wifi className="h-4 w-4" aria-hidden /> : <CloudOff className="h-4 w-4" aria-hidden />}
      {online ? 'En linea' : 'Sin conexion'}
    </div>
  );
}
