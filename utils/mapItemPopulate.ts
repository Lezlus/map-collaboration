import { ManifestFileUpload, MapItem, PublishedMap } from "@/types";
import { cdnStringifier } from "./cdnUrlStringifier";

export async function mapItemPopulate(data: PublishedMap[]): Promise<MapItem[]> {
  return await Promise.all<Promise<MapItem>>(data.map(async (map) => {
    const url = cdnStringifier(map.manifest_path);
    const data =  await fetch(url);
    const manifest = await data.json() as ManifestFileUpload;
    const mapImage = cdnStringifier(manifest.userDirectoryKey, manifest.mapJobDirectoryKey, manifest.mapImageKey);
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