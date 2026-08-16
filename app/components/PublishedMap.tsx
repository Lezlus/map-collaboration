"use client";

import { MapItem, MapUpdate } from "@/types";
import Image from "next/image";
import { dateFormatter } from "@/utils";
import { createMapInstance } from "../actions/map-instance-actions";
import { authClient } from "../lib/auth-client";
import { useState } from "react";
import { BsThreeDots } from "react-icons/bs";
import Modal from "./Modal";
import { updateMap } from "../actions/map-actions";

interface PublishedMapProps {
  mapItem: MapItem;
}

interface MapEditModal extends PublishedMapProps {
  handleModalClose: () => void;
}

const MapEditModal = (props: MapEditModal) => {
  const { mapItem, handleModalClose } = props;
  const [error, setError] = useState<string | null>(null);

  const submitForm = async (formData: FormData) => {
    const name = formData.get("name");
    const description = formData.get("description");
    const mapUpdate: MapUpdate = {
      id: mapItem.id,
      user_id: mapItem.authorId,
    };
    if (typeof name === "string" && name.trim() !== "") {
      mapUpdate.name = name.valueOf() as string;
    }
    if (typeof description === "string" && description.trim() !== "") {
      mapUpdate.description = description.valueOf() as string;
    }
    if (!name && !description) {
      setError("At least one input field must be set");
      return;
    }
    const res = await updateMap(mapUpdate);
    if (res.success) {
      handleModalClose();
    } else {
      setError("Error Submitting Data");
    }
  }

  return (
    <div className="w-full">
      <form action={submitForm} className="space-y-4">
        <div className="flex flex-col space-y-1.5">
          <label
            htmlFor="name"
            className="text-xs font-medium text-neutral-400 uppercase tracking-wider"
          >
            Map name
          </label>
          <input
            id="name"
            type="text"
            name="name"
            defaultValue={mapItem.mapName}
            placeholder="Enter Map name..."
            className="w-full bg-[#1a1a1a] border border-neutral-800 text-neutral-100 text-sm rounded-md px-3 py-2 outline-none transition-colors focus:border-[#e5484d] focus:ring-1 focus:ring-[#e5484d] placeholder:text-neutral-600"
          />
        </div>
        <div className="flex items-center space-x-3 pt-1">
          <label
            htmlFor="description"
            className="text-xs font-medium text-neutral-400 uppercase tracking-wider"
          >
            Description
          </label>
          <input
            id="description"
            type="text"
            name="description"
            defaultValue={mapItem.description ?? ""}
            placeholder="Enter description..."
            className="w-full bg-[#1a1a1a] border border-neutral-800 text-neutral-100 text-sm rounded-md px-3 py-2 outline-none transition-colors focus:border-[#e5484d] focus:ring-1 focus:ring-[#e5484d] placeholder:text-neutral-600"
          />
        </div>
        {error && (
          <div className="pt-1">
            <p className="text-xs font-medium text-[#e5484d] bg-[#e5484d]/10 border border-[#e5484d]/20 px-2.5 py-1.5 rounded-md flex items-center space-x-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#e5484d] shrink-0" />
              <span>{error}</span>
            </p>
          </div>
        )}
        {/* Submit Action Button */}
        <div className="pt-2 flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => handleModalClose()}
            className="px-3.5 py-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-200 bg-transparent rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 text-xs font-medium text-white bg-[#e5484d] hover:bg-[#e5484d]/90 active:scale-[0.98] rounded-md shadow-sm transition-all"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  )
}

export default function PublishedMap(props: PublishedMapProps) {
  const { mapItem } = props;
  const [modalOpen, setModalOpen] = useState(false);
  const session = authClient.useSession();

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
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
        <div className="flex flex-row-reverse justify-between items-center mx-4 p-3">
          {(session.data?.user.id === mapItem.authorId) && (
            <>
              <div className="edit-icon-wrapper" onClick={(e) => { e.stopPropagation(); setModalOpen(true) }}>
                <BsThreeDots />
              </div>
              <Modal
                title="Edit"
                handleCloseModal={() => setModalOpen(false)}
                isOpen={modalOpen}
              >
                <MapEditModal mapItem={mapItem} handleModalClose={() => setModalOpen(false)} />
              </Modal>
            </>
          )}
          {/* Create Instnace Button */}
          {session.data?.user && (
            <div>
              <button onClick={() => handleCreateMapInstanceButtonClick()}>Create Instace</button>
            </div>
          )}
        </div>
    </div>
  )
}