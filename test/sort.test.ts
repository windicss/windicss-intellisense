import { HTMLParser } from '../src/utils/parser';
import {
  sortClassNames,
  combineSeparators,
  getAllSeparators,
} from '../src/utils';

it('sorts classes single line', () => {
  const text = `
<div class="bg-transparent text-transparent p-4 backdrop-blur" />
  `;
  const parser = new HTMLParser(text);
  const p = parser.parseClasses()[0];
  const expected = 'bg-transparent text-transparent p-4 backdrop-blur';
  const sortedP = sortClassNames(p.result, {});
  const separators = getAllSeparators(p.result);
  const toReplace = combineSeparators(separators, sortedP);
  expect(toReplace).toBe(expected);
});

it('sorts classes single line but malformed', () => {
  const text = `
  <div class=" bg-transparent text-transparent  p-4 backdrop-blur" />
  `;
  const parser = new HTMLParser(text);
  const p = parser.parseClasses()[0];
  const expected = ' bg-transparent text-transparent  p-4 backdrop-blur';
  const sortedP = sortClassNames(p.result, {});
  const separators = getAllSeparators(p.result);
  const toReplace = combineSeparators(separators, sortedP);
  expect(toReplace).toBe(expected);
});

it('sorts classes multi line', () => {
  const text = `
<div
  class="
    bg-transparent
    text-transparent
    p-4
    backdrop-blur
  "
/>
`;
  const parser = new HTMLParser(text);
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
  const text = `
<div
  class="
      bg-transparent
  text-transparent
        p-4
backdrop-blur
  "
/>
`;
  const parser = new HTMLParser(text);
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

it('sorts including custom classes', () => {
  const text = `
<a class="font-custom font-bold text-15px leading-20px custom-class">
    Hello World
</a>
  `;
  const parser = new HTMLParser(text);
  const p = parser.parseClasses()[0];
  const expected = 'font-custom font-bold text-15px leading-20px custom-class';
  const sortedP = sortClassNames(p.result, {});
  const separators = getAllSeparators(p.result);
  const toReplace = combineSeparators(separators, sortedP);
  expect(toReplace).toBe(expected);
});

it('sorts including custom classes but malformed', () => {
  const text = `
<a class="    font-custom font-bold text-15px leading-20px      custom-class">
    Hello World
</a>
  `;
  const parser = new HTMLParser(text);
  const p = parser.parseClasses()[0];
  const expected =
    '    font-custom font-bold text-15px leading-20px      custom-class';
  const sortedP = sortClassNames(p.result, {});
  const separators = getAllSeparators(p.result);
  const toReplace = combineSeparators(separators, sortedP);
  expect(toReplace).toBe(expected);
});

it('sorts apply directives', () => {
  const text = `
  <style>
  .some-class {
    @apply p-4 text-transparent bg-transparent backdrop-blur;
  }
  </style>
  `;
  const parser = new HTMLParser(text);
  const p = parser.parseApplies()[0];
  const expected = 'bg-transparent text-transparent p-4 backdrop-blur';
  const sortedP = sortClassNames(p.result, {});
  const separators = getAllSeparators(p.result);
  const toReplace = combineSeparators(separators, sortedP);
  expect(toReplace).toBe(expected);
});
