import type { DynamicUtility } from 'windicss/types/interfaces';
import type { Style } from 'windicss/types/utils/style';
import type { Processor } from "windicss/lib";

export interface Generator {
  processor?: Processor,
  colors: {
    [key:string]: string
  },
  variants: {
    [key: string]: () => Style;
  },
  staticUtilities: {
    [key: string]: Style[];
  },
  dynamicUtilities: DynamicUtility;
}
