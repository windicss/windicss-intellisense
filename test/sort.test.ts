import { HTMLParser } from 'windicss/utils/parser';
import {
  sortClassNames,
  getAllSeparators,
  combineSeparators,
} from '../src/utils';

it('sort classes', () => {
  const parser = new HTMLParser();
  expect(parser.parseClasses().length).toBe(0);
  parser.html = `
<div class="p-4 text-transparent bg-transparent backdrop-blur" />
<div
  class="
    p-4
    text-transparent
    bg-transparent
    backdrop-blur
  "
/>
  `;
  const classes = parser.parseClasses();
  const variants = Object.keys({});
  const variantsMap = Object.assign(
    {},
    ...variants.map((value, index) => ({ [value]: index + 1 }))
  );
  const expected = [
    'bg-transparent text-transparent p-4 backdrop-blur',
    `
    bg-transparent
    text-transparent
    p-4
    backdrop-blur
  `,
  ];
  for (let i = 0; i < classes.length; i++) {
    const p = classes[i];
    const sortedP = sortClassNames(p.result, variantsMap);
    const separators = getAllSeparators(p.result);
    const toReplace = combineSeparators(separators, sortedP);
    expect(toReplace).toBe(expected[i]);
  }
});
