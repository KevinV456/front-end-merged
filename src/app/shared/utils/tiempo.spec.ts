import { aHora, lunesDe, parseRango, diaEntrenamiento, aISO } from './tiempo';

describe('tiempo', () => {
  it('parseRango acepta HH:mm-HH:mm y HH:mm - HH:mm', () => {
    expect(parseRango('16:00-17:30')).toEqual([960, 1050]);
    expect(parseRango('15:00 - 20:00')).toEqual([900, 1200]);
  });

  it('parseRango rechaza formatos inválidos o rangos invertidos', () => {
    expect(parseRango('17:30-16:00')).toBeNull();
    expect(parseRango('tarde')).toBeNull();
    expect(parseRango(null)).toBeNull();
  });

  it('aHora devuelve HH:mm con ceros', () => {
    expect(aHora(545)).toBe('09:05');
  });

  it('lunesDe devuelve el lunes de la semana (el domingo pertenece a la semana que termina)', () => {
    expect(aISO(lunesDe(new Date(2026, 10, 24)))).toBe('2026-11-23'); // martes
    expect(aISO(lunesDe(new Date(2026, 10, 29)))).toBe('2026-11-23'); // domingo
    expect(aISO(lunesDe(new Date(2026, 10, 23)))).toBe('2026-11-23'); // lunes
  });

  it('diaEntrenamiento solo existe lunes, miércoles y viernes', () => {
    expect(diaEntrenamiento(new Date(2026, 10, 23))).toBe('LUNES');
    expect(diaEntrenamiento(new Date(2026, 10, 24))).toBeNull();
    expect(diaEntrenamiento(new Date(2026, 10, 27))).toBe('VIERNES');
  });
});
