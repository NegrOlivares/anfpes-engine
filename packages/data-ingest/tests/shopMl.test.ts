import { describe, expect, test } from 'vitest';
import { parseShopMl, buildShopTagIndex } from '../src/readShopMl';

describe('Shop/ML parsing', () => {
  test('parses tab-delimited entries preserving diacritics', () => {
    const input = 'Iván Zamorano\tShop 1\r\nHugo Sánchez\tShop 1';
    const entries = parseShopMl(input);

    expect(entries).toEqual([
      { name: 'Iván Zamorano', tag: 'Shop 1' },
      { name: 'Hugo Sánchez', tag: 'Shop 1' },
    ]);
  });

  test('builds a case-insensitive index', () => {
    const entries = [
      { name: 'Iván Zamorano', tag: 'Shop 1' },
      { name: 'Hugo Sánchez', tag: 'Shop 1' },
    ];
    const index = buildShopTagIndex(entries);

    expect(index.get('iván zamorano')).toBe('Shop 1');
    expect(index.get('hugo sánchez')).toBe('Shop 1');
  });
});
