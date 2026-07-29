"use client";
import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import NextImage from "next/image"
import { v4 as uuidv4 } from "uuid";
import { uploadMap } from "@/app/actions/upload-map";
import { useJobs } from "@/app/context/MapJobContext";
import { stringifiedBytes } from "@/utils";
import { fromArrayBuffer } from "geotiff";

const MB_SIZE_BYTES = 1048576
const GB_SIZE_BYTES = 1073741824
const PNG_WEBP_LIMIT = 50 * MB_SIZE_BYTES;
const JPG_LIMIT = 25 * MB_SIZE_BYTES;
const TIFF_LIMIT = 500 * MB_SIZE_BYTES;

interface ImageFiles {
  file: File;
  url?: string;
  width: number;
  height: number;
  size: number;
  type: AcceptedFileTypes;
}
const acceptedImageFileTypes = ["image/png", "image/webp", "image/jpeg", "image/tiff"];
type AcceptedFileTypes = "image/png" | "image/webp" | "image/jpeg" | "image/tiff";

const fileSizeLimitCheck = (bytes: number, mimetype: AcceptedFileTypes): boolean => {
  if (mimetype === "image/png" || mimetype === "image/webp") {
    return bytes <= PNG_WEBP_LIMIT;
  } else if (mimetype === "image/jpeg") {
    return bytes <= JPG_LIMIT;
  } else if (mimetype === "image/tiff") {
    return bytes <= TIFF_LIMIT;
  }
  return false;
}

const errorString = (type: AcceptedFileTypes): string => {
  switch (type) {
    case "image/jpeg":
      return `Exceeds Max JPG Size of ${stringifiedBytes(JPG_LIMIT)}`;
    case "image/png":
    case "image/webp":
      return `Exceeds Max PNG/WebP Size of ${stringifiedBytes(PNG_WEBP_LIMIT)}`;
    case "image/tiff":
      return `Exceeds Max TIFF Size of ${stringifiedBytes(TIFF_LIMIT)}`;
  }
}

interface CreateMapModalProps {
  handleCloseModal: () => void;
}

function CreateMapModal(props: CreateMapModalProps) {

  const { handleCloseModal } = props;

  const [imageFile, setImageFile] = useState<ImageFiles>();
  const [mapName, setMapName] = useState("");
  const [fileSizeWarning, setFileSizeWarning] = useState<string | null>(null);
  const [mapDescription, setMapDescription] = useState<string>("");
  const { setActiveJob } = useJobs();

  const addImage = async (file: File, fileType: AcceptedFileTypes) => {
    if (fileType === "image/tiff") {
      const buffer = await file.arrayBuffer();
      const tiff = await fromArrayBuffer(buffer);
      const image = await tiff.getImage();
      setImageFile({
        file,
        height: image.getHeight(),
        width: image.getWidth(),
        size: file.size,
        type: fileType,
      })
    } else {
      const objectURL = URL.createObjectURL(file);
      const image = new Image();
      image.src = objectURL;
      image.onload = (() => {
        const height = image.height;
        const width = image.width;
        const size = file.size;
        setImageFile({
          file,
          url: objectURL,
          height,
          width,
          size,
          type: fileType,
        })
      })
    }
  }
  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const newFiles = Array.from(droppedFiles);
      const filteredFiles = newFiles.filter(file => acceptedImageFileTypes.includes(file.type));
      const filteredFile = filteredFiles[0];
    
      const fileType = filteredFile.type as AcceptedFileTypes;
      if (!fileSizeLimitCheck(filteredFile.size, fileType)) {
        const error = errorString(fileType);
        setFileSizeWarning(error);
      } else {
        addImage(filteredFile, fileType);
      }
    }
  }

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const file = Array.from(selectedFiles)[0];
      if (!acceptedImageFileTypes.includes(file.type)) {
        return;
      }
      const fileType = file.type as AcceptedFileTypes;
      if (!fileSizeLimitCheck(file.size, fileType)) {
        const error = errorString(fileType);
        setFileSizeWarning(error);
      } else {
        if (fileSizeWarning) {
          setFileSizeWarning(null);
        }
        addImage(file, fileType);
      }
    }
  }

  const handleCreateMapClick = async () => {
    if (mapName && imageFile) {
      const map_job_id = uuidv4();
      const validDescription = mapDescription.trim().replaceAll(" ", "").length > 4;
      const response = await uploadMap({
        mapJobId: map_job_id,
        mapName,
        image: imageFile.file,
        imageHeight: imageFile.height,
        imageSize: imageFile.size,
        imageWidth: imageFile.width,
        description: validDescription ? mapDescription : null,
      });
      if (response.success && response.map_job) {
        setActiveJob({ mapName, jobId: map_job_id })
        setTimeout(() => {
          handleCloseModal();
        }, 1500);
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={handleCloseModal}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl transition-all space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <h3 className="text-xl font-bold text-white tracking-tight">
            Create Map
          </h3>
          <button 
            onClick={handleCloseModal}
            className="text-neutral-400 hover:text-white transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Map Name Input */}
        <div>
          <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
            Map Name
          </label>
          <input
            type="text"
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
            placeholder="e.g. World Fantasy Map"
            className="w-full rounded-lg border border-neutral-800 bg-neutral-950/60 px-3.5 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:border-[#e5484d] focus:outline-none focus:ring-1 focus:ring-[#e5484d] transition-all"
          />
        </div>

        {/* Drag & Drop Area */}
        <div>
          <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
            Map Image
          </label>
          <div 
            className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-800 bg-neutral-950/40 p-6 text-center transition-all hover:border-[#e5484d]/50 hover:bg-neutral-950/80 cursor-pointer"
            onDrop={handleImageDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="text-2xl mb-1">📸</div>
            <div className="text-xs font-medium text-neutral-200">
              Drop your image here or <label htmlFor="browse" className="text-[#e5484d] hover:underline cursor-pointer font-semibold">Browse</label>
            </div>
            <p className="mt-1 text-[11px] text-neutral-500">
              Supports PNG, JPG, WebP, TIFF, and GEOTIFF
            </p>
            <input 
              type="file" 
              id="browse" 
              accept=".png, .jpg, .webp, .tif"
              className="hidden"
              multiple
              onChange={handleImageFileChange}
            />
          </div>
        </div>
        {/* Error Message */}
        <div className="error-message-wrapper">
          <p className="text-red-600">{fileSizeWarning}</p>
        </div>
        {/* Image Preview & Details */}
        {imageFile && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 flex gap-3.5 items-center">
            <div className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-900 border border-neutral-800">
              { imageFile.type !== "image/tiff" && (
                <NextImage 
                  fill 
                  src={imageFile.url ?? ""} 
                  alt={imageFile.file.name} 
                  className="object-cover"
                />
              )}
            </div>
            
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-xs font-semibold text-neutral-200 truncate" title={imageFile.file.name}>
                {imageFile.file.name}
              </p>
              
              {/* Badges for metadata */}
              <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-neutral-400">
                <span className="bg-neutral-800/80 px-2 py-0.5 rounded border border-neutral-700/50">
                  {imageFile.width}x{imageFile.height} px
                </span>
                <span className="bg-neutral-800/80 px-2 py-0.5 rounded border border-neutral-700/50">
                  {stringifiedBytes(imageFile.size)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Description Input */}
        <div>
          <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
            Description
          </label>
          <textarea
            placeholder="Write a meaningful description..."
            value={mapDescription}
            onChange={(e) => setMapDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-950/60 px-3.5 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:border-[#e5484d] focus:outline-none focus:ring-1 focus:ring-[#e5484d] transition-all resize-none"
          />
        </div>

        {/* Modal Actions */}
        <div className="pt-2 border-t border-neutral-800 flex gap-3">
          <button 
            type="button"
            onClick={handleCloseModal} 
            className="flex-1 rounded-lg border border-neutral-800 bg-transparent py-2.5 text-sm font-semibold text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            Cancel
          </button>
          
          <button 
            type="button"
            onClick={handleCreateMapClick} 
            disabled={!imageFile || !mapName} 
            className="flex-1 rounded-lg bg-[#e5484d] py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#e5484d]/20 hover:bg-[#d03e43] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#e5484d] transition-all"
          >
            Create Map
          </button>
        </div>

      </div>
    </div>
  )
}

export default function CreateNewMapButton() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="new-map-button">
      <button onClick={() => setModalOpen(prev => !prev)}>New Map <FaPlus scale={1} size={2} /></button>
      {modalOpen && <CreateMapModal handleCloseModal={() => setModalOpen(false)} />}
    </div>
  )
}