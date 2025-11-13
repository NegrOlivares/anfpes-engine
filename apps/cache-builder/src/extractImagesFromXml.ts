import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parseStringPromise } from 'xml2js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DRAWINGS_PATH = path.join(
  __dirname,
  '../../../excel_extracted/xl/drawings/drawing1.xml',
);
const MEDIA_PATH = path.join(__dirname, '../../../excel_extracted/xl/media');
const OUTPUT_FLAGS = path.join(__dirname, '../../../apps/ui/public/images/flags');
const OUTPUT_SHIELDS = path.join(__dirname, '../../../apps/ui/public/images/shields');

// Crear directorios de salida
fs.mkdirSync(OUTPUT_FLAGS, { recursive: true });
fs.mkdirSync(OUTPUT_SHIELDS, { recursive: true });

interface ImageMapping {
  imageFile: string;
  col: string;
  row: number;
  fromCol: number;
  fromRow: number;
}

async function parseDrawings() {
  console.log('📖 Leyendo archivo de dibujos...');
  const xmlContent = fs.readFileSync(DRAWINGS_PATH, 'utf-8');
  const result = await parseStringPromise(xmlContent);

  const imageMappings: ImageMapping[] = [];

  // Navegar por la estructura del XML
  const worksheet = result['xdr:wsDr'];
  if (!worksheet || !worksheet['xdr:twoCellAnchor']) {
    console.log('❌ No se encontraron imágenes en el XML');
    return imageMappings;
  }

  const anchors = worksheet['xdr:twoCellAnchor'];
  console.log(`🔍 Encontrados ${anchors.length} elementos de imagen`);

  anchors.forEach((anchor: any, index: number) => {
    try {
      // Obtener posición de inicio (celda donde está la imagen)
      const from = anchor['xdr:from']?.[0];
      if (!from) return;

      const fromCol = parseInt(from['xdr:col']?.[0] || '0');
      const fromRow = parseInt(from['xdr:row']?.[0] || '0');

      // Obtener referencia a la imagen
      const pic = anchor['xdr:pic']?.[0];
      const blipFill = pic?.['xdr:blipFill']?.[0];
      const blip = blipFill?.['a:blip']?.[0];
      const embed = blip?.['$']?.['r:embed'];

      if (embed) {
        // El embed es algo como "rId1", "rId2", etc.
        // Necesitamos mapear esto al archivo real
        imageMappings.push({
          imageFile: embed,
          col: String.fromCharCode(65 + fromCol), // 0=A, 1=B, etc.
          row: fromRow + 1, // Excel rows are 1-indexed
          fromCol,
          fromRow,
        });
      }
    } catch (error) {
      console.error(`Error procesando imagen ${index}:`, error);
    }
  });

  console.log(`✅ Mapeadas ${imageMappings.length} imágenes a celdas`);
  return imageMappings;
}

async function getRelsMapping() {
  console.log('📖 Leyendo relaciones (rels)...');
  const relsPath = path.join(
    __dirname,
    '../../../excel_extracted/xl/drawings/_rels/drawing1.xml.rels',
  );
  const xmlContent = fs.readFileSync(relsPath, 'utf-8');
  const result = await parseStringPromise(xmlContent);

  const relsMap = new Map<string, string>();

  const relationships = result['Relationships']?.['Relationship'];
  if (!relationships) {
    console.log('❌ No se encontraron relaciones');
    return relsMap;
  }

  relationships.forEach((rel: any) => {
    const id = rel['$']['Id'];
    const target = rel['$']['Target'];
    if (id && target) {
      // target es algo como "../media/image1.png"
      const filename = path.basename(target);
      relsMap.set(id, filename);
    }
  });

  console.log(`✅ Mapeadas ${relsMap.size} relaciones rId -> archivo`);
  return relsMap;
}

async function main() {
  console.log('🚀 Iniciando extracción de imágenes del Excel\n');

  const imageMappings = await parseDrawings();
  const relsMap = await getRelsMapping();

  console.log('\n📊 Combinando información...\n');

  // Combinar la información
  const finalMappings = imageMappings.map((mapping) => ({
    ...mapping,
    actualFile: relsMap.get(mapping.imageFile) || 'unknown',
  }));

  // Filtrar imágenes en las columnas H y J (índices 7 y 9)
  // y en el rango de filas 19-330
  const flagsAndShields = finalMappings.filter(
    (m) => (m.fromCol === 7 || m.fromCol === 9) && m.row >= 19 && m.row <= 330,
  );

  console.log(
    `🎯 Encontradas ${flagsAndShields.length} imágenes en columnas H y J (filas 19-330)`,
  );

  // Separar banderas (col J, rows 227-330) y escudos (col H, rows 19-221)
  const shields = flagsAndShields.filter(
    (m) => m.fromCol === 7 && m.row >= 19 && m.row <= 221,
  );
  const flags = flagsAndShields.filter(
    (m) => m.fromCol === 9 && m.row >= 227 && m.row <= 330,
  );

  console.log(`\n🛡️  Escudos encontrados: ${shields.length}`);
  console.log(`🏴 Banderas encontradas: ${flags.length}\n`);

  // Guardar el mapeo completo
  const outputMapping = {
    shields: shields.map((s) => ({
      file: s.actualFile,
      col: s.col,
      row: s.row,
      sourceCol: s.fromCol,
    })),
    flags: flags.map((f) => ({
      file: f.actualFile,
      col: f.col,
      row: f.row,
      sourceCol: f.fromCol,
    })),
  };

  const mappingPath = path.join(__dirname, '../../../data/reference/image-mappings.json');
  fs.writeFileSync(mappingPath, JSON.stringify(outputMapping, null, 2), 'utf-8');
  console.log(`💾 Mapeo guardado en: ${mappingPath}`);

  // Copiar las imágenes a las carpetas correspondientes
  console.log('\n📁 Copiando imágenes...');

  let copiedShields = 0;
  let copiedFlags = 0;

  shields.forEach((shield) => {
    const srcPath = path.join(MEDIA_PATH, shield.actualFile);
    const destPath = path.join(OUTPUT_SHIELDS, shield.actualFile);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      copiedShields++;
    }
  });

  flags.forEach((flag) => {
    const srcPath = path.join(MEDIA_PATH, flag.actualFile);
    const destPath = path.join(OUTPUT_FLAGS, flag.actualFile);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      copiedFlags++;
    }
  });

  console.log(`✅ Copiados ${copiedShields} escudos a: ${OUTPUT_SHIELDS}`);
  console.log(`✅ Copiadas ${copiedFlags} banderas a: ${OUTPUT_FLAGS}`);

  console.log('\n🎉 ¡Extracción completada!');
  console.log('\n📝 Próximos pasos:');
  console.log('   1. Revisar las imágenes extraídas en apps/ui/public/images/');
  console.log(
    '   2. Renombrar los archivos según corresponda (ej: image42.png → argentina.png)',
  );
  console.log('   3. Actualizar el código para usar estas imágenes');
}

main().catch(console.error);
