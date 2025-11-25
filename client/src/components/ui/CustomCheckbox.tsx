import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomCheckboxProps {
  checked: boolean;
  onChange: () => void;
  className?: string;
}

export function CustomCheckbox({ checked, onChange, className }: CustomCheckboxProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        "relative w-6 h-6 rounded-md border-2 transition-all duration-200 flex items-center justify-center shadow-lg",
        checked
          ? "bg-primary border-primary text-primary-foreground scale-110"
          : "bg-background border-border hover:border-primary/50 hover:bg-accent/50",
        className
      )}
      aria-checked={checked}
      role="checkbox"
    >
      {checked && (
        <Check className="h-4 w-4 animate-in zoom-in-50 duration-200" />
      )}
    </button>
  );
}

