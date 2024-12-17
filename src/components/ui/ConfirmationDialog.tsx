import React from "react";
import Dialog from "./Dialog";
import Button from "./Button";
import { X, Trash2 } from "lucide-react";

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "destructive";
}

const styles = {
  description: {
    fontSize: "14px",
    color: "#9CA3AF",
    marginBottom: "24px",
    lineHeight: "1.5",
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
  },
  icon: {
    width: "14px",
    height: "14px",
    marginRight: "6px",
  },
  button: {
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 500,
    transition: "background-color 200ms",
  },
  cancelButton: {
    backgroundColor: "transparent",
    color: "#9CA3AF",
    border: "1px solid #4B5563",
    "&:hover": {
      backgroundColor: "rgba(75, 85, 99, 0.2)",
    },
  },
  confirmButton: {
    backgroundColor: "#2563EB",
    color: "#ffffff",
    border: "none",
    "&:hover": {
      backgroundColor: "#3B82F6",
    },
  },
  destructiveButton: {
    backgroundColor: "#DC2626",
    color: "#ffffff",
    border: "none",
    "&:hover": {
      backgroundColor: "#EF4444",
    },
  },
} as const;

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
}) => {
  const getButtonStyle = (baseStyle: any) => ({
    ...styles.button,
    ...baseStyle,
    "&:hover": {
      ...baseStyle["&:hover"],
    },
  });

  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <div>
        <p style={styles.description}>{description}</p>
        <div style={styles.buttonGroup}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            style={getButtonStyle(styles.cancelButton)}
          >
            <X style={styles.icon} />
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "primary"}
            size="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={getButtonStyle(
              variant === "destructive"
                ? styles.destructiveButton
                : styles.confirmButton
            )}
          >
            {variant === "destructive" && <Trash2 style={styles.icon} />}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default ConfirmationDialog;
