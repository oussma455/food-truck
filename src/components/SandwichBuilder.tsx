"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SANDWICH_CATEGORIES } from "@/lib/data";
import { SandwichConfig, Option } from "@/types";
import { ChevronRight, ChevronLeft, ShoppingCart, Check, Star, Award } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Étendre le type pour inclure boissons et desserts
interface ExtendedConfig extends SandwichConfig {
  drinks: Option[];
  desserts: Option[];
}

export default function SandwichBuilder() {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<ExtendedConfig>({
    sauces: [],
    extras: [],
    drinks: [],
    desserts: [],
  });
  const [orderInfo, setOrderInfo] = useState({ name: "", phone: "", payment: "on_site" as "online" | "on_site" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (step === SANDWICH_CATEGORIES.length && orderInfo.phone) {
      const history = JSON.parse(localStorage.getItem(`loyalty_${orderInfo.phone}`) || "0");
      setLoyaltyPoints(history);
    }
  }, [step, orderInfo.phone]);

  const currentCategory = SANDWICH_CATEGORIES[step];

  const handleOptionToggle = (option: Option) => {
    const catId = currentCategory.id;
    
    if (catId === "bread") {
      setConfig({ ...config, bread: option });
    } else if (catId === "meat") {
      setConfig({ ...config, meat: option });
    } else if (catId === "sauces") {
      const isSelected = config.sauces.find((s) => s.id === option.id);
      if (isSelected) {
        setConfig({ ...config, sauces: config.sauces.filter((s) => s.id !== option.id) });
      } else {
        setConfig({ ...config, sauces: [...config.sauces, option] });
      }
    } else {
      const key = catId as keyof ExtendedConfig;
      const currentList = (config[key] as Option[]) || [];
      const isSelected = currentList.find((item) => item.id === option.id);
      
      if (isSelected) {
        setConfig({ ...config, [key]: currentList.filter((item) => item.id !== option.id) });
      } else {
        setConfig({ ...config, [key]: [...currentList, option] });
      }
    }
  };

  const isOptionSelected = (optionId: string) => {
    const catId = currentCategory.id;
    if (catId === "bread") return config.bread?.id === optionId;
    if (catId === "meat") return config.meat?.id === optionId;
    if (catId === "sauces") return config.sauces.some((s) => s.id === optionId);
    if (catId === "extras") return config.extras.some((e) => e.id === optionId);
    if (catId === "drinks") return (config.drinks || []).some((d) => d.id === optionId);
    if (catId === "desserts") return (config.desserts || []).some((d) => d.id === optionId);
    return false;
  };

  const nextStep = () => {
    if (step < SANDWICH_CATEGORIES.length - 1) {
      setStep(step + 1);
    } else {
      setStep(SANDWICH_CATEGORIES.length);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const calculateTotal = () => {
    let total = 10;
    if (config.bread) total += config.bread.price;
    if (config.meat) total += config.meat.price;
    
    // Logique sauces : 2 gratuites (chaque sauce est à 0.50€)
    const totalSaucePrice = config.sauces.reduce((acc, s) => acc + s.price, 0);
    const sauceDiscount = Math.min(totalSaucePrice, 1.0); 
    total += (totalSaucePrice - sauceDiscount);

    total += config.extras.reduce((acc, e) => acc + e.price, 0);
    total += (config.drinks || []).reduce((acc, d) => acc + d.price, 0);
    total += (config.desserts || []).reduce((acc, d) => acc + d.price, 0);
    
    if (loyaltyPoints >= 9) return 0;
    return total;
  };

  const handleSubmitOrder = async () => {
    if (!orderInfo.name || !orderInfo.phone) {
      alert("Veuillez remplir vos informations");
      return;
    }

    const blacklist = JSON.parse(localStorage.getItem("blacklisted_phones") || "[]");
    if (orderInfo.payment === "on_site" && blacklist.includes(orderInfo.phone)) {
      alert("Paiement en ligne obligatoire pour vous.");
      setOrderInfo({ ...orderInfo, payment: "online" });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const newPoints = loyaltyPoints >= 9 ? 0 : loyaltyPoints + 1;
      localStorage.setItem(`loyalty_${orderInfo.phone}`, JSON.stringify(newPoints));
      setShowConfetti(true);
      
      setTimeout(() => {
        setIsSubmitting(false);
        setStep(0);
        setConfig({ sauces: [], extras: [], drinks: [], desserts: [] });
        setOrderInfo({ name: "", phone: "", payment: "on_site" });
        setShowConfetti(false);
        alert(loyaltyPoints >= 9 ? "C'EST OFFERT ! Merci de votre fidélité." : "Commande réussie ! Bon appétit.");
      }, 3000);
    }, 1500);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col p-6 bg-background text-foreground pb-32 relative overflow-hidden">
      <AnimatePresence>
        {showConfetti && <Confetti />}
      </AnimatePresence>

      <header className="mb-8 pt-4 text-center">
        <h1 className="text-3xl font-serif font-bold text-primary mb-2 italic">Gourmet Truck</h1>
        <div className="premium-gradient h-[1px] w-24 mx-auto mb-2 opacity-50" />
        <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] font-bold">L'art du sandwich premium</p>
      </header>

      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {step < SANDWICH_CATEGORIES.length ? (
            <motion.div
              key={currentCategory.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1"
            >
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <span className="text-[10px] text-primary font-bold tracking-[0.2em] uppercase">Sélection {step + 1}/{SANDWICH_CATEGORIES.length}</span>
                  <h2 className="text-2xl font-serif mt-1">{currentCategory.name}</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {currentCategory.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleOptionToggle(option)}
                    className={cn(
                      "premium-card p-5 text-left transition-all duration-500 flex justify-between items-center group relative",
                      isOptionSelected(option.id) ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-[0_0_20px_rgba(212,175,55,0.1)]" : "hover:border-primary/40"
                    )}
                  >
                    <div className="flex flex-col">
                      <p className={cn("font-bold text-sm uppercase tracking-widest transition-colors", isOptionSelected(option.id) ? "text-primary" : "text-gray-300")}>{option.name}</p>
                      {option.price > 0 && <span className="text-[10px] text-gray-500 font-mono mt-1">+{option.price.toFixed(2)}€</span>}
                    </div>
                    <div className={cn(
                      "w-6 h-6 rounded-full border border-primary flex items-center justify-center transition-all duration-500", 
                      isOptionSelected(option.id) ? "bg-primary text-background scale-110 rotate-[360deg]" : "bg-black/40 text-transparent scale-100"
                    )}>
                      <Check size={12} strokeWidth={4} />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="summary" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex-1">
              <h2 className="text-2xl font-serif mb-6 text-center">Votre Expérience</h2>
              
              {/* VIP Loyalty Card */}
              <div className="mb-8 relative group">
                <div className="absolute inset-0 bg-primary/10 blur-xl rounded-2xl group-hover:bg-primary/20 transition-all" />
                <div className="relative bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-primary/30 p-5 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-primary/5 rounded-full" />
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-primary font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                        <Award size={14} />
                        Gourmet VIP Card
                      </h3>
                      <p className="text-[9px] text-gray-500 mt-1 uppercase">10ème sandwich offert d'une valeur de 15€</p>
                    </div>
                    <Star className="text-primary/40" size={20} />
                  </div>
                  
                  <div className="grid grid-cols-5 gap-3">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className={cn(
                        "aspect-square rounded-lg border flex items-center justify-center transition-all duration-700",
                        i < loyaltyPoints 
                          ? "bg-primary border-primary text-background shadow-[0_0_10px_rgba(212,175,55,0.4)]" 
                          : i === 9 ? "border-dashed border-primary/50 text-primary/50" : "border-gray-800 bg-black/40 text-gray-800"
                      )}>
                        {i < loyaltyPoints ? <Check size={14} strokeWidth={4} /> : i === 9 ? <Star size={12} /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="relative">
                  <input type="text" value={orderInfo.name} onChange={(e) => setOrderInfo({...orderInfo, name: e.target.value})} placeholder="Votre Nom" className="w-full bg-secondary/30 border border-gray-800 p-4 rounded-xl focus:border-primary outline-none transition-all placeholder:text-gray-700 text-sm font-medium" />
                </div>
                <div className="relative">
                  <input type="tel" value={orderInfo.phone} onChange={(e) => setOrderInfo({...orderInfo, phone: e.target.value})} placeholder="N° de Téléphone (Fidélité)" className="w-full bg-secondary/30 border border-gray-800 p-4 rounded-xl focus:border-primary outline-none transition-all placeholder:text-gray-700 text-sm font-medium" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setOrderInfo({...orderInfo, payment: "online"})} className={cn("p-4 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all flex flex-col items-center gap-2", orderInfo.payment === "online" ? "border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(212,175,55,0.1)]" : "border-gray-800 text-gray-500")}>💳 CB En ligne</button>
                  <button onClick={() => setOrderInfo({...orderInfo, payment: "on_site"})} className={cn("p-4 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all flex flex-col items-center gap-2", orderInfo.payment === "on_site" ? "border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(212,175,55,0.1)]" : "border-gray-800 text-gray-500")}>💰 Sur Place</button>
                </div>
              </div>

              <div className="bg-secondary/20 rounded-2xl p-6 border border-gray-800 mb-8">
                <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-4">
                  <span className="text-xl font-serif">{loyaltyPoints >= 9 ? "Total (CADEAU)" : "Total Commande"}</span>
                  <div className="text-right">
                    <span className={cn("text-2xl font-bold text-primary transition-all", loyaltyPoints >= 9 && "line-through opacity-30 text-sm")}>
                      {calculateTotal().toFixed(2)}€
                    </span>
                    {loyaltyPoints >= 9 && <span className="text-3xl font-bold text-green-500 block">0.00€</span>}
                  </div>
                </div>
                <button onClick={handleSubmitOrder} disabled={isSubmitting || (orderInfo.payment === "on_site" && calculateTotal() > 25)} className="w-full premium-gradient text-background font-bold py-5 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 tracking-[0.2em] uppercase text-xs">
                  {isSubmitting ? <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" /> : <><ShoppingCart size={18} /> {orderInfo.payment === "online" ? "Payer & Commander" : "Confirmer"}</>}
                </button>
              </div>
              
              <button onClick={() => setStep(0)} className="w-full text-gray-600 text-[10px] uppercase font-bold tracking-[0.2em] hover:text-primary transition-colors">Modifier la sélection</button>
            </motion.div>
          )}
        </AnimatePresence>

        {step < SANDWICH_CATEGORIES.length && (
          <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/90 backdrop-blur-xl border-t border-gray-900 max-w-md mx-auto flex gap-4 z-50">
            <button onClick={prevStep} disabled={step === 0} className={cn("flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border border-gray-800 font-bold text-[10px] uppercase tracking-widest transition-all", step === 0 ? "opacity-0 pointer-events-none" : "hover:bg-white/5")}><ChevronLeft size={14} /> Retour</button>
            <button onClick={nextStep} disabled={(currentCategory.id === "bread" && !config.bread) || (currentCategory.id === "meat" && !config.meat)} className="flex-[2] premium-gradient text-background font-bold py-4 rounded-xl flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all">{step === SANDWICH_CATEGORIES.length - 1 ? "Panier" : "Suivant"} <ChevronRight size={14} /></button>
          </div>
        )}
      </div>
    </div>
  );
}

function Confetti() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            opacity: 1, 
            x: 0, 
            y: 0, 
            scale: Math.random() * 0.5 + 0.5,
            rotate: 0 
          }}
          animate={{ 
            opacity: 0, 
            x: (Math.random() - 0.5) * 800, 
            y: (Math.random() - 0.5) * 800,
            rotate: Math.random() * 360,
            scale: 0
          }}
          transition={{ duration: 2.5, ease: "easeOut" }}
          className={cn(
            "absolute w-3 h-3 rounded-sm",
            ["bg-primary", "bg-white", "bg-yellow-600", "bg-amber-200"][Math.floor(Math.random() * 4)]
          )}
        />
      ))}
    </div>
  );
}
