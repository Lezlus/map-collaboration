"use client";

import { MapItem } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { dateFormatter } from "@/utils";
import { createMapInstance } from "../actions/map-instance-actions";

interface PublishedMapProps {
  mapItem: MapItem;
}

export default function PublishedMap(props: PublishedMapProps) {
  const { mapItem } = props;

  const handleCreateMapInstanceButtonClick = async () => {
    await createMapInstance(mapItem.id, mapItem.mapName);
  }

  return (
    <div
      className="group relative bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 rounded-xl overflow-hidden shadow-lg transition-all duration-200 hover:-translate-y-1 flex flex-col"
    >
      {/* Image Section */}
        <div className="relative w-full aspect-video bg-neutral-950 overflow-hidden">
          <Image
            loading="eager"
            src={mapItem.imageUrl}
            fill
            alt={mapItem.mapName}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent opacity-60" />
        </div>

        {/* Content Section */}
        <div className="p-4 flex flex-col justify-between flex-grow space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-white truncate group-hover:text-[#e5484d] transition-colors">
              {mapItem.mapName}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              By <span className="text-neutral-200 font-medium">{mapItem.authorName}</span>
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white truncate group-hover:text-[#e5484d] transition-colors">
              Description
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              {mapItem.description}
            </p>
          </div>
          <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500">
            <span>Created</span>
            <time className="font-mono text-neutral-400">{dateFormatter(mapItem.createdAt)}</time>
          </div>
        </div>
        {/* Create Instnace Button */}
        <div>
          <button onClick={() => handleCreateMapInstanceButtonClick()}>Create Instace</button>
        </div>
    </div>
  )
}