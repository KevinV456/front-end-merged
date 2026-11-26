import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { EntrenadorService } from '../entrenador';
import { Categoria } from '../../../core/models/categoria';
import { Entrenador, EntrenadorRequest } from '../../../core/models/entrenador';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { FormSeccion } from '../../../shared/components/form-seccion/form-seccion';
import { FormCampo } from '../../../shared/components/form-campo/form-campo';
import { FiltroEntrada } from '../../../shared/directives/filtro-entrada';
import {
  digitosExactos,
  limpiarTexto,
  nombrePropio,
  telefonoMovil,
} from '../../../shared/utils/validadores';

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USUARIO = /^[A-Za-z0-9._-]{3,40}$/;

@Component({
  selector: 'app-entrenador-form',
  imports: [ReactiveFormsModule, RouterLink, PageHeader, FormSeccion, FormCampo, FiltroEntrada],
  templateUrl: './entrenador-form.html',
})
export class EntrenadorForm {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private servicio = inject(EntrenadorService);

  idEdicion = signal<number | null>(Number(this.route.snapshot.paramMap.get('id')) || null);
  esEdicion = computed(() => this.idEdicion() !== null);

  categorias = signal<Categoria[]>([]);
  cargando = signal(false);
  cargaFallida = signal(false);
  guardando = signal(false);
  errores = signal<string[]>([]);
  exito = signal<{ titulo: string; texto: string; aviso?: string } | null>(null);

  /** Si está marcado, después de guardar se crea la cuenta de acceso (POST /api/usuario). */
  crearCuenta = signal(false);

  form = this.fb.group({
    nombre: this.fb.nonNullable.control('', [nombrePropio(2, 60)]),
    apellido: this.fb.nonNullable.control('', [nombrePropio(2, 60)]),
    dni: this.fb.nonNullable.control('', [Validators.required, digitosExactos(8)]),
    contacto: this.fb.nonNullable.control('', [telefonoMovil()]),
    correo: this.fb.nonNullable.control('', [Validators.email, Validators.pattern(CORREO)]),
    categoriaId: this.fb.control<number | null>(null),
    // Cuenta de acceso: deshabilitados hasta que se marque la casilla
    username: this.fb.nonNullable.control({ value: '', disabled: true }, [
      Validators.required,
      Validators.pattern(USUARIO),
    ]),
    password: this.fb.nonNullable.control({ value: '', disabled: true }, [
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(72),
    ]),
  });

  constructor() {
    const categorias$ = this.servicio.categorias();

    if (this.esEdicion()) {
      this.cargando.set(true);
      forkJoin({
        categorias: categorias$,
        entrenador: this.servicio.obtener(this.idEdicion()!),
      }).subscribe({
        next: ({ categorias, entrenador }) => {
          this.categorias.set(categorias);
          this.rellenar(entrenador);
          this.cargando.set(false);
        },
        error: (e: HttpErrorResponse) => {
          this.cargando.set(false);
          this.cargaFallida.set(true);
          this.errores.set([
            e.status === 404
              ? 'El entrenador no existe.'
              : 'No se pudieron cargar los datos del entrenador.',
          ]);
        },
      });
    } else {
      categorias$.subscribe({
        next: (lista) => this.categorias.set(lista),
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
    if (e['email'] || (e['pattern'] && campo === 'correo')) return 'Escribe un correo válido.';
    if (e['pattern'] && campo === 'username') {
      return 'Usa de 3 a 40 caracteres: letras, números, punto, guion o guion bajo.';
    }
    if (e['minlength']) return `Debe tener al menos ${e['minlength'].requiredLength} caracteres.`;
    if (e['maxlength']) return `Máximo ${e['maxlength'].requiredLength} caracteres.`;
    return 'Valor no válido.';
  }

  // ---------- Acciones ----------

  alternarCuenta(activa: boolean) {
    this.crearCuenta.set(activa);
    const { username, password } = this.form.controls;
    if (activa) {
      username.enable();
      password.enable();
    } else {
      username.reset('');
      password.reset('');
      username.disable();
      password.disable();
    }
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.errores.set([]);

    const v = this.form.getRawValue();
    const datos: EntrenadorRequest = {
      dni: v.dni.trim(),
      nombre: limpiarTexto(v.nombre),
      apellido: limpiarTexto(v.apellido),
      contacto: v.contacto.trim(),
      correo: v.correo.trim() || null,
      categoriaId: v.categoriaId,
    };

    const peticion = this.esEdicion()
      ? this.servicio.actualizar(this.idEdicion()!, datos)
      : this.servicio.crear(datos);

    peticion.subscribe({
      next: (entrenador) => {
        if (!this.crearCuenta()) {
          this.terminar(datos);
          return;
        }
        const username = v.username.trim();
        this.servicio
          .crearUsuario({
            username,
            password: v.password,
            rol: 'ENTRENADOR',
            entrenadorId: entrenador.id,
          })
          .subscribe({
            next: () => this.terminar(datos, username),
            error: (e: HttpErrorResponse) =>
              this.terminar(
                datos,
                undefined,
                `El entrenador se guardó, pero no se pudo crear la cuenta de acceso: ${this.textoError(e)}`,
              ),
          });
      },
      error: (e: HttpErrorResponse) => {
        this.guardando.set(false);
        this.errores.set(this.interpretarError(e));
      },
    });
  }

  registrarOtro() {
    this.alternarCuenta(false);
    this.form.reset();
    this.exito.set(null);
    this.errores.set([]);
  }

  // ---------- Internos ----------

  private terminar(datos: EntrenadorRequest, usuario?: string, aviso?: string) {
    const nombre = `${datos.nombre} ${datos.apellido}`;
    const cuenta = usuario ? ` Su cuenta de acceso es «${usuario}».` : '';
    this.exito.set(
      this.esEdicion()
        ? {
            titulo: 'Cambios guardados',
            texto: `Los datos de ${nombre} se actualizaron correctamente.${cuenta}`,
            aviso,
          }
        : {
            titulo: 'Entrenador registrado',
            texto: `${nombre} fue registrado correctamente.${cuenta}`,
            aviso,
          },
    );
    this.guardando.set(false);
  }

  private rellenar(e: Entrenador) {
    this.form.patchValue({
      nombre: e.nombre,
      apellido: e.apellido,
      dni: e.dni,
      contacto: e.contacto,
      correo: e.correo ?? '',
      categoriaId: e.catAsignada?.id ?? null,
    });
  }

  private textoError(e: HttpErrorResponse): string {
    if (e.status === 0) return 'No se pudo conectar con el servidor.';
    if (e.status === 403) return 'No tienes permiso para crear cuentas.';
    const campos = e.error?.errores as Record<string, string> | undefined;
    if (campos && typeof campos === 'object') return Object.values(campos).join(' ');
    return e.error?.mensaje ?? `Error inesperado (${e.status}).`;
  }

  private interpretarError(e: HttpErrorResponse): string[] {
    switch (e.status) {
      case 0:
        return ['No se pudo conectar con el servidor.'];
      case 403:
        return ['Solo el administrador puede registrar o modificar entrenadores.'];
      case 404:
        return ['El entrenador ya no existe.'];
      case 409: {
        const texto: string = e.error?.mensaje ?? 'Ya existe un entrenador con esos datos.';
        const control = /correo/i.test(texto) ? this.form.controls.correo : this.form.controls.dni;
        control.setErrors({ servidor: texto });
        control.markAsTouched();
        return [texto];
      }
      case 400: {
        const campos = e.error?.errores as Record<string, string> | undefined;
        if (campos && typeof campos === 'object') {
          Object.entries(campos).forEach(([campo, texto]) => {
            const control = this.form.get(campo);
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
