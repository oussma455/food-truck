"use client";

import React from "react";
import { motion } from "framer-motion";

interface StepContainerProps {
  readonly title: string;
  readonly subtitle: string;
  readonly children: React.ReactNode;
}

export default function StepContainer({ title, subtitle, children }: StepContainerProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="flex-1"
    >
      <div className="mb-4">
        <span className="text-[9px] text-primary font-black tracking-[0.2em] uppercase block mb-0.5 opacity-60">
          {title}
        </span>
        <h2 className="text-3xl font-serif italic text-white leading-tight">
          {subtitle}
        </h2>
      </div>
      {children}
    </motion.div>
  );
}
