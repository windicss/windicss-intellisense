import type { DynamicUtility } from 'windicss/types/interfaces';
import type { Style } from 'windicss/types/utils/style';

export interface Generator {
  variants: {
    [key: string]: () => Style;
  };
  staticUtilities: {
    [key: string]: Style[];
  };
  dynamicUtilities: DynamicUtility;
}
