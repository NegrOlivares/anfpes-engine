import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importar el mapeo
const COUNTRY_FLAG_MAPPING: Record<string, string> = {
  Canada: 'image1.png',
  Belarus: 'image2.png',
  Armenia: 'image3.png',
  Albania: 'image296.png',
  Algeria: 'image197.png',
  Angola: 'image198.png',
  Argentina: 'image199.png',
  Australia: 'image200.png',
  Austria: 'image201.png',
  Belgium: 'image202.png',
  Benin: 'image203.png',
  Bolivia: 'image204.png',
  'Bosnia and Herzegovina': 'image205.png',
  Brazil: 'image206.png',
  Bulgaria: 'image207.png',
  'Burkina Faso': 'image208.png',
  Cameroon: 'image209.png',
  'Cape Verde': 'image210.png',
  Chile: 'image211.png',
  China: 'image212.png',
  Colombia: 'image213.png',
  'Costa Rica': 'image214.png',
  "Cote d'Ivoire": 'image215.png',
  Croatia: 'image216.png',
  Cyprus: 'image217.png',
  'Czech Republic': 'image218.png',
  Denmark: 'image219.png',
  'DR Congo': 'image220.png',
  Ecuador: 'image221.png',
  Egypt: 'image222.png',
  England: 'image223.png',
  'Equatorial Guinea': 'image224.png',
  Estonia: 'image225.png',
  Finland: 'image226.png',
  France: 'image227.png',
  Gabon: 'image228.png',
  Gambia: 'image229.png',
  Georgia: 'image230.png',
  Germany: 'image231.png',
  Ghana: 'image232.png',
  Greece: 'image233.png',
  Grenada: 'image234.png',
  Guadeloupe: 'image235.png',
  Guinea: 'image236.png',
  'Guinea-Bissau': 'image237.png',
  Honduras: 'image238.png',
  Hungary: 'image239.png',
  Iceland: 'image240.png',
  Iran: 'image241.png',
  Ireland: 'image242.png',
  Israel: 'image243.png',
  Italy: 'image244.png',
  Jamaica: 'image245.png',
  Japan: 'image246.png',
  Kenya: 'image247.png',
  Latvia: 'image248.png',
  Liberia: 'image249.png',
  Libya: 'image250.png',
  Liechtenstein: 'image251.png',
  Lithuania: 'image252.png',
  Macedonia: 'image253.png',
  Mali: 'image254.png',
  Martinique: 'image255.png',
  Mexico: 'image256.png',
  Morocco: 'image257.png',
  Mozambique: 'image258.png',
  Netherlands: 'image259.png',
  'Netherlands Antilles': 'image260.png',
  'New Zealand': 'image261.png',
  Nigeria: 'image262.png',
  'Northern Ireland': 'image263.png',
  Norway: 'image264.png',
  Oman: 'image265.png',
  Panama: 'image266.png',
  Paraguay: 'image267.png',
  Peru: 'image268.png',
  Poland: 'image269.png',
  Portugal: 'image270.png',
  Romania: 'image271.png',
  Russia: 'image272.png',
  'Saudi Arabia': 'image273.png',
  Scotland: 'image274.png',
  Senegal: 'image275.png',
  'Serbia and Montenegro': 'image276.png',
  'Sierra Leone': 'image277.png',
  Slovakia: 'image278.png',
  Slovenia: 'image279.png',
  'South Africa': 'image280.png',
  'South Korea': 'image281.png',
  Spain: 'image282.png',
  Sweden: 'image283.png',
  Switzerland: 'image284.png',
  Togo: 'image285.png',
  'Trinidad and Tobago': 'image286.png',
  Tunisia: 'image287.png',
  Turkey: 'image288.png',
  Ukraine: 'image289.png',
  Uruguay: 'image290.png',
  'United States': 'image291.png',
  Uzbekistan: 'image292.png',
  Venezuela: 'image293.png',
  Wales: 'image294.png',
  Zimbabwe: 'image295.png',
};

const flagsDir = path.join(__dirname, '../../../apps/ui/public/images/flags');

console.log('🔍 Verificando banderas faltantes...\n');

const availableFiles = fs.readdirSync(flagsDir);
const missing: string[] = [];
const found: string[] = [];

Object.entries(COUNTRY_FLAG_MAPPING).forEach(([country, imageName]) => {
  // Buscar la imagen con cualquier extensión
  const baseImageName = imageName.replace(/\.(png|jpeg|jpg|webp)$/, '');
  const exists = availableFiles.some(
    (file) => file.startsWith(baseImageName) && /\.(png|jpeg|jpg|webp)$/i.test(file),
  );

  if (exists) {
    found.push(`${country} → ${imageName}`);
  } else {
    missing.push(`${country} → ${imageName}`);
    console.log(`❌ Falta: ${country} (${imageName})`);
  }
});

console.log(`\n✅ Encontradas: ${found.length} banderas`);
console.log(`❌ Faltantes: ${missing.length} banderas\n`);

if (missing.length > 0) {
  console.log('Países sin bandera:');
  missing.forEach((m) => console.log(`  - ${m}`));
}
