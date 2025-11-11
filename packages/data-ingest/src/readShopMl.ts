import { readFileSync } from 'node:fs';
import { ShopTag, ShopTagIndex } from './types';

export interface ReadShopMlOptions {
  encoding?: BufferEncoding;
  delimiter?: RegExp;
}

const DEFAULT_DELIMITER = /\t+/;
const DEFAULT_ENCODING: BufferEncoding = 'latin1';

export function readShopMlFile(
  filePath: string,
  options: ReadShopMlOptions = {},
): ShopTag[] {
  const encoding = options.encoding ?? DEFAULT_ENCODING;
  const raw = readFileSync(filePath, { encoding });
  return parseShopMl(raw, options.delimiter);
}

export function parseShopMl(
  content: string,
  delimiter: RegExp = DEFAULT_DELIMITER,
): ShopTag[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line, index) => {
      const [name, tag] = splitNameAndTag(line, delimiter);
      if (!name || !tag) {
        throw new Error(`Invalid Shop/ML entry at line ${index + 1}: "${line}"`);
      }
      return { name, tag };
    });
}

export function buildShopTagIndex(entries: ShopTag[]): ShopTagIndex {
  return entries.reduce<ShopTagIndex>((map, entry) => {
    map.set(entry.name.toLowerCase(), entry.tag);
    return map;
  }, new Map());
}

function splitNameAndTag(line: string, delimiter: RegExp): [string, string] {
  const primary = line.split(delimiter).map((segment) => segment.trim());
  if (primary.length >= 2) {
    return [primary[0], primary[1]];
  }
  const fallback = line.split(/\s{2,}/).map((segment) => segment.trim());
  if (fallback.length >= 2) {
    return [fallback[0], fallback[1]];
  }
  const lastSpace = line.lastIndexOf(' ');
  if (lastSpace > 0) {
    return [line.slice(0, lastSpace).trim(), line.slice(lastSpace + 1).trim()];
  }
  return ['', ''];
}
