"use client";

import { MapInstanceItem, MapInstanceUpdate } from "@/types";
import Link from "next/link";
import { dateFormatter } from "@/utils";
import Modal from "./Modal";
import { MouseEvent, useState } from "react";
import { BsThreeDots } from "react-icons/bs";
import { updateMapInstance } from "../actions/map-instance-actions";
import { authClient } from "../lib/auth-client";
import { useRouter } from "next/navigation";

interface MapInstanceProps {
  mapInstanceItem: MapInstanceItem
}

interface MapInstanceEditModal extends MapInstanceProps {
  handleModalClose: () => void;

}

const MapInstanceEditModal = (props: MapInstanceEditModal) => {
  const { handleModalClose, mapInstanceItem } = props;
  const [error, setError] = useState<string | null>(null);

  const submitForm = async (formData: FormData) => {
    const instanceName = formData.get("instanceName");
    const visible = formData.get("visible")
    const mapInstanceUpdate: MapInstanceUpdate = {
      user_id: mapInstanceItem.authorId,
      id: mapInstanceItem.id,
    }
    if (typeof instanceName === "string" && instanceName.trim() !== "") {
      mapInstanceUpdate.name = instanceName.valueOf() as string;
    }
    if (visible !== null) {
      mapInstanceUpdate.visible = visible === "on" || visible === "true" || visible === "1"; 
    }
    const res = await updateMapInstance(mapInstanceUpdate);
    if (res.success) {
      handleModalClose();
    } else { 
      // Display some error
      setError("Error Submitting Data");
    }
  }

  return (
  <div className="w-full">
    <form action={submitForm} className="space-y-4">
      {/* Map Instance Name Input */}
      <div className="flex flex-col space-y-1.5">
        <label 
          htmlFor="instanceName" 
          className="text-xs font-medium text-neutral-400 uppercase tracking-wider"
        >
          Instance Name
        </label>
        <input
          id="instanceName"
          type="text"
          name="instanceName"
          defaultValue={mapInstanceItem.instanceName}
          placeholder="Enter map name..."
          className="w-full bg-[#1a1a1a] border border-neutral-800 text-neutral-100 text-sm rounded-md px-3 py-2 outline-none transition-colors focus:border-[#e5484d] focus:ring-1 focus:ring-[#e5484d] placeholder:text-neutral-600"
        />
      </div>

      {/* Visibility Checkbox */}
      <div className="flex items-center space-x-3 pt-1">
        <input
          id="visible"
          type="checkbox"
          name="visible"
          defaultChecked={mapInstanceItem.visible}
          className="h-4 w-4 rounded bg-[#1a1a1a] border-neutral-700 text-[#e5484d] focus:ring-[#e5484d] focus:ring-offset-neutral-900 accent-[#e5484d] cursor-pointer"
        />
        <label 
          htmlFor="visible" 
          className="text-sm text-neutral-300 font-medium cursor-pointer select-none"
        >
          Make map instance visible
        </label>
      </div>

      {/* Inline Error Message */}
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

export default function MapInstance(props: MapInstanceProps) {
  const router = useRouter();
  const { mapInstanceItem } = props;
  const [modalOpen, setModalOpen] = useState(false);
  const session = authClient.useSession();
  
  const handleClickMapInstance = () => {
    router.push(`map/${mapInstanceItem.id}`);
  }

  return (
    <div
      key={mapInstanceItem.id}
      onClick={() => handleClickMapInstance()}
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
      {/* 3 dots Icon */}
      {(session.data?.user.id === mapInstanceItem.authorId) && (
        <>
          <div className="edit-icon-wrapper" onClick={(e) => { e.stopPropagation();setModalOpen(true) }}>
            <BsThreeDots />
          </div>
          <Modal
            title="Edit"
            handleCloseModal={() => setModalOpen(false)}
            isOpen={modalOpen}
          >
            <MapInstanceEditModal mapInstanceItem={mapInstanceItem} handleModalClose={() => setModalOpen(false)} />
          </Modal>
        </>
      )}
    </div>
  )
}