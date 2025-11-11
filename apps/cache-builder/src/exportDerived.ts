import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import {
  buildShopTagIndex,
  readShopMlFile,
  readTable0FromXlsx,
  validateTable0Dataset,
} from '@anfpes/data-ingest';
import { computeDerivedPlayers } from '@anfpes/engine';
import type { RawPlayer } from '@anfpes/data-ingest';

interface DerivedCliArgs {
  tablePath: string;
  shopPath: string;
  outputDir: string;
}

function parseArgs(argv: string[]): DerivedCliArgs {
  const [, , tableArg, shopArg, outputArg] = argv;
  if (!tableArg || !shopArg) {
    console.error(
      'Usage: npm run export:derived -- <table0.{json|xlsx}> <ML.txt> [outputDir]',
    );
    process.exit(1);
  }
  return {
    tablePath: resolve(process.cwd(), tableArg),
    shopPath: resolve(process.cwd(), shopArg),
    outputDir: resolve(process.cwd(), outputArg ?? 'data/processed'),
  };
}

function ensureDir(dir: string) {
  mkdirSync(dir, { recursive: true });
}

function writeJson(path: string, data: unknown) {
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
}

function sha(payload: string): string {
  return createHash('sha256').update(payload).digest('hex');
}

export function exportDerived(args: DerivedCliArgs) {
  const { tablePath, shopPath, outputDir } = args;
  console.log(`Reading inputs: table=${tablePath}, shop=${shopPath}`);

  const rawPlayers = loadRawPlayers(tablePath);
  validateTable0Dataset(rawPlayers, { requiredColumns: ['ID'] });

  const shopEntries = readShopMlFile(shopPath);
  const shopIndex = buildShopTagIndex(shopEntries);

  const derived = computeDerivedPlayers(
    rawPlayers.map((raw) => ({ raw, shopTags: shopIndex })),
  );

  ensureDir(outputDir);
  const derivedPath = join(outputDir, 'table1.json');
  const payload = JSON.stringify(derived, null, 2);
  writeFileSync(derivedPath, payload, 'utf-8');

  const meta = {
    sourceTable: tablePath,
    sourceShop: shopPath,
    generatedAt: new Date().toISOString(),
    rowCount: derived.length,
    sha256: sha(payload),
  };
  writeJson(join(outputDir, 'table1.meta.json'), meta);
  console.log(`Exported ${derived.length} derived rows to ${derivedPath}`);
}

export function main() {
  const args = parseArgs(process.argv);
  exportDerived(args);
}

const invokedUrl = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : undefined;

if (invokedUrl === import.meta.url) {
  main();
}

function loadRawPlayers(tablePath: string): RawPlayer[] {
  if (tablePath.toLowerCase().endsWith('.json')) {
    const payload = readFileSync(tablePath, 'utf-8');
    const data = JSON.parse(payload);
    if (!Array.isArray(data)) {
      throw new Error(`Expected array in ${tablePath}`);
    }
    return data as RawPlayer[];
  }
  return readTable0FromXlsx(tablePath);
}
