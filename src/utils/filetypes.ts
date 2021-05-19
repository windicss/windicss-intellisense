import { getConfig } from '../utils';

export function connect(strings: string|string[]) {
  return Array.isArray(strings)? new RegExp(strings.map(i => `(${i})`).join('|')) : new RegExp(strings);
}

export function allowAttr(type: string): boolean {
  // check if file type allow attributes
  return type ? ['html', 'js'].includes(type) : true;
}

const classPattern = String.raw`(class(Name)?\s*=\s*\S?\s*["'\`])[^"'\`]*$`;
const emmetPattern = String.raw`\.\S*$`;
const applyPattern = String.raw`@apply\s+[^;]*$`;
const htmlPattern = getConfig('windicss.enableEmmetCompletion') ? [ classPattern, applyPattern, emmetPattern ] : [ classPattern, applyPattern ];

export const applyRegex = new RegExp(applyPattern);

export const patterns: {[key:string]: RegExp} = {
  'html': connect(htmlPattern),
  'js': connect(htmlPattern),
  'css': connect(applyPattern),
};

export const fileTypes: {
  pattern?: RegExp;
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
    pattern: /class:\S*$/,
  },
];

if (getConfig('windicss.includeLanguages')) {
  const config = getConfig<Record<string, string>>('windicss.includeLanguages');
  if (config) Object.entries(config).map(([key, value]) => (fileTypes.push({ ext: key, type: value in patterns ? value : 'css' })));
}
