import Extension from './lib';
import { Log } from './utils/log';
import type { ExtensionContext } from 'vscode';


export async function activate(ctx: ExtensionContext) {
  const extension = new Extension(ctx, '{tailwind,windi}.config.{js,cjs,mjs,ts}');
  extension.init();
  extension.watch();
  extension.registerCodeFolding();
  Log.info('Windi CSS Intellisense is now active!');
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate() {}
