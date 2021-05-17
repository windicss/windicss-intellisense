import { ExtensionContext, workspace, languages, Range, Position, CompletionItem, CompletionItemKind, Color, ColorInformation, Hover } from 'vscode';
import { highlightCSS, isColor, getConfig, rem2px } from '../utils';
import { fileTypes } from '../utils/filetypes';
import { ClassParser } from 'windicss/utils/parser';
import { HTMLParser } from '../utils/parser';
import type { Core } from '../interfaces';
import type { Disposable } from 'vscode';

const DISPOSABLES: Disposable[] = [];
let initialized = false;

export function registerCompletions(ctx: ExtensionContext, core: Core): Disposable[] {
  const TRIGGERS = ['"', '\'', ' ', (core.processor?.config('separator') ?? ':') as string, '('];
  function createDisposables() {
    const disposables: Disposable[] = [];

    if (!getConfig('windicss.enableCodeCompletion'))
      return;

    for (const { extension, patterns } of fileTypes) {
      patterns.forEach(pattern => {
        // class completion
        disposables.push(languages.registerCompletionItemProvider(extension, {
          provideCompletionItems: (document, position) => {
            // Get range including all characters in the current line till the current position
            const range = new Range(new Position(position.line, 0), position);
            // Get text in current line
            const textInCurrentLine = document.getText(range);
            const matchCursorIsInCorrectPosition = document.getText(new Range(new Position(0, 0), position)).match(/(?<=\w=["'])([^'"]*$)|(?<=<style)(.*$)/gmi);
            const classesInCurrentLine = textInCurrentLine
              .match(pattern.regex)?.[1]
              .split(pattern.splitCharacter) ?? [];
            if(matchCursorIsInCorrectPosition === null) { return; }
            const staticCompletion = getConfig('windicss.enableUtilityCompletion') ? core.staticCompletions.filter(i => !classesInCurrentLine.includes(i)).map((classItem, index) => {
              const item = new CompletionItem(classItem, CompletionItemKind.Constant);
              item.sortText = '1-' + index.toString().padStart(8, '0');
              item.documentation = highlightCSS(getConfig('windicss.enableRemToPxPreview') ? rem2px(core.processor?.interpret(classItem).styleSheet.build()) : core.processor?.interpret(classItem).styleSheet.build());
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
              // item.documentation = highlightCSS(core.processor?.interpret())
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

            const colorsCompletion = core.colorCompletions.map(({ label, detail, documentation }, index) => {
              const color = new CompletionItem(label, CompletionItemKind.Color);
              color.sortText = '0-' + index.toString().padStart(8, '0');
              color.detail = detail;
              color.documentation = documentation;
              return color;
            });

            return [...variantsCompletion, ...colorsCompletion, ...staticCompletion, ...dynamicCompletion];
          },

        }, ...TRIGGERS));


      });

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
