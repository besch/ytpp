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
        YouTube Timelines
      </h1>
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="flex items-center gap-2"
        >
          <Home size={16} />
          Home
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/timelines")}
          className="flex items-center gap-2"
        >
          <List size={16} />
          Timelines
        </Button>
      </div>
    </nav>
  );
};

export default Navigation;
