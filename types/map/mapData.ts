export interface AGMapData {
  data: Array<AGMapLocationData | AGMapClusterData>
  page: number
  pagesize: number
  total: number
}

export interface AGMapLocationData extends AGMapDataItem {
  locationId: number
  locationName: string
  sensorType?: 'Reference' | 'DIY'
}

export interface AGMapClusterData extends AGMapDataItem {
  sensorsCount: number
}

export interface AGMapDataItem {
  latitude: number
  longitude: number
  type: AGMapDataItemType
  value: number
  rco2?: number
}

export enum AGMapDataItemType {
  sensor = 'sensor',
  cluster = 'cluster'
}
