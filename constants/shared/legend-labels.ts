import { MeasureNames } from '~/types';

export const PM25_LEGEND_LABELS = [
  'Good',
  'Moderate',
  'Unhealthy Sensitive Groups',
  'Unhealthy',
  'Very Unhealthy',
  'Hazardous'
];

export const RCO2_LEGEND_LABELS = [
  'Excellent',
  'Acceptable',
  'Not Ideal',
  'To be Avoided',
  'Unhealthy',
  'Very Unhealthy'
];

export function getLegendLabels(measure: MeasureNames) {
  switch (measure) {
    case MeasureNames.PM25:
      return PM25_LEGEND_LABELS;
    case MeasureNames.CO2:
      return RCO2_LEGEND_LABELS;
    default:
      return [];
  }
}
