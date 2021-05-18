import { workspace, MarkdownString, Range, Position, DecorationOptions } from 'vscode';
import { ClassParser } from 'windicss/utils/parser';
import { HTMLParser } from './parser';
import { keyOrder } from './order';
import { flatColors as _flatColors } from 'windicss/utils';
import type { colorObject, DictStr } from 'windicss/types/interfaces';

export function flatColors(colors: colorObject) {
  colors = _flatColors(colors);
  for (const [key, value] of Object.entries(colors)) {
    if (typeof value === 'function') {
      colors[key] = 'currentColor';
    }
  }
  return colors as DictStr;
}

export function highlightCSS(css?: string): MarkdownString | undefined {
  if (css) {
    return new MarkdownString(`\`\`\`css\n${css}\n\`\`\``);
  }
}

export function isColor(className: string, colors: { [key: string]: string | string[] }): number[] | undefined {
  for (const [key, value] of Object.entries(colors)) {
    if (className.endsWith('-' + key)) {
      return hex2RGB(Array.isArray(value) ? value[0] : value);
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

export async function decorateWithLength(index: number, line: string, length = 25, color = '#AED0A4', text = '...') {
  return new HTMLParser(line).parseClasses().filter(({ result }) => result.length > length).map(({ start, end, result }) => {
    return {
      range: new Range(new Position(index, start + length), new Position(index, end)),
      renderOptions: {
        after: {
          color,
          contentText: text,
        },
      },
      hoverMessage: result.slice(length,),
    };
  });
}

export async function decorateWithCount(index: number, line: string, count = 3, color = '#AED0A4', text = ' ...') {
  const decorations: DecorationOptions[] = [];
  new HTMLParser(line).parseClasses().forEach(({ start, end, result }) => {
    const classes = new ClassParser(result).parse();
    if (classes[count]) {
      decorations.push({
        range: new Range(new Position(index, start + classes[count].start), new Position(index, end)),
        renderOptions: {
          after: {
            color,
            contentText: text,
          },
        },
        hoverMessage: result.slice(classes[count].start,),
      });
    }
  });
  return decorations;
}

export function sortClassNames(classNames: string, variantsMap: { [key: string]: number }) {
  const ast = new ClassParser(classNames).parse();
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

export function getConfig<T = any>(key: string): T | undefined {
  return workspace
    .getConfiguration()
    .get<T>(key);
}

export async function setConfig(key: string, value: any, isGlobal = true) {
  return await workspace
    .getConfiguration()
    .update(key, value, isGlobal);
}

export function toggleConfig(key: string) {
  const config = getConfig(key) as boolean;
  setConfig(key, !config);
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
