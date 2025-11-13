import XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXCEL_PATH = 'C:\\Users\\usuario\\Desktop\\anfpes-engine\\RAW DB + FORMULAS.xlsx';
const OUTPUT_DIR = path.join(__dirname, '../../../data/reference/images');

// Leer el archivo Excel
const workbook = XLSX.readFile(EXCEL_PATH, {
  cellStyles: true,
  cellHTML: true,
});

console.log('📊 Hojas disponibles:', workbook.SheetNames);

// Leer la hoja "3" por nombre
const sheetName = '3';
console.log(`\n📄 Leyendo hoja: ${sheetName}`);

const worksheet = workbook.Sheets[sheetName];

// Extraer datos del rango G19:J330
console.log('\n🔍 Extrayendo datos de G19:J330...\n');

const nationalities = [];
const clubs = [];

// Leer nacionalidades (columnas G y H aproximadamente)
for (let row = 19; row <= 330; row++) {
  const cellG = worksheet[`G${row}`];
  const cellH = worksheet[`H${row}`];

  if (cellG && cellG.v) {
    const nationality = String(cellG.v).trim();
    const flagInfo = cellH ? String(cellH.v) : '';

    if (nationality && nationality.length > 0) {
      nationalities.push({
        row,
        nationality,
        flagInfo,
        cellRef: `G${row}`,
      });
    }
  }

  // Leer clubs (columnas I y J aproximadamente)
  const cellI = worksheet[`I${row}`];
  const cellJ = worksheet[`J${row}`];

  if (cellI && cellI.v) {
    const club = String(cellI.v).trim();
    const shieldInfo = cellJ ? String(cellJ.v) : '';

    if (club && club.length > 0) {
      clubs.push({
        row,
        club,
        shieldInfo,
        cellRef: `I${row}`,
      });
    }
  }
}

console.log(`✅ Nacionalidades encontradas: ${nationalities.length}`);
console.log('Primeras 10 nacionalidades:');
nationalities.slice(0, 10).forEach((n) => {
  console.log(`  ${n.nationality} (${n.cellRef})`);
});

console.log(`\n✅ Clubs encontrados: ${clubs.length}`);
console.log('Primeros 10 clubs:');
clubs.slice(0, 10).forEach((c) => {
  console.log(`  ${c.club} (${c.cellRef})`);
});

// Intentar extraer imágenes embebidas
console.log('\n🖼️  Buscando imágenes embebidas...');

// Las imágenes en xlsx están en workbook['!images'] si están disponibles
const workbookAny = workbook as any;
if (workbookAny['!images']) {
  console.log('Imágenes encontradas:', workbookAny['!images'].length);
} else {
  console.log('⚠️  No se encontraron imágenes mediante la API de xlsx');
  console.log('Las imágenes embebidas requieren extracción manual del archivo .xlsx');
}

// Guardar los datos extraídos
const output = {
  nationalities: nationalities.map((n) => ({
    nationality: n.nationality,
    row: n.row,
  })),
  clubs: clubs.map((c) => ({
    club: c.club,
    row: c.row,
  })),
};

const outputPath = path.join(
  __dirname,
  '../../../data/reference/flags-and-shields-reference.json',
);
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

console.log(`\n💾 Datos guardados en: ${outputPath}`);
console.log('\n📝 Notas:');
console.log(
  '  - Las imágenes embebidas en Excel no se pueden extraer fácilmente con la librería xlsx',
);
console.log('  - Usa este listado como referencia para buscar banderas y escudos en:');
console.log('    • Banderas: https://flagpedia.net/download');
console.log('    • Escudos: Wikimedia Commons o búsqueda en Google Imágenes');
