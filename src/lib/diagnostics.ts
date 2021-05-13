import { window, workspace, Range, Diagnostic, DiagnosticSeverity, languages } from 'vscode';
import type { ExtensionContext, TextEditor,TextDocument, TextLine } from 'vscode';
export function registerDiagnostics(ctx: ExtensionContext): void {
  let word = '@apply'
  const diagCollection = languages.createDiagnosticCollection("windi");

  if (window.activeTextEditor) {
    _update(window.activeTextEditor.document)
  }
  ctx.subscriptions.push(diagCollection)
  ctx.subscriptions.push(window.onDidChangeActiveTextEditor(
  (e: TextEditor | undefined) => {
      if (e !== undefined) {
          _update(e.document)
      }
  }));



  function _update(doc: TextDocument) {
    const diagnostics: Diagnostic[] = [];
    for (let lineIndex = 0; lineIndex < doc.lineCount; lineIndex++) {
      const lineOfText = doc.lineAt(lineIndex);
      if (lineOfText.text.includes( word)) {
        diagnostics.push(_createDiagnostic(doc, lineOfText, lineIndex));
      }
    }
    diagCollection.set(doc.uri, diagnostics);
  }

  function _createDiagnostic(doc: TextDocument, lineOfText: TextLine, lineIndex: number) {
    // find where in the line of thet the 'emoji' is mentioned
    const startIndex = lineOfText.text.indexOf(word);

    // create range that represents, where in the document the word is
    const range = new Range(lineIndex, startIndex, lineIndex, startIndex + word.length);
    const diagnostic = new Diagnostic(range, 'When you use @apply it has to use valid windi css class', DiagnosticSeverity.Error);
    diagnostic.code = 'apply_mention';
    return diagnostic;
  }
}
