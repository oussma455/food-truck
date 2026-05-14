"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SANDWICH_CATEGORIES } from "@/lib/data";
import { SandwichConfig, Option, Category } from "@/types";
import { ShoppingCart, Check, Plus, Minus, Clock, MapPin, Phone, Shield } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Link from "next/link";

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
  const [step, setStep] = useState(0);
  const [menu] = useState<Category[]>(() => {
    if (typeof window !== "undefined") {
      const savedMenu = localStorage.getItem("truck_menu");
      return savedMenu ? JSON.parse(savedMenu) : SANDWICH_CATEGORIES;
    }
    return SANDWICH_CATEGORIES;
  });
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
    // Initial loading handled by useState initializers

    if (step === menu.length && orderInfo.phone) {
      const history = JSON.parse(localStorage.getItem(`loyalty_${orderInfo.phone}`) || "0");
      // Use a timeout or a microtask to avoid synchronous update during render cycle
      const timer = setTimeout(() => setLoyaltyPoints(history), 0);
      return () => clearTimeout(timer);
    }
  }, [step, orderInfo.phone, menu.length]);

  const currentCategory = menu[step];

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
    if (catId === "presets") return config.preset_sandwich === menu[1].options.find(o => o.id === optionId)?.name;
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
      const preset = menu[1].options.find(o => o.name === config.preset_sandwich);
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
          <h2 className="text-3xl font-serif mb-4 uppercase tracking-widest italic">Fermé</h2>
          <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">Revenez nous voir bientôt !</p>
          <a href="tel:+33600000000" className="mt-8 flex items-center justify-center gap-2 text-primary hover:scale-105 transition-all uppercase text-[10px] font-black tracking-widest border border-primary/20 px-6 py-3 rounded-full">
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
        <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] font-bold">L&apos;art du sandwich premium</p>
      </header>

      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {step < menu.length ? (
            <motion.div key={currentCategory.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1">
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <span className="text-[10px] text-primary font-black tracking-[0.2em] uppercase">Sélection</span>
                  <h2 className="text-2xl font-serif mt-1 italic">{currentCategory.name}</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {currentCategory?.options.map((option) => (
                  <div key={option.id} className={cn(
                    "premium-card transition-all duration-500 flex justify-between items-center group relative",
                    (isOptionSelected(option.id) || getQuantity(currentCategory.id as "drinks" | "desserts", option.id) > 0) ? "border-primary bg-primary/5 shadow-[0_0_25px_rgba(212,175,55,0.1)]" : "hover:border-primary/40",
                    (currentCategory.id === 'drinks' || currentCategory.id === 'desserts') ? "p-4" : "p-5"
                  )}>
                    <div onClick={() => (currentCategory.id !== 'drinks' && currentCategory.id !== 'desserts') && handleOptionToggle(option)} className="flex-1 cursor-pointer">
                      <p className={cn("font-black text-[11px] uppercase tracking-[0.1em] transition-colors", (isOptionSelected(option.id) || getQuantity(currentCategory.id as "drinks" | "desserts", option.id) > 0) ? "text-primary" : "text-gray-300")}>{option.name}</p>
                      {option.price > 0 && <span className="text-[10px] text-gray-600 font-mono mt-1 font-bold">+{option.price.toFixed(2)}€</span>}
                    </div>
                    {(currentCategory.id === 'drinks' || currentCategory.id === 'desserts') ? (
                      <div className="flex items-center gap-4 bg-black/60 p-1.5 rounded-xl border border-gray-800 shadow-inner">
                        <button onClick={() => updateQuantity(currentCategory.id as "drinks" | "desserts", option, -1)} className="p-2 hover:text-primary transition-colors text-gray-500"><Minus size={14} /></button>
                        <span className="text-xs font-black w-4 text-center text-primary">{getQuantity(currentCategory.id as "drinks" | "desserts", option.id)}</span>
                        <button onClick={() => updateQuantity(currentCategory.id as "drinks" | "desserts", option, 1)} className="p-2 hover:text-primary transition-colors text-gray-500"><Plus size={14} /></button>
                      </div>
                    ) : (
                      <div onClick={() => handleOptionToggle(option)} className={cn("w-6 h-6 rounded-full border border-primary flex items-center justify-center transition-all duration-700 shadow-lg", isOptionSelected(option.id) ? "bg-primary text-background scale-110 rotate-[360deg]" : "bg-black/40 text-transparent scale-100")}>
                        <Check size={12} strokeWidth={4} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="summary" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex-1">
              <h2 className="text-2xl font-serif mb-6 text-center text-white italic">Finalisation</h2>
              <div className="space-y-4 mb-8">
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setOrderInfo({...orderInfo, type: "takeaway"})} className={cn("p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-2", orderInfo.type === "takeaway" ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/5" : "border-gray-800 text-gray-600")}>
                    <ShoppingCart size={16} /> À Emporter
                  </button>
                  <button onClick={() => setOrderInfo({...orderInfo, type: "on_site"})} className={cn("p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-2", orderInfo.type === "on_site" ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/5" : "border-gray-800 text-gray-600")}>
                    <MapPin size={16} /> Sur Place
                  </button>
                </div>
                <div className="bg-secondary/10 p-5 rounded-2xl border border-gray-800/50 shadow-inner">
                  <label className="text-[9px] text-primary uppercase font-black tracking-[0.2em] block mb-4 text-center">Temps de retrait</label>
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
                  <span className="text-xl font-serif text-white italic">Total</span>
                  <span className="text-3xl font-black text-primary tracking-tighter">{calculateTotal().toFixed(2)}€</span>
                </div>
                <button onClick={handleSubmitOrder} disabled={isSubmitting} className="w-full premium-gradient text-background font-black py-5 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 tracking-[0.2em] uppercase text-[11px]">
                  {isSubmitting ? <div className="w-5 h-5 border-3 border-background border-t-transparent rounded-full animate-spin" /> : <><Check size={20} strokeWidth={3} /> Confirmer la commande</>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/95 backdrop-blur-2xl border-t border-gray-900 max-w-md mx-auto flex flex-col gap-4 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="flex gap-4">
            <button onClick={() => setStep(Math.max(0, step - 1))} className={cn("flex-1 py-4 rounded-2xl border border-gray-800 font-black text-[10px] uppercase tracking-widest text-gray-600 hover:text-white transition-all", step === 0 ? "opacity-0 pointer-events-none" : "")}>Retour</button>
            <button onClick={() => setStep(step + 1)} disabled={step < menu.length && ((currentCategory?.id === "bread" && !config.bread) || (currentCategory?.id === "meat" && !config.meat))} className="flex-[2.5] premium-gradient text-background font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
              {step === menu.length - 1 ? "VOIR LE PANIER" : "SUIVANT"}
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

function Confetti() {
  const [particles, setParticles] = useState<Array<{x: number, y: number, rotate: number, color: string}>>([]);
  
  useEffect(() => {
    // Use a timeout to avoid synchronous update during mount
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
r)} />
      ))}
    </div>
  );
}
