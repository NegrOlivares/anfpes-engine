/**
 * Generate a single thumbnail from a face image
 * Usage: npx tsx src/addSingleThumbnail.ts <filename>
 * Example: npx tsx src/addSingleThumbnail.ts A-12345.png
 *
 * Or process all faces that don't have thumbnails yet:
 * npx tsx src/addSingleThumbnail.ts --sync
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FACES_DIR = path.join(__dirname, '../../ui/public/images/faces');
const THUMBS_DIR = path.join(__dirname, '../../ui/public/images/thumbs');
const THUMB_SIZE = 32;

async function generateSingleThumbnail(filename: string): Promise<boolean> {
  const inputPath = path.join(FACES_DIR, filename);
  const outputPath = path.join(THUMBS_DIR, filename);

  try {
    // Check if face image exists
    await fs.access(inputPath);

    // Create thumbs directory if it doesn't exist
    await fs.mkdir(THUMBS_DIR, { recursive: true });

    // Generate thumbnail
    await sharp(inputPath)
      .resize(THUMB_SIZE, THUMB_SIZE, {
        fit: 'cover',
        position: 'center',
      })
      .png({
        quality: 80,
        compressionLevel: 9,
        palette: true,
      })
      .toFile(outputPath);

    console.log(`✅ Miniatura generada: ${filename}`);
    return true;
  } catch (error) {
    console.error(`❌ Error procesando ${filename}:`, error);
    return false;
  }
}

async function syncAllMissingThumbnails(): Promise<void> {
  console.log('🔄 Sincronizando miniaturas faltantes...\n');

  // Get all face images
  const faceFiles = await fs.readdir(FACES_DIR);
  const imageFiles = faceFiles.filter((file) => {
    if (!file.endsWith('.png')) return false;
    if (file === 'missing.png' || file === 'Legend.png') return false;
    if (file === 'fallback.png') return false;
    return true;
  });

  // Get existing thumbnails
  let existingThumbs: string[] = [];
  try {
    existingThumbs = await fs.readdir(THUMBS_DIR);
  } catch {
    // Thumbs directory doesn't exist yet
    await fs.mkdir(THUMBS_DIR, { recursive: true });
  }

  const existingThumbsSet = new Set(existingThumbs);

  // Find missing thumbnails
  const missingThumbs = imageFiles.filter((file) => !existingThumbsSet.has(file));

  if (missingThumbs.length === 0) {
    console.log('✅ Todas las miniaturas están actualizadas!\n');
    return;
  }

  console.log(`📊 Miniaturas faltantes: ${missingThumbs.length}\n`);

  let processed = 0;
  let errors = 0;

  for (const file of missingThumbs) {
    const success = await generateSingleThumbnail(file);
    if (success) {
      processed++;
    } else {
      errors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Sincronización completada!');
  console.log('='.repeat(60));
  console.log(`📊 Procesadas: ${processed} imágenes`);
  console.log(`❌ Errores: ${errors}`);
  console.log('='.repeat(60) + '\n');
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ Error: Debes proporcionar un nombre de archivo o usar --sync');
    console.log('\nUso:');
    console.log('  npx tsx src/addSingleThumbnail.ts <filename>');
    console.log('  npx tsx src/addSingleThumbnail.ts A-12345.png');
    console.log('  npx tsx src/addSingleThumbnail.ts --sync');
    process.exit(1);
  }

  if (args[0] === '--sync') {
    await syncAllMissingThumbnails();
    return;
  }

  const filename = args[0];

  if (!filename.endsWith('.png')) {
    console.error('❌ Error: El archivo debe ser una imagen PNG');
    process.exit(1);
  }

  const success = await generateSingleThumbnail(filename);

  if (!success) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
