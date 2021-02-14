import { languages, workspace, Range, Position, CompletionItem, CompletionItemKind } from 'vscode';
import { generate } from './core';
import { fileTypes } from './filetypes';
import type { Generator } from './interfaces';
import type { ExtensionContext, Disposable } from 'vscode';

let GENERATOR:Generator = {variants: {}, staticUtilities: {}, dynamicUtilities: {}};
const TRIGGERS = ['"', "'", ' ', '\n', ':', '\t', '.'];

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext) {
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
      disposables = disposables.concat(languages.registerCompletionItemProvider(extension, {
        provideCompletionItems: (document, position) => {
          // Get range including all characters in the current line
          //  till the current position
          const range = new Range(new Position(position.line, 0), position);
  
          // Get text in current line
          const textInCurrentLine = document.getText(range);
  
          const classesInCurrentLine = textInCurrentLine
            .match(pattern.regex)?.[1]
            .split(pattern.splitCharacter) ?? [];

          const staticCompletion = Object.keys(GENERATOR.staticUtilities).filter(i => !classesInCurrentLine.includes(i)).map(classItem => {
            return new CompletionItem(classItem, CompletionItemKind.Constant);
          });

          const variantsCompletion = Object.keys(GENERATOR.variants).map(variant => {
            return new CompletionItem(variant + ':', CompletionItemKind.Module);
          });

          return [...variantsCompletion, ...staticCompletion];
        }
      }, ...TRIGGERS));
    });
  };
  context.subscriptions.push(...disposables);
  console.log('"windicss-intellisense" is now active!');
}

// this method is called when your extension is deactivated
export function deactivate() {}
