import { ClassParser } from 'windicss/utils/parser';
import { keyOrder } from './order';
import type { colorObject, DictStr } from 'windicss/types/interfaces';

export function flatColors(colors: colorObject, head?: string): DictStr {
  let flatten: { [ key:string ]: string } = {};
  for (const [key, value] of Object.entries(colors)) {
    if (typeof value === 'string') {
      flatten[(head && key === 'DEFAULT') ? head : head ? `${head}-${key}`: key] = value;
    } else if (typeof value === 'function') {
      flatten[(head && key === 'DEFAULT') ? head : head ? `${head}-${key}`: key] = 'currentColor';
    } else {
      flatten = { ...flatten, ...flatColors(value, head ? `${head}-${key}`: key) };
    }
  }
  return flatten;
}

export function hex2RGB(hex: string): number[] | undefined {
  const RGB_HEX = /^#?(?:([\da-f]{3})[\da-f]?|([\da-f]{6})(?:[\da-f]{2})?)$/i;
  const [, short, long] = String(hex).match(RGB_HEX) || [];

  if (long) {
    const value = Number.parseInt(long, 16);
    return [value >> 16, (value >> 8) & 0xff, value & 0xff];
  } else if (short) {
    return Array.from(short, (s) => Number.parseInt(s, 16)).map(
      (n) => (n << 4) | n
    );
  }
}

export function connectList<T>(list: T[][]) {
  return list.reduce((previous, current) => previous.concat(current), []);
}

export function sortClassNames(classNames: string, variantsMap: { [key: string]: number }) {
  const variantsArray = Object.keys(variantsMap);
  const ast = new ClassParser(classNames, ":", variantsArray).parse();
  return ast.map(({ raw, variants, important }) => {
    const head = variants.join(':') + ':';
    const utility = raw.replace(head, '');
    const key = utility.match(/\w+/);
    const hasDynamicValue = utility.match(/\d+/);
    const offset = variants.map(i => variantsMap[i] * 100).reduce((p, c) => p + c, 0) + (important ? 500 : 0) + (hasDynamicValue ? 25 : 0);
    if (key === null) return { raw, weight: offset };
    return { raw, weight: (keyOrder[key[0]] ?? 300) + offset };
  }).sort((a, b) => a.weight - b.weight).map(i => i.raw).join(' ');
}

export function rem2px(str?: string) {
  if (!str) return;
  let index = 0;
  const output: string[] = [];

  while (index < str.length) {
    const rem = str.slice(index,).match(/-?[\d.]+rem;/);
    if (!rem || !rem.index) break;
    const px = ` /* ${parseFloat(rem[0].slice(0, -4)) * 16}px */`;
    const end = index + rem.index + rem[0].length;
    output.push(str.slice(index, end));
    output.push(px);
    index = end;
  }
  output.push(str.slice(index,));
  return output.join('');
}

function componentToHex(c: number) {
  const hex = c.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}

export function rgb2Hex(r: number, g: number, b: number) {
  return '#' + componentToHex(r*255) + componentToHex(g*255) + componentToHex(b*255);
}

function match(a: [r: number, g: number, b: number], b: [r: number, g: number, b: number]) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

export function isDarkColor(r: number, g: number, b: number) {
  if (match([r, g, b], [20, 184, 166]) || match([r, g, b], [245, 158, 11]) || match([r, g, b], [249, 115, 22]) || match([r, g, b], [217, 70, 239]) || match([r, g, b], [6, 182, 212]) || match([r, g, b], [132, 204, 22])) return true;
  // special cases: orange-500 yellow-500 teal-500 fuchsia-500 cyan-500 lime-500, With 500 as the dividing line, the view is better

  const hsp = Math.sqrt(
    0.299 * (r * r) +
    0.587 * (g * g) +
    0.114 * (b * b)
  );

  return hsp <= 150;
}

export function arrayEqual(array1: unknown[], array2: unknown[]) {
  return array1.length === array2.length && array1.every((value, index) => value === array2[index]);
}
