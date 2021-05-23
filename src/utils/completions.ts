import { utilities, negative } from './utilities';
import { flatColors } from './index';
import type { Processor } from 'windicss/lib';
import type { colorObject } from 'windicss/types/interfaces';

export interface Attr {
  static: {
    [key:string]: string[]
  },
  color: {
    [key:string]: {
      label: string
      doc: string
    }[]
  },
  dynamic: {
    [key:string]: {
      label: string
      pos: number
    }[]
  }
}

export interface Completion {
  static: string[],
  color: {
    label: string
    doc: string
  }[],
  dynamic: {
    label: string
    pos: number
  }[]
  attr: Attr
}

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
          completions.static = completions.static.concat(
            Object.keys(processor.theme(config, {}) as any)
              .map(i => i === 'DEFAULT' ? key : i.charAt(0) === '-' ? `-${key}${i}` : `${key}-${i}`)
          );
          break;
        case '${color}':
          for (const [k, v] of Object.entries(flatColors(processor.theme(config, colors) as colorObject))) {
            completions.color.push({
              label: prefix + `${key}-${k}`,
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

  if (attributify) {

    for (const [key, value] of Object.entries(staticUtilities)) {
      switch (value[0].meta.group) {
      case 'fontStyle':
      case 'fontSmoothing':
      case 'fontVariantNumeric':
        Array.isArray(attr.static['font']) ? attr.static['font'].push(key) : attr.static['font'] = [ key ];
        break;
      case 'textAlign':
        Array.isArray(attr.static['text']) ? attr.static['text'].push(key.replace(/^text-/, '')) : attr.static['text'] = [ key.replace(/^text-/, '') ];
        break;
      case 'verticalAlign':
        Array.isArray(attr.static['text']) ? attr.static['text'].push(key.replace(/^align-/, '')) : attr.static['text'] = [ key.replace(/^align-/, '') ];
        break;
      case 'textDecoration':
        Array.isArray(attr.static['text']) ? attr.static['text'].push(key) : attr.static['text'] = [ key ];
        break;
      case 'textTransform':
      case 'textOverflow':
      case 'wordBreak':
      case 'writingMode':
      case 'writingOrientation':
      case 'hyphens':
        Array.isArray(attr.static['text']) ? attr.static['text'].push(key) : attr.static['text'] = [ key ];
        break;
      case 'whitespace':
        Array.isArray(attr.static['text']) ? attr.static['text'].push(key.replace(/^whitespace/, 'space')) : attr.static['text'] = [ key.replace(/^whitespace/, 'space') ];
        break;
      case 'listStylePosition':
        Array.isArray(attr.static['list']) ? attr.static['list'].push(key.replace(/^list-/, '')) : attr.static['list'] = [ key.replace(/^list-/, '') ];
        break;
      case 'backgroundAttachment':
      case 'backgroundRepeat':
      case 'backgroundClip':
      case 'backgroundOrigin':
      case 'backgroundBlendMode':
        Array.isArray(attr.static['bg']) ? attr.static['bg'].push(key.replace(/^bg-/, '')) : attr.static['bg'] = [ key.replace(/^bg-/, '') ];
        break;
      case 'borderStyle':
        Array.isArray(attr.static['border']) ? attr.static['border'].push(key.replace(/^border-/, '')) : attr.static['border'] = [ key.replace(/^border-/, '') ];
        Array.isArray(attr.static['divide']) ? attr.static['divide'].push(key.replace(/^border-/, '')) : attr.static['divide'] = [ key.replace(/^border-/, '') ];
        break;
      case 'borderCollapse':
        Array.isArray(attr.static['border']) ? attr.static['border'].push(key.replace(/^border-/, '')) : attr.static['border'] = [ key.replace(/^border-/, '') ];
        break;
      case 'strokeDashArray':
      case 'strokeDashOffset':
      case 'stroke':
        Array.isArray(attr.static['icon']) ? attr.static['icon'].push(key) : attr.static['icon'] = [ key ];
        break;
      case 'flexWrap':
      case 'flexDirection':
        Array.isArray(attr.static['flex']) ? attr.static['flex'].push(key.replace(/^flex-/, '')) : attr.static['flex'] = [ key.replace(/^flex-/, '') ];
        break;
      case 'gridAutoFlow':
        Array.isArray(attr.static['grid']) ? attr.static['grid'].push(key.replace(/^grid-/, '')) : attr.static['grid'] = [ key.replace(/^grid-/, '') ];
        break;
      case 'display':
        if (key.startsWith('table') || key === 'inline-table') {
          Array.isArray(attr.static['table']) ? attr.static['table'].push(key.replace(/-?table-?/, '') || '~') : attr.static['table'] = [ key.replace(/-?table-?/, '') || '~' ];
        } else {
          Array.isArray(attr.static['display']) ? attr.static['display'].push(key) : attr.static['display'] = [ key ];
        }
        break;
      case 'position':
      case 'float':
      case 'clear':
        Array.isArray(attr.static['pos']) ? attr.static['pos'].push(key) : attr.static['pos'] = [ key ];
        break;
      case 'isolation':
        Array.isArray(attr.static['pos']) ? attr.static['pos'].push(key) : attr.static['pos'] = [ key ];
        Array.isArray(attr.static['isolation']) ? attr.static['isolation'].push(key.replace('isolation-', '')) : attr.static['isolation'] = [ key.replace('isolation-', '') ];
        break;
      case 'visibility':
      case 'backfaceVisibility':
        Array.isArray(attr.static['display']) ? attr.static['display'].push(key) : attr.static['display'] = [ key ];
        break;
      case 'tableLayout':
        Array.isArray(attr.static['table']) ? attr.static['table'].push(key.replace(/^table-/, '')) : attr.static['table'] = [ key.replace(/^table-/, '') ];
        break;
      case 'captionSide':
      case 'emptyCells':
        Array.isArray(attr.static['table']) ? attr.static['table'].push(key) : attr.static['table'] = [ key ];
        break;
      case 'alignContent':
      case 'alignItems':
      case 'alignSelf':
        Array.isArray(attr.static['align']) ? attr.static['align'].push(key) : attr.static['align'] = [ key ];
        break;
      case 'justifyContent':
      case 'justifyItems':
      case 'justifySelf':
      case 'placeContent':
      case 'placeItems':
      case 'placeSelf':
        const splits = split(key);
        if (!splits.key) break;
        Array.isArray(attr.static[splits.key]) ? attr.static[splits.key].push(splits.body) : attr.static[splits.key] = [ splits.body ];
        break;
      case 'boxDecorationBreak':
      case 'boxSizing':
        Array.isArray(attr.static['box']) ? attr.static['box'].push(key.replace(/^box-/, '')) : attr.static['box'] = [ key.replace(/^box-/, '') ];
        break;
      case 'objectFit':
        Array.isArray(attr.static['object']) ? attr.static['object'].push(key.replace(/^object-/, '')) : attr.static['object'] = [ key.replace(/^object-/, '') ];
        break;
      case 'transform':
        Array.isArray(attr.static['transform']) ? attr.static['transform'].push(key.replace(/^transform-?/, '') || '~') : attr.static['transform'] = [ key.replace(/^transform-?/, '') || '~' ];
        break;
      case 'preserve':
      case 'perspectOrigin':
        Array.isArray(attr.static['transform']) ? attr.static['transform'].push(key) : attr.static['transform'] = [ key ];
        break;
      case 'userSelect':
      case 'resize':
      case 'overflow':
      case 'appearance':
      case 'overscrollBehavior':
        const over = split(key);
        if (!over.key) break;
        Array.isArray(attr.static[over.key]) ? attr.static[over.key].push(over.body) : attr.static[over.key] = [ over.body ];
        break;
      case 'pointerEvents':
        Array.isArray(attr.static['pointer']) ? attr.static['pointer'].push(key.replace('pointer-events-', '')) : attr.static['pointer'] = [ key.replace('pointer-events-', '') ];
        break;
      case 'mixBlendMode':
        Array.isArray(attr.static['blend']) ? attr.static['blend'].push(key.replace('mix-blend-', '')) : attr.static['blend'] = [ key.replace('mix-blend-', '') ];
        break;
      case 'accessibility':
        Array.isArray(attr.static['sr']) ? attr.static['sr'].push(key.replace(/sr-/, '')) : attr.static['sr'] = [ key.replace(/sr-/, '') ];
        break;
      }
    }
    Array.isArray(attr.static['flex']) ? attr.static['flex'].push(...['~', 'inline']) : attr.static['flex'] = ['~', 'inline'];
    Array.isArray(attr.static['grid']) ? attr.static['grid'].push(...['~', 'inline']) : attr.static['grid'] = ['~', 'inline'];
    Array.isArray(attr.static['gradient']) ? attr.static['gradient'].push('none') : attr.static['gradient'] = ['none'];
    Array.isArray(attr.static['underline']) ? attr.static['underline'].push(...['~', 'line-through', 'none']) : attr.static['underline'] = ['~', 'line-through', 'none'];
    Array.isArray(attr.static['filter']) ? attr.static['filter'].push(...['~', 'none']) : attr.static['filter'] = ['~', 'none'];
    Array.isArray(attr.static['backdrop']) ? attr.static['backdrop'].push(...['~', 'none']) : attr.static['backdrop'] = ['~', 'none'];


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
  if (utility.startsWith('min-w')) {
    return { key: 'w', body: utility.replace(/^min-w-/, 'min-') };
  }
  if (utility.startsWith('max-w')) {
    return { key: 'w', body: utility.replace(/^max-w-/, 'max-') };
  }
  if (utility.startsWith('min-h')) {
    return { key: 'h', body: utility.replace(/^min-h-/, 'min-') };
  }
  if (utility.startsWith('max-h')) {
    return { key: 'h', body: utility.replace(/^max-h-/, 'max-') };
  }
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
    if (key === 'placeholder') return { key: 'text', body: utility };
    if (key === 'rounded') return { key: 'border', body: utility };
    if (['col', 'row', 'auto', 'gap'].includes(key)) return { key: 'grid', body: utility };
  }
  const negative = utility.charAt(0) === '-';
  const body = (negative ? utility.slice(1,): utility).match(/-.+/)?.[0].slice(1) || '~';
  return { key, body: negative ? '-' + body : body };
}
