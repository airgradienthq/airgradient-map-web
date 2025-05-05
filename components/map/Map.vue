<template>
  <UiProgressBar :show="loading"></UiProgressBar>
  <div id="map">
    <div class="map-controls">
      <UiDropdownControl
        :selected-value="generalConfigStore.selectedMeasure"
        :options="measureSelectOptions"
        :disabled="loading"
        @change="handleMeasureChange"
      >
      </UiDropdownControl>
    </div>
    <LMap
      ref="map"
      class="map"
      :maxBoundsViscosity="INITIAL_MAP_VIEW_CONFIG.maxBoundsViscosity"
      :maxBounds="INITIAL_MAP_VIEW_CONFIG.maxBounds"
      :zoom="INITIAL_MAP_VIEW_CONFIG.zoom"
      :max-zoom="INITIAL_MAP_VIEW_CONFIG.maxZoom"
      :min-zoom="INITIAL_MAP_VIEW_CONFIG.minZoom"
      :center="INITIAL_MAP_VIEW_CONFIG.center"
      @ready="onMapReady"
    >
    </LMap>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import L, { DivIcon, GeoJSON, LatLngBounds, LatLngExpression } from 'leaflet';
  import 'leaflet/dist/leaflet.css';
  import '@maplibre/maplibre-gl-leaflet';
  import 'maplibre-gl/dist/maplibre-gl.css';
  import { GeoJsonObject } from 'geojson';
  import { LMap } from '@vue-leaflet/vue-leaflet';
  import { useRuntimeConfig } from 'nuxt/app';
  import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';

  import { convertToGeoJSON } from '~/utils/';
  import { AGMapData, MeasureNames, AGMapDataItemType, SensorType, DropdownOption } from '~/types';
  import { getPM25Color, getAQIColor } from '~/utils/';
  import { INITIAL_MAP_VIEW_CONFIG } from '~/constants';
  import { pm25ToAQI } from '~/utils/aqi';
  import { useGeneralConfigStore } from '~/store/general-config-store';

  const loading = ref<boolean>(false);
  const map = ref<typeof LMap>();
  const apiUrl = useRuntimeConfig().public.apiUrl;
  const generalConfigStore = useGeneralConfigStore();
  const measureSelectOptions: DropdownOption[] = [
    {
      label: 'PM2.5 (μg/m³)',
      value: MeasureNames.PM25
    },
    {
      label: 'US AQI (PM2.5)',
      value: MeasureNames.PM_AQI
    }
  ];

  let geoJsonMapData: GeoJsonObject;
  let mapInstance: L.Map;
  let markers: GeoJSON;

  const onMapReady = () => {
    setUpMapInstance();
    addGeocodeControl();
  };

  function setUpMapInstance(): void {
    if (!map.value) {
      return;
    }

    mapInstance = map.value.leafletObject;

    L.maplibreGL({
      style: 'https://tiles.openfreemap.org/styles/liberty'
    }).addTo(mapInstance);

    markers = L.geoJson(null, {
      pointToLayer: createMarker
    }).addTo(mapInstance);

    mapInstance.on('moveend', updateMap);
    mapInstance.whenReady(updateMap);
  }

  function createMarker(feature: GeoJSON.Feature, latlng: LatLngExpression): L.Marker {
    const pm25Value: number = feature.properties?.value || 0;
    const aqiValue: number = pm25ToAQI(pm25Value);

    const displayValue =
      generalConfigStore.selectedMeasure === MeasureNames.PM25 ? pm25Value : aqiValue;
    const colorConfig: { bgColor: string; textColorClass: string } =
      generalConfigStore.selectedMeasure === MeasureNames.PM25
        ? getPM25Color(pm25Value)
        : getAQIColor(aqiValue);

    const isSensor: boolean = feature.properties?.type === AGMapDataItemType.sensor;
    const isReference: boolean = feature.properties?.sensorType === SensorType.reference;

    const markerSize = isSensor ? 24 : 36;

    const icon: DivIcon = L.divIcon({
      html: `<div class="ag-marker${!isSensor ? ' is-cluster' : ''}${isReference ? ' is-reference' : ''} ${colorConfig?.textColorClass}" 
             style="background-color: ${colorConfig?.bgColor}">
             <span>${Math.round(displayValue)}</span>
           </div>`,
      className: `marker-box ${!isSensor ? 'is-cluster-marker-box' : ''}`,
      iconSize: L.point(markerSize, markerSize)
    });

    const marker = L.marker(latlng, { icon });

    if (isSensor && feature.properties) {
      const locationName: string = feature.properties.locationName || 'Unknown Location';
      const tooltipContent = `
      <div class="marker-tooltip">
        <div class="tooltip-header">${locationName}</div>
        <div class="tooltip-content">
          <div class="measurement">
            <span class="value">${Math.round(displayValue)}</span>
            <span class="unit">${generalConfigStore.selectedMeasure === MeasureNames.PM25 ? 'PM2.5 μg/m³' : 'US AQI (PM2.5)'}</span>
          </div>
        </div>
      </div>
    `;

      marker.bindTooltip(tooltipContent, {
        direction: 'top',
        offset: L.point(0, -12),
        opacity: 1,
        permanent: false,
        className: 'ag-marker-tooltip'
      });
    } else if (!isSensor) {
      marker.on('click', () => {
        const currentZoom = mapInstance.getZoom();
        const newZoom = Math.min(currentZoom + 2, INITIAL_MAP_VIEW_CONFIG.maxZoom);

        mapInstance.flyTo(latlng, newZoom, {
          animate: true,
          duration: 0.8
        });
      });
    }

    return marker;
  }

  async function updateMap(): Promise<void> {
    if (loading.value) {
      return;
    }
    loading.value = true;

    try {
      const bounds: LatLngBounds = mapInstance.getBounds();
      const response = await $fetch<AGMapData>(`${apiUrl}/v1/measurements/current/cluster`, {
        params: {
          xmin: bounds.getSouth(),
          ymin: bounds.getWest(),
          xmax: bounds.getNorth(),
          ymax: bounds.getEast(),
          zoom: mapInstance.getZoom(),
          measure: MeasureNames.PM25
        },
        retry: 1
      });

      const geoJsonData: GeoJsonObject = convertToGeoJSON(response.data);
      geoJsonMapData = geoJsonData;
      markers.clearLayers();
      markers.addData(geoJsonData);
    } catch (error) {
      console.error('Failed to fetch map data:', error);
    } finally {
      loading.value = false;
    }
  }

  function addGeocodeControl(): void {
    const provider = new OpenStreetMapProvider();

    const searchControl = GeoSearchControl({
      provider,
      style: 'bar',
      autoClose: true,
      keepResult: true
    });

    mapInstance.addControl(searchControl);
  }

  function handleMeasureChange(value: MeasureNames): void {
    useGeneralConfigStore().setSelectedMeasure(value);
    markers.clearLayers();
    markers.addData(geoJsonMapData);
  }
</script>

<style lang="scss">
  #map {
    height: calc(100vh - 5px);
  }

  .marker-box {
    background: none !important;
    border: none !important;
  }

  .ag-marker {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    font-size: 12px;
    justify-content: center;
    font-weight: 600;
    border-radius: 4px;
    color: var(--main-white-color);
  }

  .is-cluster {
    border-radius: 50%;
    font-size: 14px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    cursor: pointer;

    &:hover {
      opacity: 0.9;
      transform: scale(1.05);
      transition: all 0.2s ease;
    }
  }

  .is-reference {
    border: 2px solid var(--main-white-color);
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
  }

  .ag-marker-tooltip {
    font-family: var(--secondary-font);
    padding: 0;
    border: none;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    background: var(--main-white-color);
    backdrop-filter: blur(8px);
    min-width: 180px;

    &::before {
      display: none;
    }

    &::after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%) rotate(45deg);
      width: 12px;
      height: 12px;
      background: var(--main-white-color);
      box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.05);
    }

    .marker-tooltip {
      .tooltip-header {
        background: var(--primary-color);
        color: var(--main-white-color);
        padding: 8px 12px;
        font-weight: 600;
        font-size: 14px;
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }

      .tooltip-content {
        padding: 12px;
        text-align: center;

        .measurement {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 8px;

          .value {
            font-size: 24px;
            font-weight: 700;
            color: var(--main-text-color);
            line-height: 1;
          }

          .unit {
            font-size: 12px;
            color: var(--dark-grey);
            font-weight: 500;
            white-space: nowrap;
          }
        }
      }
    }
  }

  .leaflet-tooltip {
    z-index: 1000 !important;
  }

  .leaflet-geosearch-bar {
    width: 300px !important;
    max-width: 300px !important;
    margin: 10px 10px 0 auto !important;

    form {
      padding-left: 30px;
      background-image: url('/assets/images/icons/search.svg');
      background-position: 5px center;
      background-size: 20px;

      input {
        height: 36px !important;
        font-size: 16px !important;
      }
    }

    .reset {
      color: var(--grayColor700) !important;
      line-height: 36px !important;
      font-size: 16px !important;
    }
  }

  .leaflet-control-geosearch .results.active {
    width: calc(100% + 25px);
    margin-left: -25px;
  }

  .results > .active,
  .leaflet-control-geosearch .results > :hover {
    color: var(--primary-color);
    border-radius: 4px;
    border-color: transparent;
  }

  .map-controls {
    position: absolute;
    top: 60px;
    right: 10px;
    z-index: 999;
    width: 300px;
  }

  .display-type-selector {
    width: 100%;
    height: 36px;
    padding: 0 12px;
    font-family: var(--secondary-font);
    font-size: 16px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    background: var(--main-white-color);
    color: var(--main-text-color);
    cursor: pointer;
    outline: none;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 8px center;
    background-size: 16px;
    padding-right: 32px;

    &:hover {
      border-color: rgba(0, 0, 0, 0.3);
    }

    &:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(var(--primary-color), 0.1);
    }
  }

  .leaflet-geosearch-bar {
    margin-bottom: 8px !important;
  }

  .display-type-selector:-moz-focusring {
    color: transparent;
    text-shadow: 0 0 0 #000;
  }

  .display-type-selector::-ms-expand {
    display: none;
  }
</style>
