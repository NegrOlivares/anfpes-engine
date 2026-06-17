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

function kit(filename: string, options: Omit<ClubKitImage, 'path'> = {}): ClubKitImage {
  return {
    path: `/images/kits/profile/${encodeURIComponent(filename)}`,
    ...options,
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
  celtic: kit('Celtic.png'),
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
  'sevilla f c': kit('Sevilla FC.png'),
  'sevilla fc': kit('Sevilla FC.png'),
  'sporting lisbon': kit('Sporting Lisbon.png'),
  'villarreal c f': kit('Villarreal CF.png'),
  'villarreal cf': kit('Villarreal CF.png'),
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
