export type TipoMovimiento = 'INGRESO' | 'EGRESO';

/** Otros ingresos y egresos de la academia (RF04). */
export interface Movimiento {
  id: number;
  tipo: TipoMovimiento;
  concepto: string;
  monto: number;
  fecha: string;
}

/** Cuerpo de POST /api/movimiento. */
export type MovimientoRequest = Omit<Movimiento, 'id'>;
