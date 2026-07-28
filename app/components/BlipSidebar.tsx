"use client"
import { motion } from "framer-motion"
import React, { useState } from "react"
import Image from "next/image"
import { FaFileAudio, FaFileVideo } from "react-icons/fa"

interface ImageFiles {
  file: File;
  url: string;
}

type AssetType = "AUDIO" | "VIDEO";

const acceptedImageFileTypes = ["image/png", "image/webp", "image/jpeg"];
const acceptedAudioFileTypes = ["audio/wav", "audio/mpeg"];
const acceptedVideoFileTypes = ["video/mp4", "video/quicktime"];

export default function BlipSidebar() {
  const [imageFiles, setImageFiles] = useState<ImageFiles[]>([]);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const newFiles = Array.from(droppedFiles);
      const imageFiles: ImageFiles[] = [];
      const filteredFiles = newFiles.filter(file => acceptedImageFileTypes.includes(file.type));
      filteredFiles.map(file => {
        const oUrl = URL.createObjectURL(file);
        imageFiles.push({
          file,
          url: oUrl,
        });
      });
      setImageFiles(prev => [...prev, ...imageFiles]);
    }
  };
  
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
    // const fileReader = new FileReader();
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const files = Array.from(selectedFiles);
      const imageFiles: ImageFiles[] = [];
      files.map(file => {
        const oUrl = URL.createObjectURL(file);
        imageFiles.push({
          file,
          url: oUrl,
        });
      });
      setImageFiles((prev) => [...prev, ...imageFiles]);
    }
  };

  const handleAssetDrop = (e: React.DragEvent<HTMLDivElement>, type: AssetType) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      const files = Array.from(droppedFiles);
      if (type === "AUDIO") {
        const filteredFiles = files.filter(file => acceptedAudioFileTypes.includes(file.type));
        setAudioFiles((prev) => [...prev, ...filteredFiles]);
      } else {
        const filteredFiles = files.filter(file => acceptedVideoFileTypes.includes(file.type));
        setVideoFiles((prev) => [...prev, ...filteredFiles]);
      }
    }
  };

  const handleAssetFileChange = (e: React.ChangeEvent<HTMLInputElement, HTMLInputElement>, type: AssetType) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const files = Array.from(selectedFiles);
      if (type === "AUDIO") {
        setAudioFiles((prev) => [...prev, ...files]);
      } else {
        setVideoFiles((prev) => [...prev, ...files]);
      }
    }
  };





  return (
    <>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{
          type: "spring",
          damping: 26,
          stiffness: 220
        }}
        className="fixed top-0 right-0 z-50 flex h-screen w-full flex-col border-l border-slate-800 bg-slate-950/95 p-6 shadow-2xl backdrop-blur-md sm:max-w-md"
      >
        <div className="flex flex-col gap-6 overflow-y-auto pr-1 pb-6 scrollbar">
          <div className="title-wrapper flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Trail Landmark Title
            </label>
            <input
              type="text"
              placeholder="e.g., Scenic Waterfall Overlook"
              className="w-full rounded-lg border border-slate-800 bg-slate-900/60"
            />
          </div>
          <div className="description-wrapper flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Your Experience / Notes
            </label>
            <textarea 
              rows={4}
              placeholder="Describe the trail conditions, wildlife sightings, or special memories here..." 
              className="w-full resize-none rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/80"
            />
          </div>
          {/* Media Sections Divider */}
          <div className="border-t border-slate-800/60 my-1"></div>

          {/* Image Drop Container */}
          <div 
            className="image-file-drop-container group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/20 p-5 text-center transition-all hover:border-indigo-500/50 hover:bg-slate-900/40 cursor-pointer"
            onDrop={handleImageDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            
            <div className="text-xs font-medium text-slate-300">📸 Drop or click to add photos</div>
            <p className="mt-1 text-[11px] text-slate-500">Supports JPEG, PNG up to 10MB</p>
            <input 
              type="file" 
              // hidden
              id="browse" 
              accept=".png, .jpg, .webp"
              multiple
              onChange={handleImageFileChange}
            />
            <label htmlFor="browse">Browse Files</label>
          </div>
          <div className="image-preview-list">
            {imageFiles.length > 0 && (
              <div className="flex w-full gap-3 overflow-x-auto pb-2.5 scrollbar">
                {imageFiles.map((img, idx) => (
                  <div key={idx} className="file-item flex w-24 shrink-0 flex-col gap-1 rounded-xl bg-slate-900/50 p-1.5 border border-slate-800/60">
                    <div className="image-preview-wrapper relative aspect-square w-full overflow-hidden rounded-lg bg-slate-950">
                      <Image width={100} height={100} src={img.url} alt={img.file.name} />
                    </div>
                    <div className="file-info text-slate-300 px-0.5">
                      <p className="text-[11px] font-medium truncate" title={img.file.name}>{img.file.name}</p>
                      <p className="text-[11px] font-medium truncate" title={img.file.type}>{img.file.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="border-t border-slate-800/60 my-1"></div>

          {/* Audio Drop Container */}
          <div 
            className="audio-file-drop-container group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/20 p-5 text-center transition-all hover:border-indigo-500/50 hover:bg-slate-900/40 cursor-pointer"
            onDrop={(e) => handleAssetDrop(e, "AUDIO")}
            onDragOver={(e) => {
              e.preventDefault();
            }}
          >
            <div className="text-xs font-medium text-slate-300">🎵 Drop or click to add voice logs/audio</div>
            <p className="mt-1 text-[11px] text-slate-500">Capture ambient nature sounds</p>
            <input
              type="file"
              id="browse-audio"
              multiple
              accept=".mp3, .wav, .m4a, .aac, .ogg, .wma"
              onChange={(e) => {
                handleAssetFileChange(e, "AUDIO")
              }}
            />
            <label htmlFor="browse-audio">Browse Files</label>
          </div>
          <div className="audio-preview-list">
            {audioFiles.length > 0 && (
              <div className="flex w-full gap-3 overflow-x-auto pb-2.5 scrollbar">
                {audioFiles.map((file, idx) => (
                  <div key={idx} className="file-item flex w-24 shrink-0 flex-col gap-1 rounded-xl bg-slate-900/50 p-1.5 border border-slate-800/60">
                    <div className="image-preview-wrapper relative aspect-square w-full overflow-hidden rounded-lg bg-slate-950">
                      <FaFileAudio size={3} />
                    </div>
                    <div className="file-info text-slate-300 px-0.5">
                      <p className="text-[11px] font-medium truncate" title={file.name}>{file.name}</p>
                      <p className="text-[11px] font-medium truncate" title={file.type}>{file.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Video Drop Container */}
          <div 
            className="video-file-drop-container group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/20 p-5 text-center transition-all hover:border-indigo-500/50 hover:bg-slate-900/40 cursor-pointer"
            onDrop={(e) => handleAssetDrop(e, "VIDEO")}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="text-xs font-medium text-slate-300">🎥 Drop or click to add trail videos</div>
            <p className="mt-1 text-[11px] text-slate-500">Share live-action trail views</p>
            <input
              type="file"
              id="browse-video"
              multiple
              accept=".mp4, .m4v, .mov, .mkv, .avi"
              onChange={(e) => {handleAssetFileChange(e, "VIDEO")}}
            />
            <label htmlFor="browse-video">Browse Files</label>
          </div>
          <div className="video-preview-list">
            {videoFiles.length > 0 && (
              <div className="flex w-full gap-3 overflow-x-auto pb-2.5 scrollbar">
                {videoFiles.map((file, idx) => (
                  <div key={idx} className="file-item flex w-24 shrink-0 flex-col gap-1 rounded-xl bg-slate-900/50 p-1.5 border border-slate-800/60">
                    <div className="image-preview-wrapper relative aspect-square w-full overflow-hidden rounded-lg bg-slate-950">
                      <FaFileVideo size={3} />
                    </div>
                    <div className="file-info text-slate-300 px-0.5">
                      <p className="text-[11px] font-medium truncate" title={file.name}>{file.name}</p>
                      <p className="text-[11px] font-medium truncate" title={file.type}>{file.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons Footer (Sticky at bottom) */}
        <div className="mt-auto border-t border-slate-800/80 pt-4 flex gap-3">
          <button className="flex-1 rounded-lg border border-slate-800 bg-transparent py-2 text-sm font-medium text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-colors">
            Cancel
          </button>
          <button className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-colors">
            Save Blip
          </button>
        </div>
      </motion.div>
    </>
  )
}