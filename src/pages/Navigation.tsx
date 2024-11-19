import React from "react";
import { useNavigate } from "react-router-dom";

const Navigation: React.FC = () => {
  const navigate = useNavigate();

  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-background border-b border-border">
      <div className="flex items-center space-x-4">
        <h1
          className="text-lg font-semibold cursor-pointer hover:text-primary"
          onClick={() => navigate("/")}
        >
          Timeline Editor
        </h1>
      </div>
    </nav>
  );
};

export default Navigation;
