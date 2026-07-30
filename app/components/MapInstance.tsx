"use client";

import { MapInstanceItem } from "@/types";
import Link from "next/link";
import { dateFormatter } from "@/utils";

interface MapInstanceProps {
  mapInstanceItem: MapInstanceItem
}

export default function MapInstance(props: MapInstanceProps) {
  const { mapInstanceItem } = props;
  return (
    <div
      key={mapInstanceItem.id}
      className="cursor-pointer bg-neutral-900/50 border border-neutral-800/80 hover:border-neutral-700 rounded-lg p-4 transition-all duration-150 flex items-center justify-between"
    >
      <div className="flex items-center space-x-3 truncate">
        {/* Status Indicator Dot */}
        <div className="truncate">
          <h3 className="text-sm font-medium text-neutral-200 truncate">
            {mapInstanceItem.instanceName}
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Updated {dateFormatter(mapInstanceItem.updatedAt)}
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">
            {/* Include a link to  */}
            Original Creator: <Link href={`/user-creations/${mapInstanceItem.authorId}`}><span className="text-[#e5484d] cursor-pointer">{mapInstanceItem.authorName}</span></Link>
          </p>
        </div>
      </div>
      </div>
  )
}