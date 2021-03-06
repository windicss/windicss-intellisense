import { commands, Range, Position } from 'vscode';
import { HTMLParser } from '../utils/parser';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { StyleSheet } from 'windicss/utils/style';
import { workspace } from 'vscode';
import type { ExtensionContext } from 'vscode';
import type { Core } from '../interfaces';
import { getConfig, sortClassNames, toggleConfig } from '../utils';

export function registerCommands(ctx: ExtensionContext, core: Core): void {
  ctx.subscriptions.push(
    commands.registerTextEditorCommand('windicss.interpret', (textEditor, textEdit) => {
      if (!core.processor) return;
      const text = textEditor.document.getText();
      const parser = new HTMLParser(text);
      const preflights = core.processor.preflight(text);
      const utilities = core.processor.interpret(parser.parseClasses().map(i => i.result).join(' ')).styleSheet;
      writeFileSync(join(dirname(textEditor.document.uri.fsPath), 'windi.css'), [preflights.build(), utilities.build()].join('\n'));
    })
  );

  ctx.subscriptions.push(
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

      const utilities =  outputCSS.reduce((previousValue, currentValue) => previousValue.extend(currentValue), new StyleSheet()).combine();
      textEdit.replace(new Range(new Position(0, 0), textEditor.document.lineAt(textEditor.document.lineCount-1).range.end), outputHTML.join(''));
      writeFileSync(join(dirname(textEditor.document.uri.fsPath), 'windi.css'), [preflights.build(), utilities.build()].join('\n'));
    })
  );

  ctx.subscriptions.push(
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
  if(getConfig('windicss.sortOnSave')) {
    ctx.subscriptions.push(
      workspace.onWillSaveTextDocument((_e) => {
        commands.executeCommand('windicss.sort');
      })
    );
  }

  ctx.subscriptions.push(
    commands.registerCommand('windicss.toggle-folding', () => toggleConfig('windicss.enableCodeFolding'))
  );

  ctx.subscriptions.push(
    commands.registerCommand('windicss.toggle-decorators', () => {
      toggleConfig('windicss.enableColorDecorators');
    })
  );

  ctx.subscriptions.push(
    commands.registerCommand('windicss.toggle-preview', () => {
      toggleConfig('windicss.enableHoverPreview');
    })
  );

  ctx.subscriptions.push(
    commands.registerCommand('windicss.toggle-completion', () => {
      toggleConfig('windicss.enableCodeCompletion');
    })
  );

  ctx.subscriptions.push(
    commands.registerCommand('windicss.toggle-dynamic-completion', () => {
      toggleConfig('enableDynamicCompletion');
    })
  );
}
