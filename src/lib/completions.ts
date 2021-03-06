import { hex2RGB } from '../utils';
import { buildStyle, buildEmptyStyle } from '../utils/helpers';
import { Style } from 'windicss/utils/style';
import { patterns, allowAttr } from '../utils/filetypes';
import { generateCompletions } from '../utils/completions';
import { languages, Range, Position, CompletionItem, SnippetString, CompletionItemKind } from 'vscode';

import type Extension from './index';
import type { DocumentSelector } from 'vscode';
import type { Processor } from 'windicss/lib';
import type { Completion } from '../interfaces';

export default class Completions {
  processor: Processor;
  extension: Extension;
  separator: string;
  completions: Completion;

  constructor(extension: Extension, processor: Processor) {
    this.processor = processor;
    this.extension = extension;
    this.separator = processor.config('separator', ':') as string;
    this.completions = generateCompletions(processor, this.extension.colors, true, processor.config('prefix', '') as string);
    this.extension.attrs = this.completions.attr.static;
  }

  // register suggestions in class = ... | className = ... | @apply ... | sm = ... | hover = ...
  registerUtilities(ext: DocumentSelector, type: string, pattern?: RegExp, enableUtility = true, enableVariant = true, enableDynamic = true, enableBracket = true, enableEmmet = false) {
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

          if (enableUtility && text.endsWith('/')) {
            const utility = text.match(/[\w-:!<@]+(?=\/$)/);
            if (!utility) return [];
            return Object.keys(this.processor.theme('opacity', {}) as string[]).map((opacity, index) => {
              const item = new CompletionItem(opacity, CompletionItemKind.Unit);
              item.detail = utility[0];
              item.sortText = '1-' + index.toString().padStart(8, '0');
              return item;
            });
          }

          if (enableUtility) {
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

          if (enableBracket) {
            completions = completions.concat(
              this.completions.bracket.map((label, index) => {
                const item = new CompletionItem(label, CompletionItemKind.Struct);
                item.sortText = '3-' + index.toString().padStart(8, '0');
                return item;
              })
            );
          }

          if (enableDynamic) {
            completions = completions.concat(
              this.completions.dynamic.map(({ label, pos }, index) => {
                const item = new CompletionItem(label, CompletionItemKind.Variable);
                item.sortText = '4-' + index.toString().padStart(8, '0');
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
          case CompletionItemKind.Struct:
            item.documentation = buildStyle(this.processor.interpret(item.label).styleSheet);
            item.insertText = new SnippetString(`${item.label.replace('-[', '-[${1:').slice(0, -1)}}]`);
            break;
          case CompletionItemKind.Variable:
            this.generateDynamicInfo(item, false);
            break;
          case CompletionItemKind.Color:
            const color = (item.documentation || 'currentColor') as string;
            item.documentation = ['transparent', 'currentColor'].includes(color) ? color : `rgb(${hex2RGB(color)?.join(', ')})`;
            item.detail = this.processor.interpret(item.label).styleSheet.build();
            break;
          case CompletionItemKind.Unit:
            item.documentation = item.detail ? buildStyle(this.processor.interpret(`${item.detail}/${item.label}`).styleSheet) : undefined;
            item.detail = undefined;
            break;
          }
          return item;
        },
      },
      '"',
      '\'',
      '/',
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
              const prefix = this.processor.config('attributify.prefix');
              const disable = this.processor.config('attributify.disable') as string[] | undefined;
              let prevKey = undefined;
              if (text.endsWith(':')) {
                prevKey = document.getText(document.getWordRangeAtPosition(new Position(position.line, position.character-1), /[^:\s]+/));
              }
              if (!prevKey || (prevKey && (prevKey in this.extension.variants || this.extension.isAttrVariant(prevKey)))) {
                if (enableUtility) {
                  completions = completions.concat(
                    Object.keys(this.completions.attr.static).map(label => attrKey(prefix && !text.endsWith(':') ? prefix + label : label, CompletionItemKind.Field, 0))
                  );
                }
                if (enableVariant) {
                  const variants = disable ? Object.keys(this.extension.variants).filter(i => !disable.includes(i)) : Object.keys(this.extension.variants);
                  completions = completions.concat(variants.map(label => attrKey(prefix && !text.endsWith(':') ? prefix + label : label, CompletionItemKind.Module, 1)));
                }
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

  registerAttrValues(ext: DocumentSelector, enableUtility = true, enableVariant = true, enableDynamic = true, enableBracket = true) {
    return languages.registerCompletionItemProvider(
      ext,
      {
        provideCompletionItems: (document, position) => {
          const text = document.getText(new Range(new Position(0, 0), position));
          if (text.match(/(<\w+\s*)[^>]*$/) !== null) {
            const key = this.extension.isAttrUtility(text.match(/\S+(?=\s*=\s*["']?[^"']*$)/)?.[0]);
            if (!key) return [];

            let completions: CompletionItem[] = [];

            if (enableUtility && text.endsWith('/')) {
              const utility = text.match(/[\w-:!<@]+(?=\/$)/);
              if (!utility) return [];
              return Object.keys(this.processor.theme('opacity', {}) as string[]).map((opacity, index) => {
                const item = new CompletionItem(opacity, CompletionItemKind.Unit);
                item.detail = [key, utility[0]].join('____');
                item.sortText = '1-' + index.toString().padStart(8, '0');
                return item;
              });
            }

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

            if (enableBracket && key in this.completions.attr.bracket) {
              completions = completions.concat(
                this.completions.attr.bracket[key].map((label, index) => {
                  const item = new CompletionItem(label, CompletionItemKind.Struct);
                  item.detail = key;
                  item.sortText = '3-' + index.toString().padStart(8, '0');
                  return item;
                })
              );
            }

            if (enableDynamic && key in this.completions.attr.dynamic) {
              completions = completions.concat(
                this.completions.attr.dynamic[key].map(({ label, pos }, index) => {
                  const item = new CompletionItem(label, CompletionItemKind.Variable);
                  item.detail = key;
                  item.sortText = '4-' + index.toString().padStart(8, '0');
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
          case CompletionItemKind.Struct:
            item.documentation = buildStyle(this.processor.attributify({ [item.detail ?? ''] : [ item.label ] }).styleSheet);
            item.insertText = new SnippetString(`${item.label.replace('[', '[${1:').slice(0, -1)}}]`);
            item.detail = undefined;
            break;
          case CompletionItemKind.Variable:
            this.generateDynamicInfo(item, true);
            break;
          case CompletionItemKind.Color:
            const color = (item.documentation || 'currentColor') as string;
            item.documentation = ['transparent', 'currentColor'].includes(color) ? color : `rgb(${hex2RGB(color)?.join(', ')})`;
            item.detail = this.processor.attributify({ [item.detail ?? ''] : [ item.label ] }).styleSheet.build();
            break;
          case CompletionItemKind.Unit:
            const [ key, utility ] = item.detail?.split('____') || [];
            item.documentation = buildStyle(this.processor.attributify({ [key] : [ `${utility}/${item.label}` ] }).styleSheet);
            item.detail = undefined;
            break;
          }
          return item;
        },
      },
      '"',
      '\'',
      ':',
      '/',
      ' ',
    );
  }

  generateDynamicInfo(item: CompletionItem, attributify = false) {
    const match = item.label.match(/{\w+}$/);
    if (!match) return;
    switch (match[0]) {
    case '{int}':
      this.setDynamicInfo(item, 'int', '99', attributify);
      break;
    case '{float}':
      this.setDynamicInfo(item, 'float', '5.21', attributify);
      break;
    case '{fraction}':
      this.setDynamicInfo(item, 'fraction', '13/14', attributify);
      break;
    case '{time}':
      this.setDynamicInfo(item, 'time', '1.25s', attributify);
      break;
    case '{size}':
      this.setDynamicInfo(item, 'size', '25px', attributify);
      break;
    case '{string}':
      this.setDynamicInfo(item, 'string', 'i-love-u', attributify);
      break;
    case '{nxl}':
      this.setDynamicInfo(item, 'nxl', '9xl', attributify);
      break;
    case '{var}':
      this.setDynamicInfo(item, 'var', 'forever-and-ever', attributify);
      break;
    }
  }

  setDynamicInfo(item: CompletionItem, type: string, example: string, attributify = false) {
    const regex = new RegExp(`{${type}}$`);
    item.documentation = buildStyle(attributify? this.processor.attributify({ [item.detail ?? ''] : [ item.label.replace(regex, example) ] }).styleSheet : this.processor.interpret(item.label.replace(regex, example)).styleSheet);
    item.detail = `type.${type}(${example})`;
    item.insertText = new SnippetString(item.label.replace(regex, `\${1:${example}}`));
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
