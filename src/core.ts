import { workspace } from 'vscode';
import { resolve } from 'path';
import { Processor } from 'windicss/lib';
import { flatColors, hex2RGB, highlightCSS } from './utils';
import { utilities as dynamic } from './dynamic';
import type { Generator } from './interfaces';

export async function generate():Promise<Generator> {
  try {
    const files = await workspace.findFiles('{tailwind,windi}.config.js', '**​/node_modules/**');
    const config = files[0] ? require(resolve(files[0].fsPath)) : undefined;
    const processor = new Processor(config);
    const colors = flatColors(processor.theme('colors') as {[key:string]:string|{[key:string]:string}});
    const variants = processor.resolveVariants();
    const staticUtilities = processor.resolveStaticUtilities(true);

    const staticCompletion = Object.keys(staticUtilities);

    const variantsCompletion = Object.keys(variants).map(variant => {
      const style = variants[variant]();
      style.selector = '&';
      return {
        label: variant + ':',
        documentation: highlightCSS(style.build().replace(`{\n  & {}\n}`, '{\n  ...\n}').replace('{}', '{\n  ...\n}'))
      };
    });

    const colorsCompletions: {label: string, detail: string, documentation: string}[] = [];
    dynamic.filter(i => i.endsWith('${color}')).map(utility => {
      const head = utility.replace('${color}', '');
      for (const [key, value] of Object.entries(colors)) {
        colorsCompletions.push({
          label: head + key,
          detail: processor.interpret(head + key).styleSheet.build(),
          documentation: ['transparent', 'currentColor'].includes(value) ? value: `rgb(${hex2RGB(value)?.join(', ')})`,
        });
      }
    });

    const dynamicCompletions: {
      label: string;
      position: number;
    }[] = [];
    
    dynamic.filter(i => !i.endsWith('${color}')).map(utility => {
      const start = utility.search(/\$/);
      if (start === -1) {
        staticCompletion.push(utility);
      } else {
        dynamicCompletions.push({
          label: utility,
          position: start === -1 ? 0 : utility.length - start,
        });
      }
    });

    return {
      processor,
      colors,
      variants: variantsCompletion,
      colorsUtilities: colorsCompletions,
      staticUtilities: staticCompletion,
      dynamicUtilities: dynamicCompletions,
    };
  } catch (error) {
    console.log(error);
    return { colors: {}, variants: [], staticUtilities: [], colorsUtilities: [], dynamicUtilities: [] };
  }
}