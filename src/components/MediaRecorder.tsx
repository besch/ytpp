import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  Video,
  Square,
  Loader2,
  Pause,
  Play,
  Check,
  X,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { MediaData } from "@/types";

interface MediaRecorderProps {
  onRecordingComplete: (mediaData: MediaData) => void;
}

const MediaRecorder: React.FC<MediaRecorderProps> = ({
  onRecordingComplete,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingType, setRecordingType] = useState<"audio" | "video" | null>(
    null
  );
  const [elapsedTime, setElapsedTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [previewMedia, setPreviewMedia] = useState<{
    url: string;
    type: string;
  } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, isPaused]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const setupAudioMeter = (stream: MediaStream) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const audioContext = audioContextRef.current;
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const updateLevel = () => {
      if (!isRecording) return;
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average / 128); // Normalize to 0-1
      requestAnimationFrame(updateLevel);
    };
    updateLevel();
  };

  const startRecording = async (type: "audio" | "video") => {
    try {
      const constraints = {
        audio: true,
        video: type === "video" ? { width: 1280, height: 720 } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (type === "video" && previewRef.current) {
        previewRef.current.srcObject = stream;
        previewRef.current.play();
      }

      if (type === "audio") {
        setupAudioMeter(stream);
      }

      const mediaRecorder = new window.MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: type === "video" ? "video/webm" : "audio/webm",
        });
        const url = URL.createObjectURL(blob);
        setPreviewMedia({
          url,
          type: type === "video" ? "video/webm" : "audio/webm",
        });

        // Clean up
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        if (previewRef.current) {
          previewRef.current.srcObject = null;
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
      };

      mediaRecorder.start(1000); // Capture data every second
      setIsRecording(true);
      setRecordingType(type);
      setElapsedTime(0);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert(
        "Failed to start recording. Please make sure you have granted the necessary permissions."
      );
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
    } else {
      mediaRecorderRef.current.pause();
    }
    setIsPaused(!isPaused);
  };

  const confirmRecording = () => {
    if (!previewMedia) return;

    const file = new File(
      chunksRef.current,
      `recorded-${recordingType}-${Date.now()}.webm`,
      {
        type: previewMedia.type,
      }
    );

    onRecordingComplete({
      file,
      url: previewMedia.url,
      name: file.name,
      type: file.type,
    });

    // Reset state
    setPreviewMedia(null);
    setRecordingType(null);
    setElapsedTime(0);
  };

  const discardRecording = () => {
    if (previewMedia) {
      URL.revokeObjectURL(previewMedia.url);
    }
    setPreviewMedia(null);
    setRecordingType(null);
    setElapsedTime(0);
  };

  return (
    <div className="space-y-4">
      {!isRecording && !recordingType && !previewMedia && (
        <div className="flex gap-2">
          <Button
            onClick={() => startRecording("audio")}
            variant="outline"
            className="flex-1"
          >
            <Mic className="w-4 h-4 mr-2" />
            Record Audio
          </Button>
          <Button
            onClick={() => startRecording("video")}
            variant="outline"
            className="flex-1"
          >
            <Video className="w-4 h-4 mr-2" />
            Record Video
          </Button>
        </div>
      )}

      {recordingType === "video" && !previewMedia && (
        <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden">
          <video
            ref={previewRef}
            className="w-full h-full object-cover"
            muted
            playsInline
          />
          {isRecording && (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              {formatTime(elapsedTime)}
            </div>
          )}
        </div>
      )}

      {recordingType === "audio" && !previewMedia && (
        <div className="flex flex-col items-center justify-center h-32 bg-muted rounded-lg">
          {isRecording && (
            <>
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Recording Audio... {formatTime(elapsedTime)}
              </div>
              <div className="w-48 h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-100"
                  style={{ width: `${audioLevel * 100}%` }}
                />
              </div>
            </>
          )}
        </div>
      )}

      {previewMedia && (
        <div className="space-y-4">
          <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden">
            {previewMedia.type.startsWith("video/") ? (
              <video
                src={previewMedia.url}
                className="w-full h-full object-cover"
                controls
                autoPlay
              />
            ) : (
              <audio
                src={previewMedia.url}
                className="w-full mt-12"
                controls
                autoPlay
              />
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={confirmRecording}
              variant="primary"
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              Use Recording
            </Button>
            <Button
              onClick={discardRecording}
              variant="destructive"
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Discard
            </Button>
          </div>
        </div>
      )}

      {isRecording && !previewMedia && (
        <div className="flex gap-2">
          <Button onClick={togglePause} variant="outline" className="flex-1">
            {isPaused ? (
              <>
                <Play className="w-4 h-4 mr-2" />
                Resume
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            )}
          </Button>
          <Button
            onClick={stopRecording}
            variant="destructive"
            className="flex-1"
          >
            <Square className="w-4 h-4 mr-2" />
            Stop
          </Button>
        </div>
      )}
    </div>
  );
};

export default MediaRecorder;
