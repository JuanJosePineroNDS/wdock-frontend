import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ShipmentStatusBadge } from '@/routes/shipments/StatusBadge';

describe('ShipmentStatusBadge', () => {
  it('renders "Pendiente firma" for the IN_PROCESS state', () => {
    render(<ShipmentStatusBadge status="IN_PROCESS" />);
    expect(screen.getByTestId('shipment-status-badge')).toHaveTextContent('Pendiente firma');
  });

  it('renders "Firmado" for the SIGNED state', () => {
    render(<ShipmentStatusBadge status="SIGNED" />);
    expect(screen.getByTestId('shipment-status-badge')).toHaveTextContent('Firmado');
  });

  it('renders "Programado" for the PROGRAMMED state', () => {
    render(<ShipmentStatusBadge status="PROGRAMMED" />);
    expect(screen.getByTestId('shipment-status-badge')).toHaveTextContent('Programado');
  });
});
