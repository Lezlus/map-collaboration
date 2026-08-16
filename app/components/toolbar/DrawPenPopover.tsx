"use client"
import { motion } from "framer-motion"
import { Circle, ColorResult } from "@uiw/react-color"
import { ChangeEvent } from "react"

interface DrawPenPopoverProps {
  hex: string;
  size: number;
  handlePenColorChange: (color: ColorResult) => void;
  handlePenSizeChange: (e: ChangeEvent<HTMLInputElement, HTMLInputElement>) => void;
}

export default function DrawPenPopover(props: DrawPenPopoverProps) {
  const { hex, size, handlePenColorChange, handlePenSizeChange } = props;
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-20">
      <motion.div
        initial={{ opacity: 0, scale: 0, y: "100%" }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0, y: "100%" }}
        transition={{
          duration: 0.4,
          scale: { duration: 0.4, ease: "easeInOut"},
        }}
      >
        <div className="rounded-3xl w-64 bg-white shadow-lg p-4">
          <div className="pen-color-circle-container">
            <Circle 
              colors={['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5']}
              onChange={handlePenColorChange}
              color={hex}
            />
          </div>
          <div className="pen-size-container">
            <input onChange={handlePenSizeChange} value={size} type="range" min={2} max={10} />
          </div>
        </div>
      </motion.div>
    </div>
  )
}