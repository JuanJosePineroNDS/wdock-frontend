export const ACTION_LABELS: Record<string, string> = {
  'carrier.created': 'Transportista creado',
  'carrier.updated': 'Transportista actualizado',
  'carrier.reactivated': 'Transportista reactivado',
  'carrier.deactivated': 'Transportista desactivado',
  'carrier.activated': 'Transportista activado',
  'carrier.upserted': 'Transportista upsert (reactivación)',
  'shipment.created': 'Salida creada',
  'shipment.edited': 'Salida editada',
  'shipment.cancelled': 'Salida cancelada',
  'shipment.dispatch_requested': 'Inicio de envío solicitado',
  'shipment.resend_requested': 'Reenvío solicitado',
  'sms_dispatch.created': 'Envío SMS creado',
  'sms_dispatch.sent': 'SMS enviado',
  'sms_dispatch.delivered': 'SMS entregado',
  'sms_dispatch.failed': 'SMS fallido',
  'sms_dispatch.failed_via_webhook': 'SMS fallido (webhook)',
  'sms_dispatch.cancelled': 'SMS cancelado',
  'sms_dispatch.expired': 'SMS expirado',
  'sms_dispatch.signed': 'SMS firmado',
  'excel_import.started': 'Importación Excel iniciada',
  'excel_import.completed': 'Importación Excel completada',
  'excel_import.failed': 'Importación Excel fallida',
  'document.cancelled': 'Documento eliminado',
};

export const RESOURCE_LABELS: Record<string, string> = {
  Carrier: 'Transportista',
  Shipment: 'Salida',
  SmsDispatch: 'Envío SMS',
  ExcelImport: 'Importación Excel',
  Document: 'Documento',
  carrier: 'Transportista',
  shipment: 'Salida',
  sms_dispatch: 'Envío SMS',
  excel_import: 'Importación Excel',
  document: 'Documento',
};

export function humanAction(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export function humanResource(resource: string): string {
  return RESOURCE_LABELS[resource] ?? resource;
}
