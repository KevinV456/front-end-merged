import { aCsv } from './csv';

describe('aCsv', () => {
  const columnas = [
    { titulo: 'Alumno', valor: (f: any) => f.alumno },
    { titulo: 'Monto', valor: (f: any) => f.monto },
  ];

  it('genera encabezado y una línea por fila', () => {
    const csv = aCsv(columnas, [{ alumno: 'Quispe, Mateo', monto: 80 }]);
    expect(csv).toBe('Alumno,Monto\r\n"Quispe, Mateo",80');
  });

  it('escapa comillas y deja vacíos los nulos', () => {
    const csv = aCsv(columnas, [{ alumno: 'Club "Los Halcones"', monto: null }]);
    expect(csv).toBe('Alumno,Monto\r\n"Club ""Los Halcones""",');
  });

  it('con cero filas devuelve solo el encabezado', () => {
    expect(aCsv(columnas, [])).toBe('Alumno,Monto');
  });
});
