import { negative, utilities } from '../utils/utilities';
import { flatColors, hex2RGB, buildStyle, buildEmptyStyle } from '../utils';
import { Style } from 'windicss/utils/style';
import { patterns, allowAttr } from '../utils/filetypes';
import { languages, Range, Position, CompletionItem, SnippetString, CompletionItemKind } from 'vscode';

import type Extension from './index';
import type { DocumentSelector } from 'vscode';
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

export default class Completions {
  processor: Processor;
  extension: Extension;
  separator: string;
  prefix: string;
  completions: Completion;

  constructor(extension: Extension, processor: Processor) {
    this.processor = processor;
    this.extension = extension;
    this.separator = processor.config('separator', ':') as string;
    this.prefix = processor.config('prefix', '') as string;
    this.completions = this.generateCompletions();
  }

  generateCompletions(attributify = true) {
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

    completions.static.push(...Object.keys(this.processor.resolveStaticUtilities(true)));
    // generate normal utilities completions
    for (const [config, list] of Object.entries(utilities)) {
      list.forEach(utility => {
        const mark = utility.search(/\$/);
        if (mark === -1) {
          completions.static.push(utility);
        } else {
          const prefix = this.prefix + utility.slice(0, mark - 1);
          const suffix = utility.slice(mark);
          switch (suffix) {
          case '${static}':
            completions.static = completions.static.concat(
              Object.keys(this.processor.theme(config, {}) as any)
                .map(i => i === 'DEFAULT' ? prefix : i.charAt(0) === '-' ? `-${prefix}${i}` : `${prefix}-${i}`)
            );
            break;
          case '${color}':
            for (const [k, v] of Object.entries(flatColors(this.processor.theme(config, this.extension.colors) as colorObject))) {
              completions.color.push({
                label: this.prefix + `${prefix}-${k}`,
                doc: v,
              });
            }
            break;
          default:
            completions.dynamic.push({
              label: this.prefix + utility,
              pos: utility.length - mark,
            });
            if (config in negative) {
              completions.dynamic.push({
                label: this.prefix + `-${utility}`,
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

    completions.attr = attr;
    return completions;
  }

  // register suggestions in class = ... | className = ... | @apply ... | sm = ... | hover = ...
  registerUtilities(ext: DocumentSelector, type: string, pattern?: RegExp, enableUtilty = true, enableVariant = true, enableDynamic = true, enableEmmet = false) {
    return languages.registerCompletionItemProvider(
      ext,
      {
        provideCompletionItems: (document, position) => {
          const text = document.getText(new Range(new Position(0, 0), position));

          if ((!pattern || text.match(pattern) === null) && text.match(patterns[type]) === null) {
            const key = text.match(/\S+(?=\s*=\s*["']?[^"']*$)/)?.[0];
            if ((!key) || !(allowAttr(type) && this.extension.isAttrVariant(key))) return [];
          }

          let completions: CompletionItem[] = [];

          if (enableUtilty) {
            completions = completions.concat(
              this.completions.static.map((classItem, index) => {
                const item = new CompletionItem(classItem, CompletionItemKind.Constant);
                item.sortText = '1-' + index.toString().padStart(8, '0');
                return item;
              })
            );
          }

          if (enableVariant) {
            completions = completions.concat(
              Object.keys(this.extension.variants).map((variant, index) => {
                const item = new CompletionItem(variant + this.separator, CompletionItemKind.Module);
                item.detail = variant;
                item.sortText = '2-' + index.toString().padStart(8, '0');
                // register suggestion after select variant
                item.command = {
                  command: 'editor.action.triggerSuggest',
                  title: variant,
                };
                return item;
              })
            ).concat(
              this.completions.color.map(({ label, doc }, index) => {
                const color = new CompletionItem(label, CompletionItemKind.Color);
                color.sortText = '0-' + index.toString().padStart(8, '0');
                color.documentation = doc;
                return color;
              })
            );
          }

          if (enableDynamic) {
            completions = completions.concat(
              this.completions.dynamic.map(({ label, pos }, index) => {
                const item = new CompletionItem(label, CompletionItemKind.Variable);
                item.sortText = '3-' + index.toString().padStart(8, '0');
                item.command = {
                  command: 'cursorMove',
                  arguments: [{
                    to: 'left',
                    select: true,
                    value: pos,
                  }],
                  title: label,
                };
                return item;
              })
            );
          }

          return completions;
        },

        resolveCompletionItem: (item) => {
          switch (item.kind) {
          case CompletionItemKind.Constant:
            item.documentation = buildStyle(this.processor.interpret(item.label).styleSheet);
            break;
          case CompletionItemKind.Module:
            item.documentation = this.buildVariantDoc(item.detail);
            item.detail = undefined;
            break;
          case CompletionItemKind.Variable:
            // TODO
            break;
          case CompletionItemKind.Color:
            const color = (item.documentation || 'currentColor') as string;
            item.documentation = ['transparent', 'currentColor'].includes(color) ? color : `rgb(${hex2RGB(color)?.join(', ')})`;
            item.detail = this.processor.interpret(item.label).styleSheet.build();
            break;
          }
          return item;
        },
      },
      '"',
      '\'',
      ':',
      '!',
      '(',
      ' ',
      ...(enableEmmet ? [ '.' ] : []),
    );
  }

  // register suggestion for bg, text, sm, hover ...
  registerAttrKeys(ext: DocumentSelector, enableUtility = true, enableVariant = true) {
    return languages.registerCompletionItemProvider(
      ext,
      {
        provideCompletionItems: (document, position) => {
          const text = document.getText(new Range(new Position(0, 0), position));
          if (text.match(/(<\w+\s*)[^>]*$/) !== null) {
            if (!text.match(/\S+(?=\s*=\s*["']?[^"']*$)/) || text.match(/<\w+\s+$/)) {
              let completions: CompletionItem[] = [];
              if (enableUtility) {
                completions = completions.concat(
                  Object.keys(this.completions.attr.static).map(label => attrKey(label, CompletionItemKind.Field, 0))
                );
              }
              if (enableVariant) {
                completions = completions.concat(
                  Object.keys(this.extension.variants).map(label => attrKey(label, CompletionItemKind.Module, 1))
                );
              }
              return completions;
            }
          }
          return [];
        },
        resolveCompletionItem: item => {
          switch (item.kind) {
          case CompletionItemKind.Field:
            item.documentation = this.buildAttrDoc(item.label);
            break;
          case CompletionItemKind.Module:
            item.documentation = this.buildVariantDoc(item.label, true);
            break;
          }
          return item;
        },
      },
      ':',
    );
  }

  registerAttrValues(ext: DocumentSelector, enableUtility = true, enableVariant = true, enableDynamic = true) {
    return languages.registerCompletionItemProvider(
      ext,
      {
        provideCompletionItems: (document, position) => {
          const text = document.getText(new Range(new Position(0, 0), position));
          if (text.match(/(<\w+\s*)[^>]*$/) !== null) {
            const key = this.extension.isAttrUtility(text.match(/\S+(?=\s*=\s*["']?[^"']*$)/)?.[0]);
            if (!key) return [];

            let completions: CompletionItem[] = [];
            if (enableUtility) {
              completions = completions.concat(
                this.completions.attr.static[key].map((label, index) => {
                  const item = new CompletionItem(label, CompletionItemKind.Constant);
                  item.detail = key;
                  item.sortText = '1-' + index.toString().padStart(8, '0');
                  return item;
                })
              ).concat(
                key in this.completions.attr.color ? this.completions.attr.color[key].map(({ label, doc }, index) => {
                  const color = new CompletionItem(label, CompletionItemKind.Color);
                  color.sortText = '0-' + index.toString().padStart(8, '0');
                  color.detail = key;
                  color.documentation = doc;
                  return color;
                }) : []
              );
            }

            if (enableVariant) {
              completions = completions.concat(
                Object.keys(this.extension.variants).map((variant, index) => {
                  const item = new CompletionItem(variant + this.separator, CompletionItemKind.Module);
                  item.detail = key + ',' + variant;
                  item.sortText = '2-' + index.toString().padStart(8, '0');
                  item.command = {
                    command: 'editor.action.triggerSuggest',
                    title: variant,
                  };
                  return item;
                })
              );
            }

            if (enableDynamic && key in this.completions.attr.dynamic) {
              completions = completions.concat(
                this.completions.attr.dynamic[key].map(({ label, pos }, index) => {
                  const item = new CompletionItem(label, CompletionItemKind.Variable);
                  item.sortText = '3-' + index.toString().padStart(8, '0');
                  item.command = {
                    command: 'cursorMove',
                    arguments: [{
                      to: 'left',
                      select: true,
                      value: pos,
                    }],
                    title: label,
                  };
                  return item;
                })
              );
            }

            return completions;
          }
        },

        resolveCompletionItem: item => {
          switch (item.kind) {
          case CompletionItemKind.Constant:
            item.documentation = buildStyle(this.processor.attributify({ [item.detail ?? ''] : [ item.label ] }).styleSheet);
            item.detail = undefined;
            break;
          case CompletionItemKind.Module:
            const [attr, variant] = item.detail?.split(',') || [];
            item.documentation = this.buildAttrDoc(attr, variant, this.separator);
            item.detail = undefined;
            break;
          case CompletionItemKind.Variable:
            break;
          case CompletionItemKind.Color:
            const color = (item.documentation || 'currentColor') as string;
            item.documentation = ['transparent', 'currentColor'].includes(color) ? color : `rgb(${hex2RGB(color)?.join(', ')})`;
            item.detail = this.processor.attributify({ [item.detail ?? ''] : [ item.label ] }).styleSheet.build();
            break;
          }
          return item;
        },
      },
      '"',
      '\'',
      ':',
      ' ',
    );
  }

  buildAttrDoc(attr: string, variant?: string, separator?: string) {
    let style;
    if (variant) {
      style = this.extension.variants[variant]();
      style.selector = `[${this.processor?.e(attr)}~="${variant}${separator}&"]`;
    } else {
      style = new Style(`[${this.processor?.e(attr)}~="&"]`);
    }
    return buildEmptyStyle(style);
  }

  buildVariantDoc(variant?: string, attributify = false) {
    if (!variant) return '';
    const style = this.extension.variants[variant]();
    if (attributify) {
      style.selector = `[${this.processor?.e(variant)}~="&"]`;
    } else {
      style.selector = '&';
    }

    return buildEmptyStyle(style);
  }
}

function split(utility: string) {
  const key = utility.match(/[^-]+/)?.[0];
  const body = utility.match(/-.+/)?.[0].slice(1) || '~';
  return { key, body };
}

function attrKey(label: string, kind: CompletionItemKind, order: number) {
  const item = new CompletionItem(label, kind);
  item.sortText = `${order}-` + label;
  item.insertText = new SnippetString(`${label}="$1"`);
  item.command = {
    command: 'editor.action.triggerSuggest',
    title: label,
  };
  return item;
}
