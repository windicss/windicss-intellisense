import { getConfig } from '../utils';

function connect(strings: string|string[]) {
  return Array.isArray(strings)? new RegExp(strings.map(i => `(${i})`).join('|')) : new RegExp(strings);
}

const classRegex = String.raw`(class\s*=\s*["'])[^"']*$`;
const classNameRegex = String.raw`(className\s*=\s*["'])[^"']*$`;
const variantsRegex = String.raw`((dark|light|active|after|before|checked|disabled|focus|hover|tw)\s*=\s*["'])[^"']*$`;
const emmetRegex = String.raw`\.\S*$`;
const applyRegex = String.raw`@apply\s+[^;]*$`;

const map = {
  'html': connect([ classRegex, variantsRegex, applyRegex, emmetRegex ]),
  'js': connect([ classRegex, classNameRegex, variantsRegex, applyRegex, emmetRegex ]),
  'css': connect(applyRegex),
};

export const fileTypes: {
  extension: string;
  pattern: RegExp;
}[] = [
  {
    extension: 'css',
    pattern: map.css,
  },
  {
    extension: 'sass',
    pattern: map.css,
  },
  {
    extension: 'less',
    pattern: map.css,
  },
  {
    extension: 'javascript',
    pattern: map.js,
  },
  {
    extension: 'javascriptreact',
    pattern: map.js,
  },
  {
    extension: 'typescriptreact',
    pattern: map.js,
  },
  {
    extension: 'html',
    pattern: map.html,
  },
  {
    extension: 'php',
    pattern: map.html,
  },
  {
    extension: 'vue',
    pattern: map.html,
  },
  {
    extension: 'svelte',
    pattern: map.html,
  },
];

if (getConfig('windicss.includeLanguages')) {
  const config = getConfig<Record<string, string>>('windicss.includeLanguages');
  if (config) Object.entries(config).map(([key, value]) => (fileTypes.push({ extension: key, pattern: value in map ? map[value as keyof typeof map] : map.css })));
}
