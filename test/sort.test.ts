import { HTMLParser } from 'windicss/utils/parser';
import {
  sortClassNames,
  getAllSeparators,
  combineSeparators,
} from '../src/utils';

it('sorts classes single line', () => {
  const parser = new HTMLParser();
  parser.html = `
<div class="p-4 text-transparent bg-transparent backdrop-blur" />
  `;
  const p = parser.parseClasses()[0];
  const expected = 'bg-transparent text-transparent p-4 backdrop-blur';
  const sortedP = sortClassNames(p.result, {});
  const separators = getAllSeparators(p.result);
  const toReplace = combineSeparators(separators, sortedP);
  expect(toReplace).toBe(expected);
});

it('sorts classes single line but malformed', () => {
  const parser = new HTMLParser();
  parser.html = `
<div class=" p-4 text-transparent  bg-transparent backdrop-blur" />
  `;
  const p = parser.parseClasses()[0];
  const expected = ' bg-transparent text-transparent  p-4 backdrop-blur';
  const sortedP = sortClassNames(p.result, {});
  const separators = getAllSeparators(p.result);
  const toReplace = combineSeparators(separators, sortedP);
  expect(toReplace).toBe(expected);
});

it('sorts classes multi line', () => {
  const parser = new HTMLParser();
  parser.html = `
<div
  class="
    p-4
    text-transparent
    bg-transparent
    backdrop-blur
  "
/>
`;
  const p = parser.parseClasses()[0];
  const expected = `
    bg-transparent
    text-transparent
    p-4
    backdrop-blur
  `;

  const sortedP = sortClassNames(p.result, {});
  const separators = getAllSeparators(p.result);
  const toReplace = combineSeparators(separators, sortedP);
  expect(toReplace).toBe(expected);
});

it('sorts classes multi line but malformed', () => {
  const parser = new HTMLParser();
  parser.html = `
<div
  class="
      p-4
  text-transparent
        bg-transparent
backdrop-blur
  "
/>
`;
  const p = parser.parseClasses()[0];
  const expected = `
      bg-transparent
  text-transparent
        p-4
backdrop-blur
  `;

  const sortedP = sortClassNames(p.result, {});
  const separators = getAllSeparators(p.result);
  const toReplace = combineSeparators(separators, sortedP);
  expect(toReplace).toBe(expected);
});
