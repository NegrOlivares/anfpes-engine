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
};

export const LATEST_RELEASE_NOTES_VERSION = '0.1.2';
