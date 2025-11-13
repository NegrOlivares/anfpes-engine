import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEDIA_PATH = path.join(__dirname, '../../../excel_extracted/xl/media');
const OUTPUT_FLAGS = path.join(__dirname, '../../../apps/ui/public/images/flags');

// Mapeo manual de las primeras banderas que vi en la captura
// image1.png = Canadá, image2.jpeg = Belarus, image3.png = Colombia
const FLAG_MAPPING: Record<string, string> = {
  // Necesitamos completar este mapeo
  // Por ahora, simplemente copiamos TODAS las imágenes PNG del Excel
};

console.log('📁 Copiando todas las imágenes a flags para mapeo manual...\n');

fs.mkdirSync(OUTPUT_FLAGS, { recursive: true });

const files = fs.readdirSync(MEDIA_PATH);
let copied = 0;

files.forEach((file) => {
  if (file.match(/\.(png|jpg|jpeg|gif)$/i)) {
    const srcPath = path.join(MEDIA_PATH, file);
    const destPath = path.join(OUTPUT_FLAGS, file);

    try {
      fs.copyFileSync(srcPath, destPath);
      copied++;
    } catch (error) {
      // Ignorar errores
    }
  }
});

console.log(`✅ Copiadas ${copied} imágenes a ${OUTPUT_FLAGS}`);
console.log('\n💡 Ahora todas las banderas están disponibles como:');
console.log('   /images/flags/imageXXX.png');
console.log('\n📝 Próximo paso: Usar emojis Unicode simples en lugar de SVGs pesados');
