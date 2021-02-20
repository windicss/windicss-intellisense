import type { Processor } from "windicss/lib";
import type { MarkdownString } from "vscode";

export type DictStr = { [key: string]: string };

export type DeepNestDictStr = { [key:string]: string | DeepNestDictStr };

export interface Generator {
  processor?: Processor,
  colors: DictStr,
  variants: {
    label: string;
    documentation: MarkdownString | undefined;
  }[],
  staticUtilities: string[],
  colorsUtilities: {
    label: string;
    detail: string;
    documentation: string;
  }[],
  dynamicUtilities: {
    label: string;
    position: number;
  }[];
}