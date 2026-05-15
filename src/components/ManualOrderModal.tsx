"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SANDWICH_CATEGORIES, FORMULAS, ORDER_TYPES } from "@/lib/data";
import { SandwichConfig, Option, Order, Category } from "@/types";
import { X, Plus, Check, MinusCircle, Phone, ShoppingCart, User, ArrowRight, ArrowLeft, Trash2, Minus } from "lucide-react";
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
  const [basket, setBasket] = useState<SandwichConfig[]>([]);
  const [config, setConfig] = useState<SandwichConfig>({
    sauces: [],
    extras: [],
    drinks: [],
    desserts: [],
    removed_ingredients: [],
  });
  const [clientInfo, setClientInfo] = useState({ name: "Client Téléphone", phone: "" });

  const modalCategories = [
    { id: "order_type", name: "Type", options: ORDER_TYPES },
    { id: "formula", name: "Formule", options: FORMULAS },
    { id: "presets", name: "Sandwich / Viande", options: menuCategories.find(c => c.id === 'presets')?.options || [] },
    { id: "sauces", name: "Sauces", options: menuCategories.find(c => c.id === 'sauces')?.options || [] },
    { id: "extras", name: "Extras", options: menuCategories.find(c => c.id === 'extras')?.options || [] },
    { id: "drinks", name: "Boissons", options: menuCategories.find(c => c.id === 'drinks')?.options || [] },
    { id: "desserts", name: "Desserts", options: menuCategories.find(c => c.id === 'desserts')?.options || [] },
  ];

  const currentCategory = modalCategories[step];

  const resetCurrentConfig = () => {
    setConfig({
      formula: undefined,
      creation_mode: 'signature',
      preset_sandwich: undefined,
      bread: undefined,
      meat: undefined,
      sauces: [],
      extras: [],
      drinks: [],
      desserts: [],
      removed_ingredients: [],
    });
    setStep(1); // Go back to Formula selection for the next item
  };

  const addItemToBasket = () => {
    if (!config.formula || !config.preset_sandwich) return;
    setBasket([...basket, config]);
    resetCurrentConfig();
  };

  const handleOptionToggle = (option: Option) => {
    const catId = currentCategory.id;
    
    if (catId === "order_type") {
      setOrderType(option.id as 'on_site' | 'takeaway');
      setStep(step + 1);
    } else if (catId === "formula") {
      setConfig({ ...config, formula: option });
      setStep(step + 1);
    } else if (catId === "presets") {
      setConfig({ 
        ...config, 
        preset_sandwich: option, 
        creation_mode: 'signature',
        removed_ingredients: []
      });
      // Move to Sauces after picking meat/sandwich
      setStep(step + 1);
    } else if (catId === "sauces") {
      const isSelected = config.sauces.find((s) => s.id === option.id);
      if (isSelected) {
        setConfig({ ...config, sauces: config.sauces.filter((s) => s.id !== option.id) });
      } else {
        setConfig({ ...config, sauces: [...config.sauces, option] });
      }
    } else if (catId === "extras") {
      const isSelected = config.extras.find((e) => e.id === option.id);
      if (isSelected) {
        setConfig({ ...config, extras: config.extras.filter((e) => e.id !== option.id) });
      } else {
        setConfig({ ...config, extras: [...config.extras, option] });
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
    }
  };

  const updateQuantity = (catId: 'drinks' | 'desserts', option: Option, delta: number) => {
    const currentList = config[catId] || [];
    const existing = currentList.find(i => i.option.id === option.id);
    if (existing) {
      const newQty = Math.max(0, existing.quantity + delta);
      if (newQty === 0) setConfig({ ...config, [catId]: currentList.filter(i => i.option.id !== option.id) });
      else setConfig({ ...config, [catId]: currentList.map(i => i.option.id === option.id ? { ...i, quantity: newQty } : i) });
    } else if (delta > 0) {
      setConfig({ ...config, [catId]: [...currentList, { option, quantity: 1 }] });
    }
  };

  const getQuantity = (catId: 'drinks' | 'desserts', optionId: string) => {
    return (config[catId] || []).find(i => i.option.id === optionId)?.quantity || 0;
  };

  const toggleIngredientRemoval = (ingredient: string) => {
    const current = config.removed_ingredients || [];
    if (current.includes(ingredient)) {
      setConfig({ ...config, removed_ingredients: current.filter(i => i !== ingredient) });
    } else {
      setConfig({ ...config, removed_ingredients: [...current, ingredient] });
    }
  };

  const isOptionSelected = (optionId: string) => {
    const catId = currentCategory.id;
    if (catId === "order_type") return orderType === optionId;
    if (catId === "formula") return config.formula?.id === optionId;
    if (catId === "presets") return config.preset_sandwich?.id === optionId;
    if (catId === "sauces") return config.sauces.some((s) => s.id === optionId);
    if (catId === "extras") return config.extras.some((e) => e.id === optionId);
    if (catId === "drinks") return (config.drinks || []).some((d) => d.option.id === optionId);
    if (catId === "desserts") return (config.desserts || []).some((d) => d.option.id === optionId);
    return false;
  };

  const calculateItemPrice = (item: SandwichConfig) => {
    let total = item.formula?.price || 0;
    if (item.preset_sandwich) total = Math.max(total, item.preset_sandwich.price);
    const saucesCount = item.sauces.length;
    total += Math.max(0, saucesCount - 2) * 0.5;
    total += item.extras.reduce((acc, e) => acc + e.price, 0);
    total += (item.drinks || []).reduce((acc, d) => acc + (d.option.price * d.quantity), 0);
    total += (item.desserts || []).reduce((acc, d) => acc + (d.option.price * d.quantity), 0);
    return total;
  };

  const calculateTotal = () => {
    const basketTotal = basket.reduce((acc, item) => acc + calculateItemPrice(item), 0);
    const currentTotal = (config.formula && config.preset_sandwich) ? calculateItemPrice(config) : 0;
    return basketTotal + currentTotal;
  };

  const handleSubmit = () => {
    const finalItems = [...basket];
    if (config.formula && config.preset_sandwich) finalItems.push(config);
    if (finalItems.length === 0) return;

    onOrderCreated({
      id: "MAN-" + Math.random().toString(36).substr(2, 5).toUpperCase(),
      client_name: clientInfo.name,
      client_phone: clientInfo.phone,
      items: finalItems,
      total_price: calculateTotal(),
      status: "pending",
      payment_status: "unpaid",
      payment_method: "cash",
      order_type: orderType,
      pickup_time: "Téléphone",
      created_at: new Date().toISOString(),
    });
    onClose();
    resetCurrentConfig();
    setBasket([]);
    setClientInfo({ name: "Client Téléphone", phone: "" });
    setStep(0);
  };

  const currentIngredients = config.preset_sandwich?.description?.split(',').map(i => i.trim()) || [];

  if (!isOpen) return null;

  const showNextButton = ["sauces", "extras", "drinks", "desserts"].includes(currentCategory.id);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md overflow-hidden">
      <div className="w-full h-full md:h-[95vh] md:max-w-6xl md:rounded-3xl border border-white/10 bg-[#050505] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header Ultra-Visuel */}
        <header className="p-6 border-b border-white/5 bg-white/2 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20">
              <Phone className="text-primary" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-black text-white italic">Prise de Commande</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest", orderType === 'takeaway' ? "bg-amber-500/20 text-amber-500" : "bg-blue-500/20 text-blue-500")}>
                  {orderType === 'takeaway' ? 'À Emporter' : 'Sur Place'}
                </span>
                <span className="text-gray-500 text-[8px] font-black uppercase tracking-widest">• Total: {calculateTotal().toFixed(2)}€</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="bg-white/5 hover:bg-red-500/20 hover:text-red-500 p-4 rounded-2xl transition-all border border-white/10">
            <X size={24} />
          </button>
        </header>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Main Area: Large Buttons */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-white/5">
            
            {/* Steps Indicator */}
            <div className="px-8 pt-6 flex gap-2 shrink-0">
              {modalCategories.map((cat, i) => (
                <div key={cat.id} className={cn("h-1.5 flex-1 rounded-full transition-all duration-500", i === step ? "bg-primary shadow-[0_0_10px_rgba(255,184,0,0.5)]" : i < step ? "bg-white/40" : "bg-white/5")} />
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="mb-8">
                <p className="text-[10px] text-primary font-black tracking-[0.3em] uppercase mb-1">Étape {step + 1}</p>
                <h3 className="text-3xl font-serif font-bold text-white italic">{currentCategory.name}</h3>
              </div>

              {/* GRIDS OPTIMISÉES PAR ÉTAPE */}
              <div className={cn(
                "grid gap-4",
                currentCategory.id === 'presets' ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3"
              )}>
                {currentCategory.options.map((opt) => {
                  const isSelected = isOptionSelected(opt.id);
                  const isDrinkOrDessert = ["drinks", "desserts"].includes(currentCategory.id);
                  const qty = isDrinkOrDessert ? getQuantity(currentCategory.id as 'drinks' | 'desserts', opt.id) : 0;

                  return (
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      key={opt.id}
                      onClick={() => !isDrinkOrDessert && handleOptionToggle(opt)}
                      className={cn(
                        "relative p-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center gap-3",
                        currentCategory.id === 'presets' ? "min-h-[140px]" : "min-h-[100px]",
                        (isSelected || qty > 0) 
                          ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(255,184,0,0.1)]" 
                          : "border-white/5 bg-white/2 hover:border-white/20"
                      )}
                    >
                      <span className={cn(
                        "font-black uppercase tracking-widest",
                        currentCategory.id === 'presets' ? "text-xl" : "text-xs",
                        (isSelected || qty > 0) ? "text-primary" : "text-gray-400"
                      )}>
                        {opt.name}
                      </span>
                      {opt.price > 0 && <span className="text-[10px] font-mono text-gray-500">+{opt.price.toFixed(2)}€</span>}
                      
                      {isDrinkOrDessert && (
                        <div className="flex items-center gap-4 mt-2 bg-black/60 p-2 rounded-xl border border-white/10" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => updateQuantity(currentCategory.id as 'drinks' | 'desserts', opt, -1)} className="p-2 hover:text-primary text-gray-500"><Minus size={18} /></button>
                          <span className="text-lg font-black w-6 text-primary">{qty}</span>
                          <button onClick={() => updateQuantity(currentCategory.id as 'drinks' | 'desserts', opt, 1)} className="p-2 hover:text-primary text-gray-500"><Plus size={18} /></button>
                        </div>
                      )}
                      {(isSelected && !isDrinkOrDessert) && <div className="absolute top-3 right-3 bg-primary text-black p-1 rounded-full"><Check size={12} strokeWidth={4} /></div>}
                    </motion.button>
                  );
                })}
              </div>

              {/* INGRÉDIENTS À ENLEVER : GROS ET VISUEL */}
              {currentCategory.id === 'sauces' && config.preset_sandwich && currentIngredients.length > 0 && (
                <div className="mt-12 p-8 bg-red-500/5 border border-red-500/20 rounded-3xl">
                  <div className="flex items-center gap-3 mb-6">
                    <MinusCircle className="text-red-500" size={24} />
                    <h4 className="text-lg font-black text-white uppercase tracking-widest italic">Retirer des ingrédients ?</h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {currentIngredients.map((ing, i) => (
                      <button
                        key={i}
                        onClick={() => toggleIngredientRemoval(ing)}
                        className={cn(
                          "py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2",
                          config.removed_ingredients?.includes(ing)
                            ? "bg-red-500 border-red-600 text-white shadow-lg shadow-red-500/20"
                            : "bg-black/40 border-white/5 text-gray-500 hover:border-red-500/40"
                        )}
                      >
                        SANS {ing}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Footer */}
            <div className="p-6 border-t border-white/5 bg-white/2 flex gap-4 shrink-0">
              <button 
                onClick={() => setStep(Math.max(0, step - 1))} 
                className={cn("flex-1 py-5 rounded-2xl border border-white/10 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2", step === 0 ? "opacity-20 pointer-events-none" : "hover:bg-white/5")}
              >
                <ArrowLeft size={16} /> Précédent
              </button>
              
              {showNextButton ? (
                <button 
                  onClick={() => setStep(Math.min(modalCategories.length - 1, step + 1))} 
                  className="flex-[2] py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-gray-200 transition-all shadow-xl"
                >
                  Suivant <ArrowRight size={16} />
                </button>
              ) : (
                 <div className="flex-[2] text-center text-gray-600 text-[8px] font-black uppercase tracking-[0.3em] flex items-center justify-center italic">
                   Sélection automatique au clic
                 </div>
              )}
            </div>
          </div>

          {/* Right Panel: Basket & Client Info */}
          <div className="w-full md:w-96 flex flex-col bg-black/40 overflow-hidden">
            
            {/* Basket Section */}
            <div className="flex-1 flex flex-col overflow-hidden p-6">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <ShoppingCart size={14} /> Votre Panier
              </h4>
              
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                <AnimatePresence>
                  {basket.map((item, idx) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      key={idx} 
                      className="bg-white/2 p-4 rounded-2xl border border-white/5 group relative"
                    >
                      <button 
                        onClick={() => setBasket(basket.filter((_, i) => i !== idx))} 
                        className="absolute top-2 right-2 p-2 bg-red-500/20 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-xs font-black text-white uppercase">{item.formula?.name}</p>
                        <p className="text-xs font-black text-primary">{calculateItemPrice(item).toFixed(2)}€</p>
                      </div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{item.preset_sandwich?.name}</p>
                      {item.removed_ingredients && item.removed_ingredients.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.removed_ingredients.map(ing => (
                            <span key={ing} className="text-[7px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded uppercase font-black">SANS {ing}</span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* current pending item */}
                {(config.formula || config.preset_sandwich) && (
                  <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 border-dashed">
                    <p className="text-[9px] text-primary font-black uppercase tracking-widest mb-3">En cours...</p>
                    <div className="space-y-1">
                      {config.formula && <p className="text-[10px] font-bold text-white uppercase tracking-widest">● {config.formula.name}</p>}
                      {config.preset_sandwich && <p className="text-[10px] font-bold text-white uppercase tracking-widest">● {config.preset_sandwich.name}</p>}
                    </div>
                    {config.formula && config.preset_sandwich && (
                      <button 
                        onClick={addItemToBasket} 
                        className="w-full mt-4 py-3 bg-primary text-black rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-95 transition-all"
                      >
                        + Ajouter à la commande
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Form Section */}
            <div className="p-6 border-t border-white/10 bg-black/60 space-y-4">
              <div className="space-y-3">
                <div className="relative">
                  <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="NOM DU CLIENT" 
                    className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-primary focus:bg-white/10 transition-all text-white placeholder:text-gray-600" 
                    value={clientInfo.name} 
                    onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })} 
                  />
                </div>
                <div className="relative">
                  <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input 
                    type="tel" 
                    placeholder="TÉLÉPHONE" 
                    className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-primary focus:bg-white/10 transition-all text-white placeholder:text-gray-600" 
                    value={clientInfo.phone} 
                    onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })} 
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-between items-end mb-2 px-1">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Total Global</span>
                <span className="text-2xl font-black text-primary">{calculateTotal().toFixed(2)}€</span>
              </div>

              <button 
                onClick={handleSubmit} 
                disabled={basket.length === 0 && (!config.formula || !config.preset_sandwich)}
                className="w-full premium-gradient text-background font-black py-5 rounded-2xl flex items-center justify-center gap-3 uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20 disabled:pointer-events-none"
              >
                Valider l&apos;Appel <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}