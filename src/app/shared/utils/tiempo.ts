import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { DiaEntrenamiento } from '../../core/models/entrenamiento';

/** Fecha local en formato YYYY-MM-DD (sin pasar por UTC, para evitar el desfase de Lima). */
export function aISO(d: Date): string {
  return d.toLocaleDateString('en-CA');
}

/** Convierte "YYYY-MM-DD" en una fecha local, sin el desfase que produce new Date('YYYY-MM-DD'). */
export function desdeISO(iso: string): Date {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

export function sumarDias(d: Date, dias: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + dias);
}

/** Lunes de la semana a la que pertenece la fecha (la semana va de lunes a domingo). */
export function lunesDe(d: Date): Date {
  const dia = d.getDay(); // 0 = domingo
  return sumarDias(d, dia === 0 ? -6 : 1 - dia);
}

/** Día de entrenamiento que corresponde a la fecha; null si ese día no se entrena. */
export function diaEntrenamiento(d: Date): DiaEntrenamiento | null {
  switch (d.getDay()) {
    case 1:
      return 'LUNES';
    case 3:
      return 'MIERCOLES';
    case 5:
      return 'VIERNES';
    default:
      return null;
  }
}

/** "16:30" → 990 (minutos desde la medianoche); null si no es una hora válida. */
export function aMinutos(hora: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hora.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h <= 23 && min <= 59 ? h * 60 + min : null;
}

/** "16:00-17:30" o "15:00 - 20:00" → [960, 1050]; null si no tiene ese formato. */
export function parseRango(texto: string | null | undefined): [number, number] | null {
  const partes = (texto ?? '').split('-');
  if (partes.length !== 2) return null;
  const inicio = aMinutos(partes[0]);
  const fin = aMinutos(partes[1]);
  return inicio !== null && fin !== null && fin > inicio ? [inicio, fin] : null;
}

/** 990 → "16:30" */
export function aHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Validador de grupo: la hora de fin debe ser posterior a la de inicio. */
export function finPosteriorAInicio(inicio: string, fin: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const a = aMinutos(String(grupo.get(inicio)?.value ?? ''));
    const b = aMinutos(String(grupo.get(fin)?.value ?? ''));
    return a !== null && b !== null && b <= a ? { rangoHorario: true } : null;
  };
}
