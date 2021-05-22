import Completions from './completions';
import Commands from './commands';
import Hovers from './hovers';
import CodeFolding from './folding';
import Diagnostics from './diagnostics';
import Decorations from './decorations';

import { resolve } from 'path';
import { Log } from '../utils/console';
import { getConfig, hex2RGB, flatColors } from '../utils';
import { allowAttr, fileTypes } from '../utils/filetypes';
import { Disposable, workspace, window, commands } from 'vscode';

import type { JITI } from 'jiti';
import type { Attr } from './completions';
import type { Processor } from 'windicss/lib';
import type { ExtensionContext, GlobPattern, Uri } from 'vscode';
import type { DictStr, ResolvedVariants, colorObject } from 'windicss/types/interfaces';

export default class Extension {
  jiti?: JITI;
  ctx: ExtensionContext;
  pattern: GlobPattern;
  processor: Processor | undefined;
  attrs: Attr;
  colors: DictStr;
  configFile?: string;
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

  init() {
    try {
      workspace.findFiles(this.pattern, '**​/node_modules/**').then(files => {
        const { jiti, Processor } = require('./dependencies.js');
        this.jiti = jiti(__filename);
        this.configFile = files[0] ? files[0].fsPath : undefined;
        this.processor = new Processor(this.loadConfig(this.configFile)) as Processor;
        this.variants = this.processor.resolveVariants();
        this.colors = flatColors(this.processor.theme('colors', {}) as colorObject);
        this.register();
      });
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

  loadConfig(file?: string) {
    if (!file || !this.jiti) return;
    const path = resolve(file);
    if (path in this.jiti.cache) delete this.jiti.cache[path];
    const exports = this.jiti(path);
    const config = exports.__esModule ? exports.default : exports;
    Log.info(`Loading Config File: ${file}`);
    return config;
  }

  update(uri?: Uri) {
    const { Processor } = require('./dependencies.js');
    this.disposables.forEach(i => i.dispose());
    this.disposables.length = 0;
    this.processor = new Processor(this.loadConfig(uri ? uri.fsPath : this.configFile)) as Processor;
    this.variants = this.processor.resolveVariants();
    this.colors = flatColors(this.processor.theme('colors', {}) as colorObject);
    this.register();
  }

  get<T>(key: string) {
    return getConfig<T>(`windicss.${key}`);
  }

  watch() {
    const watcher = workspace.createFileSystemWatcher(`**/${this.pattern}`);
    // Changes configuration should invalidate above cache
    watcher.onDidChange((e) => this.update(e));

    // This handles the case where the project didn't have config file
    // but was created after VS Code was initialized
    watcher.onDidCreate((e) => this.update(e));

    // If the config is deleted, utilities&variants should be regenerated
    watcher.onDidDelete((e) => this.update(e));

    // when change vscode configuration should regenerate disposables
    workspace.onDidChangeConfiguration(() => this.update(), null, this.ctx.subscriptions);
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
    // trigger suggestion when using raw html class completion with tab
    disposables.push(window.onDidChangeTextEditorSelection((e) => {
      if (e.kind === undefined) {
        if(['class=""', 'className=""'].includes(e.textEditor.document.getText(e.textEditor.document.getWordRangeAtPosition(e.textEditor.selection.active, /[\w"=]+/)))) {
          commands.executeCommand('editor.action.triggerSuggest');
        }
      }
    }));
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
