import { getConfig } from '../utils';

export function connect(strings: string|string[]) {
  return Array.isArray(strings)? new RegExp(strings.map(i => `(${i})`).join('|')) : new RegExp(strings);
}

const classRegex = String.raw`(class\s*=\s*["'])[^"']*$`;
const classNameRegex = String.raw`(className\s*=\s*["'])[^"']*$`;
// const variantsRegex = String.raw`((dark|light|active|after|before|checked|disabled|focus|hover|tw)\s*=\s*["'])[^"']*$`;
const emmetRegex = String.raw`\.\S*$`;
const applyRegex = String.raw`@apply\s+[^;]*$`;

export const patterns: {[key:string]: RegExp} = {
  'html': connect([ classRegex, applyRegex, emmetRegex ]),
  'js': connect([ classRegex, classNameRegex, applyRegex, emmetRegex ]),
  'css': connect(applyRegex),
};

export const fileTypes: {
  type: string;
  extension: string;
}[] = [
  {
    type: 'css',
    extension: 'css',
  },
  {
    type: 'css',
    extension: 'sass',
  },
  {
    type: 'css',
    extension: 'less',
  },
  {
    type: 'js',
    extension: 'javascript',
  },
  {
    type: 'js',
    extension: 'javascriptreact',
  },
  {
    type: 'js',
    extension: 'typescriptreact',
  },
  {
    type: 'html',
    extension: 'html',
  },
  {
    type: 'html',
    extension: 'php',
  },
  {
    type: 'html',
    extension: 'vue',
  },
  {
    type: 'html',
    extension: 'svelte',
  },
];

if (getConfig('windicss.includeLanguages')) {
  const config = getConfig<Record<string, string>>('windicss.includeLanguages');
  if (config) Object.entries(config).map(([key, value]) => (fileTypes.push({ extension: key, type: value in patterns ? value : 'css' })));
}
