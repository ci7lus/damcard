import React, { useEffect, useState } from "react"
import ReactDOM from "react-dom"
import { renderToStaticMarkup } from "react-dom/server"
import { GOOGLE_API_KEY } from "./config"
import { DAM, DIST } from "./types"
import { ScaleLoader } from "react-spinners"
const dams_path = require("./assets/externals/dams.json")
const dists_path = require("./assets/externals/dists.json")
const kurobe_dam = require("./assets/images/kurobe_dam.png")

declare global {
  interface Window {
    initMap: Function
  }
}

const App = () => {
  const [loading, setLoading] = useState(true)
  const [height, setHeight] = useState("100vh")
  const updateHeight = () => {
    setHeight(`${window.innerHeight}px`)
  }
  useEffect(() => {
    const initialize = async () => {
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
          lat: 36.56678370175526,
          lng: 137.666148,
        },
        zoom: 10,
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

      // ポップアップウィンドウ初期化
      const infoWindow = new google.maps.InfoWindow({
        content: "",
      })

      // 再描画
      const rerender = async () => {
        const zoom = map.getZoom()
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
          infoWindow.setContent(
            renderToStaticMarkup(<PopupView dam={dam} dists={dam_dists} />)
          )
          infoWindow.open(map, marker)
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
      <div className="text-xs text-right absolute left-0 bottom-0 mb-6 ml-1 bg-gray-100">
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

const PopupView = ({ dam, dists }: { dam: DAM; dists: DIST[] }) => {
  return (
    <div className="border-gray-200 border-2 p-1">
      <div className="text-base">{dam.name}</div>
      <div className="border-gray-200 border-2 my-1" />
      <div className="leading-relaxed text-sm">
        <ul className="list-disc list-inside mb-1 ml-2">
          {dam.url && (
            <li>
              <a
                className="text-teal-600"
                href={dam.url}
                target="_blank"
                rel="noopener"
              >
                ウェブサイト
              </a>
            </li>
          )}
          <li>
            位置:&nbsp;
            <a
              href={`https://maps.google.com/maps?q=${dam.lat},${dam.lng}&hl=ja`}
              target="_blank"
              rel="noopener"
              className="text-teal-600"
            >
              {dam.lat}, {dam.lng}
            </a>
          </li>
          {dam.is_close && <li>配布を終了している可能性があります</li>}
          {dam.is_distance && <li>⚠️ ダムと配布場所が離れてます</li>}
        </ul>
        {dists.map((dist) => (
          <div className="border-gray-200 border-2 p-1 mb-1" key={dist.id}>
            <div className="text-base">{dist.name}</div>
            <div className="border-gray-200 border-2 my-1" />
            <div className="leading-relaxed text-sm">
              <ul className="list-disc list-inside mb-1 ml-2">
                {dam.url && (
                  <li>
                    <a
                      className="text-teal-600"
                      href={dam.url}
                      target="_blank"
                      rel="noopener"
                    >
                      ウェブサイト
                    </a>
                  </li>
                )}
                <li>
                  住所:&nbsp;
                  <a
                    href={`https://maps.google.com/maps?q=${dist.lat},${dist.lng}&hl=ja`}
                    target="_blank"
                    rel="noopener"
                    className="text-teal-600"
                  >
                    {dist.address}
                  </a>
                </li>
                {dist.is_weekend && <li>週末に配布しています</li>}
                {dist.is_multi && <li>複数のカードを配っているらしいです</li>}
              </ul>
              <div className="whitespace-pre break-words overflow-auto">
                {dist.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
