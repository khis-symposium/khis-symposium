import Link from "next/link";
import type { ReactNode } from "react";

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "outline";
  className?: string;
};

const base =
  "btn-glow inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[16px] font-semibold tracking-wide text-white cursor-pointer min-h-[44px]";

// Both variants share the same dark-glass "glow" treatment (site-wide button
// style); outline is kept as a lighter-weight alias for smaller/secondary
// placements rather than a visually distinct style.
const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "",
  outline: "px-6 py-3",
};

export function Button({ href, children, variant = "primary", className = "" }: ButtonProps) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}
