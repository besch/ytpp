import React from "react";
import Dialog from "@/components/ui/Dialog";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const styles = {
  inputContainer: {
    marginBottom: "24px",
    paddingRight: "24px",
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    backgroundColor: "rgb(17 24 39)",
    border: "1px solid #4B5563",
    borderRadius: "6px",
    color: "#ffffff",
    fontSize: "14px",
    outline: "none",
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
      backgroundColor: "rgba(75, 85, 99, 0.3)",
    },
  },
  confirmButton: {
    backgroundColor: "#2563EB",
    color: "#ffffff",
    border: "none",
    "&:hover": {
      backgroundColor: "#4F46E5",
    },
  },
  loadingOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
  },
} as const;

interface TimelineNameDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (title: string) => void;
  title: string;
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

const TimelineNameDialog: React.FC<TimelineNameDialogProps> = ({
  open,
  onClose,
  onSubmit,
  title,
  value,
  onChange,
  isLoading = false,
  submitLabel = "Create",
}) => {
  const getButtonStyle = (baseStyle: any) => ({
    ...styles.button,
    ...baseStyle,
    "&:hover": {
      ...baseStyle["&:hover"],
    },
  });

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
    }
  };

  return (
    <Dialog open={open} onClose={() => !isLoading && onClose()} title={title}>
      <div>
        <div style={styles.inputContainer}>
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Timeline title"
            style={styles.input}
            disabled={isLoading}
            autoFocus
          />
        </div>
        <div style={styles.buttonGroup}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            style={getButtonStyle(styles.cancelButton)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            style={getButtonStyle(styles.confirmButton)}
            disabled={isLoading || !value.trim()}
          >
            {submitLabel}
          </Button>
        </div>
        {isLoading && (
          <div style={styles.loadingOverlay}>
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>
    </Dialog>
  );
};

export default TimelineNameDialog;
