import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { selectVideoElementId } from "@/store/timelineSlice";
import { OverlayMedia } from "@/types";

interface MediaPositionerProps {
  media: OverlayMedia;
  onPositionChange: (position: MediaPosition) => void;
  initialPosition?: MediaPosition;
}

export interface MediaPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

const MediaPositioner: React.FC<MediaPositionerProps> = ({
  media,
  onPositionChange,
  initialPosition,
}) => {
  const videoElementId = useSelector(selectVideoElementId);
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState<MediaPosition>(
    initialPosition || {
      x: 0,
      y: 0,
      width: 160,
      height: 90,
    }
  );

  useEffect(() => {
    const videoElement = document.getElementById(
      videoElementId!
    ) as HTMLVideoElement;
    if (videoElement && containerRef.current) {
      const rect = videoElement.getBoundingClientRect();
      const scale = 320 / rect.width;
      containerRef.current.style.width = "320px";
      containerRef.current.style.height = `${rect.height * scale}px`;

      if (!initialPosition) {
        setPosition({
          x: 32,
          y: rect.height * scale * 0.1,
          width: 160,
          height: 90,
        });
      }
    }
  }, [videoElementId, initialPosition]);

  const handleMouseDown = (e: React.MouseEvent, action: "drag" | "resize") => {
    e.preventDefault();
    e.stopPropagation();

    const container = containerRef.current!;
    const rect = container.getBoundingClientRect();
    const mediaRect = e.currentTarget.getBoundingClientRect();

    setStartPos({
      x: e.clientX,
      y: e.clientY,
    });

    if (action === "drag") setIsDragging(true);
    if (action === "resize") setIsResizing(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging && !isResizing) return;

    const container = containerRef.current!;
    const rect = container.getBoundingClientRect();
    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;

    if (isDragging) {
      const newX = position.x + deltaX;
      const newY = position.y + deltaY;

      // Constrain to container bounds
      const x = Math.max(0, Math.min(newX, rect.width - position.width));
      const y = Math.max(0, Math.min(newY, rect.height - position.height));

      setPosition((prev) => ({ ...prev, x, y }));
      setStartPos({ x: e.clientX, y: e.clientY });
    }

    if (isResizing) {
      // Calculate new dimensions
      const newWidth = Math.max(50, position.width + deltaX);
      const newHeight = Math.max(50, position.height + deltaY);

      // Constrain to container bounds
      const width = Math.min(newWidth, rect.width - position.x);
      const height = Math.min(newHeight, rect.height - position.y);

      setPosition((prev) => ({
        ...prev,
        width,
        height,
      }));

      setStartPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    if (isDragging || isResizing) {
      setIsDragging(false);
      setIsResizing(false);
      onPositionChange(position);
    }
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, position, startPos]);

  return (
    <div
      ref={containerRef}
      className="relative bg-black/50 rounded-lg overflow-hidden mx-auto"
      style={{ maxWidth: "320px" }}
    >
      <div
        className="absolute cursor-move"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${position.width}px`,
          height: `${position.height}px`,
        }}
      >
        {media.type.startsWith("video/") ? (
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={media.url}
            className="w-full h-full object-cover pointer-events-none"
            muted
          />
        ) : (
          <img
            ref={mediaRef as React.RefObject<HTMLImageElement>}
            src={media.url}
            className="w-full h-full object-cover pointer-events-none"
            alt="Overlay media"
          />
        )}

        {/* Drag handle */}
        <div
          className="absolute inset-0 bg-transparent border-2 border-white/50 rounded cursor-move"
          onMouseDown={(e) => handleMouseDown(e, "drag")}
        >
          {/* Resize handles */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-white/50 rounded-tl cursor-se-resize"
            onMouseDown={(e) => handleMouseDown(e, "resize")}
          />
          <div
            className="absolute top-0 left-0 w-4 h-4 bg-white/50 rounded-br cursor-nw-resize"
            onMouseDown={(e) => handleMouseDown(e, "resize")}
          />
          <div
            className="absolute top-0 right-0 w-4 h-4 bg-white/50 rounded-bl cursor-ne-resize"
            onMouseDown={(e) => handleMouseDown(e, "resize")}
          />
          <div
            className="absolute bottom-0 left-0 w-4 h-4 bg-white/50 rounded-tr cursor-sw-resize"
            onMouseDown={(e) => handleMouseDown(e, "resize")}
          />
        </div>
      </div>
    </div>
  );
};

export default MediaPositioner;
