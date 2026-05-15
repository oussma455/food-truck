"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, ChefHat, Trash2, XCircle, ShoppingCart, MapPin, Printer } from "lucide-react";
import { Order, SandwichConfig } from "@/types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface OrderCardProps {
  readonly order: Order;
  readonly onNext: (order: Order) => void;
  readonly onCancel: (id: string) => void;
  readonly isReady?: boolean;
  readonly onBan: (phone: string) => void;
  readonly isKitchenMode?: boolean;
}

export default function OrderCard({ order, onNext, onCancel, isReady, onBan, isKitchenMode = false }: OrderCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (order.status === 'ready' || order.status === 'completed') {
      setTimeLeft(order.pickup_time);
      return;
    }

    const calculateTime = () => {
      const createdDate = new Date(order.created_at).getTime();
      const minutesMatch = order.pickup_time.match(/(\d+)/);
      const durationMinutes = minutesMatch ? parseInt(minutesMatch[1]) : 15;
      const targetDate = createdDate + (durationMinutes * 60 * 1000);
      const difference = targetDate - new Date().getTime();

      if (difference <= 0) {
        setIsOverdue(true);
        const absDiff = Math.abs(difference);
        const mins = Math.floor(absDiff / (1000 * 60));
        const secs = Math.floor((absDiff % (1000 * 60)) / 1000);
        setTimeLeft(`RETARD ${mins}:${secs < 10 ? '0' : ''}${secs}`);
      } else {
        setIsOverdue(false);
        const mins = Math.floor(difference / (1000 * 60));
        const secs = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [order.created_at, order.pickup_time, order.status]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) return;

    const itemsHtml = order.items.map(item => {
      const meatDisplay = (item.preset_sandwich?.id === 'p4' && item.meats) 
        ? `MIX: ${item.meats.map(m => m.name).join(' + ')}`
        : item.preset_sandwich?.name;
        
      return `
        <div style="border-bottom: 1px dashed #ccc; padding: 5px 0;">
          <strong>${item.formula?.name || 'SANDWICH'}</strong><br/>
          ${meatDisplay ? `<i>${meatDisplay}</i><br/>` : ''}
          <small>
            Sauces: ${item.sauces.map(s => s.name).join(', ')}<br/>
            ${item.removed_ingredients?.length ? `SANS: ${item.removed_ingredients.join(', ')}<br/>` : ''}
            ${item.extras?.length ? `Extras: ${item.extras.map(e => e.name).join(', ')}<br/>` : ''}
            ${item.drinks?.length ? `Boissons: ${item.drinks.map(d => `${d.option.name} x${d.quantity}`).join(', ')}<br/>` : ''}
          </small>
        </div>
      `;
    }).join('');

    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Courier New', Courier, monospace; width: 58mm; margin: 0; padding: 10px; font-size: 12px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
            .total { font-size: 16px; font-weight: bold; text-align: right; margin-top: 10px; border-top: 1px solid #000; }
            .notes { background: #eee; padding: 5px; margin-top: 10px; font-style: italic; border: 1px solid #000; }
            @media print { @page { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin:0;">GRILLADE O'CHARBON</h2>
            <p style="margin:5px 0;">ID: ${order.id}</p>
            <p style="margin:2px 0;">${new Date(order.created_at).toLocaleString()}</p>
          </div>
          <div class="client">
            <strong>Client: ${order.client_name}</strong><br/>
            Type: ${order.order_type === 'takeaway' ? 'À EMPORTER' : 'SUR PLACE'}<br/>
            Retrait: ${order.pickup_time}
          </div>
          ${order.notes ? `<div class="notes">NOTE: ${order.notes}</div>` : ''}
          <div class="items" style="margin-top:10px;">${itemsHtml}</div>
          <div class="total">TOTAL: ${order.total_price.toFixed(2)}€</div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  };

  return (
    <motion.div 
      layout 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, scale: 0.9 }} 
      className={cn(
        "premium-card border-l-4 transition-all duration-500",
        isReady ? "border-l-green-500" : "border-l-primary",
        isKitchenMode ? "p-10" : "p-6"
      )}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {order.order_type === 'takeaway' ? <ShoppingCart size={14} className="text-primary" /> : <MapPin size={14} className="text-primary" />}
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{order.order_type === 'takeaway' ? 'À Emporter' : 'Sur Place'}</span>
          </div>
          <h3 className={cn("font-black text-white italic", isKitchenMode ? "text-4xl mb-2" : "text-xl uppercase tracking-wider")}>{order.client_name}</h3>
          <p className="text-xs text-gray-500 font-mono font-bold tracking-widest">{order.client_phone}</p>
        </div>
        <div className="text-right">
          <div className={cn(
            "flex items-center justify-end gap-2 px-3 py-1 rounded-full border mb-3 transition-colors",
            isOverdue ? "text-red-500 border-red-500/30 bg-red-500/10 animate-pulse" : "text-amber-500 border-amber-500/20 bg-amber-500/5"
          )}>
            <Clock size={12} />
            <span className="text-[11px] font-black font-mono tracking-tighter">{timeLeft}</span>
          </div>
          <div className="text-[10px] text-gray-600 font-black uppercase tracking-widest">{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        {order.items.map((item, idx) => (
          <div key={idx} className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center mb-2">
              <span className={cn("text-primary font-black uppercase tracking-widest", isKitchenMode ? "text-sm" : "text-[9px]")}>{item.formula?.name}</span>
              <span className={cn("text-white font-black", isKitchenMode ? "text-2xl" : "text-sm")}>{item.preset_sandwich?.name}</span>
            </div>
            {item.preset_sandwich?.id === 'p4' && item.meats && (
              <p className={cn("text-primary/70 font-black italic mb-2", isKitchenMode ? "text-xl" : "text-[10px]")}>
                ({item.meats.map(m => m.name).join(' + ')})
              </p>
            )}
            <div className="flex flex-wrap gap-2">
               {item.sauces.map(s => <span key={s.id} className="text-[9px] bg-white/5 text-gray-400 px-2 py-0.5 rounded-full uppercase font-bold">{s.name}</span>)}
               {item.removed_ingredients?.map(ing => <span key={ing} className="text-[9px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full uppercase font-black">SANS {ing}</span>)}
               {item.extras?.map(e => <span key={e.id} className="text-[9px] bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase font-black">+{e.name}</span>)}
            </div>
          </div>
        ))}
      </div>

      {order.notes && (
        <div className="mb-8 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
          <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest mb-1 italic">Note client :</p>
          <p className="text-sm text-gray-200 font-medium italic">&quot;{order.notes}&quot;</p>
        </div>
      )}

      <div className="flex justify-between items-center pt-6 border-t border-white/5">
        <div className="flex gap-2">
          <button onClick={handlePrint} className="p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-primary transition-all shadow-lg hover:border-primary/50 group" title="Imprimer Ticket">
            <Printer size={20} className="group-hover:scale-110 transition-transform" />
          </button>
          {!isKitchenMode && (
            <button 
              onClick={() => { if(window.confirm(`Bannir ${order.client_phone} ?`)) onBan(order.client_phone); }}
              className="px-3 py-1 text-[9px] font-black text-red-500/40 hover:text-red-500 uppercase tracking-widest border border-red-500/10 hover:border-red-500/40 rounded-xl transition-all"
            >
              Bannir
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={() => onCancel(order.id)} className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-red-500/40 hover:text-red-500 transition-all">
            <XCircle size={20} />
          </button>
          <button 
            onClick={() => onNext(order)}
            className={cn(
              "px-8 py-3 rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl",
              order.status === 'pending' ? "bg-primary text-black" : 
              order.status === 'preparing' ? "bg-green-500 text-white" : "bg-gray-800 text-gray-400"
            )}
          >
            {order.status === 'pending' ? 'Lancer' : order.status === 'preparing' ? 'Prêt' : 'Archiver'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
