"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShoppingCart, MapPin, TrendingUp, Bell } from "lucide-react";
import { Order } from "@/types";

interface StatsCardsProps {
  readonly orders: Order[];
}

export default function StatsCards({ orders }: StatsCardsProps) {
  const activeOrders = orders.filter(o => o.status !== 'completed').length;
  const takeawayCount = orders.filter(o => o.order_type === 'takeaway' && o.status !== 'completed').length;
  const onSiteCount = orders.filter(o => o.order_type === 'on_site' && o.status !== 'completed').length;
  const dailyCA = orders.reduce((acc, o) => acc + o.total_price, 0);

  const stats = [
    { label: "Commandes Actives", value: activeOrders, icon: <Bell className="text-green-500" />, color: "border-green-500/20" },
    { label: "À Emporter", value: takeawayCount, icon: <ShoppingCart className="text-amber-500" />, color: "border-amber-500/20" },
    { label: "Sur Place", value: onSiteCount, icon: <MapPin className="text-blue-500" />, color: "border-blue-500/20" },
    { 
      label: "Chiffre d'Affaires", 
      value: `${dailyCA.toFixed(2)}€`, 
      icon: <TrendingUp className="text-green-500" />, 
      color: "border-green-500/20",
      subValue: `Frais plateforme: ${(orders.length * 0.10).toFixed(2)}€`
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
      {stats.map((s, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className={`premium-card p-6 border ${s.color} bg-white/[0.02] flex items-center gap-6 relative overflow-hidden`}
        >
          <div className="p-4 rounded-2xl bg-black/40 shadow-inner">
            {React.isValidElement(s.icon) ? React.cloneElement(s.icon as React.ReactElement<any>, { size: 24 }) : s.icon}
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">{s.label}</p>
            <p className="text-2xl font-black text-white font-mono leading-none">{s.value}</p>
            {'subValue' in s && (
              <p className="text-[7px] text-gray-600 font-bold uppercase tracking-widest mt-1.5 opacity-60">
                {s.subValue}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
