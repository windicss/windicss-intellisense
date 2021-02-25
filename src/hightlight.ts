import { decorateVariants, connectList } from './utils';
import { window, workspace } from 'vscode';
import type { TextEditor, ExtensionContext, DecorationOptions } from 'vscode';

export function registerHighlight(ctx: ExtensionContext): void {
  let EDITOR: TextEditor | undefined;

  const HIDETEXT = window.createTextEditorDecorationType({
    textDecoration: 'none; display: none;',
  });

  const DECORATIONS: { [key:number]: DecorationOptions[] } = {};

  async function _createDecorations() {
    EDITOR = window.activeTextEditor;
    if (!EDITOR) return;
    const document = EDITOR.document;
    for (const index of Array.from(Array(document.lineCount).keys())) {
      DECORATIONS[index] = await decorateVariants(index, document.lineAt(index).text);
    }
    // console.log(Object.valuesDECORATIONS);
    EDITOR.setDecorations(HIDETEXT, connectList(Object.values(DECORATIONS)));
  }

  async function _updateDecorations(editor: TextEditor) {
    EDITOR = editor;
    const index = EDITOR.document.lineAt(EDITOR.selection.active).lineNumber;
    DECORATIONS[index] = await decorateVariants(index, EDITOR.document.lineAt(index).text);
    EDITOR.setDecorations(HIDETEXT, connectList(Object.values(DECORATIONS)));
  };

  _createDecorations();
  
  workspace.onDidChangeTextDocument((event) => {
    if (window.activeTextEditor && event.document === window.activeTextEditor.document)
      _updateDecorations(window.activeTextEditor);
  }, null, ctx.subscriptions);
}