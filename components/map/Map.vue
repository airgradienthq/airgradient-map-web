<template>
  <UiProgressBar :show="loading"></UiProgressBar>
  <div id="map">
    <div class="map-controls">
      <select v-model="displayType" class="display-type-selector">
        <option value="pm25">PM2.5 (μg/m³)</option>
        <option value="aqi">US AQI (PM2.5)</option>
        <option value="co2">CO2 (ppm)</option>
      </select>
    </div>
    <LMap
      class="map"
      ref="map"
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
import { ref, watch } from 'vue'
import L, { DivIcon, GeoJSON, LatLngBounds, LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@maplibre/maplibre-gl-leaflet'
import 'maplibre-gl/dist/maplibre-gl.css'
import { GeoJsonObject } from 'geojson'
import { LMap } from '@vue-leaflet/vue-leaflet'
import { useRuntimeConfig } from 'nuxt/app'
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch'

import { convertToGeoJSON } from '~/utils/'
import { AGMapData } from '~/types'
import { getPM25Color, getCO2Color } from '~/utils/'
import { INITIAL_MAP_VIEW_CONFIG } from '~/constants'
import { pm25ToAQI, getAQIColor } from '~/utils/aqi'

const MEASURE_MAPPING = {
  pm25: 'pm25',
  aqi: 'pm25', // AQI is calculated from PM2.5
  co2: 'rco2'
} as const

const loading = ref<boolean>(false)
const map = ref<typeof LMap>()
const apiUrl = useRuntimeConfig().public.apiUrl
const displayType = ref<'pm25' | 'aqi' | 'co2'>('pm25')

let mapInstance: L.Map
let markers: GeoJSON

const onMapReady = () => {
  setUpMapInstance()
  addGeocodeControl()
}

function setUpMapInstance(): void {
  if (!map.value) {
    return
  }

  mapInstance = map.value.leafletObject

  L.maplibreGL({
    style: 'https://tiles.openfreemap.org/styles/liberty'
  }).addTo(mapInstance)

  markers = L.geoJson(null, {
    pointToLayer: createMarker
  }).addTo(mapInstance)

  mapInstance.on('moveend', updateMap)
  mapInstance.whenReady(updateMap)
}

function createMarker(feature: GeoJSON.Feature, latlng: LatLngExpression): L.Marker {
  const value: number = feature.properties?.value || 0
  const pm25Value: number = displayType.value === 'pm25' ? value : 0
  const aqiValue: number = displayType.value === 'aqi' ? pm25ToAQI(value) : 0
  const co2Value: number = displayType.value === 'co2' ? value : 0
  
  let displayValue: number
  let backgroundColor: string
  let unit: string
  
  switch (displayType.value) {
    case 'pm25':
      displayValue = pm25Value
      backgroundColor = getPM25Color(pm25Value)
      unit = 'PM2.5 μg/m³'
      break
    case 'aqi':
      displayValue = aqiValue
      backgroundColor = getAQIColor(aqiValue)
      unit = 'US AQI (PM2.5)'
      break
    case 'co2':
      displayValue = co2Value
      backgroundColor = getCO2Color(co2Value)
      unit = 'CO2 ppm'
      break
  }
  
  const isSensor: boolean = feature.properties?.type === 'sensor'
  const isReference: boolean = feature.properties?.sensorType === 'Reference'
  
  const markerSize = isSensor ? 24 : 36

  const icon: DivIcon = L.divIcon({
    html: `<div class="ag-marker-cluster${!isSensor ? ' is-cluster' : ''}${isReference ? ' is-reference' : ''}" 
             style="background-color: ${backgroundColor}">
             <span>${Math.round(displayValue)}</span>
           </div>`,
    className: `marker-cluster-outer ${!isSensor ? 'is-cluster-outer' : ''}`,
    iconSize: L.point(markerSize, markerSize)
  })

  const marker = L.marker(latlng, { icon })
  
  if (isSensor && feature.properties) {
    const locationName: string = feature.properties.locationName || 'Unknown Location'
    const tooltipContent = `
      <div class="marker-tooltip">
        <div class="tooltip-header">${locationName}</div>
        <div class="tooltip-content">
          <div class="measurement">
            <span class="value">${Math.round(displayValue)}</span>
            <span class="unit">${unit}</span>
          </div>
        </div>
      </div>
    `
    
    marker.bindTooltip(tooltipContent, {
      direction: 'top',
      offset: L.point(0, -12),
      opacity: 1,
      permanent: false,
      className: 'ag-marker-tooltip'
    })
  } else if (!isSensor) {
    marker.on('click', () => {
      const currentZoom = mapInstance.getZoom()
      const newZoom = Math.min(currentZoom + 2, INITIAL_MAP_VIEW_CONFIG.maxZoom)
      
      mapInstance.flyTo(latlng, newZoom, {
        animate: true,
        duration: 0.8
      })
    })
  }

  return marker
}

async function updateMap(): Promise<void> {
  if (loading.value) {
    return
  }
  loading.value = true

  try {
    const bounds: LatLngBounds = mapInstance.getBounds()
    const response = await $fetch<AGMapData>(
      `${apiUrl}/v1/measurements/current/cluster`,
      {
        params: {
          xmin: bounds.getSouth(),
          ymin: bounds.getWest(),
          xmax: bounds.getNorth(),
          ymax: bounds.getEast(),
          zoom: mapInstance.getZoom(),
          measure: MEASURE_MAPPING[displayType.value]
        },
        retry: 1,
      }
    )

    // Filter out zero values before creating GeoJSON
    const filteredData = response.data.filter(item => item.value > 0)
    const geoJsonData: GeoJsonObject = convertToGeoJSON(filteredData)
    markers.clearLayers()
    markers.addData(geoJsonData)
  } catch (error) {
    console.error('Failed to fetch map data:', error)
  } finally {
    loading.value = false
  }
}

function addGeocodeControl(): void {
  const provider = new OpenStreetMapProvider()

  const searchControl = GeoSearchControl({
    provider,
    style: 'bar',
    autoClose: true,
    keepResult: true
  })

  mapInstance.addControl(searchControl)
}

// Watch for display type changes and update markers
watch(displayType, () => {
  if (markers) {
    updateMap()
  }
})
</script>

<style lang="scss">
#map {
  height: calc(100vh - 5px);
}

.marker-cluster-outer {
  background: none !important;
  border: none !important;
}

.marker-cluster-outer.is-cluster-outer {
  background: none !important;
  border: none !important;
}

.ag-marker-cluster {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-family: $secondary-font;
  box-sizing: border-box;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  color: #ffffff;
  
  // Default style for sensor markers
  border-radius: 4px;
  font-size: 12px;
  
  // Style for markers with yellow background (both PM2.5 and AQI yellows)
  &[style*="background-color: #ffff00"],
  &[style*="background-color: rgb(255, 255, 0)"],
  &[style*="background-color: #e2e020"],
  &[style*="background-color: rgb(226, 224, 32)"] {
    color: #2c3e50 !important;
    text-shadow: none;
  }
  
  // Style for markers with green background (both PM2.5 and AQI greens)
  &[style*="background-color: #00e400"],
  &[style*="background-color: rgb(0, 228, 0)"],
  &[style*="background-color: #1de208"],
  &[style*="background-color: rgb(29, 226, 8)"] {
    color: #2c3e50 !important;
    text-shadow: none;
  }
  
  // Reference sensor style
  &.is-reference {
    border: 2px solid white;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    font-size: 13px;
  }
  
  // Cluster markers style
  &.is-cluster {
    border-radius: 50% !important;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    transform: translate3d(0,0,0);
    cursor: pointer;
    
    &:hover {
      opacity: 0.9;
      transform: scale(1.05);
      transition: all 0.2s ease;
    }
  }
}

.ag-marker-tooltip {
  font-family: $secondary-font;
  padding: 0;
  border: none;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  background: white;
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
    background: white;
    box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.05);
  }

  .marker-tooltip {
    .tooltip-header {
      background: $primary-color;
      color: white;
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
          color: $text-color;
          line-height: 1;
        }

        .unit {
          font-size: 12px;
          color: $dark-grey;
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
      padding: 0 12px 0 30px !important;
    }
  }

  .reset {
    color: $dark-grey !important;
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
  color: $primary-color;
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
  font-family: $secondary-font;
  font-size: 16px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  background: white;
  color: rgba(0, 0, 0, 0.75);
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
    border-color: $primary-color;
    box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
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
