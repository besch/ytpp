import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { selectVideoElementId } from "@/store/timelineSlice";
import { OverlayMedia } from "@/types";
import config from "@/lib/config";
import { getMediaUrl } from "@/lib/api";

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
  const [resizeDirection, setResizeDirection] = useState<string>("");
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState<MediaPosition>(
    initialPosition || {
      x: 32,
      y: 18,
      width: 160,
      height: 90,
    }
  );
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  useEffect(() => {
    if (initialPosition) {
      setPosition(initialPosition);
    }
  }, [initialPosition]);

  useEffect(() => {
    const videoElement = document.getElementById(
      videoElementId!
    ) as HTMLVideoElement;
    if (videoElement && containerRef.current) {
      const rect = videoElement.getBoundingClientRect();
      const scale = config.mediaPositionerWidth / rect.width;
      containerRef.current.style.width = `${config.mediaPositionerWidth}px`;
      containerRef.current.style.height = `${rect.height * scale}px`;
    }
  }, [videoElementId]);

  useEffect(() => {
    if (!mediaRef.current || !containerRef.current) return;

    const mediaElement = mediaRef.current;
    const container = containerRef.current;

    const updateDimensions = () => {
      let naturalWidth: number;
      let naturalHeight: number;

      if (mediaElement instanceof HTMLVideoElement) {
        naturalWidth = mediaElement.videoWidth;
        naturalHeight = mediaElement.videoHeight;
      } else if (mediaElement instanceof HTMLImageElement) {
        naturalWidth = mediaElement.naturalWidth;
        naturalHeight = mediaElement.naturalHeight;
      } else {
        return;
      }

      // Store the aspect ratio
      const ratio = naturalWidth / naturalHeight;
      setAspectRatio(ratio);

      if (!initialPosition) {
        // Calculate the aspect ratio
        const aspectRatio = naturalWidth / naturalHeight;

        // Get container dimensions
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Calculate dimensions that fit within container while preserving aspect ratio
        let width = containerWidth * 0.5; // Start with 50% of container width
        let height = width / aspectRatio;

        // If height is too tall, scale based on height instead
        if (height > containerHeight * 0.8) {
          height = containerHeight * 0.8;
          width = height * aspectRatio;
        }

        // Calculate centered position
        const x = (containerWidth - width) / 2;
        const y = (containerHeight - height) / 2;

        // Update position state
        setPosition({
          x,
          y,
          width,
          height,
        });
        onPositionChange({ x, y, width, height });
      }
    };

    // For videos, wait for loadedmetadata event
    if (mediaElement instanceof HTMLVideoElement) {
      mediaElement.addEventListener("loadedmetadata", updateDimensions);
    } else {
      // For images, wait for load event
      mediaElement.addEventListener("load", updateDimensions);
    }

    return () => {
      if (mediaElement instanceof HTMLVideoElement) {
        mediaElement.removeEventListener("loadedmetadata", updateDimensions);
      } else {
        mediaElement.removeEventListener("load", updateDimensions);
      }
    };
  }, [media.url, onPositionChange, initialPosition]);

  const handleMouseDown = (
    e: React.MouseEvent,
    action: "drag" | "resize",
    direction?: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setStartPos({
      x: e.clientX,
      y: e.clientY,
    });

    if (action === "drag") {
      setIsDragging(true);
    }
    if (action === "resize") {
      setIsResizing(true);
      setResizeDirection(direction || "");
    }
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
    }

    if (isResizing) {
      let newWidth = position.width;
      let newHeight = position.height;
      let newX = position.x;
      let newY = position.y;

      // Check if shift key is pressed and we have an aspect ratio
      const preserveAspectRatio = e.shiftKey && aspectRatio !== null;

      const updateDimensions = (widthDelta: number, heightDelta: number) => {
        if (preserveAspectRatio) {
          // Use the larger delta to determine the scaling
          const absWidthDelta = Math.abs(widthDelta);
          const absHeightDelta = Math.abs(heightDelta);

          if (absWidthDelta > absHeightDelta) {
            // Width is driving the resize
            const width = Math.max(50, position.width + widthDelta);
            return {
              width,
              height: width / aspectRatio!,
            };
          } else {
            // Height is driving the resize
            const height = Math.max(50, position.height + heightDelta);
            return {
              width: height * aspectRatio!,
              height,
            };
          }
        } else {
          return {
            width: Math.max(50, position.width + widthDelta),
            height: Math.max(50, position.height + heightDelta),
          };
        }
      };

      switch (resizeDirection) {
        case "se": // bottom-right
          const seDimensions = updateDimensions(deltaX, deltaY);
          newWidth = seDimensions.width;
          newHeight = seDimensions.height;
          break;
        case "sw": // bottom-left
          const swDimensions = updateDimensions(-deltaX, deltaY);
          newWidth = swDimensions.width;
          newHeight = swDimensions.height;
          newX = position.x + deltaX;
          break;
        case "ne": // top-right
          const neDimensions = updateDimensions(deltaX, -deltaY);
          newWidth = neDimensions.width;
          newHeight = neDimensions.height;
          newY = position.y + deltaY;
          break;
        case "nw": // top-left
          const nwDimensions = updateDimensions(-deltaX, -deltaY);
          newWidth = nwDimensions.width;
          newHeight = nwDimensions.height;
          newX = position.x + deltaX;
          newY = position.y + deltaY;
          break;
      }

      // Constrain to container bounds
      newWidth = Math.min(newWidth, rect.width - newX);
      newHeight = Math.min(newHeight, rect.height - newY);
      newX = Math.max(0, Math.min(newX, rect.width - newWidth));
      newY = Math.max(0, Math.min(newY, rect.height - newHeight));

      setPosition({
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      });
    }

    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    if (isDragging || isResizing) {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection("");
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
  }, [isDragging, isResizing, position, startPos, resizeDirection]);

  const renderMedia = () => {
    if (media.type === "text") {
      return (
        <div
          className="w-full h-full"
          style={{
            boxSizing: "border-box",
            pointerEvents: "none",
          }}
        >
          {media.preview}
        </div>
      );
    }

    if (media.type.startsWith("video/")) {
      return (
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={
            media.url.startsWith("blob:") ? media.url : getMediaUrl(media.url)
          }
          className="w-full h-full object-contain pointer-events-none"
          muted
          preload="metadata"
        />
      );
    }

    return (
      <img
        ref={mediaRef as React.RefObject<HTMLImageElement>}
        src={media.url.startsWith("blob:") ? media.url : getMediaUrl(media.url)}
        className="w-full h-full object-contain pointer-events-none"
        alt="Overlay media"
      />
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative bg-black/50 rounded-lg overflow-hidden"
      style={{ maxWidth: config.mediaPositionerWidth }}
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
        {renderMedia()}

        {/* Drag handle */}
        <div
          className="absolute inset-0 bg-transparent border-2 border-white/50 rounded cursor-move"
          onMouseDown={(e) => handleMouseDown(e, "drag")}
        >
          {/* Resize handles */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-white/50 rounded-tl cursor-se-resize"
            onMouseDown={(e) => handleMouseDown(e, "resize", "se")}
          />
          <div
            className="absolute top-0 left-0 w-4 h-4 bg-white/50 rounded-br cursor-nw-resize"
            onMouseDown={(e) => handleMouseDown(e, "resize", "nw")}
          />
          <div
            className="absolute top-0 right-0 w-4 h-4 bg-white/50 rounded-bl cursor-ne-resize"
            onMouseDown={(e) => handleMouseDown(e, "resize", "ne")}
          />
          <div
            className="absolute bottom-0 left-0 w-4 h-4 bg-white/50 rounded-tr cursor-sw-resize"
            onMouseDown={(e) => handleMouseDown(e, "resize", "sw")}
          />
        </div>
      </div>
    </div>
  );
};

export default MediaPositioner;
