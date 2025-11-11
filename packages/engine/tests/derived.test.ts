import { describe, expect, test } from 'vitest';
import type { RawPlayer, ShopTagIndex } from '@anfpes/data-ingest';
import { computeDerivedPlayer } from '../src';

const baseRaw: RawPlayer = {
  ID: 10,
  NAME: 'Jugador X',
  NACIONALIDAD: 'Chile',
  NATIONALITY: 'Chile',
  'CLUB TEAM': '',
  'INTERNATIONAL NUMBER': 25,
  'CLASSIC NUMBER': 0,
  'REGISTERED POSITION': 0,
  GK: 1,
  SWP: 0,
  CB: 1,
  SB: 1,
  DMF: 1,
  WB: 1,
  CMF: 1,
  SM: 1,
  AMF: 0,
  WF: 1,
  SS: 0,
  CF: 0,
  'FAVOURED SIDE': 'R',
  ATTACK: 80,
  DEFENSE: 70,
  BALANCE: 62,
  STAMINA: 78,
  'TOP SPEED': 85,
  ACCELERATION: 82,
  RESPONSE: 75,
  AGILITY: 80,
  'DRIBBLE ACCURACY': 78,
  'DRIBBLE SPEED': 80,
  'SHORT PASS ACCURACY': 77,
  'SHORT PASS SPEED': 76,
  'LONG PASS ACCURACY': 74,
  'LONG PASS SPEED': 73,
  'SHOT ACCURACY': 81,
  'SHOT POWER': 84,
  'SHOT TECHNIQUE': 79,
  'FREE KICK ACCURACY': 70,
  SWERVE: 68,
  HEADING: 72,
  JUMP: 71,
  TECHNIQUE: 83,
  AGGRESSION: 65,
  MENTALITY: 69,
  GOALKEEPING: 90,
  TEAMWORK: 74,
  'INJURY TOLERANCE': 'A',
  CONSISTENCY: 5,
  CONDITION: 6,
  'WEAK FOOT ACCURACY': 6,
  'WEAK FOOT FREQUENCY': 6,
  DRIBBLING: 85,
  'TACTICAL DRIBBLE': 84,
  POSITIONING: 80,
  REACTION: 78,
  PLAYMAKING: 81,
  PASSING: 79,
  SCORING: 82,
  '1-1 SCORING': 75,
  'POST PLAYER': 70,
  LINES: 72,
  'MIDDLE SHOOTING': 73,
  SIDE: 74,
  CENTRE: 76,
  PENALTIES: 77,
  '1-TOUCH PASS': 78,
  OUTSIDE: 71,
  MARKING: 65,
  SLIDING: 68,
  COVERING: 69,
  'D-LINE CONTROL': 60,
  'PENALTY STOPPER': 55,
  '1-ON-1 STOPPER': 58,
  'LONG THROW': 62,
  AGE: 25,
  WEIGHT: 78,
};

const shopTags: ShopTagIndex = new Map([['jugador x', 'Shop 1']]);

describe('computeDerivedPlayer', () => {
  test('derives demarcation, club and ratings', () => {
    const player = computeDerivedPlayer({
      raw: baseRaw,
      shopTags,
    });

    expect(player.CLUB).toBe('Selección Chile');
    expect(player.D).toBe('GK');
    expect(player.E).toBe('CB');
    expect(player.M).toBe('RB');
    expect(player.A).toBe('DMF');
    expect(player['FAVOURED SIDE']).toBe('R');
    expect(player.RB).toBe(1);
    expect(player.LB).toBe(0);
    expect(player.RWF).toBe(1);
    expect(player.LWF).toBe(0);

    expect(typeof player.PT).toBe('number');
    expect(typeof player['DESTREZA ATAQUE']).toBe('number');
    expect(typeof player['POTENCIA DE PATADA']).toBe('number');
    expect(player['MEJOR PROMEDIO']).toBeGreaterThan(0);
    expect(player['MEJOR PROMEDIO']).toBeGreaterThanOrEqual(player['PT'] as number);
    expect(player['PROMEDIO CENSANTE']).toBeGreaterThan(0);
    expect(player.ATK).toBeGreaterThan(0);
    expect(player.DEF).toBeCloseTo(baseRaw.DEFENSE as number, 0);
  });
});
