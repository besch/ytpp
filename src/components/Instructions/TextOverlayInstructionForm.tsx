import React from "react";
import { useFormContext } from "react-hook-form";
import Input from "@/components/ui/Input";
import { MediaPosition } from "./MediaPositioner";
import MediaPositioner from "./MediaPositioner";
import Select from "@/components/ui/Select";

const fontFamilies = [
  "Arial",
  "Times New Roman",
  "Helvetica",
  "Georgia",
  "Verdana",
];

const animations = [
  { value: "none", label: "None" },
  { value: "fade", label: "Fade" },
  { value: "slide", label: "Slide" },
  { value: "bounce", label: "Bounce" },
  { value: "scale", label: "Scale" },
];

interface TextOverlayFormData {
  textOverlay: {
    text: string;
    style: {
      fontFamily: string;
      fontSize: number;
      color: string;
      backgroundColor: string;
      fontWeight: "normal" | "bold";
      fontStyle: "normal" | "italic";
      transparentBackground: boolean;
      opacity: number;
      textAlign: "left" | "center" | "right";
      animation: string;
      textShadow: boolean;
      borderRadius: number;
      padding: number;
    };
    position?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
  duration: number;
  pauseMainVideo: boolean;
  pauseDuration: number;
}

const TextOverlayInstructionForm: React.FC<{
  onPositionChange: (position: MediaPosition) => void;
}> = ({ onPositionChange }) => {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<TextOverlayFormData>();

  const textOverlay = watch("textOverlay");
  const transparentBackground = watch(
    "textOverlay.style.transparentBackground"
  );
  const pauseMainVideo = watch("pauseMainVideo");

  const previewMedia = {
    type: "text",
    url: "",
    duration: 0,
    preview: (
      <div
        style={{
          ...textOverlay?.style,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: textOverlay?.style?.textAlign || "center",
          backgroundColor: transparentBackground
            ? "transparent"
            : textOverlay?.style?.backgroundColor || "#000000",
          padding: `${textOverlay?.style?.padding || 8}px`,
          opacity: textOverlay?.style?.opacity || 1,
          borderRadius: `${textOverlay?.style?.borderRadius || 0}px`,
          textShadow: textOverlay?.style?.textShadow
            ? "2px 2px 4px rgba(0,0,0,0.5)"
            : "none",
        }}
      >
        {textOverlay?.text || "Preview Text"}
      </div>
    ),
  };

  return (
    <div className="space-y-6">
      {/* Text Content */}
      <div className="form-group">
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Text Content
        </label>
        <Input
          {...register("textOverlay.text", { required: true })}
          placeholder="Enter your text"
          className="w-full"
        />
        {errors.textOverlay?.text && (
          <span className="text-xs text-destructive">Text is required</span>
        )}
      </div>

      {/* Font Styling */}
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Font Family
          </label>
          <Select
            {...register("textOverlay.style.fontFamily")}
            defaultValue="Arial"
          >
            {fontFamilies.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </Select>
        </div>

        <div className="form-group">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Font Size
          </label>
          <Input
            type="number"
            {...register("textOverlay.style.fontSize", {
              valueAsNumber: true,
              min: 8,
              max: 72,
            })}
            defaultValue={16}
          />
        </div>
      </div>

      {/* Text Alignment and Style */}
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Text Align
          </label>
          <Select
            {...register("textOverlay.style.textAlign")}
            defaultValue="center"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </Select>
        </div>

        <div className="form-group">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Font Style
          </label>
          <Select
            {...register("textOverlay.style.fontStyle")}
            defaultValue="normal"
          >
            <option value="normal">Normal</option>
            <option value="italic">Italic</option>
          </Select>
        </div>
      </div>

      {/* Colors and Background */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-muted-foreground">
          Colors and Background
        </label>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Text Color</label>
            <Input
              type="color"
              {...register("textOverlay.style.color")}
              defaultValue="#ffffff"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Background</label>
            <Input
              type="color"
              {...register("textOverlay.style.backgroundColor")}
              defaultValue="#000000"
              disabled={transparentBackground}
            />
          </div>

          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register("textOverlay.style.transparentBackground")}
                id="transparentBackground"
              />
              <label htmlFor="transparentBackground" className="text-sm">
                Transparent
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Effects */}
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Opacity
          </label>
          <Input
            type="range"
            min="0"
            max="1"
            step="0.1"
            {...register("textOverlay.style.opacity")}
            defaultValue="1"
          />
        </div>

        <div className="form-group">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Animation
          </label>
          <Select
            {...register("textOverlay.style.animation")}
            defaultValue="none"
          >
            {animations.map((animation) => (
              <option key={animation.value} value={animation.value}>
                {animation.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Additional Styling */}
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Border Radius
          </label>
          <Input
            type="number"
            {...register("textOverlay.style.borderRadius")}
            defaultValue={0}
          />
        </div>

        <div className="form-group">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Padding
          </label>
          <Input
            type="number"
            {...register("textOverlay.style.padding")}
            defaultValue={8}
          />
        </div>
      </div>

      {/* Effects Toggles */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register("textOverlay.style.textShadow")}
            id="textShadow"
          />
          <label htmlFor="textShadow" className="text-sm">
            Text Shadow
          </label>
        </div>
      </div>

      {/* Pause Controls */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register("pauseMainVideo")}
            id="pauseMainVideo"
          />
          <label htmlFor="pauseMainVideo" className="text-sm">
            Pause Main Video
          </label>
        </div>

        {pauseMainVideo && (
          <div className="form-group m-0">
            <Input
              type="number"
              step="0.1"
              placeholder="Pause duration (seconds)"
              {...register("pauseDuration", {
                required: pauseMainVideo,
                min: 0,
                valueAsNumber: true,
              })}
            />
            {errors.pauseDuration && (
              <span className="text-xs text-destructive">
                Please enter a valid duration
              </span>
            )}
          </div>
        )}
      </div>

      {/* Duration */}
      <div className="form-group">
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Display Duration (seconds)
        </label>
        <Input
          type="number"
          {...register("duration", {
            required: true,
            min: 1,
            valueAsNumber: true,
          })}
          defaultValue={5}
        />
        {errors.duration && (
          <span className="text-xs text-destructive">
            Duration is required and must be at least 1 second
          </span>
        )}
      </div>

      {/* Position and Size */}
      <div className="form-group">
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Position and Size
        </label>
        <MediaPositioner
          media={previewMedia}
          onPositionChange={onPositionChange}
          initialPosition={textOverlay?.position}
        />
      </div>
    </div>
  );
};

export default TextOverlayInstructionForm;
