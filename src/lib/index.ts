import jiti from 'jiti';
import Completions from './completions';
import Commands from './commands';
import Hovers from './hovers';
import CodeFolding from './folding';
import Diagnostics from './diagnostics';
import Decorations from './decorations';

import { resolve } from 'path';
import { Processor } from 'windicss/lib';
import { Log } from '../utils/log';
import { getConfig, hex2RGB, flatColors } from '../utils';
import { allowAttr, fileTypes } from '../utils/filetypes';
import { Disposable, workspace, window } from 'vscode';

import type { Attr } from './completions';
import type { ExtensionContext, GlobPattern } from 'vscode';
import type { DictStr, ResolvedVariants, colorObject } from 'windicss/types/interfaces';

export default class Extension {
  _jiti = jiti(__filename);
  ctx: ExtensionContext;
  pattern: GlobPattern;
  processor: Processor | undefined;
  attrs: Attr;
  colors: DictStr;
  variants: ResolvedVariants;
  disposables: Disposable[];
  constructor(ctx: ExtensionContext, pattern: GlobPattern) {
    this.ctx = ctx;
    this.pattern = pattern;
    this.colors = {};
    this.attrs = { static: {}, color: {}, dynamic: {} };
    this.variants = {};
    this.disposables = [];
  }

  async init() {
    try {
      let config;
      const files = await workspace.findFiles(this.pattern, '**​/node_modules/**');
      if (files[0]) {
        const file = files[0].fsPath;
        const path = resolve(file);
        if (path in this._jiti.cache) delete this._jiti.cache[path];
        const exports = this._jiti(path);
        config = exports.__esModule ? exports.default : exports;
        Log.info(`Loading Config File: ${file}`);
      }
      this.processor = new Processor(config);
      this.variants = this.processor.resolveVariants();
      this.colors = flatColors(this.processor.theme('colors', {}) as colorObject);
      this.register();
    } catch (error) {
      Log.warning(error);
    }
  }

  register() {
    const disposables = [
      ...this.registerDecorations(),
      ...this.registerCompletions(),
      ...this.registerDiagnostics(),
      ...this.registerCommands(),
      ...this.registerHovers(),
    ];
    this.ctx.subscriptions.push(...disposables);
    this.disposables.push(...disposables);
  }

  async update() {
    this.disposables.forEach(i => i.dispose());
    this.disposables.length = 0;
    this.register();
  }

  get<T>(key: string) {
    return getConfig<T>(`windicss.${key}`);
  }

  watch() {
    const watcher = workspace.createFileSystemWatcher(this.pattern);
    // Changes configuration should invalidate above cache
    watcher.onDidChange(this.update);

    // This handles the case where the project didn't have config file
    // but was created after VS Code was initialized
    watcher.onDidCreate(this.update);

    // If the config is deleted, utilities&variants should be regenerated
    watcher.onDidDelete(this.update);

    // when change vscode configuration should regenerate disposables
    workspace.onDidChangeConfiguration(this.update, null, this.ctx.subscriptions);
  }

  registerCommands() {
    const commands = new Commands(this.processor);
    const disposables = commands.register(this.ctx);
    if (this.get<boolean>('sortOnSave')) disposables.push(commands.sortOnSave());
    return disposables;
  }

  registerDiagnostics() {
    const diagnostics = new Diagnostics(this.processor);
    const disposables = diagnostics.register();
    return disposables;
  }

  registerCompletions() {
    if (!this.processor) return [];
    const completions = new Completions(this, this.processor);
    this.attrs = completions.completions.attr;
    const disposables: Disposable[] = [];
    const config = {
      enableUtilty: this.get<boolean>('enableUtilityCompletion'),
      enableVariant: this.get<boolean>('enableVariantCompletion'),
      enableDynamic: this.get<boolean>('enableDynamicCompletion'),
      enableEmmet: this.get<boolean>('enableEmmetCompletion'),
      enableAttrUtility: this.get<boolean>('enableAttrUtilityCompletion'),
      enableAttrVariant: this.get<boolean>('enableAttrVariantCompletion'),
    };
    for (const [ext, { type, pattern }] of Object.entries(fileTypes)) {
      disposables.push(completions.registerUtilities(ext, type, pattern, config.enableUtilty, config.enableVariant, config.enableDynamic, config.enableEmmet));
      allowAttr(type) && disposables.push(completions.registerAttrKeys(ext, config.enableAttrUtility, config.enableAttrVariant));
      allowAttr(type) && disposables.push(completions.registerAttrValues(ext, config.enableAttrUtility, config.enableVariant, config.enableDynamic));
    }
    return disposables;
  }

  registerCodeFolding() {
    if (!this.get<boolean>('enableCodeFolding')) return;
    const codeFolding = new CodeFolding();

    window.visibleTextEditors.forEach(editor => codeFolding.create(editor));

    window.onDidChangeTextEditorSelection(() => codeFolding.update(window.activeTextEditor));

    workspace.onDidChangeTextDocument(e => {
      if (window.activeTextEditor && e.document === window.activeTextEditor.document)
        codeFolding.update(window.activeTextEditor);
    }, null, this.ctx.subscriptions);

    window.onDidChangeActiveTextEditor(() => {
      codeFolding.create();
    }, null, this.ctx.subscriptions);

    window.onDidChangeVisibleTextEditors(() => codeFolding.update(window.activeTextEditor));

    workspace.onDidChangeConfiguration(() => {
      if (this.get<boolean>('enableCodeFolding')) {
        codeFolding.create();
      } else {
        codeFolding.remove();
      }
    }, null, this.ctx.subscriptions);
  }

  registerDecorations() {
    if (!this.processor) return [];
    const disposables = [];
    const decoration = new Decorations(this, this.processor);
    for (const [ext] of Object.entries(fileTypes)) {
      disposables.push(decoration.register(ext));
    }
    return disposables;
  }

  registerHovers() {
    if (!this.processor) return [];
    const disposables = [];
    const decoration = new Hovers(this, this.processor);
    for (const [ext] of Object.entries(fileTypes)) {
      disposables.push(decoration.register(ext));
    }
    return disposables;
  }

  // utils
  isAttr(word: string): boolean {
    const lastKey = word.match(/[^:-]+$/)?.[0] || word;
    return (getConfig('windicss.enableAttrVariantCompletion') && lastKey in this.variants) || (getConfig('windicss.enableAttrUtilityCompletion') && lastKey in this.attrs);
  }

  isAttrVariant(word: string): boolean {
    const lastKey = word.match(/[^:-]+$/)?.[0] || word;
    return getConfig('windicss.enableAttrVariantCompletion') && lastKey in this.variants;
  }

  isAttrUtility(word?: string): string | undefined {
    if (!word) return;
    const lastKey = word.match(/[^:-]+$/)?.[0] || word;
    return getConfig('windicss.enableAttrUtilityCompletion') && lastKey in { ...this.attrs.static, ...this.attrs.color, ...this.attrs.dynamic } ? lastKey : undefined;
  }

  isValidColor(utility: string) {
    if (/hex-?(?:([\da-f]{3})[\da-f]?|([\da-f]{6})(?:[\da-f]{2})?)$/.test(utility)) {
      const hex = utility.replace(/^\S*hex-/, '');
      return { color: hex2RGB('#' + hex), key: 'hex-' + hex };
    }
    for (const [key, value] of Object.entries(this.colors)) {
      if (utility.endsWith(key)) {
        return { color: hex2RGB(Array.isArray(value) ? value[0] : value), key };
      }
    }
    return {};
  }
}
