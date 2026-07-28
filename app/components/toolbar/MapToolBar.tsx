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
    <div className="absolute justify-between p-2 rounded-md flex mb-2 bottom-0 left-1/2 z-10 w-80 bg-gray-700">
      { children }
    </div>
  )
}