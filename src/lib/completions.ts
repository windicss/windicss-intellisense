import { ExtensionContext, workspace, languages, Range, Position, CompletionItem, CompletionItemKind, Color, ColorInformation, Hover, SnippetString } from 'vscode';
import { highlightCSS, isColor, getConfig, rem2px } from '../utils';
import { fileTypes } from '../utils/filetypes';
import { ClassParser } from 'windicss/utils/parser';
import { HTMLParser } from '../utils/parser';
import type { Core } from '../interfaces';
import type { Disposable } from 'vscode';

const DISPOSABLES: Disposable[] = [];
let initialized = false;

export function registerCompletions(ctx: ExtensionContext, core: Core): Disposable[] {
  function createDisposables() {
    const disposables: Disposable[] = [];

    if (!getConfig('windicss.enableCodeCompletion')) return;

    const attrs: {[key:string]: string[]} = {};
    for (const utility of core.utilities) {
      const key = utility.match(/[^-]+/)?.[0];
      const body = utility.match(/-.+/)?.[0].slice(1) || '~';
      if (key) {
        attrs[key] = key in attrs ? [...attrs[key], body] : [ body ];
      }
    }

    for (const { extension, pattern } of fileTypes) {
      disposables.push(languages.registerCompletionItemProvider(
        extension,
        {
          provideCompletionItems(document, position) {

            const text = document.getText(new Range(new Position(0, 0), position));
            if (text.match(pattern) === null) return [];

            const staticCompletion = getConfig('windicss.enableUtilityCompletion') ? core.staticCompletions.map((classItem, index) => {
              const item = new CompletionItem(classItem, CompletionItemKind.Constant);
              item.sortText = '1-' + index.toString().padStart(8, '0');
              return item;
            }): [];

            const variantsCompletion = getConfig('windicss.enableVariantCompletion') ? core.variantCompletions.map(({ label, documentation }, index) => {
              const item = new CompletionItem(label, CompletionItemKind.Module);
              item.documentation = documentation;
              item.sortText = '2-' + index.toString().padStart(8, '0');
              // trigger suggestion after select variant
              item.command = {
                command: 'editor.action.triggerSuggest',
                title: label,
              };
              return item;
            }): [];

            const dynamicCompletion = getConfig('windicss.enableDynamicCompletion') ? core.dynamicCompletions.map(({ label, position }, index) => {
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

            const colorsCompletion = core.colorCompletions.map(({ label, documentation }, index) => {
              const color = new CompletionItem(label, CompletionItemKind.Color);
              color.sortText = '0-' + index.toString().padStart(8, '0');
              color.documentation = documentation;
              return color;
            });

            return [...variantsCompletion, ...colorsCompletion, ...staticCompletion, ...dynamicCompletion];
          },

          resolveCompletionItem(item) {
            switch (item.kind) {
            case CompletionItemKind.Constant:
              item.documentation = highlightCSS(getConfig('windicss.enableRemToPxPreview') ? rem2px(core.processor?.interpret(item.label).styleSheet.build()) : core.processor?.interpret(item.label).styleSheet.build());
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
        '.',
        ':',
        '(',
        ' ',
      ));

      disposables.push(languages.registerCompletionItemProvider(
        extension,
        {
          provideCompletionItems(document, position) {
            const text = document.getText(new Range(new Position(0, 0), position));
            if (text.match(/(<\w+\s*)[^>]*$/) !== null) {
              const key = text.match(/\S+(?=\s*=\s*["']?[^"']*$)/)?.[0];
              if (key && key in attrs) {
                return attrs[key].map((value, index) => {
                  const item = new CompletionItem(value, CompletionItemKind.Constant);
                  item.detail = key;
                  item.sortText = '1-' + index.toString().padStart(8, '0');
                  return item;
                });
              }
              if (!key) {
                return Object.keys(attrs).map((name, index) => {
                  const item = new CompletionItem(name, CompletionItemKind.Value);
                  item.sortText = '0-' + index.toString().padStart(8, '0');
                  item.insertText = new SnippetString(`${name}="$1"`);
                  item.command = {
                    command: 'editor.action.triggerSuggest',
                    title: name,
                  };
                  return item;
                });
              }
            }
            return [];
          },

          resolveCompletionItem(item) {
            switch (item.kind) {
            case CompletionItemKind.Constant:
              const css = core.processor?.attributify({ [item.detail ?? ''] : [ item.label ] }).styleSheet.build();
              item.documentation = highlightCSS(getConfig('windicss.enableRemToPxPreview') ? rem2px(css) : css);
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
        '"',
        '=',
        ' ',
        '\'',
      ));

      // moved hover & color swatches out of patterns loop, to only calculcate them one time per file
      if (getConfig('windicss.enableHoverPreview')) {
        disposables.push(languages.registerHoverProvider(extension, {
          // hover class show css preview
          provideHover: (document, position, token) => {
            const range = document.getWordRangeAtPosition(position, /[^\s();{}'"`]+/);
            const word = document.getText(range);
            if (!range || !word)
              return;
            const style = core.processor?.interpret(word);
            if (style && style.ignored.length === 0) {
              return new Hover(
                highlightCSS(getConfig('windicss.enableRemToPxPreview')
                  ? rem2px(style.styleSheet.build())
                  : style.styleSheet.build()) ?? '',
                range,
              );
            }
          },
        })
        );
      }

      if (getConfig('windicss.enableColorDecorators')) {
        disposables.push(languages.registerColorProvider(extension, {
          // insert color before class
          provideDocumentColors: (document, token) => {
            const colors: ColorInformation[] = [];
            // try one time update instead of line
            const documentText = document.getText();
            const parser = new HTMLParser(documentText);
            const classes = parser.parseClasses();
            if (classes) {
              for (const c of classes) {
                const elements = new ClassParser(c.result).parse(false);
                for (const element of elements) {
                  if (element.type === 'group' && Array.isArray(element.content)) {
                    for (const e of element.content) {
                      const color = isColor(e.raw, core.colors);
                      if(color) colors.push(new ColorInformation(new Range(document.positionAt(c.start+e.start), document.positionAt(c.start+e.start + 1)), new Color(color[0]/255, color[1]/255, color[2]/255, 1)));
                    }
                  }
                  const color = isColor(element.raw, core.colors);
                  if(color) colors.push(new ColorInformation(new Range(document.positionAt(c.start+element.start), document.positionAt(c.start+element.start + 1)), new Color(color[0]/255, color[1]/255, color[2]/255, 1)));
                }
              }
            }
            return colors;
          },
          provideColorPresentations: (color, ctx, token) => {
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
