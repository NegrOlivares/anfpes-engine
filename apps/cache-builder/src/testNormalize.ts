function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

console.log('Test nacionalidad:');
console.log(`"Austria" normalizado: "${normalizeString('Austria')}"`);
console.log(`"AUSTRIA" normalizado: "${normalizeString('AUSTRIA')}"`);
console.log(`¿Son iguales? ${normalizeString('Austria') === normalizeString('AUSTRIA')}`);
