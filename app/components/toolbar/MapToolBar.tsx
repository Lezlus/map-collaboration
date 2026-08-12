import { FaHandPaper, FaEraser, FaPen, FaRegImage } from "react-icons/fa";
import { IoTextSharp } from "react-icons/io5";
import { GiArrowCursor } from "react-icons/gi";
import { MapActionState } from "@/types";
import { IconType } from "react-icons";
import { TiLocation } from "react-icons/ti";

interface Tool {
  state: MapActionState;
  icon: IconType
}

export const tools: Tool[] = [
  {
    state: "DRAW",
    icon: FaPen,
  },
  {
    state: "ERASE",
    icon: FaEraser,
  },
  {
    state: "MOVE",
    icon: FaHandPaper,
  },
  {
    state: "SELECT",
    icon: GiArrowCursor,
  },
  {
    state: "TEXT",
    icon: IoTextSharp,
  },
  {
    state: "IMAGE PLACEMENT",
    icon: FaRegImage,
  },
  {
    state: "BLIP PLACEMENT",
    icon: TiLocation,
  }
];

export default function MapToolBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center select-none pointer-events-auto">
      {/* Container for floating popovers anchored directly above the bar */}
      <div className="relative w-full flex justify-center mb-3">
        {/* Children popovers will animate inside here */}
      </div>

      {/* Floating Toolbar Dock */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-neutral-900/90 border border-neutral-800/80 shadow-2xl backdrop-blur-md">
        {children}
      </div>
    </div>
  );
}