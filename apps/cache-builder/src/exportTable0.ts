import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import {
  createStatsPlaceholder,
  readTable0FromXlsx,
  validateTable0Dataset,
} from '@anfpes/data-ingest';

export interface CliArgs {
  input: string;
  outputDir: string;
}

function parseArgs(argv: string[]): CliArgs {
  const [, , inputArg, outputArg] = argv;
  if (!inputArg) {
    console.error('Usage: npm run export:table0 -- <input.xlsx> [outputDir]');
    process.exit(1);
  }
  const input = resolve(process.cwd(), inputArg);
  const outputDir = resolve(process.cwd(), outputArg ?? 'data/processed');
  return { input, outputDir };
}

function ensureDir(path: string) {
  mkdirSync(path, { recursive: true });
}

function writeJson(path: string, data: unknown) {
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
}

function generateHash(payload: string) {
  return createHash('sha256').update(payload).digest('hex');
}

export function exportTable0({ input, outputDir }: CliArgs) {
  console.log(`Reading table 0 from ${input}`);
  const players = readTable0FromXlsx(input);
  const summary = validateTable0Dataset(players, {
    requiredColumns: ['ID'],
    idColumn: 'ID',
  });

  ensureDir(outputDir);
  const playersPath = join(outputDir, 'table0.json');
  const payload = JSON.stringify(players, null, 2);
  writeFileSync(playersPath, payload, 'utf-8');

  const metaPath = join(outputDir, 'table0.meta.json');
  const meta = {
    sourceFile: input,
    generatedAt: new Date().toISOString(),
    rowCount: players.length,
    columns: summary.columns,
    sha256: generateHash(payload),
  };
  writeJson(metaPath, meta);

  const statsPlaceholder = createStatsPlaceholder({
    notes: 'Archivo de estadisticas pendiente de integracion.',
  });
  writeJson(join(outputDir, 'stats.placeholder.json'), statsPlaceholder);

  console.log(`Exported ${players.length} players to ${playersPath}`);
}

export function main() {
  const args = parseArgs(process.argv);
  exportTable0(args);
}

const invokedUrl = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : undefined;

if (invokedUrl === import.meta.url) {
  main();
}
