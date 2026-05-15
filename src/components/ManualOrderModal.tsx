"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FORMULAS, ORDER_TYPES } from "@/lib/data";
import { SandwichConfig, Option, Order, Category } from "@/types";
import { supabase } from "@/lib/supabase";
import { 
  X, Plus, Check, MinusCircle, Phone, ShoppingCart, 
  User, ArrowRight, ArrowLeft, Trash2, Minus, 
  AlertCircle, Sparkles, ReceiptText
} from "lucide-react";
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
  // Logic Steps: 
  // 0: Order Type (Takeaway/On-site)
  // 1: Formula (Menu/Sandwich)
  // 2: Meat/Preset selection
  // 3: Ingredients Removal (SANS...) -> New Natural position!
  // 4: Sauces
  // 5: Extras
  // 6: Drinks
  // 7: Desserts
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
    { id: "meats", name: "Choix Viandes (Mix)", options: menuCategories.find(c => c.id === 'meats')?.options || [] },
    { id: "steaks", name: "Nombre Steaks", options: menuCategories.find(c => c.id === 'steaks_qty')?.options || [] },
    { id: "removals", name: "Retrait Ingrédients", options: [] }, // Custom step
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
      meats: [],
      steaks_qty: undefined,
      sauces: [],
      extras: [],
      drinks: [],
      desserts: [],
      removed_ingredients: [],
    });
    setStep(1); 
  };

  const addItemToBasket = () => {
    if (!config.formula || !config.preset_sandwich) return;
    if (config.preset_sandwich.id === 'p4' && (config.meats || []).length < 2) {
      alert("Veuillez choisir au moins 2 viandes pour le Mix Grill");
      return;
    }
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
      if (option.id === 'p4') {
        setStep(3); // Goes to MEATS
      } else if (option.id === 'p5') {
        setStep(4); // Goes to STEAKS
      } else {
        setStep(5); // Skip MEATS & STEAKS, go to Removals
      }
    } else if (catId === "meats") {
      const currentMeats = config.meats || [];
      const isSelected = currentMeats.find((m) => m.id === option.id);
      if (isSelected) {
        setConfig({ ...config, meats: currentMeats.filter((m) => m.id !== option.id) });
      } else {
        if (currentMeats.length >= 3) return;
        setConfig({ ...config, meats: [...currentMeats, option] });
      }
    } else if (catId === "steaks") {
      setConfig({ ...config, steaks_qty: option });
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

  // EXPERT PRICING LOGIC
  const calculateItemPrice = (item: SandwichConfig) => {
    if (!item.formula) return 0;
    
    let total = item.formula.price;
    const formulaId = item.formula.id;
    const isMenu = formulaId.includes('menu');
    
    // Sandwich Premium Surcharge
    if (item.preset_sandwich && formulaId !== 'menu_kids') {
      // Base sandwich price is now 12€. Only p4 (Mix) is 15€.
      const extra = Math.max(0, item.preset_sandwich.price - 12);
      total += extra;
    }

    // Steaks surcharge for Burgers
    if (item.preset_sandwich?.id === 'p5' && item.steaks_qty) {
      total += item.steaks_qty.price;
    }

    // Sauces (2 free, then 0.50€)
    const saucesCount = item.sauces.length;
    total += Math.max(0, saucesCount - 2) * 0.5;

    // Extras (always paid)
    total += item.extras.reduce((acc, e) => acc + e.price, 0);
    
    // Drinks Logic
    const drinks = item.drinks || [];
    const drinkQuota = isMenu ? 1 : 0;
    
    if (drinks.length > 0) {
      const allDrinkItems = drinks.flatMap(d => Array(d.quantity).fill(d.option));
      // Sort by price to give the most expensive ones for free if they are standard cans
      const standardDrinks = allDrinkItems.filter(d => !d.name.includes('1.5L') && !d.name.includes('2L'));
      const premiumDrinks = allDrinkItems.filter(d => d.name.includes('1.5L') || d.name.includes('2L'));
      
      // Included drinks (only standard cans)
      const paidStandard = standardDrinks.slice(drinkQuota);
      total += paidStandard.reduce((acc, d) => acc + d.price, 0);
      
      // Premium bottles are always paid in full
      total += premiumDrinks.reduce((acc, d) => acc + d.price, 0);
    }

    // Desserts (always paid)
    total += (item.desserts || []).reduce((acc, d) => acc + (d.option.price * d.quantity), 0);
    
    return total;
  };

  const calculateTotal = () => {
    const basketTotal = basket.reduce((acc, item) => acc + calculateItemPrice(item), 0);
    const currentTotal = calculateItemPrice(config);
    return basketTotal + currentTotal;
  };

  const handleSubmit = async () => {
    const finalItems = [...basket];
    if (config.formula && config.preset_sandwich) finalItems.push(config);
    if (finalItems.length === 0) return;

    const newOrder: Order = {
      id: "TEL-" + Math.random().toString(36).substr(2, 5).toUpperCase(),
      client_name: clientInfo.name,
      client_phone: clientInfo.phone,
      items: finalItems,
      total_price: calculateTotal(),
      status: "pending",
      payment_status: "unpaid",
      payment_method: "cash",
      order_type: orderType,
      pickup_time: "Téléphone",
      notes: (clientInfo as any).notes || "",
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('orders').insert([newOrder]);
    
    if (error) {
      alert("Erreur lors de la sauvegarde de la commande: " + error.message);
      return;
    }

    onOrderCreated(newOrder);
    onClose();
    resetCurrentConfig();
    setBasket([]);
    setClientInfo({ name: "Client Téléphone", phone: "" });
    setStep(0);
  };

  const currentIngredients = useMemo(() => {
    return config.preset_sandwich?.description?.split(',').map(i => i.trim()) || [];
  }, [config.preset_sandwich]);

  if (!isOpen) return null;

  const showNextButton = ["removals", "sauces", "extras", "drinks", "desserts"].includes(currentCategory.id);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl overflow-hidden">
      <div className="w-full h-full md:h-[95vh] md:max-w-7xl md:rounded-[40px] border border-white/10 bg-[#080808] shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden">
        
        {/* Header Premium */}
        <header className="px-8 py-6 border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent flex justify-between items-center shrink-0">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <div className="relative bg-primary text-black p-4 rounded-2xl shadow-lg">
                <Phone size={28} strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-serif font-black text-white italic tracking-tight">Expert Call Center</h2>
              <div className="flex items-center gap-3 mt-1.5">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border transition-all",
                  orderType === 'takeaway' 
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-500" 
                    : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                )}>
                  {orderType === 'takeaway' ? 'À Emporter' : 'Sur Place'}
                </span>
                <div className="h-1 w-1 rounded-full bg-white/20" />
                <span className="text-white font-black text-[10px] uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10">
                  SESSION: {clientInfo.name}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-0.5">Total en cours</p>
              <p className="text-2xl font-black text-primary font-mono">{calculateTotal().toFixed(2)}€</p>
            </div>
            <button onClick={onClose} className="bg-white/5 hover:bg-red-500 text-white hover:text-white p-4 rounded-2xl transition-all border border-white/10 hover:border-red-600 group">
              <X size={28} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Main Area: Logic Flow */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-white/5 relative">
            
            {/* Steps Visual Guide */}
            <div className="px-10 py-6 bg-white/[0.02] flex gap-3 shrink-0 items-center">
              {modalCategories.map((cat, i) => (
                <React.Fragment key={cat.id}>
                  <div className={cn(
                    "h-2 flex-1 rounded-full transition-all duration-700 relative overflow-hidden",
                    i === step ? "bg-primary shadow-[0_0_15px_rgba(255,184,0,0.4)]" : i < step ? "bg-white/40" : "bg-white/5"
                  )}>
                    {i === step && (
                      <motion.div 
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      />
                    )}
                  </div>
                </React.Fragment>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-10 py-6 custom-scrollbar scroll-smooth">
              <motion.div 
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-8 h-[2px] bg-primary" />
                  <p className="text-[12px] text-primary font-black tracking-[0.4em] uppercase">Phase {step + 1}</p>
                </div>
                <h3 className="text-5xl font-serif font-bold text-white italic tracking-tight leading-none">{currentCategory.name}</h3>
              </motion.div>

              {/* DYNAMIC GRIDS */}
              {currentCategory.id === 'removals' ? (
                /* STEP: REMOVALS (SANS...) - NOW PROMINENT */
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-red-500/10 border-2 border-red-500/20 p-8 rounded-[32px] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                      <MinusCircle size={120} />
                    </div>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="bg-red-500 p-3 rounded-2xl text-white shadow-lg shadow-red-500/20">
                        <AlertCircle size={24} />
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-white uppercase tracking-widest italic">Personnalisation Rapide</h4>
                        <p className="text-red-500/80 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Cliquez sur ce que le client NE veut PAS</p>
                      </div>
                    </div>
                    
                    {currentIngredients.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {currentIngredients.map((ing, i) => (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            key={i}
                            onClick={() => toggleIngredientRemoval(ing)}
                            className={cn(
                              "group py-6 rounded-2xl text-sm font-black uppercase tracking-widest transition-all border-2 flex flex-col items-center gap-2",
                              config.removed_ingredients?.includes(ing)
                                ? "bg-red-600 border-red-500 text-white shadow-2xl shadow-red-600/40"
                                : "bg-black/40 border-white/5 text-white/40 hover:border-red-500/40 hover:text-red-500"
                            )}
                          >
                            <span className="text-[9px] opacity-60">SANS</span>
                            {ing}
                          </motion.button>
                        ))}
                      </div>
                    ) : (
                      <div className="py-10 text-center border-2 border-dashed border-white/10 rounded-2xl">
                        <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Aucun ingrédient standard à retirer</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : currentCategory.id === 'meats' ? (
                /* STEP: MEATS (MIX GRILL) */
                <div className="space-y-6">
                  <div className="bg-primary/5 border border-primary/20 p-6 rounded-3xl text-center">
                    <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em]">Mode Mix Grill</p>
                    <p className="text-white text-sm font-medium mt-1">Sélectionnez 2 ou 3 viandes pour le mélange</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {currentCategory.options.map((opt) => {
                      const isSelected = (config.meats || []).some(m => m.id === opt.id);
                      return (
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          key={opt.id}
                          onClick={() => handleOptionToggle(opt)}
                          className={cn(
                            "relative p-8 rounded-[24px] border-2 transition-all flex flex-col items-center justify-center text-center gap-2 group min-h-[120px]",
                            isSelected 
                              ? "border-primary bg-primary/10 shadow-[0_0_40px_rgba(255,184,0,0.1)]" 
                              : "border-white/5 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                          )}
                        >
                          <span className={cn("font-black uppercase tracking-[0.1em] text-sm", isSelected ? "text-primary" : "text-white")}>{opt.name}</span>
                          {isSelected && <div className="absolute top-3 right-3 bg-primary text-black p-1.5 rounded-lg shadow-lg"><Check size={12} strokeWidth={4} /></div>}
                        </motion.button>
                      );
                    })}
                  </div>
                  <button 
                    onClick={() => setStep(step + 1)}
                    disabled={(config.meats || []).length < 2}
                    className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 hover:bg-primary transition-all disabled:opacity-20"
                  >
                    Valider le Mix Grill ({(config.meats || []).length}/3) <ArrowRight size={18} />
                  </button>
                </div>
              ) : (
                /* OTHER STEPS: STANDARD GRIDS */
                <div className={cn(
                  "grid gap-4",
                  currentCategory.id === 'presets' ? "grid-cols-1 md:grid-cols-2" : 
                  currentCategory.id === 'formula' ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3"
                )}>
                  {currentCategory.options.map((opt) => {
                    const isSelected = isOptionSelected(opt.id);
                    const isDrinkOrDessert = ["drinks", "desserts"].includes(currentCategory.id);
                    const qty = isDrinkOrDessert ? getQuantity(currentCategory.id as 'drinks' | 'desserts', opt.id) : 0;
                    
                    // Pricing help
                    const isCan = opt.name.includes('(33cl)');
                    const isFormulaMenu = config.formula?.id.includes('menu');
                    const isFreeInMenu = isDrinkOrDessert && isCan && isFormulaMenu && qty === 0;

                    return (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        key={opt.id}
                        onClick={() => !isDrinkOrDessert && handleOptionToggle(opt)}
                        className={cn(
                          "relative p-8 rounded-[24px] border-2 transition-all flex flex-col items-center justify-center text-center gap-4 group",
                          currentCategory.id === 'presets' ? "min-h-[160px]" : "min-h-[120px]",
                          (isSelected || qty > 0) 
                            ? "border-primary bg-primary/10 shadow-[0_0_40px_rgba(255,184,0,0.1)]" 
                            : "border-white/5 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                        )}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className={cn(
                            "font-black uppercase tracking-[0.1em] transition-all",
                            currentCategory.id === 'presets' ? "text-2xl" : "text-[11px]",
                            (isSelected || qty > 0) ? "text-primary" : "text-white"
                          )}>
                            {opt.name}
                          </span>
                          {opt.description && (
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                              {opt.description}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {isFreeInMenu && (
                            <span className="text-[9px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                              Inclus
                            </span>
                          )}
                          {opt.price > 0 && (
                            <span className="text-[11px] font-mono font-black text-gray-400">
                              {currentCategory.id === 'presets' && opt.price > 12 ? `+${(opt.price - 12).toFixed(2)}€` : `+${opt.price.toFixed(2)}€`}
                            </span>
                          )}
                        </div>
                        
                        {isDrinkOrDessert && (
                          <div className="flex items-center gap-5 mt-4 bg-black/80 p-3 rounded-2xl border border-white/10 shadow-xl" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => updateQuantity(currentCategory.id as 'drinks' | 'desserts', opt, -1)} className="p-2 hover:text-red-500 text-white transition-colors"><Minus size={20} /></button>
                            <span className="text-2xl font-black w-8 text-primary font-mono">{qty}</span>
                            <button onClick={() => updateQuantity(currentCategory.id as 'drinks' | 'desserts', opt, 1)} className="p-2 hover:text-green-500 text-white transition-colors"><Plus size={20} /></button>
                          </div>
                        )}
                        {(isSelected && !isDrinkOrDessert) && (
                          <motion.div 
                            initial={{ scale: 0 }} 
                            animate={{ scale: 1 }} 
                            className="absolute -top-3 -right-3 bg-primary text-black p-2 rounded-xl shadow-lg border-4 border-[#080808]"
                          >
                            <Check size={16} strokeWidth={4} />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Navigation Footer */}
            <div className="p-8 border-t border-white/5 bg-white/[0.02] flex gap-6 shrink-0 backdrop-blur-md">
              <button 
                onClick={() => setStep(Math.max(0, step - 1))} 
                className={cn(
                  "flex-1 py-5 rounded-2xl border border-white/10 font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 transition-all", 
                  step === 0 ? "opacity-20 pointer-events-none" : "hover:bg-white/5 text-white"
                )}
              >
                <ArrowLeft size={18} /> Précédent
              </button>
              
              {currentCategory.id === 'desserts' ? (
                <div className="flex-[2] flex gap-3">
                  <button 
                    onClick={addItemToBasket}
                    className="flex-1 py-5 bg-primary/20 text-primary border border-primary/30 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:bg-primary/30 transition-all"
                  >
                    + Autre Article
                  </button>
                  <button 
                    onClick={handleSubmit}
                    className="flex-1 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:bg-gray-200 transition-all shadow-xl"
                  >
                    Finaliser <Check size={18} />
                  </button>
                </div>
              ) : showNextButton ? (
                <button 
                  onClick={() => setStep(Math.min(modalCategories.length - 1, step + 1))} 
                  className="flex-[2] py-5 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 hover:bg-primary hover:shadow-[0_0_30px_rgba(255,184,0,0.3)] transition-all"
                >
                  Suivant <ArrowRight size={18} />
                </button>
              ) : (
                 <div className="flex-[2] text-center text-gray-600 text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center italic opacity-40">
                   SÉLECTION AUTO AU CLIC
                 </div>
              )}
            </div>
          </div>

          {/* Right Panel: Basket & Client Info */}
          <div className="w-full md:w-[420px] flex flex-col bg-black/40 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            
            {/* Basket Section */}
            <div className="flex-1 flex flex-col overflow-hidden p-8 relative z-10">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.4em] flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Récapitulatif
                </h4>
                <ReceiptText size={16} className="text-white/20" />
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-3">
                <AnimatePresence mode="popLayout">
                  {basket.map((item, idx) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      key={idx} 
                      className="bg-white/[0.04] p-5 rounded-[24px] border border-white/5 group relative hover:border-white/20 transition-all"
                    >
                      <button 
                        onClick={() => setBasket(basket.filter((_, i) => i !== idx))} 
                        className="absolute -top-2 -right-2 p-2.5 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-110 active:scale-90"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-black text-white uppercase tracking-wider">{item.formula?.name}</p>
                        <p className="text-xs font-black text-primary font-mono">{calculateItemPrice(item).toFixed(2)}€</p>
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-gray-600" />
                        {item.preset_sandwich?.name}
                      </p>
                      
                      {/* Detailed View */}
                      <div className="mt-3 space-y-1 border-t border-white/5 pt-3">
                        {item.removed_ingredients && item.removed_ingredients.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {item.removed_ingredients.map(ing => (
                              <span key={ing} className="text-[8px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full uppercase font-black border border-red-500/10">SANS {ing}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1.5 text-[8px] font-black uppercase tracking-widest text-gray-500">
                          {item.sauces.map(s => <span key={s.id} className="bg-white/5 px-2 py-0.5 rounded-full">{s.name}</span>)}
                          {item.extras.map(e => <span key={e.id} className="bg-primary/10 text-primary/80 px-2 py-0.5 rounded-full border border-primary/10">+{e.name}</span>)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* current pending item logic visual */}
                {(config.formula || config.preset_sandwich) && (
                  <div className="bg-primary/[0.02] p-6 rounded-[24px] border-2 border-primary/20 border-dashed relative overflow-hidden group">
                    <div className="absolute inset-0 bg-primary/[0.02] animate-pulse pointer-events-none" />
                    <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                      <Sparkles size={14} /> En cours...
                    </p>
                    <div className="space-y-2">
                      {config.formula && <p className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2"><ArrowRight size={10} className="text-primary" /> {config.formula.name}</p>}
                      {config.preset_sandwich && <p className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2"><ArrowRight size={10} className="text-primary" /> {config.preset_sandwich.name}</p>}
                    </div>
                    {config.formula && config.preset_sandwich && (
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={addItemToBasket} 
                        className="w-full mt-6 py-4 bg-primary text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.03] transition-all relative z-10"
                      >
                        + Valider cet article
                      </motion.button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Form Section */}
            <div className="p-8 border-t border-white/5 bg-black/80 space-y-6 relative z-10">
              <div className="space-y-4">
                <div className="relative group">
                  <User size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" 
                    placeholder="NOM DU CLIENT" 
                    className="w-full bg-white/[0.05] border border-white/10 p-5 pl-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] outline-none focus:border-primary focus:bg-white/[0.08] transition-all text-white placeholder:text-gray-600 shadow-inner" 
                    value={clientInfo.name} 
                    onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })} 
                  />
                </div>
                <div className="relative group">
                  <Phone size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" />
                  <input
                    type="tel"
                    placeholder="TÉLÉPHONE"
                    className="w-full bg-white/[0.05] border border-white/10 p-5 pl-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] outline-none focus:border-primary focus:bg-white/[0.08] transition-all text-white placeholder:text-gray-600 shadow-inner"
                    value={clientInfo.phone}
                    onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
                  />
                </div>

                <div className="relative group bg-white/[0.03] border border-white/5 p-5 rounded-2xl">
                  <label className="text-[9px] text-primary uppercase font-black tracking-[0.2em] block mb-2">Instructions Spéciales (ex: Sans oignons...)</label>
                  <textarea 
                    value={(clientInfo as any).notes || ""} 
                    onChange={(e) => setClientInfo({ ...clientInfo, notes: e.target.value } as any)} 
                    placeholder="Notes pour la cuisine..." 
                    className="w-full bg-transparent border-none outline-none text-[10px] text-gray-300 placeholder:text-gray-600 resize-none h-16 font-medium"
                  />
                </div>
                </div>
              <div className="pt-2 border-t border-white/5 flex justify-between items-end mb-2">
                <div>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Total Global</span>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    <span className="text-3xl font-black text-white font-mono">{calculateTotal().toFixed(2)}€</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest italic opacity-60">Paiement Cash / CB sur place</p>
                </div>
              </div>

              <button 
                onClick={handleSubmit} 
                disabled={basket.length === 0 && (!config.formula || !config.preset_sandwich)}
                className="w-full py-6 premium-gradient text-black font-black rounded-2xl flex items-center justify-center gap-4 uppercase text-[12px] tracking-[0.3em] shadow-[0_10px_40px_rgba(239,68,68,0.2)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-10 disabled:grayscale disabled:pointer-events-none relative overflow-hidden"
              >
                <span className="relative z-10 text-white">Confirmer la Commande</span>
                <ArrowRight size={22} className="relative z-10 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}