import { languages, workspace, window, Range, Position, CompletionItem, CompletionItemKind, Hover, ColorPresentation, ColorInformation, Color, commands, DocumentHighlight, DocumentHighlightKind, TextEdit } from 'vscode';
import { generate } from './core';
import { highlightCSS, isColor } from './utils';
import { fileTypes } from './filetypes';
import { registerCodeFolding } from './folding';
import { ClassParser, HTMLParser } from 'windicss/utils/parser';
import type { Generator } from './interfaces';
import type { ExtensionContext, Disposable } from 'vscode';

let GENERATOR:Generator = { colors: {}, variantCompletions: [], staticCompletions: [], colorCompletions: [], dynamicCompletions: [] };
const TRIGGERS = ['"', "'", ' ', ':', ''];

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(ctx: ExtensionContext) {
  // Generate utilities&variants and set them on activation
  GENERATOR = await generate();
  const fileSystemWatcher = workspace.createFileSystemWatcher('**/{tailwind,windi}.config.js');

  // Changes configuration should invalidate above cache
  fileSystemWatcher.onDidChange(async () => {
    GENERATOR = await generate();
  });

  // This handles the case where the project didn't have config file
  // but was created after VS Code was initialized
  fileSystemWatcher.onDidCreate(async () => {
    GENERATOR = await generate();
  });

  // If the config is deleted, utilities&variants should be regenerated
  fileSystemWatcher.onDidDelete(async () => {
    GENERATOR = await generate();
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

          const staticCompletion = GENERATOR.staticCompletions.filter(i => !classesInCurrentLine.includes(i)).map(classItem => {
            const item = new CompletionItem(classItem, CompletionItemKind.Constant);
            item.documentation = highlightCSS(GENERATOR.processor?.interpret(classItem).styleSheet.build());
            return item;
          });

          const variantsCompletion = GENERATOR.variantCompletions.map(({ label, documentation }) => {
            const item = new CompletionItem(label, CompletionItemKind.Module);
            item.documentation = documentation;
            // trigger suggestion after select variant
            item.command = {
              command: 'editor.action.triggerSuggest',
              title: label
            };
            return item;
          });

          const dynamicCompletion = GENERATOR.dynamicCompletions.map(({ label, position }) => {
            const item = new CompletionItem(label, CompletionItemKind.Variable);
            // item.documentation = highlightCSS(GENERATOR.processor?.interpret())
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

          const colorsCompletion = GENERATOR.colorCompletions.map(({ label, detail, documentation}) => {
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
          const style = GENERATOR.processor?.interpret(word);
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
                    const color = isColor(element.raw, GENERATOR.colors);
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
  // updateDecorations(ctx);
  registerCodeFolding(ctx);

  // const filePath = (window.activeTextEditor?.document.uri.fsPath);
  commands.registerTextEditorCommand("windicss.interpret", (textEditor, textEdit) => {
    console.log(textEditor.document.uri.fsPath);
  });

  commands.registerTextEditorCommand("windicss.compile", (textEditor, textEdit) => {
    console.log(textEditor.document.uri.fsPath);
  });
  
  // commands.registerTextEditorCommand("windicss.sort", (textEditor, textEdit) => {
  //   // console.log(textEditor.document.uri.fsPath);
  //   const document = textEditor.document;
  //   const text = document.getText();
  //   const parser = new HTMLParser(text);
  //   parser.parseClasses().forEach(({start, end, result}) => {
  //     // console.log(result);
  //     const utilities:string[] = [];
  //     const ignored:string[] = [];
  //     const ast = new ClassParser(result).parse();
  //     ast.forEach(obj => {
  //       if (obj.type === 'utility' && typeof obj.content === 'string') {
  //         utilities.push(obj.raw);
  //       } else if (obj.type === 'group') {

  //       } else {
  //         ignored.push(obj.raw);
  //       }
  //     })
  //     console.log(classes);
  //     textEdit.replace(new Range(document.positionAt(start), document.positionAt(end)), '234');
  //   });
  //   // textEditor.document.lineCount

  //   // textEdit.replace(new Range(new Position(0, 0), new Position(textEditor.document.lineCount, textEditor.document.)), '');
  //   // console.log(text);
  // });
  // registerHighlight(ctx);
  ctx.subscriptions.push(...disposables);
  console.log('"windicss-intellisense" is now active!');
}

// this method is called when your extension is deactivated
export function deactivate() {}
