import { Diagnostic, DiagnosticSeverity, languages, Range, window, workspace } from 'vscode';

import type { Core } from '../interfaces';
import type { Disposable, ExtensionContext, TextDocument, TextLine } from 'vscode';

export function registerDiagnostics(ctx: ExtensionContext,  core: Core): Disposable[] | [] {
  const diagCollection = languages.createDiagnosticCollection('windi');

  if (core.processor !== undefined) {
    if (window.activeTextEditor) _update(window.activeTextEditor.document);
    return [
      diagCollection,
      window.onDidChangeActiveTextEditor(
        editor => {
          if (editor) _update(editor.document);
        }),
      workspace.onDidChangeTextDocument(editor => _update(editor.document)),
      workspace.onDidCloseTextDocument(doc => diagCollection.delete(doc.uri)),
    ];
  } else {
    console.log('todo');
    return [];
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
      } else {
        const p = core.processor;
        const match = lineOfText.text.match(/(?<=[^/*]\s@apply\s*)\S(.*)(?=\s*;)/);
        if (match && match.index && p) {
          const utilities = match[0].replace(/!important$/, '');
          for (const utility of p.validate(utilities).ignored) {
            const range = new Range(lineIndex, match.index + utility.start, lineIndex, match.index + utility.end);
            const diagnostic = new Diagnostic(range, `${utility.className} is not valid windi css class`, DiagnosticSeverity.Error);
            diagnostic.code = 'windi_invalid-class';
            diagnostics.push(diagnostic);
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
