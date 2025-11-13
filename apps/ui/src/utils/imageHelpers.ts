// Helper para obtener banderas y escudos de las imágenes del Excel
import {
  COUNTRY_FLAG_MAPPING,
  SPECIAL_IMAGES,
  CLUB_SHIELDS_MAPPING,
} from '../data/imageMapping';

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
