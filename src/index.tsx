import React, { useEffect } from "react"
import ReactDOM from "react-dom"
import { GOOGLE_API_KEY } from "./config"
import { DAM } from "./types"
const dams_path = require("./assets/dams.json")
const kurobe_dam = require("./assets/kurobe_dam_icon.png")

declare global {
  interface Window {
    initMap: Function
  }
}

const App = () => {
  useEffect(() => {
    const initialize = async () => {
      await new Promise((res, rej) => {
        const script = document.createElement("script")
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&callback=initMap`
        script.setAttribute("async", "")
        script.setAttribute("defer", "")
        const head = document.querySelector("head")!
        head.appendChild(script)
        window.initMap = () => {
          res()
        }
        setTimeout(() => {
          if (!window.google) {
            rej(new Error("Failed to load googlemapsapi"))
          }
        }, 5000)
      })

      const map = new google.maps.Map(document.getElementById("map")!, {
        center: { lat: 36.56678370175526, lng: 137.666148 },
        zoom: 10,
      })

      const loaded_dams: (DAM & { marker: google.maps.Marker })[] = []

      const rerender = async () => {
        const markerSize = map.getZoom() * 4 - 5
        const bounds = map.getBounds()!
        const sw = bounds.getSouthWest()
        const ne = bounds.getNorthEast()

        const min_lat = sw.lat()
        const max_lat = ne.lat()
        const min_lng = sw.lng()
        const max_lng = ne.lng()

        const target_dams = loaded_dams.filter(
          (dam) =>
            min_lat < dam.lat &&
            dam.lat < max_lat &&
            min_lng < dam.lng &&
            dam.lng < max_lng
        )
        for (let dam of target_dams) {
          dam.marker.setMap(map)
          dam.marker.setIcon({
            url: kurobe_dam,
            scaledSize: new google.maps.Size(markerSize, markerSize),
          })
        }
        loaded_dams
          .filter((dam) => !target_dams.includes(dam))
          .map((dam) => dam.marker.setMap(null))
      }

      map.addListener("dragend", rerender)
      map.addListener("zoom_changed", rerender)

      const dams_req = await fetch(dams_path)
      const dams: DAM[] = await dams_req.json()
      const infoWindow = new google.maps.InfoWindow({
        content: "",
      })

      for (let dam of dams) {
        const marker = new google.maps.Marker({
          position: { lat: dam.lat, lng: dam.lng },
          title: dam.name,
        })
        marker.addListener("click", () => {
          infoWindow.setContent(`<div class="text-lg">${dam.name}</div>`)
          infoWindow.open(map, marker)
        })
        loaded_dams.push({ ...dam, marker })
      }
      console.log("loaded", loaded_dams.length)

      while (true) {
        if (map.getBounds()) {
          break
        } else {
          await new Promise((res) => {
            setTimeout(() => res(), 1000)
          })
        }
      }
      rerender()
    }
    initialize()
  }, [])
  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="flex-1" id="map"></div>
      <div className="text-xs text-right absolute left-0 bottom-0 mb-8 ml-2 bg-gray-100">
        <div>
          データソース:
          <a href="https://damcard.net/" target="_blank" rel="noopener">
            ダムこれ！
          </a>
        </div>
      </div>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById("app"))
