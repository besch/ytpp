import React from "react";
import { useNavigate } from "react-router-dom";
import { Home, List } from "lucide-react";
import Button from "@/components/ui/Button";

const Navigation: React.FC = () => {
  const navigate = useNavigate();

  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-background border-b border-border">
      <h1
        className="text-xl font-semibold text-foreground cursor-pointer hover:text-primary"
        onClick={() => navigate("/")}
      >
        Timelines
      </h1>
    </nav>
  );
};

export default Navigation;
