import { workspace, MarkdownString, Range, Position, DecorationOptions } from 'vscode';
import { HTMLParser } from './parser';
import { rem2px } from './index';
import { ClassParser } from 'windicss/utils/parser';
import type { Style, StyleSheet } from 'windicss/utils/style';


export function highlightCSS(css?: string): MarkdownString | undefined {
  if (css) {
    return new MarkdownString(`\`\`\`css\n${css}\n\`\`\``);
  }
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

export function buildStyle(styleSheet?: StyleSheet) {
  return styleSheet ? highlightCSS(getConfig('windicss.enableRemToPxPreview') ? rem2px(styleSheet.build(), getConfig('windicss.rootFontSize')) : styleSheet.build()) : undefined;
}

export function buildEmptyStyle(style: Style) {
  return highlightCSS(style.build().replace('{\n  & {}\n}', '{\n  ...\n}').replace('{}', '{\n  ...\n}').replace('...\n}\n}', '  ...\n  }\n}'));
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
