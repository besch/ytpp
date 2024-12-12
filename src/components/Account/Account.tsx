import React, { useState, useRef, useEffect } from "react";
import { LogOut, User } from "lucide-react";
import Button from "@/components/ui/Button";
import { useDispatch, useSelector } from "react-redux";
import { selectUser, logout, setError } from "@/store/authSlice";
import { toast } from "react-toastify";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface AccountProps {
  sendMessageToContentScript: (message: any) => Promise<any>;
}

const Account: React.FC<AccountProps> = ({ sendMessageToContentScript }) => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150); // Small delay to allow mouse movement to dropdown
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
      toast.success("Successfully logged out!");
    } catch (error) {
      console.error("Logout error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Logout failed";
      dispatch(setError(errorMessage));
      toast.error(errorMessage);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div
      ref={accountRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center gap-2 cursor-pointer">
        {user?.picture ? (
          <img
            src={user.picture}
            alt={user.name}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <User className="w-8 h-8 p-1 rounded-full bg-muted" />
        )}
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 py-2 bg-background border border-border rounded-md shadow-lg z-10">
          <div className="px-4 py-2 text-sm border-b border-border">
            {user?.name}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-red-500 px-4 mb-2"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      )}

      {isLoggingOut && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <LoadingSpinner size="md" />
        </div>
      )}
    </div>
  );
};

export default Account;
