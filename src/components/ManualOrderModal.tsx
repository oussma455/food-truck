"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SANDWICH_CATEGORIES } from "@/lib/data";
import { SandwichConfig, Option, Order } from "@/types";
import { X, ChevronRight, ChevronLeft, Plus, Check } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (order: Order) => void;
}

interface ExtendedConfig extends SandwichConfig {
  drinks: Option[];
  desserts: Option[];
}

export default function ManualOrderModal({ isOpen, onClose, onOrderCreated }: ManualOrderModalProps) {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<ExtendedConfig>({
    sauces: [],
    extras: [],
    drinks: [],
    desserts: [],
  });
  const [clientInfo, setClientInfo] = useState({ name: "Client Téléphone", phone: "" });

  const currentCategory = SANDWICH_CATEGORIES[step];

  const handleOptionToggle = (option: Option) => {
    const catId = currentCategory.id;
    
    if (catId === "bread") {
      setConfig({ ...config, bread: option });
    } else if (catId === "meat") {
      setConfig({ ...config, meat: option });
    } else if (catId === "sauces") {
      const isSelected = config.sauces.find((s) => s.id === option.id);
      if (isSelected) {
        setConfig({ ...config, sauces: config.sauces.filter((s) => s.id !== option.id) });
      } else if (config.sauces.length < 2) {
        setConfig({ ...config, sauces: [...config.sauces, option] });
      }
    } else {
      // Extras, drinks, desserts
      const key = catId as keyof ExtendedConfig;
      const currentList = (config[key] as Option[]) || [];
      const isSelected = currentList.find((item) => item.id === option.id);
      
      if (isSelected) {
        setConfig({ ...config, [key]: currentList.filter((item) => item.id !== option.id) });
      } else {
        setConfig({ ...config, [key]: [...currentList, option] });
      }
    }
  };

  const isOptionSelected = (optionId: string) => {
    const catId = currentCategory.id;
    if (catId === "bread") return config.bread?.id === optionId;
    if (catId === "meat") return config.meat?.id === optionId;
    if (catId === "sauces") return config.sauces.some((s) => s.id === optionId);
    if (catId === "extras") return config.extras.some((e) => e.id === optionId);
    if (catId === "drinks") return config.drinks.some((d) => d.id === optionId);
    if (catId === "desserts") return config.desserts.some((d) => d.id === optionId);
    return false;
  };

  const calculateTotal = () => {
    let total = 10;
    if (config.bread) total += config.bread.price;
    if (config.meat) total += config.meat.price;
    total += config.sauces.reduce((acc, s) => acc + s.price, 0);
    total += config.extras.reduce((acc, e) => acc + e.price, 0);
    total += config.drinks.reduce((acc, d) => acc + d.price, 0);
    total += config.desserts.reduce((acc, d) => acc + d.price, 0);
    return total;
  };

  const handleSubmit = () => {
    if (!config.bread || !config.meat) {
      alert("La commande est incomplète (Pain et Viande obligatoires)");
      return;
    }

    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      client_name: clientInfo.name || "Client Téléphone",
      client_phone: clientInfo.phone || "Non renseigné",
      config: {
        bread: config.bread,
        meat: config.meat,
        sauces: config.sauces,
        extras: config.extras,
        drinks: config.drinks,
        desserts: config.desserts,
      },
      total_price: calculateTotal(),
      status: "pending",
      payment_status: "unpaid",
      payment_method: "on_site",
      created_at: new Date().toISOString(),
    };

    onOrderCreated(newOrder);
    onClose();
    // Reset state
    setStep(0);
    setConfig({ sauces: [], extras: [], drinks: [], desserts: [] });
    setClientInfo({ name: "Client Téléphone", phone: "" });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0a0a0a] border border-gray-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-secondary/20">
          <div>
            <h2 className="text-xl font-serif font-bold text-primary">Prise de commande manuelle</h2>
            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Saisie rapide - Appel Téléphonique</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left side: Options */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-4">
                  <span className="text-[10px] text-primary font-bold tracking-[0.2em] uppercase">Étape {step + 1} / {SANDWICH_CATEGORIES.length}</span>
                  <h3 className="text-lg font-serif">{currentCategory.name}</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {currentCategory.options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleOptionToggle(option)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all flex justify-between items-center group text-sm",
                        isOptionSelected(option.id) ? "border-primary bg-primary/10" : "border-gray-800 hover:border-gray-600 bg-black/40"
                      )}
                    >
                      <div>
                        <p className={cn("font-medium", isOptionSelected(option.id) ? "text-primary" : "text-gray-300")}>{option.name}</p>
                        {option.price > 0 && <p className="text-[10px] text-gray-500">+ {option.price.toFixed(2)}€</p>}
                      </div>
                      {isOptionSelected(option.id) && <Check size={14} className="text-primary" />}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 mt-6">
                  <button 
                    onClick={() => setStep(Math.max(0, step - 1))} 
                    disabled={step === 0}
                    className="flex-1 p-2 border border-gray-800 rounded-lg text-xs uppercase font-bold tracking-widest disabled:opacity-30"
                  >
                    Précédent
                  </button>
                  <button 
                    onClick={() => setStep(Math.min(SANDWICH_CATEGORIES.length - 1, step + 1))}
                    disabled={step === SANDWICH_CATEGORIES.length - 1}
                    className="flex-1 p-2 bg-primary/10 border border-primary/30 text-primary rounded-lg text-xs uppercase font-bold tracking-widest disabled:opacity-30"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </div>

            {/* Right side: Summary and Client Info */}
            <div className="space-y-6">
              <div className="bg-secondary/30 rounded-xl p-5 border border-gray-800/50">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-4">Récapitulatif</h4>
                <ul className="space-y-2 text-xs">
                  <li className="flex justify-between">
                    <span className="text-gray-500">Pain:</span>
                    <span className={config.bread ? "text-white" : "text-red-500/50 italic"}>{config.bread?.name || "Non choisi"}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-500">Viande:</span>
                    <span className={config.meat ? "text-white" : "text-red-500/50 italic"}>{config.meat?.name || "Non choisi"}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-500">Sauces:</span>
                    <span className="text-white text-right">{config.sauces.map(s => s.name).join(", ") || "Aucune"}</span>
                  </li>
                  {config.extras.length > 0 && (
                    <li className="flex justify-between">
                      <span className="text-gray-500">Extras:</span>
                      <span className="text-white text-right">{config.extras.map(e => e.name).join(", ")}</span>
                    </li>
                  )}
                  {config.drinks.length > 0 && (
                    <li className="flex justify-between">
                      <span className="text-gray-500">Boissons:</span>
                      <span className="text-white text-right">{config.drinks.map(d => d.name).join(", ")}</span>
                    </li>
                  )}
                  {config.desserts.length > 0 && (
                    <li className="flex justify-between">
                      <span className="text-gray-500">Desserts:</span>
                      <span className="text-white text-right">{config.desserts.map(d => d.name).join(", ")}</span>
                    </li>
                  )}
                </ul>
                <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
                  <span className="font-serif font-bold">Total</span>
                  <span className="text-lg font-bold text-primary">{calculateTotal().toFixed(2)}€</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block mb-1">Nom du client</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Client Téléphone" 
                    className="w-full bg-black border border-gray-800 p-3 rounded-xl text-sm outline-none focus:border-primary transition-all"
                    value={clientInfo.name}
                    onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block mb-1">Téléphone</label>
                  <input 
                    type="tel" 
                    placeholder="06..." 
                    className="w-full bg-black border border-gray-800 p-3 rounded-xl text-sm outline-none focus:border-primary transition-all"
                    value={clientInfo.phone}
                    onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
                  />
                </div>
              </div>

              <button 
                onClick={handleSubmit}
                className="w-full premium-gradient text-background font-bold py-4 rounded-xl flex items-center justify-center gap-2 uppercase text-xs tracking-widest shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-95 transition-all mt-4"
              >
                <Plus size={18} />
                Valider la commande
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
