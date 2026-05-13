"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SANDWICH_CATEGORIES } from "@/lib/data";
import { SandwichConfig, Option } from "@/types";
import { ChevronRight, ChevronLeft, ShoppingCart, Check } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function SandwichBuilder() {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<SandwichConfig>({
    sauces: [],
    extras: [],
  });
  const [orderInfo, setOrderInfo] = useState({ name: "", phone: "", payment: "on_site" as "online" | "on_site" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);

  // Charger les points de fidélité au chargement du récapitulatif
  useEffect(() => {
    if (step === SANDWICH_CATEGORIES.length && orderInfo.phone) {
      const history = JSON.parse(localStorage.getItem(`loyalty_${orderInfo.phone}`) || "0");
      setLoyaltyPoints(history);
    }
  }, [step, orderInfo.phone]);

  const currentCategory = SANDWICH_CATEGORIES[step];

  const handleOptionToggle = (option: Option) => {
    if (currentCategory.id === "bread") {
      setConfig({ ...config, bread: option });
    } else if (currentCategory.id === "meat") {
      setConfig({ ...config, meat: option });
    } else if (currentCategory.id === "sauces") {
      const isSelected = config.sauces.find((s) => s.id === option.id);
      if (isSelected) {
        setConfig({
          ...config,
          sauces: config.sauces.filter((s) => s.id !== option.id),
        });
      } else if (config.sauces.length < 2) {
        setConfig({ ...config, sauces: [...config.sauces, option] });
      }
    } else if (currentCategory.id === "extras") {
      const isSelected = config.extras.find((e) => e.id === option.id);
      if (isSelected) {
        setConfig({
          ...config,
          extras: config.extras.filter((e) => e.id !== option.id),
        });
      } else {
        setConfig({ ...config, extras: [...config.extras, option] });
      }
    }
  };

  const isOptionSelected = (optionId: string) => {
    if (currentCategory.id === "bread") return config.bread?.id === optionId;
    if (currentCategory.id === "meat") return config.meat?.id === optionId;
    if (currentCategory.id === "sauces")
      return config.sauces.some((s) => s.id === optionId);
    if (currentCategory.id === "extras")
      return config.extras.some((e) => e.id === optionId);
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
    let total = 10; // Base price
    if (config.bread) total += config.bread.price;
    if (config.meat) total += config.meat.price;
    total += config.sauces.reduce((acc, s) => acc + s.price, 0);
    total += config.extras.reduce((acc, e) => acc + e.price, 0);
    
    // Si 9 commandes déjà faites, la 10ème est offerte
    if (loyaltyPoints >= 9) {
      return 0;
    }
    
    return total;
  };

  const handleSubmitOrder = async () => {
    if (!orderInfo.name || !orderInfo.phone) {
      alert("Veuillez remplir vos informations");
      return;
    }

    // Vérification de la blacklist locale (simulation)
    const blacklist = JSON.parse(localStorage.getItem("blacklisted_phones") || "[]");
    if (orderInfo.payment === "on_site" && blacklist.includes(orderInfo.phone)) {
      alert("Désolé, suite à des commandes non honorées, vous devez obligatoirement payer en ligne pour commander.");
      setOrderInfo({ ...orderInfo, payment: "online" });
      return;
    }

    setIsSubmitting(true);
    // Simulation d'envoi à Supabase
    setTimeout(() => {
      // Mise à jour de la fidélité
      const newPoints = loyaltyPoints >= 9 ? 0 : loyaltyPoints + 1;
      localStorage.setItem(`loyalty_${orderInfo.phone}`, JSON.stringify(newPoints));
      
      alert(loyaltyPoints >= 9 ? "Félicitations ! Votre commande est OFFERTE !" : "Commande envoyée avec succès !");
      
      setIsSubmitting(false);
      setStep(0);
      setConfig({ sauces: [], extras: [] });
      setOrderInfo({ name: "", phone: "", payment: "on_site" });
    }, 1500);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col p-6 bg-background text-foreground pb-24">
      <header className="mb-8 pt-4 text-center">
        <h1 className="text-3xl font-serif font-bold text-primary mb-2">
          Gourmet Truck
        </h1>
        <div className="premium-gradient h-[1px] w-24 mx-auto mb-2 opacity-50" />
        <p className="text-gray-400 text-sm italic tracking-wide">
          L'excellence à chaque bouchée
        </p>
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
              <div className="mb-6">
                <span className="text-[10px] text-primary font-bold tracking-[0.2em] uppercase">
                  Étape {step + 1} / {SANDWICH_CATEGORIES.length}
                </span>
                <h2 className="text-2xl font-serif mt-1">
                  {currentCategory.name}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {currentCategory.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleOptionToggle(option)}
                    className={cn(
                      "premium-card p-5 text-left transition-all duration-300 flex justify-between items-center group",
                      isOptionSelected(option.id)
                        ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                        : "hover:border-primary/50"
                    )}
                  >
                    <div>
                      <p className="font-semibold text-lg">{option.name}</p>
                      {option.price > 0 && (
                        <p className="text-primary text-sm font-medium">
                          + {option.price.toFixed(2)}€
                        </p>
                      )}
                    </div>
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full border border-primary flex items-center justify-center transition-all duration-500",
                        isOptionSelected(option.id)
                          ? "bg-primary text-background scale-110"
                          : "text-transparent scale-100"
                      )}
                    >
                      <Check size={14} strokeWidth={3} />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="summary"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1"
            >
              <h2 className="text-2xl font-serif mb-6">Finalisez votre commande</h2>
              
              <div className="space-y-5 mb-8">
                <div>
                  <label className="text-[10px] text-primary uppercase font-bold tracking-widest block mb-2">Votre Prénom</label>
                  <input 
                    type="text" 
                    value={orderInfo.name}
                    onChange={(e) => setOrderInfo({...orderInfo, name: e.target.value})}
                    placeholder="Ex: Jean"
                    className="w-full bg-secondary/50 border border-gray-800 p-4 rounded-xl focus:border-primary outline-none transition-all placeholder:text-gray-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-primary uppercase font-bold tracking-widest block mb-2">Téléphone</label>
                  <input 
                    type="tel" 
                    value={orderInfo.phone}
                    onChange={(e) => setOrderInfo({...orderInfo, phone: e.target.value})}
                    placeholder="06 00 00 00 00"
                    className="w-full bg-secondary/50 border border-gray-800 p-4 rounded-xl focus:border-primary outline-none transition-all placeholder:text-gray-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-primary uppercase font-bold tracking-widest block mb-2">Mode de paiement</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setOrderInfo({...orderInfo, payment: "online"})}
                      className={cn(
                        "p-4 rounded-xl border text-sm font-bold transition-all",
                        orderInfo.payment === "online" ? "border-primary bg-primary/10 text-primary" : "border-gray-800 text-gray-400"
                      )}
                    >
                      💳 En ligne
                    </button>
                    <button 
                      onClick={() => setOrderInfo({...orderInfo, payment: "on_site"})}
                      className={cn(
                        "p-4 rounded-xl border text-sm font-bold transition-all",
                        orderInfo.payment === "on_site" ? "border-primary bg-primary/10 text-primary" : "border-gray-800 text-gray-400"
                      )}
                    >
                      💰 Sur place
                    </button>
                  </div>
                  {orderInfo.payment === "on_site" && calculateTotal() > 25 && (
                    <p className="text-[11px] text-red-400 mt-2 italic font-medium">
                      * Paiement en ligne obligatoire au-dessus de 25€ pour éviter les commandes fantômes.
                    </p>
                  )}
                </div>
              </div>

              <div className="premium-card p-6 mb-8 bg-secondary/30">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest">Votre Sélection</h3>
                  {loyaltyPoints > 0 && (
                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded-full border border-primary/30">
                      {loyaltyPoints}/9 commandes
                    </span>
                  )}
                </div>
                <ul className="space-y-3">
                  <li className="flex justify-between text-sm">
                    <span className="text-gray-400 italic">Pain</span>
                    <span className="font-medium">{config.bread?.name}</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="text-gray-400 italic">Viande</span>
                    <span className="font-medium">{config.meat?.name}</span>
                  </li>
                  <li className="flex justify-between text-sm">
                    <span className="text-gray-400 italic">Sauces</span>
                    <span className="font-medium text-right max-w-[150px]">
                      {config.sauces.map((s) => s.name).join(", ") || "Aucune"}
                    </span>
                  </li>
                  {config.extras.length > 0 && (
                    <li className="flex justify-between text-sm">
                      <span className="text-gray-400 italic">Suppléments</span>
                      <span className="font-medium text-right max-w-[150px]">
                        {config.extras.map((e) => e.name).join(", ")}
                      </span>
                    </li>
                  )}
                </ul>

                <div className="mt-6 pt-4 border-t border-gray-800 flex justify-between items-center">
                  <span className="text-lg font-serif">
                    {loyaltyPoints >= 9 ? "Total (OFFERT !)" : "Total Gourmet"}
                  </span>
                  <span className={cn(
                    "text-2xl font-bold text-primary",
                    loyaltyPoints >= 9 && "line-through opacity-50 text-lg"
                  )}>
                    {loyaltyPoints >= 9 ? (10 + (config.bread?.price || 0) + (config.meat?.price || 0) + config.sauces.reduce((acc, s) => acc + s.price, 0) + config.extras.reduce((acc, e) => acc + e.price, 0)).toFixed(2) : calculateTotal().toFixed(2)}€
                  </span>
                  {loyaltyPoints >= 9 && (
                    <span className="text-2xl font-bold text-green-500 ml-2">0.00€</span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting || (orderInfo.payment === "on_site" && calculateTotal() > 25)}
                  className="w-full premium-gradient text-background font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-3 transition-transform active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart size={20} />
                      <span className="tracking-widest uppercase text-sm">
                        {orderInfo.payment === "online" ? "Payer et Commander" : "Confirmer la commande"}
                      </span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setStep(0)}
                  disabled={isSubmitting}
                  className="w-full bg-transparent border border-gray-800 text-gray-500 py-3 rounded-xl text-xs uppercase tracking-widest font-bold hover:text-gray-300 transition-colors"
                >
                  Modifier ma sélection
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {step < SANDWICH_CATEGORIES.length && (
          <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-md border-t border-gray-900 max-w-md mx-auto flex gap-4">
            <button
              onClick={prevStep}
              disabled={step === 0}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border border-gray-800 transition-all font-bold text-xs uppercase tracking-widest",
                step === 0 ? "opacity-0 pointer-events-none" : "opacity-100"
              )}
            >
              <ChevronLeft size={16} />
              Retour
            </button>
            <button
              onClick={nextStep}
              disabled={
                (currentCategory.id === "bread" && !config.bread) ||
                (currentCategory.id === "meat" && !config.meat)
              }
              className={cn(
                "flex-[2] premium-gradient text-background font-bold py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-30 transition-all shadow-lg shadow-primary/10 uppercase text-xs tracking-widest"
              )}
            >
              {step === SANDWICH_CATEGORIES.length - 1 ? "Voir le panier" : "Suivant"}
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
