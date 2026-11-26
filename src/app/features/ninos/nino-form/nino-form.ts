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
import { forkJoin } from 'rxjs';
import { NinoService } from '../nino';
import { Categoria } from '../../../core/models/categoria';
import {
  Modalidad,
  Nino,
  NinoRequest,
  POSICIONES,
  TALLAS,
  TallaUniforme,
} from '../../../core/models/nino';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { FormSeccion } from '../../../shared/components/form-seccion/form-seccion';
import { FormCampo } from '../../../shared/components/form-campo/form-campo';
import { FiltroEntrada } from '../../../shared/directives/filtro-entrada';
import {
  digitosExactos,
  fechaPasada,
  hoyISO,
  limpiarTexto,
  nombrePropio,
  telefonoMovil,
} from '../../../shared/utils/validadores';

@Component({
  selector: 'app-nino-form',
  imports: [ReactiveFormsModule, RouterLink, PageHeader, FormSeccion, FormCampo, FiltroEntrada],
  templateUrl: './nino-form.html',
})
export class NinoForm {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private ninoService = inject(NinoService);

  readonly tallas = TALLAS;
  posiciones = signal<string[]>([...POSICIONES]);

  idEdicion = signal<number | null>(Number(this.route.snapshot.paramMap.get('id')) || null);
  esEdicion = computed(() => this.idEdicion() !== null);

  categorias = signal<Categoria[]>([]);
  cargando = signal(false);
  cargaFallida = signal(false);
  guardando = signal(false);
  errores = signal<string[]>([]);
  exito = signal<{ titulo: string; texto: string } | null>(null);

  /** Rango del calendario: desde la primera categoría hasta hoy. */
  rango = computed(() => {
    const anios = this.categorias().map((c) => c.anioNacimiento);
    if (!anios.length) return { min: '', max: hoyISO() };
    const fin = `${Math.max(...anios)}-12-31`;
    return { min: `${Math.min(...anios)}-01-01`, max: fin < hoyISO() ? fin : hoyISO() };
  });

  form = this.fb.group(
    {
      nombre: this.fb.nonNullable.control('', [nombrePropio(2, 60)]),
      apellido: this.fb.nonNullable.control('', [nombrePropio(2, 60)]),
      dni: this.fb.nonNullable.control('', [digitosExactos(8)]),
      fechaNacimiento: this.fb.nonNullable.control('', [Validators.required, fechaPasada()]),
      categoriaId: this.fb.control<number | null>(null, Validators.required),
      modalidad: this.fb.nonNullable.control<Modalidad | ''>('', Validators.required),
      posicion: this.fb.nonNullable.control(''),
      altura: this.fb.control<number | null>(null, [Validators.min(80), Validators.max(220)]),
      peso: this.fb.control<number | null>(null, [Validators.min(10), Validators.max(150)]),
      tallaUniforme: this.fb.nonNullable.control<TallaUniforme | ''>(''),
      apoderadoNombre: this.fb.nonNullable.control('', [nombrePropio(3, 100)]),
      apoderadoTelefono: this.fb.nonNullable.control('', [telefonoMovil()]),
    },
    { validators: [(g) => this.validarCategoria(g)] },
  );

  constructor() {
    this.form.controls.fechaNacimiento.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((fecha) => this.ajustarCategoria(fecha, true));

    const categorias$ = this.ninoService.categorias();

    if (this.esEdicion()) {
      this.cargando.set(true);
      forkJoin({
        categorias: categorias$,
        nino: this.ninoService.obtener(this.idEdicion()!),
      }).subscribe({
        next: ({ categorias, nino }) => {
          this.categorias.set(categorias);
          this.rellenar(nino);
          this.cargando.set(false);
        },
        error: (e: HttpErrorResponse) => {
          this.cargando.set(false);
          this.cargaFallida.set(true);
          this.errores.set([
            e.status === 404 ? 'El niño no existe.' : 'No se pudieron cargar los datos del niño.',
          ]);
        },
      });
    } else {
      categorias$.subscribe({
        next: (lista) => {
          this.categorias.set(lista);
          this.form.updateValueAndValidity({ emitEvent: false });
        },
        error: () => this.errores.set(['No se pudieron cargar las categorías.']),
      });
    }
  }

  // ---------- Mensajes de error ----------

  mensaje(campo: string): string {
    const c = this.form.get(campo);
    if (!c || !c.errors) return '';
    const e = c.errors;
    if (e['servidor']) return e['servidor'];
    if (!c.touched) return '';
    if (e['requerido'] || e['required']) return 'Este campo es obligatorio.';
    if (e['soloLetras']) return 'Solo se permiten letras, espacios, guion y apóstrofe.';
    if (e['corto']) return `Debe tener al menos ${e['corto'].min} caracteres.`;
    if (e['largo']) return `Máximo ${e['largo'].max} caracteres.`;
    if (e['digitos']) return `Debe tener exactamente ${e['digitos'].n} dígitos.`;
    if (e['telefono']) return 'Debe tener 9 dígitos y empezar con 9.';
    if (e['fechaFutura']) return 'La fecha debe ser anterior a hoy.';
    if (e['min'] || e['max']) {
      return campo === 'altura'
        ? 'La altura debe estar entre 80 y 220 cm.'
        : 'El peso debe estar entre 10 y 150 kg.';
    }
    return 'Valor no válido.';
  }

  errorCategoria(): string {
    const anio = this.anioSinCategoria();
    if (anio) return `No hay categoría para el año ${anio}.`;
    if (this.form.errors?.['categoriaNoCoincide']) {
      return 'La categoría no corresponde al año de nacimiento.';
    }
    return this.mensaje('categoriaId');
  }

  /** Año de nacimiento que no tiene categoría en la academia. */
  anioSinCategoria(): number | null {
    const fecha = this.form.controls.fechaNacimiento.value;
    if (!fecha || this.categorias().length === 0) return null;
    const anio = Number(fecha.slice(0, 4));
    if (anio < 1900) return null; // el usuario aún está escribiendo el año
    return this.categorias().some((c) => c.anioNacimiento === anio) ? null : anio;
  }

  // ---------- Acciones ----------

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.errores.set([]);

    const v = this.form.getRawValue();
    const datos: NinoRequest = {
      dni: v.dni.trim() || null,
      nombre: limpiarTexto(v.nombre),
      apellido: limpiarTexto(v.apellido),
      fechaNacimiento: v.fechaNacimiento,
      categoriaId: v.categoriaId!,
      modalidad: v.modalidad as Modalidad,
      posicion: v.posicion || null,
      altura: v.altura,
      peso: v.peso,
      tallaUniforme: v.tallaUniforme || null,
      apoderadoNombre: limpiarTexto(v.apoderadoNombre),
      apoderadoTelefono: v.apoderadoTelefono.trim(),
    };

    const peticion = this.esEdicion()
      ? this.ninoService.actualizar(this.idEdicion()!, datos)
      : this.ninoService.crear(datos);

    peticion.subscribe({
      next: () => {
        const nombre = `${datos.nombre} ${datos.apellido}`;
        const categoria = this.categorias().find((c) => c.id === datos.categoriaId)?.nombre ?? '';
        this.exito.set(
          this.esEdicion()
            ? {
                titulo: 'Cambios guardados',
                texto: `Los datos de ${nombre} se actualizaron correctamente.`,
              }
            : {
                titulo: 'Inscripción registrada',
                texto: `${nombre} fue inscrito en la categoría ${categoria}.`,
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

  registrarOtro() {
    this.form.controls.categoriaId.enable({ emitEvent: false });
    this.form.reset();
    this.exito.set(null);
    this.errores.set([]);
  }

  // ---------- Internos ----------

  private rellenar(n: Nino) {
    if (n.posicion && !this.posiciones().includes(n.posicion)) {
      this.posiciones.update((lista) => [...lista, n.posicion!]);
    }
    this.form.patchValue(
      {
        nombre: n.nombre,
        apellido: n.apellido,
        dni: n.dni ?? '',
        fechaNacimiento: n.fechaNacimiento,
        categoriaId: n.categoriaId,
        modalidad: n.modalidad,
        posicion: n.posicion ?? '',
        altura: n.altura,
        peso: n.peso,
        tallaUniforme: (n.tallaUniforme ?? '') as TallaUniforme | '',
        apoderadoNombre: n.apoderadoNombre,
        apoderadoTelefono: n.apoderadoTelefono,
      },
      { emitEvent: false },
    );
    this.ajustarCategoria(n.fechaNacimiento, false);
    this.form.updateValueAndValidity({ emitEvent: false });
  }

  /** Sugiere la categoría según el año; si el año no tiene categoría, bloquea el select. */
  private ajustarCategoria(fecha: string, sugerir: boolean) {
    const control = this.form.controls.categoriaId;
    if (!fecha) {
      control.enable({ emitEvent: false });
      return;
    }
    const anio = Number(fecha.slice(0, 4));
    const sugerida = this.categorias().find((c) => c.anioNacimiento === anio);

    if (!sugerida) {
      if (anio >= 1900) {
        control.setValue(null);
        control.markAsPristine();
        control.disable({ emitEvent: false });
      }
      return;
    }
    control.enable({ emitEvent: false });
    if (sugerir && !control.dirty) control.setValue(sugerida.id);
  }

  /** La categoría elegida debe existir y corresponder al año de nacimiento. */
  private validarCategoria(g: AbstractControl): ValidationErrors | null {
    const fecha = g.get('fechaNacimiento')?.value as string;
    if (!fecha || this.categorias().length === 0) return null;
    const anio = Number(fecha.slice(0, 4));
    if (anio < 1900) return null;
    if (!this.categorias().some((c) => c.anioNacimiento === anio)) return { sinCategoria: true };

    const id = g.get('categoriaId')?.value as number | null;
    const elegida = this.categorias().find((c) => c.id === id);
    return elegida && elegida.anioNacimiento !== anio ? { categoriaNoCoincide: true } : null;
  }

  private interpretarError(e: HttpErrorResponse): string[] {
    switch (e.status) {
      case 0:
        return ['No se pudo conectar con el servidor.'];
      case 403:
        return ['Solo el administrador puede registrar o modificar niños.'];
      case 404:
        return ['El niño ya no existe.'];
      case 409: {
        const dni = this.form.controls.dni;
        dni.setErrors({ servidor: 'Este DNI ya está registrado.' });
        dni.markAsTouched();
        return [e.error?.mensaje ?? 'Ya existe un niño con ese DNI.'];
      }
      case 400: {
        const campos = e.error?.errores as Record<string, string> | undefined;
        if (campos && typeof campos === 'object') {
          Object.entries(campos).forEach(([campo, texto]) => {
            const control = this.form.get(campo === 'categoria' ? 'categoriaId' : campo);
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
