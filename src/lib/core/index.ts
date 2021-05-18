import { workspace } from 'vscode';
import { resolve } from 'path';
import { Processor } from 'windicss/lib';
import { hex2RGB, flatColors } from '../../utils';
import { utilities as dynamic, negative } from '../../utils/utilities';
import { Log } from '../../utils/Log';
import jiti from 'jiti';

import type { Core } from '../../interfaces';

const j = jiti(__filename);

export async function init(): Promise<Core> {
  try {
    const files = await workspace.findFiles('{tailwind,windi}.config.{js,cjs,mjs,ts}', '**​/node_modules/**');
    let configFile;
    let config;
    if (files[0]) {
      configFile = files[0].fsPath;
      const path = resolve(configFile);
      if (path in j.cache) delete j.cache[path];
      const result = j(path);
      config = result.__esModule ? result.default : result;
      Log.info(`Loading Config File: ${configFile}`);
    }
    const processor = new Processor(config);
    const variants = processor.resolveVariants();
    const staticUtilities = processor.resolveStaticUtilities(true);

    let utilities = Object.keys(staticUtilities);
    const colors: { label: string, documentation: string }[] = [];
    const dynamics: { label: string, position: number }[] = [];

    for (const [config, list] of Object.entries(dynamic)) {
      list.forEach(utility => {
        const mark = utility.search(/\$/);
        if (mark === -1) {
          utilities.push(utility);
        } else {
          const prefix = utility.slice(0, mark - 1);
          const suffix = utility.slice(mark);
          switch (suffix) {
          case '${static}':
            const staticConfig = Object.keys(processor.theme(config, {}) as any);
            const complections = staticConfig.map(i => i === 'DEFAULT' ? prefix : i.charAt(0) === '-' ? `-${prefix}${i}` : `${prefix}-${i}`);
            // if (config in negative) complections = complections.concat(complections.map(i => `-${i}`));
            utilities = utilities.concat(complections);
            break;
          case '${color}':
            const colorConfig = flatColors(processor.theme(config) || processor.theme('colors') as any);
            for (const [k, v] of Object.entries(colorConfig)) {
              const name = `${prefix}-${k}`;
              const color = Array.isArray(v) ? v[0] : v;
              colors.push({
                label: name,
                documentation: ['transparent', 'currentColor'].includes(color) ? color : `rgb(${hex2RGB(color)?.join(', ')})`,
              });
            }
            break;
          default:
            dynamics.push({
              label: utility,
              position: utility.length - mark,
            });
            if (config in negative) {
              dynamics.push({
                label: `-${utility}`,
                position: utility.length + 1 - mark,
              });
            }
            break;
          }
        }
      });
    }
    return {
      processor,
      colors,
      utilities,
      variants,
      dynamics,
    };
  } catch (error) {
    Log.warning(error);
    return { variants: {}, utilities: [], colors: [], dynamics: [] };
  }
}
