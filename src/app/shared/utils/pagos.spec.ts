import { estadoVisible, finDeMesISO, totalPendiente } from './pagos';

describe('utils de pagos', () => {
  it('un pendiente con fecha pasada es VENCIDO', () => {
    expect(estadoVisible({ estado: 'PENDIENTE', fecha: '2026-09-05' }, '2026-10-10')).toBe('VENCIDO');
  });

  it('un pendiente que vence hoy o después sigue PENDIENTE', () => {
    expect(estadoVisible({ estado: 'PENDIENTE', fecha: '2026-10-10' }, '2026-10-10')).toBe('PENDIENTE');
    expect(estadoVisible({ estado: 'PENDIENTE', fecha: '2026-10-31' }, '2026-10-10')).toBe('PENDIENTE');
  });

  it('un pagado nunca es vencido', () => {
    expect(estadoVisible({ estado: 'PAGADO', fecha: '2020-01-01' }, '2026-10-10')).toBe('PAGADO');
  });

  it('totalPendiente suma solo los PENDIENTE', () => {
    const pagos = [
      { estado: 'PENDIENTE', monto: 80 },
      { estado: 'PAGADO', monto: 80 },
      { estado: 'PENDIENTE', monto: 50.5 },
    ] as const;
    expect(totalPendiente([...pagos])).toBe(130.5);
  });

  it('finDeMesISO devuelve el último día del mes', () => {
    expect(finDeMesISO(new Date(2026, 1, 10))).toBe('2026-02-28');
    expect(finDeMesISO(new Date(2026, 9, 5))).toBe('2026-10-31');
  });
});
