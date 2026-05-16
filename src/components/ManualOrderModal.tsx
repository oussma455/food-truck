"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FORMULAS, ORDER_TYPES } from "@/lib/data";
import { SandwichConfig, Option, Order, Category, StepId } from "@/types";
import { supabase } from "@/lib/supabase";
import { 
  X, Plus, Check, ShoppingCart, 
  ArrowRight, ArrowLeft, Minus, 
  ReceiptText, Utensils, CupSoda, Trash2
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Internal OptionCard to match Modal layout but keep Client UI logic
function ModalOptionCard({ 
  option, isSelected, onClick, icon, hidePrice, surchargeValue 
}: { 
  option: Option; isSelected: boolean; onClick: () => void; icon?: React.ReactNode; hidePrice?: boolean; surchargeValue?: number;
}) {
  const displayPrice = surchargeValue !== undefined ? surchargeValue : option.price;
  const shouldShowPrice = !hidePrice && (displayPrice !== 0);

  return (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "premium-card p-5 flex justify-between items-center group cursor-pointer border transition-all duration-300 relative overflow-hidden h-24",
        isSelected 
          ? "border-primary bg-primary/10 shadow-[0_0_30px_rgba(239,68,68,0.1)]" 
          : "border-white/5 bg-white/[0.02] hover:border-white/20"
      )}
    >
      <div className="flex items-center gap-5 relative z-10">
        {icon && (
          <div className={cn(
            "p-3 rounded-2xl transition-all duration-500",
            isSelected ? "bg-primary text-black" : "bg-white/5 text-gray-500"
          )}>
            {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 20 }) : icon}
          </div>
        )}
        <div>
          <p className={cn(
            "font-black text-xs uppercase tracking-widest transition-colors",
            isSelected ? "text-white" : "text-gray-400 group-hover:text-gray-200"
          )}>
            {option.name}
          </p>
          {option.description && (
            <p className="text-[9px] text-gray-600 mt-1 uppercase font-bold tracking-tighter truncate max-w-[150px]">
              {option.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 relative z-10">
        {shouldShowPrice && (
          <span className="text-[11px] font-mono font-black text-primary">
            {displayPrice > 0 ? `+${displayPrice.toFixed(2)}€` : `${displayPrice.toFixed(2)}€`}
          </span>
        )}
        <div className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500",
          isSelected 
            ? "bg-primary border-primary text-black" 
            : "border-white/10 bg-black/40 text-transparent"
        )}>
          <Check size={12} strokeWidth={4} />
        </div>
      </div>
    </motion.div>
  );
}

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
  const [clientInfo, setClientInfo] = useState({ name: "Client Téléphone", phone: "", notes: "" });

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

  const getAvailableOptions = (catId: string) => {
    return menuCategories.find(c => c.id === catId)?.options || [];
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
    const steps: StepId[] = ['ORDER_TYPE', 'FORMULA', 'COUSCOUS', 'COUSCOUS_MEAT', 'PRESETS', 'KIDS_MENU', 'MEATS', 'STEAKS', 'SAUCES', 'EXTRAS', 'DRINKS', 'DESSERTS', 'CHECKOUT'];
    const idx = steps.indexOf(step);
    if (idx > 0) {
      // Logic-aware back
      if (step === 'FORMULA' || step === 'COUSCOUS') setStep('ORDER_TYPE');
      else if (step === 'COUSCOUS_MEAT') setStep('COUSCOUS');
      else if (step === 'PRESETS' || step === 'KIDS_MENU') setStep('FORMULA');
      else if (step === 'MEATS' || step === 'STEAKS' || (step === 'SAUCES' && !['p4', 'p5'].includes(currentConfig.preset_sandwich?.id || ''))) {
         setStep(currentConfig.formula?.id === 'menu_kids' ? 'KIDS_MENU' : 'PRESETS');
      }
      else if (step === 'SAUCES') {
        if (currentConfig.preset_sandwich?.id === 'p4') setStep('MEATS');
        else if (currentConfig.preset_sandwich?.id === 'p5') setStep('STEAKS');
        else setStep('PRESETS');
      }
      else if (step === 'DRINKS' && isCouscousMode) setStep('COUSCOUS_MEAT');
      else setStep(steps[idx - 1]);
    }
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
    setStep('ORDER_TYPE');
  };

  if (!isOpen) return null;

  const renderStep = () => {
    switch (step) {
      case 'ORDER_TYPE':
        return (
          <div className="grid grid-cols-1 gap-4">
            {ORDER_TYPES.map(type => (
              <ModalOptionCard 
                key={type.id} 
                option={type} 
                isSelected={orderType === type.id && !isCouscousMode} 
                onClick={() => { setOrderType(type.id as any); setIsCouscousMode(false); handleNext('ORDER_TYPE'); }} 
                icon={type.id === 'takeaway' ? <ShoppingCart /> : <MapPin />} 
                hidePrice={true} 
              />
            ))}
            <div className="relative py-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
              <span className="relative bg-background px-6 text-gray-700 text-[9px] uppercase tracking-[0.4em] font-black">Spécialité</span>
            </div>
            <ModalOptionCard 
              option={{ id: 'couscous', name: 'Réserver un Couscous', price: 0, description: 'Traditionnel • 24h à l\'avance' }}
              isSelected={isCouscousMode}
              onClick={() => { setIsCouscousMode(true); setStep('COUSCOUS'); }}
              icon={<Utensils />}
              hidePrice={true}
            />
          </div>
        );
      case 'COUSCOUS':
        return (
          <div className="grid grid-cols-1 gap-3">
            {getAvailableOptions('couscous_size').map(size => (
              <ModalOptionCard key={size.id} option={size} isSelected={currentConfig.formula?.id === size.id} onClick={() => { setCurrentConfig({...currentConfig, formula: size}); handleNext('COUSCOUS'); }} />
            ))}
          </div>
        );
      case 'COUSCOUS_MEAT':
        return (
          <div className="grid grid-cols-1 gap-3">
            {getAvailableOptions('couscous_type').map(type => (
              <ModalOptionCard key={type.id} option={type} isSelected={currentConfig.preset_sandwich?.id === type.id} onClick={() => { setCurrentConfig({...currentConfig, preset_sandwich: type}); handleNext('COUSCOUS_MEAT'); }} />
            ))}
          </div>
        );
      case 'FORMULA':
        return (
          <div className="grid grid-cols-1 gap-3">
            {[...FORMULAS].sort((a, b) => a.price - b.price).map(f => (
              <ModalOptionCard key={f.id} option={f} isSelected={currentConfig.formula?.id === f.id} onClick={() => { setCurrentConfig({...currentConfig, formula: f}); handleNext('FORMULA', f.id); }} />
            ))}
          </div>
        );
      case 'PRESETS':
        return (
          <div className="grid grid-cols-1 gap-3">
            {getAvailableOptions('presets').sort((a, b) => a.price - b.price).map(p => {
              const surchargeVal = Math.max(0, p.price - 12);
              return (
                <ModalOptionCard 
                  key={p.id} 
                  option={p} 
                  isSelected={currentConfig.preset_sandwich?.id === p.id} 
                  onClick={() => { setCurrentConfig({...currentConfig, preset_sandwich: p}); handleNext('PRESETS', p.id); }} 
                  surchargeValue={surchargeVal} 
                  hidePrice={surchargeVal === 0} 
                />
              );
            })}
          </div>
        );
      case 'KIDS_MENU':
        return (
          <div className="grid grid-cols-1 gap-3">
            {getAvailableOptions('kids_menu').sort((a, b) => a.price - b.price).map(k => (
              <ModalOptionCard key={k.id} option={k} isSelected={currentConfig.preset_sandwich?.id === k.id} onClick={() => { setCurrentConfig({...currentConfig, preset_sandwich: k}); handleNext('KIDS_MENU'); }} hidePrice={true} />
            ))}
          </div>
        );
      case 'MEATS':
        const currentMeatsCount = (currentConfig.meats || []).length;
        return (
          <div className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl mb-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary text-center">
                2 viandes incluses <span className="opacity-60 font-medium">(+2€ par viande supp.)</span>
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {getAvailableOptions('meats').sort((a, b) => a.price - b.price).map(opt => {
                const isSel = (currentConfig.meats || []).some(m => m.id === opt.id);
                const surchargeVal = (currentMeatsCount >= 2 && !isSel) ? 2 : 0;
                return (
                  <ModalOptionCard 
                    key={opt.id} 
                    option={opt} 
                    isSelected={isSel} 
                    onClick={() => {
                      const currentMeats = currentConfig.meats || [];
                      if (isSel) setCurrentConfig({...currentConfig, meats: currentMeats.filter(m => m.id !== opt.id)});
                      else if (currentMeats.length < 5) setCurrentConfig({...currentConfig, meats: [...currentMeats, opt]});
                    }}
                    surchargeValue={surchargeVal}
                    hidePrice={surchargeVal === 0}
                  />
                );
              })}
            </div>
            <button disabled={currentMeatsCount < 2} onClick={() => handleNext('MEATS')} className="w-full py-4 bg-primary text-black font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 disabled:opacity-20 transition-all">
              Valider le mélange ({currentMeatsCount}/5)
            </button>
          </div>
        );
      case 'STEAKS':
        return (
          <div className="grid grid-cols-1 gap-3">
            {getAvailableOptions('steaks_qty').map(s => (
              <ModalOptionCard key={s.id} option={s} isSelected={currentConfig.steaks_qty?.id === s.id} onClick={() => { setCurrentConfig({...currentConfig, steaks_qty: s}); handleNext('STEAKS'); }} />
            ))}
          </div>
        );
      case 'SAUCES':
      case 'EXTRAS':
        const catId = step === 'SAUCES' ? 'sauces' : 'extras';
        const isSauce = step === 'SAUCES';
        const currentList = currentConfig[catId] as Option[] || [];
        return (
          <div className="space-y-4">
            {isSauce && (
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl mb-2 flex items-center gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-widest text-primary leading-relaxed text-center w-full">
                  2 Sauces incluses <span className="opacity-60 font-medium">(+0.50€ supp.)</span>
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-3">
              {getAvailableOptions(catId).map(opt => {
                const isSel = currentList.some(s => s.id === opt.id);
                const isIncluded = isSauce && currentList.length < 2 && !isSel;
                return (
                  <ModalOptionCard 
                    key={opt.id} 
                    option={opt} 
                    isSelected={isSel} 
                    onClick={() => {
                      if (isSel) setCurrentConfig({...currentConfig, [catId]: currentList.filter(s => s.id !== opt.id)});
                      else setCurrentConfig({...currentConfig, [catId]: [...currentList, opt]});
                    }}
                    hidePrice={isSauce && (isIncluded || (isSel && currentList.indexOf(currentList.find(s => s.id === opt.id)!) < 2))}
                    surchargeValue={isSauce ? 0.50 : undefined}
                  />
                );
              })}
            </div>
            <button onClick={() => handleNext(step)} className="w-full py-4 bg-white text-black font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl transition-all">
              Continuer
            </button>
          </div>
        );
      case 'DRINKS':
      case 'DESSERTS':
        const type = step === 'DRINKS' ? 'drinks' : 'desserts';
        const fId = currentConfig.formula?.id || '';
        let quota = ['menu_standard', 'menu_student', 'menu_kids'].includes(fId) ? 1 : 0;
        if (isCouscousMode) quota = fId === 'COUSCOUS_S1' ? 2 : fId === 'COUSCOUS_S2' ? 3 : 4;

        return (
          <div className="space-y-6">
            {type === 'drinks' && quota > 0 && (
              <div className="bg-primary/10 border border-primary/20 p-5 rounded-3xl flex items-center gap-4 animate-pulse mb-6">
                <CupSoda className="text-primary" size={20} />
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                  {fId === 'COUSCOUS_S3' ? "4 Canettes ou 1 Bouteille (1.5L) incluses !" : `${quota} Boisson(s) incluse(s) !`}
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-3">
              {getAvailableOptions(type).map(opt => {
                const currentSide = currentConfig[type] || [];
                const qty = currentSide.find(i => i.option.id === opt.id)?.quantity || 0;
                
                let isFree = false;
                if (type === 'drinks' && quota > 0) {
                   const totalCans = currentSide.filter(i => !i.option.name.includes('1.5L') && !i.option.name.includes('2L')).reduce((acc, i) => acc + i.quantity, 0);
                   const hasBottle = currentSide.some(i => i.option.name.includes('1.5L') && i.quantity > 0);
                   if (quota === 4) isFree = (opt.name.includes('1.5L') && totalCans === 0 && !hasBottle) || (!opt.name.includes('1.5L') && !hasBottle && totalCans < 4);
                   else isFree = !opt.name.includes('1.5L') && !opt.name.includes('2L') && totalCans < quota;
                }

                return (
                  <div key={opt.id} className="premium-card p-4 flex justify-between items-center bg-white/[0.02] border border-white/5 rounded-2xl h-20">
                    <div>
                      <p className="font-black text-[10px] uppercase tracking-widest text-gray-200">{opt.name}</p>
                      <p className="text-[10px] text-primary font-mono font-black mt-1">
                        {isFree ? "INCLUS" : `${opt.price.toFixed(2)}€`}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 bg-black/40 p-2 rounded-xl border border-white/5">
                      <button onClick={() => {
                        const existing = currentSide.find(i => i.option.id === opt.id);
                        if (existing) {
                          const newQty = Math.max(0, existing.quantity - 1);
                          if (newQty === 0) setCurrentConfig({...currentConfig, [type]: currentSide.filter(i => i.option.id !== opt.id)});
                          else setCurrentConfig({...currentConfig, [type]: currentSide.map(i => i.option.id === opt.id ? {...i, quantity: newQty} : i)});
                        }
                      }} className="p-1 text-gray-500 hover:text-primary"><Minus size={14} /></button>
                      <span className="text-xs font-black w-4 text-center text-white">{qty}</span>
                      <button onClick={() => {
                        const existing = currentSide.find(i => i.option.id === opt.id);
                        if (existing) setCurrentConfig({...currentConfig, [type]: currentSide.map(i => i.option.id === opt.id ? {...i, quantity: i.quantity + 1} : i)});
                        else setCurrentConfig({...currentConfig, [type]: [...currentSide, { option: opt, quantity: 1 }]});
                      }} className="p-1 text-gray-500 hover:text-primary"><Plus size={14} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => handleNext(step)} className="w-full py-4 bg-white text-black font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl transition-all">
              {step === 'DESSERTS' ? "Terminer" : "Continuer"}
            </button>
          </div>
        );
      case 'CHECKOUT':
        return (
          <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 p-6 rounded-3xl">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4">Résumé de l&apos;article</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-black text-white uppercase">{currentConfig.preset_sandwich?.name || 'Article'}</p>
                  <p className="text-sm font-mono text-primary font-black">{calculateItemPrice(currentConfig).toFixed(2)}€</p>
                </div>
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{currentConfig.formula?.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={addItemToBasket} className="py-4 bg-white/5 border border-white/10 text-white font-black rounded-2xl uppercase text-[9px] tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                <Plus size={14} /> Un autre
              </button>
              <button onClick={handleSubmit} className="py-4 bg-primary text-black font-black rounded-2xl uppercase text-[9px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                Valider Tout
              </button>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl text-white font-sans overflow-hidden">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-secondary/90 w-full max-w-6xl rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden flex h-[90vh]">
        
        {/* Left Side: Basket Summary (Fixed Mirror) */}
        <div className="w-96 bg-black border-r border-white/5 flex flex-col p-10">
          <div className="flex items-center gap-4 mb-10">
            <div className="bg-primary p-3 rounded-2xl text-black shadow-[0_0_20px_rgba(239,68,68,0.3)]"><ShoppingCart size={24} /></div>
            <div>
              <h2 className="text-2xl font-serif font-black uppercase tracking-widest italic leading-none">PANIER</h2>
              <p className="text-[8px] text-gray-500 font-black uppercase tracking-[0.4em] mt-1">Commandes en cours</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-4">
            {basket.map((item, idx) => (
              <div key={idx} className="bg-white/[0.03] p-5 rounded-3xl border border-white/5 relative group hover:border-primary/30 transition-all">
                <button onClick={() => setBasket(basket.filter((_, i) => i !== idx))} className="absolute -top-3 -right-3 bg-primary text-black p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:rotate-90"><Trash2 size={14} /></button>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em]">{item.formula?.name}</p>
                  <p className="text-xs font-mono text-white font-black">{calculateItemPrice(item).toFixed(2)}€</p>
                </div>
                <p className="text-sm font-black text-gray-200 uppercase tracking-tight">{item.preset_sandwich?.name}</p>
                <div className="flex flex-wrap gap-1 mt-3">
                   {item.sauces.map(s => <span key={s.id} className="text-[7px] bg-white/5 px-2 py-1 rounded-md text-gray-500 font-black uppercase tracking-widest">{s.name}</span>)}
                </div>
              </div>
            ))}
            {basket.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-10 text-center scale-75">
                <ReceiptText size={64} className="mb-6" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em]">Panier Vide</p>
              </div>
            )}
          </div>

          <div className="pt-10 border-t border-white/10">
            <div className="flex justify-between items-center mb-8">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-500 italic">Total Global</span>
              <span className="text-4xl font-black font-mono text-white tracking-tighter shadow-primary/20">{calculateTotal().toFixed(2)}€</span>
            </div>
            <button onClick={handleSubmit} disabled={basket.length === 0 && (!currentConfig.formula || !currentConfig.preset_sandwich)} className="w-full py-6 bg-primary text-black font-black rounded-3xl uppercase text-xs tracking-[0.3em] shadow-[0_20px_50px_rgba(239,68,68,0.2)] disabled:opacity-10 transition-all hover:scale-[1.02] active:scale-95">
              Encaisser la commande
            </button>
          </div>
        </div>

        {/* Right Side: Exact Tunnel Mirror */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-background">
          <header className="p-10 border-b border-white/5 flex justify-between items-center bg-black/40 backdrop-blur-md relative z-10">
            <div>
              <p className="text-[10px] text-primary font-black uppercase tracking-[0.5em] mb-2 italic flex items-center gap-3">
                <span className="w-10 h-[1px] bg-primary/30" /> PRISE DE COMMANDE MANUELLE
              </p>
              <h3 className="text-4xl font-serif font-black italic text-white uppercase tracking-tighter">
                {step.replace(/_/g, ' ')}
              </h3>
            </div>
            <button onClick={onClose} className="p-5 rounded-3xl bg-white/5 hover:bg-primary hover:text-black transition-all border border-white/10 group">
              <X size={24} className="group-hover:rotate-90 transition-transform duration-500" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-12 custom-scrollbar relative z-0">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }} transition={{ type: "spring", stiffness: 100, damping: 20 }}>
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          <footer className="p-10 border-t border-white/5 bg-black/40 backdrop-blur-md flex justify-between items-center gap-10">
            <div className="flex gap-6">
              <div className="space-y-1">
                <p className="text-[7px] font-black text-gray-600 uppercase tracking-widest ml-2">Identité Client</p>
                <input type="text" placeholder="NOM DU CLIENT" value={clientInfo.name} onChange={(e) => setClientInfo({...clientInfo, name: e.target.value.toUpperCase()})} className="px-8 py-5 rounded-[1.5rem] bg-white/[0.02] border border-white/5 text-xs font-black tracking-widest text-white focus:border-primary/50 outline-none w-64 placeholder:text-gray-800 transition-all shadow-inner" />
              </div>
              <div className="space-y-1">
                <p className="text-[7px] font-black text-gray-600 uppercase tracking-widest ml-2">Contact</p>
                <input type="tel" placeholder="N° TÉLÉPHONE" value={clientInfo.phone} onChange={(e) => setClientInfo({...clientInfo, phone: e.target.value})} className="px-8 py-5 rounded-[1.5rem] bg-white/[0.02] border border-white/5 text-xs font-black tracking-widest text-white focus:border-primary/50 outline-none w-56 placeholder:text-gray-800 transition-all shadow-inner" />
              </div>
            </div>

            <div className="flex gap-4 items-center">
              <button onClick={handleBack} className={cn("p-6 rounded-[2rem] bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-all hover:border-white/30", step === 'ORDER_TYPE' && "opacity-0 pointer-events-none")}>
                <ArrowLeft size={24} />
              </button>
              
              <div className="bg-white/[0.03] px-10 py-5 rounded-[2rem] border border-white/5">
                <p className="text-[7px] text-gray-600 font-black uppercase tracking-[0.4em] mb-1">Total Article</p>
                <p className="text-2xl font-black font-mono text-primary tracking-tighter">{calculateItemPrice(currentConfig).toFixed(2)}€</p>
              </div>
            </div>
          </footer>
        </div>
      </motion.div>
    </div>
  );
}
