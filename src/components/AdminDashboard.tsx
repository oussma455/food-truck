"use client";

import React, { useState, useEffect } from "react";
import { Order, Category } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChefHat, Bell, LogOut, Trash2, XCircle, PhoneCall, Plus, ShoppingCart, MapPin, TrendingUp, DollarSign, Package } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import ManualOrderModal from "./ManualOrderModal";
import { SANDWICH_CATEGORIES } from "@/lib/data";

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
      drinks: [],
      desserts: [],
    },
    total_price: 18,
    status: "pending",
    payment_status: "paid",
    payment_method: "online",
    order_type: "takeaway",
    pickup_time: "15 min",
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
      drinks: [],
      desserts: [],
    },
    total_price: 14,
    status: "preparing",
    payment_status: "unpaid",
    payment_method: "on_site",
    order_type: "on_site",
    pickup_time: "Dès que possible",
    created_at: new Date().toISOString(),
  },
];

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isKitchenMode, setIsKitchenMode] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'stats'>('orders');
  const [editableMenu, setEditableMenu] = useState<Category[]>(SANDWICH_CATEGORIES);

  useEffect(() => {
    const status = localStorage.getItem("truck_status");
    setIsOpen(status !== "closed");
    
    const savedMenu = localStorage.getItem("truck_menu");
    if (savedMenu) {
      setEditableMenu(JSON.parse(savedMenu));
    }
  }, []);

  const saveMenu = (newMenu: Category[]) => {
    setEditableMenu(newMenu);
    localStorage.setItem("truck_menu", JSON.stringify(newMenu));
  };

  const addItem = (catIdx: number) => {
    const newMenu = [...editableMenu];
    const newId = Math.random().toString(36).substr(2, 5).toUpperCase();
    newMenu[catIdx].options.push({
      id: newId,
      name: "NOUVEAU PRODUIT",
      price: 0
    });
    saveMenu(newMenu);
  };

  const deleteItem = (catIdx: number, optIdx: number) => {
    if (window.confirm("Supprimer cet article ?")) {
      const newMenu = [...editableMenu];
      newMenu[catIdx].options.splice(optIdx, 1);
      saveMenu(newMenu);
    }
  };

  const calculateStats = () => {
    const totalRevenue = orders.reduce((acc, o) => acc + o.total_price, 0);
    const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'ready').length;
    const averageOrder = orders.length > 0 ? totalRevenue / orders.length : 0;
    
    return { totalRevenue, completedOrders, averageOrder };
  };

  const stats = calculateStats();

  const toggleTruckStatus = () => {
    const newStatus = !isOpen ? "open" : "closed";
    localStorage.setItem("truck_status", newStatus);
    setIsOpen(!isOpen);
  };

  const updateStatus = (id: string, newStatus: Order["status"]) => {
    setOrders(orders.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
  };

  const handleOrderCreated = (newOrder: Order) => {
    setOrders([newOrder, ...orders]);
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
      alert(`Le numéro ${phone} a été banni.`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    window.location.reload();
  };

  return (
    <div className={cn("min-h-screen bg-[#050505] text-white transition-all", isKitchenMode ? "p-2" : "p-4 md:p-8")}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-gray-800 pb-6">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary italic">Gourmet Admin</h1>
            <div className="flex items-center gap-2 mt-2">
              <button onClick={() => setActiveTab('orders')} className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all", activeTab === 'orders' ? "bg-primary text-background border-primary" : "border-gray-800 text-gray-500 hover:text-white")}>Direct</button>
              <button onClick={() => setActiveTab('menu')} className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all", activeTab === 'menu' ? "bg-primary text-background border-primary" : "border-gray-800 text-gray-500 hover:text-white")}>Menu</button>
              <button onClick={() => setActiveTab('stats')} className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all", activeTab === 'stats' ? "bg-primary text-background border-primary" : "border-gray-800 text-gray-500 hover:text-white")}>Stats</button>
            </div>
          </div>

          <button onClick={toggleTruckStatus} className={cn("px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-lg", isOpen ? "bg-green-600 text-white animate-pulse" : "bg-red-600 text-white")}>
            <div className={cn("w-2 h-2 rounded-full bg-white", isOpen && "animate-ping")} />
            {isOpen ? "Truck Ouvert" : "Truck Fermé"}
          </button>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <button onClick={() => setIsKitchenMode(!isKitchenMode)} className={cn("hidden md:flex p-3 rounded-xl border transition-all", isKitchenMode ? "bg-white text-black border-white" : "border-gray-800 text-gray-500 hover:text-white")}>
            <ChefHat size={20} />
          </button>
          <button onClick={() => setIsOrderModalOpen(true)} className="flex-1 md:flex-none premium-gradient text-background px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all">
            <PhoneCall size={16} /> Prendre Commande
          </button>
          <button onClick={handleLogout} className="text-gray-600 hover:text-red-500 transition-all p-3"><LogOut size={20} /></button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'orders' && (
          <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className={cn("grid gap-8", isKitchenMode ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 lg:grid-cols-3")}>
              <OrderColumn title="À Faire" color="text-amber-500" orders={orders.filter(o => o.status === 'pending')} status="pending" updateStatus={updateStatus} cancelOrder={cancelOrder} isKitchenMode={isKitchenMode} onBlacklist={addToBlacklist} />
              <OrderColumn title="En Cuisine" color="text-blue-500" orders={orders.filter(o => o.status === 'preparing')} status="preparing" updateStatus={updateStatus} cancelOrder={cancelOrder} isKitchenMode={isKitchenMode} onBlacklist={addToBlacklist} />
              <OrderColumn title="Prêt" color="text-green-500" orders={orders.filter(o => o.status === 'ready')} status="ready" updateStatus={updateStatus} cancelOrder={cancelOrder} isKitchenMode={isKitchenMode} onBlacklist={addToBlacklist} />
            </div>
          </motion.div>
        )}

        {activeTab === 'menu' && (
          <motion.div key="menu" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-4xl mx-auto space-y-6 pb-20">
            {editableMenu.map((cat, catIdx) => (
              <div key={cat.id} className="premium-card p-6 bg-secondary/5 border-gray-800/50">
                <h3 className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-6 flex items-center justify-between">
                  <span className="flex items-center gap-2"><Package size={14} /> {cat.name}</span>
                  <button 
                    onClick={() => addItem(catIdx)}
                    className="bg-primary/10 hover:bg-primary/20 text-primary p-2 rounded-lg transition-all flex items-center gap-2 text-[8px] border border-primary/20"
                  >
                    <Plus size={12} /> Ajouter
                  </button>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {cat.options.map((opt, optIdx) => (
                    <div key={opt.id} className="flex items-center gap-3 bg-black/40 p-3 rounded-xl border border-gray-800/50 group hover:border-primary/30 transition-all">
                      <input 
                        type="text" 
                        value={opt.name} 
                        onChange={(e) => {
                          const newMenu = [...editableMenu];
                          newMenu[catIdx].options[optIdx].name = e.target.value;
                          saveMenu(newMenu);
                        }}
                        className="bg-transparent border-none outline-none text-gray-300 text-xs font-bold flex-1"
                      />
                      <div className="flex items-center gap-1 bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20">
                        <input 
                          type="number" 
                          step="0.1"
                          value={opt.price} 
                          onChange={(e) => {
                            const newMenu = [...editableMenu];
                            newMenu[catIdx].options[optIdx].price = parseFloat(e.target.value);
                            saveMenu(newMenu);
                          }}
                          className="bg-transparent border-none outline-none text-primary text-xs font-mono w-12 text-right"
                        />
                        <span className="text-primary text-[10px] font-bold">€</span>
                      </div>
                      <button 
                        onClick={() => deleteItem(catIdx, optIdx)}
                        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-500 transition-all p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'stats' && (
          <motion.div key="stats" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="max-w-5xl mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard icon={<DollarSign className="text-primary" />} label="CA Global" value={stats.totalRevenue.toFixed(2) + "€"} color="border-primary" />
              <StatCard icon={<Package className="text-blue-500" />} label="Commandes" value={stats.completedOrders.toString()} color="border-blue-500" />
              <StatCard icon={<TrendingUp className="text-amber-500" />} label="Panier Moyen" value={stats.averageOrder.toFixed(2) + "€"} color="border-amber-500" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ManualOrderModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} onOrderCreated={handleOrderCreated} />
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  return (
    <div className={cn("premium-card p-8 bg-secondary/10 flex flex-col items-center text-center border-b-4", color)}>
      <div className="p-4 bg-white/5 rounded-2xl mb-4">{icon}</div>
      <p className="text-gray-500 uppercase text-[9px] font-black tracking-[0.3em] mb-2">{label}</p>
      <p className="text-4xl font-serif font-black">{value}</p>
    </div>
  );
}

function OrderColumn({ title, color, orders, status, updateStatus, cancelOrder, isKitchenMode, onBlacklist }: any) {
  return (
    <div className="space-y-4">
      <h2 className={cn("text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2 mb-6", color)}>
        {status === 'pending' && <Clock size={16} />}
        {status === 'preparing' && <ChefHat size={16} />}
        {status === 'ready' && <Bell size={16} />}
        {title} ({orders.length})
      </h2>
      <div className="space-y-4">
        <AnimatePresence>
          {orders.map((order: Order) => (
            <OrderCard key={order.id} order={order} isKitchenMode={isKitchenMode} onNext={() => updateStatus(order.id, status === 'pending' ? 'preparing' : status === 'preparing' ? 'ready' : 'completed')} onCancel={() => cancelOrder(order.id)} onBlacklist={onBlacklist} isReady={status === 'ready'} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function OrderCard({ order, onNext, onCancel, isReady, onBlacklist, isKitchenMode = false }: any) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={cn("premium-card border-l-4 border-l-primary bg-secondary/10 transition-all", isKitchenMode ? "p-8" : "p-5")}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {order.order_type === 'takeaway' ? <ShoppingCart size={12} className="text-primary" /> : <MapPin size={12} className="text-primary" />}
            <span className="text-[9px] font-black uppercase tracking-widest text-primary">{order.order_type === 'takeaway' ? 'À Emporter' : 'Sur Place'}</span>
          </div>
          <h3 className={cn("font-bold text-white", isKitchenMode ? "text-2xl" : "text-sm uppercase tracking-wider")}>{order.client_name}</h3>
          <p className="text-[10px] text-gray-500 font-mono mt-0.5">{order.client_phone}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-1 text-amber-500 mb-2">
            <Clock size={10} />
            <span className="text-[9px] font-black uppercase tracking-tighter">{order.pickup_time}</span>
          </div>
          {!isKitchenMode && (
            <div className={cn("text-[8px] font-black px-2 py-0.5 rounded-full border inline-block tracking-widest", order.payment_status === "paid" ? "bg-green-500/10 text-green-500 border-green-500/30" : "bg-red-500/10 text-red-500 border-red-500/30")}>
              {order.payment_status === "paid" ? "PAYÉ" : "À PAYER"}
            </div>
          )}
        </div>
      </div>

      <div className={cn("bg-black/60 rounded-xl mb-4 space-y-2 border border-gray-800/50", isKitchenMode ? "p-6" : "p-3")}>
        {order.config.formula && (
           <div className="flex justify-between items-center pb-2 mb-1 border-b border-gray-800/30">
           <span className="text-primary font-black uppercase tracking-widest text-[8px]">Formule</span>
           <span className="text-white font-bold text-[10px]">{order.config.formula.name}</span>
         </div>
        )}
        <div className="flex justify-between items-center">
          <span className={cn("text-primary font-black uppercase tracking-widest", isKitchenMode ? "text-sm" : "text-[8px]")}>Pain</span>
          <span className={cn("text-gray-300 font-bold", isKitchenMode ? "text-xl" : "text-[10px]")}>{order.config.bread?.name}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className={cn("text-primary font-black uppercase tracking-widest", isKitchenMode ? "text-sm" : "text-[8px]")}>Viande</span>
          <span className={cn("text-white font-black", isKitchenMode ? "text-2xl" : "text-[10px]")}>{order.config.meat?.name}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className={cn("text-primary font-black uppercase tracking-widest", isKitchenMode ? "text-sm" : "text-[8px]")}>Sauces</span>
          <span className={cn("text-gray-300 text-right font-bold", isKitchenMode ? "text-lg" : "text-[10px]")}>{order.config.sauces.map((s: any) => s.name).join(", ")}</span>
        </div>
        {order.config.drinks && order.config.drinks.length > 0 && (
          <div className="flex justify-between items-center">
            <span className={cn("text-primary font-black uppercase tracking-widest", isKitchenMode ? "text-sm" : "text-[8px]")}>Boissons</span>
            <span className={cn("text-gray-300 text-right font-bold", isKitchenMode ? "text-lg" : "text-[10px]")}>{order.config.drinks.map((d: any) => `${d.option.name} x${d.quantity}`).join(", ")}</span>
          </div>
        )}
        {order.config.desserts && order.config.desserts.length > 0 && (
          <div className="flex justify-between items-center">
            <span className={cn("text-primary font-black uppercase tracking-widest", isKitchenMode ? "text-sm" : "text-[8px]")}>Desserts</span>
            <span className={cn("text-gray-300 text-right font-bold", isKitchenMode ? "text-lg" : "text-[10px]")}>{order.config.desserts.map((d: any) => `${d.option.name} x${d.quantity}`).join(", ")}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-2">
        {!isKitchenMode && (
          <div className="flex flex-col">
            <span className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Total</span>
            <span className="text-lg font-black text-primary">{order.total_price.toFixed(2)}€</span>
          </div>
        )}
        <div className={cn("flex gap-2", isKitchenMode && "w-full")}>
          {!isReady && (
            <button onClick={onCancel} className="p-2.5 rounded-lg border border-gray-800 text-gray-600 hover:text-red-500 hover:border-red-500/30 transition-all"><XCircle size={16} /></button>
          )}
          <button onClick={onNext} className={cn("rounded-lg font-black uppercase tracking-[0.2em] transition-all flex-1", isKitchenMode ? "py-5 text-xl" : "px-5 py-2.5 text-[9px]", isReady ? "bg-white text-black hover:bg-gray-200" : "premium-gradient text-background hover:scale-[1.02] shadow-lg shadow-primary/10")}>
            {order.status === 'pending' ? 'Lancer' : order.status === 'preparing' ? 'Prêt' : 'Archiver'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
