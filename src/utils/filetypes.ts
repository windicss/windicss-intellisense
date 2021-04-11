import { getConfig } from '../utils';
import { Log } from './Log';
// classes must match in first capture group, since it is hardcoded in completion
const classRegex = /class=["|']([^'"]*$)/;
const classNameRegex = /className=["|']([^'"]*$)/;
const applyRegex = /@apply ([^;\n]*$)/;
const variantsRegex = /dark|light|active|after|before|checked|disabled|focus|hover|tw=["|']([^'"]*$)/;
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
      patterns: htmlPatterns.concat(stylesPatterns, attributePatterns),
    },
    {
      extension: 'php',
      patterns: htmlPatterns,
    },
    {
      extension: 'vue',
      patterns: htmlPatterns.concat(stylesPatterns, attributePatterns),
    },
    {
      extension: 'svelte',
      patterns: htmlPatterns.concat(stylesPatterns, attributePatterns),
    },
  ];
if (getConfig('windicss.includeLanguages')) {
  const config = getConfig<object>('windicss.includeLanguages')!
  // console.log(config)
  for (const [key, value] of Object.entries(config)) {
    fileTypes.push({
      extension: key,
      patterns: (value === "html") ? htmlPatterns.concat(stylesPatterns, attributePatterns) : jsPatterns
    })
  }
  Log.info("fileMap: " + JSON.stringify(fileTypes))
}