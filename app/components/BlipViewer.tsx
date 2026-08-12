"use client";
import { motion } from "framer-motion";
import { BlipFeatureExtraProperties } from "@/types/frontend";
import Image from "next/image";

interface BlipViewerProps {
  blip: BlipFeatureExtraProperties;
  onClose: () => void;
}

export default function BlipViewer(props: BlipViewerProps) {
  const { blip, onClose } = props;
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
      className="fixed top-0 right-0 z-999 flex h-screen w-full flex-col p-6 sm:max-w-md"
    >

      <aside className="w-80 sm:w-96 bg-neutral-900 border-l border-neutral-800 h-full flex flex-col shadow-2xl text-neutral-100 select-none">
        {/* Sidebar Header */}
        <div className="p-5 border-b border-neutral-800 flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#e5484d]/10 text-[#e5484d] border border-[#e5484d]/20 uppercase">
                {blip.type || "BLIP"}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight truncate" title={blip.title}>
              {blip.title || "Untitled Blip"}
            </h2>
            <h2 className="text-xl font-bold text-white tracking-tight truncate" title={blip.title}>
              User {blip.username}
            </h2>
          </div>

          {onClose && (
            <button
              onClick={() => onClose()}
              className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
              aria-label="Close viewer"
            >
              Close
            </button>
          )}
        </div>

        {/* Main Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-neutral-800">
          
          {/* Images Section */}
          {blip.images.length > 0 ? (
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Media ({blip.images.length})
              </label>
              
              {/* Horizontal scroll for multiple images */}
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-neutral-800 snap-x">
                {blip.images.map((imgUrl, index) => (
                  <div
                    key={index}
                    className="relative aspect-video w-full shrink-0 snap-center rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 group"
                  >
                    <Image
                      src={imgUrl}
                      alt={`image ${index + 1}`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-950/40 p-6 text-center text-xs text-neutral-500">
              No attached images
            </div>
          )}

          {/* Description Section */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Description
            </label>
            <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-4">
              <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">
                {blip.description || "No description provided for this blip."}
              </p>
            </div>
          </div>

        </div>

        {/* Footer / Context Bar */}
        <div className="p-4 border-t border-neutral-800 text-center">
          <p className="text-[11px] text-neutral-500">
            Map Collaboration &bull; Blip Viewer
          </p>
        </div>

      </aside>
    </motion.div>
  </>
  )
}