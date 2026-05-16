"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FORMULAS, ORDER_TYPES } from "@/lib/data";
import { SandwichConfig, Option, Order, Category } from "@/types";
import { supabase } from "@/lib/supabase";
import { 
  X, Plus, Check, ShoppingCart, 
  ArrowRight, ArrowLeft, Minus, 
  ReceiptText, Utensils
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
  const [step, setStep] = useState(0);
  const [orderType, setOrderType] = useState<'on_site' | 'takeaway'>('takeaway');
  const [isCouscousMode, setIsCouscousMode] = useState(false);
  const [basket, setBasket] = useState<SandwichConfig[]>([]);
  const [config, setConfig] = useState<SandwichConfig>({
    sauces: [],
    extras: [],
    drinks: [],
    desserts: [],
    removed_ingredients: [],
  });
  const [clientInfo, setClientInfo] = useState({ name: "Client Téléphone", phone: "", notes: "" });

  const modalCategories = [
    { id: "order_type", name: "Type de commande", options: [
      { id: 'on_site', name: 'Sur Place', price: 0, isAvailable: true },
      { id: 'takeaway', name: 'À Emporter', price: 0, isAvailable: true },
      { id: 'couscous', name: 'Réserver un Couscous', price: 0, isAvailable: true },
    ]},
    { id: "formula", name: "Choix Formule", options: FORMULAS },
    { id: "couscous_size", name: "Taille du Couscous", options: menuCategories.find(c => c.id === 'couscous_size')?.options || [] },
    { id: "presets", name: isCouscousMode ? "Type de Couscous" : "La Grillade", options: isCouscousMode ? (menuCategories.find(c => c.id === 'couscous_type')?.options || []) : (menuCategories.find(c => c.id === 'presets')?.options || []) },
    { id: "meats", name: "Mélange Mix Grill", options: menuCategories.find(c => c.id === 'meats')?.options || [] },
    { id: "steaks", name: "Nombre de Steaks", options: menuCategories.find(c => c.id === 'steaks_qty')?.options || [] },
    { id: "sauces", name: "Les Sauces", options: menuCategories.find(c => c.id === 'sauces')?.options || [] },
    { id: "extras", name: "Les Suppléments", options: menuCategories.find(c => c.id === 'extras')?.options || [] },
    { id: "drinks", name: "Les Boissons", options: menuCategories.find(c => c.id === 'drinks')?.options || [] },
    { id: "desserts", name: "Les Desserts", options: menuCategories.find(c => c.id === 'desserts')?.options || [] },
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
    setIsCouscousMode(false);
  };

  const addItemToBasket = () => {
    if (!config.formula) {
      alert("Erreur : Veuillez sélectionner une Formule ou une Taille.");
      setStep(isCouscousMode ? 2 : 1);
      return;
    }
    if (!config.preset_sandwich) {
      alert("Erreur : Veuillez sélectionner une Grillade ou un Type de Couscous.");
      setStep(3);
      return;
    }
    if (config.preset_sandwich.id === 'p4' && (config.meats || []).length < 2) {
      alert("Le Mix Grill nécessite au moins 2 viandes.");
      setStep(4);
      return;
    }
    
    setBasket(prev => [...prev, { ...config }]);
    resetCurrentConfig();
    setStep(0);
  };

  const handleBack = () => {
    if (step === 1) setStep(0);
    else if (step === 2) setStep(0);
    else if (step === 3) setStep(isCouscousMode ? 2 : 1);
    else if (step === 4) setStep(3);
    else if (step === 5) setStep(3);
    else if (step === 6) {
      if (config.preset_sandwich?.id === 'p4') setStep(4);
      else if (config.preset_sandwich?.id === 'p5') setStep(5);
      else setStep(3);
    }
    else if (step === 7) setStep(6);
    else if (step === 8) setStep(isCouscousMode ? 3 : 7);
    else if (step === 9) setStep(8);
  };

  const handleNext = () => {
    if (step === 8) {
      const fId = config.formula?.id || '';
      let q = ['menu_standard', 'menu_student', 'menu_kids'].includes(fId) ? 1 : 0;
      if (fId.startsWith('COUSCOUS_')) q = fId === 'COUSCOUS_S1' ? 2 : fId === 'COUSCOUS_S2' ? 3 : 4;
      
      const currentDrinks = config.drinks || [];
      const hasBottle = currentDrinks.some(d => d.option.name.includes('1.5L') && d.quantity > 0);
      const totalDrinksQty = currentDrinks.reduce((acc, d) => acc + d.quantity, 0);
      
      if (q > 0) {
        if (fId === 'COUSCOUS_S3' && hasBottle) {
          if (totalDrinksQty < 1) {
            alert("Cette formule inclut 1 bouteille (1.5L) ou 4 canettes !");
            return;
          }
        } else if (totalDrinksQty < q) {
          alert(`Cette formule inclut ${q} boisson(s) !`);
          return;
        }
      }
    }
    setStep(step + 1);
  };

  const isNextDisabled = () => {
    if (step === 4 && (config.meats || []).length < 2) return true;
    return false;
  };

  const handleBack = () => {
    if (step === 1) setStep(0);
    else if (step === 2) setStep(0);
    else if (step === 3) setStep(isCouscousMode ? 2 : 1);
    else if (step === 4) setStep(3);
    else if (step === 5) setStep(3);
    else if (step === 6) {
      if (config.preset_sandwich?.id === 'p4') setStep(4);
      else if (config.preset_sandwich?.id === 'p5') setStep(5);
      else setStep(3);
    }
    else if (step === 7) setStep(6);
    else if (step === 8) setStep(isCouscousMode ? 3 : 7);
    else if (step === 9) setStep(8);
  };

  const handleNext = () => {
    if (step === 8) {
      const fId = config.formula?.id || '';
      let q = ['menu_standard', 'menu_student', 'menu_kids'].includes(fId) ? 1 : 0;
      if (fId.startsWith('COUSCOUS_')) q = fId === 'COUSCOUS_S1' ? 2 : fId === 'COUSCOUS_S2' ? 3 : 4;
      
      const currentDrinks = config.drinks || [];
      const hasBottle = currentDrinks.some(d => d.option.name.includes('1.5L') && d.quantity > 0);
      const totalDrinksQty = currentDrinks.reduce((acc, d) => acc + d.quantity, 0);
      
      if (q > 0) {
        if (fId === 'COUSCOUS_S3' && hasBottle) {
          if (totalDrinksQty < 1) {
            alert("Cette formule inclut 1 bouteille (1.5L) ou 4 canettes !");
            return;
          }
        } else if (totalDrinksQty < q) {
          alert(`Cette formule inclut ${q} boisson(s) !`);
          return;
        }
      }
    }
    setStep(step + 1);
  };

  const isNextDisabled = () => {
    if (step === 4 && (config.meats || []).length < 2) return true;
    return false;
  };

  const handleOptionToggle = (option: Option) => {
    const catId = currentCategory.id;
    
    if (catId === "order_type") {
      if (option.id === 'couscous') {
        setIsCouscousMode(true);
        setStep(2);
      } else {
        setOrderType(option.id as 'on_site' | 'takeaway');
        setIsCouscousMode(false);
        setStep(1);
      }
    } else if (catId === "formula") {
      setConfig({ ...config, formula: option });
      setIsCouscousMode(false);
      setStep(3);
    } else if (catId === "couscous_size") {
      setConfig({ ...config, formula: option });
      setStep(3);
    } else if (catId === "presets") {
      setConfig({ ...config, preset_sandwich: option, removed_ingredients: [] });
      if (isCouscousMode) setStep(8);
      else {
        if (option.id === 'p4') setStep(4);
        else if (option.id === 'p5') setStep(5);
        else setStep(6);
      }
    } else if (catId === "meats") {
      const currentMeats = config.meats || [];
      const isSelected = currentMeats.some(m => m.id === option.id);
      if (isSelected) setConfig({ ...config, meats: currentMeats.filter(m => m.id !== option.id) });
      else {
        if (currentMeats.length >= 5) return;
        setConfig({ ...config, meats: [...currentMeats, option] });
      }
    } else if (catId === "steaks") {
      setConfig({ ...config, steaks_qty: option });
      setStep(6);
    } else if (catId === "sauces") {
      const isSelected = config.sauces.some(s => s.id === option.id);
      if (isSelected) setConfig({ ...config, sauces: config.sauces.filter(s => s.id !== option.id) });
      else setConfig({ ...config, sauces: [...config.sauces, option] });
    } else if (catId === "extras") {
      const isSelected = config.extras.some(e => e.id === option.id);
      if (isSelected) setConfig({ ...config, extras: config.extras.filter(e => e.id !== option.id) });
      else setConfig({ ...config, extras: [...config.extras, option] });
    } else if (catId === "drinks" || catId === "desserts") {
      const key = catId as 'drinks' | 'desserts';
      const currentList = config[key] || [];
      const existing = currentList.find(i => i.option.id === option.id);
      if (existing) setConfig({ ...config, [key]: currentList.filter(i => i.option.id !== option.id) });
      else setConfig({ ...config, [key]: [...currentList, { option, quantity: 1 }] });
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

  const calculateItemPrice = (item: SandwichConfig) => {
    if (!item.formula) return 0;
    let total = item.formula.price;
    const formulaId = item.formula.id;
    const isMenu = ['menu_standard', 'menu_student', 'menu_kids'].includes(formulaId);
    const isCouscous = formulaId.startsWith('COUSCOUS_');

    if (isCouscous) {
      if (item.preset_sandwich) total += item.preset_sandwich.price;
      const drinks = item.drinks || [];
      if (formulaId === 'COUSCOUS_S3') {
        const hasBottle = drinks.some(d => d.option.name.includes('1.5L') && d.quantity > 0);
        if (hasBottle) {
          let bottleFound = false;
          total += drinks.reduce((acc, d) => {
            if (d.option.name.includes('1.5L') && !bottleFound) {
              bottleFound = true;
              return acc + (d.option.price * (d.quantity - 1));
            }
            return acc + (d.option.price * d.quantity);
          }, 0);
        } else {
          const cansPrices = drinks.filter(d => !d.option.name.includes('1.5L') && !d.option.name.includes('2L')).flatMap(d => Array(d.quantity).fill(d.option.price)).sort((a, b) => b - a);
          total += cansPrices.slice(4).reduce((acc, p) => acc + p, 0);
          total += drinks.filter(d => d.option.name.includes('2L')).reduce((acc, d) => acc + (d.option.price * d.quantity), 0);
        }
      } else {
        const quota = formulaId === 'COUSCOUS_S1' ? 2 : 3;
        const cansPrices = drinks.filter(d => !d.option.name.includes('1.5L') && !d.option.name.includes('2L')).flatMap(d => Array(d.quantity).fill(d.option.price)).sort((a, b) => b - a);
        total += cansPrices.slice(quota).reduce((acc, p) => acc + p, 0);
        total += drinks.filter(d => d.option.name.includes('1.5L') || d.option.name.includes('2L')).reduce((acc, d) => acc + (d.option.price * d.quantity), 0);
      }
    } else {
      if (item.preset_sandwich && formulaId !== 'menu_kids') total += Math.max(0, item.preset_sandwich.price - 12);
      if (item.preset_sandwich?.id === 'p4' && item.meats && item.meats.length > 2) total += (item.meats.length - 2) * 2;
      total += Math.max(0, item.sauces.length - 2) * 0.5;
      total += item.extras.reduce((acc, e) => acc + e.price, 0);
      if (item.preset_sandwich?.id === 'p5' && item.steaks_qty) total += item.steaks_qty.price;
      const drinks = item.drinks || [];
      const q = isMenu ? 1 : 0;
      const cansPrices = drinks.filter(d => !d.option.name.includes('1.5L') && !d.option.name.includes('2L')).flatMap(d => Array(d.quantity).fill(d.option.price)).sort((a, b) => b - a);
      total += cansPrices.slice(q).reduce((acc, p) => acc + p, 0);
      total += drinks.filter(d => d.option.name.includes('1.5L') || d.option.name.includes('2L')).reduce((acc, d) => acc + (d.option.price * d.quantity), 0);
    }
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
    if (finalItems.length === 0) { alert("Le panier est vide"); return; }
    
    const total = calculateTotal();
    const newOrder: Order = {
      id: "TEL-" + Math.random().toString(36).substr(2, 5).toUpperCase(),
      client_name: clientInfo.name,
      client_phone: clientInfo.phone,
      items: finalItems,
      total_price: total,
      status: "pending",
      payment_status: "unpaid",
      payment_method: "cash",
      order_type: orderType,
      pickup_time: "Téléphone",
      notes: clientInfo.notes,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('orders').insert([newOrder]);
    if (error) { alert("Erreur: " + error.message); return; }

    onOrderCreated(newOrder);
    onClose();
    resetCurrentConfig();
    setBasket([]);
    setClientInfo({ name: "Client Téléphone", phone: "", notes: "" });
    setStep(0);
  };

  if (!isOpen) return null;

  const stepsAutoAdvance = [0, 1, 2, 3, 5];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl text-white font-sans">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-secondary/90 w-full max-w-5xl rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden flex h-[85vh]">
        
        {/* Left Side: Basket Summary */}
        <div className="w-80 bg-black border-r border-white/5 flex flex-col p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-primary p-2 rounded-xl text-black"><ShoppingCart size={20} /></div>
            <h2 className="text-xl font-black uppercase tracking-widest italic">Panier</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
            {basket.map((item, idx) => (
              <div key={idx} className="bg-white/5 p-4 rounded-2xl border border-white/5 relative group">
                <button onClick={() => setBasket(basket.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"><X size={12} /></button>
                <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-1">{item.formula?.name}</p>
                <p className="text-sm font-bold text-white">{item.preset_sandwich?.name}</p>
                <p className="text-xs font-mono text-gray-500 mt-2">{calculateItemPrice(item).toFixed(2)}€</p>
              </div>
            ))}
            {basket.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-10 text-center">
                <ReceiptText size={48} className="mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">Panier Vide</p>
              </div>
            )}
          </div>

          <div className="pt-8 border-t border-white/10">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Total</span>
              <span className="text-3xl font-black font-mono text-white tracking-tighter">{calculateTotal().toFixed(2)}€</span>
            </div>
            <button onClick={handleSubmit} disabled={basket.length === 0 && (!config.formula || !config.preset_sandwich)} className="w-full py-5 bg-primary text-black font-black rounded-2xl uppercase text-xs tracking-widest shadow-xl shadow-primary/10 disabled:opacity-20 transition-all">
              Valider Commande
            </button>
          </div>
        </div>

        {/* Right Side: Step Builder */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-background">
          <header className="p-8 border-b border-white/5 flex justify-between items-center bg-black/40 backdrop-blur-md">
            <div>
              <p className="text-[10px] text-primary font-black uppercase tracking-[0.4em] mb-1 italic">Prise de commande manuelle</p>
              <h3 className="text-2xl font-serif font-black italic text-white uppercase tracking-widest">{currentCategory.name}</h3>
            </div>
            <button onClick={onClose} className="p-4 rounded-2xl bg-white/5 hover:bg-red-500/10 hover:text-red-500 transition-all border border-white/5 text-gray-500"><X size={20} /></button>
          </header>

          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-6">
                
                {currentCategory.id === "meats" && (
                  <div className="col-span-full bg-primary/5 border border-primary/20 p-4 rounded-2xl mb-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary text-center">
                      2 viandes incluses <span className="opacity-60 font-medium">(+2€ par viande supp.)</span>
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {currentCategory.options.map(opt => {
                    const isSel = (currentCategory.id === "drinks" || currentCategory.id === "desserts") 
                      ? (config[currentCategory.id as 'drinks' | 'desserts'] || []).some(i => i.option.id === opt.id)
                      : (currentCategory.id === "meats")
                        ? (config.meats || []).some(m => m.id === opt.id)
                        : (currentCategory.id === "sauces")
                          ? (config.sauces || []).some(s => s.id === opt.id)
                          : (currentCategory.id === "extras")
                            ? (config.extras || []).some(e => e.id === opt.id)
                            : (currentCategory.id === "order_type")
                              ? (opt.id === 'couscous' ? isCouscousMode : orderType === opt.id && !isCouscousMode)
                              : (currentCategory.id === "formula" || currentCategory.id === "couscous_size")
                                ? config.formula?.id === opt.id
                                : config.preset_sandwich?.id === opt.id;
                    
                    const qty = (currentCategory.id === "drinks" || currentCategory.id === "desserts") 
                      ? (config[currentCategory.id as 'drinks' | 'desserts'] || []).find(i => i.option.id === opt.id)?.quantity || 0
                      : 0;

                    return (
                      <div 
                        key={opt.id} 
                        onClick={() => handleOptionToggle(opt)}
                        className={cn(
                          "p-5 rounded-3xl border transition-all text-left flex flex-col justify-between h-40 cursor-pointer group", 
                          isSel ? "border-primary bg-primary/10 shadow-[0_0_30px_rgba(239,68,68,0.1)]" : "border-white/5 bg-white/[0.02] hover:border-white/20"
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <div className={cn("p-3 rounded-2xl transition-all", isSel ? "bg-primary text-black" : "bg-white/5 text-gray-500 group-hover:bg-white/10")}>
                            {currentCategory.id === "order_type" && opt.id === 'couscous' ? <Utensils size={18} /> : <Plus size={18} />}
                          </div>
                          {isSel && currentCategory.id !== "drinks" && currentCategory.id !== "desserts" && <Check size={16} className="text-primary" strokeWidth={4} />}
                        </div>

                        <div>
                          <p className={cn("text-[11px] font-black uppercase tracking-widest", isSel ? "text-white" : "text-gray-400")}>{opt.name}</p>
                          {opt.price !== 0 && <p className="text-[9px] font-mono text-gray-600 mt-1">{opt.price > 0 ? `+${opt.price.toFixed(2)}€` : `${opt.price.toFixed(2)}€`}</p>}
                        </div>
                        
                        {(currentCategory.id === "drinks" || currentCategory.id === "desserts") && isSel && (
                          <div className="flex items-center justify-between bg-black/60 p-1.5 rounded-2xl border border-white/10 mt-2" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => updateQuantity(currentCategory.id as any, opt, -1)} className="p-1 hover:text-primary transition-colors text-gray-500"><Minus size={14} /></button>
                            <span className="text-[10px] font-black text-white font-mono">{qty}</span>
                            <button onClick={() => updateQuantity(currentCategory.id as any, opt, 1)} className="p-1 hover:text-primary transition-colors text-gray-500"><Plus size={14} /></button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <footer className="p-8 border-t border-white/5 bg-black/40 backdrop-blur-md flex justify-between items-center gap-6">
            <div className="flex gap-4">
              <input type="text" placeholder="NOM CLIENT" value={clientInfo.name} onChange={(e) => setClientInfo({...clientInfo, name: e.target.value})} className="px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white focus:border-primary/50 outline-none w-48 placeholder:text-gray-700" />
              <input type="tel" placeholder="TÉLÉPHONE" value={clientInfo.phone} onChange={(e) => setClientInfo({...clientInfo, phone: e.target.value})} className="px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white focus:border-primary/50 outline-none w-48 placeholder:text-gray-700" />
            </div>

            <div className="flex gap-4 items-center">
              <button onClick={handleBack} className={cn("p-4 rounded-2xl bg-white/5 border border-white/5 text-gray-500 hover:text-white transition-all", step === 0 && "opacity-0")}>
                <ArrowLeft size={20} />
              </button>
              
              {!stepsAutoAdvance.includes(step) && (
                <>
                  {step === 9 ? (
                    <button onClick={addItemToBasket} className="px-10 py-4 bg-primary text-black font-black rounded-2xl uppercase text-[11px] tracking-widest flex items-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20">
                       Ajouter au panier <ArrowRight size={18} />
                    </button>
                  ) : (
                    <button disabled={isNextDisabled()} onClick={handleNext} className="px-10 py-4 bg-white text-black font-black rounded-2xl uppercase text-[11px] tracking-widest flex items-center gap-4 hover:bg-primary transition-all disabled:opacity-20 disabled:cursor-not-allowed">
                      Suivant <ArrowRight size={18} />
                    </button>
                  )}
                </>
              )}
            </div>
          </footer>
        </div>
      </motion.div>
    </div>
  );
}
