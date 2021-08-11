import Extension from './lib';
import { Log } from './utils/console';
import {
  ExtensionContext,
  RelativePattern,
  workspace as Workspace,
} from 'vscode';

const CONFIG_FILE_GLOB = '{tailwind,windi}.config.{js,cjs,mjs,ts}';

export async function activate(ctx: ExtensionContext) {
  const extension = new Extension(
    ctx,
    new RelativePattern(
      Workspace.workspaceFolders?.[0].uri.fsPath as string,
      `**/${CONFIG_FILE_GLOB}`
    )
  );
  extension.init();
  extension.watch();
  extension.registerCodeFolding();
  Log.info('Windi CSS Intellisense Is Now Active!');
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate() {}
