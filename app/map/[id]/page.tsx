"use server";

import { getMapInstance } from "@/app/actions/map-instance-actions";
import { notFound } from "next/navigation";
import { ManifestFile, SessionUser } from "@/types";
import { cdnStringifier } from "@/utils/cdnUrlStringifier";
import Map from "../Map";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { zodValidator } from "@/utils";

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
  
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const user = zodValidator(SessionUser, session?.user);

  return (
    <Map user={user} mapData={getMapResponse.data} manifestFile={manifestData} />
  )
}