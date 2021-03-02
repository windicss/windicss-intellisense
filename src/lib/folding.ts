import { decorateWithLength, decorateWithCount, connectList, getConfig } from '../utils';
import { window, workspace } from 'vscode';
import type { TextEditor, ExtensionContext, DecorationOptions } from 'vscode';

export function registerCodeFolding(ctx: ExtensionContext): void {
  let EDITOR: TextEditor | undefined;

  let DECORATIONS: { [key:number]: DecorationOptions[] } = {};

  let PREVFOCUSLINE = 0;
  let PREVCOUNT = 0;

  const HIDETEXT = window.createTextEditorDecorationType({
    textDecoration: 'none; display: none;',
  });

  async function _createDecorations(editor?: TextEditor) {
    EDITOR = editor ?? window.activeTextEditor;
    DECORATIONS = {};
    if (!EDITOR) return;
    const document = EDITOR.document;
    for (const index of Array.from(Array(document.lineCount).keys())) {
      if (getConfig('windicss.foldByLength')) {
        DECORATIONS[index] = await decorateWithLength(index, document.lineAt(index).text, getConfig('windicss.foldLength'), getConfig('windicss.hiddenTextColor'), getConfig('windicss.hiddenText'));
      } else {
        DECORATIONS[index] = await decorateWithCount(index, document.lineAt(index).text, getConfig('windicss.foldCount'), getConfig('windicss.hiddenTextColor'), getConfig('windicss.hiddenText'));
      }
    }
    PREVCOUNT = EDITOR.document.lineCount;
    EDITOR.setDecorations(HIDETEXT, connectList(Object.values(DECORATIONS)));
  }

  async function _updateDecorations(editor: TextEditor) {
    EDITOR = editor;
    const index = EDITOR.document.lineAt(EDITOR.selection.active).lineNumber;
    const count = EDITOR.document.lineCount;
    if (Math.abs(count - PREVCOUNT) <= 1) {
      EDITOR.setDecorations(HIDETEXT, connectList(Object.values(DECORATIONS).filter((_, id) => id !== index)));
      if (PREVFOCUSLINE) DECORATIONS[PREVFOCUSLINE] = await decorateWithCount(PREVFOCUSLINE, EDITOR.document.lineAt(PREVFOCUSLINE).text); // update prev focus line
    } else {
      _createDecorations(editor);
    }
    PREVCOUNT = count;
    PREVFOCUSLINE = index;
  }

  async function _removeDecorations() {
    EDITOR = window.activeTextEditor;
    if (!EDITOR) return;
    DECORATIONS = [];
    EDITOR.setDecorations(HIDETEXT, []);
  }

  if (!getConfig('windicss.enableCodeFolding')) return;

  window.visibleTextEditors.forEach(editor => {
    _createDecorations(editor);
  });

  window.onDidChangeTextEditorSelection(() => {
    const editor = window.activeTextEditor;
    if (editor) _updateDecorations(editor);
  });

  workspace.onDidChangeTextDocument(e => {
    if (window.activeTextEditor && e.document === window.activeTextEditor.document)
      _updateDecorations(window.activeTextEditor);
  }, null, ctx.subscriptions);

  window.onDidChangeActiveTextEditor(() => {
    _createDecorations();
  }, null, ctx.subscriptions);

  window.onDidChangeVisibleTextEditors(() => {
    const editor = window.activeTextEditor;
    if (editor) _updateDecorations(editor);
  });

  workspace.onDidChangeConfiguration(() => {
    if (getConfig('windicss.enableCodeFolding') as boolean) {
      _createDecorations();
    } else {
      _removeDecorations();
    }
  }, null, ctx.subscriptions);
}
