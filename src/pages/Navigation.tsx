import React from "react";
import { useNavigate } from "react-router-dom";
import { ToggleCanvasButton } from "@/components/ToggleCanvasButton";

const Navigation: React.FC = () => {
  const navigate = useNavigate();

  return (
    <nav className="flex justify-between items-center p-4 bg-background border-b border-border">
      <div className="flex items-center space-x-4">Timeline</div>
      <div className="flex space-x-6 items-center">
        <ToggleCanvasButton className="flex items-center gap-2" />
      </div>
    </nav>
  );
};

export default Navigation;
