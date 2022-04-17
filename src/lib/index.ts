import Completions from './completions';
import Commands from './commands';
import Hovers from './hovers';
import CodeFolding from './folding';
import Diagnostics from './diagnostics';
import Decorations from './decorations';

import { resolve } from 'path';
import { Log } from '../utils/console';
import { hex2RGB, flatColors } from '../utils';
import { getConfig } from '../utils/helpers';
import { allowAttr, fileTypes } from '../utils/filetypes';
import { Disposable, workspace, window, commands } from 'vscode';
import { toRGBA } from 'windicss/utils';

import type { JITI } from 'jiti';
import type { Attr } from '../interfaces';
import { Processor } from 'windicss/lib';
import type { ExtensionContext, GlobPattern, Uri } from 'vscode';
import type {
  DictStr,
  ResolvedVariants,
  colorObject,
  Config,
} from 'windicss/types/interfaces';
import { loadConfig } from 'unconfig';

export default class Extension {
  jiti?: JITI;
  ctx: ExtensionContext;
  pattern: GlobPattern;
  processor: Processor | undefined;
  attrs: Attr['static'];
  colors: DictStr;
  attrPrefix?: string;
  configFile?: string;
  variants: ResolvedVariants;
  disposables: Disposable[];
  constructor(ctx: ExtensionContext, pattern: GlobPattern) {
    this.ctx = ctx;
    this.attrPrefix = undefined;
    this.pattern = pattern;
    this.colors = {};
    this.attrs = {};
    this.variants = {};
    this.disposables = [];
  }

  async init() {
    try {
      const config = await this.loadConfig();
      this.processor = new Processor(
        config
      ) as Processor;

      this.attrPrefix = this.processor.config('attributify.prefix') as
        | string
        | undefined;
      this.variants = this.processor.resolveVariants();
      this.colors = flatColors(
        this.processor.theme('colors', {}) as colorObject
      );
      this.register();
    } catch (error) {
      Log.error(error);
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

  async loadConfig(file?: string) {
    if(!workspace.workspaceFolders) return;
    const { config, sources } = await loadConfig<Config>({
      sources: [
        {
          files: 'windi.config',
          extensions: ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs'],
        },
        {
          files: 'tailwind.config',
          extensions: ['ts', 'mts', 'cts', 'js', 'mjs', 'cjs'],
        },
      ],
      merge: false,
      cwd: workspace.workspaceFolders[0].uri.fsPath,
    });
    Log.info(`Loading Config File: ${sources}`);
    return config;
  }

  async update(uri?: Uri) {
    const config = await this.loadConfig();
    this.disposables.forEach((i) => i.dispose());
    this.disposables.length = 0;
    this.processor = new Processor(
      config
    ) as Processor;
    this.variants = this.processor.resolveVariants();
    this.colors = flatColors(this.processor.theme('colors', {}) as colorObject);
    this.register();
  }

  get<T>(key: string) {
    return getConfig<T>(`windicss.${key}`);
  }

  watch() {
    const watcher = workspace.createFileSystemWatcher(this.pattern);

    // Changes configuration should invalidate above cache
    watcher.onDidChange(async (e) => {
      Log.info('Config File Changed, Reloading...');
      await this.update(e);
    });

    // This handles the case where the project didn't have config file
    // but was created after VS Code was initialized
    watcher.onDidCreate(async (e) => {
      Log.info('Found New Config File, Reloading...');
      this.configFile = e.fsPath;
      await this.update(e);
    });

    // If the config is deleted, utilities&variants should be regenerated
    watcher.onDidDelete(async (e) => {
      Log.info('Config File Deleted, Reloading...');
      this.configFile = undefined;
      await this.update();
    });

    // when change vscode configuration should regenerate disposables
    workspace.onDidChangeConfiguration(
      () => {
        Log.info('Global Configuration Changed, Reloading...');
        this.update();
      },
      null,
      this.ctx.subscriptions
    );
  }

  registerCommands() {
    const commands = new Commands(this.processor);
    const disposables = commands.register(this.ctx);
    if (this.get<boolean>('sortOnSave'))
      disposables.push(commands.sortOnSave());
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
    const disposables: Disposable[] = [];
    const config = {
      enableUtilty: this.get<boolean>('enableUtilityCompletion'),
      enableVariant: this.get<boolean>('enableVariantCompletion'),
      enableDynamic: this.get<boolean>('enableDynamicCompletion'),
      enableBracket: this.get<boolean>('enableBracketCompletion'),
      enableEmmet: this.get<boolean>('enableEmmetCompletion'),
      enableAttrUtility: this.get<boolean>('enableAttrUtilityCompletion'),
      enableAttrVariant: this.get<boolean>('enableAttrVariantCompletion'),
    };
    for (const [ext, { type, pattern }] of Object.entries(fileTypes)) {
      disposables.push(
        completions.registerUtilities(
          ext,
          type,
          pattern,
          config.enableUtilty,
          config.enableVariant,
          config.enableDynamic,
          config.enableBracket,
          config.enableEmmet
        )
      );
      allowAttr(type) &&
        disposables.push(
          completions.registerAttrKeys(
            ext,
            config.enableAttrUtility,
            config.enableAttrVariant
          )
        );
      allowAttr(type) &&
        disposables.push(
          completions.registerAttrValues(
            ext,
            config.enableAttrUtility,
            config.enableVariant,
            config.enableDynamic,
            config.enableBracket
          )
        );
    }
    // trigger suggestion when using raw html class completion with tab
    disposables.push(
      window.onDidChangeTextEditorSelection((e) => {
        if (e.kind === undefined) {
          if (
            ['class=""', 'className=""'].includes(
              e.textEditor.document.getText(
                e.textEditor.document.getWordRangeAtPosition(
                  e.textEditor.selection.active,
                  /[\w"=]+/
                )
              )
            )
          ) {
            commands.executeCommand('editor.action.triggerSuggest');
          }
        }
      })
    );
    return disposables;
  }

  registerCodeFolding() {
    if (!this.get<boolean>('enableCodeFolding')) return;
    const codeFolding = new CodeFolding();

    window.visibleTextEditors.forEach((editor) => codeFolding.create(editor));

    window.onDidChangeTextEditorSelection(() =>
      codeFolding.update(window.activeTextEditor)
    );

    workspace.onDidChangeTextDocument(
      (e) => {
        if (
          window.activeTextEditor &&
          e.document === window.activeTextEditor.document
        )
          codeFolding.update(window.activeTextEditor);
      },
      null,
      this.ctx.subscriptions
    );

    window.onDidChangeActiveTextEditor(
      () => {
        codeFolding.create();
      },
      null,
      this.ctx.subscriptions
    );

    window.onDidChangeVisibleTextEditors(() =>
      codeFolding.update(window.activeTextEditor)
    );

    workspace.onDidChangeConfiguration(
      () => {
        if (this.get<boolean>('enableCodeFolding')) {
          codeFolding.create();
        } else {
          codeFolding.remove();
        }
      },
      null,
      this.ctx.subscriptions
    );
  }

  registerDecorations() {
    if (!this.processor || !this.get<boolean>('enableColorDecorators'))
      return [];
    const disposables: Disposable[] = [];
    const type = this.get<'picker' | 'bg' | 'border' | 'cube'>(
      'colorDecoratorsType'
    );
    const decoration = new Decorations(this, this.processor);
    if (type === 'picker') {
      for (const [ext] of Object.entries(fileTypes)) {
        disposables.push(decoration.registerColorPicker(ext));
      }
    } else {
      let activeEditor = window.activeTextEditor;
      if (activeEditor) {
        decoration.registerColorBlock(activeEditor, type);
      }

      disposables.push(
        window.onDidChangeActiveTextEditor(
          (editor) => {
            activeEditor = editor;
            if (editor) {
              decoration.registerColorBlock(editor, type);
            }
          },
          null,
          this.ctx.subscriptions
        )
      );

      disposables.push(
        workspace.onDidChangeTextDocument(
          (event) => {
            if (activeEditor && event.document === activeEditor.document) {
              decoration.registerColorBlock(activeEditor, type);
            }
          },
          null,
          this.ctx.subscriptions
        )
      );
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
    return (
      (getConfig('windicss.enableAttrVariantCompletion') &&
        lastKey in this.variants) ||
      (getConfig('windicss.enableAttrUtilityCompletion') &&
        lastKey in this.attrs)
    );
  }

  isAttrVariant(word: string): boolean {
    if (this.attrPrefix) {
      if (!word.startsWith(this.attrPrefix)) return false;
      word = word.slice(this.attrPrefix.length);
    }
    const lastKey = word.match(/[^:-]+$/)?.[0] || word;
    return (
      getConfig('windicss.enableAttrVariantCompletion') &&
      lastKey in this.variants
    );
  }

  isAttrUtility(word?: string): string | undefined {
    if (!word) return;
    if (this.attrPrefix) {
      if (!word.startsWith(this.attrPrefix)) return;
      word = word.slice(this.attrPrefix.length);
    }
    const lastKey = word.match(/[^:-]+$/)?.[0] || word;
    return getConfig('windicss.enableAttrUtilityCompletion') &&
      lastKey in this.attrs
      ? lastKey
      : undefined;
  }

  isValidColor(utility: string, type = 'hex') {
    const sep = utility.search('/');
    if (sep !== -1) utility = utility.slice(0, sep);
    if (
      /hex-?(?:([\da-f]{3})[\da-f]?|([\da-f]{6})(?:[\da-f]{2})?)$/.test(utility)
    ) {
      const hex = utility.replace(/^\S*hex-/, '');
      return {
        color: (type === 'hex' ? hex2RGB : toRGBA)('#' + hex),
        key: 'hex-' + hex,
      };
    }
    for (const [key, value] of Object.entries(this.colors)) {
      if (utility.endsWith(key)) {
        return {
          color: (type === 'hex' ? hex2RGB : toRGBA)(
            Array.isArray(value) ? value[0] : value
          ),
          key,
        };
      }
    }
    return {};
  }
}
