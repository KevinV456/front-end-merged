import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CanchaService } from '../cancha';
import {
  Cancha,
  CanchaRequest,
  ESTADOS_CANCHA,
  EstadoCancha,
  nombreCancha,
} from '../../../core/models/cancha';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { FormSeccion } from '../../../shared/components/form-seccion/form-seccion';
import { FormCampo } from '../../../shared/components/form-campo/form-campo';
import { aHora, finPosteriorAInicio, parseRango } from '../../../shared/utils/tiempo';

@Component({
  selector: 'app-cancha-form',
  imports: [ReactiveFormsModule, RouterLink, PageHeader, FormSeccion, FormCampo],
  templateUrl: './cancha-form.html',
})
export class CanchaForm {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private canchaService = inject(CanchaService);

  readonly estados = ESTADOS_CANCHA;

  idEdicion = signal<number | null>(Number(this.route.snapshot.paramMap.get('id')) || null);
  esEdicion = computed(() => this.idEdicion() !== null);

  cargando = signal(false);
  cargaFallida = signal(false);
  guardando = signal(false);
  errores = signal<string[]>([]);
  exito = signal<{ titulo: string; texto: string } | null>(null);

  form = this.fb.group(
    {
      apertura: this.fb.nonNullable.control('', Validators.required),
      cierre: this.fb.nonNullable.control('', Validators.required),
      estado: this.fb.nonNullable.control<EstadoCancha>('DISPONIBLE', Validators.required),
    },
    { validators: [finPosteriorAInicio('apertura', 'cierre')] },
  );

  constructor() {
    if (this.esEdicion()) {
      this.cargando.set(true);
      this.canchaService.obtener(this.idEdicion()!).subscribe({
        next: (cancha) => {
          this.rellenar(cancha);
          this.cargando.set(false);
        },
        error: (e: HttpErrorResponse) => {
          this.cargando.set(false);
          this.cargaFallida.set(true);
          this.errores.set([
            e.status === 404
              ? 'La cancha no existe.'
              : 'No se pudieron cargar los datos de la cancha.',
          ]);
        },
      });
    }
  }

  nombre(): string {
    const id = this.idEdicion();
    return id ? nombreCancha(id) : 'Nueva cancha';
  }

  mensaje(campo: string): string {
    const c = this.form.get(campo);
    if (!c) return '';
    if (c.errors?.['servidor']) return c.errors['servidor'];
    if (!c.touched) return '';
    if (c.errors?.['required']) return 'Este campo es obligatorio.';
    if (campo === 'cierre' && this.form.errors?.['rangoHorario']) {
      return 'La hora de cierre debe ser posterior a la de apertura.';
    }
    return '';
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.errores.set([]);

    const v = this.form.getRawValue();
    const datos: CanchaRequest = { horario: `${v.apertura} - ${v.cierre}`, estado: v.estado };

    const peticion = this.esEdicion()
      ? this.canchaService.actualizar(this.idEdicion()!, datos)
      : this.canchaService.crear(datos);

    peticion.subscribe({
      next: (cancha) => {
        this.exito.set(
          this.esEdicion()
            ? {
                titulo: 'Cambios guardados',
                texto: `Los datos de la ${nombreCancha(cancha.id)} se actualizaron correctamente.`,
              }
            : {
                titulo: 'Cancha registrada',
                texto: `La ${nombreCancha(cancha.id)} quedó registrada con horario ${cancha.horario}.`,
              },
        );
        this.guardando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.guardando.set(false);
        this.errores.set(this.interpretarError(e));
      },
    });
  }

  registrarOtra() {
    this.form.reset();
    this.exito.set(null);
    this.errores.set([]);
  }

  private rellenar(c: Cancha) {
    const rango = parseRango(c.horario);
    this.form.patchValue({
      apertura: rango ? aHora(rango[0]) : '',
      cierre: rango ? aHora(rango[1]) : '',
      estado: c.estado,
    });
    if (!rango) {
      this.errores.set([
        `El horario guardado ("${c.horario}") no tiene el formato HH:mm - HH:mm. Vuelve a indicarlo.`,
      ]);
    }
  }

  private interpretarError(e: HttpErrorResponse): string[] {
    switch (e.status) {
      case 0:
        return ['No se pudo conectar con el servidor.'];
      case 403:
        return ['Solo el administrador puede registrar o modificar canchas.'];
      case 404:
        return ['La cancha ya no existe.'];
      case 400: {
        const campos = e.error?.errores as Record<string, string> | undefined;
        if (campos && typeof campos === 'object') {
          Object.entries(campos).forEach(([campo, texto]) => {
            const control = this.form.get(campo === 'horario' ? 'cierre' : campo);
            if (control) {
              control.setErrors({ servidor: texto });
              control.markAsTouched();
            }
          });
          return ['Revisa los campos marcados en el formulario.'];
        }
        return [e.error?.mensaje ?? 'Hay datos inválidos. Revisa el formulario.'];
      }
      case 409:
        return [e.error?.mensaje ?? 'La operación no se pudo completar por un conflicto.'];
      default:
        return [`Error inesperado (${e.status}).`];
    }
  }
}
