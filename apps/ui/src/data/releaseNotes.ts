export interface ReleaseNote {
  version: string;
  title: string;
  intro?: string;
  changes: string[];
}

export const RELEASE_NOTES: Record<string, ReleaseNote> = {
  '0.1.2': {
    version: '0.1.2',
    title: 'Novedades de Cesante Manager',
    intro: 'Estos cambios se mostraran una sola vez al abrir esta version.',
    changes: [
      'Actualizacion silenciosa mejorada.',
      'Nuevo flujo de reinicio tras instalar.',
      'Mejoras visuales en perfiles de jugadores.',
      'Insercion de todas las camisetas de los 32 clubes de la ANFPES en perfiles de jugadores.',
    ],
  },
  '0.1.3': {
    version: '0.1.3',
    title: 'Novedades de Cesante Manager',
    intro: 'Estos cambios se mostraran una sola vez al abrir esta version.',
    changes: ['Mejoras visuales en el analisis de clubes.'],
  },
  '0.1.4': {
    version: '0.1.4',
    title: 'Novedades de Cesante Manager',
    intro: 'Estos cambios se mostraran una sola vez al abrir esta version.',
    changes: [
      'Nuevo Analisis del Once Probable en el modulo Club.',
      'Se abre desde el boton XI sobre la cancha del Once Titular Probable.',
      'La lectura principal resume coherencia del once, plan fuerte, riesgo principal y dependencia del equipo.',
      'Cada jugador muestra su encaje funcional por rol y permite comparar su funcion dominante con su funcion hermana.',
      'Las acciones funcionales y el Radar de Stats ayudan a ver que sostiene mejor o peor el once configurado.',
    ],
  },
};

export const LATEST_RELEASE_NOTES_VERSION = '0.1.4';
