export type ClubDivision = 'Primera Division' | 'Segunda Division';

export interface ClubCompetitionDetail {
  division: ClubDivision;
  manager: string;
  shortTermPlayer: string;
}

export const CLUB_DIVISION_ORDER: ClubDivision[] = [
  'Primera Division',
  'Segunda Division',
];

export const CLUB_COMPETITION_DETAILS: Record<string, ClubCompetitionDetail> = {
  'Sevilla F.C.': {
    division: 'Primera Division',
    manager: 'Camilomax',
    shortTermPlayer: "Eto'o",
  },
  'Olympique de Marseille': {
    division: 'Primera Division',
    manager: 'NTSC',
    shortTermPlayer: 'Thuram',
  },
  'Olympique Lyonnais': {
    division: 'Primera Division',
    manager: 'Breaking',
    shortTermPlayer: 'Puyol',
  },
  Ajax: {
    division: 'Primera Division',
    manager: 'Bisharraco',
    shortTermPlayer: 'Ian Wright',
  },
  'Athletic Club': {
    division: 'Primera Division',
    manager: 'Antres',
    shortTermPlayer: 'R. Ferdinand',
  },
  Inter: {
    division: 'Primera Division',
    manager: 'Don Fxcho',
    shortTermPlayer: 'Rooney',
  },
  'Manchester United': {
    division: 'Primera Division',
    manager: 'Painkiller',
    shortTermPlayer: 'Franco Baresi',
  },
  'Chelsea FC': {
    division: 'Primera Division',
    manager: 'Leo',
    shortTermPlayer: 'Brian Laudrup',
  },
  'Dynamo Kiev': {
    division: 'Primera Division',
    manager: 'Almo',
    shortTermPlayer: 'Maldini',
  },
  'Bayern München': {
    division: 'Primera Division',
    manager: 'FcoFlores10',
    shortTermPlayer: 'Ruud Krol',
  },
  'R. Madrid': {
    division: 'Primera Division',
    manager: 'NegroCesante',
    shortTermPlayer: 'Sócrates',
  },
  'R. Sociedad': {
    division: 'Primera Division',
    manager: 'ManuCW',
    shortTermPlayer: 'J. Klinsmann',
  },
  'R.C. Celta': {
    division: 'Primera Division',
    manager: 'Machulo',
    shortTermPlayer: 'Laurent Blanc',
  },
  'Girondins de Bordeaux': {
    division: 'Primera Division',
    manager: 'DiegoVeliz',
    shortTermPlayer: 'Djalminha',
  },
  Juventus: {
    division: 'Primera Division',
    manager: 'Trucazo',
    shortTermPlayer: 'Gilardino',
  },
  Lazio: {
    division: 'Primera Division',
    manager: 'PoloBanda87',
    shortTermPlayer: 'Ayala',
  },
  Arsenal: {
    division: 'Segunda Division',
    manager: 'Pablo.13',
    shortTermPlayer: 'K-H Rummenigge',
  },
  Celtic: {
    division: 'Segunda Division',
    manager: 'Gozalo',
    shortTermPlayer: 'P. Vierchowod',
  },
  'Manchester City': {
    division: 'Segunda Division',
    manager: 'Diegol',
    shortTermPlayer: 'Walter Samuel',
  },
  'Paris Saint-Germain': {
    division: 'Segunda Division',
    manager: 'Pollo',
    shortTermPlayer: 'Rudi Völler',
  },
  'Villarreal C.F.': {
    division: 'Segunda Division',
    manager: 'Nioro',
    shortTermPlayer: 'Tony Adams',
  },
  'Liverpool FC': {
    division: 'Segunda Division',
    manager: 'Zafrada',
    shortTermPlayer: 'Makaay',
  },
  'Sporting Lisbon': {
    division: 'Segunda Division',
    manager: 'Ivanbec',
    shortTermPlayer: 'Montella',
  },
  Parma: {
    division: 'Segunda Division',
    manager: 'Rufusonvre',
    shortTermPlayer: 'Careca',
  },
  'Roda JC': {
    division: 'Segunda Division',
    manager: 'Aurinegro',
    shortTermPlayer: 'John Barnes',
  },
  'Boca Juniors': {
    division: 'Segunda Division',
    manager: 'LV',
    shortTermPlayer: 'Dida',
  },
  'A.S. Roma': {
    division: 'Segunda Division',
    manager: 'Jano de Batuco',
    shortTermPlayer: 'Gianluca Vialli',
  },
  'F.C. Barcelona': {
    division: 'Segunda Division',
    manager: 'Carechicha',
    shortTermPlayer: 'G. Lentini',
  },
  'Newcastle United FC': {
    division: 'Segunda Division',
    manager: 'CarlosBilla17',
    shortTermPlayer: 'Cassano',
  },
  'A.C. Milan': {
    division: 'Segunda Division',
    manager: 'JP',
    shortTermPlayer: 'Gianfranco Zola',
  },
  'Chievo Verona': {
    division: 'Segunda Division',
    manager: 'LVDJG',
    shortTermPlayer: 'Given',
  },
  Livorno: {
    division: 'Segunda Division',
    manager: 'TragoCamote',
    shortTermPlayer: 'Thomas Ravelli',
  },
};

export const CLUBS_BY_DIVISION = CLUB_DIVISION_ORDER.map((division) => ({
  division,
  clubs: Object.entries(CLUB_COMPETITION_DETAILS)
    .filter(([, detail]) => detail.division === division)
    .map(([club]) => club)
    .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })),
}));

export const TXXIII_SHORT_TERM_PLAYER_NAMES = Object.values(CLUB_COMPETITION_DETAILS).map(
  (detail) => detail.shortTermPlayer,
);

export function getClubCompetitionDetail(
  club: string,
): ClubCompetitionDetail | undefined {
  return CLUB_COMPETITION_DETAILS[club];
}

export function sortClubsAlphabetically(clubs: string[]): string[] {
  return [...clubs].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
}
