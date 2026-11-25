import type { FormMap } from '../types';
import { dma6aMap } from './dma6a';
import { dma704Map } from './dma704';
import { dma706Map } from './dma706';
import { form94Map } from './form94';

export { CARE_FLAGS, dma6aMap } from './dma6a';
export { dma704Map } from './dma704';
export { dma706Map } from './dma706';
export { form94Map } from './form94';

export const FORM_MAPS: Record<string, FormMap> = {
  'form-94': form94Map,
  'dma-6a': dma6aMap,
  'dma-706': dma706Map,
  'dma-704': dma704Map,
};
