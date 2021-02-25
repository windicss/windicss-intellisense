import { MarkdownString, Range, Position } from "vscode";
import type { DeepNestDictStr, DictStr } from "./interfaces";

export function highlightCSS(css?:string): MarkdownString | undefined {
  if (css) {
    return new MarkdownString(`\`\`\`css\n${css}\n\`\`\``);
  }
}

export function flatColors(colors: DeepNestDictStr, head?: string): DictStr {
  let flatten: { [ key:string ]: string } = {};
  for (const [key, value] of Object.entries(colors)) {
    if (typeof value === 'string') {
      flatten[(head && key === 'DEFAULT') ? head : head ? `${head}-${key}`: key] = value;
    } else {
      flatten = { ...flatten, ...flatColors(value, head ? `${head}-${key}`: key) };
    }
  }
  return flatten;
}

export function isColor(className:string, colors: {[key:string]:string}): number[] | undefined {
  for (const [key, value] of Object.entries(colors)) {
    if (className.endsWith('-' + key)) {
      return hex2RGB(value);
    }
  }
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

export function parseVariants(str: string) {
  const variants: {
    start: number,
    end: number,
    text: string
  }[] = [];
  let index = 0;
  while (str.length > 0) {
    const variant = str.slice(index,).match(/\w+?(?=:)/);
    if (!(variant && variant.index)) break;
    const start = index + variant.index;
    const end = index + variant.index + variant[0].length;
    variants.push({ start, end, text: variant[0] });
    index = end + 1;
  }
  console.log(variants);
  return variants;
};

export async function decorateVariants(index: number, line: string) {
  return await parseVariants(line).map(({ start, end, text }) => {
    return {
      range: new Range(new Position(index, start), new Position(index, end)),
      renderOptions: {
        after: {
          color: '#06B6D4',
          contentText: text,
        },
      },
    };
  });
}