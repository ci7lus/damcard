import React, { useState, useEffect } from "react"
import ReactDOM from "react-dom"
import { GOOGLE_API_KEY } from "./config"

declare global {
  interface Window {
    initMap: Function
  }
}

const App = () => {
  const [initialized, setInitialized] = useState(false)

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
      setInitialized(true)
      const map = new google.maps.Map(document.getElementById("map")!, {
        center: { lat: 37, lng: 137.5 },
        zoom: 6,
      })
      map.addListener("dragend", () => {
        console.log(map.getCenter().lat(), map.getCenter().lng())
      })
      const marker = new google.maps.Marker({
        position: { lat: 36.56678370175526, lng: 137.666148 },
        map: map,
        animation: google.maps.Animation.DROP,
        title: "黒部ダム",
      })
      const infoWindow = new google.maps.InfoWindow({
        content: `<div class="bg-gray-100">黒部ダム</div>`,
      })
      marker.addListener("click", () => {
        infoWindow.open(map, marker)
      })
    }
    initialize()
  }, [])
  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="flex-1" id="map"></div>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById("app"))
