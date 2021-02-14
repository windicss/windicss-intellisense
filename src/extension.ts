import { languages, workspace, Range, Position, CompletionItem, CompletionItemKind } from 'vscode';
import { generateClasses } from './core';
import { fileTypes } from './filetypes';
import type { ExtensionContext, Disposable } from 'vscode';

let CLASSES:string[] = [];
const TRIGGERS = ['"', "'", ' ', '.'];

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext) {
  // Generate classes and set them on activation
  CLASSES = await generateClasses();
  const fileSystemWatcher = workspace.createFileSystemWatcher('**/{tailwind,windi}.config.js');

  // Changes configuration should invalidate above cache
  fileSystemWatcher.onDidChange(async () => {
    CLASSES = await generateClasses();
  });

  // This handles the case where the project didn't have config file
  // but was created after VS Code was initialized
  fileSystemWatcher.onDidCreate(async () => {
    CLASSES = await generateClasses();
  });

  // If the config is deleted, classes should be regenerated
  fileSystemWatcher.onDidDelete(async () => {
    CLASSES = await generateClasses();
  });

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('"windicss-intellisense" is now active!');

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
  
          return CLASSES.filter(i => !classesInCurrentLine.includes(i)).map(classItem => {
            return new CompletionItem(
              classItem,
              CompletionItemKind.Variable
            );
          });
        }
      }, ...TRIGGERS));
    });
  };
  context.subscriptions.push(...disposables);
}

// this method is called when your extension is deactivated
export function deactivate() {}
