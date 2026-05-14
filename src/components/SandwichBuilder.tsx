"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SANDWICH_CATEGORIES } from "@/lib/data";
import { SandwichConfig, Option } from "@/types";
import { ChevronRight, ChevronLeft, ShoppingCart, Check, Star, Award, Plus, Minus, Clock, MapPin, Phone, Shield } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Link from "next/link";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function SandwichBuilder() {
  const [isOpen, setIsOpen] = useState(true);
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<SandwichConfig>({
    sauces: [],
    extras: [],
    drinks: [],
    desserts: [],
  });
  const [orderInfo, setOrderInfo] = useState({ 
    name: "", 
    phone: "", 
    payment: "on_site" as "online" | "on_site",
    type: "takeaway" as "on_site" | "takeaway",
    pickupTime: "15 min"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [rgpdAccepted, setRgpdAccepted] = useState(false);

  useEffect(() => {
    const status = localStorage.getItem("truck_status");
    setIsOpen(status !== "closed");
    if (step === SANDWICH_CATEGORIES.length && orderInfo.phone) {
      const history = JSON.parse(localStorage.getItem(`loyalty_${orderInfo.phone}`) || "0");
      setLoyaltyPoints(history);
    }
  }, [step, orderInfo.phone]);

  const currentCategory = SANDWICH_CATEGORIES[step];

  const handleOptionToggle = (option: Option) => {
    const catId = currentCategory.id;
    if (catId === "selection_type") {
      setConfig({ ...config, preset_sandwich: option.id === "st1" ? "pending" : undefined });
      setStep(option.id === "st1" ? 1 : 2);
      return;
    }
    if (catId === "presets") {
      setConfig({ ...config, preset_sandwich: option.name, bread: undefined, meat: undefined });
      setStep(2);
      return;
    }
    if (catId === "formula") {
      setConfig({ ...config, formula: option });
    } else if (catId === "bread") {
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
    } else if (catId === "extras") {
      const isSelected = config.extras.find((e) => e.id === option.id);
      if (isSelected) {
        setConfig({ ...config, extras: config.extras.filter((e) => e.id !== option.id) });
      } else {
        setConfig({ ...config, extras: [...config.extras, option] });
      }
    }
  };

  const updateQuantity = (catId: 'drinks' | 'desserts', option: Option, delta: number) => {
    const currentList = config[catId] || [];
    const existing = currentList.find(i => i.option.id === option.id);
    if (existing) {
      const newQty = Math.max(0, existing.quantity + delta);
      if (newQty === 0) {
        setConfig({ ...config, [catId]: currentList.filter(i => i.option.id !== option.id) });
      } else {
        setConfig({ ...config, [catId]: currentList.map(i => i.option.id === option.id ? { ...i, quantity: newQty } : i) });
      }
    } else if (delta > 0) {
      setConfig({ ...config, [catId]: [...currentList, { option, quantity: 1 }] });
    }
  };

  const isOptionSelected = (optionId: string) => {
    const catId = currentCategory.id;
    if (catId === "formula") return config.formula?.id === optionId;
    if (catId === "bread") return config.bread?.id === optionId;
    if (catId === "meat") return config.meat?.id === optionId;
    if (catId === "presets") return config.preset_sandwich === SANDWICH_CATEGORIES[1].options.find(o => o.id === optionId)?.name;
    if (catId === "sauces") return config.sauces.some((s) => s.id === optionId);
    if (catId === "extras") return config.extras.some((e) => e.id === optionId);
    return false;
  };

  const getQuantity = (catId: 'drinks' | 'desserts', optionId: string) => {
    return config[catId]?.find(i => i.option.id === optionId)?.quantity || 0;
  };

  const calculateTotal = () => {
    let total = 10;
    if (config.formula) total += config.formula.price;
    if (config.preset_sandwich && config.preset_sandwich !== "pending") {
      const preset = SANDWICH_CATEGORIES[1].options.find(o => o.name === config.preset_sandwich);
      total = preset?.price || 10;
      if (config.formula?.id === "f2") total += 5;
    } else {
      if (config.bread) total += config.bread.price;
      if (config.meat) total += config.meat.price;
    }
    const totalSaucePrice = config.sauces.reduce((acc, s) => acc + s.price, 0);
    const sauceDiscount = Math.min(totalSaucePrice, 1.0); 
    total += (totalSaucePrice - sauceDiscount);
    total += config.extras.reduce((acc, e) => acc + e.price, 0);
    total += (config.drinks || []).reduce((acc, d) => acc + (d.option.price * d.quantity), 0);
    total += (config.desserts || []).reduce((acc, d) => acc + (d.option.price * d.quantity), 0);
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
        setStep(0);
        setConfig({ sauces: [], extras: [], drinks: [], desserts: [] });
        setShowConfetti(false);
        alert("Commande validée !");
      }, 2000);
    }, 1500);
  };

  if (!isOpen) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center text-white">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="premium-card p-10 border-red-500/50">
          <Clock className="text-red-500 mx-auto mb-6 animate-pulse" size={40} />
          <h2 className="text-3xl font-serif mb-4 uppercase tracking-widest">Fermé</h2>
          <p className="text-gray-500">Revenez nous voir pendant les heures de service !</p>
          <a href="tel:+33600000000" className="mt-8 flex items-center justify-center gap-2 text-primary hover:underline uppercase text-[10px] font-bold tracking-widest">
            <Phone size={14} /> Nous appeler
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col p-6 bg-background text-foreground pb-40 relative overflow-hidden">
      <AnimatePresence>{showConfetti && <Confetti />}</AnimatePresence>
      
      <header className="mb-8 pt-4 text-center">
        <h1 className="text-3xl font-serif font-bold text-primary mb-2 italic">Gourmet Truck</h1>
        <div className="premium-gradient h-[1px] w-24 mx-auto mb-2 opacity-50" />
        <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] font-bold">L'art du sandwich premium</p>
      </header>

      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {step < SANDWICH_CATEGORIES.length ? (
            <motion.div key={currentCategory.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1">
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <span className="text-[10px] text-primary font-bold tracking-[0.2em] uppercase">Sélection</span>
                  <h2 className="text-2xl font-serif mt-1">{currentCategory.name}</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {currentCategory.options.map((option) => (
                  <div key={option.id} className={cn(
                    "premium-card transition-all duration-500 flex justify-between items-center group relative",
                    (isOptionSelected(option.id) || getQuantity(currentCategory.id as any, option.id) > 0) ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(212,175,55,0.1)]" : "hover:border-primary/40",
                    (currentCategory.id === 'drinks' || currentCategory.id === 'desserts') ? "p-4" : "p-5"
                  )}>
                    <div onClick={() => (currentCategory.id !== 'drinks' && currentCategory.id !== 'desserts') && handleOptionToggle(option)} className="flex-1 cursor-pointer">
                      <p className={cn("font-bold text-sm uppercase tracking-widest transition-colors", (isOptionSelected(option.id) || getQuantity(currentCategory.id as any, option.id) > 0) ? "text-primary" : "text-gray-300")}>{option.name}</p>
                      {option.price > 0 && <span className="text-[10px] text-gray-500 font-mono mt-1">+{option.price.toFixed(2)}€</span>}
                    </div>
                    {(currentCategory.id === 'drinks' || currentCategory.id === 'desserts') ? (
                      <div className="flex items-center gap-4 bg-black/40 p-2 rounded-xl border border-gray-800">
                        <button onClick={() => updateQuantity(currentCategory.id as any, option, -1)} className="p-1 hover:text-primary transition-colors text-white"><Minus size={16} /></button>
                        <span className="text-sm font-bold w-4 text-center text-white">{getQuantity(currentCategory.id as any, option.id)}</span>
                        <button onClick={() => updateQuantity(currentCategory.id as any, option, 1)} className="p-1 hover:text-primary transition-colors text-white"><Plus size={16} /></button>
                      </div>
                    ) : (
                      <div onClick={() => handleOptionToggle(option)} className={cn("w-6 h-6 rounded-full border border-primary flex items-center justify-center transition-all duration-500", isOptionSelected(option.id) ? "bg-primary text-background scale-110 rotate-[360deg]" : "bg-black/40 text-transparent scale-100")}>
                        <Check size={12} strokeWidth={4} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="summary" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex-1">
              <h2 className="text-2xl font-serif mb-6 text-center text-white">Finalisation</h2>
              <div className="space-y-4 mb-8">
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setOrderInfo({...orderInfo, type: "takeaway"})} className={cn("p-4 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all flex flex-col items-center gap-2", orderInfo.type === "takeaway" ? "border-primary bg-primary/10 text-primary" : "border-gray-800 text-gray-500")}><ShoppingCart size={16} /> À Emporter</button>
                  <button onClick={() => setOrderInfo({...orderInfo, type: "on_site"})} className={cn("p-4 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all flex flex-col items-center gap-2", orderInfo.type === "on_site" ? "border-primary bg-primary/10 text-primary" : "border-gray-800 text-gray-500")}><MapPin size={16} /> Sur Place</button>
                </div>
                <div className="bg-secondary/20 p-4 rounded-xl border border-gray-800">
                  <label className="text-[9px] text-primary uppercase font-bold tracking-widest block mb-3 text-center">Temps de retrait</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["15 min", "30 min", "45 min"].map(time => (
                      <button key={time} onClick={() => setOrderInfo({...orderInfo, pickupTime: time})} className={cn("py-2 rounded-lg border text-[10px] font-bold transition-all", orderInfo.pickupTime === time ? "bg-primary text-background border-primary" : "border-gray-800 text-gray-500")}>{time}</button>
                    ))}
                  </div>
                </div>
                <input type="text" value={orderInfo.name} onChange={(e) => setOrderInfo({...orderInfo, name: e.target.value})} placeholder="Votre Nom" className="w-full bg-secondary/30 border border-gray-800 p-4 rounded-xl focus:border-primary outline-none transition-all text-sm font-medium text-white" />
                <input type="tel" value={orderInfo.phone} onChange={(e) => setOrderInfo({...orderInfo, phone: e.target.value})} placeholder="Téléphone (Fidélité)" className="w-full bg-secondary/30 border border-gray-800 p-4 rounded-xl focus:border-primary outline-none transition-all text-sm font-medium text-white" />
                
                {/* Checkbox RGPD */}
                <div className="flex gap-3 p-4 bg-secondary/10 rounded-xl border border-gray-800/50">
                  <button onClick={() => setRgpdAccepted(!rgpdAccepted)} className={cn("w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0", rgpdAccepted ? "bg-primary border-primary text-background" : "border-gray-700 hover:border-primary")}>
                    {rgpdAccepted && <Check size={12} strokeWidth={4} />}
                  </button>
                  <p className="text-[9px] text-gray-500 leading-tight">J'accepte que mes données soient utilisées pour la gestion de ma commande et ma fidélité. <Link href="/legals" className="text-primary hover:underline">Voir les mentions légales</Link></p>
                </div>
              </div>

              <div className="bg-secondary/20 rounded-2xl p-6 border border-gray-800 mb-8">
                <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-4">
                  <span className="text-xl font-serif text-white">Total</span>
                  <span className="text-2xl font-bold text-primary">{calculateTotal().toFixed(2)}€</span>
                </div>
                <button onClick={handleSubmitOrder} disabled={isSubmitting} className="w-full premium-gradient text-background font-bold py-5 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 tracking-[0.2em] uppercase text-xs uppercase text-xs">
                  {isSubmitting ? <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" /> : <><Check size={18} /> Confirmer</>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/90 backdrop-blur-xl border-t border-gray-900 max-w-md mx-auto flex flex-col gap-4 z-50">
          <div className="flex gap-4">
            <button onClick={() => setStep(Math.max(0, step - 1))} className={cn("flex-1 py-4 rounded-xl border border-gray-800 font-bold text-[10px] uppercase tracking-widest text-gray-400", step === 0 ? "opacity-0 pointer-events-none" : "")}>Retour</button>
            <button onClick={() => setStep(step + 1)} disabled={(currentCategory?.id === "bread" && !config.bread) || (currentCategory?.id === "meat" && !config.meat)} className="flex-[2] premium-gradient text-background font-bold py-4 rounded-xl uppercase text-[10px] tracking-widest shadow-xl shadow-primary/10">{step === SANDWICH_CATEGORIES.length - 1 ? "Panier" : "Suivant"}</button>
          </div>
          <div className="flex justify-center items-center gap-6 pt-2 border-t border-gray-800/50">
            <a href="tel:+33600000000" className="text-primary flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] hover:scale-105 transition-all"><Phone size={12} /> Appeler</a>
            <Link href="/legals" className="text-gray-600 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.15em] hover:text-white transition-all"><Shield size={12} /> Mentions Légales</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Confetti() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">
      {[...Array(50)].map((_, i) => (
        <motion.div key={i} initial={{ opacity: 1, x: 0, y: 0 }} animate={{ opacity: 0, x: (Math.random() - 0.5) * 800, y: (Math.random() - 0.5) * 800, rotate: 360, scale: 0 }} transition={{ duration: 2.5 }} className="absolute w-2 h-2 rounded-sm bg-primary" />
      ))}
    </div>
  );
}
