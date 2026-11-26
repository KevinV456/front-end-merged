import { EstadoPagoVista, Pago } from '../../core/models/pago';
import { Tono } from '../components/badge-estado/badge-estado';
import { hoyISO } from './validadores';

/** Un pendiente cuya fecha de vencimiento ya pasó se muestra como VENCIDO. */
export function estadoVisible(
  pago: Pick<Pago, 'estado' | 'fecha'>,
  hoy = hoyISO(),
): EstadoPagoVista {
  return pago.estado === 'PENDIENTE' && pago.fecha < hoy ? 'VENCIDO' : pago.estado;
}

export const TONO_PAGO: Record<EstadoPagoVista, Tono> = {
  PENDIENTE: 'lima',
  VENCIDO: 'rojo',
  PAGADO: 'verde',
};

export const TEXTO_PAGO: Record<EstadoPagoVista, string> = {
  PENDIENTE: 'Pendiente',
  VENCIDO: 'Vencido',
  PAGADO: 'Pagado',
};

/** Suma de los montos de los pagos PENDIENTE (incluye los vencidos). */
export function totalPendiente(pagos: Pick<Pago, 'estado' | 'monto'>[]): number {
  return pagos.filter((p) => p.estado === 'PENDIENTE').reduce((suma, p) => suma + p.monto, 0);
}

/** Último día del mes actual en formato YYYY-MM-DD (vencimiento habitual de la mensualidad). */
export function finDeMesISO(base = new Date()): string {
  return new Date(base.getFullYear(), base.getMonth() + 1, 0).toLocaleDateString('en-CA');
}
