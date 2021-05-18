import type { Core } from '../../interfaces';
import { getConfig } from '../../utils';


export function generateAttrUtilities(core: Core) {
  if (!getConfig('windicss.enableAttrUtilityCompletion')) return { attrs: {}, dynamics: {}, colors: {} };
  const attrs: {[key:string]: string[]} = {};
  for (const utility of core.utilities) {
    const key = utility.match(/[^-]+/)?.[0];
    const body = utility.match(/-.+/)?.[0].slice(1) || '~';
    if (key) {
      attrs[key] = key in attrs ? [...attrs[key], body] : [ body ];
    }
  }

  const colors: {[key:string]: {value: string, doc: string}[]} = {};
  for (const { label, documentation } of core.colorCompletions) {
    const key = label.match(/[^-]+/)?.[0];
    const body = label.match(/-.+/)?.[0].slice(1) || '~';
    if (key) {
      const item = { value: body, doc: documentation };
      colors[key] = key in colors ? [...colors[key], item] : [ item ];
    }
  }

  const dynamics: {[key:string]: {value: string, position: number}[]} = {};
  for (const { label, position } of core.dynamicCompletions) {
    const key = label.match(/[^-]+/)?.[0];
    const body = label.match(/-.+/)?.[0].slice(1) || '~';
    if (key) {
      const item = { value: body, position };
      dynamics[key] = key in dynamics ? [...dynamics[key], item] : [ item ];
    }
  }
  return {
    attrs,
    dynamics,
    colors,
  };
}
