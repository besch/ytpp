import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, autoComplete = "off", ...props }, ref) => {
    if (type === "color") {
      return (
        <input
          type={type}
          className={cn(
            "flex h-10 w-full cursor-pointer border-0 bg-transparent p-0",
            className
          )}
          autoComplete={autoComplete}
          ref={ref}
          {...props}
        />
      );
    }

    if (type === "checkbox" || type === "radio") {
      return (
        <input
          type={type}
          className={cn(
            "h-4 w-4 cursor-pointer border-input bg-background text-primary focus:ring-2 focus:ring-primary",
            className
          )}
          autoComplete={autoComplete}
          ref={ref}
          {...props}
        />
      );
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        autoComplete={autoComplete}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export default Input;
