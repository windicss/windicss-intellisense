import { Processor } from 'windicss/lib';
import { colorObject } from 'windicss/types/interfaces';
import { generateCompletions } from '../src/utils/completions';

const processor = new Processor();
const completions = generateCompletions(processor, processor.theme('colors') as colorObject, true, '');
const attrs = completions.attr;

function include(keys: string[], values: string[]) {
  values.map(i => expect(keys).toContain(i));
}

function match(key: string, statics: string[], colors?: string[]) {
  include(attrs.static[key], statics);
  colors && include(attrs.color[key].map(i => i.label), colors);
}

it('generate font completions', () => {
  match('font', [
    'sans', 'serif', 'mono',
    'italic', 'not-italic',
    'thin', 'extralight', 'light',
    'antialiased', 'subpixel-antialiased',
    'normal-nums', 'ordinal', 'slashed-zero',
    'tracking-tighter', 'tracking-tight',
    'leading-none', 'leading-tight',
  ]);
});

it('generate text completions', () => {
  match('text', [
    'xs',
    'left',
    'baseline', 'top', 'middle',
    'opacity-40', 'opacity-60',
    'underline', 'line-through',
    'underline-opacity-50', 'underline-auto', 'underline-2', 'underline-offset-auto',
    'tab', 'tab-0', 'tab-2', 'tab-4',
    'indent', 'indent-xs', 'indent-sm', 'indent-md',
    'uppercase', 'lowercase', 'capitalize',
    'stroke', 'stroke-none', 'stroke-sm',
    'shadow', 'shadow-sm', 'shadow-md',
    'truncate', 'overflow-ellipsis',
    'space-normal', 'space-nowrap', 'space-pre',
    'break-normal', 'break-words',
    'write-normal', 'write-orient-mixed',
    'hyphens-none', 'hyphens-manual',
    'placeholder-opacity-50',
  ], [
    'blue-500', 'red-500',
    'underline-green-500', 'underline-gray-500',
    'stroke-transparent', 'stroke-blue-500',
    'placeholder-blue-500', 'placeholder-gray-700',
  ]);
});

it('genreate underline utilities', () => {
  match('underline', [
    '~', 'line-through', 'none',
    'solid', 'double', 'dotted', 'dashed',
    'opacity-50',
    'auto', '0', '2', '4', '8',
    'offset-auto', 'offset-1', 'offset-2',
  ], [
    'green-500', 'current',
  ]);
});

it('generate list utilities', () => {
  match('list', [
    'none', 'disc', 'decimal',
    'inside', 'outside',
  ]);
});

it('generate bg utilities', () => {
  match('bg', [
    'fixed', 'local', 'scroll',
    'bottom', 'center', 'left',
    'opacity-50', 'opacity-60',
    'repeat', 'no-repeat', 'repeat-x',
    'auto', 'cover', 'contain',
    'clip-border', 'clip-padding', 'clip-content',
    'origin-border', 'origin-padding', 'origin-content',
    'blend-normal', 'blend-overlay', 'blend-darken',
    'none',
  ], [
    'green-500', 'current',
  ]);
});

it('generate gradient utilities', () => {
  match('gradient', [
    'none', 'to-t', 'to-r', 'to-br',
  ], [
    'from-green-500', 'from-current',
    'via-red-500',
    'to-pink-500',
  ]);
});

it('generate border utilities', () => {
  match('border', [
    '~', '0', '2', '4', 't-0', 't-0', 'l-2', 'r-2',
    'rounded-none', 'rounded-sm', 'rounded-b-sm',
    'solid', 'dashed', 'dotted', 'double', 'none',
    'collapse', 'separate',
    'opacity-50', 'opacity-60',
  ], [
    'gray-500', 'yellow-500',
  ]);
});

it('generate divide utilities', () => {
  match('divide', [
    'y', 'x', 'y-reverse', 'x-reverse', 'y-2',
    'solid', 'dashed', 'dotted', 'double', 'none',
    'opacity-50', 'opacity-60',
  ], [
    'gray-500', 'yellow-500',
  ]);
});

it('generate ring utilities', () => {
  match('ring', [
    '~', 'inset', '0', '1', '2',
    'opacity-50', 'opacity-60',
    'offset-4', 'offset-8',
  ], [
    'gray-500', 'yellow-500',
    'offset-gray-200', 'offset-gray-400',
  ]);
});

it('generate icon utilities', () => {
  match('icon', [
    'stroke-0', 'stroke-1', 'stroke-2',
    'stroke-dash-1', 'stroke-dash-2',
    'stroke-offset-0', 'stroke-offset-2',
    'stroke-cap-auto', 'stroke-cap-square',
    'stroke-join-auto',
  ], [
    'fill-gray-500', 'fill-yellow-500',
    'stroke-current', 'stroke-gray-400',
  ]);
});

it('generate container', () => {
  match('container', [ '~' ]);
});

it('generate padding utilities', () => {
  match('p', [
    '0', 'px', '1', '2', '4',
    'y-0', 'y-px', 'y-1', 'y-2', 'y-4',
    'x-0', 'x-px', 'x-1', 'x-2', 'x-4',
    't-0', 't-px', 't-1', 't-2', 't-4',
    'b-0', 'b-px', 'b-1', 'b-2', 'b-4',
    'r-0', 'r-px', 'r-1', 'r-2', 'r-4',
  ]);
});

it('generate margin utilities', () => {
  match('m', [
    '0', 'px', '1', '2', '4',
    'y-0', 'y-px', 'y-1', 'y-2', 'y-4',
    'x-0', 'x-px', 'x-1', 'x-2', 'x-4',
    't-0', 't-px', 't-1', 't-2', 't-4',
    'b-0', 'b-px', 'b-1', 'b-2', 'b-4',
    'r-0', 'r-px', 'r-1', 'r-2', 'r-4',
    '-t-px', '-t-2',
  ]);
});

it('generate space utilities', () => {
  match('space', [
    'x-4', '-x-4',
    'x-reverse',
    'y-2', '-y-2',
    'y-reverse',
  ]);
});

it('generate width utilities', () => {
  match('w', [
    '0', 'auto', 'px', 'full', 'sm', 'md', 'screen-sm', 'min-content', 'max-content',
    'min-0', 'min-px', 'min-full', 'min-sm', 'min-md', 'min-screen-sm',
    'max-0', 'max-px', 'max-full', 'max-sm', 'max-md', 'max-screen-sm',
  ]);
});

it('generate height utilities', () => {
  match('h', [
    '0', 'auto', 'px', 'full', 'sm', 'md', 'screen-sm', 'min-content', 'max-content',
    'min-0', 'min-px', 'min-full', 'min-sm', 'min-md', 'min-screen-sm',
    'max-0', 'max-px', 'max-full', 'max-sm', 'max-md', 'max-screen-sm',
  ]);
});

it('generate flex utilities', () => {
  match('flex', [
    '~', 'inline',
    'row', 'row-reverse', 'col', 'col-reverse',
    'wrap', 'wrap-reverse', 'nowrap',
    '1', 'auto', 'initial', 'none',
    'grow', 'grow-0',
    'shrink', 'shrink-0',
  ]);
});

it('generate grid utilities', () => {
  match('grid', [
    '~', 'inline',
    'cols-1', 'cols-3', 'cols-none',
    'col-auto', 'col-span-2',
    'row-auto', 'row-span-2',
    'rows-1', 'rows-3', 'rows-none',
    'flow-row', 'flow-col', 'flow-row-dense', 'flow-col-dense',
    'auto-cols-auto', 'auto-cols-min',
    'auto-rows-auto', 'auto-rows-min',
    'gap-2', 'gap-x-4', 'gap-y-2',
  ]);
});

it('generate table utilities', () => {
  match('table', [
    '~', 'inline', 'caption', 'cell', 'column', 'column-group', 'footer-group', 'header-group', 'row-group', 'row',
    'auto', 'fixed',
    'caption-top', 'caption-bottom',
    'empty-cells-visible', 'empty-cells-hidden',
  ]);
});

it('generate order utilities', () => {
  match('order', [
    '1', '2', 'first', 'last',
  ]);
});

it('generate align utilities', () => {
  match('align', [
    // 'center', 'start', 'end', 'around', 'evenly',
    'content-center', 'content-start', 'content-end', 'content-around',
    'items-start', 'items-end', 'items-center',
    'self-auto', 'self-start', 'self-end',
  ]);
});

it('generate justify utilities', () => {
  match('justify', [
    'center', 'start', 'end', 'around', 'evenly',
    // 'content-center', 'content-start', 'content-end', 'content-around',
    'items-start', 'items-end', 'items-center',
    'self-auto', 'self-start', 'self-end',
  ]);
});

it('generate place utilities', () => {
  match('place', [
    // 'center', 'start', 'end', 'around', 'evenly',
    'content-center', 'content-start', 'content-end', 'content-around',
    'items-start', 'items-end', 'items-center',
    'self-auto', 'self-start', 'self-end',
  ]);
});

it('generate display utilities', () => {
  match('display', [
    'inline', 'flow-root', 'contents', 'list-item', 'block', 'inline-block',
    'visible', 'invisible',
    'backface-visible', 'backface-hidden',
  ]);
});

it('generate pos utilities', () => {
  match('pos', [
    'static', 'fixed', 'absolute', 'relative', 'sticky',
    'inset-1', '-inset-1', '-inset-x-1', '-inset-y-2',
    'top-0', 'left-0', 'bottom-0', 'right-0',
    'float-right', 'float-left', 'float-none',
    'clear-left', 'clear-right', 'clear-both', 'clear-none',
    'isolate', 'isolation-auto',
  ]);
});

it('generate box utilities', () => {
  match('box', [
    'decoration-slice', 'decoration-clone',
    'border', 'content',
  ]);
});

it('generate caret utilities', () => {
  match('caret', [
    'opacity-0', 'opacity-50',
  ], [
    'gray-500', 'green-500',
  ]);
});

it('generate isolation utilities', () => {
  match('isolation', [
    'isolate', 'auto',
  ]);
});

it('generate object utilities', () => {
  match('object', [
    'contain', 'cover', 'fill', 'none', 'scale-down',
    'bottom', 'center', 'left', 'left-bottom',
  ]);
});

it('generate overflow utilities', () => {
  match('overflow', [
    'auto', 'hidden', 'visible', 'scroll',
    'x-auto', 'x-hidden', 'x-visible',
    'y-auto', 'y-hidden', 'y-visible',
  ]);
});

it('generate overscroll utilities', () => {
  match('overscroll', [
    'auto', 'contain', 'none',
    'x-auto', 'x-contain', 'x-none',
    'y-auto', 'y-contain', 'y-none',
  ]);
});

it('generate zIndex utilities', () => {
  match('z', [
    'auto', '0', '10', '20', '50',
  ]);
});

it('generate shadow utilities', () => {
  match('shadow', [
    'sm', '~', 'md', 'lg', 'xl', '2xl', 'inner', 'none',
  ], [
    'gray-200', 'green-500',
  ]);
});

it('generate opacity utilities', () => {
  match('opacity', [
    '0', '5', '10', '20',
  ]);
});

it('generate blend utilities', () => {
  match('blend', [
    'normal', 'multiply', 'screen', 'overlay', 'darken',
  ]);
});

it('generate filter utilities', () => {
  match('filter', [
    '~', 'none',
    'blur-0', 'blur-sm', 'blur', 'blur-md',
    'brightness-0', 'brightness-50', 'brightness-75',
    'contrast-0', 'contrast-50', 'contrast-75',
    'drop-shadow-sm', 'drop-shadow', 'drop-shadow-md',
    'grayscale-0', 'grayscale',
    '-hue-rotate-180', '-hue-rotate-90', 'hue-rotate-90', 'hue-rotate-180',
    'invert-0', 'invert',
    'saturate-0', 'saturate-50', 'saturate-100',
    'sepia-0', 'sepia',
  ]);
});

it('generate backdrop utilities', () => {
  match('backdrop', [
    '~', 'none',
    'blur-0', 'blur-sm', 'blur', 'blur-md',
    'brightness-0', 'brightness-50', 'brightness-75',
    'contrast-0', 'contrast-50', 'contrast-75',
    'grayscale-0', 'grayscale',
    '-hue-rotate-180', '-hue-rotate-90', 'hue-rotate-90', 'hue-rotate-180',
    'invert-0', 'invert',
    'opacity-0', 'opacity-50',
    'saturate-0', 'saturate-50', 'saturate-100',
    'sepia-0', 'sepia',
  ]);
});

it('generate transition utilities', () => {
  match('transition', [
    '~', 'none', 'all', 'colors', 'opacity', 'shadow', 'transform',
    'duration-75', 'duration-100', 'duration-150',
    'ease-linear', 'ease-in', 'ease-out', 'ease-in-out',
    'delay-75', 'delay-100', 'delay-150',
  ]);
});

it('generate animation utilities', () => {
  match('animate', [
    'none', 'spin', 'ping', 'pulse', 'bounce',
  ]);
});

it('generate transform utilities', () => {
  match('transform', [
    '~', 'gpu', 'none',
    'preserve-flat', 'preserve-3d',
    'perspect-lg', 'perspect-none',
    'perspect-origin-center', 'perspect-origin-top',
    'origin-center', 'origin-top',
    'scale-0', 'scale-50', 'scale-75',
    'scale-x-50', 'scale-y-50', 'scale-z-75',
    'rotate-45', '-rotate-45',
    'rotate-x-45', 'rotate-y-45', 'rotate-z-90',
    'translate-x-2', '-translate-x-4', 'translate-y-40', 'translate-z-12',
    'skew-x-2', '-skew-x-6', 'skew-y-2', '-skew-y-2',
  ]);
});

it('generate appearance', () => {
  match('appearance', [
    'none',
  ]);
});

it('generate cursor', () => {
  match('cursor', [
    'auto', 'default', 'pointer', 'wait', 'text', 'move', 'help', 'not-allowed',
  ]);
});

it('generate pointer events', () => {
  match('pointer', [
    'none', 'auto',
  ]);
});

it('generate resize utilities', () => {
  match('resize', [
    '~', 'x', 'y', 'none',
  ]);
});

it('generate select utilities', () => {
  match('select', [
    'none', 'text', 'all', 'auto',
  ]);
});

it('generate sr utilities', () => {
  match('sr', [
    'only', 'not-only',
  ]);
});
