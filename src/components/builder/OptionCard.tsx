"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Option } from "@/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface OptionCardProps {
  readonly option: Option;
  readonly isSelected: boolean;
  readonly onClick: () => void;
  readonly icon?: React.ReactNode;
  readonly hidePrice?: boolean;
  readonly surchargeValue?: number;
}

export default function OptionCard({ option, isSelected, onClick, icon, hidePrice, surchargeValue }: OptionCardProps) {
  const displayPrice = surchargeValue !== undefined ? surchargeValue : option.price;
  const shouldShowPrice = !hidePrice && (displayPrice !== 0);

  return (
    <motion.div 
      whileTap={{ scale: 0.98, y: 1 }}
      whileHover={{ scale: 1.01, borderColor: "rgba(239, 68, 68, 0.3)" }}
      onClick={onClick}
      className={cn(
        "premium-card p-4 flex justify-between items-center group cursor-pointer border relative overflow-hidden",
        isSelected 
          ? "border-primary bg-primary/[0.03] shadow-[inset_0_0_20px_rgba(239, 68, 68, 0.05)]" 
          : "border-white/5 bg-secondary/40 hover:bg-secondary/60"
      )}
    >
      <div className="flex items-center gap-4 relative z-10">
        {icon && (
          <div className={cn(
            "p-2.5 rounded-lg transition-all duration-500",
            isSelected ? "bg-primary text-black" : "bg-white/5 text-gray-400 group-hover:text-primary"
          )}>
            {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: 16 }) : icon}
          </div>
        )}
        <div>
          <p className={cn(
            "font-black text-[11px] uppercase tracking-[0.1em] transition-colors",
            isSelected ? "text-primary" : "text-gray-200 group-hover:text-white"
          )}>
            {option.name}
          </p>
          {option.description && (
            <p className="text-[9px] text-gray-500 mt-0.5 leading-tight font-medium max-w-[180px]">
              {option.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 relative z-10">
        {shouldShowPrice && (
          <span className="text-[10px] font-mono font-black text-gray-500 group-hover:text-gray-300 transition-colors">
            {displayPrice > 0 ? `+${displayPrice.toFixed(2)}€` : `${displayPrice.toFixed(2)}€`}
          </span>
        )}
        <div className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-500",
          isSelected 
            ? "bg-primary border-primary text-black scale-105" 
            : "border-white/10 bg-black/40 text-transparent"
        )}>
          <Check size={10} strokeWidth={4} />
        </div>
      </div>

      {isSelected && (
        <motion.div 
          layoutId="active-bg"
          className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] to-transparent pointer-events-none"
        />
      )}
    </motion.div>
  );
}
