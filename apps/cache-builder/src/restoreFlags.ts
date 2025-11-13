import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir =
  'C:\\Users\\usuario\\Desktop\\anfpes-engine\\excel_extracted\\xl\\media';
const flagsDir = path.join(__dirname, '../../../apps/ui/public/images/flags');

// Imágenes que corresponden a banderas (números de imagen del COUNTRY_FLAG_MAPPING)
const flagImages = [
  '1',
  '2',
  '3',
  '197',
  '198',
  '199',
  '200',
  '201',
  '202',
  '203',
  '204',
  '205',
  '206',
  '207',
  '208',
  '209',
  '210',
  '211',
  '212',
  '213',
  '214',
  '215',
  '216',
  '217',
  '218',
  '219',
  '220',
  '221',
  '222',
  '223',
  '224',
  '225',
  '226',
  '227',
  '228',
  '229',
  '230',
  '231',
  '232',
  '233',
  '234',
  '235',
  '236',
  '237',
  '238',
  '239',
  '240',
  '241',
  '242',
  '243',
  '244',
  '245',
  '246',
  '247',
  '248',
  '249',
  '250',
  '251',
  '252',
  '253',
  '254',
  '255',
  '256',
  '257',
  '258',
  '259',
  '260',
  '261',
  '262',
  '263',
  '264',
  '265',
  '266',
  '267',
  '268',
  '269',
  '270',
  '271',
  '272',
  '273',
  '274',
  '275',
  '276',
  '277',
  '278',
  '279',
  '280',
  '281',
  '282',
  '283',
  '284',
  '285',
  '286',
  '287',
  '288',
  '289',
  '290',
  '291',
  '292',
  '293',
  '294',
  '295',
  '296',
];

console.log('🔄 Restaurando banderas originales...\n');

let copied = 0;
let notFound = 0;

for (const imageNum of flagImages) {
  // Buscar el archivo en el directorio de origen (puede ser .png, .jpeg, .jpg, .gif, .webp)
  const sourceFiles = fs.readdirSync(sourceDir);
  const sourceFile = sourceFiles.find((f) => {
    const match = f.match(/^image(\d+)\.(png|jpeg|jpg|gif|webp)$/i);
    return match && match[1] === imageNum;
  });

  if (sourceFile) {
    const sourcePath = path.join(sourceDir, sourceFile);
    const destPath = path.join(flagsDir, sourceFile);

    fs.copyFileSync(sourcePath, destPath);
    console.log(`   ✅ Copiada: ${sourceFile}`);
    copied++;
  } else {
    console.log(`   ⚠️  No encontrada: image${imageNum}.*`);
    notFound++;
  }
}

console.log(`\n📊 Resumen: ${copied} banderas restauradas, ${notFound} no encontradas`);
console.log('✨ ¡Proceso completado!\n');
