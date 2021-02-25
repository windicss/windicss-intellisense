import type { Processor } from "windicss/lib";
import type { MarkdownString } from "vscode";

export type DictStr = { [key: string]: string };

export type DeepNestDictStr = { [key:string]: string | DeepNestDictStr };

export interface Core {
  processor?: Processor,
  colors: DictStr,
  variantCompletions: {
    label: string;
    documentation: MarkdownString | undefined;
  }[],
  staticCompletions: string[],
  colorCompletions: {
    label: string;
    detail: string;
    documentation: string;
  }[],
  dynamicCompletions: {
    label: string;
    position: number;
  }[];
}