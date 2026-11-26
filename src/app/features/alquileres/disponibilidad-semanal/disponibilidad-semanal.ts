import { Component, computed, inject, input, signal } from '@angular/core';
import { EntrenamientoService } from '../../entrenamientos/entrenamiento';
import { Alquiler, EstadoAlquiler } from '../../../core/models/alquiler';
import { Cancha, nombreCancha } from '../../../core/models/cancha';
import { Entrenamiento } from '../../../core/models/entrenamiento';
import { EstadoVacio } from '../../../shared/components/estado-vacio/estado-vacio';
import {
  aHora,
  aISO,
  diaEntrenamiento,
  lunesDe,
  parseRango,
  sumarDias,
} from '../../../shared/utils/tiempo';

/** Alto en píxeles de una hora en la grilla. */
const PX_HORA = 56;
/** Rango que se muestra cuando la cancha no tiene un horario de atención legible. */
const DESDE_POR_DEFECTO = 8 * 60;
const HASTA_POR_DEFECTO = 22 * 60;

interface Bloque {
  tipo: 'ENTRENAMIENTO' | 'ALQUILER';
  titulo: string;
  horario: string;
  estado: EstadoAlquiler | null;
  inicio: number;
  fin: number;
}

interface BloquePosicionado extends Bloque {
  top: number;
  alto: number;
}

interface DiaSemana {
  iso: string;
  nombre: string;
  numero: number;
  esHoy: boolean;
  bloques: BloquePosicionado[];
}

@Component({
  selector: 'app-disponibilidad-semanal',
  imports: [EstadoVacio],
  templateUrl: './disponibilidad-semanal.html',
  styleUrl: './disponibilidad-semanal.css',
})
export class DisponibilidadSemanal {
  private entrenamientoService = inject(EntrenamientoService);

  canchas = input.required<Cancha[]>();
  alquileres = input.required<Alquiler[]>();

  readonly nombreCancha = nombreCancha;
  readonly pxHora = PX_HORA;

  entrenamientos = signal<Entrenamiento[]>([]);
  cargando = signal(true);
  error = signal('');

  canchaElegida = signal<number | null>(null);
  inicioSemana = signal(lunesDe(new Date()));

  cancha = computed<Cancha | null>(() => {
    const lista = this.canchas();
    return lista.find((c) => c.id === this.canchaElegida()) ?? lista[0] ?? null;
  });

  etiquetaSemana = computed(() => {
    const lunes = this.inicioSemana();
    const domingo = sumarDias(lunes, 6);
    const corto = { day: 'numeric', month: 'long' } as const;
    return `${lunes.toLocaleDateString('es-PE', corto)} – ${domingo.toLocaleDateString('es-PE', {
      ...corto,
      year: 'numeric',
    })}`;
  });

  esSemanaActual = computed(() => aISO(this.inicioSemana()) === aISO(lunesDe(new Date())));

  /** Todo lo que necesita pintar la grilla de la cancha y la semana elegidas. */
  rejilla = computed(() => {
    const cancha = this.cancha();
    if (!cancha) return null;

    const atencion = parseRango(cancha.horario);
    const hoy = aISO(new Date());

    const entrenamientos = this.entrenamientos().filter((e) => e.cancha?.id === cancha.id);
    const alquileres = this.alquileres().filter(
      (a) => a.cancha.id === cancha.id && a.estado !== 'CANCELADO',
    );

    const crudos = Array.from({ length: 7 }, (_, i) => {
      const fecha = sumarDias(this.inicioSemana(), i);
      const iso = aISO(fecha);
      const bloques: Bloque[] = [];

      // Los entrenamientos se repiten todas las semanas, según el día
      const dia = diaEntrenamiento(fecha);
      if (dia) {
        for (const e of entrenamientos.filter((x) => x.dia === dia)) {
          const rango = parseRango(e.horario);
          if (rango) {
            bloques.push({
              tipo: 'ENTRENAMIENTO',
              titulo: e.categoria?.nombre ?? 'Entrenamiento',
              horario: e.horario,
              estado: null,
              inicio: rango[0],
              fin: rango[1],
            });
          }
        }
      }

      for (const a of alquileres.filter((x) => x.fecha === iso)) {
        const rango = parseRango(a.horario);
        if (rango) {
          bloques.push({
            tipo: 'ALQUILER',
            titulo: a.solicitante,
            horario: a.horario,
            estado: a.estado,
            inicio: rango[0],
            fin: rango[1],
          });
        }
      }
      return { fecha, iso, bloques };
    });

    // La grilla cubre el horario de atención y cualquier bloque que se salga de él
    const todos = crudos.flatMap((d) => d.bloques);
    const minimo = Math.min(atencion?.[0] ?? DESDE_POR_DEFECTO, ...todos.map((b) => b.inicio));
    const maximo = Math.max(atencion?.[1] ?? HASTA_POR_DEFECTO, ...todos.map((b) => b.fin));
    const desde = Math.floor(minimo / 60) * 60;
    const hasta = Math.ceil(maximo / 60) * 60;
    const px = (minutos: number) => ((minutos - desde) / 60) * PX_HORA;

    const dias: DiaSemana[] = crudos.map((d) => ({
      iso: d.iso,
      nombre: d.fecha.toLocaleDateString('es-PE', { weekday: 'short' }).replace('.', ''),
      numero: d.fecha.getDate(),
      esHoy: d.iso === hoy,
      bloques: d.bloques.map((b) => ({
        ...b,
        top: px(b.inicio),
        alto: Math.max(px(b.fin) - px(b.inicio) - 2, 14),
      })),
    }));

    const horas: { top: number; texto: string }[] = [];
    for (let m = desde; m <= hasta; m += 60) horas.push({ top: px(m), texto: aHora(m) });

    return {
      dias,
      horas,
      alto: px(hasta),
      fueraAntes: atencion ? px(atencion[0]) : 0,
      fueraDespues: atencion ? px(hasta) - px(atencion[1]) : 0,
      topDespues: atencion ? px(atencion[1]) : 0,
    };
  });

  constructor() {
    this.entrenamientoService.listar().subscribe({
      next: (lista) => {
        this.entrenamientos.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.error.set(
          'No se pudieron cargar los entrenamientos: la grilla solo muestra los alquileres.',
        );
      },
    });
  }

  moverSemana(semanas: number) {
    this.inicioSemana.update((lunes) => sumarDias(lunes, semanas * 7));
  }

  irAHoy() {
    this.inicioSemana.set(lunesDe(new Date()));
  }

  elegirCancha(valor: string) {
    this.canchaElegida.set(valor ? Number(valor) : null);
  }

  titulo(b: Bloque): string {
    const etiqueta =
      b.tipo === 'ENTRENAMIENTO'
        ? 'Entrenamiento'
        : b.estado === 'FINALIZADO'
          ? 'Alquiler finalizado'
          : 'Alquiler reservado';
    return `${etiqueta} · ${b.titulo} · ${b.horario.replace('-', ' – ')}`;
  }
}
