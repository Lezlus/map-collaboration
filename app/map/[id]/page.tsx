"use server";

import { getMapInstance } from "@/app/actions/map-instance-actions";
import { notFound } from "next/navigation";
import { ManifestFile } from "@/types";
import { cdnStringifier } from "@/utils/cdnUrlStringifier";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const getMapResponse = await getMapInstance(id);
  if (!getMapResponse.success || !getMapResponse.data) {
    notFound();
  }
  if (!getMapResponse.data.map || !getMapResponse.data.user) {
    notFound();
  }
  const manifestUrl = cdnStringifier(getMapResponse.data.map.manifest_path);
  const manifest = await fetch(manifestUrl);
  const manifestData = await manifest.json() as ManifestFile;


}