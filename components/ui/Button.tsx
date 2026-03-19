import * as React from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement | HTMLAnchorElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline"
  size?: "default" | "sm" | "lg" | "icon"
  shape?: "pill" | "squircle" | "circle" | "default"
  href?: string
  target?: string
  rel?: string
}

const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", shape = "pill", href, ...props }, ref) => {
    const classes = cn(
      "inline-flex items-center justify-center whitespace-nowrap font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-2",
      variant === "primary" && "bg-white text-black hover:bg-zinc-200",
      variant === "secondary" && "bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-800",
      variant === "ghost" && "hover:bg-zinc-800 hover:text-white",
      variant === "outline" && "border border-zinc-800 bg-transparent hover:bg-zinc-800 hover:text-white",
      size === "default" && "h-12 px-6 py-3",
      size === "sm" && "h-9 px-3",
      size === "lg" && "h-14 px-8",
      size === "icon" && "h-10 w-10",
      shape === "pill" && "rounded-full",
      shape === "squircle" && "rounded-2xl",
      shape === "circle" && "rounded-full aspect-square p-0",
      shape === "default" && "rounded-lg",
      className
    )

    if (href) {
      if (href.startsWith('http')) {
        return (
          <a href={href} className={classes} ref={ref as React.Ref<HTMLAnchorElement>} {...props as React.AnchorHTMLAttributes<HTMLAnchorElement>}>
            {props.children}
          </a>
        )
      }
      return (
        <Link href={href} className={classes} ref={ref as React.Ref<HTMLAnchorElement>} {...props as React.AnchorHTMLAttributes<HTMLAnchorElement>}>
          {props.children}
        </Link>
      )
    }

    return (
      <button
        className={classes}
        ref={ref as React.Ref<HTMLButtonElement>}
        {...props as React.ButtonHTMLAttributes<HTMLButtonElement>}
      />
    )
  }
)
Button.displayName = "Button"

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-1",
          "[&>*:first-child]:rounded-l-full [&>*:first-child]:rounded-r-md",
          "[&>*:not(:first-child):not(:last-child)]:rounded-md",
          "[&>*:last-child]:rounded-r-full [&>*:last-child]:rounded-l-md",
          className
        )}
        {...props}
      />
    )
  }
)
ButtonGroup.displayName = "ButtonGroup"

export { Button, ButtonGroup }
