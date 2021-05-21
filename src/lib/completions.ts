import { ExtensionContext, workspace, languages, Range, Position, CompletionItem, CompletionItemKind, Color, ColorInformation, Hover, SnippetString, TextDocument, window } from 'vscode';
import { highlightCSS, isColor, getConfig, rem2px, hex2RGB, flatColors, rgb2Hex, arrayEqual } from '../utils';
import { fileTypes, patterns, allowAttr, applyRegex } from '../utils/filetypes';
import { ClassParser } from 'windicss/utils/parser';
import { HTMLParser } from '../utils/parser';
import { generateAttrUtilities } from './core/attributify';
import { Style } from 'windicss/utils/style';

import type { Disposable } from 'vscode';
import type { StyleSheet } from 'windicss/utils/style';
import type { Core } from '../interfaces';

const DISPOSABLES: Disposable[] = [];
let initialized = false;

export function registerCompletions(ctx: ExtensionContext, core: Core): Disposable[] {

  function createDisposables() {
    const disposables: Disposable[] = [];

    if (!getConfig('windicss.enableCodeCompletion')) return;

    const coreColors = flatColors((core?.processor?.theme('colors') || {}) as Record<string, any>);
    const { attrs, colors, dynamics } = generateAttrUtilities(core);

    const separator = core.processor?.config('separator', ':') as string;

    function isAttrVariant(word: string): boolean {
      const lastKey = word.match(/[^:-]+$/)?.[0] || word;
      return getConfig('windicss.enableAttrVariantCompletion') && lastKey in core.variants;
    }

    function isAttrUtility(word?: string): string | undefined {
      if (!word) return;
      const lastKey = word.match(/[^:-]+$/)?.[0] || word;
      return getConfig('windicss.enableAttrUtilityCompletion') && lastKey in attrs ? lastKey : undefined;
    }

    function isAttr(word: string): boolean {
      const lastKey = word.match(/[^:-]+$/)?.[0] || word;
      return (getConfig('windicss.enableAttrVariantCompletion') && lastKey in core.variants) || (getConfig('windicss.enableAttrUtilityCompletion') && lastKey in attrs);
    }

    function isValidColor(utility: string) {
      return isColor(utility, coreColors);
    }

    function createColor(document: TextDocument, start: number, offset: number, color: number[]) {
      return new ColorInformation(new Range(document.positionAt(start + offset), document.positionAt(start + offset + 1)), new Color(color[0]/255, color[1]/255, color[2]/255, 1));
    }

    function buildStyle(styleSheet?: StyleSheet) {
      return styleSheet ? highlightCSS(getConfig('windicss.enableRemToPxPreview') ? rem2px(styleSheet.build()) : styleSheet.build()) : undefined;
    }

    function buildEmptyStyle(style: Style) {
      return highlightCSS(style.build().replace('{\n  & {}\n}', '{\n  ...\n}').replace('{}', '{\n  ...\n}').replace('...\n}\n}', '  ...\n  }\n}'));
    }

    function buildAttrDoc(attr: string, variant?: string, separator?: string) {
      let style;
      if (variant) {
        style = core.variants[variant]();
        style.selector = `[${core.processor?.e(attr)}~="${variant}${separator}&"]`;
      } else {
        style = new Style(`[${core.processor?.e(attr)}~="&"]`);
      }
      return buildEmptyStyle(style);
    }

    function buildVariantDoc(variant?: string, attributify = false) {
      if (!variant) return '';
      const style = core.variants[variant]();
      if (attributify) {
        style.selector = `[${core.processor?.e(variant)}~="&"]`;
      } else {
        style.selector = '&';
      }

      return buildEmptyStyle(style);
    }

    for (const [ext, { type, pattern }] of Object.entries(fileTypes)) {
      // trigger suggestions in class = ... | className = ... | @apply ... | sm = ... | hover = ...
      disposables.push(languages.registerCompletionItemProvider(
        ext,
        {
          provideCompletionItems(document, position) {
            const text = document.getText(new Range(new Position(0, 0), position));

            if ((!pattern || text.match(pattern) === null) && text.match(patterns[type]) === null) {
              const key = text.match(/\S+(?=\s*=\s*["']?[^"']*$)/)?.[0];
              if ((!key) || !(allowAttr(type) && isAttrVariant(key))) return [];
            }

            const staticCompletion = getConfig('windicss.enableUtilityCompletion') ? core.utilities.map((classItem, index) => {
              const item = new CompletionItem(classItem, CompletionItemKind.Constant);
              item.sortText = '1-' + index.toString().padStart(8, '0');
              return item;
            }): [];

            const variantsCompletion = getConfig('windicss.enableVariantCompletion') ? Object.keys(core.variants).map((variant, index) => {
              const item = new CompletionItem(variant + separator, CompletionItemKind.Module);
              item.detail = variant;
              item.sortText = '2-' + index.toString().padStart(8, '0');
              // trigger suggestion after select variant
              item.command = {
                command: 'editor.action.triggerSuggest',
                title: variant,
              };
              return item;
            }): [];

            const dynamicCompletion = getConfig('windicss.enableDynamicCompletion') ? core.dynamics.map(({ label, position }, index) => {
              const item = new CompletionItem(label, CompletionItemKind.Variable);
              item.sortText = '3-' + index.toString().padStart(8, '0');
              item.command = {
                command: 'cursorMove',
                arguments: [{
                  to: 'left',
                  select: true,
                  value: position,
                }],
                title: label,
              };
              return item;
            }): [];

            const colorsCompletion = getConfig('windicss.enableUtilityCompletion') ? core.colors.map(({ label, documentation }, index) => {
              const color = new CompletionItem(label, CompletionItemKind.Color);
              color.sortText = '0-' + index.toString().padStart(8, '0');
              color.documentation = documentation;
              return color;
            }): [];

            return [...variantsCompletion, ...colorsCompletion, ...staticCompletion, ...dynamicCompletion];
          },

          resolveCompletionItem(item) {
            switch (item.kind) {
            case CompletionItemKind.Constant:
              item.documentation = buildStyle(core.processor?.interpret(item.label).styleSheet);
              break;
            case CompletionItemKind.Module:
              item.documentation = buildVariantDoc(item.detail);
              item.detail = undefined;
              break;
            case CompletionItemKind.Variable:
              // TODO
              break;
            case CompletionItemKind.Color:
              item.detail = core.processor?.interpret(item.label).styleSheet.build();
              break;
            }
            return item;
          },
        },
        ':',
        '(',
        ' ',
        ...(getConfig('windicss.enableEmmetCompletion') ? [ '.' ] : []),
      ));

      // trigger suggestion for bg = | text = | sm = | hover = | ...
      allowAttr(type) && disposables.push(languages.registerCompletionItemProvider(
        ext,
        {
          provideCompletionItems(document, position) {
            const text = document.getText(new Range(new Position(0, 0), position));
            if (text.match(/(<\w+\s*)[^>]*$/) !== null) {
              if (!text.match(/\S+(?=\s*=\s*["']?[^"']*$)/) || text.match(/<\w+\s+$/)) {
                let completions: CompletionItem[] = [];
                if (getConfig('windicss.enableAttrUtilityCompletion')) completions = completions.concat(Object.keys(attrs).map((name) => {
                  const item = new CompletionItem(name, CompletionItemKind.Field);
                  item.sortText = '0-' + name;
                  item.insertText = new SnippetString(`${name}="$1"`);
                  item.command = {
                    command: 'editor.action.triggerSuggest',
                    title: name,
                  };
                  return item;
                }));
                if (getConfig('windicss.enableAttrVariantCompletion')) completions = completions.concat(Object.keys(core.variants).map((name) => {
                  const item = new CompletionItem(name, CompletionItemKind.Value);
                  item.sortText = '1-' + name;
                  item.insertText = new SnippetString(`${name}="$1"`);
                  item.command = {
                    command: 'editor.action.triggerSuggest',
                    title: name,
                  };
                  return item;
                }));
                return completions;
              }
            }
            return [];
          },
          resolveCompletionItem(item) {
            switch (item.kind) {
            case CompletionItemKind.Field:
              item.documentation = buildAttrDoc(item.label);
              break;
            case CompletionItemKind.Value:
              item.documentation = buildVariantDoc(item.label, true);
              break;
            }
            return item;
          },
        },
        ':',
        ' '
      ));

      // trigger suggestions in bg = ... | text = ... | border = ... | xxx = ...
      allowAttr(type) && getConfig('windicss.enableAttrUtilityCompletion') && disposables.push(languages.registerCompletionItemProvider(
        ext,
        {
          provideCompletionItems(document, position) {
            const text = document.getText(new Range(new Position(0, 0), position));
            if (text.match(/(<\w+\s*)[^>]*$/) !== null) {
              const key = isAttrUtility(text.match(/\S+(?=\s*=\s*["']?[^"']*$)/)?.[0]);
              if (key) {
                const variantsCompletion = getConfig('windicss.enableVariantCompletion') ? Object.keys(core.variants).map((variant, index) => {
                  const item = new CompletionItem(variant + separator, CompletionItemKind.Module);
                  item.detail = key + ',' + variant;
                  item.sortText = '2-' + index.toString().padStart(8, '0');
                  item.command = {
                    command: 'editor.action.triggerSuggest',
                    title: variant,
                  };
                  return item;
                }): [];

                const valuesCompletion = getConfig('windicss.enableUtilityCompletion') ? attrs[key].map((value, index) => {
                  const item = new CompletionItem(value, CompletionItemKind.Constant);
                  item.detail = key;
                  item.sortText = '1-' + index.toString().padStart(8, '0');
                  return item;
                }): [];

                const dynamicCompletion = getConfig('windicss.enableDynamicCompletion') && key in dynamics? dynamics[key].map(({ value, position }, index) => {
                  const item = new CompletionItem(value, CompletionItemKind.Variable);
                  item.sortText = '3-' + index.toString().padStart(8, '0');
                  item.command = {
                    command: 'cursorMove',
                    arguments: [{
                      to: 'left',
                      select: true,
                      value: position,
                    }],
                    title: value,
                  };
                  return item;
                }): [];

                const colorsCompletion = getConfig('windicss.enableUtilityCompletion') && key in colors ? colors[key].map(({ value, doc }, index) => {
                  const color = new CompletionItem(value, CompletionItemKind.Color);
                  color.sortText = '0-' + index.toString().padStart(8, '0');
                  color.detail = key;
                  color.documentation = doc;
                  return color;
                }) : [];

                return [ ...colorsCompletion, ...valuesCompletion, ...dynamicCompletion, ...variantsCompletion];
              }
            }
            return [];
          },

          resolveCompletionItem(item) {
            switch (item.kind) {
            case CompletionItemKind.Constant:
              item.documentation = buildStyle(core.processor?.attributify({ [item.detail ?? ''] : [ item.label ] }).styleSheet);
              item.detail = undefined;
              break;
            case CompletionItemKind.Module:
              const [attr, variant] = item.detail?.split(',') || [];
              item.documentation = buildAttrDoc(attr, variant, separator);
              item.detail = undefined;
              break;
            case CompletionItemKind.Variable:
              break;
            case CompletionItemKind.Color:
              item.detail = core.processor?.attributify({ [item.detail ?? ''] : [ item.label ] }).styleSheet.build();
              break;
            }
            return item;
          },
        },
        '"',
        '=',
        '\'',
        ':',
        ' ',
      ));

      // moved hover & color swatches out of patterns loop, to only calculcate them one time per file
      if (getConfig('windicss.enableHoverPreview')) {
        disposables.push(languages.registerHoverProvider(ext, {
          provideHover: (document, position, token) => {
            const range = document.getWordRangeAtPosition(position, /[^\s();{}'"=`]+/);
            const word = document.getText(range);
            if (!range || !word)
              return;
            if (['class', 'className'].includes(word)) {
              // hover class or className, e.g. class= className=
              const text = document.getText(new Range(range.end, document.lineAt(document.lineCount-1).range.end));
              const match = text.match(/((?<=^=\s*["'])[^"']*(?=["']))|((?<=^=\s*)[^"'>\s]+)/);
              if (match) {
                const css = buildStyle(core.processor?.interpret(match[0]).styleSheet);
                if (css) return new Hover(css, range);
              }
            }

            if (isAttr(word)) {
              // hover attr, e.g. bg= sm:bg=
              const text = document.getText(new Range(range.end, document.lineAt(document.lineCount-1).range.end));
              const match = text.match(/((?<=^=\s*["'])[^"']*(?=["']))|((?<=^=\s*)[^"'>\s]+)/);
              if (match) {
                const css = buildStyle(core.processor?.attributify({ [word] : match[0].trim().split(/\s/).filter(i => i) }).styleSheet);
                if (css) return new Hover(css, range);
              }
            }
            // hover attr value or class value, e.g. class="bg-red-500 ..."  bg="red-500 ..."
            const text = document.getText(new Range(new Position(0, 0), position));
            const key = text.match(/\S+(?=\s*=\s*["']?[^"']*$)/)?.[0] ?? '';
            const style = isAttr(key) ? core.processor?.attributify({ [key]: [ word ] }) : ['className', 'class'].includes(key) || text.match(applyRegex) ? core.processor?.interpret(word) : undefined;
            if (style && style.ignored.length === 0) {
              const css = buildStyle(style.styleSheet);
              if (css) return new Hover(css, range);
            }
          },
        })
        );
      }

      if (getConfig('windicss.enableColorDecorators')) {
        disposables.push(languages.registerColorProvider(ext, {
          // insert color before class
          provideDocumentColors: (document, token) => {
            const colors: ColorInformation[] = [];
            // try one time update instead of line
            const documentText = document.getText();
            const parser = new HTMLParser(documentText);
            parser.removeComments();
            for (const attr of parser.parseAttrs()) {
              if (isAttrUtility(attr.key)) {
                // insert decoration in bg|text|... = "..."
                const regex = /\S+/igm;
                const data = attr.value.raw;
                let match;
                while ((match = regex.exec(data as string))) {
                  if (match) {
                    let color;
                    if (match[0] in coreColors) {
                      color = hex2RGB(coreColors[match[0]] as string);
                    } else if (match[0].startsWith('hex-')) {
                      color = hex2RGB(match[0].replace(/^hex-/, '#'));
                    }
                    if (color) colors.push(createColor(document, attr.value.start, match.index, color));
                  }
                }
              } else if (['class', 'className'].includes(attr.key) || isAttrVariant(attr.key)) {
                // insert decoration in class|className|sm|hover|... = "..."
                const elements = new ClassParser(attr.value.raw, core.processor?.config('separator', ':') as string, Object.keys(core.variants)).parse(false);
                for (const element of elements) {
                  if (element.type === 'group' && Array.isArray(element.content)) {
                    for (const e of element.content) {
                      const color = isValidColor(e.raw);
                      if(color.color) colors.push(createColor(document, attr.value.start, e.start, color.color));
                    }
                  }
                  const color = element.type === 'utility' && isValidColor(element.raw);
                  if(color && color.color) colors.push(createColor(document, attr.value.start, element.start, color.color));
                }
              }
            }

            // insert decoration in @apply ...
            for (const className of parser.parseApplies()) {
              const elements = new ClassParser(className.result, core.processor?.config('separator', ':') as string, Object.keys(core.variants)).parse(false);
              for (const element of elements) {
                if (element.type === 'group' && Array.isArray(element.content)) {
                  for (const e of element.content) {
                    const color = isValidColor(e.raw);
                    if(color && color.color) colors.push(createColor(document, className.start, e.start, color.color));
                  }
                }
                const color = element.type === 'utility' && isValidColor(element.raw);
                if(color && color.color) colors.push(createColor(document, className.start, element.start, color.color));
              }
            }

            return colors;
          },
          provideColorPresentations: (color, context) => {
            const editor = window.activeTextEditor;

            if (editor) {
              const document = editor.document;
              const range = context.document.getWordRangeAtPosition(context.range.end, /[@<:-\w]+/) as Range;
              const utility = document.getText(range);
              const vcolor = isValidColor(utility);
              if (!arrayEqual(vcolor.color as number[], [color.red * 255, color.green * 255, color.blue * 255]) && range) {
                const vrange = new Range(new Position(range.start.line, range.start.character + utility.indexOf(vcolor.key as string)), range.end);
                editor.edit(editBuilder => {
                  editBuilder.replace(vrange, `hex-${rgb2Hex(color.red, color.green, color.blue).slice(1,)}`);
                });
              }
            }

            return [];
          },
        })
        );
      }
    }

    ctx.subscriptions.push(...disposables);
    return disposables;
  }

  function init() {
    DISPOSABLES.forEach(i => i.dispose());
    DISPOSABLES.length = 0;
    DISPOSABLES.push(...createDisposables() || []);
  }

  if (!initialized) {
    workspace.onDidChangeConfiguration(init, null, ctx.subscriptions);
    initialized = true;
  }

  init();

  return DISPOSABLES;
}
