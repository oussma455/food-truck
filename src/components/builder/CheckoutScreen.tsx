"use client";

import React from "react";
import { motion } from "framer-motion";
import { CreditCard, UtensilsCrossed, Wallet, Trash2, ShieldCheck, Clock, Plus } from "lucide-react";
import { SandwichConfig, PaymentMethod } from "@/types";
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
  readonly onRemoveCartItem?: (index: number) => void;
  readonly isCouscousMode: boolean;
}

export default function CheckoutScreen({ 
  orderInfo, setOrderInfo, cart, currentConfig, 
  calculateTotal, rgpdAccepted, setRgpdAccepted, 
  isSubmitting, onSubmit, onAddAnother, onRemoveCartItem, isCouscousMode 
}: CheckoutScreenProps) {
  const allItems = [...cart, currentConfig].filter(i => i.formula);
  const total = calculateTotal();
  const requiresDeposit = total >= 20;
  const depositRate = isCouscousMode ? 0.50 : 0.30;
  const depositAmount = requiresDeposit ? total * depositRate : 0;

  return (
    <StepContainer title="Résumé" subtitle="Finalisez votre commande">
      <div className="space-y-4 mb-6 mt-2 overflow-y-auto max-h-[55vh] pr-1 custom-scrollbar">
        
        {/* Security Banner */}
        <div className={cn(
          "border p-3 rounded-2xl flex items-center gap-3",
          requiresDeposit ? "bg-green-500/[0.03] border-green-500/20" : "bg-white/[0.03] border-white/10"
        )}>
          <ShieldCheck className={cn("shrink-0", requiresDeposit ? "text-green-500" : "text-gray-400")} size={16} />
          <p className="text-[9px] text-gray-400 leading-tight font-medium">
            {requiresDeposit 
              ? <>Acompte de <span className="text-green-500 font-black">{isCouscousMode ? "50%" : "30%"}</span> via SumUp (Panier {">"} 20€). Solde au camion.</>
              : "Aucun acompte requis pour cette commande. Paiement total au camion."}
          </p>
        </div>

        {/* Basket Recap */}
        <div className="bg-secondary/40 p-4 rounded-2xl border border-white/5 space-y-3">
          <div className="flex justify-between items-center pb-1.5 border-b border-white/5">
            <h4 className="text-[9px] text-primary font-black uppercase tracking-widest">Votre Panier ({allItems.length})</h4>
            {!isCouscousMode && (
              <button onClick={onAddAnother} className="text-[9px] text-green-500 hover:text-green-400 font-black uppercase tracking-widest transition-colors flex items-center gap-1">
                <Plus size={10} strokeWidth={4} /> Ajouter un autre sandwich
              </button>
            )}
          </div>
          <div className="space-y-3">
            {cart.map((item, idx) => (
              <div key={idx} className="group relative bg-white/[0.02] p-2 rounded-xl border border-white/5">
                <button 
                  onClick={() => onRemoveCartItem?.(idx)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={10} />
                </button>
                <p className="text-[10px] text-white font-black uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary" />
                  {item.formula?.name}
                </p>
                {item.preset_sandwich && (
                  <p className="text-[8px] text-gray-500 ml-3 italic font-medium leading-none mt-1">
                    {item.preset_sandwich.name} 
                    {item.meats && ` (${item.meats.map(m => m.name).join('+')})`}
                  </p>
                )}
              </div>
            ))}
            {currentConfig.formula && (
              <div className="group relative bg-primary/[0.02] p-2 rounded-xl border border-primary/10">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-white font-black uppercase tracking-wider flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                    {currentConfig.formula.name}
                  </p>
                  <span className="text-[7px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-black uppercase">En cours</span>
                </div>
                {currentConfig.preset_sandwich && (
                  <p className="text-[8px] text-gray-500 ml-3 italic font-medium leading-none mt-1">
                    {currentConfig.preset_sandwich.name}
                    {currentConfig.meats && ` (${currentConfig.meats.map(m => m.name).join('+')})`}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-2">
          <p className="text-[8px] text-gray-500 uppercase font-black tracking-[0.2em] text-center opacity-60">Règlement préféré au camion</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'card', name: 'CB', icon: <CreditCard size={14} /> },
              { id: 'resto_card', name: 'Titre Resto', icon: <UtensilsCrossed size={14} /> },
              { id: 'cash', name: 'ESP', icon: <Wallet size={14} /> }
            ].map(method => (
              <button 
                key={method.id} 
                onClick={() => setOrderInfo({...orderInfo, paymentMethod: method.id as any})}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all",
                  orderInfo.paymentMethod === method.id 
                    ? "bg-primary border-primary text-black shadow-lg shadow-primary/10" 
                    : "border-white/5 text-gray-500 bg-white/5"
                )}
              >
                {method.icon}
                <span className="text-[8px] font-black uppercase leading-none">{method.name}</span>
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
        <div className="space-y-2">
          <input 
            type="text" 
            value={orderInfo.name} 
            onChange={(e) => setOrderInfo({...orderInfo, name: e.target.value})} 
            placeholder="VOTRE NOM" 
            className="w-full bg-secondary border border-white/5 p-3 rounded-xl focus:border-primary/50 outline-none text-[10px] font-black uppercase tracking-widest text-white placeholder:text-gray-700" 
          />
          <input 
            type="tel" 
            value={orderInfo.phone} 
            onChange={(e) => setOrderInfo({...orderInfo, phone: e.target.value})} 
            placeholder="TÉLÉPHONE" 
            className="w-full bg-secondary border border-white/5 p-3 rounded-xl focus:border-primary/50 outline-none text-[10px] font-black uppercase tracking-widest text-white placeholder:text-gray-700" 
          />
          <textarea 
            value={orderInfo.notes || ""} 
            onChange={(e) => setOrderInfo({...orderInfo, notes: e.target.value})} 
            placeholder="INSTRUCTIONS (SANS OIGNONS...)" 
            className="w-full bg-secondary border border-white/5 p-3 rounded-xl focus:border-primary/50 outline-none text-[9px] font-medium text-white placeholder:text-gray-700 h-14 resize-none"
          />
        </div>

        {/* RGPD */}
        <div className="flex gap-3 p-3 bg-white/[0.02] rounded-2xl border border-white/5 items-start">
          <button 
            onClick={() => setRgpdAccepted(!rgpdAccepted)} 
            className={cn(
              "w-5 h-5 rounded border flex items-center justify-center transition-all shrink-0 mt-0.5",
              rgpdAccepted ? "bg-primary border-primary text-black" : "border-gray-800"
            )}
          >
            {rgpdAccepted && <Check size={12} strokeWidth={4} />}
          </button>
          <p className="text-[8px] text-gray-600 leading-tight">
            J&apos;autorise l&apos;utilisation de mon numéro. <Link href="/legals" className="text-primary hover:underline font-black">MENTIONS</Link>
          </p>
        </div>
      </div>

      {/* Sticky Action Footer */}
      <div className="bg-secondary/50 backdrop-blur-xl rounded-3xl p-4 border border-white/10 shadow-2xl space-y-3">
        <div className="flex justify-between items-center text-white text-[10px] font-black uppercase tracking-widest bg-white/[0.03] p-3 rounded-xl border border-white/5">
          <span className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            Acompte SumUp
          </span>
          <span className="text-green-500 text-xl font-mono tracking-tighter">{depositAmount.toFixed(2)}€</span>
        </div>

        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={onSubmit} 
          disabled={isSubmitting || !rgpdAccepted || !orderInfo.name || !orderInfo.phone} 
          className="w-full bg-green-500 text-black font-black py-4 rounded-xl shadow-2xl shadow-green-500/20 flex flex-col items-center justify-center gap-0.5 disabled:opacity-30 transition-all"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest">
                <CreditCard size={14} strokeWidth={3} /> {requiresDeposit ? "PAYER L'ACOMPTE" : "CONFIRMER MA COMMANDE"}
              </div>
              <span className="text-[7px] opacity-60 font-bold uppercase tracking-[0.1em]">{requiresDeposit ? "Sécurisation SumUp" : "Paiement au camion"}</span>
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
