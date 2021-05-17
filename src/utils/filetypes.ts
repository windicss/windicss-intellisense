function connect(strings: string|string[]) {
  return Array.isArray(strings)? new RegExp(strings.map(i => `(${i})`).join('|')) : new RegExp(strings);
}

const classRegex = String.raw`(class\s*=\s*["'])[^"']*$`;
const classNameRegex = String.raw`(className\s*=\s*["'])[^"']*$`;
const variantsRegex = String.raw`((dark|light|active|after|before|checked|disabled|focus|hover|tw)\s*=\s*["'])[^"']*$`;
const emmetRegex = String.raw`\.\S*$`;
const applyRegex = String.raw`@apply\s+[^;]*$`;

const jsPattern = connect([ classRegex, classNameRegex, variantsRegex, applyRegex, emmetRegex ]);
const htmlPattern = connect([ classRegex, variantsRegex, applyRegex, emmetRegex ]);
const stylesPattern = connect(applyRegex);

export const fileTypes: {
  extension: string;
  pattern: RegExp;
}[] = [
  {
    extension: 'css',
    pattern: stylesPattern,
  },
  {
    extension: 'sass',
    pattern: stylesPattern,
  },
  {
    extension: 'less',
    pattern: stylesPattern,
  },
  {
    extension: 'javascript',
    pattern: jsPattern,
  },
  {
    extension: 'javascriptreact',
    pattern: jsPattern,
  },
  {
    extension: 'typescriptreact',
    pattern: jsPattern,
  },
  {
    extension: 'html',
    pattern: htmlPattern,
  },
  {
    extension: 'php',
    pattern: htmlPattern,
  },
  {
    extension: 'vue',
    pattern: htmlPattern,
  },
  {
    extension: 'svelte',
    pattern: htmlPattern,
  },
];
