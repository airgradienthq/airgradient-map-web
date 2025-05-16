import { ChartOptions } from 'chart.js';
import { AnnotationOptions } from 'chartjs-plugin-annotation';
import { CHART_MIN_VISIBLE_VALUE } from '~/constants/shared/chart-min-visible-value';
import { MEASURE_LABELS_WITH_UNITS } from '~/constants/shared/measure-labels';
import { useGeneralConfigStore } from '~/store/general-config-store';

import { MeasureNames } from '~/types';
import { getChartFontSize } from '~/utils';

interface UseChartjsOptionsParams {
  measure: MeasureNames;
  animated: boolean;
  annotations: Record<string, AnnotationOptions>;
}

export function useChartjsOptions({
  measure,
  animated,
  annotations
}: UseChartjsOptionsParams): ChartOptions<'bar'> {
  const annotationsFontSize = getChartFontSize(measure);
  const currentPeriod = useGeneralConfigStore().selectedHistoryPeriod;

  const axisLabel = MEASURE_LABELS_WITH_UNITS[measure];

  return {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: context => {
            let value = context.raw;
            if (value === CHART_MIN_VISIBLE_VALUE) value = 0;
            if (measure === MeasureNames.PM25) return `PM2.5: ${value} μg/m³`;
            if (measure === MeasureNames.PM_AQI) return `PM2.5: ${value} US AQI`;
            return `CO2: ${value} ppm`;
          }
        },
        titleFont: { family: '"Cabin", sans-serif' },
        bodyFont: { family: '"Catamaran", sans-serif' }
      },
      annotation: {
        annotations
      }
    },
    animation: {
      duration: animated ? 1000 : 0
    },
    scales: {
      x: {
        offset: false,
        display: true,
        type: 'time',
        ticks: {
          color: '#212121',
          font: {
            family: '"Catamaran", sans-serif',
            size: annotationsFontSize
          }
        },
        grid: {
          display: false,
          drawOnChartArea: false,
          drawTicks: false
        },
        time: {
          tooltipFormat: 'dd. MMM  HH:mm',
          unit: currentPeriod.chartUnit,
          displayFormats: {
            quarter: 'MMM YYYY'
          }
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: false,
          text: axisLabel
        },
        grid: {
          drawTicks: false,
          drawOnChartArea: false
        },
        ticks: {
          color: '#212121',
          font: {
            family: '"Catamaran", sans-serif',
            size: annotationsFontSize
          },
          padding: 3
        }
      }
    }
  };
}
