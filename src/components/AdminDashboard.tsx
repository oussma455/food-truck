"use client";

import React, { useState } from "react";
import { Order } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChefHat, Bell, LogOut, Trash2, XCircle, CheckCircle2, PhoneCall, Plus } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import ManualOrderModal from "./ManualOrderModal";

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
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isKitchenMode, setIsKitchenMode] = useState(false);

  const playNotificationSound = () => {
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    audio.play().catch(e => console.log("Audio play blocked"));
  };

  const updateStatus = (id: string, newStatus: Order["status"]) => {
    setOrders(
      orders.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
    );
  };

  const handleOrderCreated = (newOrder: Order) => {
    setOrders([newOrder, ...orders]);
    playNotificationSound();
  };

  const cancelOrder = (id: string) => {
    if (window.confirm("Voulez-vous vraiment annuler cette commande ?")) {
      setOrders(orders.filter(o => o.id !== id));
    }
  };

  const addToBlacklist = (phone: string) => {
    const current = JSON.parse(localStorage.getItem("blacklisted_phones") || "[]");
    if (!current.includes(phone)) {
      localStorage.setItem("blacklisted_phones", JSON.stringify([...current, phone]));
      alert(`Le numéro ${phone} a été banni des commandes sur place.`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    window.location.reload();
  };

  return (
    <div className={cn("min-h-screen bg-[#050505] text-white p-4 md:p-8 transition-all", isKitchenMode ? "p-2" : "p-4 md:p-8")}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">
            Gourmet Admin
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <div className="bg-primary/10 border border-primary/30 px-3 py-1 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Live Orders</span>
            </div>
            <button 
              onClick={() => setIsKitchenMode(!isKitchenMode)}
              className={cn(
                "text-[10px] font-bold px-3 py-1 rounded-full border transition-all uppercase tracking-widest",
                isKitchenMode ? "bg-white text-black border-white" : "border-gray-700 text-gray-500 hover:text-white"
              )}
            >
              {isKitchenMode ? "Mode Standard" : "Mode Cuisine"}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            onClick={() => setIsOrderModalOpen(true)}
            className="flex-1 md:flex-none premium-gradient text-background px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
            <PhoneCall size={18} />
            Prendre Commande
          </button>
          
          <button 
            onClick={handleLogout}
            className="text-gray-500 hover:text-white transition-colors flex items-center gap-2 text-sm ml-auto"
          >
            <LogOut size={18} />
            <span className="hidden md:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      <div className={cn(
        "grid gap-8",
        isKitchenMode ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 lg:grid-cols-3"
      )}>
        {/* À Faire */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-amber-500 flex items-center gap-2 mb-6">
            <Clock size={16} />
            À Faire ({orders.filter((o) => o.status === "pending").length})
          </h2>
          <div className="space-y-4">
            <AnimatePresence>
              {orders
                .filter((o) => o.status === "pending")
                .map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    isKitchenMode={isKitchenMode}
                    onNext={() => updateStatus(order.id, "preparing")}
                    onCancel={() => cancelOrder(order.id)}
                    onBlacklist={addToBlacklist}
                  />
                ))}
            </AnimatePresence>
          </div>
        </div>

        {/* En Préparation */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-blue-500 flex items-center gap-2 mb-6">
            <ChefHat size={16} />
            En Cuisine ({orders.filter((o) => o.status === "preparing").length})
          </h2>
          <div className="space-y-4">
            <AnimatePresence>
              {orders
                .filter((o) => o.status === "preparing")
                .map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    isKitchenMode={isKitchenMode}
                    onNext={() => updateStatus(order.id, "ready")}
                    onCancel={() => cancelOrder(order.id)}
                    onBlacklist={addToBlacklist}
                  />
                ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Prêt */}
        {!isKitchenMode && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-green-500 flex items-center gap-2 mb-6">
              <Bell size={16} />
              Prêt ({orders.filter((o) => o.status === "ready").length})
            </h2>
            <div className="space-y-4">
              <AnimatePresence>
                {orders
                  .filter((o) => o.status === "ready")
                  .map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onNext={() => updateStatus(order.id, "completed")}
                      onCancel={() => cancelOrder(order.id)}
                      onBlacklist={addToBlacklist}
                      isReady
                    />
                  ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      <ManualOrderModal 
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onOrderCreated={handleOrderCreated}
      />
    </div>
  );
}

function OrderCard({
  order,
  onNext,
  onCancel,
  isReady,
  onBlacklist,
  isKitchenMode = false,
}: {
  order: Order;
  onNext: () => void;
  onCancel: () => void;
  isReady?: boolean;
  onBlacklist: (phone: string) => void;
  isKitchenMode?: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "premium-card border-l-4 border-l-primary bg-secondary/20 transition-all",
        isKitchenMode ? "p-8" : "p-6"
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className={cn("font-bold text-white", isKitchenMode ? "text-2xl" : "text-lg")}>{order.client_name}</h3>
          <p className="text-xs text-gray-500 font-mono tracking-tighter">{order.client_phone}</p>
        </div>
        {!isKitchenMode && (
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
        )}
      </div>

      <div className={cn("bg-black/60 rounded-xl mb-5 space-y-2", isKitchenMode ? "p-6" : "p-4")}>
        <div className="flex justify-between items-center">
          <span className={cn("text-primary font-bold uppercase tracking-widest", isKitchenMode ? "text-sm" : "text-[10px]")}>Pain</span>
          <span className={cn("text-gray-300", isKitchenMode ? "text-xl font-bold" : "text-xs")}>{order.config.bread?.name}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className={cn("text-primary font-bold uppercase tracking-widest", isKitchenMode ? "text-sm" : "text-[10px]")}>Viande</span>
          <span className={cn("text-white font-black", isKitchenMode ? "text-2xl" : "text-xs")}>{order.config.meat?.name}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className={cn("text-primary font-bold uppercase tracking-widest", isKitchenMode ? "text-sm" : "text-[10px]")}>Sauces</span>
          <span className={cn("text-gray-300 text-right", isKitchenMode ? "text-lg" : "text-xs")}>{order.config.sauces.map((s) => s.name).join(", ")}</span>
        </div>
        {order.config.extras.length > 0 && (
          <div className="flex justify-between items-center">
            <span className={cn("text-primary font-bold uppercase tracking-widest", isKitchenMode ? "text-sm" : "text-[10px]")}>Extras</span>
            <span className={cn("text-amber-400 font-bold text-right", isKitchenMode ? "text-lg" : "text-xs")}>{order.config.extras.map((e) => e.name).join(", ")}</span>
          </div>
        )}
        {order.config.drinks && order.config.drinks.length > 0 && (
          <div className="flex justify-between items-center">
            <span className={cn("text-primary font-bold uppercase tracking-widest", isKitchenMode ? "text-sm" : "text-[10px]")}>Boissons</span>
            <span className={cn("text-gray-300 text-right", isKitchenMode ? "text-lg" : "text-xs")}>{order.config.drinks.map((d) => d.name).join(", ")}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-2">
        {!isKitchenMode && (
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Total</span>
            <span className="text-xl font-bold text-primary">{order.total_price.toFixed(2)}€</span>
          </div>
        )}
        <div className={cn("flex gap-2", isKitchenMode && "w-full")}>
          <button
            onClick={onCancel}
            className="p-3 rounded-xl border border-gray-700 text-gray-500 hover:text-white hover:border-white transition-all"
            title="Annuler la commande"
          >
            <XCircle size={18} />
          </button>

          {order.payment_status === "unpaid" && !isKitchenMode && (
            <button
              onClick={() => onBlacklist(order.client_phone)}
              className="p-3 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all group relative"
            >
              <Trash2 size={18} />
            </button>
          )}

          <button
            onClick={onNext}
            className={cn(
              "rounded-xl font-bold uppercase tracking-widest transition-all",
              isKitchenMode ? "flex-1 py-6 text-xl" : "px-6 py-3 text-xs",
              isReady
                ? "bg-white text-black hover:bg-gray-200"
                : "premium-gradient text-background hover:scale-105 shadow-lg shadow-primary/10"
            )}
          >
            {order.status === "pending" && (isKitchenMode ? "Commencer" : "Lancer")}
            {order.status === "preparing" && (isKitchenMode ? "Terminer" : "Prêt !")}
            {order.status === "ready" && "Archiver"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
