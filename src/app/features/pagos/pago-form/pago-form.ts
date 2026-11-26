import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NinoService } from '../../ninos/nino';
import { PagoService } from '../pago';
import { PagoRequest } from '../../../core/models/pago';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { FormSeccion } from '../../../shared/components/form-seccion/form-seccion';
import { FormCampo } from '../../../shared/components/form-campo/form-campo';
import { finDeMesISO } from '../../../shared/utils/pagos';

interface OpcionNino {
  id: number;
  etiqueta: string;
}

@Component({
  selector: 'app-pago-form',
  imports: [ReactiveFormsModule, RouterLink, PageHeader, FormSeccion, FormCampo],
  templateUrl: './pago-form.html',
})
export class PagoForm {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private ninoService = inject(NinoService);
  private pagoService = inject(PagoService);

  ninos = signal<OpcionNino[]>([]);
  guardando = signal(false);
  errores = signal<string[]>([]);
  exito = signal<{ titulo: string; texto: string } | null>(null);

  form = this.fb.group({
    ninoId: this.fb.control<number | null>(null, Validators.required),
    monto: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0.01),
      Validators.max(99999),
    ]),
    fecha: this.fb.nonNullable.control(finDeMesISO(), Validators.required),
  });

  constructor() {
    // Desde la ficha del niño se llega con /pagos/nuevo?nino=ID y el niño ya elegido.
    const preseleccion = Number(this.route.snapshot.queryParamMap.get('nino')) || null;

    this.ninoService.listar().subscribe({
      next: (lista) => {
        this.ninos.set(
          lista
            .map((n) => ({
              id: n.id,
              etiqueta: `${n.apellido}, ${n.nombre}${n.categoriaNombre ? ' · ' + n.categoriaNombre : ''}`,
            }))
            .sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, 'es')),
        );
        if (preseleccion && lista.some((n) => n.id === preseleccion)) {
          this.form.controls.ninoId.setValue(preseleccion);
        }
      },
      error: () => this.errores.set(['No se pudo cargar la lista de niños.']),
    });
  }

  mensaje(campo: string): string {
    const c = this.form.get(campo);
    if (!c || !c.errors) return '';
    const e = c.errors;
    if (e['servidor']) return e['servidor'];
    if (!c.touched) return '';
    if (e['required']) return 'Este campo es obligatorio.';
    if (e['min']) return 'El monto debe ser mayor que cero.';
    if (e['max']) return 'El monto es demasiado alto.';
    return 'Valor no válido.';
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.errores.set([]);

    const v = this.form.getRawValue();
    const datos: PagoRequest = {
      nino: { id: v.ninoId! },
      monto: Number(v.monto),
      fecha: v.fecha,
      estado: 'PENDIENTE',
    };

    this.pagoService.crear(datos).subscribe({
      next: () => {
        const nino = this.ninos().find((n) => n.id === datos.nino.id)?.etiqueta.split(' · ')[0];
        this.exito.set({
          titulo: 'Mensualidad registrada',
          texto: `Se registró la mensualidad pendiente de ${nino ?? 'el niño'}.`,
        });
        this.guardando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.guardando.set(false);
        this.errores.set(this.interpretarError(e));
      },
    });
  }

  registrarOtra() {
    this.form.reset({ ninoId: null, monto: null, fecha: finDeMesISO() });
    this.exito.set(null);
    this.errores.set([]);
  }

  private interpretarError(e: HttpErrorResponse): string[] {
    switch (e.status) {
      case 0:
        return ['No se pudo conectar con el servidor.'];
      case 403:
        return ['Solo el administrador puede registrar mensualidades.'];
      case 409:
        return [e.error?.mensaje ?? 'No se pudo registrar por un conflicto de datos.'];
      case 400: {
        const campos = e.error?.errores as Record<string, string> | undefined;
        if (campos && typeof campos === 'object') {
          Object.entries(campos).forEach(([campo, texto]) => {
            const control = this.form.get(campo === 'nino' ? 'ninoId' : campo);
            if (control) {
              control.setErrors({ servidor: texto });
              control.markAsTouched();
            }
          });
          return ['Revisa los campos marcados en el formulario.'];
        }
        return [e.error?.mensaje ?? 'Hay datos inválidos. Revisa el formulario.'];
      }
      default:
        return [`Error inesperado (${e.status}).`];
    }
  }
}
