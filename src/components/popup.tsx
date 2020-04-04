import React, { useEffect, useState } from "react"
import { Menu, AlertOctagon, Calendar, MapPin, Link } from "react-feather"
import { ExtendDam } from "../types"

export const Popup: React.FC<{ dam: ExtendDam }> = ({ dam }) => {
  return (
    <>
      <div className="text-base">{dam.name}</div>
      <div className="border-gray-200 border-2 my-1" />
      <div className="leading-relaxed text-sm">
        <ul className="list-disc list-inside mb-1 ml-2">
          {dam.url && (
            <li>
              <Link className="inline" size={"1rem"} />
              &nbsp;
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
            <MapPin className="inline" size={"1rem"} />
            &nbsp;位置:&nbsp;
            <a
              href={`https://maps.google.com/maps?q=${dam.lat},${dam.lng}&hl=ja`}
              target="_blank"
              rel="noopener"
              className="text-teal-600"
            >
              {dam.lat}, {dam.lng}
            </a>
          </li>
          {dam.is_close && (
            <li>
              <AlertOctagon className="inline" size={"1rem"} />
              &nbsp; 配布終了可能性あり
            </li>
          )}
          {dam.is_distance && (
            <li>
              <AlertOctagon className="inline" size={"1rem"} />
              &nbsp;遠距離
            </li>
          )}
        </ul>
        {dam.dists.map((dist) => (
          <div className="border-gray-200 border-2 p-1 mb-1" key={dist.id}>
            <span className="text-base">{dist.name}</span>
            <div className="border-gray-200 border-2 my-1" />
            <div className="leading-relaxed text-sm">
              <ul className="list-disc list-inside mb-1 ml-2">
                {dam.url && (
                  <li>
                    <Link className="inline" size={"1rem"} />
                    &nbsp;
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
                  <MapPin className="inline" size={"1rem"} />
                  &nbsp;住所:&nbsp;
                  <a
                    href={`https://maps.google.com/maps?q=${dist.lat},${dist.lng}&hl=ja`}
                    target="_blank"
                    rel="noopener"
                    className="text-teal-600"
                  >
                    {dist.address}
                  </a>
                </li>
                {dist.is_weekend && (
                  <li>
                    <Calendar className="inline" size={"1rem"} />
                    &nbsp;週末配布
                  </li>
                )}
                {dist.is_multi && (
                  <li>
                    <Menu className="inline" size={"1rem"} />
                    &nbsp;複数のダムカード
                  </li>
                )}
              </ul>
              <div className="whitespace-pre break-words overflow-auto">
                {dist.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
