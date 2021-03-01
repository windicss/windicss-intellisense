import { ExtensionContext, languages, Range, Position, CompletionItem, CompletionItemKind, Color, ColorInformation, Hover } from 'vscode';
import { highlightCSS, isColor, getConfig } from '../utils';
import { fileTypes } from '../utils/filetypes';
import { ClassParser } from 'windicss/utils/parser';
import type { Core } from '../interfaces';
import type { Disposable } from 'vscode';

const TRIGGERS = ['"', '\'', ' ', ':', ''];

export async function registerCompletions(ctx: ExtensionContext, core: Core): Promise<void> {
  function createDisposables() {
    let disposables: Disposable[] = [];
    if (!getConfig('windicss.enableCodeCompletion')) return;
    for (const { extension, patterns } of fileTypes) {
      patterns.forEach(pattern => {
        // class completion
        disposables = disposables.concat(languages.registerCompletionItemProvider(extension, {
          provideCompletionItems: (document, position) => {
            // Get range including all characters in the current line till the current position
            const range = new Range(new Position(position.line, 0), position);
            // Get text in current line
            const textInCurrentLine = document.getText(range);
            const matchCursorIsInCorrectPosition = textInCurrentLine.match(pattern.regex);
            const classesInCurrentLine = textInCurrentLine
              .match(pattern.regex)?.[1]
              .split(pattern.splitCharacter) ?? [];
            if(matchCursorIsInCorrectPosition === null) { return; }
            const staticCompletion = getConfig('windicss.enableUtilityCompletion') ? core.staticCompletions.filter(i => !classesInCurrentLine.includes(i)).map(classItem => {
              const item = new CompletionItem(classItem, CompletionItemKind.Constant);
              item.documentation = highlightCSS(core.processor?.interpret(classItem).styleSheet.build());
              return item;
            }): [];

            const variantsCompletion = getConfig('windicss.enableVariantCompletion') ? core.variantCompletions.map(({ label, documentation }) => {
              const item = new CompletionItem(label, CompletionItemKind.Module);
              item.documentation = documentation;
              // trigger suggestion after select variant
              item.command = {
                command: 'editor.action.triggerSuggest',
                title: label,
              };
              return item;
            }): [];

            const dynamicCompletion = getConfig('windicss.enableDynamicCompletion') ? core.dynamicCompletions.map(({ label, position }) => {
              const item = new CompletionItem(label, CompletionItemKind.Variable);
              // item.documentation = highlightCSS(core.processor?.interpret())
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
              color.sortText = '-' + index.toString().padStart(8, '0');
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
        disposables = disposables.concat(languages.registerHoverProvider(extension, {
          // hover class show css preview
          provideHover: (document, position, token) => {
            const word = document.getText(document.getWordRangeAtPosition(position, /[\w-:+.@!/]+/));
            const style = core.processor?.interpret(word);
            if (style && style.ignored.length === 0) { return new Hover(highlightCSS(style.styleSheet.build()) ?? ''); }
          },
        }));
      }

      if (getConfig('windicss.enableColorDecorators')) {
        disposables = disposables.concat(languages.registerColorProvider(extension, {
          // insert color before class
          provideDocumentColors: (document, token) => {
            const colors: ColorInformation[] = [];
            for (const line of Array.from(Array(document.lineCount).keys())) {
              const text = document.lineAt(line).text;
              if (text.match(/(class|className|dark|light|active|after|before|checked|disabled|focus|hover|tw)=["|']([.\w-+@: ]*)/)) {
                const matched = text.match(/(?<=(class|className|dark|light|active|after|before|checked|disabled|focus|hover|tw)=["|'])[^"']*/);
                if (matched && matched.index) {
                  const offset = matched.index;
                  const elements = new ClassParser(matched[0]).parse(false);
                  elements.forEach(element => {
                    if (typeof element.content === 'string') {
                      const color = isColor(element.raw, core.colors);
                      if (color) {
                        const char = element.start + offset;
                        colors.push(new ColorInformation(new Range(new Position(line, char), new Position(line, char + 1)), new Color(color[0]/255, color[1]/255, color[2]/255, 1)));
                      }
                    }
                  });
                }
              }
            }
            return colors;
          },
          provideColorPresentations: (color, ctx, token) => {
            return [];
          },
        }));
      }
    }
    ctx.subscriptions.push(...disposables);
  }

  createDisposables();
}
