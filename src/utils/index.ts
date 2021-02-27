import { ClassParser } from 'windicss/utils/parser';
import { workspace, MarkdownString, Range, Position, DecorationOptions } from 'vscode';
import { HTMLParser } from './parser';
import { keyOrder } from './order';
import type { DeepNestDictStr, DictStr } from '../interfaces';

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

export async function decorateWithLength(index: number, line: string, length = 25, color = '#AED0A4', text = '...') {
  return await new HTMLParser(line).parseClasses().filter(({ result }) => result.length > length).map(({ start, end, result }) => {
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
  await new HTMLParser(line).parseClasses().forEach(({ start, end, result }) => {
    const classes = new ClassParser(result).parse();
    if (classes[count]) {
      decorations.push({
        range: new Range(new Position(index, start + classes[count].start - 1), new Position(index, end)),
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

export function sortClassNames(classNames: string, variantsMap: {[key:string]: number}) {
  const ast = new ClassParser(classNames).parse();
  return ast.map(({ raw, variants, important }) => {
    const head = variants.join(':') + ':';
    const utility = raw.replace(head, '');
    const key = utility.match(/\w+/);
    const offset =  variants.map(i => variantsMap[i] * 100).reduce((p, c) => p + c, 0) + (important ? 500: 0);
    if (key === null) return { raw, weight: offset };
    return { raw, weight: (keyOrder[key[0]] ?? 300 ) + offset };
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