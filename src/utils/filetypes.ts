const classRegex = /class=["|']([.\w-+@!:/ ()]*$)/;
const classNameRegex = /className=["|']([.\w-+@:!/ ()]*$)/;
const applyRegex = /@apply ([.\w-+@:/ ()]*$)/;
const variantsRegex = /(dark|light|active|after|before|checked|disabled|focus|hover|tw)=["|']([.\w-+@!:/ ()]*$)/;
// const emmetRegex = /(?=\.)([\w-\. ]*$)/;

const jsPatterns = [
  {
    regex: classRegex,
    splitCharacter: ' ',
  },
  {
    regex: classNameRegex,
    splitCharacter: ' ',
  },
  // {
  //   regex: emmetRegex,
  //   splitCharacter: '.'
  // }
];

const htmlPatterns = [
  {
    regex: classRegex,
    splitCharacter: ' ',
  },
  // {
  //   regex: emmetRegex,
  //   splitCharacter: '.'
  // }
];

const stylesPatterns = [
  {
    regex: applyRegex,
    splitCharacter: ' ',
  },
];

const attributePatterns = [
  {
    regex: variantsRegex,
    splitCharacter: ' ',
  },
];

export const fileTypes: {
  extension: string;
  patterns: {
    regex: RegExp;
    splitCharacter: string;
  }[];
}[] = [
  {
    extension: 'css',
    patterns: stylesPatterns,
  },
  {
    extension: 'sass',
    patterns: stylesPatterns,
  },
  {
    extension: 'less',
    patterns: stylesPatterns,
  },
  {
    extension: 'javascript',
    patterns: jsPatterns,
  },
  {
    extension: 'javascriptreact',
    patterns: jsPatterns,
  },
  {
    extension: 'typescriptreact',
    patterns: jsPatterns,
  },
  {
    extension: 'html',
    patterns: htmlPatterns.concat( stylesPatterns, attributePatterns),
  },
  {
    extension: 'php',
    patterns: htmlPatterns,
  },
  {
    extension: 'vue',
    patterns: htmlPatterns.concat( stylesPatterns, attributePatterns),
  },
  {
    extension: 'svelte',
    patterns: htmlPatterns.concat( stylesPatterns, attributePatterns),
  },
];
