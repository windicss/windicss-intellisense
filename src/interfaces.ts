import type { Processor } from 'windicss/lib';
import type { ResolvedVariants } from 'windicss/types/interfaces';

export type DictStr = { [key: string]: string | string[] };

export type DeepNestDictStr = { [key:string]: string | DeepNestDictStr };

export interface Core {
  processor?: Processor,
  colors: DictStr,
  utilities: string[],
  variants: ResolvedVariants,
  staticCompletions: string[],
  colorCompletions: {
    label: string;
    documentation: string;
  }[],
  dynamicCompletions: {
    label: string;
    position: number;
  }[];
}
