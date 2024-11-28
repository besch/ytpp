import React from "react";
import { useFormContext } from "react-hook-form";
import Input from "@/components/ui/Input";
import { MediaPosition } from "./MediaPositioner";
import MediaPositioner from "./MediaPositioner";
import Select from "@/components/ui/Select";
import { OverlayMedia } from "@/types";

const fontFamilies = [
  "Arial",
  "Times New Roman",
  "Helvetica",
  "Georgia",
  "Verdana",
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
      transparentBackground: boolean;
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

  // Create a preview element for MediaPositioner
  const previewMedia: OverlayMedia = {
    type: "text",
    url: "", // Not used for text
    duration: 0, // Add required duration property
    preview: (
      <div
        style={{
          ...textOverlay?.style,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: transparentBackground
            ? "transparent"
            : textOverlay?.style?.backgroundColor || "#000000",
          padding: "8px",
        }}
      >
        {textOverlay?.text || "Preview Text"}
      </div>
    ),
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-muted-foreground">Text Content</label>
        <Input
          {...register("textOverlay.text", { required: true })}
          placeholder="Enter your text"
        />
        {errors.textOverlay?.text && (
          <span className="text-xs text-destructive">Text is required</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground">Font Family</label>
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

        <div>
          <label className="text-sm text-muted-foreground">Font Size</label>
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground">Text Color</label>
          <Input
            type="color"
            {...register("textOverlay.style.color")}
            defaultValue="#ffffff"
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground">
            Background Color
          </label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register("textOverlay.style.transparentBackground")}
                id="transparentBackground"
              />
              <label
                htmlFor="transparentBackground"
                className="text-sm text-muted-foreground"
              >
                Transparent Background
              </label>
            </div>
            <Input
              type="color"
              {...register("textOverlay.style.backgroundColor")}
              defaultValue="#000000"
              disabled={transparentBackground}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground">Font Weight</label>
          <Select
            {...register("textOverlay.style.fontWeight")}
            defaultValue="normal"
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          {...register("pauseMainVideo")}
          id="pauseMainVideo"
        />
        <label
          htmlFor="pauseMainVideo"
          className="text-sm text-muted-foreground"
        >
          Pause Main Video
        </label>
      </div>

      <div>
        <label className="text-sm text-muted-foreground">
          Duration (seconds)
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

      <div>
        <label className="text-sm text-muted-foreground mb-2 block">
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
