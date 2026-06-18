// Helper para obtener banderas y escudos de las imágenes del Excel
import {
  COUNTRY_FLAG_MAPPING,
  SPECIAL_IMAGES,
  CLUB_SHIELDS_MAPPING,
} from '../data/imageMapping';
import profileAddons from '../data/profileAddons';

export type ClubKitImage = {
  path: string;
  scale?: number;
  x?: string;
  y?: string;
};

export type ClubFrontKitImages = {
  home: ClubKitImage;
  away: ClubKitImage;
};

function kit(filename: string, options: Omit<ClubKitImage, 'path'> = {}): ClubKitImage {
  return {
    path: `/images/kits/profile/${encodeURIComponent(filename)}`,
    ...options,
  };
}

function frontKit(
  filename: string,
  options: Omit<ClubKitImage, 'path'> = {},
): ClubKitImage {
  return {
    path: `/images/kits/Clubs/${encodeURIComponent(filename)}`,
    ...options,
  };
}

function frontKits(home: string, away: string): ClubFrontKitImages {
  return {
    home: frontKit(home),
    away: frontKit(away),
  };
}

const PROFILE_KITS_BY_CLUB: Record<string, ClubKitImage> = {
  'a c milan': kit('AC Milan.png'),
  'ac milan': kit('AC Milan.png'),
  'a s roma': kit('AS Roma.png'),
  'as roma': kit('AS Roma.png'),
  ajax: kit('Ajax.png'),
  arsenal: kit('Arsenal.png'),
  'athletic club': kit('Athletic Club.png'),
  'bayern munchen': kit('Bayern Munchen.png'),
  'boca juniors': kit('Boca Juniors.png'),
  celtic: kit('Celtic FC.png'),
  'chelsea fc': kit('Chelsea FC.png'),
  'chievo verona': kit('Chievo Verona.png'),
  'dynamo kiev': kit('Dynamo Kiev.png'),
  'f c barcelona': kit('FC Barcelona.png'),
  'fc barcelona': kit('FC Barcelona.png'),
  'girondins de bordeaux': kit('Girondins de Bordeaux.png'),
  'girondins bordeaux': kit('Girondins de Bordeaux.png'),
  inter: kit('Inter.png'),
  juventus: kit('Juventus.png'),
  lazio: kit('Lazio.png'),
  'liverpool fc': kit('Liverpool FC.png'),
  livorno: kit('Livorno.png'),
  'manchester city': kit('Manchester City.png'),
  'manchester city fc': kit('Manchester City.png'),
  'man city': kit('Manchester City.png'),
  'manchester united': kit('Manchester United.png'),
  'manchester united fc': kit('Manchester United.png'),
  'man utd': kit('Manchester United.png'),
  'newcastle united fc': kit('Newcastle United FC.png'),
  'newcastle united': kit('Newcastle United FC.png'),
  'olympique de marseille': kit('Olympique de Marseille.png'),
  'olympique marseille': kit('Olympique de Marseille.png'),
  'olympique lyonnais': kit('Olympique Lyonnais.png'),
  'paris saint germain': kit('Paris Saint-Germain.png'),
  psg: kit('Paris Saint-Germain.png'),
  parma: kit('Parma.png'),
  'r madrid': kit('Real Madrid.png'),
  'real madrid': kit('Real Madrid.png'),
  'r sociedad': kit('Real Sociedad.png'),
  'real sociedad': kit('Real Sociedad.png'),
  'r c celta': kit('RC Celta.png'),
  'rc celta': kit('RC Celta.png'),
  'roda jc': kit('Roda JC.png'),
  'sevilla f c': kit('Sevilla.png'),
  'sevilla fc': kit('Sevilla.png'),
  'sporting lisbon': kit('Sporting Lisbon.png'),
  'villarreal c f': kit('Villarreal CF.png'),
  'villarreal cf': kit('Villarreal CF.png'),
};

const FRONT_KITS_BY_CLUB: Record<string, ClubFrontKitImages> = {
  'a c milan': frontKits('milan_home.png', 'milan_away.png'),
  'ac milan': frontKits('milan_home.png', 'milan_away.png'),
  'a s roma': frontKits('roma_home.png', 'roma_away.png'),
  'as roma': frontKits('roma_home.png', 'roma_away.png'),
  ajax: frontKits('ajax_home.png', 'ajax_away.png'),
  arsenal: frontKits('arsenal_home.png', 'arsenal_away.png'),
  'athletic club': frontKits('bilbao_home.png', 'bilbao_away.png'),
  'bayern munchen': frontKits('bayern_home.png', 'bayern_away.png'),
  'boca juniors': frontKits('BocaJuniors_h.png', 'BocaJuniors_a.png'),
  celtic: frontKits('celtic_home.png', 'celtic_away.png'),
  'chelsea fc': frontKits('chelsea_home.png', 'chelsea_away.png'),
  'chievo verona': frontKits('chievo_home.png', 'chievo_away.png'),
  'dynamo kiev': frontKits('dynamo_home.png', 'dynamo_away.png'),
  'f c barcelona': frontKits('barcelona_home.png', 'barcelona_away.png'),
  'fc barcelona': frontKits('barcelona_home.png', 'barcelona_away.png'),
  'girondins de bordeaux': frontKits('bordeaux_h.png', 'bordeaux_a.png'),
  'girondins bordeaux': frontKits('bordeaux_h.png', 'bordeaux_a.png'),
  inter: frontKits('inter_home.png', 'inter_away.png'),
  juventus: frontKits('juve_home.png', 'juve_away.png'),
  lazio: frontKits('lazio_home.png', 'lazio_away.png'),
  'liverpool fc': frontKits('liverpool_home.png', 'liverpool_away.png'),
  livorno: frontKits('livorno_home.png', 'livorno_away.png'),
  'manchester city': frontKits('manchestercity_home.png', 'manchestercity_away.png'),
  'manchester city fc': frontKits('manchestercity_home.png', 'manchestercity_away.png'),
  'man city': frontKits('manchestercity_home.png', 'manchestercity_away.png'),
  'manchester united': frontKits(
    'manchesterunited_home.png',
    'manchesterunited_away.png',
  ),
  'manchester united fc': frontKits(
    'manchesterunited_home.png',
    'manchesterunited_away.png',
  ),
  'man utd': frontKits('manchesterunited_home.png', 'manchesterunited_away.png'),
  'newcastle united fc': frontKits('newcastle_home.png', 'newcastle_away.png'),
  'newcastle united': frontKits('newcastle_home.png', 'newcastle_away.png'),
  'olympique de marseille': frontKits('marseille_h.png', 'marseille_a.png'),
  'olympique marseille': frontKits('marseille_h.png', 'marseille_a.png'),
  'olympique lyonnais': frontKits('lyon_h.png', 'lyon_a.png'),
  'paris saint germain': frontKits('psg_h.png', 'psg_a.png'),
  psg: frontKits('psg_h.png', 'psg_a.png'),
  parma: frontKits('parmo_home.png', 'parma_away.png'),
  'r madrid': frontKits('real_home.png', 'real_away.png'),
  'real madrid': frontKits('real_home.png', 'real_away.png'),
  'r sociedad': frontKits('rsociedade_home.png', 'rsociedade_away.png'),
  'real sociedad': frontKits('rsociedade_home.png', 'rsociedade_away.png'),
  'r c celta': frontKits('celta_home.png', 'celta_away.png'),
  'rc celta': frontKits('celta_home.png', 'celta_away.png'),
  'roda jc': frontKits('roda_home.png', 'roda_away.png'),
  'sevilla f c': frontKits('sevilla_home.png', 'sevilla_away.png'),
  'sevilla fc': frontKits('sevilla_home.png', 'sevilla_away.png'),
  'sporting lisbon': frontKits('sporting_home.png', 'sporting_away.png'),
  'villarreal c f': frontKits('villarreal_home.png', 'villarreal_away.png'),
  'villarreal cf': frontKits('villarreal_home.png', 'villarreal_away.png'),
};

function normalizeImageKey(raw: string): string {
  return (raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getFlagImagePath(countryName: string): string | null {
  const imageName = COUNTRY_FLAG_MAPPING[countryName];
  if (!imageName) {
    return null;
  }
  return `/images/flags/${imageName}`;
}

export function getSpecialImagePath(clubName: string): string | null {
  const imageName = SPECIAL_IMAGES[clubName];
  if (!imageName) {
    return null;
  }
  return `/images/special/${imageName}`;
}

export function getClubShieldPath(clubName: string): string | null {
  // Primero verificar si es una imagen especial
  const specialPath = getSpecialImagePath(clubName);
  if (specialPath) {
    return specialPath;
  }

  // Luego buscar en el mapeo de clubs
  const imageName = CLUB_SHIELDS_MAPPING[clubName];
  if (!imageName) {
    return null;
  }
  return `/images/clubs/${imageName}`;
}

export function getClubKitImage(clubName: string): ClubKitImage | null {
  const kit = PROFILE_KITS_BY_CLUB[normalizeImageKey(clubName)];
  return kit ?? null;
}

export function getClubKitPath(clubName: string): string | null {
  return getClubKitImage(clubName)?.path ?? null;
}

export function getClubFrontKitImages(clubName: string): ClubFrontKitImages | null {
  return FRONT_KITS_BY_CLUB[normalizeImageKey(clubName)] ?? null;
}

export function getPlayerThumbPath(playerId: string | number): string {
  const addon = (profileAddons as Record<string, { image?: string }>)[String(playerId)];

  // Si no hay imagen asignada, usar missing.png como fallback
  if (!addon?.image) {
    return '/images/thumbs/missing.png';
  }

  const imagePath = addon.image;
  // Cambiar /images/faces/ por /images/thumbs/
  return imagePath.replace('/images/faces/', '/images/thumbs/');
}

export function getPlayerFacePath(playerId: string | number): string {
  const addon = (profileAddons as Record<string, { image?: string }>)[String(playerId)];
  return addon?.image ?? '/images/faces/missing.png';
}
