import { workspace } from 'vscode';
import { resolve } from 'path';
import { Processor } from 'windicss/lib';

export async function generateClasses():Promise<string[]> {
  try {
    const files = await workspace.findFiles('{tailwind,windi}.config.js', '**​/node_modules/**');
    const config = files[0] ? require(resolve(files[0].fsPath)) : undefined;
    const processor = new Processor(config);
    const staticClasses = processor.resolveStaticUtilities(true);
    const dynamicClasses = processor.resolveDynamicUtilities(true);
    return Object.keys(staticClasses);
  } catch (error) {
    console.log(error);
    return [];
  }
}