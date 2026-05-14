"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { SANDWICH_CATEGORIES, FORMULAS, ORDER_TYPES, CREATION_MODES } from "@/lib/data";
import { SandwichConfig, Option, Order, Category } from "@/types";
import { X, Plus, Check } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (order: Order) => void;
  menuCategories: Category[];
}

export default function ManualOrderModal({ isOpen, onClose, onOrderCreated, menuCategories }: ManualOrderModalProps) {
  const [step, setStep] = useState(0);
  const [orderType, setOrderType] = useState<'on_site' | 'takeaway'>('takeaway');
  const [config, setConfig] = useState<SandwichConfig>({
    sauces: [],
    extras: [],
    drinks: [],
    desserts: [],
  });
  const [clientInfo, setClientInfo] = useState({ name: "Client Téléphone", phone: "" });

  const modalCategories = [
    { id: "order_type", name: "Type de commande", options: ORDER_TYPES },
    { id: "formula", name: "Formule", options: FORMULAS },
    { id: "creation_mode", name: "Mode de préparation", options: CREATION_MODES },
    ...menuCategories
  ];

  const currentCategory = modalCategories[step];

  const handleOptionToggle = (option: Option) => {
    const catId = currentCategory.id;
    
    if (catId === "order_type") {
      setOrderType(option.id as 'on_site' | 'takeaway');
      setStep(step + 1);
    } else if (catId === "formula") {
      setConfig({ ...config, formula: option });
      setStep(step + 1);
    } else if (catId === "creation_mode") {
      const mode = option.id as 'signature' | 'custom';
      setConfig({ ...config, creation_mode: mode });
      if (mode === 'signature') {
        setStep(step + 1);
      } else {
        const breadStep = modalCategories.findIndex(c => c.id === 'bread');
        if (breadStep !== -1) setStep(breadStep);
      }
    } else if (catId === "presets") {
      setConfig({ 
        ...config, 
        preset_sandwich: option, 
        creation_mode: 'signature',
        bread: undefined,
        meat: undefined
      });
      const saucesStep = modalCategories.findIndex(c => c.id === 'sauces');
      if (saucesStep !== -1) setStep(saucesStep);
    } else if (catId === "bread") {
      setConfig({ 
        ...config, 
        bread: option, 
        creation_mode: 'custom',
        preset_sandwich: undefined 
      });
    } else if (catId === "meat") {
      setConfig({ 
        ...config, 
        meat: option, 
        creation_mode: 'custom',
        preset_sandwich: undefined 
      });
    } else if (catId === "sauces") {
      const isSelected = config.sauces.find((s) => s.id === option.id);
      if (isSelected) {
        setConfig({ ...config, sauces: config.sauces.filter((s) => s.id !== option.id) });
      } else {
        setConfig({ ...config, sauces: [...config.sauces, option] });
      }
    } else if (catId === "drinks" || catId === "desserts") {
      const key = catId as 'drinks' | 'desserts';
      const currentList = config[key] || [];
      const existing = currentList.find(i => i.option.id === option.id);
      
      if (existing) {
        setConfig({ ...config, [key]: currentList.filter(i => i.option.id !== option.id) });
      } else {
        setConfig({ ...config, [key]: [...currentList, { option, quantity: 1 }] });
      }
    } else if (catId === "extras") {
      const isSelected = config.extras.find((e) => e.id === option.id);
      if (isSelected) {
        setConfig({ ...config, extras: config.extras.filter((e) => e.id !== option.id) });
      } else {
        setConfig({ ...config, extras: [...config.extras, option] });
      }
    }
  };

  const isOptionSelected = (optionId: string) => {
    const catId = currentCategory.id;
    if (catId === "order_type") return orderType === optionId;
    if (catId === "formula") return config.formula?.id === optionId;
    if (catId === "creation_mode") return config.creation_mode === optionId;
    if (catId === "presets") return config.preset_sandwich?.id === optionId;
    if (catId === "bread") return config.bread?.id === optionId;
    if (catId === "meat") return config.meat?.id === optionId;
    if (catId === "sauces") return config.sauces.some((s) => s.id === optionId);
    if (catId === "extras") return config.extras.some((e) => e.id === optionId);
    if (catId === "drinks") return (config.drinks || []).some((d) => d.option.id === optionId);
    if (catId === "desserts") return (config.desserts || []).some((d) => d.option.id === optionId);
    return false;
  };

  const calculateTotal = () => {
    let total = config.formula?.price || 0;
    
    if (config.creation_mode === 'signature' && config.preset_sandwich) {
      total = Math.max(total, config.preset_sandwich.price);
    } else if (config.creation_mode === 'custom') {
      if (config.bread) total += config.bread.price;
      if (config.meat) total += config.meat.price;
    }

    const totalSaucePrice = config.sauces.reduce((acc, s) => acc + s.price, 0);
    const sauceDiscount = Math.min(totalSaucePrice, 1.0); 
    total += (totalSaucePrice - sauceDiscount);

    total += config.extras.reduce((acc, e) => acc + e.price, 0);
    total += (config.drinks || []).reduce((acc, d) => acc + (d.option.price * d.quantity), 0);
    total += (config.desserts || []).reduce((acc, d) => acc + (d.option.price * d.quantity), 0);
    return total;
  };

  const handleSubmit = () => {
    if (!config.formula) {
      alert("Veuillez choisir une formule.");
      return;
    }

    if (!config.preset_sandwich && (!config.bread || !config.meat)) {
      alert("Veuillez choisir un sandwich signature ou composer votre propre sandwich (pain + viande).");
      return;
    }

    const newOrder: Order = {
      id: "MAN-" + Math.random().toString(36).substr(2, 5).toUpperCase(),
      client_name: clientInfo.name || "Client Téléphone",
      client_phone: clientInfo.phone || "Non renseigné",
      items: [{
        formula: config.formula,
        creation_mode: config.creation_mode,
        preset_sandwich: config.preset_sandwich,
        bread: config.bread,
        meat: config.meat,
        sauces: config.sauces,
        extras: config.extras,
        drinks: config.drinks,
        desserts: config.desserts,
      }],
      total_price: calculateTotal(),
      status: "pending",
      payment_status: "unpaid",
      payment_method: "cash",
      order_type: orderType,
      pickup_time: "Dès que possible",
      created_at: new Date().toISOString(),
    };

    onOrderCreated(newOrder);
    onClose();
    
    setStep(0);
    setOrderType('takeaway');
    setConfig({
      formula: undefined,
      creation_mode: undefined,
      preset_sandwich: undefined,
      bread: undefined,
      meat: undefined,
      sauces: [],
      extras: [],
      drinks: [],
      desserts: [],
    });
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
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 text-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-4">
                  <span className="text-[10px] text-primary font-bold tracking-[0.2em] uppercase">Étape {step + 1} / {modalCategories.length}</span>
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
                        {option.description && <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">{option.description}</p>}
                      </div>
                      {isOptionSelected(option.id) && <Check size={14} className="text-primary" />}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 mt-6">
                  <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="flex-1 p-2 border border-gray-800 rounded-lg text-xs uppercase font-bold tracking-widest disabled:opacity-30">Précédent</button>
                  <button onClick={() => setStep(Math.min(modalCategories.length - 1, step + 1))} disabled={step === modalCategories.length - 1} className="flex-1 p-2 bg-primary/10 border border-primary/30 text-primary rounded-lg text-xs uppercase font-bold tracking-widest disabled:opacity-30">Suivant</button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-secondary/30 rounded-xl p-5 border border-gray-800/50">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-4">Récapitulatif</h4>
                <ul className="space-y-2 text-xs">
                  <li className="flex justify-between"><span className="text-gray-500">Service:</span><span className="text-white uppercase font-bold">{orderType === 'takeaway' ? 'À Emporter' : 'Sur Place'}</span></li>
                  <li className="flex justify-between"><span className="text-gray-500">Formule:</span><span className={config.formula ? "text-white" : "text-red-500/50 italic"}>{config.formula?.name || "Non choisi"}</span></li>
                  {config.preset_sandwich ? (
                    <li className="flex justify-between"><span className="text-gray-500">Signature:</span><span className="text-white">{config.preset_sandwich.name}</span></li>
                  ) : (
                    <>
                      <li className="flex justify-between"><span className="text-gray-500">Pain:</span><span className={config.bread ? "text-white" : "text-red-500/50 italic"}>{config.bread?.name || "Non choisi"}</span></li>
                      <li className="flex justify-between"><span className="text-gray-500">Viande:</span><span className={config.meat ? "text-white" : "text-red-500/50 italic"}>{config.meat?.name || "Non choisi"}</span></li>
                    </>
                  )}
                  <li className="flex justify-between"><span className="text-gray-500">Sauces:</span><span className="text-white text-right">{config.sauces.map(s => s.name).join(", ") || "Aucune"}</span></li>
                  {config.extras.length > 0 && <li className="flex justify-between"><span className="text-gray-500">Extras:</span><span className="text-white text-right">{config.extras.map(e => e.name).join(", ")}</span></li>}
                  {(config.drinks || []).length > 0 && <li className="flex justify-between"><span className="text-gray-500">Boissons:</span><span className="text-white text-right">{config.drinks?.map(d => d.option.name + ' x' + d.quantity).join(", ")}</span></li>}
                  {(config.desserts || []).length > 0 && <li className="flex justify-between"><span className="text-gray-500">Desserts:</span><span className="text-white text-right">{config.desserts?.map(d => d.option.name + ' x' + d.quantity).join(", ")}</span></li>}
                </ul>
                <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
                  <span className="font-serif font-bold text-white">Total</span>
                  <span className="text-lg font-bold text-primary">{calculateTotal().toFixed(2)}€</span>
                </div>
              </div>

              <div className="space-y-4">
                <input type="text" placeholder="Nom du client" className="w-full bg-black border border-gray-800 p-3 rounded-xl text-sm outline-none focus:border-primary transition-all text-white" value={clientInfo.name} onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })} />
                <input type="tel" placeholder="Téléphone" className="w-full bg-black border border-gray-800 p-3 rounded-xl text-sm outline-none focus:border-primary transition-all text-white" value={clientInfo.phone} onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })} />
              </div>

              <button onClick={handleSubmit} className="w-full premium-gradient text-background font-bold py-4 rounded-xl flex items-center justify-center gap-2 uppercase text-xs tracking-widest shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-95 transition-all mt-4"><Plus size={18} />Valider la commande</button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
