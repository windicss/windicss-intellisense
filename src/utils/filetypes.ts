import { getConfig } from '../utils';

export function connect(strings: string|string[]) {
  return Array.isArray(strings)? new RegExp(strings.map(i => `(${i})`).join('|')) : new RegExp(strings);
}

export function allowAttr(type: string): boolean {
  // check if file type allow attributes
  return ['html', 'js'].includes(type);
}

const classPattern = String.raw`(class\s*=\s*["'])[^"']*$`;
const classNamePttern = String.raw`(className\s*=\s*["'])[^"']*$`;
// const variantsRegex = String.raw`((dark|light|active|after|before|checked|disabled|focus|hover|tw)\s*=\s*["'])[^"']*$`;
const emmetPattern = String.raw`\.\S*$`;
const applyPattern = String.raw`@apply\s+[^;]*$`;

export const applyRegex = new RegExp(applyPattern);

export const patterns: {[key:string]: RegExp} = {
  'html': connect([ classPattern, applyPattern, emmetPattern ]),
  'js': connect([ classPattern, classNamePttern, applyPattern, emmetPattern ]),
  'css': connect(applyPattern),
};

export const fileTypes: {
  type: string;
  ext: string;
}[] = [
  {
    type: 'css',
    ext: 'css',
  },
  {
    type: 'css',
    ext: 'sass',
  },
  {
    type: 'css',
    ext: 'less',
  },
  {
    type: 'js',
    ext: 'javascript',
  },
  {
    type: 'js',
    ext: 'javascriptreact',
  },
  {
    type: 'js',
    ext: 'typescriptreact',
  },
  {
    type: 'html',
    ext: 'html',
  },
  {
    type: 'html',
    ext: 'php',
  },
  {
    type: 'html',
    ext: 'vue',
  },
  {
    type: 'html',
    ext: 'svelte',
  },
];

if (getConfig('windicss.includeLanguages')) {
  const config = getConfig<Record<string, string>>('windicss.includeLanguages');
  if (config) Object.entries(config).map(([key, value]) => (fileTypes.push({ ext: key, type: value in patterns ? value : 'css' })));
}
