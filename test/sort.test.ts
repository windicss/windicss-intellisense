import { HTMLParser } from 'windicss/utils/parser';
import { sortClassNames, combineSeparators, getAllSeparators } from '../src/utils';

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
  const toReplace = combineSeparators(separators, sortedP);  expect(toReplace).toBe(expected);
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
  const toReplace = combineSeparators(separators, sortedP);  expect(toReplace).toBe(expected);
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
  const toReplace = combineSeparators(separators, sortedP);  expect(toReplace).toBe(expected);
});

it('sorts including custom classes', () => {
  const parser = new HTMLParser();
  parser.html = `
<a class="font-custom text-15px font-bold leading-20px custom-class">
    Hello World
</a>
  `;
  const p = parser.parseClasses()[0];
  const expected = 'font-custom font-bold text-15px leading-20px custom-class';
  const sortedP = sortClassNames(p.result, {});
  const separators = getAllSeparators(p.result);
  const toReplace = combineSeparators(separators, sortedP);  expect(toReplace).toBe(expected);
});

it('sorts including custom classes but malformed', () => {
  const parser = new HTMLParser();
  parser.html = `
<a class="    font-custom text-15px font-bold leading-20px      custom-class">
    Hello World
</a>
  `;
  const p = parser.parseClasses()[0];
  const expected = '    font-custom font-bold text-15px leading-20px      custom-class';
  const sortedP = sortClassNames(p.result, {});
  const separators = getAllSeparators(p.result);
  const toReplace = combineSeparators(separators, sortedP);  expect(toReplace).toBe(expected);
});
