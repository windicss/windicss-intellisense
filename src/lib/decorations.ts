import { languages, ColorInformation, Position, Range, Color, window } from 'vscode';
import { arrayEqual, rgb2Hex, hex2RGB } from '../utils';
import { ClassParser } from 'windicss/utils/parser';
import { HTMLParser } from '../utils/parser';

import type Extension from './index';
import type { TextDocument, DocumentSelector } from 'vscode';
import type { Processor } from 'windicss/lib';

export default class Decorations {
  extension: Extension;
  processor: Processor;
  constructor(extension: Extension, processor: Processor) {
    this.extension = extension;
    this.processor = processor;
  }

  register(ext: DocumentSelector) {
    return languages.registerColorProvider(ext, {
      // insert color before class
      provideDocumentColors: (document) => {
        const colors: ColorInformation[] = [];
        // try one time update instead of line
        const documentText = document.getText();
        const parser = new HTMLParser(documentText);
        parser.removeComments();
        for (const attr of parser.parseAttrs()) {
          if (this.extension.isAttrUtility(attr.key)) {
            // insert decoration in bg|text|... = "..."
            const regex = /\S+/igm;
            const data = attr.value.raw;
            let match;
            while ((match = regex.exec(data as string))) {
              if (match) {
                let color;
                if (match[0] in this.extension.colors) {
                  color = hex2RGB(this.extension.colors[match[0]] as string);
                } else if (match[0].startsWith('hex-')) {
                  color = hex2RGB(match[0].replace(/^hex-/, '#'));
                }
                if (color) colors.push(createColor(document, attr.value.start, match.index, color));
              }
            }
          } else if (['class', 'className'].includes(attr.key) || this.extension.isAttrVariant(attr.key)) {
            // insert decoration in class|className|sm|hover|... = "..."
            const elements = new ClassParser(attr.value.raw, this.processor.config('separator', ':') as string, Object.keys(this.extension.variants)).parse(false);
            for (const element of elements) {
              if (element.type === 'group' && Array.isArray(element.content)) {
                for (const e of element.content) {
                  const color = this.extension.isValidColor(e.raw);
                  if(color.color) colors.push(createColor(document, attr.value.start, e.start, color.color));
                }
              }
              const color = element.type === 'utility' && this.extension.isValidColor(element.raw);
              if(color && color.color) colors.push(createColor(document, attr.value.start, element.start, color.color));
            }
          }
        }

        // insert decoration in @apply ...
        for (const className of parser.parseApplies()) {
          const elements = new ClassParser(className.result, this.processor.config('separator', ':') as string, Object.keys(this.extension.variants)).parse(false);
          for (const element of elements) {
            if (element.type === 'group' && Array.isArray(element.content)) {
              for (const e of element.content) {
                const color = this.extension.isValidColor(e.raw);
                if(color && color.color) colors.push(createColor(document, className.start, e.start, color.color));
              }
            }
            const color = element.type === 'utility' && this.extension.isValidColor(element.raw);
            if(color && color.color) colors.push(createColor(document, className.start, element.start, color.color));
          }
        }

        return colors;
      },

      provideColorPresentations: (color, context) => {
        const editor = window.activeTextEditor;

        if (editor) {
          const document = editor.document;
          const range = context.document.getWordRangeAtPosition(context.range.end, /[@<:-\w]+/) as Range;
          const utility = document.getText(range);
          const vcolor = this.extension.isValidColor(utility);
          if (!arrayEqual(vcolor.color as number[], [color.red * 255, color.green * 255, color.blue * 255]) && range) {
            const vrange = new Range(new Position(range.start.line, range.start.character + utility.indexOf(vcolor.key as string)), range.end);
            editor.edit(editBuilder => {
              editBuilder.replace(vrange, `hex-${rgb2Hex(color.red, color.green, color.blue).slice(1,)}`);
            });
          }
        }

        return [];
      },
    });
  }
}

function createColor(document: TextDocument, start: number, offset: number, color: number[]) {
  return new ColorInformation(new Range(document.positionAt(start + offset), document.positionAt(start + offset + 1)), new Color(color[0]/255, color[1]/255, color[2]/255, 1));
}
