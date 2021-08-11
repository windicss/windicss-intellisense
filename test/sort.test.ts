import { HTMLParser } from 'windicss/utils/parser';
import {
  sortClassNames,
  rearrangeClasses,
} from '../src/utils';

it('sorts classes single line', () => {
  const parser = new HTMLParser();
  parser.html = `
<div class="p-4 text-transparent bg-transparent backdrop-blur" />
  `;
  const p = parser.parseClasses()[0];
  const expected = 'bg-transparent text-transparent p-4 backdrop-blur';
  const sortedP = sortClassNames(p.result, {});
  const toReplace = rearrangeClasses(p.result, sortedP);
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
  const toReplace = rearrangeClasses(p.result, sortedP);
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
  const toReplace = rearrangeClasses(p.result, sortedP);
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
  const toReplace = rearrangeClasses(p.result, sortedP);
  expect(toReplace).toBe(expected);
});
