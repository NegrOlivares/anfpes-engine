import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Leer el archivo JSON con los datos de nacionalidades y clubs
const flagsAndShields = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '../../../data/reference/flags-and-shields-reference.json'),
    'utf-8',
  ),
);

// Imágenes especiales (indicadas por el usuario)
const SPECIAL_IMAGES = {
  'image27.png': 'Libre',
  'image37.webp': 'Argentina Clásico',
  'image38.png': 'Brasil Clásico',
  'image39.png': 'Inglaterra Clásico',
  'image40.png': 'Francia Clásico',
  'image41.png': 'Alemania Clásico',
  'image42.png': 'Italia Clásico',
  'image43.png': 'Países Bajos Clásico',
  'image49.png': 'Equipo ML',
  'image80.png': 'ML Old',
  'image81.png': 'ML Young',
  'image174.png': 'Shop 1',
  'image175.png': 'Shop 2',
  'image176.png': 'Shop 3',
  'image177.png': 'Shop 4',
  'image178.png': 'Shop 5',
};

// Lista de todos los clubs (203 encontrados)
const CLUBS = flagsAndShields.nationalities.slice(1).map((n: any) => n.nationality);

// Lista de todas las nacionalidades (104 encontradas)
const COUNTRIES = flagsAndShields.clubs.slice(1).map((c: any) => c.club);

console.log('📊 Análisis de datos:\n');
console.log(`⚽ Clubs encontrados: ${CLUBS.length}`);
console.log(`🏴 Países encontrados: ${COUNTRIES.length}`);
console.log(`🎯 Imágenes especiales: ${Object.keys(SPECIAL_IMAGES).length}\n`);

// Mostrar algunos ejemplos
console.log('Primeros 10 clubs:');
CLUBS.slice(0, 10).forEach((club: string) => console.log(`  - ${club}`));

console.log('\nPrimeros 10 países:');
COUNTRIES.slice(0, 10).forEach((country: string) => console.log(`  - ${country}`));

console.log('\nImágenes especiales:');
Object.entries(SPECIAL_IMAGES).forEach(([file, name]) => {
  console.log(`  - ${file} → ${name}`);
});

// Crear directorio de mapeo
const MEDIA_PATH = path.join(__dirname, '../../../excel_extracted/xl/media');
const OUTPUT_SPECIAL = path.join(__dirname, '../../../apps/ui/public/images/special');

fs.mkdirSync(OUTPUT_SPECIAL, { recursive: true });

console.log('\n📁 Copiando imágenes especiales...');

let copied = 0;
Object.keys(SPECIAL_IMAGES).forEach((filename) => {
  const srcPath = path.join(MEDIA_PATH, filename);
  const destPath = path.join(OUTPUT_SPECIAL, filename);

  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    copied++;
    console.log(`  ✅ ${filename} → ${SPECIAL_IMAGES[filename]}`);
  } else {
    console.log(`  ⚠️  ${filename} NO ENCONTRADO`);
  }
});

console.log(`\n✅ Copiadas ${copied} imágenes especiales a: ${OUTPUT_SPECIAL}`);

// Ahora voy a copiar TODAS las imágenes a carpetas organizadas para revisión
const OUTPUT_CLUBS = path.join(__dirname, '../../../apps/ui/public/images/clubs');
const OUTPUT_FLAGS_TEMP = path.join(
  __dirname,
  '../../../apps/ui/public/images/flags-temp',
);

fs.mkdirSync(OUTPUT_CLUBS, { recursive: true });
fs.mkdirSync(OUTPUT_FLAGS_TEMP, { recursive: true });

console.log('\n📁 Copiando todas las imágenes del Excel...');

// Copiar todas las imágenes para revisión
const allFiles = fs.readdirSync(MEDIA_PATH);
let copiedClubs = 0;

allFiles.forEach((filename) => {
  if (!Object.keys(SPECIAL_IMAGES).includes(filename)) {
    const srcPath = path.join(MEDIA_PATH, filename);
    const destPath = path.join(OUTPUT_CLUBS, filename);
    fs.copyFileSync(srcPath, destPath);
    copiedClubs++;
  }
});

console.log(`✅ Copiadas ${copiedClubs} imágenes de clubs/países`);

// Generar un mapeo completo
const mapping = {
  special: SPECIAL_IMAGES,
  clubs: CLUBS,
  countries: COUNTRIES,
  stats: {
    totalImages: allFiles.length,
    specialImages: Object.keys(SPECIAL_IMAGES).length,
    clubsAndFlags: allFiles.length - Object.keys(SPECIAL_IMAGES).length,
  },
};

const mappingPath = path.join(
  __dirname,
  '../../../data/reference/complete-image-mapping.json',
);
fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2), 'utf-8');

console.log(`\n💾 Mapeo completo guardado en: ${mappingPath}`);

console.log('\n✨ ¡Proceso completado!');
console.log('\n📝 Próximos pasos:');
console.log('   1. Imágenes especiales copiadas a: apps/ui/public/images/special/');
console.log('   2. Resto de imágenes en: apps/ui/public/images/clubs/');
console.log('   3. Ahora voy a descargar banderas profesionales de Flagpedia');
console.log('   4. Los escudos de clubs podemos usar los del Excel (ya están extraídos)');
