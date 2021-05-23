import { utilities, negative } from './utilities';
import { flatColors } from './index';

import type { Attr, Completion } from '../interfaces';
import type { Processor } from 'windicss/lib';
import type { colorObject } from 'windicss/types/interfaces';

export function generateCompletions(processor: Processor, colors: colorObject, attributify = true, prefix = '') {
  const completions: Completion = {
    static: [],
    color: [],
    dynamic: [],
    attr: {
      static: {},
      color: {},
      dynamic: {},
    },
  };

  const staticUtilities = processor.resolveStaticUtilities(true);
  // generate normal utilities completions
  for (const [config, list] of Object.entries(utilities)) {
    list.forEach(utility => {
      const mark = utility.search(/\$/);
      if (mark === -1) {
        completions.static.push(utility);
      } else {
        const key = prefix + utility.slice(0, mark - 1);
        const suffix = utility.slice(mark);
        switch (suffix) {
        case '${static}':
          for (const i of Object.keys(processor.theme(config, {}) as any)) {
            completions.static.push(i === 'DEFAULT' ? key : i.charAt(0) === '-' ? `-${key}${i}` : `${key}-${i}`);
          }
          break;
        case '${color}':
          for (const [k, v] of Object.entries(flatColors(processor.theme(config, colors) as colorObject))) {
            completions.color.push({
              label: `${key}-${k}`,
              doc: v,
            });
          }
          break;
        default:
          completions.dynamic.push({
            label: prefix + utility,
            pos: utility.length - mark,
          });
          if (config in negative) {
            completions.dynamic.push({
              label: prefix + `-${utility}`,
              pos: utility.length + 1 - mark,
            });
          }
          break;
        }
      }
    });
  }

  // generate attributify completions
  const attr: Attr = { static: {}, color: {}, dynamic: {} };
  const addStatic = (key: string, value: string) => {
    key in attr.static ? attr.static[key].push(value) : attr.static[key] = [ value ];
  };

  if (attributify) {

    addStatic('flex', '~');
    addStatic('flex', 'inline');
    addStatic('grid', '~');
    addStatic('grid', 'inline');
    addStatic('gradient', 'none');
    addStatic('underline', '~');
    addStatic('underline', 'line-through');
    addStatic('underline', 'none');
    addStatic('filter', '~');
    addStatic('filter', 'none');
    addStatic('backdrop', '~');
    addStatic('backdrop', 'none');

    for (const [key, style] of Object.entries(staticUtilities)) {
      switch (style[0].meta.group) {
      case 'fontStyle':
      case 'fontSmoothing':
      case 'fontVariantNumeric':
        addStatic('font', key);
        break;
      case 'textAlign':
        addStatic('text', key.slice(5)); // text-
        break;
      case 'verticalAlign':
        addStatic('text', key.slice(6)); // align-
        break;
      case 'textDecoration':
        addStatic('text', key);
        break;
      case 'textTransform':
      case 'textOverflow':
      case 'wordBreak':
      case 'writingMode':
      case 'writingOrientation':
      case 'hyphens':
        addStatic('text', key);
        break;
      case 'whitespace':
        addStatic('text', key.slice(5)); // whitespace -> space
        break;
      case 'listStylePosition':
        addStatic('list', key.slice(5)); // list-
        break;
      case 'backgroundAttachment':
      case 'backgroundRepeat':
      case 'backgroundClip':
      case 'backgroundOrigin':
      case 'backgroundBlendMode':
        addStatic('bg', key.slice(3)); // bg-
        break;
      case 'borderStyle':
        addStatic('border', key.slice(7)); // border-
        addStatic('divide', key.slice(7)); // border-
        break;
      case 'borderCollapse':
        addStatic('border', key.slice(7)); // border-
        break;
      case 'strokeDashArray':
      case 'strokeDashOffset':
      case 'stroke':
        addStatic('icon', key);
        break;
      case 'flexWrap':
      case 'flexDirection':
        addStatic('flex', key.slice(5)); // flex-
        break;
      case 'gridAutoFlow':
        addStatic('grid', key.slice(5)); // grid-
        break;
      case 'display':
        if (key.startsWith('table') || key === 'inline-table') {
          addStatic('table', key.replace(/-?table-?/, '') || '~');
        } else {
          addStatic('display', key);
        }
        break;
      case 'position':
      case 'float':
      case 'clear':
        addStatic('pos', key);
        break;
      case 'isolation':
        addStatic('pos', key);
        addStatic('isolation', key.replace('isolation-', ''));
        break;
      case 'visibility':
      case 'backfaceVisibility':
        addStatic('display', key);
        break;
      case 'tableLayout':
        addStatic('table', key.slice(6)); // table-
        break;
      case 'captionSide':
      case 'emptyCells':
        addStatic('table', key);
        break;
      case 'alignContent':
      case 'alignItems':
      case 'alignSelf':
        addStatic('align', key);
        break;
      case 'justifyContent':
      case 'justifyItems':
      case 'justifySelf':
      case 'placeContent':
      case 'placeItems':
      case 'placeSelf':
      case 'userSelect':
      case 'resize':
      case 'overflow':
      case 'appearance':
      case 'textDecorationStyle':
      case 'overscrollBehavior':
        const splits = split(key);
        if (!splits.key) break;
        addStatic(splits.key, splits.body);
        break;
      case 'boxDecorationBreak':
        addStatic('box', key);
        break;
      case 'boxSizing':
        addStatic('box', key.slice(4)); // box-
        break;
      case 'objectFit':
        addStatic('object', key.slice(7)); // object-
        break;
      case 'transform':
        if (key.startsWith('preserve')) {
          addStatic('transform', key);
        } else {
          addStatic('transform', key.slice(10) || '~'); // transform-
        }
        break;
      case 'perspectOrigin':
        addStatic('transform', key);
        break;
      case 'pointerEvents':
        addStatic('pointer', key.slice(15)); // pointer-events-
        break;
      case 'mixBlendMode':
        addStatic('blend', key.slice(10)); // mix-blend-
        break;
      case 'accessibility':
        addStatic('sr', key.replace(/sr-/, ''));
        break;
      }
    }

    for (const utility of completions.static) {
      const { key, body } = split(utility);
      if (key) {
        if (key === 'underline') Array.isArray(attr.static['text']) ? attr.static['text'].push(utility) : attr.static['text'] = [ utility ];
        attr.static[key] = key in attr.static ? [...attr.static[key], body] : [ body ];
      }
    }

    for (const { label, doc } of completions.color) {
      const { key, body } = split(label);
      if (key) {
        const item = { label: body, doc };
        attr.color[key] = key in attr.color ? [...attr.color[key], item] : [ item ];
        if (key === 'underline') {
          const item = { label, doc };
          attr.color['text'] = 'text' in attr.color ? [...attr.color['text'], item] : [ item ];
        }
      }
    }

    for (const { label, pos } of completions.dynamic) {
      const { key, body } = split(label);
      if (key) {
        const item = { label: body, pos };
        attr.dynamic[key] = key in attr.dynamic ? [...attr.dynamic[key], item] : [ item ];
      }
    }
  }

  completions.static.push(...Object.keys(staticUtilities));
  completions.attr = attr;
  return completions;
}

function split(utility: string) {
  if (utility.startsWith('bg-gradient')) return { key: 'gradient', body: utility.replace(/^bg-gradient-/, '') };
  if (utility === 'w-min') return { key: 'w', body: 'min-content' };
  if (utility === 'w-max') return { key: 'w', body: 'max-content' };
  if (utility === 'h-min') return { key: 'h', body: 'min-content' };
  if (utility === 'h-max') return { key: 'h', body: 'max-content' };
  if (utility.startsWith('min-w')) return { key: 'w', body: utility.replace(/^min-w-/, 'min-') };
  if (utility.startsWith('max-w')) return { key: 'w', body: utility.replace(/^max-w-/, 'max-') };
  if (utility.startsWith('min-h')) return { key: 'h', body: utility.replace(/^min-h-/, 'min-') };
  if (utility.startsWith('max-h')) return { key: 'h', body: utility.replace(/^max-h-/, 'max-') };

  const key = utility.match(/[^-]+/)?.[0];
  if (key) {
    if (['duration', 'ease', 'delay'].includes(key)) return { key: 'transition', body: utility };
    if (['scale', 'rotate', 'translate', 'skew', 'origin', 'perspect'].includes(key)) return { key: 'transform', body: utility };
    if (['blur', 'brightness', 'contrast', 'drop', 'grayscale', 'hue', 'invert', 'saturate', 'sepia'].includes(key)) return { key: 'filter', body: utility };
    if (['inset', 'top', 'left', 'bottom', 'right'].includes(key)) return { key: 'pos', body: utility };
    if (['py', 'px', 'pt', 'pl', 'pb', 'pr'].includes(key)) return { key: 'p', body: utility.slice(1,) };
    if (['my', 'mx', 'mt', 'ml', 'mb', 'mr'].includes(key)) return { key: 'm', body: utility.charAt(0) === '-' ? '-' + utility.slice(2,): utility.slice(1,) };
    if (['stroke', 'fill'].includes(key)) return { key: 'icon', body: utility };
    if (['from', 'via', 'to'].includes(key)) return { key: 'gradient', body: utility };
    if (['tracking', 'leading'].includes(key)) return { key: 'font', body: utility };
    if (['tab', 'indent'].includes(key)) return { key: 'text', body: utility };
    if (['col', 'row', 'auto', 'gap'].includes(key)) return { key: 'grid', body: utility };
    if (key === 'placeholder') return { key: 'text', body: utility };
    if (key === 'rounded') return { key: 'border', body: utility };
  }
  const negative = utility.charAt(0) === '-';
  const body = (negative ? utility.slice(1,): utility).match(/-.+/)?.[0].slice(1) || '~';
  return { key, body: negative ? '-' + body : body };
}
