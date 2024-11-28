import React, { forwardRef } from "react";
import { ChangeHandler } from "react-hook-form";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children?: React.ReactNode;
  defaultValue?: string;
  onChange?: ChangeHandler;
  onBlur?: ChangeHandler;
  value?: string;
  className?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";

export default Select;
