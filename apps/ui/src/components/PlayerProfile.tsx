import type { DerivedPlayer } from '@anfpes/engine';
import { RadarChart } from './RadarChart';
import {
  PositionBadges,
  getPlayerPositions,
  getPositionLine,
  getPositionFullName,
} from './PositionBadges';
import { PositionMap, getActivePositionCells } from './PositionMap';
import { useCacheStore, useSelectedPlayer } from '../store/cacheStore';
import { formatPlayerValue, ensureNumber } from '../utils/format';
import {
  formatClub,
  formatFoot,
  formatNationality,
  formatSelectionDisplay,
  formatSkinTone,
  getFieldLabel,
  SPECIAL_SKILL_FIELDS,
} from '../utils/playerDisplay';
import { ANFPES_CLUBS, LEGEND_PLAYERS, ML_PLAYERS } from '../data/playerStatus';
import { getFlagImagePath, getClubShieldPath } from '../utils/imageHelpers';
import { getStatColor } from '../types/table';
import { getNationalityInfo } from '../data/nationalities';

const NATIONAL_SELECTION_FIELD = 'nro selección' as keyof DerivedPlayer;
const CLASSIC_SELECTION_FIELD = 'nro clasico' as keyof DerivedPlayer;

function normalizeName(raw: string): string {
  return (raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function aliasName(raw: string): string {
  const n = normalizeName(raw);
  const aliases: Array<{ find: RegExp; to: string }> = [
    { find: /\br m\b|\br madrid\b|\breal m\b/, to: 'real madrid' },
    { find: /\bman utd\b|\bmanchester u\b/, to: 'manchester united' },
    { find: /\bman city\b/, to: 'manchester city' },
    { find: /\batletico\b|\batletico madrid\b|\bat madrid\b/, to: 'atlético madrid' },
    { find: /\binter milan\b/, to: 'inter' },
    { find: /\bbarca\b/, to: 'barcelona' },
    { find: /\bdep la coruna\b|\bdeportivo\b/, to: 'deportivo' },
    { find: /\bsaint etienne\b/, to: 'saint-etienne' },
    { find: /\bnec nijmegen\b/, to: 'nec' },
    { find: /\bbetis\b/, to: 'betis' },
    { find: /\bnewcastle u\b/, to: 'newcastle' },
    { find: /\bparis sg\b|\bpsg\b/, to: 'psg' },
  ];
  for (const a of aliases) {
    if (a.find.test(n)) return a.to;
  }
  return n;
}

function getShirtStyle(
  origin: 'club' | 'seleccion' | 'clasica' | 'shop' | 'libre',
  clubName: string,
  nationality: string,
) {
  const name = aliasName(clubName || nationality || '');

  // Paleta por clubes/selecciones (tokens de bÃºsqueda en minÃºsculas)
  const patterns: Array<{ token: string; background: string; color: string }> = [
    {
      token: 'milan',
      background: 'repeating-linear-gradient(90deg,#b00 0 18%,#111 18% 36%)',
      color: '#f2f2f2',
    },
    {
      token: 'barcelona',
      background: 'linear-gradient(90deg,#00205b 0 50%,#b20032 50% 100%)',
      color: '#ffd700',
    },
    {
      token: 'boca',
      background: 'linear-gradient(#0b1a44 0 40%,#f6c800 40% 60%,#0b1a44 60% 100%)',
      color: '#fff',
    },
    {
      token: 'river',
      background: 'linear-gradient(135deg,#fff 0 46%,#d00000 46% 54%,#fff 54% 100%)',
      color: '#111',
    },
    { token: 'real madrid', background: '#f7f7f7', color: '#5b2ba8' },
    {
      token: 'ajax',
      background: 'linear-gradient(90deg,#fff 0 35%,#c00 35% 65%,#fff 65% 100%)',
      color: '#222',
    },
    {
      token: 'arsenal',
      background: 'linear-gradient(90deg,#c00000 0 70%,#fff 70% 100%)',
      color: '#002244',
    },
    {
      token: 'monaco',
      background: 'linear-gradient(135deg,#c00 0 50%,#fff 50% 100%)',
      color: '#111',
    },
    { token: 'saint-etienne', background: '#0b7d3c', color: '#fefefe' },
    {
      token: 'ascoli',
      background: 'repeating-linear-gradient(90deg,#fff 0 20%,#000 20% 40%)',
      color: '#000',
    },
    {
      token: 'aston villa',
      background: 'linear-gradient(90deg,#6a1b4d 0 70%,#6ec6ff 70% 100%)',
      color: '#fff',
    },
    {
      token: 'atalanta',
      background: 'repeating-linear-gradient(90deg,#0b3b8c 0 33%,#111 33% 66%)',
      color: '#fefefe',
    },
    {
      token: 'athletic',
      background: 'repeating-linear-gradient(90deg,#c00 0 25%,#fff 25% 50%)',
      color: '#111',
    },
    { token: 'az ', background: '#c00', color: '#fefefe' },
    { token: 'bayern', background: '#c00', color: '#fff' },
    { token: 'benfica', background: '#c00', color: '#fff' },
    {
      token: 'besiktas',
      background: 'repeating-linear-gradient(90deg,#fff 0 20%,#000 20% 40%)',
      color: '#000',
    },
    {
      token: 'blackburn',
      background: 'linear-gradient(90deg,#0b3b8c 0 50%,#fff 50% 100%)',
      color: '#e4002b',
    },
    { token: 'bolton', background: '#fff', color: '#0b1a44' },
    {
      token: 'atlético madrid',
      background: 'repeating-linear-gradient(90deg,#c00 0 25%,#fff 25% 50%)',
      color: '#00205b',
    },
    {
      token: 'atlético',
      background: 'repeating-linear-gradient(90deg,#c00 0 25%,#fff 25% 50%)',
      color: '#00205b',
    },
    { token: 'gimnastic', background: '#c00', color: '#fefefe' },
    { token: 'osasuna', background: '#b00', color: '#0b1a44' },
    {
      token: 'cagliari',
      background: 'linear-gradient(90deg,#b00 0 50%,#001437 50% 100%)',
      color: '#fff',
    },
    {
      token: 'catania',
      background:
        'repeating-linear-gradient(90deg,#55bbee 0 50%,#c00 50% 70%,#55bbee 70% 100%)',
      color: '#fff',
    },
    {
      token: 'celtic',
      background: 'repeating-linear-gradient(90deg,#0b7d3c 0 16%,#fff 16% 32%)',
      color: '#111',
    },
    { token: 'charlton', background: '#c00', color: '#fff' },
    { token: 'chelsea', background: '#0033a0', color: '#fff' },
    { token: 'chievo', background: '#ffda00', color: '#0b3b8c' },
    {
      token: 'classic argentina',
      background:
        'linear-gradient( #fff 0% 4.5%, transparent 4.5% 100%),repeating-linear-gradient(90deg, transparent 0 23%, 	#6ec6ff 23% 27.5%, 	#FFF 27.5% 36.5%, 	#6ec6ff 36.5% 45.5%, 	#FFF 45.5% 54.5%, 	#6ec6ff 54.5% 63.5%, 	#FFF 63.5% 72.5%, 	#6ec6ff 72.5% 77%, 	transparent 77% 100%),linear-gradient(60deg, transparent 0 60%, #fff 60% 73%, #6ec6ff 73% 82%, #fff 82% 100%),linear-gradient(300deg, transparent 0 60%, #fff 60% 73%, #6ec6ff 73% 82%, #fff 82% 100%)',
      color: '#111',
    },
    {
      token: 'classic brazil',
      background: 'linear-gradient( #198a43 0% 4.5%, #f6c800 4.5% 100%)',
      color: '#198a43',
    },
    { token: 'classic england', background: '#fff', color: '#0b1a44' },
    { token: 'classic france', background: '#00205b', color: '#fff' },
    { token: 'classic germany', background: '#fff', color: '#000' },
    { token: 'classic italy', background: '#0b3b8c', color: '#fff' },
    {
      token: 'classic netherlands',
      background: 'linear-gradient( #111 -5% 4.5%, #f58025 4.5% 100%)',
      color: '#111',
    },
    {
      token: 'club brugge',
      background: 'repeating-linear-gradient(90deg,#0b3b8c 0 33%,#111 33% 66%)',
      color: '#fefefe',
    },
    {
      token: 'sedan',
      background: 'linear-gradient(90deg,#0b7d3c 0 60%,#b00 60% 100%)',
      color: '#fff',
    },
    {
      token: 'djurgardens',
      background: 'repeating-linear-gradient(90deg,#7fbde9 0 33%,#003c7d 33% 66%)',
      color: '#d4af37',
    },
    { token: 'dynamo kiev', background: '#fff', color: '#0033a0' },
    { token: 'empoli', background: '#0b3b8c', color: '#fff' },
    { token: 'everton', background: '#0033a0', color: '#fff' },
    { token: 'fc copenhagen', background: '#fff', color: '#0033a0' },
    {
      token: 'fc groningen',
      background: 'linear-gradient(90deg,#fff 0 33%,#0b7d3c 33% 66%,#fff 66% 100%)',
      color: '#111',
    },
    { token: 'lorient', background: '#f58025', color: '#000' },
    { token: 'nantes', background: '#ffda00', color: '#0b7d3c' },
    {
      token: 'porto',
      background:
        'repeating-linear-gradient(90deg,#0033a0 0 50%,#fff 50% 70%,#0033a0 70% 100%)',
      color: '#fefefe',
    },
    {
      token: 'psg',
      background: 'linear-gradient(90deg,#0a1445 0 40%,#c00 40% 60%,#0a1445 60% 100%)',
      color: '#fff',
    },
    {
      token: 'feyenoord',
      background: 'linear-gradient(90deg,#c00 0 50%,#fff 50% 100%)',
      color: '#000',
    },
    { token: 'fiorentina', background: '#5e2d8a', color: '#fff' },
    {
      token: 'fulham',
      background: 'linear-gradient(90deg,#fff 0 70%,#000 70% 100%)',
      color: '#c00',
    },
    {
      token: 'galatasaray',
      background: 'linear-gradient(90deg,#c00 0 50%,#f6c800 50% 100%)',
      color: '#000',
    },
    { token: 'getafe', background: '#0033a0', color: '#fff' },
    {
      token: 'bordeaux',
      background: 'linear-gradient(180deg,#0a1445 0 75%,#fff 75% 100%)',
      color: '#e4002b',
    },
    {
      token: 'inter',
      background: 'repeating-linear-gradient(90deg,#0b3b8c 0 33%,#111 33% 66%)',
      color: '#d4af37',
    },
    {
      token: 'juventus',
      background: 'repeating-linear-gradient(90deg,#fff 0 20%,#000 20% 40%)',
      color: '#000',
    },
    { token: 'lazio', background: '#7fbde9', color: '#111' },
    {
      token: 'levante',
      background: 'repeating-linear-gradient(90deg,#0b3b8c 0 50%,#6a1b4d 50% 100%)',
      color: '#ffd700',
    },
    { token: 'lille', background: '#c00', color: '#0a1445' },
    { token: 'liverpool', background: '#c00', color: '#fff' },
    { token: 'livorno', background: '#6a1b4d', color: '#fff' },
    { token: 'manchester city', background: '#7fbde9', color: '#111' },
    {
      token: 'manchester united',
      background: 'linear-gradient(90deg,#c00 0 70%,#fff 70% 100%)',
      color: '#000',
    },
    {
      token: 'messina',
      background: 'linear-gradient(90deg,#ffda00 0 50%,#c00 50% 100%)',
      color: '#111',
    },
    {
      token: 'middlesbrough',
      background: 'linear-gradient(180deg,#c00 0 60%,#fff 60% 70%,#c00 70% 100%)',
      color: '#fff',
    },
    {
      token: 'nec ',
      background: 'linear-gradient(90deg,#c00 0 33%,#0b7d3c 33% 66%,#000 66% 100%)',
      color: '#fff',
    },
    {
      token: 'nac breda',
      background: 'linear-gradient(135deg,#ffda00 0 60%,#000 60% 100%)',
      color: '#fff',
    },
    {
      token: 'newcastle',
      background: 'repeating-linear-gradient(90deg,#fff 0 20%,#000 20% 40%)',
      color: '#000',
    },
    {
      token: 'nice',
      background: 'repeating-linear-gradient(90deg,#c00 0 50%,#000 50% 100%)',
      color: '#fff',
    },
    {
      token: 'olympiacos',
      background: 'repeating-linear-gradient(90deg,#c00 0 25%,#fff 25% 50%)',
      color: '#111',
    },
    { token: 'marseille', background: '#fff', color: '#00a3e0' },
    {
      token: 'lyon',
      background: 'linear-gradient(90deg,#fff 0 33%,#0033a0 33% 66%,#c00 66% 100%)',
      color: '#111',
    },
    { token: 'palermo', background: '#f5c1d1', color: '#000' },
    { token: 'panathinaikos', background: '#0b7d3c', color: '#fff' },
    {
      token: 'paris saint-germain',
      background: 'linear-gradient(90deg,#0a1445 0 40%,#c00 40% 60%,#0a1445 60% 100%)',
      color: '#fff',
    },
    {
      token: 'parma',
      background: 'linear-gradient(90deg,#ffda00 0 50%,#0033a0 50% 100%)',
      color: '#fff',
    },
    {
      token: 'pes united',
      background: 'linear-gradient(#ffda00 0 50%,#0a1445 50% 100%)',
      color: '#fff',
    },
    { token: 'portsmouth', background: '#0033a0', color: '#ffd700' },
    {
      token: 'psv',
      background: 'repeating-linear-gradient(90deg,#c00 0 25%,#fff 25% 50%)',
      color: '#000',
    },
    {
      token: 'betis',
      background: 'repeating-linear-gradient(90deg,#0b7d3c 0 33%,#fff 33% 66%)',
      color: '#111',
    },
    {
      token: 'racing',
      background: 'linear-gradient(90deg,#fff 0 50%,#0b7d3c 50% 100%)',
      color: '#000',
    },
    {
      token: 'real sociedad',
      background: 'repeating-linear-gradient(90deg,#0033a0 0 33%,#fff 33% 66%)',
      color: '#111',
    },
    {
      token: 'real zaragoza',
      background: 'linear-gradient(90deg,#fff 0 70%,#0033a0 70% 100%)',
      color: '#c00',
    },
    { token: 'celta', background: '#7fbde9', color: '#111' },
    {
      token: 'deportivo',
      background: 'repeating-linear-gradient(90deg,#0033a0 0 33%,#fff 33% 66%)',
      color: '#111',
    },
    {
      token: 'espanyol',
      background: 'repeating-linear-gradient(90deg,#fff 0 33%,#0033a0 33% 66%)',
      color: '#111',
    },
    {
      token: 'mallorca',
      background: 'linear-gradient(90deg,#c00 0 50%,#000 50% 100%)',
      color: '#ffda00',
    },
    {
      token: 'rangers',
      background: 'linear-gradient(90deg,#0033a0 0 70%,#fff 70% 100%)',
      color: '#c00',
    },
    {
      token: 'lens',
      background:
        'repeating-linear-gradient(90deg,#ffda00 0 50%,#c00 50% 70%,#ffda00 70% 100%)',
      color: '#000',
    },
    {
      token: 'reading',
      background: 'repeating-linear-gradient(90deg,#0033a0 0 33%,#fff 33% 66%)',
      color: '#c00',
    },
    { token: 'reggina', background: '#6a1b4d', color: '#fff' },
    {
      token: 'rkc',
      background: 'linear-gradient(90deg,#ffda00 0 60%,#0033a0 60% 100%)',
      color: '#111',
    },
    {
      token: 'roda',
      background: 'linear-gradient(90deg,#ffda00 0 60%,#000 60% 100%)',
      color: '#fff',
    },
    {
      token: 'rosenborg',
      background: 'linear-gradient(90deg,#fff 0 70%,#000 70% 100%)',
      color: '#000',
    },
    { token: 'anderlecht', background: '#5e2d8a', color: '#fff' },
    {
      token: 'sampdoria',
      background:
        'linear-gradient(#0033a0 0 35%,#fff 35% 42%,#c00 42% 49%,#000 49% 56%,#fff 56% 63%,#0033a0 63% 100%)',
      color: '#fff',
    },
    {
      token: 'sao paulo',
      background: 'linear-gradient(#fff 0 50%,#c00 50% 55%,#111 55% 60%,#fff 60% 100%)',
      color: '#111',
    },
    {
      token: 'excelsior',
      background: 'repeating-linear-gradient(90deg,#c00 0 50%,#000 50% 100%)',
      color: '#fff',
    },
    {
      token: 'heerenveen',
      background: 'repeating-linear-gradient(90deg,#0033a0 0 33%,#fff 33% 66%)',
      color: '#c00',
    },
    { token: 'sevilla', background: '#fff', color: '#c00' },
    {
      token: 'sheffield united',
      background: 'repeating-linear-gradient(90deg,#c00 0 25%,#fff 25% 50%)',
      color: '#000',
    },
    {
      token: 'siena',
      background: 'repeating-linear-gradient(90deg,#fff 0 20%,#000 20% 40%)',
      color: '#000',
    },
    {
      token: 'sparta rotterdam',
      background: 'repeating-linear-gradient(90deg,#c00 0 33%,#fff 33% 66%)',
      color: '#000',
    },
    {
      token: 'sporting lisbon',
      background: 'repeating-linear-gradient(90deg,#0b7d3c 0 33%,#fff 33% 66%)',
      color: '#111',
    },
    {
      token: 'stade rennais',
      background: 'linear-gradient(90deg,#c00 0 50%,#000 50% 100%)',
      color: '#fff',
    },
    { token: 'torino', background: '#6a1b4d', color: '#fff' },
    {
      token: 'tottenham',
      background: 'linear-gradient(90deg,#fff 0 70%,#0a1445 70% 100%)',
      color: '#ffda00',
    },
    { token: 'toulouse', background: '#7e57c2', color: '#fff' },
    {
      token: 'udinese',
      background: 'repeating-linear-gradient(90deg,#fff 0 20%,#000 20% 40%)',
      color: '#000',
    },
    {
      token: 'valencia',
      background: 'linear-gradient(90deg,#fff 0 70%,#000 70% 100%)',
      color: '#f58025',
    },
    { token: 'valenciennes', background: '#c00', color: '#fff' },
    { token: 'villarreal', background: '#ffda00', color: '#0033a0' },
    {
      token: 'vitesse',
      background:
        'repeating-linear-gradient(90deg,#ffda00 0 50%,#000 50% 70%,#ffda00 70% 100%)',
      color: '#000',
    },
    {
      token: 'watford',
      background: 'linear-gradient(90deg,#ffda00 0 60%,#000 60% 80%,#c00 80% 100%)',
      color: '#fff',
    },
    {
      token: 'west ham',
      background: 'linear-gradient(90deg,#6a1b4d 0 70%,#7fbde9 70% 100%)',
      color: '#fff',
    },
    {
      token: 'wigan',
      background: 'repeating-linear-gradient(90deg,#0033a0 0 50%,#fff 50% 100%)',
      color: '#000',
    },
    {
      token: 'willem ii',
      background:
        'repeating-linear-gradient(90deg,#c00 0 33%,#fff 33% 66%,#0033a0 66% 100%)',
      color: '#000',
    },
    { token: 'sevilla f.c', background: '#fff', color: '#c00' },
  ];

  const match = patterns.find((p) => name.includes(p.token));
  if (match) return { background: match.background, color: match.color };

  // Selecciones conocidas (genÃ©ricas por paÃ­s si no matchea club)
  if (name.includes('argentina'))
    return {
      background: 'repeating-linear-gradient(90deg,#6ec6ff 0 33%,#fff 33% 66%)',
      color: '#111',
    };
  if (name.includes('brasil') || name.includes('brazil'))
    return {
      background: 'linear-gradient(#f6c800 0 50%,#198a43 50% 100%)',
      color: '#0b1a44',
    };
  if (name.includes('chile'))
    return {
      background: 'linear-gradient(135deg,#c00 0 60%,#0033a0 60% 100%)',
      color: '#fff',
    };
  if (name.includes('alemania') || name.includes('germany'))
    return { background: '#fff', color: '#000' };
  if (name.includes('italia') || name.includes('italy'))
    return { background: '#0b3b8c', color: '#fff' };
  if (name.includes('francia') || name.includes('france'))
    return { background: '#00205b', color: '#fff' };
  if (name.includes('inglaterra') || name.includes('england'))
    return { background: '#fff', color: '#0b1a44' };
  if (name.includes('uruguay'))
    return { background: 'linear-gradient(#7fbde9 0 70%,#000 70% 100%)', color: '#fff' };
  if (name.includes('paraguay'))
    return {
      background: 'repeating-linear-gradient(90deg,#c00 0 33%,#fff 33% 66%)',
      color: '#0033a0',
    };
  if (name.includes('peru'))
    return {
      background: 'linear-gradient(135deg,#fff 0 60%,#c00 60% 100%)',
      color: '#111',
    };
  if (name.includes('portugal'))
    return {
      background: 'linear-gradient(90deg,#6a1b4d 0 70%,#0b7d3c 70% 100%)',
      color: '#ffd700',
    };
  if (name.includes('colombia'))
    return {
      background: 'linear-gradient(90deg,#ffda00 0 50%,#0033a0 50% 100%)',
      color: '#c00',
    };
  if (name.includes('mexico') || name.includes('mÃ©xico'))
    return {
      background: 'linear-gradient(90deg,#0b7d3c 0 60%,#fff 60% 100%)',
      color: '#c00',
    };

  // Shop / Libre fallback
  if (origin === 'shop') return { background: '#fff', color: '#111' };
  if (origin === 'libre') return { background: '#111', color: '#f7f7f7' };

  // GenÃ©rico
  return { background: '#0f2238', color: '#f7f7f7' };
}

function resolveDorsal(player: DerivedPlayer): {
  dorsal: string;
  dorsalName: string;
  origin: 'club' | 'seleccion' | 'clasica' | 'shop' | 'libre';
} {
  const clubDorsal = player.DORSAL;
  const seleccionDorsal = player[
    NATIONAL_SELECTION_FIELD
  ] as DerivedPlayer[keyof DerivedPlayer];
  const clasicaDorsal = player[
    CLASSIC_SELECTION_FIELD
  ] as DerivedPlayer[keyof DerivedPlayer];

  const isValidDorsal = (v: DerivedPlayer[keyof DerivedPlayer]) => {
    const num = Number(v);
    return !Number.isNaN(num) && num >= 1;
  };

  const originClub =
    player.CLUB && String(player.CLUB).trim() !== '' && isValidDorsal(clubDorsal);
  const originSel =
    player[NATIONAL_SELECTION_FIELD] &&
    String(player[NATIONAL_SELECTION_FIELD]).trim() !== '' &&
    isValidDorsal(seleccionDorsal);
  const originClasica =
    player[CLASSIC_SELECTION_FIELD] &&
    String(player[CLASSIC_SELECTION_FIELD]).trim() !== '' &&
    isValidDorsal(clasicaDorsal);

  let dorsalVal: DerivedPlayer[keyof DerivedPlayer] = undefined;
  let origin: 'club' | 'seleccion' | 'clasica' | 'shop' | 'libre' = 'libre';

  if (originClub) {
    dorsalVal = clubDorsal;
    origin = 'club';
  } else if (originSel) {
    dorsalVal = seleccionDorsal;
    origin = 'seleccion';
  } else if (originClasica) {
    dorsalVal = clasicaDorsal;
    origin = 'clasica';
  }

  const dorsal =
    dorsalVal !== undefined && dorsalVal !== null && String(dorsalVal).trim() !== ''
      ? String(dorsalVal)
      : '';
  const dorsalNameRaw = player.DORSAL_1 ?? '';
  const dorsalName =
    dorsalNameRaw !== null && dorsalNameRaw !== undefined
      ? String(dorsalNameRaw).trim()
      : '';

  if (origin === 'libre' && dorsal === '') {
    origin =
      player.CLUB && String(player.CLUB).toLowerCase().includes('shop')
        ? 'shop'
        : 'libre';
  }

  return { dorsal, dorsalName, origin };
}

const MACRO_FIELDS: (keyof DerivedPlayer)[] = ['ATK', 'TEC', 'RES', 'DEF', 'FUE', 'VEL'];
const CORE_STATS: Array<keyof DerivedPlayer> = [
  'ATAQUE',
  'DEFENSA',
  'ESTABILIDAD',
  'RESISTENCIA',
  'VELOCIDAD MÁXIMA',
  'ACELERACIÓN',
  'RESPUESTA',
  'AGILIDAD',
  'PRECISIÓN DRIBBLE',
  'VELOCIDAD DRIBBLE',
  'PRECISIÓN   P CORTO',
  'VELOCIDAD  P CORTO',
  'PRECISIÓN       P LARGO',
  'VELOCIDAD     P LARGO',
  'PRECISIÓN DISPARO',
  'POTENCIA DISPARO',
  'TÉCNICA DISPARO',
  'PRECISIÓN TIRO LIBRE',
  'EFECTO',
  'CABEZAZO',
  'SALTO',
  'TÉCNICA',
  'AGRESIVIDAD',
  'MENTALIDAD',
  'ARQUERO',
  'TRABAJO EN EQUIPO',
] as Array<keyof DerivedPlayer>;

interface StatusBadge {
  key: string;
  label: string;
  className: string;
  title: string;
}

const STATUS_BADGES: StatusBadge[] = [
  { key: 'national', label: '🌍', className: 'badge', title: 'Seleccionado Nacional' },
  { key: 'legend', label: '★', className: 'badge legend', title: 'Jugador Leyenda' },
  { key: 'ml', label: 'ML', className: 'badge ml', title: 'Jugador ML' },
  {
    key: 'anfpes',
    label: 'ANFPES',
    className: 'badge anfpes',
    title: 'Afiliado a la ANFPES',
  },
];

function getStatusBadges(player: DerivedPlayer): StatusBadge[] {
  const selectionValue = formatSelectionDisplay(
    player[NATIONAL_SELECTION_FIELD] as string,
  );
  const classicValue = formatSelectionDisplay(player['nro clasico'] as string);
  const playerName = String(player.NOMBRE ?? '').trim();
  const rawClub = String(player.CLUB ?? '').trim();

  const hasNationalTeam = selectionValue !== 'No';
  const isLegend = classicValue !== 'No' || LEGEND_PLAYERS.has(playerName);
  const isMLPlayer = ML_PLAYERS.has(playerName);
  const isAnfpes = ANFPES_CLUBS.has(rawClub);

  return STATUS_BADGES.filter((badge) => {
    if (badge.key === 'national') return hasNationalTeam;
    if (badge.key === 'legend') return isLegend;
    if (badge.key === 'ml') return isMLPlayer;
    if (badge.key === 'anfpes') return isAnfpes;
    return false;
  });
}

export function PlayerProfile() {
  const player = useSelectedPlayer();
  const status = useCacheStore((state) => state.status);
  const error = useCacheStore((state) => state.error);

  const loading = status === 'idle' || status === 'loading';

  if (loading) {
    return (
      <section className="profile-shell">
        <p className="muted">Leyendo jugadores ···</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="profile-shell">
        <p className="error">{error}</p>
      </section>
    );
  }

  if (!player) {
    return (
      <section className="profile-shell">
        <p className="muted">
          Usa la pestaña <strong>Buscador</strong> para seleccionar un jugador.
        </p>
      </section>
    );
  }

  const clubShield = getClubShieldPath(player.CLUB as string);
  const flagPath = getFlagImagePath(player.NACIONALIDAD as string);
  const nationalityInfo = getNationalityInfo(player.NACIONALIDAD as string);
  const clubLabel = formatClub(player.CLUB as string, player.NACIONALIDAD as string);
  const positions = getPlayerPositions(player);
  const primaryPosition = positions[0];
  const badges = getStatusBadges(player);
  const promedioValue = ensureNumber(player.PROMEDIO);
  const promedio = formatPlayerValue(promedioValue, 1);
  const promedioColor =
    promedioValue !== undefined ? (getStatColor(promedioValue) ?? '#ffd166') : '#ffd166';
  const primaryLine = primaryPosition ? getPositionLine(primaryPosition) : undefined;

  const { dorsal, dorsalName, origin: shirtOrigin } = resolveDorsal(player);
  const shirtStyle = getShirtStyle(
    shirtOrigin,
    player.CLUB as string,
    player.NACIONALIDAD as string,
  );
  const dorsalDisplay = dorsal;
  const dorsalNameDisplay =
    dorsalName || (player.DORSAL_1 ? String(player.DORSAL_1) : '');
  const macroDataset = {
    id: String(player.ID),
    label: player.NOMBRE as string,
    values: MACRO_FIELDS.map((field) => ensureNumber(player[field]) ?? 0),
    color: '#7ac9ff',
    fillOpacity: 0.16,
  };

  return (
    <section className="profile-shell">
      <header className="profile-header">
        <div className="profile-identity">
          <div className="contenedor-borde">
            <div
              className="profile-shirt"
              data-shirt-origin={shirtOrigin}
              style={
                {
                  color: shirtStyle.color,
                  '--shirt-overlay': shirtStyle.background || '#0f2238',
                } as React.CSSProperties
              }
            >
              <div className="shirt-name">{dorsalNameDisplay}</div>
              <div className="shirt-number">{dorsalDisplay}</div>
            </div>
          </div>
          <div className="profile-face"></div>
        </div>

        <div className="profile-main-info">
          <div className="profile-name">
            <header>{player.NOMBRE}</header>
            <div className="player-badges">
              {badges.map((badge) => (
                <span key={badge.key} className={badge.className} title={badge.title}>
                  {badge.label}
                </span>
              ))}
            </div>
          </div>

          <div className="profile-sub muted">
            <span>&lt;Nombre completo&gt;</span>
          </div>

          <div className="profile-main-data">
            <span>{formatPlayerValue(player.EDAD, 0)} años</span>
            <span>·</span>
            <span>{formatPlayerValue(player.ALTURA, 0)} cm</span>
            <span>·</span>
            <span>{formatPlayerValue(player.PESO, 0)} kg</span>
            <span>·</span>
            <span>Tono {formatSkinTone(player['SKIN COLOR'])} </span>
          </div>
        </div>

        <div className="profile-average-position">
          <div
            className="player-average"
            style={{ color: promedioColor }}
            title={`Promedio principal: ${promedio}`}
          >
            {promedio}
          </div>
          {primaryPosition && (
            <span
              className={`primary-position-tag position-badge primary position-${primaryLine ?? 'DEF'}`}
              title={`Posición Principal: ${getPositionFullName(primaryPosition)}`}
            >
              {primaryPosition}
            </span>
          )}
        </div>

        <div className="profile-club-flag">
          {clubShield && (
            <img src={clubShield} title={clubLabel} alt="" className="club-shield" />
          )}
          {flagPath && (
            <img src={flagPath} alt="" title={nationalityInfo?.name} className="flag" />
          )}
        </div>
        <div className="profile-foot"></div>
      </header>

      <div className="profile-grid three-cols">
        <div className="profile-panel">
          <h3>Bio</h3>
          <div className="profile-info-grid">
            <InfoRow label="Altura" value={`${formatPlayerValue(player.ALTURA, 0)} cm`} />
            <InfoRow label="Peso" value={`${formatPlayerValue(player.PESO, 0)} kg`} />
            <InfoRow label="Edad" value={formatPlayerValue(player.EDAD, 0)} />
            <InfoRow label="Pie" value={formatFoot(player.PIE as string)} />
            <InfoRow
              label="Lado Preferido"
              value={formatFoot(player['FAVOURED SIDE'] as string)}
            />
            <InfoRow
              label="Selección Nacional"
              value={formatSelectionDisplay(player[NATIONAL_SELECTION_FIELD] as string)}
            />
            <InfoRow
              label="Selección Clásica"
              value={formatSelectionDisplay(player[CLASSIC_SELECTION_FIELD] as string)}
            />
            <InfoRow label="Tono de Piel" value={formatSkinTone(player['SKIN COLOR'])} />
            <InfoRow label="Número Dorsal" value={formatPlayerValue(player.DORSAL, 0)} />
            <InfoRow
              label="Nombre Dorsal"
              value={formatPlayerValue(player.DORSAL_1, 0)}
            />
          </div>
        </div>

        <div className="profile-panel">
          <h3>Resumen</h3>
          <div className="profile-summary">
            <div>
              <small>Promedio Principal</small>
              <p className="big">{formatPlayerValue(player.PROMEDIO, 1)}</p>
            </div>
            <div>
              <small>Posición Principal</small>
              <p className="big">{positions[0] ?? '-'}</p>
            </div>
            <div>
              <small>Club</small>
              <p>{formatClub(player.CLUB as string, player.NACIONALIDAD as string)}</p>
            </div>
            <div>
              <small>Tolerancia Lesiones</small>
              <p>{player['TOLERANCIA LESIONES'] ?? '-'}</p>
            </div>
            <div>
              <small>Consistencia</small>
              <p>{formatPlayerValue(player['CONSISTENCIA'], 0)}</p>
            </div>
            <div>
              <small>Condición Física</small>
              <p>{formatPlayerValue(player['CONDICIÓN FITNESS'], 0)}</p>
            </div>
          </div>
        </div>

        <div className="profile-panel tall">
          <h3>Radar & Posiciones</h3>
          <div className="profile-radar-row">
            <RadarChart
              labels={MACRO_FIELDS.map((field) => getFieldLabel(field as string))}
              datasets={[macroDataset]}
              size={220}
              showLegend={false}
            />
            <div className="profile-positions-compact">
              <h4>Posiciones</h4>
              <PositionBadges player={player} maxVisible={6} />
              <PositionMap
                player={player}
                activeCells={getActivePositionCells(player)}
                primaryPosition={positions[0]}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="profile-panel full stats-card">
        <h3>Stats</h3>
        <div className="profile-stats-grid compact">
          {CORE_STATS.map((field) => {
            const value = ensureNumber(player[field]) ?? 0;
            const color = getStatColor(value) ?? '#7ac9ff';
            const width = Math.max(0, Math.min(100, (value / 99) * 100));
            return (
              <div key={field as string} className="stat-block row compact">
                <span className="stat-label">{getFieldLabel(field as string)}</span>
                <div className="stat-bar compact">
                  <div
                    className="stat-bar-fill"
                    style={{ width: `${width}%`, background: color }}
                  />
                </div>
                <span className="stat-value">{formatPlayerValue(value, 0)}</span>
              </div>
            );
          })}
        </div>
        <h4>Habilidades Especiales</h4>
        <PlayerSkills player={player} />
      </div>
    </section>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="info-row">
      <span className="muted">{label}</span>
      <span className="strong">{value}</span>
    </div>
  );
}

function PlayerSkills({ player }: { player: DerivedPlayer }) {
  const skillEntries = Array.from(SPECIAL_SKILL_FIELDS).map((field) => {
    const value = player[field as keyof DerivedPlayer];
    return {
      field,
      label: getFieldLabel(field),
      active: isSkillActive(value),
    };
  });
  const activeSkills = skillEntries.filter((entry) => entry.active);
  if (!activeSkills.length) {
    return <p className="muted">Sin habilidades activas</p>;
  }

  return (
    <div className="skills-grid">
      {activeSkills.map((skill) => (
        <span key={skill.field} className="skill-pill active">
          {skill.label}
        </span>
      ))}
    </div>
  );
}

function isSkillActive(value: DerivedPlayer[keyof DerivedPlayer]): boolean {
  if (value === null || value === undefined) return false;
  const normalized = String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return normalized === 'si' || normalized === '1' || normalized === 'true';
}

export default PlayerProfile;
