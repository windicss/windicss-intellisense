import { HTMLParser } from '../src/utils/parser';

it('ignore dynamic', () => {
  const parser = new HTMLParser();
  expect(parser.parseClasses().length).toBe(0);
  parser.html = `
    <input :class="isCheckbox ? value : undefined" class="p-1"/>
    <input v-bind:class="isCheckbox ? value : undefined" :class="p-2"/>
    <div class={isRead ? "red": "green"} hover=" p-3 m-5 " />
    <div className="p-4 hover:p-2 dark:(shadow-xl mt-[5px])" />
  `;
  expect(parser.parseClasses().map((i) => i.result)).toEqual([
    'p-1',
    ' p-3 m-5 ',
    'p-4 hover:p-2 dark:(shadow-xl mt-[5px])',
  ]);
});
