import { window, workspace, Range, Diagnostic, DiagnosticSeverity, languages } from 'vscode';
import type { ExtensionContext, TextEditor, TextDocument, TextLine } from 'vscode';
import { Processor } from "windicss/lib";
export function registerDiagnostics(ctx: ExtensionContext): void {
  const word = '@apply';
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
      if (lineOfText.text.includes( word)) {
        let diag = _createDiagnostic(doc, lineOfText, lineIndex)
        if (diag !== undefined) {
          let tmp = diag
          diagnostics.push(tmp);
        }
      }
    }
    diagCollection.set(doc.uri, diagnostics);
  }

  function _createDiagnostic(doc: TextDocument, lineOfText: TextLine, lineIndex: number) {
    // find where in the line of thet the 'emoji' is mentioned
    let seperator = "apply:"
    if (lineOfText.text.includes(seperator)) {
      const startIndex = lineOfText.text.indexOf(seperator);
      // create range that represents, where in the document the word is
      const range = new Range(lineIndex, startIndex, lineIndex, startIndex + seperator.length);
      const diagnostic = new Diagnostic(range, 'When you use @apply, seperator is not supported.', DiagnosticSeverity.Error);
      diagnostic.code = 'apply_seperator';
      return diagnostic;
    } else if (lineOfText.text.match(/(?<=@apply )(.*)(?=;)/)){
      let match = lineOfText.text.match(/(?<=@apply )(.*)(?=;)/)?.[0]
      if (match) {
        let p = new Processor()
        match = match.replace(/ {2,}/gi, " ")
        let classes = match.split(" ")
        for (let index = 0; index < classes.length; index++) {
          const c = classes[index];
          let check = p.extract(c)
          if (check !== undefined) {

          } else {
            const startIndex = lineOfText.text.indexOf(c);

            // create range that represents, where in the document the word is
            const range = new Range(lineIndex, startIndex, lineIndex, startIndex + c.length);
            const diagnostic = new Diagnostic(range, `${c} is not valid windi css class`, DiagnosticSeverity.Error);
            diagnostic.code = 'apply_mention';
            return diagnostic;
          }
        }
      }
    } else {
      return undefined
    }
  }

}
