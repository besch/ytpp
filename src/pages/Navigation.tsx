import React from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Play } from "lucide-react";

const Navigation: React.FC = () => {
  const navigate = useNavigate();

  return (
    <nav className="flex justify-between items-center p-4 bg-background border-b border-border">
      <div className="flex items-center space-x-4">
        <img
          src="assets/icons/logo-onedub.png"
          className="w-[125px]"
          alt="Logo"
        />
      </div>
      <div className="flex space-x-6 items-center">
        <Edit onClick={() => navigate("/edit")} size={24} />
        <Play onClick={() => navigate("/play")} size={24} />
      </div>
    </nav>
  );
};

export default Navigation;
