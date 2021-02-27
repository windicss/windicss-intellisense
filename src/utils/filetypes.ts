const classRegex = /class=["|']([.\w-+@!:/ ]*$)/;
const classNameRegex = /className=["|']([.\w-+@:/ ]*$)/;
const applyRegex = /@apply ([.\w-+@:/ ]*$)/;
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
  {
    regex: applyRegex,
    splitCharacter: ' '
  },
  // {
  //   regex: emmetRegex,
  //   splitCharacter: '.'
  // }
];

// const stylesPatterns = [
//   {
//     regex: applyRegex,
//     splitCharacter: ' ',
//   },
// ];

export const fileTypes: {
  extension: string;
  patterns: {
    regex: RegExp;
    splitCharacter: string;
  }[];
}[] = [
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
    patterns: htmlPatterns,
  },
  {
    extension: 'php',
    patterns: htmlPatterns,
  },
  {
    extension: 'vue',
    patterns: htmlPatterns,
  },
  {
    extension: 'svelte',
    patterns: htmlPatterns,
  },
];
