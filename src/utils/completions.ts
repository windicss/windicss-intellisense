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
      case 'veritcalAlign':
      case 'textDecoration':
      case 'textTransform':
      case 'textOverflow':
      case 'whiteSpace':
      case 'wordBreak':
      case 'writingMode':
      case 'writingOrientation':
      case 'hyphens':
        Array.isArray(attr.static['text']) ? attr.static['text'].push(key) : attr.static['text'] = [ key ];
        break;
      }
    }

    for (const utility of completions.static) {
      const { key, body } = split(utility);
      if (key) {
        attr.static[key] = key in attr.static ? [...attr.static[key], body] : [ body ];
      }
    }

    for (const { label, doc } of completions.color) {
      const { key, body } = split(label);
      if (key) {
        const item = { label: body, doc };
        attr.color[key] = key in attr.color ? [...attr.color[key], item] : [ item ];
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
  const key = utility.match(/[^-]+/)?.[0];
  if (key) {
    if (['tracking', 'leading'].includes(key)) return { key: 'font', body: utility };
  }
  const body = utility.match(/-.+/)?.[0].slice(1) || '~';
  return { key, body };
}
