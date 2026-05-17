import { BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
        <BrainCircuit size={24} />
      </div>
      <span className="font-bold text-xl tracking-tight">SmartDoc AI</span>
    </div>
  );
}
