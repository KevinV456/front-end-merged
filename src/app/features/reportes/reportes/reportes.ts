import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReporteService } from '../reporte';
import { ClaveReporte, FilaReporte } from '../../../core/models/reporte';
import { MovimientoRequest, TipoMovimiento } from '../../../core/models/movimiento';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { BadgeEstado, Tono } from '../../../shared/components/badge-estado/badge-estado';
import { EstadoVacio } from '../../../shared/components/estado-vacio/estado-vacio';
import { Modal } from '../../../shared/components/modal/modal';
import { FormCampo } from '../../../shared/components/form-campo/form-campo';
import { FechaPipe } from '../../../shared/pipes/fecha-pipe';
import { ColumnaCsv, aCsv, descargarCsv } from '../../../shared/utils/csv';
import { hoyISO } from '../../../shared/utils/validadores';

type TipoColumna = 'texto' | 'moneda' | 'fecha' | 'estadoPago' | 'tipoMovimiento' | 'porcentaje' | 'activo';

interface Columna {
  clave: string;
  titulo: string;
  tipo?: TipoColumna;
}

interface DefinicionReporte {
  clave: ClaveReporte;
  titulo: string;
  icono: string;
  descripcion: string;
  /** El servidor solo filtra por fecha los reportes cuya vista tiene columna de fecha. */
  conFechas: boolean;
  columnas: Columna[];
}

/** Una pestaña por vista SQL de database/documento.sql. */
const REPORTES: DefinicionReporte[] = [
  {
    clave: 'ninos',
    titulo: 'Niños',
    icono: 'bi-people',
    descripcion: 'Alumnos con edad, categoría y datos del apoderado (vw_ninos_detalle).',
    conFechas: false,
    columnas: [
      { clave: 'alumno', titulo: 'Alumno' },
      { clave: 'dni', titulo: 'DNI' },
      { clave: 'edad', titulo: 'Edad' },
      { clave: 'categoria', titulo: 'Categoría' },
      { clave: 'modalidad', titulo: 'Modalidad' },
      { clave: 'posicion', titulo: 'Posición' },
      { clave: 'talla_uniforme', titulo: 'Talla' },
      { clave: 'apoderado_nombre', titulo: 'Apoderado' },
      { clave: 'apoderado_telefono', titulo: 'Teléfono' },
      { clave: 'activo', titulo: 'Estado', tipo: 'activo' },
    ],
  },
  {
    clave: 'horarios',
    titulo: 'Horarios',
    icono: 'bi-calendar-week',
    descripcion: 'Horario semanal de entrenamientos (vw_horario_entrenamientos).',
    conFechas: false,
    columnas: [
      { clave: 'dia', titulo: 'Día' },
      { clave: 'horario', titulo: 'Horario' },
      { clave: 'categoria', titulo: 'Categoría' },
      { clave: 'entrenador', titulo: 'Entrenador' },
      { clave: 'estado_cancha', titulo: 'Estado de la cancha' },
    ],
  },
  {
    clave: 'pagos',
    titulo: 'Pagos',
    icono: 'bi-cash-coin',
    descripcion:
      'Estado de las mensualidades; un pendiente vencido figura como VENCIDO (vw_estado_pagos).',
    conFechas: true,
    columnas: [
      { clave: 'alumno', titulo: 'Alumno' },
      { clave: 'categoria', titulo: 'Categoría' },
      { clave: 'monto', titulo: 'Monto', tipo: 'moneda' },
      { clave: 'fecha', titulo: 'Fecha', tipo: 'fecha' },
      { clave: 'estado', titulo: 'Estado', tipo: 'estadoPago' },
    ],
  },
  {
    clave: 'flujo-caja',
    titulo: 'Flujo de caja',
    icono: 'bi-graph-up-arrow',
    descripcion:
      'Mensualidades pagadas más los ingresos y egresos registrados (vw_flujo_caja).',
    conFechas: true,
    columnas: [
      { clave: 'fecha', titulo: 'Fecha', tipo: 'fecha' },
      { clave: 'tipo', titulo: 'Tipo', tipo: 'tipoMovimiento' },
      { clave: 'concepto', titulo: 'Concepto' },
      { clave: 'monto', titulo: 'Monto', tipo: 'moneda' },
    ],
  },
  {
    clave: 'asistencia',
    titulo: 'Asistencia',
    icono: 'bi-clipboard-check',
    descripcion: 'Porcentaje de asistencia por niño (vw_asistencia_por_nino).',
    conFechas: false,
    columnas: [
      { clave: 'alumno', titulo: 'Alumno' },
      { clave: 'categoria', titulo: 'Categoría' },
      { clave: 'sesiones_registradas', titulo: 'Sesiones' },
      { clave: 'asistencias', titulo: 'Asistencias' },
      { clave: 'porcentaje_asistencia', titulo: '% asistencia', tipo: 'porcentaje' },
    ],
  },
];

const TONO_ESTADO: Record<string, Tono> = { PAGADO: 'verde', PENDIENTE: 'lima', VENCIDO: 'rojo' };

@Component({
  selector: 'app-reportes',
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    PageHeader,
    BadgeEstado,
    EstadoVacio,
    Modal,
    FormCampo,
    FechaPipe,
  ],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
})
export class Reportes {
  private reporteService = inject(ReporteService);
  private fb = inject(FormBuilder);

  readonly reportes = REPORTES;

  claveActiva = signal<ClaveReporte>('ninos');
  reporte = computed(() => REPORTES.find((r) => r.clave === this.claveActiva())!);

  filas = signal<FilaReporte[]>([]);
  cargando = signal(false);
  error = signal('');
  exito = signal('');

  desde = signal('');
  hasta = signal('');

  /** Resumen del flujo de caja: lo que ya está cargado en pantalla. */
  resumen = computed(() => {
    let ingresos = 0;
    let egresos = 0;
    for (const f of this.filas()) {
      const monto = Number(f['monto'] ?? 0);
      if (f['tipo'] === 'INGRESO') ingresos += monto;
      else if (f['tipo'] === 'EGRESO') egresos += monto;
    }
    return { ingresos, egresos, balance: ingresos - egresos };
  });

  // ---------- Registro de ingresos / egresos (RF04) ----------

  movimientoAbierto = signal(false);
  guardandoMovimiento = signal(false);
  errorMovimiento = signal('');

  formMovimiento = this.fb.group({
    tipo: this.fb.nonNullable.control<TipoMovimiento>('EGRESO', Validators.required),
    concepto: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(120),
    ]),
    monto: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    fecha: this.fb.nonNullable.control(hoyISO(), Validators.required),
  });

  constructor() {
    this.cargar();
  }

  // ---------- Carga ----------

  elegir(clave: ClaveReporte) {
    if (clave === this.claveActiva()) return;
    this.claveActiva.set(clave);
    this.desde.set('');
    this.hasta.set('');
    this.exito.set('');
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.error.set('');
    const usaFechas = this.reporte().conFechas;

    this.reporteService
      .consultar(this.claveActiva(), usaFechas ? this.desde() : '', usaFechas ? this.hasta() : '')
      .subscribe({
        next: (filas) => {
          this.filas.set(filas);
          this.cargando.set(false);
        },
        error: (e: HttpErrorResponse) => {
          this.filas.set([]);
          this.cargando.set(false);
          this.error.set(
            e.status === 403
              ? 'Solo el administrador puede ver los reportes (403).'
              : e.status === 400
                ? (e.error?.mensaje ?? 'Las fechas indicadas no son válidas.')
                : `No se pudo cargar el reporte (error ${e.status}).`,
          );
        },
      });
  }

  cambiarDesde(valor: string) {
    this.desde.set(valor);
  }

  cambiarHasta(valor: string) {
    this.hasta.set(valor);
  }

  limpiarFechas() {
    this.desde.set('');
    this.hasta.set('');
    this.cargar();
  }

  // ---------- Presentación ----------

  tonoEstado(valor: unknown): Tono {
    return TONO_ESTADO[String(valor)] ?? 'gris';
  }

  esActivo(valor: unknown): boolean {
    return valor === true || valor === 1 || valor === '1';
  }

  numero(valor: unknown): number {
    return Number(valor ?? 0);
  }

  // ---------- Exportación ----------

  exportar() {
    const def = this.reporte();
    const columnas: ColumnaCsv[] = def.columnas.map((c) => ({
      titulo: c.titulo,
      valor: (fila: FilaReporte) => {
        const v = fila[c.clave];
        return c.tipo === 'activo' ? (this.esActivo(v) ? 'Activo' : 'Baja') : v;
      },
    }));
    const sufijo = [this.desde(), this.hasta()].filter(Boolean).join('_a_');
    const nombre = `reporte-${def.clave}${sufijo ? '-' + sufijo : ''}.csv`;
    descargarCsv(nombre, aCsv(columnas, this.filas()));
  }

  // ---------- Movimientos ----------

  abrirMovimiento() {
    this.formMovimiento.reset({ tipo: 'EGRESO', concepto: '', monto: null, fecha: hoyISO() });
    this.errorMovimiento.set('');
    this.movimientoAbierto.set(true);
  }

  cerrarMovimiento() {
    if (!this.guardandoMovimiento()) this.movimientoAbierto.set(false);
  }

  errorCampo(campo: string): string {
    const c = this.formMovimiento.get(campo);
    if (!c || !c.errors) return '';
    if (c.errors['servidor']) return c.errors['servidor'];
    if (!c.touched) return '';
    if (c.errors['required']) return 'Este campo es obligatorio.';
    if (c.errors['minlength']) return 'Debe tener al menos 3 caracteres.';
    if (c.errors['maxlength']) return 'Máximo 120 caracteres.';
    if (c.errors['min']) return 'El monto debe ser mayor que cero.';
    return 'Valor no válido.';
  }

  guardarMovimiento() {
    if (this.formMovimiento.invalid) {
      this.formMovimiento.markAllAsTouched();
      return;
    }
    this.guardandoMovimiento.set(true);
    this.errorMovimiento.set('');

    const v = this.formMovimiento.getRawValue();
    const datos: MovimientoRequest = {
      tipo: v.tipo,
      concepto: v.concepto.trim().replace(/\s+/g, ' '),
      monto: Number(v.monto),
      fecha: v.fecha,
    };

    this.reporteService.registrarMovimiento(datos).subscribe({
      next: () => {
        this.guardandoMovimiento.set(false);
        this.movimientoAbierto.set(false);
        this.exito.set(
          `${datos.tipo === 'INGRESO' ? 'Ingreso' : 'Egreso'} registrado: ${datos.concepto}.`,
        );
        this.cargar();
      },
      error: (e: HttpErrorResponse) => {
        this.guardandoMovimiento.set(false);
        const campos = e.error?.errores as Record<string, string> | undefined;
        if (e.status === 400 && campos && typeof campos === 'object') {
          Object.entries(campos).forEach(([campo, texto]) => {
            const control = this.formMovimiento.get(campo);
            if (control) {
              control.setErrors({ servidor: texto });
              control.markAsTouched();
            }
          });
          this.errorMovimiento.set('Revisa los campos marcados.');
        } else {
          this.errorMovimiento.set(
            e.status === 403
              ? 'Solo el administrador puede registrar movimientos.'
              : e.status === 0
                ? 'No se pudo conectar con el servidor.'
                : (e.error?.mensaje ?? `No se pudo registrar (error ${e.status}).`),
          );
        }
      },
    });
  }
}
