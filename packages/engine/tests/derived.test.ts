import { describe, expect, test } from 'vitest';
import type { RawPlayer, ShopTagIndex } from '@anfpes/data-ingest';
import { computeDerivedPlayer } from '../src';

const sampleRaw: RawPlayer = {
  ID: 10,
  NAME: 'Jugador X',
  NATIONALITY: 'Chile',
  'CLUB TEAM': 'Colo-Colo',
  HEIGHT: 178,
  WEIGHT: 72,
  AGE: 24,
  'STRONG FOOT': 'Derecho',
  ATTACK: 85,
  DEFENSE: 70,
  'TOP SPEED': 90,
  ACCELERATION: 88,
  'DRIBBLE ACCURACY': 83,
  'SHORT PASS ACCURACY': 80,
  'SHORT PASS SPEED': 79,
};

const sampleShopIndex: ShopTagIndex = new Map([['jugador x', 'Shop 1']]);

describe('computeDerivedPlayer', () => {
  test('copies basic columns and stats', () => {
    const derived = computeDerivedPlayer({
      raw: sampleRaw,
      shopTags: sampleShopIndex,
    });

    expect(derived.ID).toBe('10');
    expect(derived.NOMBRE).toBe('Jugador X');
    expect(derived.NACIONALIDAD).toBe('Chile');
    expect(derived.CLUB).toBe('Shop 1');
    expect(derived.ALTURA).toBe(178);
    expect(derived.PESO).toBe(72);
    expect(derived.PIE).toBe('Derecho');
    expect(derived.ATAQUE).toBe(85);
    expect(derived.DEFENSA).toBe(70);
    expect(derived['PRECISION P CORTO']).toBe(80);
    expect(typeof derived.PROMEDIO).toBe('number');
  });
});
