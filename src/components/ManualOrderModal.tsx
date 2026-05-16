"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FORMULAS, ORDER_TYPES } from "@/lib/data";
import { SandwichConfig, Option, Order, Category, StepId } from "@/types";
import { supabase } from "@/lib/supabase";
import { 
  X, Plus, Check, ShoppingCart, 
  ArrowRight, ArrowLeft, Minus, 
  ReceiptText, Utensils, CupSoda, Trash2, MapPin,
  ChevronRight, Phone, User, Info
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Ultra-Compact POS Option Card
function POSOptionCard({ 
  option, isSelected, onClick, icon, surchargeValue, hidePrice
}: { 
  option: Option; isSelected: boolean; onClick: () => void; icon?: React.ReactNode; surchargeValue?: number; hidePrice?: boolean;
}) {
  const displayPrice = surchargeValue !== undefined ? surchargeValue : option.price;
  const hasSurcharge = !hidePrice && displayPrice !== 0;

  return (
    <motion.div 
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "relative flex flex-col justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer h-28 overflow-hidden group",
        isSelected 
          ? "border-green-500 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.15)] ring-1 ring-green-500" 
          : "border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20"
      )}
    >
      <div className="flex justify-between items-start">
        <div className={cn(
          "p-2 rounded-xl transition-colors",
          isSelected ? "bg-green-500 text-black" : "bg-white/5 text-gray-500"
        )}>
          {icon ? (React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 16 }) : icon) : <Plus size={16} />}
        </div>
        {isSelected && <Check size={14} strokeWidth={4} className="text-green-500" />}
      </div>

      <div>
        <p className={cn(
          "font-black text-[10px] uppercase tracking-wider leading-tight line-clamp-2",
          isSelected ? "text-white" : "text-gray-400"
        )}>
          {option.name}
        </p>
        {hasSurcharge && (
          <p className="text-[9px] font-mono font-black text-green-500 mt-1">
            {displayPrice > 0 ? `+${displayPrice.toFixed(2)}€` : `${displayPrice.toFixed(2)}€`}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// POS Sidebar Item
function POSBasketItem({ item, idx, onRemove, calculatePrice }: { item: SandwichConfig, idx: number, onRemove: (i: number) => void, calculatePrice: (i: SandwichConfig) => number }) {
  return (
    <div className="bg-white/[0.02] p-3 rounded-xl border border-white/5 group relative">
      <button onClick={() => onRemove(idx)} className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all scale-75"><Trash2 size={12} /></button>
      <div className="flex justify-between items-start gap-2">
        <span className="text-[7px] text-green-500 font-black uppercase tracking-widest truncate flex-1">{item.formula?.name}</span>
        <span className="text-[8px] font-mono text-white font-bold">{calculatePrice(item).toFixed(2)}€</span>
      </div>
      <p className="text-[9px] font-bold text-gray-300 uppercase leading-none mt-1">{item.preset_sandwich?.name}</p>
    </div>
  );
}

const STEPS_MAP: { id: StepId, label: string }[] = [
  { id: 'ORDER_TYPE', label: 'SERVICE' },
  { id: 'FORMULA', label: 'FORMULE' },
  { id: 'COUSCOUS', label: 'TAILLE' },
  { id: 'COUSCOUS_MEAT', label: 'VIANDE' },
  { id: 'PRESETS', label: 'GRILLADE' },
  { id: 'KIDS_MENU', label: 'MENU ENFANT' },
  { id: 'MEATS', label: 'MÉLANGE' },
  { id: 'STEAKS', label: 'STEAKS' },
  { id: 'SAUCES', label: 'SAUCES' },
  { id: 'EXTRAS', label: 'SUPPLÉMENTS' },
  { id: 'DRINKS', label: 'BOISSONS' },
  { id: 'DESSERTS', label: 'DESSERTS' },
  { id: 'CHECKOUT', label: 'PANIER' },
];

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (order: Order) => void;
  menuCategories: Category[];
}

export default function ManualOrderModal({ isOpen, onClose, onOrderCreated, menuCategories }: ManualOrderModalProps) {
  const [step, setStep] = useState<StepId>('ORDER_TYPE');
  const [orderType, setOrderType] = useState<'on_site' | 'takeaway'>('takeaway');
  const [isCouscousMode, setIsCouscousMode] = useState(false);
  const [basket, setBasket] = useState<SandwichConfig[]>([]);
  const [currentConfig, setCurrentConfig] = useState<SandwichConfig>({
    sauces: [],
    extras: [],
    drinks: [],
    desserts: [],
    removed_ingredients: [],
  });
  const [clientInfo, setClientInfo] = useState({ name: "", phone: "", notes: "" });

  const resetCurrentConfig = () => {
    setCurrentConfig({
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
    const currentTotal = calculateItemPrice(currentConfig);
    return basketTotal + currentTotal;
  };

  const handleNext = (currentStep: StepId, value?: any) => {
    switch (currentStep) {
      case 'ORDER_TYPE': setStep('FORMULA'); break;
      case 'FORMULA':
        if (value === 'menu_kids') setStep('KIDS_MENU');
        else if (isCouscousMode) setStep('COUSCOUS');
        else setStep('PRESETS');
        break;
      case 'COUSCOUS': setStep('COUSCOUS_MEAT'); break;
      case 'COUSCOUS_MEAT': setStep('DRINKS'); break;
      case 'PRESETS':
        if (value === 'p4') setStep('MEATS');
        else if (value === 'p5') setStep('STEAKS');
        else setStep('SAUCES');
        break;
      case 'KIDS_MENU': setStep('SAUCES'); break;
      case 'MEATS': setStep('SAUCES'); break;
      case 'STEAKS': setStep('SAUCES'); break;
      case 'SAUCES': setStep('EXTRAS'); break;
      case 'EXTRAS': setStep('DRINKS'); break;
      case 'DRINKS': setStep('DESSERTS'); break;
      case 'DESSERTS': setStep('CHECKOUT'); break;
      default: break;
    }
  };

  const handleBack = () => {
    const stepsOrder: StepId[] = ['ORDER_TYPE', 'FORMULA', 'COUSCOUS', 'COUSCOUS_MEAT', 'PRESETS', 'KIDS_MENU', 'MEATS', 'STEAKS', 'SAUCES', 'EXTRAS', 'DRINKS', 'DESSERTS', 'CHECKOUT'];
    const idx = stepsOrder.indexOf(step);
    if (idx <= 0) return;

    if (step === 'FORMULA') setStep('ORDER_TYPE');
    else if (step === 'COUSCOUS') setStep('FORMULA');
    else if (step === 'COUSCOUS_MEAT') setStep('COUSCOUS');
    else if (step === 'PRESETS' || step === 'KIDS_MENU') setStep('FORMULA');
    else if (step === 'MEATS' || step === 'STEAKS') setStep('PRESETS');
    else if (step === 'SAUCES') {
      if (currentConfig.formula?.id === 'menu_kids') setStep('KIDS_MENU');
      else if (currentConfig.preset_sandwich?.id === 'p4') setStep('MEATS');
      else if (currentConfig.preset_sandwich?.id === 'p5') setStep('STEAKS');
      else setStep('PRESETS');
    }
    else if (step === 'DRINKS' && isCouscousMode) setStep('COUSCOUS_MEAT');
    else setStep(stepsOrder[idx - 1]);
  };

  const addItemToBasket = () => {
    if (!currentConfig.formula || !currentConfig.preset_sandwich) return;
    setBasket(prev => [...prev, { ...currentConfig }]);
    resetCurrentConfig();
    setStep('ORDER_TYPE');
  };

  const handleSubmit = async () => {
    const finalItems = [...basket];
    if (currentConfig.formula && currentConfig.preset_sandwich) finalItems.push(currentConfig);
    if (finalItems.length === 0) { alert("Le panier est vide"); return; }
    
    const total = calculateTotal();
    const newOrder: Order = {
      id: "TEL-" + Math.random().toString(36).substr(2, 5).toUpperCase(),
      client_name: clientInfo.name || "CLIENT TÉLÉPHONE",
      client_phone: clientInfo.phone || "00 00 00 00 00",
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

    try {
      const { error: dbError } = await supabase.from('orders').insert([newOrder]);
      
      if (dbError) {
        alert("Erreur base de données : " + dbError.message);
        return;
      }

      // Succès
      onOrderCreated(newOrder);
      onClose();
      resetCurrentConfig();
      setBasket([]);
      setClientInfo({ name: "", phone: "", notes: "" });
      setStep('ORDER_TYPE');

    } catch (err) {
      console.error("Critical Network Error:", err);
      alert("Problème de connexion (Failed to fetch). Vérifiez votre internet et recliquez sur Encaisser.");
    }
  };

  if (!isOpen) return null;

  const currentVisibleSteps = STEPS_MAP.filter(s => {
    if (isCouscousMode) return ['ORDER_TYPE', 'FORMULA', 'COUSCOUS', 'COUSCOUS_MEAT', 'DRINKS', 'DESSERTS', 'CHECKOUT'].includes(s.id);
    if (currentConfig.formula?.id === 'menu_kids') return ['ORDER_TYPE', 'FORMULA', 'KIDS_MENU', 'SAUCES', 'EXTRAS', 'DRINKS', 'DESSERTS', 'CHECKOUT'].includes(s.id);
    if (currentConfig.preset_sandwich?.id === 'p4') return ['ORDER_TYPE', 'FORMULA', 'PRESETS', 'MEATS', 'SAUCES', 'EXTRAS', 'DRINKS', 'DESSERTS', 'CHECKOUT'].includes(s.id);
    if (currentConfig.preset_sandwich?.id === 'p5') return ['ORDER_TYPE', 'FORMULA', 'PRESETS', 'STEAKS', 'SAUCES', 'EXTRAS', 'DRINKS', 'DESSERTS', 'CHECKOUT'].includes(s.id);
    return ['ORDER_TYPE', 'FORMULA', 'PRESETS', 'SAUCES', 'EXTRAS', 'DRINKS', 'DESSERTS', 'CHECKOUT'].includes(s.id);
  });

  const getAvailableOptions = (catId: string) => menuCategories.find(c => c.id === catId)?.options || [];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/98 backdrop-blur-3xl text-white font-sans overflow-hidden">
      <div className="w-full h-full flex flex-col max-w-[1600px] mx-auto overflow-hidden">
        
        {/* HEADER / STEPPER */}
        <header className="h-20 border-b border-white/5 flex items-center px-8 justify-between bg-black/40 shrink-0">
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-2">
            {currentVisibleSteps.map((s, i) => {
              const active = step === s.id;
              const past = currentVisibleSteps.findIndex(x => x.id === step) > i;
              return (
                <div key={s.id} className="flex items-center gap-3 shrink-0">
                  <div className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-black transition-all",
                    active ? "border-green-500 bg-green-500 text-black" : past ? "border-green-500 bg-green-500/10 text-green-500" : "border-white/10 text-gray-700"
                  )}>
                    {past ? <Check size={14} strokeWidth={4} /> : i + 1}
                  </div>
                  <span className={cn("text-[8px] font-black uppercase tracking-[0.2em]", active ? "text-white" : "text-gray-700")}>{s.label}</span>
                  {i < currentVisibleSteps.length - 1 && <ChevronRight size={12} className="text-gray-800" />}
                </div>
              );
            })}
          </div>
          <button onClick={onClose} className="p-4 rounded-2xl bg-white/5 hover:bg-green-500 hover:text-black transition-all group">
            <X size={20} className="group-hover:rotate-90 transition-transform" />
          </button>
        </header>

        <div className="flex-1 flex overflow-hidden">
          
          {/* MAIN AREA */}
          <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
                
                {/* STEP TITLE */}
                <div className="mb-8 flex items-center gap-4">
                  <div className="h-10 w-1.5 bg-green-500 rounded-full" />
                  <h2 className="text-3xl font-black uppercase tracking-tighter italic">{STEPS_MAP.find(s => s.id === step)?.label}</h2>
                </div>

                {/* OPTIONS GRID - DYNAMIC LAYOUT */}
                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  
                  {step === 'ORDER_TYPE' && ORDER_TYPES.map(t => (
                    <POSOptionCard key={t.id} option={t} isSelected={orderType === t.id && !isCouscousMode} onClick={() => { setOrderType(t.id as any); setIsCouscousMode(false); handleNext('ORDER_TYPE'); }} icon={t.id === 'takeaway' ? <ShoppingCart /> : <MapPin />} hidePrice />
                  ))}
                  {step === 'ORDER_TYPE' && (
                    <POSOptionCard option={{ id: 'couscous', name: 'Réserver un Couscous', price: 0, description: 'Traditionnel • 24h' }} isSelected={isCouscousMode} onClick={() => { setIsCouscousMode(true); setStep('COUSCOUS'); }} icon={<Utensils />} hidePrice />
                  )}

                  {step === 'FORMULA' && FORMULAS.map(f => (
                    <POSOptionCard key={f.id} option={f} isSelected={currentConfig.formula?.id === f.id} onClick={() => { setCurrentConfig({...currentConfig, formula: f}); handleNext('FORMULA', f.id); }} />
                  ))}

                  {step === 'COUSCOUS' && getAvailableOptions('couscous_size').map(s => (
                    <POSOptionCard key={s.id} option={s} isSelected={currentConfig.formula?.id === s.id} onClick={() => { setCurrentConfig({...currentConfig, formula: s}); handleNext('COUSCOUS'); }} />
                  ))}

                  {step === 'COUSCOUS_MEAT' && getAvailableOptions('couscous_type').map(t => (
                    <POSOptionCard key={t.id} option={t} isSelected={currentConfig.preset_sandwich?.id === t.id} onClick={() => { setCurrentConfig({...currentConfig, preset_sandwich: t}); handleNext('COUSCOUS_MEAT'); }} />
                  ))}

                  {step === 'PRESETS' && getAvailableOptions('presets').map(p => (
                    <POSOptionCard key={p.id} option={p} isSelected={currentConfig.preset_sandwich?.id === p.id} onClick={() => { setCurrentConfig({...currentConfig, preset_sandwich: p}); handleNext('PRESETS', p.id); }} surchargeValue={Math.max(0, p.price - 12)} />
                  ))}

                  {step === 'KIDS_MENU' && getAvailableOptions('kids_menu').map(k => (
                    <POSOptionCard key={k.id} option={k} isSelected={currentConfig.preset_sandwich?.id === k.id} onClick={() => { setCurrentConfig({...currentConfig, preset_sandwich: k}); handleNext('KIDS_MENU'); }} hidePrice />
                  ))}

                  {(step === 'MEATS' || step === 'SAUCES' || step === 'EXTRAS') && (
                    <>
                      {getAvailableOptions(step === 'MEATS' ? 'meats' : step === 'SAUCES' ? 'sauces' : 'extras').map(opt => {
                        const cat = step === 'MEATS' ? 'meats' : step === 'SAUCES' ? 'sauces' : 'extras';
                        const list = currentConfig[cat] as Option[] || [];
                        const isSel = list.some(x => x.id === opt.id);
                        return (
                          <POSOptionCard 
                            key={opt.id} option={opt} isSelected={isSel} 
                            onClick={() => {
                              if (isSel) setCurrentConfig({...currentConfig, [cat]: list.filter(x => x.id !== opt.id)});
                              else setCurrentConfig({...currentConfig, [cat]: [...list, opt]});
                            }} 
                            surchargeValue={step === 'MEATS' ? (list.length >= 2 && !isSel ? 2 : 0) : step === 'SAUCES' ? (list.length >= 2 && !isSel ? 0.5 : 0) : undefined}
                          />
                        );
                      })}
                      <div className="col-span-full pt-4">
                        <button onClick={() => handleNext(step)} className="w-full py-5 bg-white text-black font-black rounded-2xl uppercase text-xs tracking-[0.3em] shadow-xl hover:bg-green-500 transition-all">VALIDER SÉLECTION</button>
                      </div>
                    </>
                  )}

                  {step === 'STEAKS' && getAvailableOptions('steaks_qty').map(s => (
                    <POSOptionCard key={s.id} option={s} isSelected={currentConfig.steaks_qty?.id === s.id} onClick={() => { setCurrentConfig({...currentConfig, steaks_qty: s}); handleNext('STEAKS'); }} />
                  ))}

                  {(step === 'DRINKS' || step === 'DESSERTS') && (
                    <>
                      {getAvailableOptions(step === 'DRINKS' ? 'drinks' : 'desserts').map(opt => {
                        const cat = step === 'DRINKS' ? 'drinks' : 'desserts';
                        const list = currentConfig[cat] || [];
                        const item = list.find(x => x.option.id === opt.id);
                        return (
                          <div key={opt.id} className={cn("p-4 rounded-2xl border flex flex-col justify-between h-28 transition-all", item ? "border-green-500 bg-green-500/10" : "border-white/5 bg-white/[0.02]")}>
                            <p className="text-[10px] font-black uppercase tracking-wider text-gray-200 line-clamp-1">{opt.name}</p>
                            <div className="flex items-center justify-between bg-black/40 p-2 rounded-xl border border-white/10">
                              <button onClick={() => {
                                if (!item) return;
                                const newQty = item.quantity - 1;
                                if (newQty === 0) setCurrentConfig({...currentConfig, [cat]: list.filter(x => x.option.id !== opt.id)});
                                else setCurrentConfig({...currentConfig, [cat]: list.map(x => x.option.id === opt.id ? {...x, quantity: newQty} : x)});
                              }} className="p-1 text-gray-500 hover:text-green-500"><Minus size={14} /></button>
                              <span className="text-xs font-black w-4 text-center text-white">{item?.quantity || 0}</span>
                              <button onClick={() => {
                                if (item) setCurrentConfig({...currentConfig, [cat]: list.map(x => x.option.id === opt.id ? {...x, quantity: x.quantity + 1} : x)});
                                else setCurrentConfig({...currentConfig, [cat]: [...list, { option: opt, quantity: 1 }]});
                              }} className="p-1 text-gray-500 hover:text-green-500"><Plus size={14} /></button>
                            </div>
                          </div>
                        );
                      })}
                      <div className="col-span-full pt-4">
                        <button onClick={() => handleNext(step)} className="w-full py-5 bg-white text-black font-black rounded-2xl uppercase text-xs tracking-[0.3em] shadow-xl hover:bg-green-500 transition-all">CONTINUER</button>
                      </div>
                    </>
                  )}

                  {step === 'CHECKOUT' && (
                    <div className="col-span-full max-w-xl mx-auto w-full space-y-8 py-10">
                       <div className="bg-green-500/5 border border-green-500/20 p-8 rounded-[2rem] text-center">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-green-500 mb-6">ARTICLE PRÊT</h4>
                          <p className="text-4xl font-serif font-black italic text-white uppercase">{currentConfig.preset_sandwich?.name}</p>
                          <p className="text-xs text-gray-500 font-bold uppercase mt-2 tracking-widest">{currentConfig.formula?.name}</p>
                          <p className="text-5xl font-black font-mono text-green-500 mt-8">{calculateItemPrice(currentConfig).toFixed(2)}€</p>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <button onClick={addItemToBasket} className="py-6 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3"><Plus size={18} /> UN AUTRE ARTICLE</button>
                          <button onClick={handleSubmit} className="py-6 bg-green-500 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-green-500/20 hover:scale-105 transition-all">TERMINER LA COMMANDE</button>
                       </div>
                    </div>
                  )}

                </div>
              </motion.div>
            </AnimatePresence>
          </main>

          {/* RIGHT BASKET RAIL (ALWAYS VISIBLE) */}
          <aside className="w-64 border-l border-white/5 flex flex-col shrink-0 bg-black/20">
            <div className="p-6 border-b border-white/5 flex items-center gap-3">
              <ShoppingCart size={14} className="text-green-500" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">PANIER</h3>
              {basket.length > 0 && <span className="bg-green-500 text-black text-[9px] px-2 py-0.5 rounded-full font-black ml-auto">{basket.length}</span>}
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {basket.map((item, idx) => (
                <POSBasketItem key={idx} item={item} idx={idx} onRemove={(i) => setBasket(basket.filter((_, x) => x !== i))} calculatePrice={calculateItemPrice} />
              ))}
              {basket.length === 0 && !currentConfig.formula && (
                <div className="h-40 flex flex-col items-center justify-center opacity-5">
                  <ReceiptText size={32} />
                </div>
              )}
            </div>
            <div className="p-6 border-t border-white/5 bg-black/40">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">TOTAL</span>
                <span className="text-xl font-black font-mono text-white tracking-tighter">{calculateTotal().toFixed(2)}€</span>
              </div>
              <button 
                onClick={handleSubmit} 
                disabled={basket.length === 0 && (!currentConfig.formula || !currentConfig.preset_sandwich)}
                className="w-full py-4 bg-green-500 text-black font-black rounded-xl uppercase text-[9px] tracking-widest disabled:opacity-10 shadow-lg"
              >
                ENCAISSER
              </button>
            </div>
          </aside>
        </div>

        {/* BOTTOM COMMAND STRIP */}
        <footer className="h-24 border-t border-white/10 flex items-center px-10 gap-10 bg-black shrink-0">
          <button onClick={handleBack} className={cn("p-5 rounded-2xl bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-all", step === 'ORDER_TYPE' && "opacity-0 pointer-events-none")}>
            <ArrowLeft size={20} />
          </button>

          <div className="flex gap-4 flex-1">
            <div className="flex-1 relative group">
              <User size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-green-500 transition-colors" />
              <input type="text" placeholder="NOM DU CLIENT" value={clientInfo.name} onChange={(e) => setClientInfo({...clientInfo, name: e.target.value.toUpperCase()})} className="w-full pl-14 pr-6 py-4 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] font-black tracking-widest text-white focus:border-green-500/50 outline-none placeholder:text-gray-800 transition-all" />
            </div>
            <div className="flex-1 relative group">
              <Phone size={14} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-green-500 transition-colors" />
              <input type="tel" placeholder="TÉLÉPHONE" value={clientInfo.phone} onChange={(e) => setClientInfo({...clientInfo, phone: e.target.value})} className="w-full pl-14 pr-6 py-4 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] font-black tracking-widest text-white focus:border-green-500/50 outline-none placeholder:text-gray-800 transition-all" />
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="text-right flex flex-col justify-center">
                <span className="text-[7px] font-black text-gray-600 uppercase tracking-widest leading-none mb-1">Total Commande</span>
                <span className="text-3xl font-black font-mono text-green-500 leading-none tracking-tighter">{calculateTotal().toFixed(2)}€</span>
             </div>
             <div className="w-[1px] h-10 bg-white/10 mx-2" />
             <button onClick={() => setStep('CHECKOUT')} className="p-5 rounded-2xl bg-white text-black hover:bg-green-500 transition-all shadow-xl">
               <ReceiptText size={20} />
             </button>
          </div>
        </footer>

      </div>
    </div>
  );
}
