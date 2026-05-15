"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SANDWICH_CATEGORIES, ORDER_TYPES, FORMULAS } from "@/lib/data";
import { SandwichConfig, Option, Category, StepId, PaymentMethod, Order } from "@/types";
import OneSignal from 'react-onesignal';
import { ShoppingCart, Check, Plus, Minus, Clock, MapPin, Phone, Shield, GraduationCap, Baby, Star, CreditCard, Wallet, UtensilsCrossed, Bell, X, Utensils, Sandwich as BurgerIcon, CupSoda, ShieldCheck, ChevronRight } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Link from "next/link";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CheckoutScreenProps {
  orderInfo: { name: string; phone: string; pickupTime: string; type: "on_site" | "takeaway"; paymentMethod: PaymentMethod };
  setOrderInfo: React.Dispatch<React.SetStateAction<{ name: string; phone: string; pickupTime: string; type: "on_site" | "takeaway"; paymentMethod: PaymentMethod }>>;
  cart: SandwichConfig[];
  currentConfig: SandwichConfig;
  calculateTotal: () => number;
  rgpdAccepted: boolean;
  setRgpdAccepted: (val: boolean) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  onAddAnother: () => void;
  isCouscousMode: boolean;
}

// Production Version 1.9 - Absolute Fixes
export default function SandwichBuilder() {
  const [isOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("truck_status") !== "closed";
    }
    return true;
  });

  const [step, setStep] = useState<StepId>('ORDER_TYPE');
  const [activeTab, setActiveTab] = useState<'menu' | 'cart'>('menu');
  const [isCouscousMode, setIsCouscousMode] = useState(false);
  
  const [menu] = useState<Category[]>(() => {
    if (typeof window !== "undefined") {
      const savedMenu = localStorage.getItem("truck_menu");
      const baseMenu = [...SANDWICH_CATEGORIES];
      
      if (savedMenu) {
        try {
          const parsedMenu = JSON.parse(savedMenu);
          return baseMenu.map(baseCat => {
            const savedCat = parsedMenu.find((c: Category) => c.id === baseCat.id);
            if (!savedCat) return baseCat;
            const mergedOptions = baseCat.options.map(baseOpt => {
              const savedOpt = savedCat.options.find((o: Option) => o.id === baseOpt.id);
              return savedOpt ? { ...baseOpt, isAvailable: savedOpt.isAvailable } : baseOpt;
            });
            return { ...baseCat, options: mergedOptions };
          });
        } catch (e) { console.error("Error parsing menu", e); }
      }
      return baseMenu;
    }
    return SANDWICH_CATEGORIES;
  });

  const getAvailableOptions = (categoryId: string) => {
    const category = menu.find(c => c.id === categoryId);
    return category ? category.options.filter(o => o.isAvailable !== false) : [];
  };

  const [cart, setCart] = useState<SandwichConfig[]>([]);
  const [currentConfig, setCurrentConfig] = useState<SandwichConfig>({
    sauces: [], extras: [], drinks: [], desserts: [],
  });

  const [orderInfo, setOrderInfo] = useState<{
    name: string; phone: string; type: "on_site" | "takeaway"; pickupTime: string; paymentMethod: PaymentMethod
  }>({
    name: "", phone: "", type: "takeaway", pickupTime: "", paymentMethod: "card"
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [waitTime, setWaitTime] = useState("15 min");

  useEffect(() => {
    if (waitTime) {
      setOrderInfo(prev => ({ ...prev, pickupTime: waitTime }));
    }
  }, [waitTime]);

  useEffect(() => {
    const checkWaitTime = () => {
      const savedTime = localStorage.getItem("truck_wait_time") || "15 min";
      setWaitTime(savedTime);
    };
    checkWaitTime();
    window.addEventListener('storage', checkWaitTime);
    return () => window.removeEventListener('storage', checkWaitTime);
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loyaltyPoints] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [rgpdAccepted, setRgpdAccepted] = useState(false);

  const calculateGrilladeTotal = (config: SandwichConfig) => {
    let total = config.formula?.price || 0;
    const formulaId = config.formula?.id || '';
    const isStandardMenu = ['menu_standard', 'menu_student', 'menu_kids'].includes(formulaId);

    // Sandwich Surcharge (Only add if > 10€ and not Kids Menu)
    if (config.preset_sandwich && formulaId !== 'menu_kids') {
      const extra = Math.max(0, config.preset_sandwich.price - 10);
      total += extra;
    }

    // Sauces: 2 free, then 0.50€
    const saucesCount = config.sauces.length;
    total += Math.max(0, saucesCount - 2) * 0.5;

    // Extras
    total += config.extras.reduce((acc, e) => acc + e.price, 0);
    
    // Drinks: 1 free for menus, 0 for Sandwich Seul
    const drinks = config.drinks || [];
    const drinkQuota = isStandardMenu ? 1 : 0;

    if (drinkQuota > 0) {
      const cansPrices = drinks.filter(d => !d.option.name.includes('1.5L') && !d.option.name.includes('2L'))
                               .flatMap(d => Array(d.quantity).fill(d.option.price))
                               .sort((a, b) => b - a);
      const paidCans = cansPrices.slice(drinkQuota);
      total += paidCans.reduce((acc, p) => acc + p, 0);
      total += drinks.filter(d => d.option.name.includes('1.5L') || d.option.name.includes('2L'))
                     .reduce((acc, d) => acc + (d.option.price * d.quantity), 0);
    } else {
      total += drinks.reduce((acc, d) => acc + (d.option.price * d.quantity), 0);
    }

    total += (config.desserts || []).reduce((acc, d) => acc + (d.option.price * d.quantity), 0);
    return total;
  };

  const calculateCouscousTotal = (config: SandwichConfig) => {
    let total = config.formula?.price || 0;
    const formulaId = config.formula?.id || '';

    if (config.preset_sandwich) {
      total += config.preset_sandwich.price;
    }

    const drinks = config.drinks || [];
    let drinkQuota = 0;
    if (formulaId === 'COUSCOUS_S1') drinkQuota = 2;
    else if (formulaId === 'COUSCOUS_S2') drinkQuota = 3;
    else if (formulaId === 'COUSCOUS_S3') drinkQuota = 4;

    if (formulaId === 'COUSCOUS_S3') {
      const totalBottles = drinks.filter(d => d.option.name.includes('1.5L') || d.option.name.includes('2L')).reduce((acc, d) => acc + d.quantity, 0);
      if (totalBottles >= 1) {
        const bottles = drinks.filter(d => d.option.name.includes('1.5L') || d.option.name.includes('2L')).sort((a, b) => b.option.price - a.option.price);
        total += (totalBottles - 1) * bottles[0].option.price;
        total += drinks.filter(d => !d.option.name.includes('1.5L') && !d.option.name.includes('2L')).reduce((acc, d) => acc + (d.option.price * d.quantity), 0);
        return total + (config.desserts || []).reduce((acc, d) => acc + (d.option.price * d.quantity), 0);
      }
    }

    const cansPrices = drinks.filter(d => !d.option.name.includes('1.5L') && !d.option.name.includes('2L')).flatMap(d => Array(d.quantity).fill(d.option.price)).sort((a, b) => b - a);
    const paidCans = cansPrices.slice(drinkQuota);
    total += paidCans.reduce((acc, p) => acc + p, 0);
    total += drinks.filter(d => d.option.name.includes('1.5L') || d.option.name.includes('2L')).reduce((acc, d) => acc + (d.option.price * d.quantity), 0);
    total += (config.desserts || []).reduce((acc, d) => acc + (d.option.price * d.quantity), 0);
    return total;
  };

  const calculateItemTotal = (config: SandwichConfig) => {
    const formulaId = config.formula?.id || '';
    if (formulaId.startsWith('COUSCOUS_')) return calculateCouscousTotal(config);
    return calculateGrilladeTotal(config);
  };

  const calculateTotal = () => {
    const cartTotal = cart.reduce((acc, item) => acc + calculateItemTotal(item), 0);
    const currentTotal = calculateItemTotal(currentConfig);
    return cartTotal + currentTotal;
  };

  const handleNext = (overrideStep?: StepId, formulaId?: string) => {
    const currentStep = overrideStep || step;
    switch (currentStep) {
      case 'ORDER_TYPE': 
        setIsCouscousMode(false); 
        setStep('FORMULA'); 
        break;
      case 'FORMULA':
        const selId = formulaId || currentConfig.formula?.id;
        if (selId === 'menu_kids') {
          setIsCouscousMode(false);
          setStep('KIDS_MENU');
        } else if (selId?.startsWith('COUSCOUS_')) {
          setIsCouscousMode(true);
          setStep('COUSCOUS_MEAT');
        } else {
          setIsCouscousMode(false);
          setStep('PRESETS');
        }
        break;
      case 'COUSCOUS': setStep('COUSCOUS_MEAT'); break;
      case 'COUSCOUS_MEAT': setStep('DRINKS'); break;
      case 'KIDS_MENU': setStep('DRINKS'); break;
      case 'PRESETS': setStep('EXTRAS'); break;
      case 'EXTRAS': setStep('DRINKS'); break;
      case 'DRINKS':
        const fId = currentConfig.formula?.id || '';
        const isM = ['menu_standard', 'menu_student', 'menu_kids'].includes(fId);
        const isC = fId.startsWith('COUSCOUS_');
        let q = isM ? 1 : 0;
        if (isC) {
          if (fId === 'COUSCOUS_S1') q = 2;
          else if (fId === 'COUSCOUS_S2') q = 3;
          else if (fId === 'COUSCOUS_S3') q = 4;
        }
        const totalQ = (currentConfig.drinks || []).reduce((acc, d) => acc + d.quantity, 0);
        if (q > 0 && totalQ < q) {
          alert(`Votre formule inclut ${q} boisson(s) ! Veuillez les choisir.`);
          return;
        }
        setStep('DESSERTS');
        break;
      case 'DESSERTS': setStep('CHECKOUT'); setActiveTab('cart'); break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'FORMULA': setStep('ORDER_TYPE'); break;
      case 'COUSCOUS': setStep('FORMULA'); break;
      case 'COUSCOUS_MEAT': setStep('COUSCOUS'); break;
      case 'PRESETS': setStep('FORMULA'); break;
      case 'KIDS_MENU': setStep('FORMULA'); break;
      case 'EXTRAS': setStep(currentConfig.formula?.id === 'menu_kids' ? 'KIDS_MENU' : 'PRESETS'); break;
      case 'DRINKS': setStep(isCouscousMode ? 'COUSCOUS_MEAT' : 'EXTRAS'); break;
      case 'DESSERTS': setStep('DRINKS'); break;
      case 'CHECKOUT': setStep('DESSERTS'); setActiveTab('menu'); break;
    }
  };

  const handleSubmitOrder = async () => {
    if (!orderInfo.name || !orderInfo.phone) { alert("Veuillez remplir vos informations"); return; }
    if (!rgpdAccepted) { alert("Veuillez accepter le RGPD"); return; }
    setIsSubmitting(true);
    setTimeout(() => {
      setShowConfetti(true);
      setTimeout(() => {
        setIsSubmitting(false); setStep('ORDER_TYPE'); setActiveTab('menu');
        setCart([]); setCurrentConfig({ sauces: [], extras: [], drinks: [], desserts: [] });
        setShowConfetti(false); alert("Commande validée !");
      }, 2000);
    }, 1500);
  };

  const renderStep = () => {
    switch (step) {
      case 'ORDER_TYPE':
        return (
          <StepContainer title="Bienvenue" subtitle="Sur place ou à emporter ?">
            <div className="grid grid-cols-1 gap-4">
              {ORDER_TYPES.map(type => (
                <OptionCard key={type.id} option={type} isSelected={orderInfo.type === type.id} onClick={() => { setOrderInfo({...orderInfo, type: type.id as 'on_site' | 'takeaway'}); handleNext('ORDER_TYPE'); }} icon={type.id === 'takeaway' ? <ShoppingCart /> : <MapPin />} hidePrice={true} />
              ))}
              <div className="h-[1px] w-full bg-gray-900 my-4 flex items-center justify-center"><span className="bg-background px-4 text-gray-700 text-[8px] uppercase tracking-widest font-black">Ou réservation spéciale</span></div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setIsCouscousMode(true); setStep('COUSCOUS'); }} className="w-full bg-white p-5 rounded-2xl flex items-center justify-between gap-4 border border-white group relative overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                <div className="flex items-center gap-4">
                  <div className="bg-primary p-2.5 rounded-xl text-white group-hover:rotate-12 transition-transform"><Utensils size={20} /></div>
                  <div className="text-left"><span className="text-primary font-black uppercase tracking-widest text-[11px] block">Pré-commander Couscous</span><span className="text-gray-900/60 text-[8px] uppercase font-bold tracking-widest">Réservé 24h à l&apos;avance • 2 à 4 pers.</span></div>
                </div>
                <div className="w-5 h-5 rounded-full border border-primary flex items-center justify-center group-hover:bg-primary transition-all"><Plus size={10} className="text-primary group-hover:text-white" /></div>
              </motion.button>
            </div>
          </StepContainer>
        );
      case 'COUSCOUS':
        return (
          <StepContainer title="Couscous Maison" subtitle="Taille de la tablée">
            <div className="grid grid-cols-1 gap-3">
              {getAvailableOptions('couscous_size').map(size => (
                <OptionCard key={size.id} option={size} isSelected={currentConfig.formula?.id === size.id} onClick={() => { setCurrentConfig({...currentConfig, formula: size}); setTimeout(() => handleNext('COUSCOUS'), 300); }} />
              ))}
            </div>
          </StepContainer>
        );
      case 'COUSCOUS_MEAT':
        return (
          <StepContainer title="Couscous Maison" subtitle="Choisissez l'accompagnement">
            <div className="grid grid-cols-1 gap-3">
              {getAvailableOptions('couscous_type').map(type => (
                <OptionCard key={type.id} option={type} isSelected={currentConfig.preset_sandwich?.id === type.id} onClick={() => { setCurrentConfig({...currentConfig, preset_sandwich: type}); setTimeout(() => handleNext('COUSCOUS_MEAT'), 300); }} />
              ))}
            </div>
          </StepContainer>
        );
      case 'FORMULA':
        return (
          <StepContainer title="Formule" subtitle="Choisissez votre plaisir">
            <div className="grid grid-cols-1 gap-3">
              {FORMULAS.map(f => (
                <OptionCard key={f.id} option={f} isSelected={currentConfig.formula?.id === f.id} onClick={() => { setCurrentConfig({...currentConfig, formula: f}); setTimeout(() => handleNext('FORMULA', f.id), 300); }} />
              ))}
            </div>
          </StepContainer>
        );
      case 'PRESETS':
        return (
          <StepContainer title="Nos Créations" subtitle="Recettes signatures">
            <div className="grid grid-cols-1 gap-3">
              {getAvailableOptions('presets').map(p => {
                // The base 10€ is always covered by the formula price (Menu or Sandwich Seul)
                const surchargeVal = Math.max(0, p.price - 10);
                return (
                  <OptionCard 
                    key={p.id} 
                    option={p} 
                    isSelected={currentConfig.preset_sandwich?.id === p.id} 
                    onClick={() => { 
                      setCurrentConfig({...currentConfig, preset_sandwich: p}); 
                      setTimeout(() => handleNext('PRESETS'), 300); 
                    }} 
                    surchargeValue={surchargeVal} 
                    hidePrice={surchargeVal === 0} 
                  />
                );
              })}
            </div>
          </StepContainer>
        );
      case 'KIDS_MENU':
        return (
          <StepContainer title="Menu Enfant" subtitle="Son petit régal">
            <div className="grid grid-cols-1 gap-3">
              {getAvailableOptions('kids_menu').map(k => (
                <OptionCard key={k.id} option={k} isSelected={currentConfig.preset_sandwich?.id === k.id} onClick={() => { setCurrentConfig({...currentConfig, preset_sandwich: k}); setTimeout(() => handleNext('KIDS_MENU'), 300); }} hidePrice={true} />
              ))}
            </div>
          </StepContainer>
        );
      case 'EXTRAS':
        const extrasCat = menu.find(c => c.id === 'extras');
        if (!extrasCat) return null;
        return <CategoryStep category={{...extrasCat, options: getAvailableOptions('extras')}} config={currentConfig} setConfig={setCurrentConfig} onNext={() => handleNext('EXTRAS')} type="multiple" />;
      case 'DRINKS':
        const formulaIdDrinksStep = currentConfig.formula?.id || '';
        const isStandardMenu = ['menu_standard', 'menu_student', 'menu_kids'].includes(formulaIdDrinksStep);
        const isCouscousStep = formulaIdDrinksStep.startsWith('COUSCOUS_');
        
        let q = 0;
        if (isStandardMenu) q = 1;
        else if (isCouscousStep) {
          if (formulaIdDrinksStep === 'COUSCOUS_S1') q = 2;
          else if (formulaIdDrinksStep === 'COUSCOUS_S2') q = 3;
          else if (formulaIdDrinksStep === 'COUSCOUS_S3') q = 4;
        }

        let quotaT = "";
        if (isStandardMenu) quotaT = "1 Boisson comprise !";
        else if (isCouscousStep) {
          if (formulaIdDrinksStep === 'COUSCOUS_S3') quotaT = "4 Cannettes OU 1 Bouteille 1.5L offerte !";
          else quotaT = `${q} Boissons offertes !`;
        }

        const availableDrinks = getAvailableOptions('drinks');
        const cans = availableDrinks.filter(d => !d.name.includes('1.5L') && !d.name.includes('2L'));
        const bottles = availableDrinks.filter(d => d.name.includes('1.5L') || d.name.includes('2L'));
        return (
          <StepContainer title="Boissons" subtitle="Choisissez votre rafraîchissement">
            <div className="space-y-8">
              {quotaT && availableDrinks.length > 0 && (
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl flex items-center gap-3 animate-bounce">
                  <CupSoda className="text-primary" size={18} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">{quotaT}</p>
                </div>
              )}
              <SideSelector label="Cannettes & Petits formats" options={cans} config={currentConfig} setConfig={setCurrentConfig} type="drinks" quota={q} />
              {bottles.length > 0 && <SideSelector label="Grandes Bouteilles (1.5L / 2L)" options={bottles} config={currentConfig} setConfig={setCurrentConfig} type="drinks" quota={formulaIdDrinksStep === 'COUSCOUS_S3' ? 1 : 0} />}
            </div>
          </StepContainer>
        );
      case 'DESSERTS':
        return (
          <StepContainer title="Desserts" subtitle="Une touche sucrée ?">
            <SideSelector label="Desserts" options={getAvailableOptions('desserts')} config={currentConfig} setConfig={setCurrentConfig} type="desserts" />
          </StepContainer>
        );
      case 'CHECKOUT':
        return <CheckoutScreen orderInfo={orderInfo} setOrderInfo={setOrderInfo} cart={cart} currentConfig={currentConfig} calculateTotal={calculateTotal} rgpdAccepted={rgpdAccepted} setRgpdAccepted={setRgpdAccepted} isSubmitting={isSubmitting} onSubmit={handleSubmitOrder} onAddAnother={() => setActiveTab('menu')} isCouscousMode={isCouscousMode} />;
      default: return null;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'menu':
        return (
          <div className="space-y-6">
            <div className="mb-8 px-2">
              <div className="flex justify-between mb-2">
                {['FORMULA', 'PRESETS', 'DRINKS', 'CHECKOUT'].map((s, i) => {
                  const stepsOrder: StepId[] = ['ORDER_TYPE', 'FORMULA', 'PRESETS', 'KIDS_MENU', 'EXTRAS', 'DRINKS', 'DESSERTS', 'CHECKOUT'];
                  const currentIndex = stepsOrder.indexOf(step);
                  const stepIndex = stepsOrder.indexOf(s as StepId);
                  const isActive = currentIndex >= stepIndex;
                  return (
                    <div key={s} className="flex flex-col items-center gap-1">
                      <div className={cn("w-2 h-2 rounded-full transition-all duration-500", isActive ? "bg-primary shadow-[0_0_10px_rgba(255,0,0,0.5)]" : "bg-gray-800")} />
                    </div>
                  );
                })}
              </div>
              <div className="h-[2px] w-full bg-gray-900 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (['ORDER_TYPE', 'FORMULA', 'PRESETS', 'EXTRAS', 'DRINKS', 'DESSERTS', 'CHECKOUT'].indexOf(step) / 6) * 100)}%` }} className="h-full bg-primary" />
              </div>
            </div>
            {renderStep()}
          </div>
        );
      case 'cart':
        return <CheckoutScreen orderInfo={orderInfo} setOrderInfo={setOrderInfo} cart={cart} currentConfig={currentConfig} calculateTotal={calculateTotal} rgpdAccepted={rgpdAccepted} setRgpdAccepted={setRgpdAccepted} isSubmitting={isSubmitting} onSubmit={handleSubmitOrder} onAddAnother={() => setActiveTab('menu')} isCouscousMode={isCouscousMode} />;
      default: return null;
    }
  };

  if (!isOpen) {
    return <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center text-white"><motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="premium-card p-10 border-red-500/50"><Clock className="text-red-500 mx-auto mb-6 animate-pulse" size={40} /><h2 className="text-3xl font-serif mb-4 uppercase tracking-widest italic">Fermé</h2><p className="text-gray-500 text-xs uppercase tracking-widest font-bold">Revenez nous voir bientôt !</p></motion.div></div>;
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background text-foreground overflow-hidden max-w-md mx-auto font-sans text-white">
      <AnimatePresence>{showConfetti && <Confetti />}</AnimatePresence>
      <AnimatePresence>{isProcessing && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mb-6 shadow-[0_0_20px_rgba(255,0,0,0.3)]" />
          <h3 className="text-xl font-serif italic text-white mb-2 italic">Sécurisation SumUp...</h3>
          <p className="text-gray-400 text-[10px] uppercase tracking-widest font-black leading-relaxed">Merci de ne pas fermer cette fenêtre.<br/>Nous validons votre acompte de sécurité.</p>
        </div>
      )}</AnimatePresence>
      <header className="shrink-0 py-6 px-6 text-center border-b border-gray-900/50 bg-background/80 backdrop-blur-md z-40 relative"><h1 className="text-2xl font-serif font-bold text-primary italic">La Grillade O&apos;Charbon</h1><div className="premium-gradient h-[1px] w-16 mx-auto my-1.5 opacity-50" /><p className="text-gray-500 text-[8px] uppercase tracking-[0.3em] font-bold">L&apos;excellence de la grillade</p></header>
      <main className="flex-1 overflow-y-auto overflow-x-hidden px-6 pt-6 pb-32 relative bg-background"><AnimatePresence mode="wait"><motion.div key={activeTab === 'menu' ? `${activeTab}-${step}` : activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="min-h-full">{renderTabContent()}</motion.div></AnimatePresence></main>
      
      {/* Persistent Navigation & Total Bar */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 bg-background/95 backdrop-blur-2xl border-t border-gray-900 p-3 pb-5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col gap-2.5">
          {/* Navigation Action Button (Suivant/Retour) - More Compact */}
          <div className="flex gap-2">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={handleBack} 
              className={cn(
                "flex-1 py-2.5 rounded-xl border border-white/10 bg-black font-black text-[8px] uppercase tracking-widest text-white transition-all", 
                step === 'ORDER_TYPE' ? "hidden" : ""
              )}
            >
              Retour
            </motion.button>
            
            {['EXTRAS', 'DRINKS', 'DESSERTS'].includes(step) && (
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => handleNext()} 
                className="flex-[2.5] bg-white text-black font-black py-2.5 rounded-xl uppercase text-[9px] tracking-widest shadow-xl flex items-center justify-center gap-2"
              >
                {step === 'DESSERTS' ? "VOIR LE RÉSUMÉ" : "CONTINUER"} <ChevronRight size={12} />
              </motion.button>
            )}
          </div>

          <div className="flex items-center justify-center">
            {/* Real-time Total Display - Compact Version */}
            <div className="flex items-baseline gap-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/5 relative">
              <span className="absolute -top-3 -right-2 text-[6px] text-gray-600 font-mono">v1.8</span>
              <p className="text-[7px] text-gray-500 font-black uppercase tracking-widest">Total :</p>
              <p className="text-sm font-black text-white tracking-tighter">{calculateTotal().toFixed(2)}€</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Agency Credit */}
      <div className="fixed bottom-1 left-0 right-0 text-center z-[60]">
        <a 
          href="https://www.search-digital.fr/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-[7px] text-white uppercase font-black tracking-[0.3em] hover:text-primary transition-colors cursor-pointer opacity-80"
        >
          Propulsé par <span className="underline decoration-primary/50 underline-offset-2">Search-Digital</span>
        </a>
      </div>
    </div>
  );
}

function StepContainer({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (<div className="flex-1"><div className="mb-6"><span className="text-[10px] text-primary font-black tracking-[0.2em] uppercase">{title}</span><h2 className="text-2xl font-serif mt-1 italic">{subtitle}</h2></div>{children}</div>);
}

function OptionCard({ option, isSelected, onClick, icon, hidePrice, surchargeValue }: { option: Option; isSelected: boolean; onClick: () => void; icon?: React.ReactNode; hidePrice?: boolean; surchargeValue?: number }) {
  const displayPrice = surchargeValue !== undefined ? surchargeValue : option.price;
  const shouldShowPrice = !hidePrice && (displayPrice !== 0);

  return (
    <motion.div 
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={cn(
        "premium-card p-5 transition-all duration-300 flex justify-between items-center group cursor-pointer border",
        isSelected ? "border-primary bg-primary/5 shadow-[0_0_25px_rgba(212,175,55,0.1)]" : "hover:border-primary/40 border-gray-800"
      )}
    >
      <div className="flex items-center gap-4">
        {icon && <div className={cn("text-gray-500 group-hover:text-primary transition-colors", isSelected && "text-primary")}>{React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: 20 }) : icon}</div>}
        <div>
          <p className={cn("font-black text-[11px] uppercase tracking-[0.1em]", isSelected ? "text-primary" : "text-gray-300")}>{option.name}</p>
          {option.description && <p className="text-[9px] text-white mt-0.5 leading-tight font-medium opacity-90">{option.description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {shouldShowPrice && (
          <span className="text-[10px] text-gray-500 font-mono font-bold">
            {displayPrice > 0 ? `+${displayPrice.toFixed(2)}€` : `${displayPrice.toFixed(2)}€`}
          </span>
        )}
        <div className={cn("w-5 h-5 rounded-full border border-primary flex items-center justify-center transition-all", isSelected ? "bg-primary text-background" : "bg-black/40 text-transparent")}>
          <Check size={10} strokeWidth={4} />
        </div>
      </div>
    </motion.div>
  );
}

function CategoryStep({ category, config, setConfig, onNext, type, limit, isSauceStep }: { category: Category; config: SandwichConfig; setConfig: React.Dispatch<React.SetStateAction<SandwichConfig>>; onNext: () => void; type: 'single' | 'multiple'; limit?: number; isSauceStep?: boolean }) {
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
    if (Array.isArray(val)) return (val as (Option | { option: Option; quantity: number })[]).some(i => 'id' in i ? i.id === id : i.option.id === id);
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
              hidePrice={isSauceStep && (isIncluded || isSelected(option.id) && currentList.indexOf(currentList.find(s => s.id === option.id)!) < 2)}
              surchargeValue={isSauceStep ? 0.50 : undefined}
            />
          );
        })}
      </div>
    </StepContainer>
  );
}

function SideSelector({ label, options, config, setConfig, type, quota }: { label: string; options: Option[]; config: SandwichConfig; setConfig: React.Dispatch<React.SetStateAction<SandwichConfig>>; type: 'drinks' | 'desserts', quota?: number }) {
  const current = config[type] || [];
  const getQty = (id: string) => current.find(i => i.option.id === id)?.quantity || 0;
  const update = (option: Option, delta: number) => {
    const existing = current.find(i => i.option.id === option.id);
    if (existing) {
      const newQty = Math.max(0, existing.quantity + delta);
      if (newQty === 0) setConfig({ ...config, [type]: current.filter(i => i.option.id !== option.id) });
      else setConfig({ ...config, [type]: current.map(i => i.option.id === option.id ? { ...i, quantity: newQty } : i) });
    } else if (delta > 0) { setConfig({ ...config, [type]: [...current, { option, quantity: 1 }] }); }
  };
  return (
    <div className="space-y-4">
      <h3 className="text-[10px] text-primary font-black uppercase tracking-widest pl-1">{label}</h3>
      <div className="grid grid-cols-1 gap-3">
        {options.map(opt => {
          const qty = getQty(opt.id);
          const isCan = !opt.name.includes('1.5L') && !opt.name.includes('2L');
          const isFreeUnitAvailable = type === 'drinks' && isCan && quota && quota > 0;
          return (
            <div key={opt.id} className="premium-card p-4 flex justify-between items-center bg-secondary/5 border border-gray-800">
              <div>
                <p className="font-black text-[10px] uppercase text-gray-300">{opt.name}</p>
                <p className="text-[9px] text-gray-600 font-mono">{isFreeUnitAvailable ? "1ère OFFERTE" : `${opt.price.toFixed(2)}€`}</p>
              </div>
              <div className="flex items-center gap-4 bg-black/60 p-1.5 rounded-xl border border-gray-800"><button onClick={() => update(opt, -1)} className="p-2 hover:text-primary transition-colors text-gray-500"><Minus size={14} /></button><span className="text-xs font-black w-4 text-center text-primary">{qty}</span><button onClick={() => update(opt, 1)} className="p-2 hover:text-primary transition-colors text-gray-500"><Plus size={14} /></button></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CheckoutScreen({ orderInfo, setOrderInfo, cart, currentConfig, calculateTotal, rgpdAccepted, setRgpdAccepted, isSubmitting, onSubmit, onAddAnother, isCouscousMode }: CheckoutScreenProps) {
  const allItems = [...cart, currentConfig];
  const total = calculateTotal();
  const depositRate = isCouscousMode ? 0.50 : 0.30;
  const depositAmount = total * depositRate;
  const balanceAmount = total - depositAmount;

  return (
    <StepContainer title="Résumé" subtitle="Finalisez votre commande">
      <div className="space-y-4 mb-8 mt-4 overflow-y-auto max-h-[50vh] pr-2 text-white">
        <div className="bg-primary/10 border border-primary/30 p-4 rounded-2xl mb-2"><div className="flex items-center gap-3 mb-2"><Shield className="text-primary" size={18} /><p className="text-[10px] font-black uppercase tracking-widest text-white">Paiement d&apos;acompte obligatoire</p></div><p className="text-[9px] text-gray-400 leading-relaxed">Pour valider votre commande et éviter les commandes fantômes, un acompte de <span className="text-primary font-bold">{isCouscousMode ? "50%" : "30%"}</span> est requis. Le reste sera à régler sur place lors du retrait.</p></div>
        <div className="bg-secondary/20 p-4 rounded-xl border border-gray-800 space-y-3 mb-6"><p className="text-[10px] text-primary font-black uppercase tracking-widest mb-2 flex justify-between items-center"><span>Votre Panier ({allItems.length})</span>{!isCouscousMode && <button onClick={onAddAnother} className="text-primary hover:underline text-[8px]">+ AJOUTER</button>}</p>{allItems.map((item, idx) => (<div key={idx} className="pb-2 border-b border-gray-800/50 last:border-0 last:pb-0">{item.formula && <p className="text-xs text-white font-bold">● {item.formula.name}</p>}{item.preset_sandwich && <p className="text-xs text-gray-300 ml-3 italic">→ {item.preset_sandwich.name}</p>}</div>))}</div>
        {isCouscousMode && <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl mb-4"><p className="text-[10px] text-amber-500 font-black uppercase tracking-widest text-center">🕒 Commande Couscous : Prête demain à la même heure</p></div>}
        <div className="bg-secondary/10 p-5 rounded-2xl border border-gray-800/50"><label className="text-[9px] text-primary uppercase font-black tracking-[0.2em] block mb-4 text-center">Paiement souhaité</label><div className="grid grid-cols-2 gap-2">{[{ id: 'card', name: 'CB', icon: <CreditCard size={14} /> }, { id: 'resto_card', name: 'Titre Resto', icon: <UtensilsCrossed size={14} /> }, { id: 'cash', name: 'Espèces', icon: <Wallet size={14} /> }].map(method => (<button key={method.id} onClick={() => setOrderInfo({...orderInfo, paymentMethod: method.id as any})} className={cn("py-3 rounded-xl border text-[10px] font-black transition-all flex items-center justify-center gap-2", orderInfo.paymentMethod === method.id ? "bg-primary text-background border-primary shadow-lg shadow-primary/20" : "border-gray-800 text-white hover:border-gray-600 bg-white/5")}>{method.icon} {method.name}</button>))}</div></div>
        {!isCouscousMode && <div className="bg-secondary/10 p-5 rounded-2xl border border-gray-800/50 shadow-inner"><label className="text-[9px] text-primary uppercase font-black tracking-[0.2em] block mb-4 text-center">Temps de retrait estimé</label><div className="grid grid-cols-3 gap-2">{["15 min", "30 min", "45 min"].map(time => (<button key={time} onClick={() => setOrderInfo({...orderInfo, pickupTime: time})} className={cn("py-2.5 rounded-xl border text-[10px] font-black transition-all", orderInfo.pickupTime === time ? "bg-primary text-background border-primary shadow-md shadow-primary/10" : "border-gray-800 text-white hover:border-gray-600 bg-white/5")}>{time}</button>))}</div></div>}
        <input type="text" value={orderInfo.name} onChange={(e) => setOrderInfo({...orderInfo, name: e.target.value})} placeholder="VOTRE NOM" className="w-full bg-secondary/20 border border-gray-800 p-4 rounded-2xl focus:border-primary outline-none transition-all text-[11px] font-black uppercase tracking-widest text-white placeholder:text-gray-500" /><input type="tel" value={orderInfo.phone} onChange={(e) => setOrderInfo({...orderInfo, phone: e.target.value})} placeholder="NUMÉRO DE TÉLÉPHONE" className="w-full bg-secondary/20 border border-gray-800 p-4 rounded-2xl focus:border-primary outline-none transition-all text-[11px] font-black uppercase tracking-widest text-white placeholder:text-gray-500" /><div className="flex gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10"><button onClick={() => setRgpdAccepted(!rgpdAccepted)} className={cn("w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0 shadow-sm", rgpdAccepted ? "bg-primary border-primary text-background" : "border-gray-700 hover:border-primary/50")}>{rgpdAccepted && <Check size={14} strokeWidth={4} />}</button><p className="text-[9px] text-gray-500 leading-normal font-medium">J&apos;autorise l&apos;utilisation de mon numéro pour la gestion de ma commande et mon programme VIP. <Link href="/legals" className="text-primary hover:underline font-black">LIRE LES MENTIONS</Link></p></div>
      </div>
      <div className="bg-secondary/30 rounded-3xl p-6 border border-gray-800/50 mb-12 shadow-2xl">
        <div className="space-y-3 mb-6"><div className="flex justify-between items-center text-gray-500 text-[10px] font-black uppercase tracking-widest"><span>Total Commande</span><span>{total.toFixed(2)}€</span></div><div className="flex justify-between items-center text-white text-xs font-black uppercase tracking-widest bg-white/5 p-3 rounded-xl border border-white/10"><span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary animate-pulse" />Acompte à payer ({isCouscousMode ? "50%" : "30%"})</span><span className="text-primary text-xl">{depositAmount.toFixed(2)}€</span></div><div className="flex justify-between items-center text-gray-600 text-[9px] font-bold uppercase tracking-widest px-1"><span>Reste à payer sur place</span><span>{balanceAmount.toFixed(2)}€</span></div></div>
        <button onClick={onSubmit} disabled={isSubmitting} className="w-full premium-gradient text-background font-black py-5 rounded-2xl shadow-xl shadow-primary/20 flex flex-col items-center justify-center gap-1 active:scale-95 disabled:opacity-50 tracking-[0.1em] uppercase">{isSubmitting ? (<div className="w-5 h-5 border-3 border-background border-t-transparent rounded-full animate-spin" />) : (<><div className="flex items-center gap-2 text-[11px]"><CreditCard size={18} strokeWidth={3} /> Payer l&apos;acompte ({depositAmount.toFixed(2)}€)</div><span className="text-[7px] opacity-70">Paiement sécurisé • Validation immédiate</span></>)}</button>
      </div>
    </StepContainer>
  );
}

function Confetti() {
  const [particles, setParticles] = useState<Array<{x: number; y: number; rotate: number; color: string}>>([]);
  useEffect(() => {
    const timer = setTimeout(() => {
      const newParticles = [...Array(60)].map(() => ({ x: (Math.random() - 0.5) * 1000, y: (Math.random() - 0.5) * 1000, rotate: Math.random() * 720, color: ["bg-primary", "bg-white", "bg-yellow-600", "bg-amber-200"][Math.floor(Math.random() * 4)] }));
      setParticles(newParticles);
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  return (<div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">{particles.map((p, i) => (<motion.div key={i} initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }} animate={{ opacity: 0, x: p.x, y: p.y, rotate: p.rotate, scale: 0 }} transition={{ duration: 3, ease: "easeOut" }} className={cn("absolute w-2 h-2 rounded-sm", p.color)} />))}</div>);
}
