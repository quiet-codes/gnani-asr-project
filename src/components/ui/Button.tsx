import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
  leadingIcon?: ReactNode;
}

const variantClasses = {
  primary: "button-primary",
  secondary: "button-secondary",
  ghost: "button-ghost"
};

export function Button({
  variant = "primary",
  children,
  leadingIcon,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={`button ${variantClasses[variant]} ${className}`} {...props}>
      {leadingIcon ? <span className="button-leading-icon">{leadingIcon}</span> : null}
      <span>{children}</span>
    </button>
  );
}
