import React, { useState } from "react";
import { LogOut, User, UserCircle } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { selectUser, logout, setError } from "@/store/authSlice";
import { toast } from "react-toastify";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { useNavigate } from "react-router-dom";

interface AccountProps {
  sendMessageToContentScript: (message: any) => Promise<any>;
}

const Account: React.FC<AccountProps> = ({ sendMessageToContentScript }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await sendMessageToContentScript({
        type: "HANDLE_LOGOUT",
      });

      if (!response?.success) {
        throw new Error(response?.error || "Logout failed");
      }

      dispatch(logout());
    } catch (error) {
      console.error("Logout error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Logout failed";
      dispatch(setError(errorMessage));
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 cursor-pointer">
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <User className="w-8 h-8 p-1 rounded-full bg-muted" />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="px-2 py-1.5 text-sm border-b border-border">
            {user?.name}
          </div>
          <DropdownMenuItem onClick={() => navigate("/profile")}>
            <UserCircle className="h-4 w-4 mr-2" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isLoggingOut && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <LoadingSpinner size="md" />
        </div>
      )}
    </>
  );
};

export default Account;
