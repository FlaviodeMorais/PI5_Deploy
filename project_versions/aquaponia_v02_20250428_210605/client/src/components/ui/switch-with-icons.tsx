import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchWithIconsProps {
  leftOption: {
    value: string;
    label: string;
    icon?: React.ReactNode;
  };
  rightOption: {
    value: string;
    label: string;
    icon?: React.ReactNode;
  };
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SwitchWithIcons({
  leftOption,
  rightOption,
  value,
  onChange,
  className,
}: SwitchWithIconsProps) {
  return (
    <div className={cn("bg-white/5 p-1 rounded-md flex", className)}>
      <button
        className={cn(
          "flex-1 py-2 px-3 rounded-md font-medium flex items-center justify-center gap-1 transition-colors",
          value === leftOption.value
            ? "bg-[#5090d3] text-white"
            : "text-gray-300 hover:bg-white/10"
        )}
        onClick={() => onChange(leftOption.value)}
      >
        {leftOption.icon}
        <span>{leftOption.label}</span>
      </button>
      <button
        className={cn(
          "flex-1 py-2 px-3 rounded-md font-medium flex items-center justify-center gap-1 transition-colors",
          value === rightOption.value
            ? "bg-[#5090d3] text-white"
            : "text-gray-300 hover:bg-white/10"
        )}
        onClick={() => onChange(rightOption.value)}
      >
        {rightOption.icon}
        <span>{rightOption.label}</span>
      </button>
    </div>
  );
}
