import { registerCompletions } from './lib/completions';
import { registerCommands } from './lib/commands';
import { registerCodeFolding } from './lib/folding';
import { init } from './lib/core';
import { commands, workspace } from 'vscode';
import type { Core } from './interfaces';
import type { ExtensionContext } from 'vscode';

let CORE: Core = { colors: {}, variantCompletions: [], staticCompletions: [], colorCompletions: [], dynamicCompletions: [] };

export async function activate(ctx: ExtensionContext) {

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

  registerCompletions(ctx, CORE);
  registerCodeFolding(ctx);
  registerCommands(ctx, CORE);

  // if runOnSave is enabled in settings, trigger command on file save
  if(workspace.getConfiguration().get('windicss.runOnSave')) {
    ctx.subscriptions.push(
      workspace.onDidSaveTextDocument((_e) => {
        commands.executeCommand('windicss.sort');
      })
    );
  }

  console.log('Windi CSS Intellisense is now active!');
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate() {}
