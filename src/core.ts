import { workspace } from 'vscode';
import { resolve } from 'path';
import { Processor } from 'windicss/lib';
import type { Generator } from './interfaces';


export async function generate():Promise<Generator> {
  try {
    const files = await workspace.findFiles('{tailwind,windi}.config.js', '**​/node_modules/**');
    const config = files[0] ? require(resolve(files[0].fsPath)) : undefined;
    const processor = new Processor(config);
    const variants = processor.resolveVariants();
    const staticUtilities = processor.resolveStaticUtilities(true);
    const dynamicUtilities = processor.resolveDynamicUtilities(true);
    return {
      processor,
      variants,
      staticUtilities,
      dynamicUtilities
    };
  } catch (error) {
    console.log(error);
    return {variants: {}, staticUtilities: {}, dynamicUtilities: {}};
  }
}