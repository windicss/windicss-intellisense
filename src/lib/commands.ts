import { commands, Range, Position, workspace, ViewColumn, window, Uri } from 'vscode';
import { writeFileSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { StyleSheet } from 'windicss/utils/style';

import { Log } from '../utils/console';
import { HTMLParser } from '../utils/parser';
import { combineSeparators, getAllSeparators, sortClassNames } from '../utils';
import { toggleConfig } from '../utils/helpers';

import type { Processor } from 'windicss/lib';
import type { ExtensionContext } from 'vscode';

export default class Commands {
  processor?: Processor;

  constructor(processor?: Processor) {
    this.processor = processor;
  }

  register(ctx: ExtensionContext) {
    return [
      this.interpret(),
      this.compile(),
      this.sort(),
      this.toggleFolding(),
      this.toggleDecorators(),
      this.togglePreview(),
      this.toggleCompletion(),
      this.toggleDynamicCompletion(),
      this.runAnalysis(ctx),
    ];
  }

  interpret() {
    return commands.registerTextEditorCommand('windicss.interpret', (textEditor) => {
      if (!this.processor) return;
      const text = textEditor.document.getText();
      const parser = new HTMLParser(text);
      const preflights = this.processor.preflight(text);
      const utilities = this.processor.interpret(parser.parseClasses().map(i => i.result).join(' ')).styleSheet;
      writeFileSync(join(dirname(textEditor.document.uri.fsPath), 'windi.css'), [preflights.build(), utilities.build()].join('\n'));
    });
  }

  compile() {
    return commands.registerTextEditorCommand('windicss.compile', (textEditor, textEdit) => {
      if (!this.processor) return;
      const text = textEditor.document.getText();
      const parser = new HTMLParser(text);
      const preflights = this.processor.preflight(text);
      const outputHTML: string[] = [];
      const outputCSS: StyleSheet[] = [];

      let indexStart = 0;

      for (const p of parser.parseClasses()) {
        outputHTML.push(text.substring(indexStart, p.start));
        const result = this.processor.compile(p.result, 'windi-', true);
        outputCSS.push(result.styleSheet);
        outputHTML.push([result.className, ...result.ignored].join(' '));
        indexStart = p.end;
      }
      outputHTML.push(text.substring(indexStart));

      const utilities = outputCSS.reduce((previousValue, currentValue) => previousValue.extend(currentValue), new StyleSheet()).combine();
      textEdit.replace(new Range(new Position(0, 0), textEditor.document.lineAt(textEditor.document.lineCount - 1).range.end), outputHTML.join(''));
      writeFileSync(join(dirname(textEditor.document.uri.fsPath), 'windi.css'), [preflights.build(), utilities.build()].join('\n'));
    });
  }

  sort() {
    return commands.registerTextEditorCommand('windicss.sort', (textEditor, textEdit) => {
      const text = textEditor.document.getText();
      const parser = new HTMLParser(text);

      const classes = parser.parseClasses();
      const variants = Object.keys(this.processor?.resolveVariants() ?? {});
      const variantsMap = Object.assign({}, ...variants.map((value, index) => ({ [value]: index + 1 })));

      for (const p of classes) {
        const sortedP = sortClassNames(p.result, variantsMap);
        const separators = getAllSeparators(p.result);
        const toReplace = combineSeparators(separators, sortedP);
        textEdit.replace(new Range(textEditor.document.positionAt(p.start), textEditor.document.positionAt(p.end)), toReplace);
      }
    });
  }

  sortOnSave() {
    return workspace.onWillSaveTextDocument(() => {
      commands.executeCommand('windicss.sort');
    });
  }

  toggleFolding() {
    return commands.registerCommand('windicss.toggle-folding', () => toggleConfig('windicss.enableCodeFolding'));
  }

  toggleDecorators() {
    return commands.registerCommand('windicss.toggle-decorators', () => {
      toggleConfig('windicss.enableColorDecorators');
    });
  }

  togglePreview() {
    return commands.registerCommand('windicss.toggle-preview', () => {
      toggleConfig('windicss.enableHoverPreview');
    });
  }

  toggleCompletion() {
    return commands.registerCommand('windicss.toggle-completion', () => {
      toggleConfig('windicss.enableCodeCompletion');
    });
  }

  toggleDynamicCompletion() {
    return commands.registerCommand('windicss.toggle-dynamic-completion', () => {
      toggleConfig('enableDynamicCompletion');
    });
  }

  runAnalysis(ctx: ExtensionContext) {
    return commands.registerCommand('windicss.run-analysis', async () => {
      try {
        const panel = window.createWebviewPanel(
          'windicss', // Identifies the type of the webview. Used internally
          'WindiCSS Analysis', // Title of the panel displayed to the user
          ViewColumn.Two, // Editor column to show the new webview panel in.
          {
            enableScripts: true,
            retainContextWhenHidden: true,
          }
        );
        const runAnalysis = require('./dependencies.js').runAnalysis;
        const { result } = await runAnalysis(
          {
            root: workspace.workspaceFolders?.[0].uri.fsPath,
          },
          { interpretUtilities: true },
        );

        // CHECK VSCode Theme Color
        let isDark = true;
        const theme = workspace.getConfiguration()
          .get('workbench.colorTheme', '');

        // must be dark
        if (theme.match(/dark|black/i) != null) {
          isDark = true;
        }
        // must be light
        if (theme.match(/light/i) != null) {
          isDark = false;
        }
        // HTML INJECTION
        const analyzerPath = join(ctx.extensionPath, 'out/analyzer');
        const htmlPath = join(analyzerPath, 'index.html');
        let html = readFileSync(htmlPath, 'utf-8').toString();
        const headScript = `
        localStorage.setItem('vueuse-color-scheme', ${isDark ? '"dark"' : '"light"'});
        window.__windicss_analysis_static = true;
        window.__windicss_analysis_report = ${JSON.stringify(result)}
        `;
        html = html.replace('<head>', `<head><script>${headScript}</script>`);
        html = html.replace(
          /(src|href)="([^h]*?)"/g,
          (_, tag, url) => `${tag}="${panel.webview.asWebviewUri(Uri.file(join(analyzerPath, url.slice(1))))}"`,
        );
        panel.webview.html = html;
        // console.log(html)
      } catch (error) {
        Log.warning(error);
      }
    });
  }

}
