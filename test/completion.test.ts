import { Processor } from 'windicss/lib';
import { colorObject } from 'windicss/types/interfaces';
import { generateCompletions } from '../src/utils/completions';

const processor = new Processor();
const completions = generateCompletions(processor, processor.theme('colors') as colorObject, true, '');
const attrs = completions.attr;


it('generate completions', () => {
  expect(attrs.static['font']).toMatchSnapshot();
});
