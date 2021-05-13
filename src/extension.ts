import { registerCompletions } from './lib/completions';
import { registerCommands } from './lib/commands';
import { registerCodeFolding } from './lib/folding';
import { registerDiagnostics } from './lib/diagnostics';
import { init } from './lib/core';
import { workspace } from 'vscode';
import type { Core } from './interfaces';
import type { Disposable, ExtensionContext } from 'vscode';
import { Log } from './utils/Log';

let CORE: Core = { colors: {}, variantCompletions: [], staticCompletions: [], colorCompletions: [], dynamicCompletions: [] };
const DISPOSABLES: Disposable[] = [];

export async function activate(ctx: ExtensionContext) {

  const fileSystemWatcher = workspace.createFileSystemWatcher('**/{tailwind,windi}.config.{js,cjs,ts}');

  const onUpdate = async () => {
    CORE = await init();
    DISPOSABLES.forEach(i => i.dispose());
    DISPOSABLES.length = 0;
    DISPOSABLES.push(...registerCompletions(ctx, CORE), ...registerCommands(ctx, CORE));
  };

  await onUpdate();

  registerCodeFolding(ctx);
  registerDiagnostics(ctx);
  Log.info('Windi CSS Intellisense is now active!');

  // Changes configuration should invalidate above cache
  fileSystemWatcher.onDidChange(onUpdate);

  // This handles the case where the project didn't have config file
  // but was created after VS Code was initialized
  fileSystemWatcher.onDidCreate(onUpdate);

  // If the config is deleted, utilities&variants should be regenerated
  fileSystemWatcher.onDidDelete(onUpdate);
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate() { }
