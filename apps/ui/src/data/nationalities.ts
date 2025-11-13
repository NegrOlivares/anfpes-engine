export interface NationalityInfo {
  name: string;
  demonym: string;
  flag: string;
  flagCode?: string; // Código ISO para flag-icons
}

const NATIONALITY_MAP: Record<string, NationalityInfo> = {
  Albania: { name: 'Albania', demonym: 'Albanesa', flag: '🇦🇱' },
  Algeria: { name: 'Argelia', demonym: 'Argelina', flag: '🇩🇿' },
  Angola: { name: 'Angola', demonym: 'Angoleña', flag: '🇦🇴' },
  Argentina: { name: 'Argentina', demonym: 'Argentina', flag: '🇦🇷' },
  Armenia: { name: 'Armenia', demonym: 'Armenia', flag: '🇦🇲' },
  Australia: { name: 'Australia', demonym: 'Australiana', flag: '🇦🇺' },
  Austria: { name: 'Austria', demonym: 'Austríaca', flag: '🇦🇹' },
  Belarus: { name: 'Bielorrusia', demonym: 'Bielorrusa', flag: '🇧🇾' },
  Belgium: { name: 'Bélgica', demonym: 'Belga', flag: '🇧🇪' },
  Benin: { name: 'Benín', demonym: 'Beninesa', flag: '🇧🇯' },
  Bolivia: { name: 'Bolivia', demonym: 'Boliviana', flag: '🇧🇴' },
  'Bosnia and Herzegovina': {
    name: 'Bosnia y Herzegovina',
    demonym: 'Bosnia',
    flag: '🇧🇦',
  },
  Brazil: { name: 'Brasil', demonym: 'Brasileña', flag: '🇧🇷' },
  Bulgaria: { name: 'Bulgaria', demonym: 'Búlgara', flag: '🇧🇬' },
  'Burkina Faso': { name: 'Burkina Faso', demonym: 'Burkinesa', flag: '🇧🇫' },
  Cameroon: { name: 'Camerún', demonym: 'Camerunesa', flag: '🇨🇲' },
  Canada: { name: 'Canadá', demonym: 'Canadiense', flag: '🇨🇦' },
  'Cape Verde': { name: 'Cabo Verde', demonym: 'Caboverdiana', flag: '🇨🇻' },
  Chile: { name: 'Chile', demonym: 'Chilena', flag: '🇨🇱' },
  China: { name: 'China', demonym: 'China', flag: '🇨🇳' },
  Colombia: { name: 'Colombia', demonym: 'Colombiana', flag: '🇨🇴' },
  'Costa Rica': { name: 'Costa Rica', demonym: 'Costarricense', flag: '🇨🇷' },
  "Cote d'Ivoire": { name: 'Costa de Marfil', demonym: 'Marfileña', flag: '🇨🇮' },
  Croatia: { name: 'Croacia', demonym: 'Croata', flag: '🇭🇷' },
  Cyprus: { name: 'Chipre', demonym: 'Chipriota', flag: '🇨🇾' },
  'Czech Republic': { name: 'República Checa', demonym: 'Checa', flag: '🇨🇿' },
  'DR Congo': {
    name: 'República Democrática del Congo',
    demonym: 'Congoleña',
    flag: '🇨🇩',
  },
  Denmark: { name: 'Dinamarca', demonym: 'Danesa', flag: '🇩🇰' },
  Ecuador: { name: 'Ecuador', demonym: 'Ecuatoriana', flag: '🇪🇨' },
  Egypt: { name: 'Egipto', demonym: 'Egipcia', flag: '🇪🇬' },
  England: { name: 'Inglaterra', demonym: 'Inglesa', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  'Equatorial Guinea': {
    name: 'Guinea Ecuatorial',
    demonym: 'Ecuatoguineana',
    flag: '🇬🇶',
  },
  Estonia: { name: 'Estonia', demonym: 'Estonia', flag: '🇪🇪' },
  Finland: { name: 'Finlandia', demonym: 'Finlandesa', flag: '🇫🇮' },
  France: { name: 'Francia', demonym: 'Francesa', flag: '🇫🇷' },
  Gabon: { name: 'Gabón', demonym: 'Gabonense', flag: '🇬🇦' },
  Gambia: { name: 'Gambia', demonym: 'Gambiana', flag: '🇬🇲' },
  Georgia: { name: 'Georgia', demonym: 'Georgiana', flag: '🇬🇪' },
  Germany: { name: 'Alemania', demonym: 'Alemana', flag: '🇩🇪' },
  Ghana: { name: 'Ghana', demonym: 'Ghanesa', flag: '🇬🇭' },
  Greece: { name: 'Grecia', demonym: 'Griega', flag: '🇬🇷' },
  Grenada: { name: 'Granada', demonym: 'Granadina', flag: '🇬🇩' },
  Guadeloupe: { name: 'Guadalupe', demonym: 'Guadalupeña', flag: '🇬🇵' },
  Guinea: { name: 'Guinea', demonym: 'Guineana', flag: '🇬🇳' },
  'Guinea-Bissau': { name: 'Guinea-Bisáu', demonym: 'Guineana', flag: '🇬🇼' },
  Honduras: { name: 'Honduras', demonym: 'Hondureña', flag: '🇭🇳' },
  Hungary: { name: 'Hungría', demonym: 'Húngara', flag: '🇭🇺' },
  Iceland: { name: 'Islandia', demonym: 'Islandesa', flag: '🇮🇸' },
  Iran: { name: 'Irán', demonym: 'Iraní', flag: '🇮🇷' },
  Ireland: { name: 'Irlanda', demonym: 'Irlandesa', flag: '🇮🇪' },
  Israel: { name: 'Israel', demonym: 'Israelí', flag: '🇮🇱' },
  Italy: { name: 'Italia', demonym: 'Italiana', flag: '🇮🇹' },
  Jamaica: { name: 'Jamaica', demonym: 'Jamaiquina', flag: '🇯🇲' },
  Japan: { name: 'Japón', demonym: 'Japonesa', flag: '🇯🇵' },
  Kenya: { name: 'Kenia', demonym: 'Keniana', flag: '🇰🇪' },
  Latvia: { name: 'Letonia', demonym: 'Letona', flag: '🇱🇻' },
  Liberia: { name: 'Liberia', demonym: 'Liberiana', flag: '🇱🇷' },
  Libya: { name: 'Libia', demonym: 'Libia', flag: '🇱🇾' },
  Liechtenstein: { name: 'Liechtenstein', demonym: 'Liechtensteiniana', flag: '🇱🇮' },
  Lithuania: { name: 'Lituania', demonym: 'Lituana', flag: '🇱🇹' },
  Macedonia: { name: 'Macedonia', demonym: 'Macedonia', flag: '🇲🇰' },
  Mali: { name: 'Malí', demonym: 'Maliense', flag: '🇲🇱' },
  Martinique: { name: 'Martinica', demonym: 'Martiniqueña', flag: '🇲🇶' },
  Mexico: { name: 'México', demonym: 'Mexicana', flag: '🇲🇽' },
  Morocco: { name: 'Marruecos', demonym: 'Marroquí', flag: '🇲🇦' },
  Mozambique: { name: 'Mozambique', demonym: 'Mozambiqueña', flag: '🇲🇿' },
  Netherlands: { name: 'Países Bajos', demonym: 'Neerlandesa', flag: '🇳🇱' },
  'Netherlands Antilles': {
    name: 'Antillas Neerlandesas',
    demonym: 'Antillana',
    flag: '🇳🇱',
  },
  'New Zealand': { name: 'Nueva Zelanda', demonym: 'Neozelandesa', flag: '🇳🇿' },
  Nigeria: { name: 'Nigeria', demonym: 'Nigeriana', flag: '🇳🇬' },
  'Northern Ireland': {
    name: 'Irlanda del Norte',
    demonym: 'Norirlandesa',
    flag: '🏴󠁧󠁢󠁮󠁩󠁲󠁿',
  },
  Norway: { name: 'Noruega', demonym: 'Noruega', flag: '🇳🇴' },
  Oman: { name: 'Omán', demonym: 'Omaní', flag: '🇴🇲' },
  Panama: { name: 'Panamá', demonym: 'Panameña', flag: '🇵🇦' },
  Paraguay: { name: 'Paraguay', demonym: 'Paraguaya', flag: '🇵🇾' },
  Peru: { name: 'Perú', demonym: 'Peruana', flag: '🇵🇪' },
  Poland: { name: 'Polonia', demonym: 'Polaca', flag: '🇵🇱' },
  Portugal: { name: 'Portugal', demonym: 'Portuguesa', flag: '🇵🇹' },
  Romania: { name: 'Rumania', demonym: 'Rumena', flag: '🇷🇴' },
  Russia: { name: 'Rusia', demonym: 'Rusa', flag: '🇷🇺' },
  'Saudi Arabia': { name: 'Arabia Saudita', demonym: 'Saudita', flag: '🇸🇦' },
  Scotland: { name: 'Escocia', demonym: 'Escocesa', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  Senegal: { name: 'Senegal', demonym: 'Senegalesa', flag: '🇸🇳' },
  'Serbia and Montenegro': {
    name: 'Serbia y Montenegro',
    demonym: 'Serbia',
    flag: '🇷🇸',
  },
  'Sierra Leone': { name: 'Sierra Leona', demonym: 'Sierraleonesa', flag: '🇸🇱' },
  Slovakia: { name: 'Eslovaquia', demonym: 'Eslovaca', flag: '🇸🇰' },
  Slovenia: { name: 'Eslovenia', demonym: 'Eslovena', flag: '🇸🇮' },
  'South Africa': { name: 'Sudáfrica', demonym: 'Sudafricana', flag: '🇿🇦' },
  'South Korea': { name: 'Corea del Sur', demonym: 'Surcoreana', flag: '🇰🇷' },
  Spain: { name: 'España', demonym: 'Española', flag: '🇪🇸' },
  Sweden: { name: 'Suecia', demonym: 'Sueca', flag: '🇸🇪' },
  Switzerland: { name: 'Suiza', demonym: 'Suiza', flag: '🇨🇭' },
  Togo: { name: 'Togo', demonym: 'Togolesa', flag: '🇹🇬' },
  'Trinidad and Tobago': {
    name: 'Trinidad y Tobago',
    demonym: 'Trinitense',
    flag: '🇹🇹',
  },
  Tunisia: { name: 'Túnez', demonym: 'Tunecina', flag: '🇹🇳' },
  Turkey: { name: 'Turquía', demonym: 'Turca', flag: '🇹🇷' },
  Ukraine: { name: 'Ucrania', demonym: 'Ucraniana', flag: '🇺🇦' },
  'United States': { name: 'Estados Unidos', demonym: 'Estadounidense', flag: '🇺🇸' },
  Uruguay: { name: 'Uruguay', demonym: 'Uruguaya', flag: '🇺🇾' },
  Uzbekistan: { name: 'Uzbekistán', demonym: 'Uzbeca', flag: '🇺🇿' },
  Venezuela: { name: 'Venezuela', demonym: 'Venezolana', flag: '🇻🇪' },
  Wales: { name: 'Gales', demonym: 'Galesa', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  Zimbabwe: { name: 'Zimbabue', demonym: 'Zimbabuense', flag: '🇿🇼' },
  'Cape Verde Islands': { name: 'Cabo Verde', demonym: 'Caboverdiana', flag: '🇨🇻' },
};

export function getNationalityInfo(
  value: string | null | undefined,
): NationalityInfo | undefined {
  if (!value) {
    return undefined;
  }
  // Buscar directamente
  const direct = NATIONALITY_MAP[value];
  if (direct) {
    return direct;
  }

  // Buscar con trim
  const trimmed = value.trim();
  if (NATIONALITY_MAP[trimmed]) {
    return NATIONALITY_MAP[trimmed];
  }

  return undefined;
}
