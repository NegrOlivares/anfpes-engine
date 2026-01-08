/**
 * Utilities for exporting and importing data as JSON files
 */

export interface ExportMetadata {
  version: string;
  exportedAt: string;
  appName: string;
}

export interface ExportedData<T> {
  metadata: ExportMetadata;
  data: T;
}

/**
 * Download data as JSON file
 */
export function downloadJSON<T>(
  data: T,
  filename: string,
  metadata?: Partial<ExportMetadata>,
): void {
  const exportData: ExportedData<T> = {
    metadata: {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      appName: 'Cesante Manager',
      ...metadata,
    },
    data,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Read JSON file from user
 */
export function importJSON<T>(
  onSuccess: (data: T, metadata: ExportMetadata) => void,
  onError: (error: string) => void,
): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      onError('No se seleccionó ningún archivo');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content) as ExportedData<T>;

        if (!parsed.metadata || !parsed.data) {
          onError('Formato de archivo inválido');
          return;
        }

        onSuccess(parsed.data, parsed.metadata);
      } catch (error) {
        onError(
          `Error al leer el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        );
      }
    };

    reader.onerror = () => {
      onError('Error al leer el archivo');
    };

    reader.readAsText(file);
  };

  input.click();
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(prefix: string, extension = 'json'): string {
  const date = new Date();
  const timestamp = date.toISOString().replace(/[:.]/g, '-').split('T')[0];
  return `${prefix}_${timestamp}.${extension}`;
}

/**
 * Validate imported data structure
 */
export function validateImportedData<T>(
  data: unknown,
  validator: (data: any) => data is T,
): data is T {
  return validator(data);
}
