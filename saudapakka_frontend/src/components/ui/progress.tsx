"use client"

import * as React from "react"

import { cn } from "@/lib/utils"


const Progress = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value?: number }
>(({ className, value, ...props }, ref) => (
    <div
        ref={ref}
        className={`relative h-2 w-full overflow-hidden rounded-full bg-gray-100 ${className || ""}`}
        {...props}
    >
        <div
            className="h-full w-full flex-1 bg-[#2D5F3F] transition-all duration-500 ease-in-out"
            style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
    </div>
))
Progress.displayName = "Progress"

export { Progress }
