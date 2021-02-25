import { window, DecorationOptions, ExtensionContext, workspace, Range, Position } from 'vscode';

export interface DecorationMatch extends DecorationOptions {
  key: string
}

// export function RegisterAnnotations(ctx: ExtensionContext) {
let OPEN = false;

// const HideTextDecoration = window.createTextEditorDecorationType({
//   textDecoration: 'none; opacity: 0.6 !important;',
// });
const HideTextDecoration = window.createTextEditorDecorationType({
  textDecoration: 'none; display: none;', // a hack to inject custom style
});

export const setDecorations = (): void => {
    // if (!getConfiguration().enableDecoration)
    // { return; }

    const editor = window.activeTextEditor;
    if (!editor) return;
    // const openEditors = window.visibleTextEditors;

    // openEditors.forEach( editor => {
        const ranges: Range[] = [];
        // getNotes().forEach( note => {
        //     if (note.fileName === editor.document.fileName) {
        //         const positionStart = new vscode.Position(note.positionStart.line, note.positionStart.character);
        //         const positionEnd = new vscode.Position(note.positionEnd.line, note.positionEnd.character);
        //         ranges.push(new vscode.Range(positionStart, positionEnd));
        //     }
        // });
        const item: DecorationMatch = {
          range: new Range(new Position(0, 0), new Position(0, 4)),
          renderOptions: {
            after: {
              color: '#06B6D4',
              contentText: 'sm:',
              // contentIconPath: '13232',
              // margin: `-3px 2px; transform: translate(-2px, 3px);`,
              // width: `4px`,
            },
          },
          hoverMessage: 'hello world',
          key: 'test'
        };
        // ranges.push();
        // editor.setDecorations(InlineIconDecoration, [item]);
        editor.setDecorations(HideTextDecoration, [item]);
        OPEN = true;
    // });
};

export function updateDecorations (context: ExtensionContext) {
    setDecorations();

    // workspace.onDidChangeTextDocument((event) => {
    //   const HideTextDecoration = window.createTextEditorDecorationType({
    //     textDecoration: 'none; opacity: 0.6 !important;',
    //   });
    //   const HideTextDecoration = window.createTextEditorDecorationType({
    //     textDecoration: 'none; display: none;', // a hack to inject custom style
    //   });
    //   window.activeTextEditor?.setDecorations(HideTextDecoration, []);
    //   window.activeTextEditor?.setDecorations(HideTextDecoration, []);
    // });

    // window.onDidChangeActiveTextEditor(editor => {
    //     if (editor) {
    //         setDecorations();
    //     }
    // }, null, context.subscriptions);
  
    window.onDidChangeTextEditorSelection((e) => {
      // if (OPEN) {
        // OPEN = false;
        // window.activeTextEditor?.setDecorations(HideTextDecoration, []);
        const editor = window.activeTextEditor;
        if (editor?.selection.active.line === 0) {
          window.activeTextEditor?.setDecorations(HideTextDecoration, []);
        } else {
          setDecorations();
        };
        // if (OPEN) {
        //   // decorations
        //   // .map(({ range }) => range)
        //   // .filter(i => i.start.line !== editor!.selection.start.line),
        //   if (editor?.selection.active.line === 0 && OPEN) {
        //     OPEN = false;
        //     window.activeTextEditor?.setDecorations(HideTextDecoration, []);
        //   }
        // } else {
        //   setDecorations();
        // }
      // } else {
        // OPEN = true;
        // window.activeTextEditor?.setDecorations(HideTextDecoration, []);
      // }
      // window.activeTextEditor?.setDecorations(HideTextDecoration, [item]);
    });

}