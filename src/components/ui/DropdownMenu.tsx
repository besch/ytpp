import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface DropdownMenuProps {
  children: React.ReactNode;
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const DropdownMenuContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({
  open: false,
  setOpen: () => {},
});

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <DropdownMenuContext.Provider value={{ open, setOpen }}>
        {children}
      </DropdownMenuContext.Provider>
    </div>
  );
};

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({
  children,
  asChild,
}) => {
  const { open, setOpen } = React.useContext(DropdownMenuContext);

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: () => setOpen(!open),
    });
  }

  return (
    <button onClick={() => setOpen(!open)} type="button">
      {children}
    </button>
  );
};

const dropdownStyles = {
  wrapper: {
    fontFamily: "system-ui, sans-serif",
    position: "relative",
  },
  content: {
    position: "fixed",
    zIndex: 9999,
    minWidth: "8rem",
    overflow: "hidden",
    padding: "0.25rem",
    marginTop: "0.25rem",
    backgroundColor: "rgb(31 41 55)",
    border: "1px solid #333333",
    borderRadius: "0.375rem",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
    transformOrigin: "top right",
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
    padding: "0.5rem 0.75rem",
    fontSize: "0.875rem",
    color: "#ffffff",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "0.25rem",
    cursor: "pointer",
    transition: "all 200ms",
    "& svg": {
      width: "16px",
      height: "16px",
      flexShrink: 0,
      marginRight: "8px",
    },
  },
  menuItemHover: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#ffffff",
  },
  menuItemDestructive: {
    color: "#ef4444",
  },
  menuItemDestructiveHover: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    color: "#ef4444",
  },
} as const;

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({
  children,
  align = "end",
  className,
}) => {
  const { open, setOpen } = React.useContext(DropdownMenuContext);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const updatePosition = () => {
      if (!ref.current || !triggerRef.current?.parentElement) return;

      const triggerRect =
        triggerRef.current.parentElement.getBoundingClientRect();
      const dropdownRect = ref.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // Calculate available space
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      // Determine if dropdown should appear above
      const showAbove =
        spaceBelow < dropdownRect.height && spaceAbove > spaceBelow;

      // Calculate left position based on alignment and available space
      let leftPos =
        align === "end"
          ? triggerRect.right - dropdownRect.width
          : triggerRect.left;

      // Adjust horizontal position if it would overflow
      if (leftPos + dropdownRect.width > viewportWidth) {
        leftPos = viewportWidth - dropdownRect.width - 8;
      }
      if (leftPos < 8) {
        leftPos = 8;
      }

      // Calculate top position
      let topPos = showAbove
        ? triggerRect.top - dropdownRect.height - 4
        : triggerRect.bottom + 4;

      // Adjust vertical position if it would overflow
      if (topPos + dropdownRect.height > viewportHeight) {
        topPos = viewportHeight - dropdownRect.height - 8;
      }
      if (topPos < 8) {
        topPos = 8;
      }

      setPosition({
        top: topPos,
        left: leftPos,
      });
    };

    if (open) {
      requestAnimationFrame(updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, setOpen, align]);

  if (!open || !mounted) return null;

  const triggerElement = (
    <div
      ref={triggerRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    />
  );

  const dropdownContent = (
    <div style={dropdownStyles.wrapper}>
      <div
        ref={ref}
        style={{
          ...dropdownStyles.content,
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        {children}
      </div>
    </div>
  );

  return (
    <>
      {triggerElement}
      {createPortal(dropdownContent, document.body)}
    </>
  );
};

export const DropdownMenuItem = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuItemProps
>(({ children, className, onClick }, ref) => {
  const { setOpen } = React.useContext(DropdownMenuContext);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    onClick?.();
    setOpen(false);
  };

  return (
    <button
      ref={ref}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...dropdownStyles.menuItem,
        ...(isHovered ? dropdownStyles.menuItemHover : {}),
      }}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === "svg") {
          return React.cloneElement(child as React.ReactElement, {
            style: {
              width: "16px",
              height: "16px",
              flexShrink: 0,
              marginRight: "8px",
            },
          });
        }
        return child;
      })}
    </button>
  );
});

DropdownMenuItem.displayName = "DropdownMenuItem";
