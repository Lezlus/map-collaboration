"use client";
import "../../../styles/toolbar.css";
import Moveable from "react-moveable";
import { useRef, useState, useEffect, MouseEvent } from 'react';
import { TextBoxInfo, Coordinate } from "@/types";
type TextBoxState = "NONE" | "TRANSFORM" | "EDIT";

interface TextBoxProps extends TextBoxInfo {
  handleOutSideClick: (text: string, id: string, position: Coordinate | null) => void;
}

export default function TextBox(props: TextBoxProps) {
  const { handleOutSideClick, id, text, position } = props;
  const dragEndPositionRef = useRef<Coordinate>(null);
  const textBoxContainerRef = useRef<HTMLDivElement>(null);
  const textboxInputRef = useRef<HTMLInputElement>(null);
  const [textBoxState, setTextBoxState] = useState<TextBoxState>("TRANSFORM");
  const [currentText, setCurrentText] = useState(text);
  const [dragEndPosition, setDragEndPosition] = useState<Coordinate>(position);

  const latestData = useRef({ currentText, id, handleOutSideClick });

  useEffect(() => {
    latestData.current = { currentText, id, handleOutSideClick };
  },[currentText, id, handleOutSideClick]);

  useEffect(() => {
    if (!dragEndPosition) return;
    dragEndPositionRef.current = dragEndPosition;
  }, [dragEndPosition]);

  useEffect(() => {
    const handleGlobalClick = (e: PointerEvent) => {
      if (!textBoxContainerRef) return;
      const targetNode = e.target as Node;
      const clickedInsideBox = textBoxContainerRef.current?.contains(targetNode);
      const clickedMoveableControl = targetNode instanceof HTMLElement && (
        targetNode.closest(".moveable-control-box") || targetNode.className.toString().includes("moveable-")
      );

      if (clickedInsideBox || clickedMoveableControl) {
        // Stop parent document click listener from running
        // e.stopImmediatePropagation()
        setTextBoxState((prev) => {
          if (prev === "EDIT") return "TRANSFORM";
          if (prev === "TRANSFORM") return "EDIT";
          return "TRANSFORM";
        });
      } else {
        const { currentText, id, handleOutSideClick } = latestData.current;
        setTextBoxState("NONE");
        handleOutSideClick(currentText, id, dragEndPositionRef.current);
      }
    };
    // Mount this event listener within a macrotask meaning it will be mounted
    // last in the call stack
    const timeout = setTimeout(() => {
      document.addEventListener("click", handleGlobalClick);
    }, 0);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener("click", handleGlobalClick);
    }
  }, []);

  useEffect(() => {
    if (!textboxInputRef.current) return;
    if (textBoxState === "EDIT") {
      textboxInputRef.current.focus();
    } else {
      textboxInputRef.current.blur();
    }
  }, [textBoxState]);

  const handleInputClick = (e: MouseEvent<HTMLInputElement>) => {
    if (textBoxState === "EDIT") {
      e.stopPropagation();
    }
  }

  return (
    <>
      <div
        ref={textBoxContainerRef}
        className="textbox-container"
        style={{ outline: textBoxState === "EDIT" ? "2px dashed #a5b4fc" : "none" }}
      >
        <input
          ref={textboxInputRef}
          onClick={handleInputClick}
          className="textbox-input"
          type="text"
          onChange={(e) => setCurrentText(e.target.value)}
          value={currentText}
          style={{
            // Turn pointer events OFF when moving, turn them ON when editing
            pointerEvents: textBoxState === "EDIT" ? "auto" : "none",
          }}
        />
      </div>
      <Moveable
        onDragEnd={(e) => {
          const rectBoundingBox = e.target.getBoundingClientRect();
          const x = rectBoundingBox.left + rectBoundingBox.width / 2;
          const y = rectBoundingBox.top + rectBoundingBox.height / 2;
          setDragEndPosition({ x, y });
        }}
        target={textBoxContainerRef}
        draggable={textBoxState === "TRANSFORM"}
        scalable={textBoxState === "TRANSFORM"}
        rotatable={textBoxState === "TRANSFORM"}
        keepRatio={true}
        throttleScale={0}
        throttleDrag={1}
        edgeDraggable={false}
        startDragRotate={0}
        throttleDragRotate={0}
        renderDirections={["nw", "n", "ne", "w", "e", "sw", "s", "se"]}
        onDrag={(e) => {
          e.target.style.transform = e.transform;
        }}
        onScale={(e) => {
          e.target.style.transform = e.drag.transform;
        }}
      />
    </>
  )

}