import fetch from "node-fetch"
import { JSDOM } from "jsdom"
import { DAM, DIST } from "../src/types"
import fs from "fs"

/**
 * データソース: ダムこれ！様
 * http://damcard.net
 */

const areas = [
  "北海道・東北",
  "関東",
  "北陸",
  "中部",
  "近畿",
  "中国",
  "四国",
  "九州・沖縄",
]

const main = async () => {
  let is_error = false
  const dams: DAM[] = []
  const dists: DIST[] = []
  for (let area of areas) {
    try {
      console.log(`${area} の取得を開始します…`)
      const page = await fetch(
        `https://damcard.net/list/area/${encodeURIComponent(area)}/`
      )
      const body = await page.text()
      const dom = new JSDOM(body)
      const doc = dom.window.document
      const table = doc.querySelector("table")
      if (!table) throw new Error("table not found")
      const tbody = table.querySelector("tbody")
      if (!tbody) throw new Error("tbody not found")
      let pref = ""
      let category = ""
      let currentDam: DAM | null = null
      for (let place of Array.from(tbody.rows).filter(
        (row) => !row.className.includes("header")
      )) {
        const prefCode = place.querySelector(".dmprefcode")
        if (prefCode) {
          if (!prefCode.textContent) throw new Error("prefCode bad match")
          pref = prefCode.textContent
        }
        const categoryCode = place.querySelector(".dmcategory")
        if (categoryCode) {
          if (!categoryCode.textContent) throw new Error("dmcategory bad match")
          category = categoryCode.textContent
        }

        const dmlink: HTMLLinkElement | null = place.querySelector(".dmname a")
        if (dmlink) {
          // ダム情報が含まれたrow
          const linkMatch = dmlink.href.match(/\/dam\/(.+)\//)
          if (!linkMatch) throw new Error("dmid bad match")
          const dmid = linkMatch[1]
          const dmname = dmlink.querySelector("ruby")
          if (!dmname) throw new Error("dmname bad match")
          ;["span", "rp", "rt"].map((tagName) =>
            dmname
              .querySelectorAll(tagName)
              .forEach((node) => dmname.removeChild(node))
          )

          const damName = dmname.textContent!

          const dmurl: HTMLLinkElement | null = place.querySelector(".dmurl a")
          const url = dmurl ? dmurl.href : null

          const dminfo = place.querySelector(".dminformation")
          if (!dminfo) throw new Error("dminformation bad match")
          let is_distance = true
          const distanceIcon = dminfo.querySelector(".icon.distance")
          if (distanceIcon) {
            if (distanceIcon.classList.contains("off")) {
              is_distance = false
            }
          }
          let is_close = true
          const closeIcon = dminfo.querySelector(".icon.close")
          if (closeIcon) {
            if (closeIcon.classList.contains("off")) {
              is_close = false
            }
          }

          const dmposition = place.querySelector(".dmposition")
          if (!dmposition) throw new Error("dmposition not found")
          const dmdistance = dmposition.querySelector(".dmdistance")
          if (!dmdistance) throw new Error("dmdistance bad match")
          const distance = dmdistance.textContent!

          const googlemap: HTMLLinkElement | null = dmposition.querySelector(
            ".googlemap a"
          )
          if (!googlemap) throw new Error("googlemap link bad match")
          const latlngMatch = googlemap.href.match(/q=(.+)&hl=/)
          if (!latlngMatch) throw new Error("map link bad match")
          const [lat, lng] = latlngMatch[1].split(",").map((i) => parseFloat(i))

          const dam: DAM = {
            id: dmid,
            name: damName,
            url,
            pref,
            area,
            category,
            is_distance,
            is_close,
            distance,
            lat,
            lng,
          }

          currentDam = dam
          dams.push(dam)
        }

        const dsidCol = place.querySelector(".dsid")
        if (!dsidCol) throw new Error("dsid not found")
        const dslink: HTMLLinkElement | null = dsidCol.querySelector(
          ".dsname a"
        )
        if (dslink) {
          const linkMatch = dslink.href.match(/\/distributor\/(.+)\//)
          if (!linkMatch) throw new Error("dsid match error")
          const dsid = linkMatch[1]
          const name = dslink.textContent!

          const dsinformation = dsidCol.querySelector(".dsinformation")
          if (!dsinformation) throw new Error("dsinformation not found")
          let is_weekend = true
          const weekendIcon = dsinformation.querySelector(".icon.weekend")
          if (weekendIcon) {
            if (weekendIcon.classList.contains("off")) {
              is_weekend = false
            }
          }
          let is_multi = true
          const multiIcon = dsinformation.querySelector(".icon.multi")
          if (multiIcon) {
            if (multiIcon.classList.contains("off")) {
              is_multi = false
            }
          }
          dsinformation
            .querySelectorAll("icons")
            .forEach((icons) => dsinformation.removeChild(icons))
          const dsaddress = dsinformation.querySelector(".dsaddress")
          if (!dsaddress) throw new Error("dsaddress not found")
          const address = dsaddress.textContent!
          dsinformation.removeChild(dsaddress)
          const description = Array.from(dsinformation.childNodes)
            .map((node) => node.textContent!)
            .join("\n")
            .trim()
            .replace(/\n\n/g, "\n")

          const dsposition = place.querySelector(".dsposition")
          if (!dsposition) throw new Error("dsposition not found")
          const dsdistance = dsposition.querySelector(".dsdistance")
          if (!dsdistance) throw new Error("dsdistance bad match")
          const distance = dsdistance.textContent!

          const googlemap: HTMLLinkElement | null = dsposition.querySelector(
            ".googlemap a"
          )
          if (!googlemap) throw new Error("googlemap link bad match")
          const latlngMatch = googlemap.href.match(/q=(.+)&hl=/)
          if (!latlngMatch) throw new Error("map link bad match")
          const [lat, lng] = latlngMatch[1].split(",").map((i) => parseFloat(i))

          const dist: DIST = {
            id: dsid,
            dam_id: currentDam!.id,
            address,
            description,
            is_weekend,
            is_multi,
            distance,
            name,
            lat,
            lng,
          }
          console.log(name)

          dists.push(dist)
        }
      }
    } catch (e) {
      console.error(e)
      is_error = true
      break
    }
  }
  if (!is_error) {
    fs.writeFileSync("./src/assets/externals/dams.json", JSON.stringify(dams))
    fs.writeFileSync("./src/assets/externals/dists.json", JSON.stringify(dists))
  }
}
main()
