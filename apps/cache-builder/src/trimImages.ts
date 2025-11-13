import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const flagsDir = path.join(__dirname, '../../../apps/ui/public/images/flags');
const clubsDir = path.join(__dirname, '../../../apps/ui/public/images/clubs');

interface ProcessResult {
  file: string;
  success: boolean;
  originalSize?: { width: number; height: number };
  newSize?: { width: number; height: number };
  error?: string;
}

async function trimImage(inputPath: string, outputPath: string): Promise<ProcessResult> {
  const fileName = path.basename(inputPath);

  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    // Recortar padding transparente/blanco
    const trimmed = await image
      .trim({
        threshold: 10, // Tolerancia para detectar "vacío" (0-255)
      })
      .toBuffer({ resolveWithObject: true });

    // Guardar la imagen recortada
    await sharp(trimmed.data).toFile(outputPath);

    return {
      file: fileName,
      success: true,
      originalSize: { width: metadata.width!, height: metadata.height! },
      newSize: { width: trimmed.info.width, height: trimmed.info.height },
    };
  } catch (error) {
    return {
      file: fileName,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function processDirectory(dir: string, dirName: string) {
  console.log(`\n🔄 Procesando ${dirName}...`);

  const files = fs.readdirSync(dir).filter((f) => /\.(png|jpeg|jpg|gif|webp)$/i.test(f));

  console.log(`   Encontradas ${files.length} imágenes\n`);

  let processed = 0;
  let trimmed = 0;
  let errors = 0;

  for (const file of files) {
    const inputPath = path.join(dir, file);
    const outputPath = inputPath; // Sobrescribir el archivo original

    const result = await trimImage(inputPath, outputPath);

    if (result.success) {
      processed++;
      const widthDiff = result.originalSize!.width - result.newSize!.width;
      const heightDiff = result.originalSize!.height - result.newSize!.height;

      if (widthDiff > 0 || heightDiff > 0) {
        trimmed++;
        console.log(
          `   ✂️  ${result.file}: ${result.originalSize!.width}x${result.originalSize!.height} → ${result.newSize!.width}x${result.newSize!.height} (recortado ${widthDiff}x${heightDiff}px)`,
        );
      } else {
        console.log(`   ✅ ${result.file}: sin cambios`);
      }
    } else {
      errors++;
      console.log(`   ❌ ${result.file}: ${result.error}`);
    }
  }

  console.log(
    `\n   📊 Resumen: ${processed} procesadas, ${trimmed} recortadas, ${errors} errores`,
  );
}

async function main() {
  console.log('🎨 Recortando padding transparente de imágenes...\n');
  console.log('⚠️  ADVERTENCIA: Esto sobrescribirá las imágenes originales');
  console.log('   Asegúrate de tener un backup si lo necesitas\n');

  // Procesar banderas
  await processDirectory(flagsDir, 'Banderas');

  // Procesar escudos de clubes
  await processDirectory(clubsDir, 'Escudos de clubes');

  console.log('\n✨ ¡Proceso completado!\n');
}

main().catch(console.error);
