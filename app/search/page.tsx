import { MapInstanceItem, MapItem } from "@/types";
import { search } from "../actions/search";
import MapInstance from "../components/MapInstance";
import PublishedMap from "../components/PublishedMap";
import { mapItemPopulate } from "@/utils";

export default async function Search(props: {
  searchParams?: Promise<{
    query?: string;
  }>;
}) {
  const params = await props.searchParams;
  const query = params?.query || "";

  const searchResults = await search(query);
  if (!searchResults.success) {
    return <div>Error</div>
  }

  const mapItems: MapItem[] = await mapItemPopulate(searchResults.publishedMaps);
  const mapInstanceItems: MapInstanceItem[] = [];

  for (const mapInstanceItem of searchResults.mapInstances) {
    if (mapInstanceItem.visible) {
      mapInstanceItems.push({
          instanceName: mapInstanceItem.name ?? "Unamed Map",
          id: mapInstanceItem.id,
          updatedAt: mapInstanceItem.updatedAt,
          visible: mapInstanceItem.visible,
          authorId: mapInstanceItem.user?.id ?? "",
          authorName: (mapInstanceItem.user?.username ?? mapInstanceItem.user?.name) ?? "No Name"
      })
    }
  }
  const totalResults = mapInstanceItems.length + mapItems.length;
return (
    <div className="min-h-screen bg-[#1a1a1a] text-neutral-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Search Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-1">
              Search Results
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              Showing matches for: <span className="text-[#e5484d]">{query}</span>
            </h1>
          </div>
          <div className="shrink-0">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300">
              <strong className="text-[#e5484d]">{totalResults}</strong> {totalResults === 1 ? 'Result' : 'Results'} Found
            </span>
          </div>
        </div>

        {/* SECTION 1: Published Maps Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Published Maps</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#e5484d]/10 text-[#e5484d] border border-[#e5484d]/20">
                {mapItems?.length || 0}
              </span>
            </h2>
          </div>

          {mapItems && mapItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mapItems.map((row) => (
                <PublishedMap key={row.id} mapItem={row} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-8 text-center text-neutral-500 text-sm">
              No published maps found matching {query}.
            </div>
          )}
        </section>

        {/* SECTION DIVIDER */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-neutral-800" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[#1a1a1a] px-4 text-xs font-medium uppercase tracking-widest text-neutral-500">
              Map Instances
            </span>
          </div>
        </div>

        {/* SECTION 2: Map Instances Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Active Instances</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700/50">
                {mapInstanceItems?.length || 0}
              </span>
            </h2>
          </div>

          {mapInstanceItems && mapInstanceItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mapInstanceItems.map((row) => (
                <MapInstance key={row.id} mapInstanceItem={row} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-8 text-center text-neutral-500 text-sm">
              No active map instances found matching {query}.
            </div>
          )}
        </section>

      </div>
    </div>
  );
}