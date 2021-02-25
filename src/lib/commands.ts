import { commands, Range, Position } from 'vscode';
import { HTMLParser } from '../utils/parser';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { StyleSheet } from 'windicss/utils/style';
import type { ExtensionContext } from 'vscode';
import type { Core } from '../interfaces';

export function registerCommands(ctx: ExtensionContext, core: Core): void {
  ctx.subscriptions.push(
    commands.registerTextEditorCommand("windicss.interpret", (textEditor, textEdit) => {
      if (!core.processor) return;
      const text = textEditor.document.getText();
      const parser = new HTMLParser(text);
      const preflights = core.processor.preflight(text);
      const utilities = core.processor.interpret(parser.parseClasses().map(i => i.result).join(' ')).styleSheet;
      writeFileSync(join(dirname(textEditor.document.uri.fsPath), 'windi.css'), [preflights.build(), utilities.build()].join('\n'));
    })
  );

  ctx.subscriptions.push(
    commands.registerTextEditorCommand("windicss.compile", (textEditor, textEdit) => {
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
    
  );
  
  // commands.registerTextEditorCommand("windicss.sort", (textEditor, textEdit) => {
  //   // console.log(textEditor.document.uri.fsPath);
  //   const document = textEditor.document;
  //   const text = document.getText();
  //   const parser = new HTMLParser(text);
  //   parser.parseClasses().forEach(({start, end, result}) => {
  //     // console.log(result);
  //     const utilities:string[] = [];
  //     const ignored:string[] = [];
  //     const ast = new ClassParser(result).parse();
  //     ast.forEach(obj => {
  //       if (obj.type === 'utility' && typeof obj.content === 'string') {
  //         utilities.push(obj.raw);
  //       } else if (obj.type === 'group') {

  //       } else {
  //         ignored.push(obj.raw);
  //       }
  //     })
  //     console.log(classes);
  //     textEdit.replace(new Range(document.positionAt(start), document.positionAt(end)), '234');
  //   });
  //   // textEditor.document.lineCount

  //   // textEdit.replace(new Range(new Position(0, 0), new Position(textEditor.document.lineCount, textEditor.document.)), '');
  //   // console.log(text);
  // });
}