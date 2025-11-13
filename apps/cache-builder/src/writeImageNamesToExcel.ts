import XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parseStringPromise } from 'xml2js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXCEL_PATH = 'C:\\Users\\usuario\\Desktop\\anfpes-engine\\RAW DB + FORMULAS.xlsx';
const OUTPUT_PATH =
  'C:\\Users\\usuario\\Desktop\\anfpes-engine\\RAW DB + FORMULAS - CON NOMBRES.xlsx';
const DRAWINGS_PATH = path.join(
  __dirname,
  '../../../excel_extracted/xl/drawings/drawing1.xml',
);
const RELS_PATH = path.join(
  __dirname,
  '../../../excel_extracted/xl/drawings/_rels/drawing1.xml.rels',
);

interface ImageMapping {
  imageFile: string;
  actualFile: string;
  col: string;
  row: number;
  colIndex: number;
  rowIndex: number;
}

async function getRelsMapping() {
  console.log('📖 Leyendo relaciones de imágenes...');
  const xmlContent = fs.readFileSync(RELS_PATH, 'utf-8');
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
      const filename = path.basename(target);
      relsMap.set(id, filename);
    }
  });

  console.log(`✅ Mapeadas ${relsMap.size} relaciones`);
  return relsMap;
}

async function parseDrawings(relsMap: Map<string, string>) {
  console.log('📖 Leyendo posiciones de imágenes...');
  const xmlContent = fs.readFileSync(DRAWINGS_PATH, 'utf-8');
  const result = await parseStringPromise(xmlContent);

  const imageMappings: ImageMapping[] = [];

  const worksheet = result['xdr:wsDr'];
  if (!worksheet || !worksheet['xdr:twoCellAnchor']) {
    console.log('❌ No se encontraron imágenes');
    return imageMappings;
  }

  const anchors = worksheet['xdr:twoCellAnchor'];
  console.log(`🔍 Procesando ${anchors.length} imágenes...`);

  anchors.forEach((anchor: any) => {
    try {
      const from = anchor['xdr:from']?.[0];
      if (!from) return;

      const colIndex = parseInt(from['xdr:col']?.[0] || '0');
      const rowIndex = parseInt(from['xdr:row']?.[0] || '0');

      const pic = anchor['xdr:pic']?.[0];
      const blipFill = pic?.['xdr:blipFill']?.[0];
      const blip = blipFill?.['a:blip']?.[0];
      const embed = blip?.['$']?.['r:embed'];

      if (embed && relsMap.has(embed)) {
        const actualFile = relsMap.get(embed)!;
        imageMappings.push({
          imageFile: embed,
          actualFile,
          col: XLSX.utils.encode_col(colIndex),
          row: rowIndex + 1,
          colIndex,
          rowIndex,
        });
      }
    } catch (error) {
      // Ignorar errores en imágenes individuales
    }
  });

  console.log(`✅ Mapeadas ${imageMappings.length} imágenes`);
  return imageMappings;
}

async function main() {
  console.log('🚀 Iniciando proceso...\n');

  // Leer mapeos de imágenes
  const relsMap = await getRelsMapping();
  const imageMappings = await parseDrawings(relsMap);

  // Leer el Excel
  console.log('\n📊 Leyendo archivo Excel...');
  const workbook = XLSX.readFile(EXCEL_PATH);

  // Procesar la hoja "3"
  const sheetName = '3';
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    console.log('❌ No se encontró la hoja "3"');
    return;
  }

  console.log(`\n✍️  Escribiendo nombres de imágenes en las celdas...\n`);

  let count = 0;

  // Para cada imagen, escribir el nombre en una celda adyacente
  imageMappings.forEach((mapping) => {
    // Escribir en la columna inmediatamente a la derecha de la imagen
    const targetCol = XLSX.utils.encode_col(mapping.colIndex + 1);
    const cellAddress = `${targetCol}${mapping.row}`;

    // Crear o actualizar la celda
    worksheet[cellAddress] = {
      t: 's', // tipo string
      v: mapping.actualFile, // valor
    };

    count++;

    if (count <= 10) {
      console.log(`  ${cellAddress} = ${mapping.actualFile}`);
    }
  });

  console.log(`  ... (${count - 10} más)`);
  console.log(`\n✅ Escritas ${count} referencias de imágenes`);

  // Guardar el nuevo archivo
  console.log(`\n💾 Guardando archivo modificado...`);
  XLSX.writeFile(workbook, OUTPUT_PATH);

  console.log(`\n🎉 ¡Completado!`);
  console.log(`📁 Archivo guardado en: ${OUTPUT_PATH}`);
  console.log(
    `\n📝 Ahora puedes abrir el Excel y ver el nombre de cada imagen junto a ella.`,
  );
}

main().catch(console.error);
