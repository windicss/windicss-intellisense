import { commands } from 'vscode';
import type { ExtensionContext } from 'vscode';

export function registerCommands(ctx: ExtensionContext): void {
  ctx.subscriptions.push(
    commands.registerTextEditorCommand("windicss.interpret", (textEditor, textEdit) => {
      console.log(textEditor.document.uri.fsPath);
    })
  );

  ctx.subscriptions.push(
    commands.registerTextEditorCommand("windicss.compile", (textEditor, textEdit) => {
      console.log(textEditor.document.uri.fsPath);
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