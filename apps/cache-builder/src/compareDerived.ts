import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface CompareArgs {
  derivedPath: string;
  referencePath: string;
  limit: number;
}

const COLUMNS_TO_COMPARE = [
  'NOMBRE',
  'NACIONALIDAD',
  'DORSAL',
  'ALTURA',
  'PESO',
  'PIE',
  'CLUB',
  'PT',
  'CT',
  'LIB',
  'SA',
  'LA',
  'CCD',
  'CC',
  'VOL',
  'MP',
  'EX',
  'SD',
  'DC',
  'MEJOR PROMEDIO',
  'PROMEDIO CENSANTE',
  'DESTREZA ATAQUE',
  'FINIQUITO',
  'VELOCIDAD',
  'EXPLOSIVIDAD',
  'PROMEDIO AGILIDADES',
  'POTENCIA DE PATADA',
  'DESTREZA DEFENSA',
  'RECUPERACION DE BALÓN',
  'ALETISMO',
  'JUEGO AEREO',
  'CREATIVIDAD',
  'REGATE',
  'HAB REGATE',
  'POSICION',
  'REACCION',
  'CAP MANDO',
  'PASES',
  'GOLEADOR',
  '1-1 GOL',
  'JUG POSTE',
  'NO OFFSIDE',
  'MID SHOOT',
  'LADO',
  'CENTRO',
  'PENALES',
  'PASE 1 TOQ',
  'EXTERIOR',
  'MARCA MAN',
  'ENTRADAS',
  'COBERTURA',
  'SI OFFSIDE',
  'PARAPENAL',
  'ACHIQUE 1-1',
  'SAQUE LARG',
  'ATK',
  'TEC',
  'RES',
  'DEF',
  'FUE',
  'VEL',
] as const;

function parseArgs(): CompareArgs {
  const [, , derivedArg, referenceArg, limitArg] = process.argv;
  return {
    derivedPath: resolve(process.cwd(), derivedArg ?? 'data/processed/table1.json'),
    referencePath: resolve(process.cwd(), referenceArg ?? 'data/reference/1.json'),
    limit: limitArg ? Number(limitArg) : 20,
  };
}

function loadJson(path: string) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

export function compareDerived(args: CompareArgs) {
  const derivedRows = loadJson(args.derivedPath);
  const referenceRows = loadJson(args.referencePath);
  const derivedById = new Map<string, Record<string, unknown>>();
  derivedRows.forEach((row: Record<string, unknown>) => {
    derivedById.set(String(row.ID), row);
  });

  const mismatches: Array<{
    id: string;
    column: string;
    derived: unknown;
    reference: unknown;
  }> = [];

  referenceRows.forEach((reference: Record<string, unknown>) => {
    const id = String(reference.ID);
    const derived = derivedById.get(id);
    if (!derived) {
      mismatches.push({
        id,
        column: '*missing*',
        derived: null,
        reference: 'row not found',
      });
      return;
    }
    COLUMNS_TO_COMPARE.forEach((column) => {
      if (!(column in reference)) {
        return;
      }
      const expected = reference[column];
      const actual = derived[column];
      if (!valuesEqual(actual, expected)) {
        mismatches.push({
          id,
          column,
          derived: actual ?? null,
          reference: expected ?? null,
        });
      }
    });
  });

  if (!mismatches.length) {
    console.log('✅ No mismatches detected for selected columns.');
    return;
  }

  console.log(`⚠️  Found ${mismatches.length} mismatches. Showing first ${args.limit}:`);
  mismatches.slice(0, args.limit).forEach((item) => {
    console.log(
      `ID ${item.id} · ${item.column} · derived=${formatValue(item.derived)} · reference=${formatValue(
        item.reference,
      )}`,
    );
  });
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }
  if (a == null && b == null) {
    return true;
  }
  if (typeof a === 'number' || typeof b === 'number') {
    const numA = typeof a === 'number' ? a : Number(a);
    const numB = typeof b === 'number' ? b : Number(b);
    if (Number.isNaN(numA) || Number.isNaN(numB)) {
      return false;
    }
    return Math.abs(numA - numB) < 0.5;
  }
  return String(a ?? '').trim() === String(b ?? '').trim();
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '∅';
  }
  return String(value);
}

function main() {
  const args = parseArgs();
  compareDerived(args);
}

if (process.argv[1] && process.argv[1].includes('compareDerived')) {
  main();
}
