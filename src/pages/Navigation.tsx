import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Move, Home, LogOut, LogIn, User } from "lucide-react";
import Button from "@/components/ui/Button";
import { useDispatch, useSelector } from "react-redux";
import {
  selectUser,
  selectIsAuthenticated,
  setUser,
  logout,
  setError,
  setLoading,
} from "@/store/authSlice";
import { toast } from "react-toastify";
import { api } from "@/lib/api";

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

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

  const sendMessageToContentScript = (message: any): Promise<any> => {
    return new Promise((resolve) => {
      const messageId = Date.now().toString();

      const handleResponse = (event: MessageEvent) => {
        if (
          event.data &&
          event.data.source === "content-script" &&
          event.data.type === "RESPONSE" &&
          event.data.messageId === messageId
        ) {
          window.removeEventListener("message", handleResponse);
          resolve(event.data.payload);
        }
      };

      window.addEventListener("message", handleResponse);

      window.postMessage(
        {
          source: "injected-app",
          messageId,
          ...message,
        },
        "*"
      );

      setTimeout(() => {
        window.removeEventListener("message", handleResponse);
        resolve({ success: false, error: "Request timed out" });
      }, 120000);
    });
  };

  const handleLogin = async () => {
    try {
      dispatch(setLoading(true));
      console.log("Navigation: Starting login process");

      const response = await sendMessageToContentScript({
        type: "HANDLE_LOGIN",
      });

      console.log("Navigation: Received login response", response);

      if (!response?.success) {
        throw new Error(response?.error || "Login failed");
      }

      // Save user to database before setting in Redux store
      if (response.user) {
        await api.users.createOrUpdate(response.user);
        dispatch(setUser(response.user));
        toast.success("Successfully logged in!");
      } else {
        throw new Error("No user data received");
      }
    } catch (error) {
      console.error("Navigation: Login error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      dispatch(setError(errorMessage));
      toast.error(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleLogout = async () => {
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
    }
  };

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const response = await sendMessageToContentScript({
          type: "CHECK_AUTH_STATE",
        });

        if (response?.success && response.user) {
          dispatch(setUser(response.user));
        }
      } catch (error) {
        console.error("Failed to check auth state:", error);
        dispatch(setError("Failed to check auth state"));
      }
    };

    checkAuthState();
  }, [dispatch]);

  return (
    <nav className="flex justify-between items-center px-8 py-6 bg-background border-b border-border">
      <div
        className="cursor-pointer hover:text-primary flex items-center gap-3 text-lg"
        onClick={() => navigate("/")}
      >
        <Home className="h-6 w-6" />
        <span>Home</span>
      </div>

      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <div className="flex items-center gap-2">
              {user?.picture && (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm">{user?.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-red-500"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </Button>
          </>
        ) : (
          <Button variant="ghost" size="sm" onClick={handleLogin}>
            <LogIn className="h-5 w-5 mr-2" />
            Login
          </Button>
        )}

        <Button
          variant="ghost"
          onMouseDown={handleDragStart}
          title="Drag window"
          size="sm"
        >
          <Move className="h-5 w-5" />
        </Button>
      </div>
    </nav>
  );
};

export default Navigation;
