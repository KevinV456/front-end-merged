import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, forkJoin, map, of } from 'rxjs';
import { Auth } from '../../../core/services/auth';
import { NinoService } from '../../ninos/nino';
import { EntrenamientoService } from '../../entrenamientos/entrenamiento';
import { AsistenciaService } from '../asistencia';
import { Asistencia, AsistenciaRequest, EstadoAsistencia } from '../../../core/models/asistencia';
import { DiaEntrenamiento, Entrenamiento } from '../../../core/models/entrenamiento';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { BadgeEstado } from '../../../shared/components/badge-estado/badge-estado';
import { EstadoVacio } from '../../../shared/components/estado-vacio/estado-vacio';

/** Valores de Date.getDay(): lunes = 1, miércoles = 3, viernes = 5. */
const INDICE_DIA: Record<DiaEntrenamiento, number> = { LUNES: 1, MIERCOLES: 3, VIERNES: 5 };
const NOMBRE_DIA: Record<DiaEntrenamiento, string> = {
  LUNES: 'Lunes',
  MIERCOLES: 'Miércoles',
  VIERNES: 'Viernes',
};

const ESTADOS: { valor: EstadoAsistencia; texto: string }[] = [
  { valor: 'PRESENTE', texto: 'Presente' },
  { valor: 'AUSENTE', texto: 'Ausente' },
  { valor: 'TARDANZA', texto: 'Tardanza' },
  { valor: 'JUSTIFICADO', texto: 'Justificado' },
];

interface Fila {
  ninoId: number;
  nombre: string;
  apellido: string;
  estado: EstadoAsistencia;
  observacion: string;
  asistenciaId: number | null; // null = aún no registrada
  original: { estado: EstadoAsistencia; observacion: string | null } | null;
}

type Retenido = { estado: EstadoAsistencia; observacion: string };

/** Fecha local en formato YYYY-MM-DD (sin pasar por UTC, para evitar el desfase de Lima). */
function aISO(d: Date): string {
  return d.toLocaleDateString('en-CA');
}

/** Últimas 8 fechas en las que cae el día del entrenamiento, de la más reciente a la más antigua. */
function generarFechas(dia: DiaEntrenamiento, semanas = 8): string[] {
  const resultado: string[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < semanas * 7; i++) {
    if (d.getDay() === INDICE_DIA[dia]) resultado.push(aISO(d));
    d.setDate(d.getDate() - 1);
  }
  return resultado;
}

function ordenar(lista: Entrenamiento[]): Entrenamiento[] {
  return [...lista].sort(
    (a, b) =>
      a.categoria.anioNacimiento - b.categoria.anioNacimiento ||
      INDICE_DIA[a.dia] - INDICE_DIA[b.dia] ||
      a.horario.localeCompare(b.horario),
  );
}

function esPendiente(f: Fila): boolean {
  if (f.asistenciaId === null || f.original === null) return true;
  return (
    f.estado !== f.original.estado ||
    (f.observacion.trim() || null) !== (f.original.observacion || null)
  );
}

function mensajeDe(status: number): string {
  switch (status) {
    case 0:
      return 'sin conexión con el servidor';
    case 400:
      return 'la fecha no corresponde al día del entrenamiento';
    case 403:
      return 'no tienes permiso sobre esta categoría';
    case 404:
      return 'registro no encontrado';
    case 409:
      return 'ya estaba registrada para esa fecha';
    default:
      return `error inesperado (${status})`;
  }
}

@Component({
  selector: 'app-asistencia-registro',
  imports: [PageHeader, BadgeEstado, EstadoVacio],
  templateUrl: './asistencia-registro.html',
  styleUrl: './asistencia-registro.css',
})
export class AsistenciaRegistro {
  private auth = inject(Auth);
  private ninoService = inject(NinoService);
  private entrenamientoService = inject(EntrenamientoService);
  private asistenciaService = inject(AsistenciaService);

  readonly estados = ESTADOS;

  entrenamientos = signal<Entrenamiento[]>([]);
  entrenamientoId = signal<number | null>(null);
  fecha = signal('');
  filas = signal<Fila[]>([]);

  cargandoEntrenamientos = signal(true);
  cargandoLista = signal(false);
  guardando = signal(false);
  aviso = signal('');
  exito = signal('');
  errores = signal<string[]>([]);

  entrenamiento = computed(
    () => this.entrenamientos().find((e) => e.id === this.entrenamientoId()) ?? null,
  );
  fechas = computed(() => {
    const e = this.entrenamiento();
    return e ? generarFechas(e.dia) : [];
  });
  pendientes = computed(() => this.filas().filter(esPendiente));
  resumen = computed(() => {
    const conteo: Record<EstadoAsistencia, number> = {
      PRESENTE: 0,
      AUSENTE: 0,
      TARDANZA: 0,
      JUSTIFICADO: 0,
    };
    this.filas().forEach((f) => conteo[f.estado]++);
    return conteo;
  });

  constructor() {
    const esEntrenador = this.auth.rol() === 'ENTRENADOR';
    const categoriaId = this.auth.categoriaId();

    if (esEntrenador && categoriaId === null) {
      this.aviso.set(
        'Tu usuario no tiene una categoría asignada. Cierra sesión y vuelve a entrar; ' +
          'si el problema continúa, consulta con el administrador.',
      );
      this.cargandoEntrenamientos.set(false);
      return;
    }

    const peticion = esEntrenador
      ? this.entrenamientoService.porCategoria(categoriaId!)
      : this.entrenamientoService.listar();

    peticion.subscribe({
      next: (lista) => {
        const ordenados = ordenar(lista);
        this.entrenamientos.set(ordenados);
        this.cargandoEntrenamientos.set(false);

        // Si hay un único entrenamiento que se dicta hoy, se selecciona solo
        const deHoy = ordenados.filter((e) => INDICE_DIA[e.dia] === new Date().getDay());
        if (deHoy.length === 1) this.elegirEntrenamiento(deHoy[0].id);
      },
      error: () => {
        this.cargandoEntrenamientos.set(false);
        this.errores.set(['No se pudieron cargar los entrenamientos.']);
      },
    });
  }

  elegirEntrenamiento(id: number | null) {
    this.entrenamientoId.set(id);
    this.limpiarMensajes();
    this.filas.set([]);

    if (!this.entrenamiento()) {
      this.fecha.set('');
      return;
    }
    this.fecha.set(this.fechas()[0] ?? '');
    this.cargarPlanilla();
  }

  elegirFecha(valor: string) {
    this.fecha.set(valor);
    this.limpiarMensajes();
    this.cargarPlanilla();
  }

  cambiarEstado(ninoId: number, estado: EstadoAsistencia) {
    this.filas.update((lista) => lista.map((f) => (f.ninoId === ninoId ? { ...f, estado } : f)));
  }

  cambiarObservacion(ninoId: number, observacion: string) {
    this.filas.update((lista) =>
      lista.map((f) => (f.ninoId === ninoId ? { ...f, observacion } : f)),
    );
  }

  marcarTodos(estado: EstadoAsistencia) {
    this.filas.update((lista) => lista.map((f) => ({ ...f, estado })));
  }

  guardar() {
    const e = this.entrenamiento();
    const fecha = this.fecha();
    const lista = this.pendientes();
    if (!e || !fecha || lista.length === 0) return;

    this.guardando.set(true);
    this.limpiarMensajes();

    const peticiones = lista.map((f) => {
      const cuerpo: AsistenciaRequest = {
        entrenamiento: { id: e.id },
        nino: { id: f.ninoId },
        fecha,
        estado: f.estado,
        observacion: f.observacion.trim() || null,
      };
      const operacion =
        f.asistenciaId !== null
          ? this.asistenciaService.actualizar(f.asistenciaId, cuerpo)
          : this.asistenciaService.registrar(cuerpo);

      return operacion.pipe(
        map((): { ninoId: number; mensaje: string } | null => null),
        catchError((err: HttpErrorResponse) =>
          of({
            ninoId: f.ninoId,
            mensaje: `${f.apellido}, ${f.nombre}: ${mensajeDe(err.status)}`,
          }),
        ),
      );
    });

    forkJoin(peticiones).subscribe((resultados) => {
      const fallos = resultados.filter((r) => r !== null);
      const guardados = resultados.length - fallos.length;

      this.guardando.set(false);
      if (guardados > 0) {
        this.exito.set(`Asistencia guardada (${guardados} registro${guardados === 1 ? '' : 's'}).`);
      }
      this.errores.set(fallos.map((f) => f.mensaje));

      // Las filas que fallaron conservan lo que el usuario había elegido
      const retener = new Map<number, Retenido>();
      fallos.forEach((f) => {
        const fila = lista.find((x) => x.ninoId === f.ninoId);
        if (fila) retener.set(f.ninoId, { estado: fila.estado, observacion: fila.observacion });
      });
      this.cargarPlanilla(retener);
    });
  }

  estadoRegistro(f: Fila): string {
    if (f.asistenciaId === null) return 'Sin registrar';
    return esPendiente(f) ? 'Modificado' : 'Registrado';
  }

  diaTexto(dia: DiaEntrenamiento): string {
    return NOMBRE_DIA[dia];
  }

  etiquetaFecha(iso: string): string {
    const [anio, mes, dia] = iso.split('-').map(Number);
    const texto = new Date(anio, mes - 1, dia).toLocaleDateString('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return iso === aISO(new Date()) ? `Hoy · ${texto}` : texto;
  }

  valorNumero(evento: Event): number | null {
    const valor = (evento.target as HTMLSelectElement).value;
    return valor ? Number(valor) : null;
  }

  private cargarPlanilla(retener?: Map<number, Retenido>) {
    const e = this.entrenamiento();
    const fecha = this.fecha();
    if (!e || !fecha) return;

    this.cargandoLista.set(true);

    forkJoin({
      ninos: this.ninoService.listar(String(e.categoria.anioNacimiento)),
      registros: this.asistenciaService.listar(e.id, fecha),
    }).subscribe({
      next: ({ ninos, registros }) => {
        // Si el usuario cambió de selección mientras cargaba, se descarta esta respuesta
        if (this.entrenamientoId() !== e.id || this.fecha() !== fecha) return;

        const porNino = new Map<number, Asistencia>(
          registros.map((r) => [r.nino.id, r] as [number, Asistencia]),
        );

        const filas = [...ninos]
          .sort((a, b) =>
            `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, 'es'),
          )
          .map((n): Fila => {
            const registro = porNino.get(n.id);
            const conservado = retener?.get(n.id);
            return {
              ninoId: n.id,
              nombre: n.nombre,
              apellido: n.apellido,
              estado: conservado?.estado ?? registro?.estado ?? 'PRESENTE',
              observacion: conservado?.observacion ?? registro?.observacion ?? '',
              asistenciaId: registro?.id ?? null,
              original: registro
                ? { estado: registro.estado, observacion: registro.observacion }
                : null,
            };
          });

        this.filas.set(filas);
        this.cargandoLista.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.cargandoLista.set(false);
        this.errores.set([
          err.status === 403
            ? 'No tienes permiso para ver la asistencia de esta categoría.'
            : `No se pudo cargar la lista (error ${err.status}).`,
        ]);
      },
    });
  }

  private limpiarMensajes() {
    this.exito.set('');
    this.errores.set([]);
  }
}
