"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SANDWICH_CATEGORIES, ORDER_TYPES, FORMULAS, CREATION_MODES } from "@/lib/data";
import { SandwichConfig, Option, Category, StepId } from "@/types";
import { ShoppingCart, Check, Plus, Minus, Clock, MapPin, Phone, Shield, GraduationCap, Baby, Star, CreditCard, Wallet, UtensilsCrossed } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import { PaymentMethod } from "@/types";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function SandwichBuilder() {
  const [isOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("truck_status") !== "closed";
    }
    return true;
  });

  const [step, setStep] = useState<StepId>('ORDER_TYPE');
  const [menu] = useState<Category[]>(() => {
    if (typeof window !== "undefined") {
      const savedMenu = localStorage.getItem("truck_menu");
      return savedMenu ? JSON.parse(savedMenu) : SANDWICH_CATEGORIES;
    }
    return SANDWICH_CATEGORIES;
  });

  const [cart, setCart] = useState<SandwichConfig[]>([]);
  const [currentConfig, setCurrentConfig] = useState<SandwichConfig>({
    sauces: [],
    extras: [],
    drinks: [],
    desserts: [],
  });

  const [orderInfo, setOrderInfo] = useState<{
    name: string;
    phone: string;
    type: "on_site" | "takeaway";
    pickupTime: string;
    paymentMethod: PaymentMethod;
  }>({ 
    name: "", 
    phone: "", 
    type: "takeaway",
    pickupTime: "15 min",
    paymentMethod: "card"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [rgpdAccepted, setRgpdAccepted] = useState(false);

  useEffect(() => {
    if (step === 'CHECKOUT' && orderInfo.phone) {
      const history = JSON.parse(localStorage.getItem(`loyalty_${orderInfo.phone}`) || "0");
      const timer = setTimeout(() => setLoyaltyPoints(history), 0);
      return () => clearTimeout(timer);
    }
  }, [step, orderInfo.phone]);

  const handleNext = () => {
    switch (step) {
      case 'ORDER_TYPE':
        setStep('FORMULA');
        break;
      case 'FORMULA':
        setStep('CREATION_MODE');
        break;
      case 'CREATION_MODE':
        if (currentConfig.creation_mode === 'signature') {
          setStep('PRESETS');
        } else {
          setStep('BUILD_BREAD');
        }
        break;
      case 'PRESETS':
        setStep('EXTRAS');
        break;
      case 'BUILD_BREAD':
        setStep('BUILD_MEAT');
        break;
      case 'BUILD_MEAT':
        setStep('BUILD_SAUCES');
        break;
      case 'BUILD_SAUCES':
        setStep('EXTRAS');
        break;
      case 'EXTRAS':
        if (currentConfig.formula?.id === 'sandwich_only') {
          goToCheckout();
        } else {
          setStep('SIDES');
        }
        break;
      case 'SIDES':
        goToCheckout();
        break;
      default:
        break;
    }
  };

  const goToCheckout = () => {
    // Add current config to cart if not already there (though we'll handle multi-add specifically)
    setStep('CHECKOUT');
  };

  const handleAddAnother = () => {
    setCart([...cart, currentConfig]);
    setCurrentConfig({
      sauces: [],
      extras: [],
      drinks: [],
      desserts: [],
    });
    setStep('FORMULA');
  };

  const handleBack = () => {
    switch (step) {
      case 'FORMULA': setStep('ORDER_TYPE'); break;
      case 'CREATION_MODE': setStep('FORMULA'); break;
      case 'PRESETS': setStep('CREATION_MODE'); break;
      case 'BUILD_BREAD': setStep('CREATION_MODE'); break;
      case 'BUILD_MEAT': setStep('BUILD_BREAD'); break;
      case 'BUILD_SAUCES': setStep('BUILD_MEAT'); break;
      case 'EXTRAS': 
        if (currentConfig.creation_mode === 'signature') setStep('PRESETS');
        else setStep('BUILD_SAUCES');
        break;
      case 'SIDES': setStep('EXTRAS'); break;
      case 'CHECKOUT': 
        if (currentConfig.formula?.id === 'sandwich_only') setStep('EXTRAS');
        else setStep('SIDES');
        break;
      default: break;
    }
  };

  const calculateItemTotal = (config: SandwichConfig) => {
    let total = config.formula?.price || 0;
    
    if (config.creation_mode === 'custom') {
      if (config.bread) total += config.bread.price;
      if (config.meat) total += config.meat.price;
    } else if (config.preset_sandwich) {
      total = Math.max(total, config.preset_sandwich.price);
      if (config.formula?.id === 'menu_standard') total += 5;
      if (config.formula?.id === 'menu_student') total += 3;
    }

    const saucesCount = config.sauces.length;
    const extraSauces = Math.max(0, saucesCount - 2);
    total += extraSauces * 0.5;
    
    total += config.extras.reduce((acc, e) => acc + e.price, 0);
    
    total += (config.drinks || []).reduce((acc, d) => acc + (d.option.price * d.quantity), 0);
    total += (config.desserts || []).reduce((acc, d) => acc + (d.option.price * d.quantity), 0);
    
    return total;
  };

  const calculateTotal = () => {
    const cartTotal = cart.reduce((acc, item) => acc + calculateItemTotal(item), 0);
    const currentTotal = calculateItemTotal(currentConfig);
    const total = cartTotal + currentTotal;
    
    if (loyaltyPoints >= 9) return 0;
    return total;
  };

  const handleSubmitOrder = async () => {
    if (!orderInfo.name || !orderInfo.phone) {
      alert("Veuillez remplir vos informations");
      return;
    }
    if (!rgpdAccepted) {
      alert("Veuillez accepter la politique de protection des données (RGPD).");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      const newPoints = loyaltyPoints >= 9 ? 0 : loyaltyPoints + 1;
      localStorage.setItem(`loyalty_${orderInfo.phone}`, JSON.stringify(newPoints));
      setShowConfetti(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setStep('ORDER_TYPE');
        setCart([]);
        setCurrentConfig({ sauces: [], extras: [], drinks: [], desserts: [] });
        setShowConfetti(false);
        alert("Commande validée ! Merci !");
      }, 2000);
    }, 1500);
  };

  if (!isOpen) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center text-white">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="premium-card p-10 border-red-500/50">
          <Clock className="text-red-500 mx-auto mb-6 animate-pulse" size={40} />
          <h2 className="text-3xl font-serif mb-4 uppercase tracking-widest italic">Fermé</h2>
          <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">Revenez nous voir bientôt !</p>
          <a href="tel:+33600000000" className="mt-8 flex items-center justify-center gap-2 text-primary hover:scale-105 transition-all uppercase text-[10px] font-black tracking-widest border border-primary/20 px-6 py-3 rounded-full">
            <Phone size={14} /> Nous appeler
          </a>
        </motion.div>
      </div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 'ORDER_TYPE':
        return (
          <StepContainer title="Bienvenue" subtitle="Sur place ou à emporter ?">
            <div className="grid grid-cols-1 gap-4">
              {ORDER_TYPES.map(type => (
                <OptionCard 
                  key={type.id} 
                  option={type} 
                  isSelected={orderInfo.type === type.id} 
                  onClick={() => { setOrderInfo({...orderInfo, type: type.id as "on_site" | "takeaway"}); handleNext(); }}
                  icon={type.id === 'takeaway' ? <ShoppingCart /> : <MapPin />}
                />
              ))}
            </div>
          </StepContainer>
        );
      case 'FORMULA':
        return (
          <StepContainer title="Formule" subtitle="Choisissez votre plaisir">
            <div className="grid grid-cols-1 gap-3">
              {FORMULAS.map(formula => (
                <div key={formula.id} className="space-y-2">
                  <OptionCard 
                    option={formula} 
                    isSelected={currentConfig.formula?.id === formula.id} 
                    onClick={() => { setCurrentConfig({...currentConfig, formula}); handleNext(); }}
                    icon={formula.id === 'menu_student' ? <GraduationCap /> : formula.id === 'menu_kids' ? <Baby /> : <Star />}
                  />
                  {formula.id === 'menu_student' && (
                    <p className="text-[10px] text-amber-500 font-bold px-4 italic animate-pulse">
                      * Une carte étudiante valide vous sera demandée au comptoir.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </StepContainer>
        );
      case 'CREATION_MODE':
        return (
          <StepContainer title="Votre Sandwich" subtitle="Comment le voulez-vous ?">
            <div className="grid grid-cols-1 gap-4">
              {CREATION_MODES.map(mode => (
                <OptionCard 
                  key={mode.id} 
                  option={mode} 
                  isSelected={currentConfig.creation_mode === mode.id} 
                  onClick={() => { setCurrentConfig({...currentConfig, creation_mode: mode.id as "signature" | "custom"}); handleNext(); }}
                />
              ))}
            </div>
          </StepContainer>
        );
      case 'PRESETS':
        return (
          <StepContainer title="Nos Créations" subtitle="Recettes signatures du Chef">
            <div className="grid grid-cols-1 gap-3">
              {menu.find(c => c.id === 'presets')?.options.map(preset => (
                <OptionCard 
                  key={preset.id} 
                  option={preset} 
                  isSelected={currentConfig.preset_sandwich?.id === preset.id} 
                  onClick={() => { setCurrentConfig({...currentConfig, preset_sandwich: preset, bread: undefined, meat: undefined}); handleNext(); }}
                />
              ))}
            </div>
          </StepContainer>
        );
      case 'BUILD_BREAD':
        return <CategoryStep category={menu.find(c => c.id === 'bread')!} config={currentConfig} setConfig={setCurrentConfig} onNext={handleNext} type="single" />;
      case 'BUILD_MEAT':
        return <CategoryStep category={menu.find(c => c.id === 'meat')!} config={currentConfig} setConfig={setCurrentConfig} onNext={handleNext} type="single" />;
      case 'BUILD_SAUCES':
        return <CategoryStep category={menu.find(c => c.id === 'sauces')!} config={currentConfig} setConfig={setCurrentConfig} onNext={handleNext} type="multiple" />;
      case 'EXTRAS':
        return <CategoryStep category={menu.find(c => c.id === 'extras')!} config={currentConfig} setConfig={setCurrentConfig} onNext={handleNext} type="multiple" />;
      case 'SIDES':
        return (
          <StepContainer title="Accompagnements" subtitle="Boissons & Desserts">
            <div className="space-y-8">
              <SideSelector label="Boissons" options={menu.find(c => c.id === 'drinks')!.options} config={currentConfig} setConfig={setCurrentConfig} type="drinks" />
              <SideSelector label="Desserts" options={menu.find(c => c.id === 'desserts')!.options} config={currentConfig} setConfig={setCurrentConfig} type="desserts" />
              
              <button 
                onClick={handleAddAnother}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-primary/30 text-primary font-black text-[10px] uppercase tracking-widest hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Ajouter un autre menu
              </button>
            </div>
          </StepContainer>
        );
      case 'CHECKOUT':
        return <CheckoutScreen 
          orderInfo={orderInfo} 
          setOrderInfo={setOrderInfo} 
          cart={cart}
          currentConfig={currentConfig}
          calculateTotal={calculateTotal} 
          rgpdAccepted={rgpdAccepted} 
          setRgpdAccepted={setRgpdAccepted} 
          isSubmitting={isSubmitting} 
          onSubmit={handleSubmitOrder}
          onAddAnother={handleAddAnother}
        />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col p-6 bg-background text-foreground pb-40 relative overflow-hidden">
      <AnimatePresence>{showConfetti && <Confetti />}</AnimatePresence>
      
      <header className="mb-8 pt-4 text-center">
        <h1 className="text-3xl font-serif font-bold text-primary mb-2 italic">Gourmet Truck</h1>
        <div className="premium-gradient h-[1px] w-24 mx-auto mb-2 opacity-50" />
        <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] font-bold">L&apos;art du sandwich premium</p>
      </header>

      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1">
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/95 backdrop-blur-2xl border-t border-gray-900 max-w-md mx-auto flex flex-col gap-4 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="flex gap-4">
            <button onClick={handleBack} className={cn("flex-1 py-4 rounded-2xl border border-gray-800 font-black text-[10px] uppercase tracking-widest text-gray-600 hover:text-white transition-all", step === 'ORDER_TYPE' ? "opacity-0 pointer-events-none" : "")}>Retour</button>
            <button 
              onClick={handleNext} 
              disabled={
                (step === 'BUILD_BREAD' && !currentConfig.bread) || 
                (step === 'BUILD_MEAT' && !currentConfig.meat) || 
                (step === 'PRESETS' && !currentConfig.preset_sandwich) ||
                (step === 'CHECKOUT')
              }
              className={cn("flex-[2.5] premium-gradient text-background font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all", step === 'CHECKOUT' ? "hidden" : "")}
            >
              {step === 'SIDES' ? "VOIR LE RÉSUMÉ" : "SUIVANT"}
            </button>
          </div>
          <div className="flex justify-center items-center gap-8 pt-3 border-t border-gray-800/30">
            <a href="tel:+33600000000" className="text-primary flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] hover:scale-110 transition-all active:opacity-50"><Phone size={12} fill="currentColor" /> Appeler</a>
            <Link href="/legals" className="text-gray-700 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] hover:text-white transition-all"><Shield size={12} /> Légal</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepContainer({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex-1">
      <div className="mb-6">
        <span className="text-[10px] text-primary font-black tracking-[0.2em] uppercase">{title}</span>
        <h2 className="text-2xl font-serif mt-1 italic">{subtitle}</h2>
      </div>
      {children}
    </div>
  );
}

function OptionCard({ option, isSelected, onClick, icon }: { option: Option; isSelected: boolean; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <div 
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
          {option.description && <p className="text-[9px] text-gray-600 mt-0.5 leading-tight">{option.description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {option.price > 0 && <span className="text-[10px] text-gray-500 font-mono font-bold">+{option.price.toFixed(2)}€</span>}
        <div className={cn("w-5 h-5 rounded-full border border-primary flex items-center justify-center transition-all", isSelected ? "bg-primary text-background" : "bg-black/40 text-transparent")}>
          <Check size={10} strokeWidth={4} />
        </div>
      </div>
    </div>
  );
}

function CategoryStep({ category, config, setConfig, onNext, type, limit }: { category: Category; config: SandwichConfig; setConfig: React.Dispatch<React.SetStateAction<SandwichConfig>>; onNext: () => void; type: 'single' | 'multiple'; limit?: number }) {
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
    if (Array.isArray(val)) {
      return (val as (Option | { option: Option; quantity: number })[]).some(i => 
        'id' in i ? i.id === id : i.option.id === id
      );
    }
    return (val as Option)?.id === id;
  };

  return (
    <StepContainer title="Sélection" subtitle={category.name}>
      <div className="grid grid-cols-1 gap-3">
        {category.options.map(option => (
          <OptionCard key={option.id} option={option} isSelected={isSelected(option.id)} onClick={() => handleToggle(option)} />
        ))}
      </div>
    </StepContainer>
  );
}

function SideSelector({ label, options, config, setConfig, type }: { label: string; options: Option[]; config: SandwichConfig; setConfig: React.Dispatch<React.SetStateAction<SandwichConfig>>; type: 'drinks' | 'desserts' }) {
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
      <h3 className="text-[10px] text-primary font-black uppercase tracking-widest pl-1">{label}</h3>
      <div className="grid grid-cols-1 gap-3">
        {options.map(opt => (
          <div key={opt.id} className="premium-card p-4 flex justify-between items-center bg-secondary/5 border border-gray-800">
            <div>
              <p className="font-black text-[10px] uppercase text-gray-300">{opt.name}</p>
              <p className="text-[9px] text-gray-600 font-mono">{opt.price.toFixed(2)}€</p>
            </div>
            <div className="flex items-center gap-4 bg-black/60 p-1.5 rounded-xl border border-gray-800">
              <button onClick={() => update(opt, -1)} className="p-2 hover:text-primary transition-colors text-gray-500"><Minus size={14} /></button>
              <span className="text-xs font-black w-4 text-center text-primary">{getQty(opt.id)}</span>
              <button onClick={() => update(opt, 1)} className="p-2 hover:text-primary transition-colors text-gray-500"><Plus size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
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
}

function CheckoutScreen({ orderInfo, setOrderInfo, cart, currentConfig, calculateTotal, rgpdAccepted, setRgpdAccepted, isSubmitting, onSubmit, onAddAnother }: CheckoutScreenProps) {
  const allItems = [...cart, currentConfig];
  
  return (
    <StepContainer title="Résumé" subtitle="Finalisez votre commande">
      <div className="space-y-4 mb-8 mt-4 overflow-y-auto max-h-[50vh] pr-2">
        <div className="bg-secondary/20 p-4 rounded-xl border border-gray-800 space-y-3 mb-6">
          <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-2 flex justify-between items-center">
            <span>Votre Panier ({allItems.length})</span>
            <button onClick={onAddAnother} className="text-primary hover:underline text-[8px]">+ AJOUTER</button>
          </p>
          {allItems.map((item, idx) => (
            <div key={idx} className="pb-2 border-b border-gray-800/50 last:border-0 last:pb-0">
              {item.formula && <p className="text-xs text-white font-bold">● {item.formula.name}</p>}
              {item.preset_sandwich && <p className="text-xs text-gray-300 ml-3 italic">→ {item.preset_sandwich.name}</p>}
              {item.bread && <p className="text-xs text-gray-300 ml-3 italic">→ Pain: {item.bread.name}</p>}
              {item.meat && <p className="text-xs text-gray-300 ml-3 italic">→ Viande: {item.meat.name}</p>}
            </div>
          ))}
        </div>
        
        <div className="bg-secondary/10 p-5 rounded-2xl border border-gray-800/50">
          <label className="text-[9px] text-primary uppercase font-black tracking-[0.2em] block mb-4 text-center">Paiement souhaité</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'card', name: 'CB', icon: <CreditCard size={14} /> },
              { id: 'resto_card', name: 'Titre Resto', icon: <UtensilsCrossed size={14} /> },
              { id: 'cash', name: 'Espèces', icon: <Wallet size={14} /> },
              { id: 'online', name: 'En Ligne', icon: <Star size={14} /> }
            ].map(method => (
              <button 
                key={method.id} 
                onClick={() => setOrderInfo({...orderInfo, paymentMethod: method.id as PaymentMethod})} 
                className={cn(
                  "py-3 rounded-xl border text-[10px] font-black transition-all flex items-center justify-center gap-2", 
                  orderInfo.paymentMethod === method.id ? "bg-primary text-background border-primary" : "border-gray-800 text-gray-600"
                )}
              >
                {method.icon} {method.name}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-secondary/10 p-5 rounded-2xl border border-gray-800/50 shadow-inner">
          <label className="text-[9px] text-primary uppercase font-black tracking-[0.2em] block mb-4 text-center">Temps de retrait estimé</label>
          <div className="grid grid-cols-3 gap-2">
            {["15 min", "30 min", "45 min"].map(time => (
              <button key={time} onClick={() => setOrderInfo({...orderInfo, pickupTime: time})} className={cn("py-2.5 rounded-xl border text-[10px] font-black transition-all", orderInfo.pickupTime === time ? "bg-primary text-background border-primary shadow-md shadow-primary/10" : "border-gray-800 text-gray-600")}>{time}</button>
            ))}
          </div>
        </div>

        <input type="text" value={orderInfo.name} onChange={(e) => setOrderInfo({...orderInfo, name: e.target.value})} placeholder="VOTRE NOM" className="w-full bg-secondary/20 border border-gray-800 p-4 rounded-2xl focus:border-primary outline-none transition-all text-[11px] font-black uppercase tracking-widest text-white placeholder:text-gray-700" />
        <input type="tel" value={orderInfo.phone} onChange={(e) => setOrderInfo({...orderInfo, phone: e.target.value})} placeholder="NUMÉRO DE TÉLÉPHONE" className="w-full bg-secondary/20 border border-gray-800 p-4 rounded-2xl focus:border-primary outline-none transition-all text-[11px] font-black uppercase tracking-widest text-white placeholder:text-gray-700" />
        
        <div className="flex gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
          <button onClick={() => setRgpdAccepted(!rgpdAccepted)} className={cn("w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0 shadow-sm", rgpdAccepted ? "bg-primary border-primary text-background" : "border-gray-700 hover:border-primary/50")}>
            {rgpdAccepted && <Check size={14} strokeWidth={4} />}
          </button>
          <p className="text-[9px] text-gray-500 leading-normal font-medium">J&apos;autorise l&apos;utilisation de mon numéro pour la gestion de ma commande et mon programme VIP. <Link href="/legals" className="text-primary hover:underline font-black">LIRE LES MENTIONS</Link></p>
        </div>
      </div>

      <div className="bg-secondary/30 rounded-3xl p-6 border border-gray-800/50 mb-12 shadow-2xl">
        <div className="flex justify-between items-center border-b border-gray-800 pb-5 mb-5">
          <span className="text-xl font-serif text-white italic">Total ({allItems.length})</span>
          <span className="text-3xl font-black text-primary tracking-tighter">{calculateTotal().toFixed(2)}€</span>
        </div>
        <button onClick={onSubmit} disabled={isSubmitting} className="w-full premium-gradient text-background font-black py-5 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 tracking-[0.2em] uppercase text-[11px]">
          {isSubmitting ? <div className="w-5 h-5 border-3 border-background border-t-transparent rounded-full animate-spin" /> : <><Check size={20} strokeWidth={3} /> Confirmer la commande</>}
        </button>
      </div>
    </StepContainer>
  );
}

function Confetti() {
  const [particles, setParticles] = useState<Array<{x: number; y: number; rotate: number; color: string}>>([]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      const newParticles = [...Array(60)].map(() => ({
        x: (Math.random() - 0.5) * 1000,
        y: (Math.random() - 0.5) * 1000,
        rotate: Math.random() * 720,
        color: ["bg-primary", "bg-white", "bg-yellow-600", "bg-amber-200"][Math.floor(Math.random() * 4)]
      }));
      setParticles(newParticles);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">
      {particles.map((p, i) => (
        <motion.div key={i} initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }} animate={{ opacity: 0, x: p.x, y: p.y, rotate: p.rotate, scale: 0 }} transition={{ duration: 3, ease: "easeOut" }} className={cn("absolute w-2 h-2 rounded-sm", p.color)} />
      ))}
    </div>
  );
}
