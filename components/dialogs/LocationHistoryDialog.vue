Location
<template>
  <UiDialog
    :title="props.dialog?.data.location.locationName"
    :size="DialogSize.XL"
    :hideFooter="true"
    :dialog="props.dialog"
  >
    <template #header>
      <UiProgressBar :show="loading"></UiProgressBar>
      <v-card-title>
        <div class="d-flex align-center justify-center gap-2 gap-md-3 pl-2 py-2 pr-7 flex-wrap">
          <h5 class="m-0">{{ mapLocationData?.locationName }}</h5>
          <v-chip>
            {{
              mapLocationData?.sensorType === SensorType.reference ? 'Reference' : 'Small Sensor'
            }}</v-chip
          >
        </div>
      </v-card-title>
    </template>
    <template #body>
      <div style="height: 65px" class="chart-controls mb-5">
        <div>
          <div
            v-if="currentValueData"
            :style="{ backgroundColor: currentValueData.bgColor }"
            class="current-values py-2 px-3"
          >
            <div :class="currentValueData.textColor" class="main-current-value">
              <h4 :class="currentValueData.textColor" class="mb-2">
                {{ currentValueData.value }}
                <span class="unit-label">{{ currentValueData.unit }}</span>
              </h4>
              <p :class="currentValueData.textColor" class="mb-0 current-label">
                <span class="measure-label">
                  <UiHTMLSafelabel :label="currentValueData.labelHTML" />
                </span>
                {{ $formatDate(currentValueData.date, 'HH:mm,  MMM d') }}
              </p>
            </div>
          </div>
        </div>

        <UiDropdownControl
          v-if="chartOptions"
          class="period-control"
          :selected-value="generalConfigStore.selectedHistoryPeriod.value"
          :options="HISTORY_PERIODS"
          :disabled="loading"
          @change="handleChartPeriodChange"
        >
        </UiDropdownControl>
      </div>
      <ClientOnly>
        <div style="height: 350px; width: 100%">
          <Bar v-if="chartData && chartOptions" :data="chartData" :options="chartOptions" />
        </div>
      </ClientOnly>
      <div class="mt-4">
        <UiColorsLegend :size="ColorsLegendSize.SMALL" />
      </div>
      <p style="height: 20px" class="mb-0 mt-4">
        <small v-if="chartOptions && locationDetails?.ownerNameDisplay">
          Contributor:
          <span> Contributor Name Here </span>
        </small>
      </p>
    </template>
  </UiDialog>
</template>

<script setup lang="ts">
  import {
    ColorsLegendSize,
    DialogSize,
    HistoryPeriod,
    HistoryPeriodConfig,
    LocationDetails,
    LocationHistoryDataItem,
    MeasureNames,
    SensorType
  } from '~/types';
  import { onMounted, ref, Ref, watch, computed } from 'vue';
  import { Bar } from 'vue-chartjs';
  import { ChartData, ChartOptions } from 'chart.js';

  import { DialogInstance, AGMapLocationData, LocationHistoryData } from '~/types';
  import { useGeneralConfigStore } from '~/store/general-config-store';
  import { useRuntimeConfig, useNuxtApp } from 'nuxt/app';
  import { getDateRangeFromToday } from '~/utils/date';
  import { HISTORY_PERIODS } from '~/constants/shared/chart-periods';
  import { useChartjsOptions } from '~/composables/shared/historical-data/useChartJsOptions';
  import { useChartjsData } from '~/composables/shared/historical-data/useChartJsData';
  import { MEASURE_LABELS_SUBSCRIPTS } from '~/constants/shared/measure-labels';
  import { pm25ToAQI } from '~/utils/aqi';
  import { getAQIColor, getCO2Color, getPM25Color } from '~/utils';
  import { MEASURE_UNITS } from '~/constants/shared/measure-units';
  import { useChartJsAnnotations } from '~/composables/shared/historical-data/useChartJsAnnotations';

  const props = defineProps<{
    dialog: DialogInstance<{ location: AGMapLocationData }>;
  }>();

  const { $formatDate } = useNuxtApp();
  const apiUrl = useRuntimeConfig().public.apiUrl;
  const generalConfigStore = useGeneralConfigStore();
  const mapLocationData: Ref<AGMapLocationData> = ref(null);
  const locationHistoryData: Ref<LocationHistoryData> = ref(null);
  const locationDetails: Ref<LocationDetails> = ref(null);
  const chartData: Ref<ChartData<'bar'>> = ref(null);
  const chartOptions: Ref<ChartOptions<'bar'>> = ref(null);
  const historyLoading: Ref<boolean> = ref(false);
  const detailsLoading: Ref<boolean> = ref(false);
  const loading: Ref<boolean> = computed(() => historyLoading.value || detailsLoading.value);

  const currentValueData: Ref<{
    bgColor: string;
    value: number;
    textColor: string;
    labelHTML: string;
    unit: string;
    date: string;
  }> = computed(() => {
    if (!locationHistoryData.value) {
      return null;
    }

    const mostRecentData = getMostRecentData(locationHistoryData.value.data);
    if (!mostRecentData) {
      return null;
    }

    let colorConfig: { bgColor: string; textColorClass: string } = {
      bgColor: '',
      textColorClass: ''
    };

    let value = Number.parseFloat(mostRecentData.value);
    switch (generalConfigStore.selectedMeasure) {
      case MeasureNames.PM_AQI:
        value = pm25ToAQI(value);
        colorConfig = getAQIColor(value);
        break;
      case MeasureNames.CO2:
        colorConfig = getCO2Color(value);
        break;
      default:
        colorConfig = getPM25Color(value);
        break;
    }

    return {
      bgColor: colorConfig.bgColor,
      value: value,
      unit: MEASURE_UNITS[generalConfigStore.selectedMeasure],
      labelHTML: MEASURE_LABELS_SUBSCRIPTS[generalConfigStore.selectedMeasure],
      textColor: colorConfig.textColorClass,
      date: mostRecentData.timebucket
    };
  });

  function getMostRecentData(data: LocationHistoryDataItem[]): LocationHistoryDataItem | null {
    if (data?.length) {
      let currentIndex = data.length;
      let value = null;
      while (currentIndex > 0 && value === null) {
        if (data[currentIndex]?.value) {
          value = data[currentIndex];
        }
        currentIndex--;
      }
      return value;
    }
    return null;
  }

  async function fetchLocationDetails(locationId: number): Promise<void> {
    detailsLoading.value = true;
    try {
      const response = await $fetch<LocationDetails>(`${apiUrl}/locations/${locationId}`, {
        retry: 1
      });
      locationDetails.value = response;
    } catch (error) {
      console.error('Failed to fetch location details:', error);
    } finally {
      detailsLoading.value = false;
    }
  }

  async function fetchLocationHistory(locationId: number): Promise<LocationHistoryData> {
    historyLoading.value = true;
    const { start, end } = getDateRangeFromToday(
      generalConfigStore.selectedHistoryPeriod.unit,
      generalConfigStore.selectedHistoryPeriod.count
    );
    const measure =
      generalConfigStore.selectedMeasure === MeasureNames.PM_AQI
        ? MeasureNames.PM25
        : generalConfigStore.selectedMeasure;

    try {
      const response = await $fetch<LocationHistoryData>(
        `${apiUrl}/locations/${locationId}/measures/history`,
        {
          params: {
            start,
            end,
            bucketSize: generalConfigStore.selectedHistoryPeriod.defaultBucketSize,
            measure
          },
          retry: 1
        }
      );
      locationHistoryData.value = response;

      return response;
    } catch (error) {
      console.error('Failed to fetch location history:', error);
      return null;
    } finally {
      historyLoading.value = false;
    }
  }

  function handleChartPeriodChange(period: HistoryPeriod) {
    const periodConfig = HISTORY_PERIODS.find(
      (periodConfig: HistoryPeriodConfig) => periodConfig.value === period
    );
    useGeneralConfigStore().setSelectedHistoryPeriod(periodConfig);
    fetchLocationHistory(mapLocationData.value.locationId);
  }

  onMounted(() => {
    mapLocationData.value = props.dialog?.data.location;
    if (mapLocationData.value) {
      fetchLocationHistory(mapLocationData.value.locationId);
      fetchLocationDetails(mapLocationData.value.locationId);
    }
  });

  watch(locationHistoryData, (newData: LocationHistoryData) => {
    if (newData && newData.data) {
      const { chartData: data, chartValues } = useChartjsData({
        data: newData.data,
        measure: generalConfigStore.selectedMeasure
      });
      chartData.value = data;

      const annotations = useChartJsAnnotations({
        data: chartValues
      });

      chartOptions.value = useChartjsOptions({
        measure: generalConfigStore.selectedMeasure,
        animated: true,
        annotations
      });
    }
  });
</script>

<style lang="scss" scoped>
  .chart-controls {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .period-control {
    max-width: 165px;
  }

  .current-values {
    border-radius: 5px;
    display: flex;
    gap: 15px;
    align-items: center;
    justify-content: center;
  }

  .measure-label {
    padding-right: 5px;
    margin-right: 5px;
    border-right: 1px solid var(--main-text-color);
  }

  .text-light .measure-label {
    border-right: 1px solid var(--main-white-color);
  }

  .text-dark .measure-icon {
    filter: brightness(0) invert(0);
  }

  .unit-label {
    font-size: var(--font-size-sm);
  }

  .current-label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
  }
</style>
