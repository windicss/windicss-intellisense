import { getConfig } from './helpers';

export function connect(strings: string|string[]) {
  return Array.isArray(strings)? new RegExp(strings.map(i => `(${i})`).join('|')) : new RegExp(strings);
}

export function allowAttr(type: string): boolean {
  // check if file type allow attributes
  return type ? ['html', 'js'].includes(type) : true;
}

const classPattern = String.raw`(class(Name)?\s*=\s*{?\s*["'\`])[^"'\`]*$`;
const emmetPattern = String.raw`\.\S*$`;
const applyPattern = String.raw`@apply\s+[^;]*$`;
const htmlPattern = getConfig('windicss.enableEmmetCompletion') ? [ classPattern, applyPattern, emmetPattern ] : [ classPattern, applyPattern ];

export const applyRegex = new RegExp(applyPattern);

export const patterns: {[key:string]: RegExp} = {
  'html': connect(htmlPattern),
  'js': connect(htmlPattern),
  'css': connect(applyPattern),
};

export const fileTypes: {[key:string]: {pattern?: RegExp, type: string}} = {
  'css': {
    type: 'css',
  },
  'scss': {
    type: 'css',
  },
  'sass': {
    type: 'css',
  },
  'less': {
    type: 'css',
  },
  'javascript': {
    type: 'js',
  },
  'javascriptreact': {
    type: 'js',
  },
  'typescriptreact': {
    type: 'js',
  },
  'html': {
    type: 'html',
  },
  'php': {
    type: 'html',
  },
  'vue': {
    type: 'html',
  },
  'svelte': {
    type: 'html',
    pattern: /(class:\S*$)|((class\s*=\s*["'`]?\s*{\s*)[^}]*$)/,
  },
};

if (getConfig('windicss.includeLanguages')) {
  // "windicss.includeLanguages": {
  //   "rust": "html", // css // js
  //   "abc": {
  //      "type": "html"
  //   }
  //   "def": {
  //      "type": "html",
  //      "patterns": ["(class(Name)?\\s*=\\s*\\S?\\s*["'\\`])[^\"'\\`]*$", "..."],
  //   }>
  // }
  const config = getConfig<{[key:string]: (string | { type?: string, patterns?: string[] })}>('windicss.includeLanguages');
  if (config) Object.entries(config).map(([key, value]) => {
    if (typeof value === 'string') {
      fileTypes[key] = { type: value in patterns ? value : 'css' };
    } else {
      const pattern = (value.patterns === undefined || value.patterns.length === 0)? undefined : value.patterns;
      if (key in fileTypes) {
        fileTypes[key] = { type: value.type || fileTypes[key].type, pattern: fileTypes[key].pattern ? pattern ? connect([(fileTypes[key].pattern as RegExp).source, ...pattern]) : fileTypes[key].pattern : undefined };
      }
    }
  });
}
