import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, merge } from 'rxjs';
import { AlquilerService } from '../alquiler';
import { CanchaService } from '../../canchas/cancha';
import {
  Alquiler,
  AlquilerRequest,
  ESTADOS_ALQUILER,
  EstadoAlquiler,
} from '../../../core/models/alquiler';
import { Cancha, nombreCancha } from '../../../core/models/cancha';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { FormSeccion } from '../../../shared/components/form-seccion/form-seccion';
import { FormCampo } from '../../../shared/components/form-campo/form-campo';
import { FechaPipe } from '../../../shared/pipes/fecha-pipe';
import { limpiarTexto } from '../../../shared/utils/validadores';
import { aHora, finPosteriorAInicio, parseRango } from '../../../shared/utils/tiempo';

/** Obligatorio (sin contar espacios de los bordes) y con un largo máximo. */
function textoObligatorio(max: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = String(control.value ?? '').trim();
    if (!valor) return { requerido: true };
    return valor.length > max ? { largo: { max } } : null;
  };
}

@Component({
  selector: 'app-alquiler-form',
  imports: [ReactiveFormsModule, RouterLink, PageHeader, FormSeccion, FormCampo],
  templateUrl: './alquiler-form.html',
})
export class AlquilerForm {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private alquilerService = inject(AlquilerService);
  private canchaService = inject(CanchaService);

  readonly estados = ESTADOS_ALQUILER;
  readonly nombreCancha = nombreCancha;

  idEdicion = signal<number | null>(Number(this.route.snapshot.paramMap.get('id')) || null);
  esEdicion = computed(() => this.idEdicion() !== null);

  canchas = signal<Cancha[]>([]);
  cargando = signal(false);
  cargaFallida = signal(false);
  guardando = signal(false);
  errores = signal<string[]>([]);
  /** Mensaje del 409 que devuelve el backend (choque de horario u otro conflicto). */
  conflicto = signal('');
  exito = signal<{ titulo: string; texto: string } | null>(null);

  form = this.fb.group(
    {
      canchaId: this.fb.control<number | null>(null, Validators.required),
      fecha: this.fb.nonNullable.control('', Validators.required),
      horaInicio: this.fb.nonNullable.control('', Validators.required),
      horaFin: this.fb.nonNullable.control('', Validators.required),
      solicitante: this.fb.nonNullable.control('', textoObligatorio(120)),
      contacto: this.fb.nonNullable.control('', Validators.maxLength(40)),
      monto: this.fb.control<number | null>(null, [
        Validators.required,
        Validators.min(0),
        Validators.max(99999999),
      ]),
      estado: this.fb.nonNullable.control<EstadoAlquiler>('RESERVADO'),
    },
    { validators: [finPosteriorAInicio('horaInicio', 'horaFin')] },
  );

  constructor() {
    // El mensaje de choque deja de tener sentido apenas se cambia algo de la reserva
    merge(
      this.form.controls.canchaId.valueChanges,
      this.form.controls.fecha.valueChanges,
      this.form.controls.horaInicio.valueChanges,
      this.form.controls.horaFin.valueChanges,
    )
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.conflicto.set(''));

    const canchas$ = this.canchaService.listar();

    if (this.esEdicion()) {
      this.cargando.set(true);
      forkJoin({
        canchas: canchas$,
        alquiler: this.alquilerService.obtener(this.idEdicion()!),
      }).subscribe({
        next: ({ canchas, alquiler }) => {
          this.canchas.set(canchas);
          this.rellenar(alquiler);
          this.cargando.set(false);
        },
        error: (e: HttpErrorResponse) => {
          this.cargando.set(false);
          this.cargaFallida.set(true);
          this.errores.set([
            e.status === 404
              ? 'El alquiler no existe.'
              : 'No se pudieron cargar los datos del alquiler.',
          ]);
        },
      });
    } else {
      canchas$.subscribe({
        next: (lista) => {
          this.canchas.set(lista);
          this.preseleccionarCancha();
        },
        error: () => this.errores.set(['No se pudieron cargar las canchas.']),
      });
    }
  }

  etiquetaCancha(c: Cancha): string {
    const base = `${nombreCancha(c.id)} · ${c.horario}`;
    return c.estado === 'MANTENIMIENTO' ? `${base} · En mantenimiento` : base;
  }

  mensaje(campo: string): string {
    const c = this.form.get(campo);
    if (!c || !c.errors) {
      return campo === 'horaFin' ? this.mensajeRango() : '';
    }
    const e = c.errors;
    if (e['servidor']) return e['servidor'];
    if (!c.touched) return '';
    if (e['required'] || e['requerido']) return 'Este campo es obligatorio.';
    if (e['largo']) return `Máximo ${e['largo'].max} caracteres.`;
    if (e['maxlength']) return `Máximo ${e['maxlength'].requiredLength} caracteres.`;
    if (e['min']) return 'El monto no puede ser negativo.';
    if (e['max']) return 'El monto es demasiado alto.';
    return 'Valor no válido.';
  }

  private mensajeRango(): string {
    const fin = this.form.controls.horaFin;
    return fin.touched && this.form.errors?.['rangoHorario']
      ? 'La hora de fin debe ser posterior a la de inicio.'
      : '';
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.errores.set([]);
    this.conflicto.set('');

    const v = this.form.getRawValue();
    const datos: AlquilerRequest = {
      cancha: { id: v.canchaId! },
      fecha: v.fecha,
      horario: `${v.horaInicio}-${v.horaFin}`,
      solicitante: limpiarTexto(v.solicitante),
      contacto: v.contacto.trim() || null,
      monto: Number(v.monto),
      estado: this.esEdicion() ? v.estado : 'RESERVADO',
    };

    const peticion = this.esEdicion()
      ? this.alquilerService.actualizar(this.idEdicion()!, datos)
      : this.alquilerService.crear(datos);

    peticion.subscribe({
      next: () => {
        const fecha = new FechaPipe().transform(datos.fecha);
        this.exito.set(
          this.esEdicion()
            ? {
                titulo: 'Cambios guardados',
                texto: `El alquiler de ${datos.solicitante} se actualizó correctamente.`,
              }
            : {
                titulo: 'Alquiler registrado',
                texto: `${datos.solicitante} alquiló la ${nombreCancha(datos.cancha.id)} el ${fecha} de ${datos.horario.replace('-', ' a ')}.`,
              },
        );
        this.guardando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.guardando.set(false);
        this.interpretarError(e);
      },
    });
  }

  registrarOtro() {
    this.form.reset();
    this.exito.set(null);
    this.errores.set([]);
    this.conflicto.set('');
    this.preseleccionarCancha();
  }

  // ---------- Internos ----------

  /** Si la academia tiene una sola cancha, no hay nada que elegir. */
  private preseleccionarCancha() {
    if (this.canchas().length === 1) {
      this.form.controls.canchaId.setValue(this.canchas()[0].id);
    }
  }

  private rellenar(a: Alquiler) {
    const rango = parseRango(a.horario);
    this.form.patchValue(
      {
        canchaId: a.cancha.id,
        fecha: a.fecha,
        horaInicio: rango ? aHora(rango[0]) : '',
        horaFin: rango ? aHora(rango[1]) : '',
        solicitante: a.solicitante,
        contacto: a.contacto ?? '',
        monto: a.monto,
        estado: a.estado,
      },
      { emitEvent: false },
    );
    this.form.updateValueAndValidity({ emitEvent: false });
  }

  private interpretarError(e: HttpErrorResponse) {
    switch (e.status) {
      case 0:
        this.errores.set(['No se pudo conectar con el servidor.']);
        break;
      case 403:
        this.errores.set(['Solo el administrador puede registrar o modificar alquileres.']);
        break;
      case 404:
        this.errores.set([e.error?.mensaje ?? 'El alquiler o la cancha ya no existen.']);
        break;
      case 409:
        // Choque de horario con otro alquiler o con un entrenamiento (u otro conflicto)
        this.conflicto.set(e.error?.mensaje ?? 'La cancha no está disponible en ese horario.');
        break;
      case 400: {
        const campos = e.error?.errores as Record<string, string> | undefined;
        if (campos && typeof campos === 'object') {
          Object.entries(campos).forEach(([campo, texto]) => {
            const nombre =
              campo === 'cancha' ? 'canchaId' : campo === 'horario' ? 'horaFin' : campo;
            const control = this.form.get(nombre);
            if (control) {
              control.setErrors({ servidor: texto });
              control.markAsTouched();
            }
          });
          this.errores.set(['Revisa los campos marcados en el formulario.']);
        } else {
          this.errores.set([e.error?.mensaje ?? 'Hay datos inválidos. Revisa el formulario.']);
        }
        break;
      }
      default:
        this.errores.set([`Error inesperado (${e.status}).`]);
    }
  }
}
