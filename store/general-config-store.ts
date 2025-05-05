import { defineStore } from 'pinia';

import { MeasureNames } from '~/types';
import { GeneralConfigStoreState } from '~/types/store/general-config-store';

export const useGeneralConfigStore = defineStore('generalConfig', {
  state: (): GeneralConfigStoreState => ({
    selectedMeasure: MeasureNames.PM25
  }),
  actions: {
    setSelectedMeasure(measure: MeasureNames) {
      this.selectedMeasure = measure;
    }
  }
});
