export type DAM = {
  id: string
  name: string
  url: string | null
  pref: string
  area: string
  category: string
  is_distance: boolean
  is_close: boolean
  distance: string
  lat: number
  lng: number
}

export type DIST = {
  id: string
  name: string
  dam_id: string
  address: string
  is_weekend: boolean
  is_multi: boolean
  distance: string
  lat: number
  lng: number
}
