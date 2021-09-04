import { Range, Hover, Position, languages } from 'vscode';
import { buildStyle } from '../utils/helpers';
import { applyRegex } from '../utils/filetypes';
import type Extension from './index';
import type { DocumentSelector } from 'vscode';
import type { Processor } from 'windicss/lib';

export default class Hovers {
  extension: Extension;
  processor: Processor;
  constructor(extension: Extension, processor: Processor) {
    this.extension = extension;
    this.processor = processor;
  }

  register(ext: DocumentSelector) {
    return languages.registerHoverProvider(ext, {
      provideHover: (document, position) => {
        const range = document.getWordRangeAtPosition(position, /[^\s();{}'"=`]+/);
        const word = document.getText(range);
        if (!range || !word) return;

        // hover class or className, e.g. class= className=
        if (['class', 'className'].includes(word)) {
          const text = document.getText(new Range(range.end, document.lineAt(document.lineCount-1).range.end));
          const match = text.match(/((?<=^=\s*["'])[^"']*(?=["']))|((?<=^=\s*)[^"'>\s]+)/);
          if (match) {
            const css = buildStyle(this.processor.interpret(match[0]).styleSheet);
            if (css) return new Hover(css, range);
          }
        }

        // hover attr, e.g. bg= sm:bg=
        if (this.extension.isAttr(word)) {
          const text = document.getText(new Range(range.end, document.lineAt(document.lineCount-1).range.end));
          const match = text.match(/((?<=^=\s*["'])[^"']*(?=["']))|((?<=^=\s*)[^"'>\s]+)/);
          if (match) {
            const css = buildStyle(this.processor.attributify({ [word] : match[0].trim().split(/\s/).filter(i => i) }).styleSheet);
            if (css) return new Hover(css, range);
          }
        }

        // hover attr value or class value, e.g. class="bg-red-500 ..."  bg="red-500 ..."
        const text = document.getText(new Range(new Position(0, 0), position));
        const key = text.match(/\S+(?=\s*(=|:)\s*["']?[^"']*$)/)?.[0] ?? '';
        const style = this.extension.isAttr(key) ? this.processor.attributify({ [key]: [ word ] }) : ['className', 'class'].includes(key) || text.match(applyRegex) ? this.processor.interpret(word) : undefined;
        if (style && style.ignored.length === 0) {
          const css = buildStyle(style.styleSheet);
          if (css) return new Hover(css, range);
        }
      },
    });
  }
}
