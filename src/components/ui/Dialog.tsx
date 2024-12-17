import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Button from "./Button";
import { X } from "lucide-react";

interface DialogProps {
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
  title?: string;
}

const dialogStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    backdropFilter: "blur(2px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    fontFamily: "system-ui, sans-serif",
  },
  content: {
    backgroundColor: "rgb(31 41 55)",
    borderRadius: "8px",
    padding: "24px",
    width: "calc(100% - 48px)",
    maxWidth: "500px",
    position: "relative",
    border: "1px solid #333333",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    animation: "dialog-content-show 150ms cubic-bezier(0.16, 1, 0.3, 1)",
    color: "#ffffff",
  },
  title: {
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: 600,
    marginBottom: "16px",
    paddingRight: "32px",
  },
  closeButton: {
    position: "absolute",
    top: "16px",
    right: "16px",
    padding: "8px",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#9CA3AF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "4px",
  },
  input: {
    width: "calc(100% - 24px)",
    padding: "8px 12px",
    backgroundColor: "rgb(17 24 39)",
    border: "1px solid #4B5563",
    borderRadius: "6px",
    color: "#ffffff",
    fontSize: "14px",
    outline: "none",
    marginRight: "24px",
  },
  button: {
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 500,
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
    marginTop: "24px",
  },
} as const;

const Dialog: React.FC<DialogProps> = ({ children, open, onClose, title }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div style={dialogStyles.overlay} onClick={onClose}>
      <div
        style={dialogStyles.content}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {title && <div style={dialogStyles.title}>{title}</div>}
        <Button
          variant="ghost"
          size="sm"
          style={dialogStyles.closeButton}
          onClick={onClose}
        >
          <X size={16} />
        </Button>
        <div>{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Dialog;
