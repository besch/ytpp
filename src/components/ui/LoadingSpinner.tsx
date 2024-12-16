import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = "md" }) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative">
        <div
          className={`animate-spin rounded-full ${sizeClasses[size]} border-4 border-primary border-t-transparent`}
        ></div>
        <div
          className={`absolute top-0 left-0 animate-ping rounded-full ${sizeClasses[size]} border-4 border-primary opacity-20`}
        ></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
