import React from "react";
import { useNavigate } from "react-router-dom";
import { Move, Home } from "lucide-react";
import Button from "@/components/ui/Button";

const Navigation: React.FC = () => {
  const navigate = useNavigate();

  const handleDragStart = (e: React.MouseEvent) => {
    const container = document.getElementById("react-overlay-root");
    if (!container) return;

    const initialX = e.clientX - container.offsetLeft;
    const initialY = e.clientY - container.offsetTop;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const currentX = e.clientX - initialX;
      const currentY = e.clientY - initialY;
      container.style.left = `${currentX}px`;
      container.style.top = `${currentY}px`;
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-background border-b border-border">
      <div
        className="cursor-pointer hover:text-primary"
        onClick={() => navigate("/")}
      >
        <Home className="h-6 w-6" />
      </div>
      <Button variant="ghost" onMouseDown={handleDragStart} title="Drag window">
        <Move className="h-4 w-4" />
      </Button>
    </nav>
  );
};

export default Navigation;
