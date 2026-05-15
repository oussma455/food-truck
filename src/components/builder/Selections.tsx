"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { Category, Option, SandwichConfig } from "@/types";
import OptionCard from "./OptionCard";
import StepContainer from "./StepContainer";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CategoryStepProps {
  readonly category: Category;
  readonly config: SandwichConfig;
  readonly setConfig: React.Dispatch<React.SetStateAction<SandwichConfig>>;
  readonly onNext: () => void;
  readonly type: 'single' | 'multiple';
  readonly limit?: number;
  readonly isSauceStep?: boolean;
}

export function CategoryStep({ 
  category, config, setConfig, onNext, type, limit, isSauceStep 
}: CategoryStepProps) {
  const handleToggle = (option: Option) => {
    if (type === 'single') {
      setConfig({ ...config, [category.id]: option });
      onNext();
    } else {
      const current = config[category.id as keyof SandwichConfig] as Option[] || [];
      const isSelected = current.find(s => s.id === option.id);
      if (isSelected) {
        setConfig({ ...config, [category.id]: current.filter(s => s.id !== option.id) });
      } else {
        if (limit && current.length >= limit) return;
        setConfig({ ...config, [category.id]: [...current, option] });
      }
    }
  };

  const isSelected = (id: string) => {
    const val = config[category.id as keyof SandwichConfig];
    if (Array.isArray(val)) return (val as any[]).some(i => (i.id === id || i.option?.id === id));
    return (val as Option)?.id === id;
  };

  return (
    <StepContainer title="Sélection" subtitle={category.name}>
      <div className="grid grid-cols-1 gap-3">
        {category.options.map(option => {
          const currentList = config[category.id as keyof SandwichConfig] as Option[] || [];
          const isIncluded = isSauceStep && currentList.length < 2 && !isSelected(option.id);
          return (
            <OptionCard 
              key={option.id} 
              option={option} 
              isSelected={isSelected(option.id)} 
              onClick={() => handleToggle(option)}
              hidePrice={isSauceStep && (isIncluded || (isSelected(option.id) && currentList.indexOf(currentList.find(s => s.id === option.id)!) < 2))}
              surchargeValue={isSauceStep ? 0.50 : undefined}
            />
          );
        })}
      </div>
    </StepContainer>
  );
}

interface SideSelectorProps {
  readonly label: string;
  readonly options: Option[];
  readonly config: SandwichConfig;
  readonly setConfig: React.Dispatch<React.SetStateAction<SandwichConfig>>;
  readonly type: 'drinks' | 'desserts';
  readonly quota?: number;
}

export function SideSelector({ label, options, config, setConfig, type, quota }: SideSelectorProps) {
  const current = config[type] || [];
  const getQty = (id: string) => current.find(i => i.option.id === id)?.quantity || 0;
  
  const update = (option: Option, delta: number) => {
    const existing = current.find(i => i.option.id === option.id);
    if (existing) {
      const newQty = Math.max(0, existing.quantity + delta);
      if (newQty === 0) setConfig({ ...config, [type]: current.filter(i => i.option.id !== option.id) });
      else setConfig({ ...config, [type]: current.map(i => i.option.id === option.id ? { ...i, quantity: newQty } : i) });
    } else if (delta > 0) { 
      setConfig({ ...config, [type]: [...current, { option, quantity: 1 }] }); 
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-[10px] text-primary font-black uppercase tracking-[0.3em] text-center italic opacity-60">{label}</h3>
      <div className="grid grid-cols-1 gap-3">
        {options.map(opt => {
          const qty = getQty(opt.id);
          const isCan = !opt.name.includes('1.5L') && !opt.name.includes('2L');
          const isBottle15 = opt.name.includes('1.5L');
          
          let isFreeUnitAvailable = false;
          
          if (type === 'drinks' && quota && quota > 0) {
            if (quota === 4) {
              // Logique Couscous 4 Pers : 4 canettes OU 1 bouteille 1.5L
              const hasBottleInCart = current.some(i => i.option.name.includes('1.5L') && i.quantity > 0);
              const totalCansInCart = current.filter(i => !i.option.name.includes('1.5L') && !i.option.name.includes('2L'))
                .reduce((acc, i) => acc + i.quantity, 0);
              
              if (isBottle15) {
                isFreeUnitAvailable = totalCansInCart === 0 && !hasBottleInCart;
              } else if (isCan) {
                isFreeUnitAvailable = !hasBottleInCart && totalCansInCart < 4;
              }
            } else {
              // Logique standard (1, 2 ou 3 canettes)
              const totalCansInCart = current.filter(i => !i.option.name.includes('1.5L') && !i.option.name.includes('2L'))
                .reduce((acc, i) => acc + i.quantity, 0);
              isFreeUnitAvailable = isCan && totalCansInCart < quota;
            }
          }

          return (
            <div key={opt.id} className="premium-card p-4 flex justify-between items-center bg-white/[0.02] border border-white/5">
              <div>
                <p className="font-black text-[11px] uppercase tracking-widest text-gray-200">{opt.name}</p>
                <p className="text-[10px] text-green-500 font-mono mt-0.5">
                  {isFreeUnitAvailable ? "INCLUS" : `${opt.price.toFixed(2)}€`}
                </p>
              </div>
              <div className="flex items-center gap-5 bg-black/40 p-2 rounded-2xl border border-white/5">
                <button 
                  onClick={() => update(opt, -1)} 
                  className="p-2 hover:text-primary transition-colors text-gray-500 hover:bg-white/5 rounded-lg"
                >
                  <Minus size={16} />
                </button>
                <span className="text-sm font-black w-6 text-center text-white font-mono">{qty}</span>
                <button 
                  onClick={() => update(opt, 1)} 
                  className="p-2 hover:text-primary transition-colors text-gray-500 hover:bg-white/5 rounded-lg"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
