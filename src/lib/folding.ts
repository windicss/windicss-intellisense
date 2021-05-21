import { decorateWithLength, decorateWithCount, connectList, getConfig } from '../utils';

import { window } from 'vscode';
import type { TextEditor, DecorationOptions, TextEditorDecorationType } from 'vscode';

export default class CodeFolding {
  editor: TextEditor | undefined;
  prev_line: number;
  prev_count: number;
  decorations: { [key:number]: DecorationOptions[] } = {};
  placeholder: TextEditorDecorationType;
  constructor() {
    this.prev_line = 0;
    this.prev_count = 0;
    this.placeholder = window.createTextEditorDecorationType({
      textDecoration: 'none; display: none;',
    });
  }

  async create(editor?: TextEditor) {
    this.editor = editor ?? window.activeTextEditor;
    this.decorations = {};
    if (!this.editor) return;
    const document = this.editor.document;
    for (const index of Array.from(Array(document.lineCount).keys())) {
      if (getConfig('windicss.foldByLength')) {
        this.decorations[index] = await decorateWithLength(index, document.lineAt(index).text, getConfig('windicss.foldLength'), getConfig('windicss.hiddenTextColor'), getConfig('windicss.hiddenText'));
      } else {
        this.decorations[index] = await decorateWithCount(index, document.lineAt(index).text, getConfig('windicss.foldCount'), getConfig('windicss.hiddenTextColor'), getConfig('windicss.hiddenText'));
      }
    }
    this.prev_count = this.editor.document.lineCount;
    this.editor.setDecorations(this.placeholder, connectList(Object.values(this.decorations)));
  }

  async update(editor?: TextEditor) {
    if (!editor) return;
    this.editor = editor;
    const index = this.editor.document.lineAt(this.editor.selection.active).lineNumber;
    const count = this.editor.document.lineCount;
    if (Math.abs(count - this.prev_count) <= 1) {
      this.editor.setDecorations(this.placeholder, connectList(Object.values(this.decorations).filter((_, id) => id !== index)));
      if (this.prev_line) this.decorations[this.prev_line] = await decorateWithCount(this.prev_line, this.editor.document.lineAt(this.prev_line).text); // update prev focus line
    } else {
      this.create(editor);
    }
    this.prev_count = count;
    this.prev_line = index;
  }

  async remove() {
    this.editor = window.activeTextEditor;
    if (!this.editor) return;
    this.decorations = [];
    this.editor.setDecorations(this.placeholder, []);
  }
}
