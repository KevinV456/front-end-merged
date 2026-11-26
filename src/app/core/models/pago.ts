export type EstadoPago = 'PENDIENTE' | 'PAGADO';

/** Lo que se muestra: un pendiente con fecha de vencimiento pasada es VENCIDO (igual que vw_estado_pagos). */
export type EstadoPagoVista = EstadoPago | 'VENCIDO';

export interface Pago {
  id: number;
  nino: {
    id: number;
    nombre: string;
    apellido: string;
    dni?: string | null;
    categoria?: { id: number; nombre: string; anioNacimiento: number } | null;
  };
  monto: number;
  /** PENDIENTE: fecha de vencimiento. PAGADO: fecha en que se pagó. */
  fecha: string;
  estado: EstadoPago;
}

/** Cuerpo de POST /api/pago. */
export interface PagoRequest {
  nino: { id: number };
  monto: number;
  fecha: string;
  estado: EstadoPago;
}
