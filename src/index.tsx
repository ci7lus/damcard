import React, { useEffect, useState } from "react"
import ReactDOM from "react-dom"
import { GOOGLE_API_KEY } from "./config"
import { DAM, DIST, STATUS, ExtendDam } from "./types"
import { ScaleLoader } from "react-spinners"
import $ from "transform-ts"
import localforage from "localforage"
import { Popup } from "./components/popup"
const dams_path = require("./assets/externals/dams.json")
const dists_path = require("./assets/externals/dists.json")
const kurobe_dam = require("./assets/images/kurobe_dam.png")

declare global {
  interface Window {
    initMap: Function
  }
}

const App: React.FC<{}> = () => {
  const [loading, setLoading] = useState(true)
  const [height, setHeight] = useState("100vh")
  const [popup, setPopup] = useState(null as null | ExtendDam)
  const updateHeight = () => {
    setHeight(`${window.innerHeight}px`)
  }
  useEffect(() => {
    const initialize = async () => {
      try {
        if (
          process.env.NODE_ENV === "production" &&
          "serviceWorker" in navigator
        ) {
          await navigator.serviceWorker.register("/sw.js")
        }
      } catch (error) {
        console.error(error)
      }

      const preferenceStorage = localforage.createInstance({
        name: process.env.npm_package_name,
        storeName: "preference",
      })

      let status: STATUS = {
        zoom: 10,
        lat: 36.56678370175526,
        lng: 137.666148,
      }
      try {
        const s = await preferenceStorage.getItem("location_status")
        if (s) {
          const p = $.obj({
            zoom: $.number,
            lat: $.number,
            lng: $.number,
          }).transformOrThrow(s)
          status = p
        }
      } catch (error) {
        console.warn("ステータスデータのパースに失敗しました")
      }

      // Google Map バンドルのロード
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

      // 地図の初期化
      const map = new google.maps.Map(document.getElementById("map")!, {
        center: {
          lat: status.lat,
          lng: status.lng,
        },
        zoom: status.zoom,
        gestureHandling: "greedy",
      })

      // 高さ制御
      updateHeight()
      window.addEventListener("resize", () => {
        if (0.5 < Math.random()) {
          updateHeight()
        }
      })

      // ダムデータの読み込み
      const loaded_dams: (DAM & {
        marker: google.maps.Marker
      })[] = []

      // 再描画
      const rerender = async () => {
        const zoom = map.getZoom()
        const center = map.getCenter()
        const lat = center.lat()
        const lng = center.lng()
        const markerSize = Math.pow(zoom, 2) / 4
        const bounds = map.getBounds()!
        const sw = bounds.getSouthWest()
        const ne = bounds.getNorthEast()

        const min_lat = sw.lat() - 1
        const max_lat = ne.lat() + 1
        const min_lng = sw.lng() - 1
        const max_lng = ne.lng() + 1

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

        const s: STATUS = {
          zoom,
          lat,
          lng,
        }
        await preferenceStorage.setItem("location_status", s)
      }

      map.addListener("dragend", rerender)
      map.addListener("zoom_changed", rerender)

      const dams_req = await fetch(dams_path)
      const dams: DAM[] = await dams_req.json()

      const dists_req = await fetch(dists_path)
      const dists: DIST[] = await dists_req.json()

      for (let dam of dams) {
        const marker = new google.maps.Marker({
          position: {
            lat: dam.lat,
            lng: dam.lng,
          },
          title: dam.name,
          zIndex: 50,
        })
        const dam_dists = dists.filter((dist) => dist.dam_id === dam.id)
        marker.addListener("click", () => {
          setPopup({ ...dam, dists: dam_dists })
        })
        loaded_dams.push({ ...dam, marker })
      }
      console.log("dam loaded", loaded_dams.length)

      while (true) {
        if (map.getBounds()) {
          break
        } else {
          await new Promise((res) => {
            setTimeout(() => res(), 1000)
          })
        }
      }
      await rerender()
      setTimeout(() => setLoading(false), 1000)
    }
    initialize()
  }, [])
  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ minHeight: height }}
    >
      <div className="flex-1" id="map"></div>
      <div className="absolute right-0 top-0 m-8 pointer-events-none">
        <ScaleLoader color={"#4fd1c5"} loading={loading} />
      </div>
      {popup && (
        <div
          className="fixed left-0 top-0 w-full h-screen flex items-center justify-center z-20"
          style={{ height: height }}
        >
          <div
            className="absolute left-0 top-0 w-full h-full bg-black opacity-25"
            onClick={() => {
              setPopup(null)
            }}
          />
          <div
            className="container min-w-screen-md max-w-screen-md m-4 p-4 relative z-30 bg-white text-gray-700 rounded-sm overflow-auto"
            style={{ height: `calc(${height} - 6rem)` }}
          >
            <Popup dam={popup} />
          </div>
        </div>
      )}
      <div className="text-xs text-right absolute left-0 bottom-0 mb-6 ml-1 bg-gray-100 z-10">
        <div>
          データソース:&nbsp;
          <a href="https://damcard.net/" target="_blank" rel="noopener">
            ダムこれ！
          </a>
        </div>
      </div>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById("app"))
