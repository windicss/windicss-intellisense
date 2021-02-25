import { ExtensionContext, workspace, languages, Range, Position, CompletionItem, CompletionItemKind, Color, ColorInformation, Hover } from "vscode";
import { init } from './core';
import { highlightCSS, isColor } from '../utils';
import { fileTypes } from '../utils/filetypes';
import { ClassParser } from 'windicss/utils/parser';
import type { Core } from '../interfaces';
import type { Disposable } from 'vscode';

let CORE: Core = { colors: {}, variantCompletions: [], staticCompletions: [], colorCompletions: [], dynamicCompletions: [] };
const TRIGGERS = ['"', "'", ' ', ':', ''];

export async function registerCompletions(ctx: ExtensionContext): Promise<void> {
  CORE = await init();
  const fileSystemWatcher = workspace.createFileSystemWatcher('**/{tailwind,windi}.config.js');

  // Changes configuration should invalidate above cache
  fileSystemWatcher.onDidChange(async () => {
    CORE = await init();
  });

  // This handles the case where the project didn't have config file
  // but was created after VS Code was initialized
  fileSystemWatcher.onDidCreate(async () => {
    CORE = await init();
  });

  // If the config is deleted, utilities&variants should be regenerated
  fileSystemWatcher.onDidDelete(async () => {
    CORE = await init();
  });

  let disposables: Disposable[] = [];
  for (const { extension, patterns } of fileTypes) {
    patterns.forEach(pattern => {
      // class completion
      disposables = disposables.concat(languages.registerCompletionItemProvider(extension, {
        provideCompletionItems: (document, position) => {
          // Get range including all characters in the current line till the current position
          const range = new Range(new Position(position.line, 0), position);
          // Get text in current line
          const textInCurrentLine = document.getText(range);
          const classesInCurrentLine = textInCurrentLine
            .match(pattern.regex)?.[1]
            .split(pattern.splitCharacter) ?? [];

          const staticCompletion = CORE.staticCompletions.filter(i => !classesInCurrentLine.includes(i)).map(classItem => {
            const item = new CompletionItem(classItem, CompletionItemKind.Constant);
            item.documentation = highlightCSS(CORE.processor?.interpret(classItem).styleSheet.build());
            return item;
          });

          const variantsCompletion = CORE.variantCompletions.map(({ label, documentation }) => {
            const item = new CompletionItem(label, CompletionItemKind.Module);
            item.documentation = documentation;
            // trigger suggestion after select variant
            item.command = {
              command: 'editor.action.triggerSuggest',
              title: label
            };
            return item;
          });

          const dynamicCompletion = CORE.dynamicCompletions.map(({ label, position }) => {
            const item = new CompletionItem(label, CompletionItemKind.Variable);
            // item.documentation = highlightCSS(CORE.processor?.interpret())
            item.command = {
              command: 'cursorMove',
              arguments: [{
                to: "left",
                select: true,
                value: position,
              }],
              title: label
            };
            return item;
          });

          const colorsCompletion = CORE.colorCompletions.map(({ label, detail, documentation}) => {
            const color = new CompletionItem(label, CompletionItemKind.Color);
            color.detail = detail;
            color.documentation = documentation;
            return color;
          });

          return [...variantsCompletion, ...colorsCompletion, ...staticCompletion, ...dynamicCompletion];
        },
      
      }, ...TRIGGERS)).concat(languages.registerHoverProvider(extension, {
        // hover class show css preview
        provideHover: (document, position, token) => {
          const word = document.getText(document.getWordRangeAtPosition(position, /[\w-:+.@!/]+/));
          const style = CORE.processor?.interpret(word);
          if (style && style.ignored.length === 0) { return new Hover(highlightCSS(style.styleSheet.build()) ?? ''); }
        }
      })).concat(languages.registerColorProvider(extension, {
        // insert color before class
        provideDocumentColors: (document, token) => {
          const colors: ColorInformation[] = [];
          for (const line of Array.from(Array(document.lineCount).keys())) {
            const text = document.lineAt(line).text;
            if (text.match(/class=["|']([.\w-+@: ]*)/)) {
              const matched = text.match(/(?<=class=["|'])[^"']*/);
              if (matched && matched.index) {
                const offset = matched.index; 
                const elements = new ClassParser(matched[0]).parse(false);
                elements.forEach(element => {
                  if (typeof element.content === 'string') {
                    const color = isColor(element.raw, CORE.colors);
                    if (color) {
                      const char = element.start + offset;
                      colors.push(new ColorInformation(new Range(new Position(line, char), new Position(line, char + 1)), new Color(color[0]/255, color[1]/255, color[2]/255, 1)));
                    }
                  }
                });
              }
            };
          }
          return colors;
        },
        provideColorPresentations: (color, ctx, token) => {
          return [];
        }
      }));
    });
  };
  ctx.subscriptions.push(...disposables);
}