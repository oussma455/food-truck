"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { SANDWICH_CATEGORIES, FORMULAS, ORDER_TYPES } from "@/lib/data";
import { SandwichConfig, Option, Order, Category } from "@/types";
import { X, Plus, Check, MinusCircle } from "lucide-react";
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
    { id: "order_type", name: "Type de commande", options: ORDER_TYPES },
    { id: "formula", name: "Formule", options: FORMULAS },
    ...menuCategories.filter(c => !['bread', 'meat'].includes(c.id))
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
    const formulaStep = modalCategories.findIndex(c => c.id === 'formula');
    setStep(formulaStep !== -1 ? formulaStep : 0);
  };

  const addItemToBasket = () => {
    if (!config.formula) {
      alert("Veuillez choisir une formule pour cet article.");
      return;
    }
    
    if (!config.preset_sandwich) {
      alert("Veuillez choisir un sandwich.");
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
      setConfig({ ...config, formula: option, removed_ingredients: [] });
      if (option.id === 'menu_kids') {
        const kidsStep = modalCategories.findIndex(c => c.id === 'kids_menu');
        if (kidsStep !== -1) setStep(kidsStep);
      } else {
        const presetsStep = modalCategories.findIndex(c => c.id === 'presets');
        if (presetsStep !== -1) setStep(presetsStep);
        else setStep(step + 1);
      }
    } else if (catId === "presets" || catId === "kids_menu") {
      setConfig({ 
        ...config, 
        preset_sandwich: option, 
        creation_mode: 'signature',
        bread: undefined,
        meat: undefined,
        removed_ingredients: []
      });
      if (catId === "kids_menu") {
        addItemToBasket();
      } else {
        const saucesStep = modalCategories.findIndex(c => c.id === 'sauces');
        if (saucesStep !== -1) setStep(saucesStep);
        else setStep(step + 1);
      }
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
    if (catId === "kids_menu") return config.preset_sandwich?.id === optionId;
    if (catId === "sauces") return config.sauces.some((s) => s.id === optionId);
    if (catId === "extras") return config.extras.some((e) => e.id === optionId);
    if (catId === "drinks") return (config.drinks || []).some((d) => d.option.id === optionId);
    if (catId === "desserts") return (config.desserts || []).some((d) => d.option.id === optionId);
    return false;
  };

  const calculateItemPrice = (item: SandwichConfig) => {
    if (item.formula?.id === 'menu_kids') return 8.00;

    let total = item.formula?.price || 0;
    
    if (item.preset_sandwich) {
      total = Math.max(total, item.preset_sandwich.price);
    }

    const saucesCount = item.sauces.length;
    const extraSauces = Math.max(0, saucesCount - 2);
    total += extraSauces * 0.5;

    total += item.extras.reduce((acc, e) => acc + e.price, 0);
    total += (item.drinks || []).reduce((acc, d) => acc + (d.option.price * d.quantity), 0);
    total += (item.desserts || []).reduce((acc, d) => acc + (d.option.price * d.quantity), 0);
    return total;
  };

  const calculateTotal = () => {
    const basketTotal = basket.reduce((acc, item) => acc + calculateItemPrice(item), 0);
    const currentTotal = (config.formula || config.preset_sandwich) ? calculateItemPrice(config) : 0;
    return basketTotal + currentTotal;
  };

  const handleSubmit = () => {
    const finalItems = [...basket];
    if (config.formula && config.preset_sandwich) {
      finalItems.push(config);
    }

    if (finalItems.length === 0) {
      alert("Veuillez ajouter au moins un article.");
      return;
    }

    const newOrder: Order = {
      id: "MAN-" + Math.random().toString(36).substr(2, 5).toUpperCase(),
      client_name: clientInfo.name || "Client Téléphone",
      client_phone: clientInfo.phone || "Non renseigné",
      items: finalItems,
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
    resetCurrentConfig();
    setBasket([]);
    setClientInfo({ name: "Client Téléphone", phone: "" });
  };

  const currentIngredients = config.preset_sandwich?.description 
    ? config.preset_sandwich.description.split(',').map(i => i.trim()) 
    : [];

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
                        {option.description && <p className="text-[10px] text-gray-500 mt-1 line-clamp-1 italic">{option.description}</p>}
                      </div>
                      {isOptionSelected(option.id) && <Check size={14} className="text-primary" />}
                    </button>
                  ))}
                </div>

                {config.preset_sandwich && currentIngredients.length > 0 && (
                  <div className="mt-6 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <MinusCircle size={12} /> Ingrédients à enlever ?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {currentIngredients.map((ing, i) => (
                        <button
                          key={i}
                          onClick={() => toggleIngredientRemoval(ing)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                            config.removed_ingredients?.includes(ing)
                              ? "bg-red-500 text-white border-red-500"
                              : "bg-black/40 text-gray-500 border-gray-800 hover:border-red-500/50"
                          )}
                        >
                          {ing}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-6">
                  <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="flex-1 p-2 border border-gray-800 rounded-lg text-xs uppercase font-bold tracking-widest disabled:opacity-30">Précédent</button>
                  <button onClick={() => setStep(Math.min(modalCategories.length - 1, step + 1))} disabled={step === modalCategories.length - 1} className="flex-1 p-2 bg-primary/10 border border-primary/30 text-primary rounded-lg text-xs uppercase font-bold tracking-widest disabled:opacity-30">Suivant</button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-secondary/30 rounded-xl p-5 border border-gray-800/50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest">Récapitulatif</h4>
                  <span className="text-[8px] bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">{orderType === 'takeaway' ? 'À Emporter' : 'Sur Place'}</span>
                </div>
                
                <div className="max-h-[250px] overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                  {basket.map((item, idx) => (
                    <div key={idx} className="bg-black/40 p-3 rounded-lg border border-gray-800 relative group">
                      <button onClick={() => setBasket(basket.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"><X size={10} /></button>
                      <p className="text-[10px] font-bold text-white">{item.formula?.name}</p>
                      <p className="text-[9px] text-gray-400">{item.preset_sandwich?.name}</p>
                      {item.removed_ingredients && item.removed_ingredients.length > 0 && (
                        <p className="text-[8px] text-red-500 mt-1 italic">SANS: {item.removed_ingredients.join(', ')}</p>
                      )}
                      <p className="text-[9px] text-primary mt-1">{calculateItemPrice(item).toFixed(2)}€</p>
                    </div>
                  ))}

                  <div className="border-l-2 border-primary/30 pl-3 py-1">
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-2">Article en cours</p>
                    <ul className="space-y-1 text-[10px]">
                      <li className="flex justify-between"><span className="text-gray-500">Formule:</span><span className={config.formula ? "text-white" : "text-red-500/50 italic"}>{config.formula?.name || "Non choisi"}</span></li>
                      <li className="flex justify-between items-start gap-2">
                        <span className="text-gray-500">Recette:</span>
                        <div className="text-right">
                          <span className={config.preset_sandwich ? "text-white" : "text-red-500/50 italic"}>{config.preset_sandwich?.name || "Non choisi"}</span>
                          {config.removed_ingredients && config.removed_ingredients.length > 0 && (
                            <span className="text-red-500 text-[8px] block italic">SANS: {config.removed_ingredients.join(', ')}</span>
                          )}
                        </div>
                      </li>
                    </ul>
                    <button onClick={addItemToBasket} className="w-full mt-3 py-2 border border-primary/30 text-primary rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-primary/10 transition-all">+ Ajouter un autre article</button>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800 flex justify-between items-center">
                  <span className="font-serif font-bold text-white">Total Commande</span>
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
