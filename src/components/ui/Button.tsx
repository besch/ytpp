import React, { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  label?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "primary",
  size = "default",
  label,
  ...props
}) => {
  return (
    <button
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background text-base",
        {
          "bg-primary text-primary-foreground hover:bg-primary/90":
            variant === "primary",
          "bg-secondary text-secondary-foreground hover:bg-secondary/80":
            variant === "secondary",
          "bg-destructive text-destructive-foreground hover:bg-destructive/90":
            variant === "destructive",
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground":
            variant === "outline",
          "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
          "h-8 text-base": size === "default",
          "h-10 px-4 text-sm": size === "sm",
          "h-14 px-8 text-lg": size === "lg",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
