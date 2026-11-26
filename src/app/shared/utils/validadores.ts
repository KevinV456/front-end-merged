import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Letras (con tildes y ñ) separadas por espacios, guion o apóstrofe
const LETRAS = /^\p{L}+(?:[\s'’-]+\p{L}+)*$/u;

export function hoyISO(): string {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD en hora local
}

/** Quita espacios sobrantes: "  Juan   Carlos " → "Juan Carlos". */
export function limpiarTexto(valor: string): string {
  return valor.trim().replace(/\s+/g, ' ');
}

/** Obligatorio, solo letras y con largo entre min y max (ignorando espacios de los bordes). */
export function nombrePropio(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = String(control.value ?? '').trim();
    if (!valor) return { requerido: true };
    if (valor.length < min) return { corto: { min } };
    if (valor.length > max) return { largo: { max } };
    if (!LETRAS.test(valor)) return { soloLetras: true };
    return null;
  };
}

/** Opcional: vacío es válido; si se escribe, deben ser exactamente n dígitos. */
export function digitosExactos(cantidad: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = String(control.value ?? '').trim();
    return !valor || new RegExp(`^\\d{${cantidad}}$`).test(valor)
      ? null
      : { digitos: { n: cantidad } };
  };
}

/** Obligatorio: 9 dígitos que empiezan con 9. */
export function telefonoMovil(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = String(control.value ?? '').trim();
    if (!valor) return { requerido: true };
    return /^9\d{8}$/.test(valor) ? null : { telefono: true };
  };
}

/** La fecha debe ser anterior a hoy. */
export function fechaPasada(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value as string;
    return !valor || valor < hoyISO() ? null : { fechaFutura: true };
  };
}
