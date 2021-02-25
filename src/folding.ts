
import { decorateWithLength, decorateWithCount, connectList } from './utils';
import { window, workspace, Range, Position } from 'vscode';
import type { TextEditor, ExtensionContext, DecorationOptions } from 'vscode';

export function registerCodeFolding(ctx: ExtensionContext): void {
  let EDITOR: TextEditor | undefined;

  let DECORATIONS: { [key:number]: DecorationOptions[] } = {};

  const HIDETEXT = window.createTextEditorDecorationType({
    textDecoration: 'none; display: none;',
  });

  async function _createDecorations(editor?: TextEditor) {
    EDITOR = editor ?? window.activeTextEditor;
    DECORATIONS = {};
    if (!EDITOR) return;
    const document = EDITOR.document;
    for (const index of Array.from(Array(document.lineCount).keys())) {
      DECORATIONS[index] = await decorateWithCount(index, document.lineAt(index).text);
      // DECORATIONS[index] = await decorateWithLength(index, document.lineAt(index).text);
    }
    EDITOR.setDecorations(HIDETEXT, connectList(Object.values(DECORATIONS)));
  }

  async function _updateDecorations(editor: TextEditor) {
    EDITOR = editor;
    const index = EDITOR.document.lineAt(EDITOR.selection.active).lineNumber;
    EDITOR.setDecorations(HIDETEXT, connectList(Object.values(DECORATIONS).filter((_, id) => id !== index)));
  };

  window.visibleTextEditors.forEach(editor => {
    _createDecorations(editor);
  });
  
  window.onDidChangeTextEditorSelection(e => {
    const editor = window.activeTextEditor;
    if (editor) _updateDecorations(editor);
  });

  workspace.onDidChangeTextDocument(e => {
    if (window.activeTextEditor && e.document === window.activeTextEditor.document)
      _createDecorations();
  }, null, ctx.subscriptions);

  window.onDidChangeActiveTextEditor(e => {
    _createDecorations();
  }, null, ctx.subscriptions);

  window.onDidChangeVisibleTextEditors(e => {
    const editor = window.activeTextEditor;
    if (editor) _updateDecorations(editor);
  });
}