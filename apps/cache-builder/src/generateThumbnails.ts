/**
 * Generate thumbnail images (32x32px) from player face images
 * Run: npx tsx src/generateThumbnails.ts
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FACES_DIR = path.join(__dirname, '../../ui/public/images/faces');
const THUMBS_DIR = path.join(__dirname, '../../ui/public/images/thumbs');
const THUMB_SIZE = 32; // 32x32px thumbnails

async function generateThumbnails() {
  console.log('🖼️  Iniciando generación de miniaturas...\n');

  // Create thumbs directory if it doesn't exist
  try {
    await fs.mkdir(THUMBS_DIR, { recursive: true });
    console.log(`✅ Directorio creado/verificado: ${THUMBS_DIR}\n`);
  } catch (error) {
    console.error('❌ Error creando directorio:', error);
    process.exit(1);
  }

  // Read all files from faces directory
  let files: string[];
  try {
    files = await fs.readdir(FACES_DIR);
  } catch (error) {
    console.error('❌ Error leyendo directorio de faces:', error);
    process.exit(1);
  }

  // Filter only PNG images (exclude missing.png, Legend.png, and folders)
  const imageFiles = files.filter((file) => {
    if (!file.endsWith('.png')) return false;
    if (file === 'missing.png' || file === 'Legend.png') return false;
    if (file === 'fallback.png') return false;
    return true;
  });

  console.log(`📊 Total de imágenes a procesar: ${imageFiles.length}\n`);

  let processed = 0;
  let errors = 0;
  const startTime = Date.now();

  let lastInputPath = '';
  let lastOutputPath = '';

  for (const file of imageFiles) {
    const inputPath = path.join(FACES_DIR, file);
    const outputPath = path.join(THUMBS_DIR, file);
    lastInputPath = inputPath;
    lastOutputPath = outputPath;

    try {
      await sharp(inputPath)
        .resize(THUMB_SIZE, THUMB_SIZE, {
          fit: 'cover',
          position: 'center',
        })
        .png({
          quality: 80,
          compressionLevel: 9,
          palette: true, // Use palette-based PNG for smaller size
        })
        .toFile(outputPath);

      processed++;

      // Progress indicator every 100 images
      if (processed % 100 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const rate = (processed / (Date.now() - startTime)) * 1000;
        const remaining = Math.ceil((imageFiles.length - processed) / rate);
        console.log(
          `⏳ Progreso: ${processed}/${imageFiles.length} (${((processed / imageFiles.length) * 100).toFixed(1)}%) - ${elapsed}s - ETA: ${remaining}s`,
        );
      }
    } catch (error) {
      errors++;
      console.error(`❌ Error procesando ${file}:`, error);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('✅ Generación completada!');
  console.log('='.repeat(60));
  console.log(`📊 Procesadas: ${processed} imágenes`);
  console.log(`❌ Errores: ${errors}`);
  console.log(`⏱️  Tiempo total: ${totalTime} segundos`);
  console.log(
    `🚀 Velocidad promedio: ${(processed / parseFloat(totalTime)).toFixed(1)} imágenes/s`,
  );
  console.log('='.repeat(60) + '\n');
}

generateThumbnails().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
