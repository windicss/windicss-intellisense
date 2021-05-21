import { Diagnostic, DiagnosticSeverity, languages, Range, window, workspace } from 'vscode';

import type { Processor } from 'windicss/lib';
import type { TextDocument, TextLine, DiagnosticCollection } from 'vscode';

export default class Diagnostics {
  processor?: Processor;
  collection: DiagnosticCollection;
  constructor(processor?: Processor) {
    this.processor = processor;
    this.collection = languages.createDiagnosticCollection('windi');
  }

  register() {
    if (this.processor) {
      if (window.activeTextEditor) this.update(window.activeTextEditor.document);
      return [
        this.collection,
        window.onDidChangeActiveTextEditor(
          editor => {
            if (editor) this.update(editor.document);
          }),
        workspace.onDidChangeTextDocument(editor => this.update(editor.document)),
        workspace.onDidCloseTextDocument(doc => this.collection.delete(doc.uri)),
      ];
    }
    return [];
  }

  update(doc: TextDocument) {
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
        const match = lineOfText.text.match(/(?<=[^/*]\s@apply\s*)\S(.*)(?=\s*;)/);
        if (match && match.index && this.processor) {
          const utilities = match[0].replace(/!important$/, '');
          for (const utility of this.processor.validate(utilities).ignored) {
            const range = new Range(lineIndex, match.index + utility.start, lineIndex, match.index + utility.end);
            const diagnostic = new Diagnostic(range, `${utility.className} is not valid windi css class`, DiagnosticSeverity.Error);
            diagnostic.code = 'windi_invalid-class';
            diagnostics.push(diagnostic);
          }
        }
      }
    }
    this.collection.set(doc.uri, diagnostics);
  }
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
