import { registerCompletions } from './lib/completions';
import { registerCommands } from './lib/commands';
import { registerCodeFolding } from './lib/folding';
import type { ExtensionContext, Disposable } from 'vscode';

export async function activate(ctx: ExtensionContext) {
  registerCompletions(ctx);
  registerCodeFolding(ctx);
  registerCommands(ctx);
  console.log('Windi CSS Intellisense is now active!');
}

export function deactivate() {}
