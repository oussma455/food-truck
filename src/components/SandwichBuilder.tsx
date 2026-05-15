"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ORDER_TYPES, FORMULAS } from "@/lib/data";
import { StepId } from "@/types";
import { 
  ShoppingCart, MapPin, Utensils, CupSoda, 
  ChevronRight, Clock, Plus, Star 
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { useSandwichBuilder } from "@/hooks/useSandwichBuilder";
import StepContainer from "./builder/StepContainer";
import OptionCard from "./builder/OptionCard";
import CheckoutScreen from "./builder/CheckoutScreen";
import { CategoryStep, SideSelector } from "./builder/Selections";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function SandwichBuilder() {
  const b = useSandwichBuilder();

  if (!b.isOpen) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center text-white">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="premium-card p-12 border-primary/20 max-w-sm">
          <Clock className="text-primary mx-auto mb-6 animate-pulse" size={48} />
          <h2 className="text-4xl font-serif mb-4 uppercase tracking-widest italic text-gold-gradient">Fermé</h2>
          <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] font-black leading-relaxed">
            Notre grillade se repose.<br/>Revenez nous voir très bientôt !
          </p>
        </motion.div>
      </div>
    );
  }

  const renderStep = () => {
    switch (b.step) {
      case 'ORDER_TYPE':
        return (
          <StepContainer title="Bienvenue" subtitle="Sur place ou à emporter ?">
            <div className="grid grid-cols-1 gap-4">
              {ORDER_TYPES.map(type => (
                <OptionCard 
                  key={type.id} 
                  option={type} 
                  isSelected={b.orderInfo.type === type.id} 
                  onClick={() => { b.setOrderInfo({...b.orderInfo, type: type.id as any}); b.handleNext('ORDER_TYPE'); }} 
                  icon={type.id === 'takeaway' ? <ShoppingCart /> : <MapPin />} 
                  hidePrice={true} 
                />
              ))}
              <div className="relative py-8 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                <span className="relative bg-background px-6 text-gray-700 text-[9px] uppercase tracking-[0.4em] font-black">Spécialité</span>
              </div>
              <motion.button 
                whileHover={{ scale: 1.01, borderColor: "rgba(255, 184, 0, 0.4)" }} 
                whileTap={{ scale: 0.98 }} 
                onClick={() => { b.setStep('COUSCOUS'); }} 
                className="w-full bg-white p-6 rounded-3xl flex items-center justify-between gap-4 border border-white group relative overflow-hidden shadow-2xl shadow-white/5"
              >
                <div className="flex items-center gap-5">
                  <div className="bg-primary p-3 rounded-2xl text-black group-hover:rotate-12 transition-transform duration-500 shadow-lg"><Utensils size={24} /></div>
                  <div className="text-left">
                    <span className="text-primary font-black uppercase tracking-widest text-xs block">Réserver un Couscous</span>
                    <span className="text-gray-900/60 text-[9px] uppercase font-bold tracking-widest">Traditionnel • 24h à l&apos;avance</span>
                  </div>
                </div>
                <Plus size={18} className="text-primary" />
              </motion.button>
            </div>
          </StepContainer>
        );
      case 'COUSCOUS':
        return (
          <StepContainer title="Couscous Maison" subtitle="Taille de la tablée">
            <div className="grid grid-cols-1 gap-3">
              {b.getAvailableOptions('couscous_size').map(size => (
                <OptionCard key={size.id} option={size} isSelected={b.currentConfig.formula?.id === size.id} onClick={() => { b.setCurrentConfig({...b.currentConfig, formula: size}); setTimeout(() => b.handleNext('COUSCOUS'), 300); }} />
              ))}
            </div>
          </StepContainer>
        );
      case 'COUSCOUS_MEAT':
        return (
          <StepContainer title="Couscous Maison" subtitle="Choisissez l'accompagnement">
            <div className="grid grid-cols-1 gap-3">
              {b.getAvailableOptions('couscous_type').map(type => (
                <OptionCard key={type.id} option={type} isSelected={b.currentConfig.preset_sandwich?.id === type.id} onClick={() => { b.setCurrentConfig({...b.currentConfig, preset_sandwich: type}); setTimeout(() => b.handleNext('COUSCOUS_MEAT'), 300); }} />
              ))}
            </div>
          </StepContainer>
        );
      case 'FORMULA':
        return (
          <StepContainer title="Formule" subtitle="Choisissez votre plaisir">
            <div className="grid grid-cols-1 gap-3">
              {FORMULAS.map(f => (
                <OptionCard key={f.id} option={f} isSelected={b.currentConfig.formula?.id === f.id} onClick={() => { b.setCurrentConfig({...b.currentConfig, formula: f}); setTimeout(() => b.handleNext('FORMULA', f.id), 300); }} />
              ))}
            </div>
          </StepContainer>
        );
      case 'PRESETS':
        return (
          <StepContainer title="Sandwich / Burger" subtitle="Choisissez votre grillade">
            <div className="space-y-6">
              <div className="bg-primary/5 border border-primary/20 p-5 rounded-[2rem] flex items-center gap-4">
                <div className="bg-primary/10 p-2 rounded-xl text-primary"><Star size={18} fill="currentColor" /></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white leading-relaxed">Frites & Crudités incluses <span className="opacity-40 font-medium">(Sauf Sandwich Seul)</span></p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {b.getAvailableOptions('presets').map(p => {
                  const surchargeVal = Math.max(0, p.price - 12);
                  return (
                    <OptionCard 
                      key={p.id} 
                      option={p} 
                      isSelected={b.currentConfig.preset_sandwich?.id === p.id} 
                      onClick={() => { b.setCurrentConfig({...b.currentConfig, preset_sandwich: p}); setTimeout(() => b.handleNext('PRESETS'), 300); }} 
                      surchargeValue={surchargeVal} 
                      hidePrice={surchargeVal === 0} 
                    />
                  );
                })}
              </div>
            </div>
          </StepContainer>
        );
      case 'KIDS_MENU':
        return (
          <StepContainer title="Menu Enfant" subtitle="Son petit régal">
            <div className="grid grid-cols-1 gap-3">
              {b.getAvailableOptions('kids_menu').map(k => (
                <OptionCard key={k.id} option={k} isSelected={b.currentConfig.preset_sandwich?.id === k.id} onClick={() => { b.setCurrentConfig({...b.currentConfig, preset_sandwich: k}); setTimeout(() => b.handleNext('KIDS_MENU'), 300); }} hidePrice={true} />
              ))}
            </div>
          </StepContainer>
        );
      case 'MEATS':
        const meatsCat = b.menu.find(c => c.id === 'meats');
        if (!meatsCat) return null;
        return (
          <StepContainer title="Mix Grill" subtitle="Choisissez 2 ou 3 viandes">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-3">
                {b.getAvailableOptions('meats').map(opt => {
                  const currentMeats = b.currentConfig.meats || [];
                  const isSel = currentMeats.some(m => m.id === opt.id);
                  return (
                    <OptionCard 
                      key={opt.id} 
                      option={opt} 
                      isSelected={isSel} 
                      onClick={() => {
                        if (isSel) {
                          b.setCurrentConfig({...b.currentConfig, meats: currentMeats.filter(m => m.id !== opt.id)});
                        } else {
                          if (currentMeats.length >= 3) return;
                          b.setCurrentConfig({...b.currentConfig, meats: [...currentMeats, opt]});
                        }
                      }}
                      hidePrice={true}
                    />
                  );
                })}
              </div>
              <motion.button 
                whileTap={{ scale: 0.98 }}
                disabled={(b.currentConfig.meats || []).length < 2}
                onClick={() => b.handleNext('MEATS')}
                className="w-full py-5 bg-primary text-black font-black rounded-3xl uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-primary/20 disabled:opacity-20 transition-all mt-4"
              >
                Valider le mélange ({(b.currentConfig.meats || []).length}/3)
              </motion.button>
            </div>
          </StepContainer>
        );
      case 'STEAKS':
        const steaksCat = b.menu.find(c => c.id === 'steaks_qty');
        if (!steaksCat) return null;
        return (
          <StepContainer title="Hamburger" subtitle="Nombre de steaks">
            <div className="grid grid-cols-1 gap-3">
              {b.getAvailableOptions('steaks_qty').map(s => (
                <OptionCard 
                  key={s.id} 
                  option={s} 
                  isSelected={b.currentConfig.steaks_qty?.id === s.id} 
                  onClick={() => { b.setCurrentConfig({...b.currentConfig, steaks_qty: s}); setTimeout(() => b.handleNext('STEAKS'), 300); }} 
                />
              ))}
            </div>
          </StepContainer>
        );
      case 'SAUCES':
        const saucesCat = b.menu.find(c => c.id === 'sauces');
        if (!saucesCat) return null;
        return <CategoryStep category={{...saucesCat, options: b.getAvailableOptions('sauces')}} config={b.currentConfig} setConfig={b.setCurrentConfig} onNext={() => b.handleNext('SAUCES')} type="multiple" limit={3} isSauceStep={true} />;
      case 'EXTRAS':
        const extrasCat = b.menu.find(c => c.id === 'extras');
        if (!extrasCat) return null;
        return <CategoryStep category={{...extrasCat, options: b.getAvailableOptions('extras')}} config={b.currentConfig} setConfig={b.setCurrentConfig} onNext={() => b.handleNext('EXTRAS')} type="multiple" />;
      case 'DRINKS':
        const fId = b.currentConfig.formula?.id || '';
        const isC = fId.startsWith('COUSCOUS_');
        let q = ['menu_standard', 'menu_student', 'menu_kids'].includes(fId) ? 1 : 0;
        if (isC) q = fId === 'COUSCOUS_S1' ? 2 : fId === 'COUSCOUS_S2' ? 3 : 4;
        
        const availableDrinks = b.getAvailableOptions('drinks');
        const cans = availableDrinks.filter(d => !d.name.includes('1.5L') && !d.name.includes('2L'));
        const bottles = availableDrinks.filter(d => d.name.includes('1.5L') || d.name.includes('2L'));
        return (
          <StepContainer title="Boissons" subtitle="Rafraîchissement">
            <div className="space-y-10">
              {q > 0 && (
                <div className="bg-primary/10 border border-primary/20 p-5 rounded-[2rem] flex items-center gap-4 animate-pulse">
                  <CupSoda className="text-primary" size={20} />
                  <p className="text-[11px] font-black uppercase tracking-widest text-primary">{q} Boisson(s) incluse(s) !</p>
                </div>
              )}
              <SideSelector label="Format Standard" options={cans} config={b.currentConfig} setConfig={b.setCurrentConfig} type="drinks" quota={q} />
              {bottles.length > 0 && <SideSelector label="Grands Formats (1.5L+)" options={bottles} config={b.currentConfig} setConfig={b.setCurrentConfig} type="drinks" />}
            </div>
          </StepContainer>
        );
      case 'DESSERTS':
        return (
          <StepContainer title="Desserts" subtitle="Une touche sucrée ?">
            <SideSelector label="Notre Sélection" options={b.getAvailableOptions('desserts')} config={b.currentConfig} setConfig={b.setCurrentConfig} type="desserts" />
          </StepContainer>
        );
      case 'CHECKOUT':
        return <CheckoutScreen orderInfo={b.orderInfo} setOrderInfo={b.setOrderInfo} cart={b.cart} currentConfig={b.currentConfig} calculateTotal={b.calculateTotal} rgpdAccepted={b.rgpdAccepted} setRgpdAccepted={b.setRgpdAccepted} isSubmitting={b.isSubmitting} onSubmit={b.handleSubmitOrder} onAddAnother={() => b.setActiveTab('menu')} isCouscousMode={b.isCouscousMode} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground max-w-md mx-auto font-sans text-white border-x border-white/5 relative">
      <AnimatePresence>{b.showConfetti && <Confetti />}</AnimatePresence>
      <AnimatePresence>{b.isProcessing && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center">
          <motion.div animate={{ rotate: 360, borderColor: ["#FFB800", "#ffffff"] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mb-8 shadow-[0_0_30px_rgba(255,184,0,0.2)]" />
          <h3 className="text-3xl font-serif italic text-white mb-4 italic text-gold-gradient">SumUp Gateway</h3>
          <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] font-black leading-relaxed">Validation de l&apos;acompte sécurisé.<br/>Merci de patienter...</p>
        </div>
      )}</AnimatePresence>

      <header className="shrink-0 py-4 px-6 text-center bg-background/80 backdrop-blur-md z-40 relative border-b border-white/5">
        <h1 className="text-2xl font-serif font-black text-primary italic tracking-tight text-fire-gradient leading-none">GRILLADE O&apos;CHARBON</h1>
        <p className="text-gray-600 text-[8px] uppercase tracking-[0.3em] font-black mt-1">L&apos;art de la flamme</p>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar px-6 pt-6 pb-32 relative bg-background">
        <AnimatePresence mode="wait">
          <motion.div 
            key={`${b.activeTab}-${b.step}`} 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -15 }} 
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="min-h-full"
          >
            {b.activeTab === 'menu' ? (
              <div className="space-y-6">
                {/* Visual Step Indicator */}
                <div className="flex justify-between items-center px-1 mb-2">
                   {['FORMULA', 'PRESETS', 'DRINKS', 'CHECKOUT'].map((s) => {
                     const stepsOrder: StepId[] = ['ORDER_TYPE', 'FORMULA', 'PRESETS', 'KIDS_MENU', 'EXTRAS', 'DRINKS', 'DESSERTS', 'CHECKOUT'];
                     const isActive = stepsOrder.indexOf(b.step) >= stepsOrder.indexOf(s as StepId);
                     return (
                       <div key={s} className={cn("w-1.5 h-1.5 rounded-full transition-all duration-700", isActive ? "bg-primary shadow-[0_0_10px_rgba(255,184,0,0.8)] scale-125" : "bg-white/10")} />
                     );
                   })}
                </div>
                {renderStep()}
              </div>
            ) : (
              <CheckoutScreen orderInfo={b.orderInfo} setOrderInfo={b.setOrderInfo} cart={b.cart} currentConfig={b.currentConfig} calculateTotal={b.calculateTotal} rgpdAccepted={b.rgpdAccepted} setRgpdAccepted={b.setRgpdAccepted} isSubmitting={b.isSubmitting} onSubmit={b.handleSubmitOrder} onAddAnother={() => b.setActiveTab('menu')} isCouscousMode={b.isCouscousMode} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Premium Navigation & Total Bar */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 bg-background/95 backdrop-blur-2xl border-t border-white/5 p-5 pb-8 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
        <div className="flex flex-col gap-4">
          <div className="flex gap-3">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={b.handleBack} 
              className={cn(
                "flex-1 py-4 rounded-2xl border border-white/10 bg-secondary/50 font-black text-[9px] uppercase tracking-[0.2em] text-gray-400 transition-all", 
                b.step === 'ORDER_TYPE' ? "hidden" : ""
              )}
            >
              Retour
            </motion.button>
            
            {['SAUCES', 'EXTRAS', 'DRINKS', 'DESSERTS'].includes(b.step) && (
              <motion.button 
                whileTap={{ scale: 0.98, y: -1 }}
                onClick={() => b.handleNext()} 
                className="flex-[2.5] bg-white text-black font-black py-4 rounded-2xl uppercase text-[10px] tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3"
              >
                {b.step === 'DESSERTS' ? "VOIR LE RÉSUMÉ" : "CONTINUER"} <ChevronRight size={16} strokeWidth={3} />
              </motion.button>
            )}
          </div>

          <div className="flex items-center justify-center">
            <div className="flex items-center gap-4 bg-white/[0.03] px-6 py-2.5 rounded-full border border-white/5 relative group">
              <p className="text-[8px] text-gray-500 font-black uppercase tracking-[0.3em]">Total estimé</p>
              <p className="text-xl font-black text-white font-mono tracking-tighter">{b.calculateTotal().toFixed(2)}€</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Search Digital Signature & Version */}
      <div className="fixed bottom-2 left-0 right-0 px-6 flex justify-between items-center z-[60]">
        <a href="https://www.search-digital.fr/" target="_blank" rel="noopener noreferrer" className="text-[7px] text-gray-500 uppercase font-black tracking-[0.4em] hover:text-primary transition-colors opacity-40">
          PROPULSÉ PAR <span className="underline decoration-primary/30">SEARCH-DIGITAL</span>
        </a>
        <span className="text-[7px] text-gray-500 font-mono font-black opacity-30 uppercase tracking-widest">V1.9</span>
      </div>
    </div>
  );
}

function Confetti() {
  const [particles, setParticles] = useState<Array<{x: number; y: number; rotate: number; color: string}>>([]);
  useEffect(() => {
    const timer = setTimeout(() => {
      const newParticles = [...Array(40)].map(() => ({ 
        x: (Math.random() - 0.5) * 800, 
        y: (Math.random() - 0.5) * 800, 
        rotate: Math.random() * 360, 
        color: ["bg-primary", "bg-white", "bg-red-900"][Math.floor(Math.random() * 3)] 
      }));
      setParticles(newParticles);
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">
      {particles.map((p, i) => (
        <motion.div 
          key={i} 
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }} 
          animate={{ opacity: 0, x: p.x, y: p.y, rotate: p.rotate, scale: 0 }} 
          transition={{ duration: 2.5, ease: "easeOut" }} 
          className={cn("absolute w-2 h-2 rounded-full", p.color)} 
        />
      ))}
    </div>
  );
}
