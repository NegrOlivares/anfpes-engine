import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildShopTagIndex, readShopMlFile } from '@anfpes/data-ingest';
import { computeDerivedPlayers, type DerivedPlayer } from '@anfpes/engine';
import { loadRawPlayers } from './utils';

const DEMARCATION_COLUMNS = [
  'D',
  'E',
  'M',
  'A',
  'R',
  'C',
  'A_1',
  'C_1',
  'I',
  'O',
  'N',
] as const;

interface BuildArgs {
  tablePath: string;
  shopPath: string;
  outputDir: string;
  dataVersion?: string;
}

function parseArgs(argv: string[]): BuildArgs {
  const [, , tableArg, shopArg, outputArg, versionArg] = argv;
  if (!tableArg || !shopArg) {
    console.error(
      'Usage: npm run build:data -- <table0.{xlsx|json}> <ML.txt> [outputDir] [dataVersion]',
    );
    process.exit(1);
  }
  return {
    tablePath: resolve(process.cwd(), tableArg),
    shopPath: resolve(process.cwd(), shopArg),
    outputDir: resolve(process.cwd(), outputArg ?? 'data/cache'),
    dataVersion: versionArg,
  };
}

export function buildData(args: BuildArgs) {
  const { tablePath, shopPath, outputDir, dataVersion } = args;
  console.log(`Building cache from table=${tablePath} shop=${shopPath}`);

  const rawPlayers = loadRawPlayers(tablePath);
  const shopEntries = readShopMlFile(shopPath);
  const shopIndex = buildShopTagIndex(shopEntries);
  const derived = computeDerivedPlayers(
    rawPlayers.map((raw) => ({ raw, shopTags: shopIndex })),
  );

  mkdirSync(outputDir, { recursive: true });

  writeJson(join(outputDir, 'players.json'), derived);

  const clubs = buildClubList(derived);
  writeJson(join(outputDir, 'clubs.json'), clubs);

  const indicesDir = join(outputDir, 'indices');
  mkdirSync(indicesDir, { recursive: true });

  const byId = derived.reduce<Record<string, number>>((acc, player, index) => {
    acc[player.ID] = index;
    return acc;
  }, {});
  writeJson(join(indicesDir, 'byId.json'), byId);

  const byClub = clubs.reduce<Record<string, string[]>>((acc, club) => {
    acc[club.name] = club.playerIds;
    return acc;
  }, {});
  writeJson(join(indicesDir, 'byClub.json'), byClub);

  const byNationality = buildNationalityIndex(derived);
  writeJson(join(indicesDir, 'byNationality.json'), byNationality);

  const byPosition = buildPositionIndex(derived);
  writeJson(join(indicesDir, 'byPosition.json'), byPosition);

  const meta = {
    generatedAt: new Date().toISOString(),
    dataVersion: dataVersion ?? deriveVersion(tablePath),
    sources: {
      table: tablePath,
      shop: shopPath,
    },
    counts: {
      players: derived.length,
      clubs: clubs.length,
    },
    hashes: {
      players: hashObject(derived),
      clubs: hashObject(clubs),
      byId: hashObject(byId),
      byClub: hashObject(byClub),
      byNationality: hashObject(byNationality),
      byPosition: hashObject(byPosition),
    },
  };
  writeJson(join(outputDir, 'meta.json'), meta);

  console.log(`Cache written to ${outputDir}`);
}

function buildClubList(players: DerivedPlayer[]) {
  const map = new Map<string, string[]>();
  players.forEach((player) => {
    const key = String(player.CLUB ?? 'Libre');
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(player.ID);
  });
  return Array.from(map.entries()).map(([name, playerIds]) => ({ name, playerIds }));
}

function buildNationalityIndex(players: DerivedPlayer[]) {
  const map = new Map<string, string[]>();
  players.forEach((player) => {
    const key = normalizeKey(player.NACIONALIDAD ?? player.NATIONALITY, 'Desconocido');
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(player.ID);
  });
  return Object.fromEntries(map);
}

function buildPositionIndex(players: DerivedPlayer[]) {
  const map = new Map<string, string[]>();
  players.forEach((player) => {
    const slots = new Set<string>();
    DEMARCATION_COLUMNS.forEach((column) => {
      const value = player[column];
      if (typeof value === 'string' && value.trim().length > 0) {
        slots.add(value.trim());
      }
    });
    slots.forEach((label) => {
      if (!map.has(label)) {
        map.set(label, []);
      }
      map.get(label)!.push(player.ID);
    });
  });
  return Object.fromEntries(map);
}

function writeJson(path: string, data: unknown) {
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
}

function hashObject(value: unknown): string {
  const payload = JSON.stringify(value);
  return createHash('sha256').update(payload).digest('hex');
}

function deriveVersion(tablePath: string): string {
  const base = tablePath.replace(/\\/g, '/').split('/').pop() ?? 'table0';
  const stamp = new Date().toISOString().slice(0, 10);
  return `${base.replace(/\.[^.]+$/, '')}-${stamp}`;
}

function normalizeKey(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  if (value !== null && value !== undefined) {
    const text = String(value).trim();
    if (text.length > 0) {
      return text;
    }
  }
  return fallback;
}

function main() {
  const args = parseArgs(process.argv);
  buildData(args);
}

const invokedUrl = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : undefined;

if (invokedUrl === import.meta.url) {
  main();
}
