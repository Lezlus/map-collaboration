"use server";

import { MapItem, MapInstanceItem } from "@/types";
import { getUserPublishedMaps, getUserMapInstances, getUser } from "../actions/user-data";
import { ManifestFileUpload } from "@/types";
import Image from "next/image";
import { dateFormatter } from "@/utils";
import Link from "next/link";

export default async function UserCreations({ params }: { params: Promise<{id: string}> }) {
  const { id } = await params;

  const userResponse = await getUser(id);
  if (!userResponse.success || !userResponse.user) {
    return (
      <div>
        <span>{"User Doesn't Exist"}</span>
      </div>
    )
  }

  const publishedMaps = await getUserPublishedMaps(id);
  let publishedMapItems: MapItem[] = [];
  if (publishedMaps.maps) {
      publishedMapItems = await Promise.all<Promise<MapItem>>(publishedMaps.maps.map(async (map) => {
        const url = `https://${process.env.CDN}/${map.manifest_path}`;
        const data =  await fetch(url);
        const manifest = await data.json() as ManifestFileUpload;
        const mapImage = `https://${process.env.CDN}/${manifest.userDirectoryKey}/${manifest.mapJobDirectoryKey}/${manifest.mapImageKey}`;
        return {
          mapName: manifest.mapName,
          imageUrl: mapImage,
          id: map.id,
          description: map.description,
          createdAt: map.createdAt,
          authorId: map.user?.id ?? "",
          authorName: (map.user?.username ?? map.user?.name) ?? "No Name",
        }
      }))
    }

  const mapInstances = await getUserMapInstances(id);
  const mapInstanceItems: MapInstanceItem[] = [];
  
  if (mapInstances.map_instances) {
    for (const mapInstance of mapInstances.map_instances) {
      if (mapInstance.visible) {
        mapInstanceItems.push({
          instanceName: mapInstance.name ?? "Unamed Map",
          id: mapInstance.id,
          updatedAt: mapInstance.updatedAt,
          visible: mapInstance.visible,
          authorId: mapInstance.user?.id ?? "",
          authorName: (mapInstance.user?.username ?? mapInstance.user?.name) ?? "No Name"
        })
      }
    }
  }

  const displayName = (userResponse.user.username ?? userResponse.user.name) ?? "Unknown User"

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-neutral-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-12">
        <h1>{displayName}</h1>
        {/* SECTION 1: Published Maps */}
        <section>
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-neutral-800">
            <h1 className="text-2xl font-bold tracking-tight">Published Maps</h1>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#e5484d]/10 text-[#e5484d] border border-[#e5484d]/20">
              {publishedMapItems.length} Available
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {publishedMapItems.map((mapItem) => (
              <div
                key={mapItem.id}
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
                      By <span className="text-neutral-200 font-medium">{displayName}</span>
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
              </div>
            ))}
          </div>
        </section>

        {/* SECTION DIVIDER */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-neutral-800" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[#1a1a1a] px-4 text-xs font-medium uppercase tracking-widest text-neutral-500">
              Active Instances
            </span>
          </div>
        </div>

        {/* SECTION 2: Map Instances */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mapInstanceItems.map((mapItem) => (
              <div
                key={mapItem.id}
                className="cursor-pointer bg-neutral-900/50 border border-neutral-800/80 hover:border-neutral-700 rounded-lg p-4 transition-all duration-150 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3 truncate">
                  {/* Status Indicator Dot */}
                  <div className="truncate">
                    <h3 className="text-sm font-medium text-neutral-200 truncate">
                      {mapItem.instanceName}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Updated {dateFormatter(mapItem.updatedAt)}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {/* Include a link to  */}
                      Original Creator: <Link href={`/user-creations/${mapItem.authorId}`}><span className="text-[#e5484d] cursor-pointer">{mapItem.authorName}</span></Link>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )

}