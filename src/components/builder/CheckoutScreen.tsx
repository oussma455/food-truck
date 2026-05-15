"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, CreditCard, UtensilsCrossed, Wallet, Trash2, ShieldCheck, CupSoda, Clock } from "lucide-react";
import { SandwichConfig, PaymentMethod, Option } from "@/types";
import StepContainer from "./StepContainer";
import Link from "next/link";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CheckoutScreenProps {
  readonly orderInfo: { 
    name: string; 
    phone: string; 
    pickupTime: string; 
    type: "on_site" | "takeaway"; 
    paymentMethod: PaymentMethod;
    notes?: string;
  };
  readonly setOrderInfo: React.Dispatch<React.SetStateAction<any>>;
  readonly cart: SandwichConfig[];
  readonly currentConfig: SandwichConfig;
  readonly calculateTotal: () => number;
  readonly rgpdAccepted: boolean;
  readonly setRgpdAccepted: (val: boolean) => void;
  readonly isSubmitting: boolean;
  readonly onSubmit: () => void;
  readonly onAddAnother: () => void;
  readonly isCouscousMode: boolean;
}

export default function CheckoutScreen({ 
  orderInfo, setOrderInfo, cart, currentConfig, 
  calculateTotal, rgpdAccepted, setRgpdAccepted, 
  isSubmitting, onSubmit, onAddAnother, isCouscousMode 
}: CheckoutScreenProps) {
  const allItems = [...cart, currentConfig].filter(i => i.formula);
  const total = calculateTotal();
  const depositRate = isCouscousMode ? 0.50 : 0.30;
  const depositAmount = total * depositRate;
  const balanceAmount = total - depositAmount;

  return (
    <StepContainer title="Résumé" subtitle="Finalisez votre commande">
      <div className="space-y-6 mb-8 mt-4 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
        
        {/* Security Banner */}
        <div className="bg-primary/[0.03] border border-primary/20 p-5 rounded-3xl">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="text-primary" size={20} />
            <p className="text-xs font-black uppercase tracking-widest text-white">Sécurisation Anti-No-Show</p>
          </div>
          <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
            Pour valider votre commande, un acompte de <span className="text-primary font-black">{isCouscousMode ? "50%" : "30%"}</span> est requis via SumUp. Le solde sera réglé au camion.
          </p>
        </div>

        {/* Basket Recap */}
        <div className="bg-secondary/40 p-6 rounded-3xl border border-white/5 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <h4 className="text-[10px] text-primary font-black uppercase tracking-widest">Votre Panier ({allItems.length})</h4>
            {!isCouscousMode && (
              <button onClick={onAddAnother} className="text-[9px] text-white/40 hover:text-primary font-black uppercase tracking-widest transition-colors">+ Ajouter</button>
            )}
          </div>
          <div className="space-y-3">
            {allItems.map((item, idx) => (
              <div key={idx} className="group relative">
                <p className="text-xs text-white font-black uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {item.formula?.name}
                </p>
                {item.preset_sandwich && (
                  <p className="text-[10px] text-gray-500 ml-4 italic font-medium">
                    {item.preset_sandwich.name} 
                    {item.meats && ` (${item.meats.map(m => m.name).join(' + ')})`}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-4">
          <p className="text-[9px] text-gray-500 uppercase font-black tracking-[0.3em] text-center italic">Mode de règlement préféré</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'card', name: 'CB', icon: <CreditCard size={16} /> },
              { id: 'resto_card', name: 'TR', icon: <UtensilsCrossed size={16} /> },
              { id: 'cash', name: 'ESP', icon: <Wallet size={16} /> }
            ].map(method => (
              <button 
                key={method.id} 
                onClick={() => setOrderInfo({...orderInfo, paymentMethod: method.id as any})}
                className={cn(
                  "flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all duration-300",
                  orderInfo.paymentMethod === method.id 
                    ? "bg-primary border-primary text-black shadow-lg shadow-primary/20 scale-105" 
                    : "border-white/5 text-gray-500 bg-white/5 hover:border-white/20"
                )}
              >
                {method.icon}
                <span className="text-[9px] font-black uppercase tracking-widest">{method.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pickup Time */}
        {!isCouscousMode && (
          <div className="space-y-4">
            <p className="text-[9px] text-gray-500 uppercase font-black tracking-[0.3em] text-center italic flex items-center justify-center gap-2">
              <Clock size={12} /> Temps de retrait estimé
            </p>
            <div className="grid grid-cols-3 gap-2">
              {["15 min", "30 min", "45 min"].map(time => (
                <button 
                  key={time} 
                  onClick={() => setOrderInfo({...orderInfo, pickupTime: time})}
                  className={cn(
                    "py-3 rounded-xl border text-[10px] font-black transition-all",
                    orderInfo.pickupTime === time ? "bg-white text-black border-white" : "border-white/5 text-gray-500 hover:border-white/10"
                  )}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Client Info */}
        <div className="space-y-3">
          <div className="relative">
             <input 
              type="text" 
              value={orderInfo.name} 
              onChange={(e) => setOrderInfo({...orderInfo, name: e.target.value})} 
              placeholder="VOTRE NOM" 
              className="w-full bg-secondary border border-white/5 p-4 rounded-2xl focus:border-primary/50 outline-none transition-all text-xs font-black uppercase tracking-widest text-white placeholder:text-gray-700" 
            />
          </div>
          <div className="relative">
            <input 
              type="tel" 
              value={orderInfo.phone} 
              onChange={(e) => setOrderInfo({...orderInfo, phone: e.target.value})} 
              placeholder="NUMÉRO DE TÉLÉPHONE" 
              className="w-full bg-secondary border border-white/5 p-4 rounded-2xl focus:border-primary/50 outline-none transition-all text-xs font-black uppercase tracking-widest text-white placeholder:text-gray-700" 
            />
          </div>
          <div className="relative">
            <textarea 
              value={orderInfo.notes || ""} 
              onChange={(e) => setOrderInfo({...orderInfo, notes: e.target.value})} 
              placeholder="INSTRUCTIONS SPÉCIALES (EX: SANS OIGNONS...)" 
              className="w-full bg-secondary border border-white/5 p-4 rounded-2xl focus:border-primary/50 outline-none transition-all text-[10px] font-medium text-white placeholder:text-gray-700 h-20 resize-none"
            />
          </div>
        </div>

        {/* RGPD */}
        <div className="flex gap-4 p-5 bg-white/[0.02] rounded-3xl border border-white/5">
          <button 
            onClick={() => setRgpdAccepted(!rgpdAccepted)} 
            className={cn(
              "w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0 shadow-sm",
              rgpdAccepted ? "bg-primary border-primary text-black" : "border-gray-800 hover:border-primary/50"
            )}
          >
            {rgpdAccepted && <Check size={14} strokeWidth={4} />}
          </button>
          <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
            J&apos;autorise l&apos;utilisation de mon numéro pour la gestion de ma commande. <Link href="/legals" className="text-primary hover:underline font-black">LIRE LES MENTIONS</Link>
          </p>
        </div>
      </div>

      {/* Sticky Action Footer */}
      <div className="bg-secondary/50 backdrop-blur-xl rounded-[32px] p-6 border border-white/10 shadow-2xl space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-gray-500 text-[10px] font-black uppercase tracking-widest px-1">
            <span>Total Commande</span>
            <span>{total.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between items-center text-white text-xs font-black uppercase tracking-widest bg-white/[0.03] p-4 rounded-2xl border border-white/5">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(255,184,0,0.5)]" />
              Acompte à payer
            </span>
            <span className="text-primary text-2xl font-mono tracking-tighter">{depositAmount.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between items-center text-gray-600 text-[9px] font-bold uppercase tracking-widest px-2">
            <span>Reste à payer sur place</span>
            <span>{balanceAmount.toFixed(2)}€</span>
          </div>
        </div>

        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={onSubmit} 
          disabled={isSubmitting || !rgpdAccepted || !orderInfo.name || !orderInfo.phone} 
          className="w-full premium-gradient text-black font-black py-5 rounded-2xl shadow-2xl shadow-primary/20 flex flex-col items-center justify-center gap-1 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all"
        >
          {isSubmitting ? (
            <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <div className="flex items-center gap-3 text-xs uppercase tracking-widest">
                <CreditCard size={18} strokeWidth={3} /> Payer l&apos;acompte
              </div>
              <span className="text-[8px] opacity-70 font-bold uppercase tracking-[0.2em]">Sécurisé par SumUp</span>
            </>
          )}
        </motion.button>
      </div>
    </StepContainer>
  );
}

function Check({ size, strokeWidth }: { size: number; strokeWidth: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
