"use client";

import React, { useState } from "react";
import { Order } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, ChefHat, Bell, LogOut } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MOCK_ORDERS: Order[] = [
  {
    id: "1",
    client_name: "Jean D.",
    client_phone: "0601020304",
    config: {
      bread: { id: "b2", name: "Pain Brioché", price: 1.5 },
      meat: { id: "m1", name: "Bœuf Effiloché (12h)", price: 5 },
      sauces: [{ id: "s1", name: "Maison Truffée", price: 0.5 }],
      extras: [{ id: "e1", name: "Cheddar Fondu", price: 1 }],
    },
    total_price: 18,
    status: "pending",
    payment_status: "paid",
    payment_method: "online",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    client_name: "Marie L.",
    client_phone: "0611223344",
    config: {
      bread: { id: "b1", name: "Baguette Tradition", price: 0 },
      meat: { id: "m2", name: "Poulet Mariné", price: 4 },
      sauces: [{ id: "s2", name: "Algérienne", price: 0 }],
      extras: [],
    },
    total_price: 14,
    status: "preparing",
    payment_status: "unpaid",
    payment_method: "on_site",
    created_at: new Date().toISOString(),
  },
];

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);

  const updateStatus = (id: string, newStatus: Order["status"]) => {
    setOrders(
      orders.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8">
      <header className="flex justify-between items-center mb-8 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">
            Gourmet Admin
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <div className="bg-primary/10 border border-primary/30 px-3 py-1 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Live Orders</span>
            </div>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="text-gray-500 hover:text-white transition-colors flex items-center gap-2 text-sm"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* À Faire */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-amber-500 flex items-center gap-2 mb-6">
            <Clock size={16} />
            À Faire ({orders.filter((o) => o.status === "pending").length})
          </h2>
          <AnimatePresence>
            {orders
              .filter((o) => o.status === "pending")
              .map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onNext={() => updateStatus(order.id, "preparing")}
                />
              ))}
          </AnimatePresence>
        </div>

        {/* En Préparation */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-blue-500 flex items-center gap-2 mb-6">
            <ChefHat size={16} />
            En Cuisine ({orders.filter((o) => o.status === "preparing").length})
          </h2>
          <AnimatePresence>
            {orders
              .filter((o) => o.status === "preparing")
              .map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onNext={() => updateStatus(order.id, "ready")}
                />
              ))}
          </AnimatePresence>
        </div>

        {/* Prêt */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-green-500 flex items-center gap-2 mb-6">
            <Bell size={16} />
            Prêt ({orders.filter((o) => o.status === "ready").length})
          </h2>
          <AnimatePresence>
            {orders
              .filter((o) => o.status === "ready")
              .map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onNext={() => updateStatus(order.id, "completed")}
                  isReady
                />
              ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function OrderCard({
  order,
  onNext,
  isReady,
}: {
  order: Order;
  onNext: () => void;
  isReady?: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="premium-card p-6 border-l-4 border-l-primary bg-secondary/20"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">{order.client_name}</h3>
          <p className="text-xs text-gray-500 font-mono tracking-tighter">{order.client_phone}</p>
        </div>
        <div
          className={cn(
            "text-[10px] font-bold px-3 py-1 rounded-full border",
            order.payment_status === "paid"
              ? "bg-green-500/10 text-green-500 border-green-500/30"
              : "bg-red-500/10 text-red-500 border-red-500/30"
          )}
        >
          {order.payment_status === "paid" ? "PAYÉ" : "À PAYER"}
        </div>
      </div>

      <div className="bg-black/60 rounded-xl p-4 mb-5 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-primary font-bold uppercase tracking-widest">Pain</span>
          <span className="text-gray-300">{order.config.bread?.name}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-primary font-bold uppercase tracking-widest">Viande</span>
          <span className="text-gray-300">{order.config.meat?.name}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-primary font-bold uppercase tracking-widest">Sauces</span>
          <span className="text-gray-300 text-right max-w-[120px]">{order.config.sauces.map((s) => s.name).join(", ")}</span>
        </div>
        {order.config.extras.length > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-primary font-bold uppercase tracking-widest">Extras</span>
            <span className="text-gray-300 text-right max-w-[120px]">{order.config.extras.map((e) => e.name).join(", ")}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-2">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Total</span>
          <span className="text-xl font-bold text-primary">{order.total_price.toFixed(2)}€</span>
        </div>
        <button
          onClick={onNext}
          className={cn(
            "px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all",
            isReady
              ? "bg-white text-black hover:bg-gray-200"
              : "premium-gradient text-background hover:scale-105 shadow-lg shadow-primary/10"
          )}
        >
          {order.status === "pending" && "Lancer"}
          {order.status === "preparing" && "Prêt !"}
          {order.status === "ready" && "Terminé"}
        </button>
      </div>
    </motion.div>
  );
}
