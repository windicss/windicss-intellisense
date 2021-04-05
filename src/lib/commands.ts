import { commands, Range, Position, workspace, ViewColumn, window, Uri } from 'vscode';
import { HTMLParser } from '../utils/parser';
import { writeFileSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { StyleSheet } from 'windicss/utils/style';
import { Log } from '../utils/Log';
import { getConfig, sortClassNames, toggleConfig } from '../utils';
import { runAnalysis } from 'windicss-analysis';
import type { ExtensionContext, Disposable } from 'vscode';
import type { Core } from '../interfaces';

const DISPOSABLES: Disposable[] = [];
let initialized = false;

export function registerCommands(ctx: ExtensionContext, core: Core): Disposable[] {
  function createDisposables() {
    const disposables: Disposable[] = [];
    disposables.push(
      commands.registerTextEditorCommand('windicss.interpret', (textEditor, textEdit) => {
        if (!core.processor) return;
        const text = textEditor.document.getText();
        const parser = new HTMLParser(text);
        const preflights = core.processor.preflight(text);
        const utilities = core.processor.interpret(parser.parseClasses().map(i => i.result).join(' ')).styleSheet;
        writeFileSync(join(dirname(textEditor.document.uri.fsPath), 'windi.css'), [preflights.build(), utilities.build()].join('\n'));
      })
    );

    disposables.push(
      commands.registerTextEditorCommand('windicss.compile', (textEditor, textEdit) => {
        if (!core.processor) return;
        const text = textEditor.document.getText();
        const parser = new HTMLParser(text);
        const preflights = core.processor.preflight(text);
        const outputHTML: string[] = [];
        const outputCSS: StyleSheet[] = [];

        let indexStart = 0;

        for (const p of parser.parseClasses()) {
          outputHTML.push(text.substring(indexStart, p.start));
          const result = core.processor.compile(p.result, 'windi-', true);
          outputCSS.push(result.styleSheet);
          outputHTML.push([result.className, ...result.ignored].join(' '));
          indexStart = p.end;
        }
        outputHTML.push(text.substring(indexStart));

        const utilities = outputCSS.reduce((previousValue, currentValue) => previousValue.extend(currentValue), new StyleSheet()).combine();
        textEdit.replace(new Range(new Position(0, 0), textEditor.document.lineAt(textEditor.document.lineCount - 1).range.end), outputHTML.join(''));
        writeFileSync(join(dirname(textEditor.document.uri.fsPath), 'windi.css'), [preflights.build(), utilities.build()].join('\n'));
      })
    );

    disposables.push(
      commands.registerTextEditorCommand('windicss.sort', (textEditor, textEdit) => {
        const text = textEditor.document.getText();
        const parser = new HTMLParser(text);

        const classes = parser.parseClasses();
        const variants = Object.keys(core.processor?.resolveVariants() ?? {});
        const variantsMap = Object.assign({}, ...variants.map((value, index) => ({ [value]: index + 1 })));

        for (const p of classes) {
          const sortedP = sortClassNames(p.result, variantsMap);
          textEdit.replace(new Range(textEditor.document.positionAt(p.start), textEditor.document.positionAt(p.end)), sortedP);
        }
      })
    );

    // if runOnSave is enabled in settings, trigger command on file save
    if (getConfig('windicss.sortOnSave')) {
      disposables.push(
        workspace.onWillSaveTextDocument((_e) => {
          commands.executeCommand('windicss.sort');
        })
      );
    }

    disposables.push(
      commands.registerCommand('windicss.toggle-folding', () => toggleConfig('windicss.enableCodeFolding'))
    );

    disposables.push(
      commands.registerCommand('windicss.toggle-decorators', () => {
        toggleConfig('windicss.enableColorDecorators');
      })
    );

    disposables.push(
      commands.registerCommand('windicss.toggle-preview', () => {
        toggleConfig('windicss.enableHoverPreview');
      })
    );

    disposables.push(
      commands.registerCommand('windicss.toggle-completion', () => {
        toggleConfig('windicss.enableCodeCompletion');
      })
    );

    disposables.push(
      commands.registerCommand('windicss.toggle-dynamic-completion', () => {
        toggleConfig('enableDynamicCompletion');
      })
    );

    disposables.push(
      commands.registerCommand('windicss.run-analysis', async () => {
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

          // let fileName = 'windicss-analysis-result.json'
          const { result } = await runAnalysis(
            {
              root: workspace.workspaceFolders![0].uri.fsPath,
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
          const htmlPath = join(ctx.extensionPath, 'node_modules/windicss-analysis/dist/app/index.html');
          let html = readFileSync(htmlPath, 'utf-8').toString();
          const headScript = `
          localStorage.setItem('vueuse-color-scheme', ${isDark ? '"dark"' : '"light"'});
          window.__windicss_analysis_static = true;
          window.__windicss_analysis_report = ${JSON.stringify(result)}
          `;
          html = html.replace('<head>', `<head><script>${headScript}</script>`);
          html = html.replace(
            /(src|href)="([^h]*?)"/g,
            (_, tag, url) => `${tag}="${panel.webview.asWebviewUri(Uri.file(join(ctx.extensionPath, 'node_modules/windicss-analysis/dist/app', url.slice(1))))}"`,
          );
          panel.webview.html = html;
          // console.log(html)
        } catch (error) {
          Log.error(error);
        }
      })
    );

    ctx.subscriptions.push(...DISPOSABLES);

    return disposables;
  }

  function init() {
    DISPOSABLES.forEach(i => i.dispose());
    DISPOSABLES.length = 0;
    DISPOSABLES.push(...(createDisposables() || []));
  }

  if (!initialized) {
    workspace.onDidChangeConfiguration(init, null, ctx.subscriptions);
    initialized = true;
  }

  init();

  return DISPOSABLES;
}
