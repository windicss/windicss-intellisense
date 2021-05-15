import type { ExtensionContext, TextDocument, TextLine } from 'vscode';
import { Diagnostic, DiagnosticSeverity, languages, Range, window, workspace } from 'vscode';
import type { Core } from '../interfaces';
export function registerDiagnostics(ctx: ExtensionContext,  core: Core): void {
  const diagCollection = languages.createDiagnosticCollection('windi');

  if (core.processor !== undefined) {
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
  } else {

  }


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
          const p = core.processor;
          match = match.replace(/ {2,}/gi, ' ');
          const classes = match.split(' ');
          for (let index = 0; index < classes.length; index++) {
            let c = classes[index];
            c = c.replace('!', '');
            if (c == 'important') break;
            const check = p.extract(c);
            if (check === undefined) {
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
