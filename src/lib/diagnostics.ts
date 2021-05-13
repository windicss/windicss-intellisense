import { window, workspace, Range, Diagnostic, DiagnosticSeverity, languages } from 'vscode';
import type { ExtensionContext, TextEditor, TextDocument, TextLine } from 'vscode';
import { Processor } from 'windicss/lib';
export function registerDiagnostics(ctx: ExtensionContext): void {
  const diagCollection = languages.createDiagnosticCollection('windi');

  if (window.activeTextEditor) {
    _update(window.activeTextEditor.document);
  }
  ctx.subscriptions.push(diagCollection);
  ctx.subscriptions.push(window.onDidChangeActiveTextEditor(
    (editor) => {
      if (editor) {
        _update(editor.document);
      }
    }));
  ctx.subscriptions.push(
    workspace.onDidChangeTextDocument(editor => _update(editor.document))
  );
  ctx.subscriptions.push(
    workspace.onDidCloseTextDocument(doc => diagCollection.delete(doc.uri))
  );


  function _update(doc: TextDocument) {
    const diagnostics: Diagnostic[] = [];
    for (let lineIndex = 0; lineIndex < doc.lineCount; lineIndex++) {
      const lineOfText = doc.lineAt(lineIndex);
      const seperator = '@apply:';
      if (lineOfText.text.includes(seperator)) {
        const diag = _createDiagnostic(
          doc,
          lineOfText,
          lineIndex,
          seperator,
          DiagnosticSeverity.Error,
          'When you use @apply, seperator is not supported.',
          'windi_unsupported-seperator'
        );
        if (diag !== undefined) {
          diagnostics.push(diag);
        }
      } else if (lineOfText.text.match(/(?<=@apply )(.*)(?=;)/)){
        let match = lineOfText.text.match(/(?<=@apply )(.*)(?=;)/)?.[0];
        if (match) {
          const p = new Processor();
          match = match.replace(/ {2,}/gi, ' ');
          const classes = match.split(' ');
          for (let index = 0; index < classes.length; index++) {
            const c = classes[index];
            const check = p.extract(c);
            if (check !== undefined) {

            } else {
              const diag = _createDiagnostic(
                doc,
                lineOfText,
                lineIndex,
                c,
                DiagnosticSeverity.Error,
                `${c} is not valid windi css class`,
                'windi_invalid-class'
              );
              if (diag !== undefined) {
                diagnostics.push(diag);
              }
            }
          }
        }
      }
    }
    diagCollection.set(doc.uri, diagnostics);
  }

  function _createDiagnostic(doc: TextDocument, lineOfText: TextLine, lineIndex: number, word: string, severity: DiagnosticSeverity, description: string, code: string) {
    // find where in the line of thet the 'emoji' is mentioned
    const startIndex = lineOfText.text.indexOf(word);
    // create range that represents, where in the document the word is
    const range = new Range(lineIndex, startIndex, lineIndex, startIndex + word.length);
    const diagnostic = new Diagnostic(range, description, severity);
    diagnostic.code = code;
    return diagnostic;
  }

}
