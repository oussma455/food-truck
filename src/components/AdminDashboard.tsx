"use client";

import React, { useState, useEffect } from "react";
import { Order, Category, Option } from "@/types";
import { SANDWICH_CATEGORIES } from "@/lib/data";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, ChefHat, LogOut, Plus, 
  LayoutDashboard, Database, AlertTriangle, X
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import ManualOrderModal from "./ManualOrderModal";
import OrderCard from "./admin/OrderCard";
import StatsCards from "./admin/StatsCards";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type AdminTab = 'pending' | 'preparing' | 'ready' | 'archive' | 'stock';

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [waitTime, setWaitTime] = useState("15 min");
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editableMenu, setEditableMenu] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<AdminTab>('pending');
  const [isKitchenMode, setIsKitchenMode] = useState(false);
  const [notificationSound, setNotificationSound] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio('/order-alert.mp3');
    setNotificationSound(audio);
    
    const fetchData = async () => {
      const { data: ordersData, error: ordersError } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (ordersError) console.error("Error fetching orders:", ordersError);
      if (ordersData) setOrders(ordersData);

      const { data: settingsData } = await supabase.from('settings').select('*').eq('id', 'truck_settings').single();
      if (settingsData) {
        setIsOpen(settingsData.is_open);
        setWaitTime(settingsData.wait_time);
        if (settingsData.menu) setEditableMenu(settingsData.menu);
      }
    };
    fetchData();

    // Real-time Orders
    const ordersSub = supabase.channel('admin_orders')
      .on('postgres_changes', { event: '*', table: 'orders', schema: 'public' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newOrder = payload.new as Order;
          setOrders(prev => {
            if (prev.some(o => o.id === newOrder.id)) return prev;
            return [newOrder, ...prev];
          });
          audio.play().catch(e => console.log("Audio play blocked", e));
        } else if (payload.eventType === 'UPDATE') {
          const updatedOrder = payload.new as Order;
          setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
        } else if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(o => o.id !== payload.old.id));
        }
      }).subscribe();

    return () => { supabase.removeChannel(ordersSub); };
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    // Optimistic update
    const previousOrders = [...orders];
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    
    if (error) {
      console.error("Error updating status:", error);
      alert("Erreur lors de la mise à jour : " + error.message);
      setOrders(previousOrders); // Rollback
      return;
    }
    
    if (newStatus === 'ready') {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        try {
          await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'ORDER_READY',
              clientName: order.client_name,
              orderId: order.id
            })
          });
        } catch (e) { console.error("Notif failed", e); }
      }
    }
  };

  const cancelOrder = async (id: string) => {
    if (window.confirm("Annuler cette commande ?")) {
      const previousOrders = [...orders];
      setOrders(prev => prev.filter(o => o.id !== id));
      
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) {
        alert("Erreur lors de l'annulation : " + error.message);
        setOrders(previousOrders);
      }
    }
  };

  const toggleTruckStatus = async () => {
    const newStatus = !isOpen;
    setIsOpen(newStatus);
    await supabase.from('settings').update({ is_open: newStatus }).eq('id', 'truck_settings');
    
    if (newStatus) {
      try {
        await fetch('/api/notifications', { method: 'POST', body: JSON.stringify({ type: 'TRUCK_OPEN' }) });
      } catch (e) { console.error("Notif open failed", e); }
    }
  };

  const handleWaitTimeChange = async (time: string) => {
    setWaitTime(time);
    await supabase.from('settings').update({ wait_time: time }).eq('id', 'truck_settings');
  };

  const handleBan = async (phone: string) => {
    await supabase.from('blacklist').insert([{ phone }]);
    alert(`${phone} a été banni.`);
  };

  const toggleProductAvailability = async (catId: string, optId: string) => {
    const newMenu = (editableMenu.length > 0 ? editableMenu : SANDWICH_CATEGORIES).map(cat => {
      if (cat.id === catId) {
        return {
          ...cat,
          options: cat.options.map(opt => {
            if (opt.id === optId) {
              return { ...opt, isAvailable: opt.isAvailable === false ? true : false };
            }
            return opt;
          })
        };
      }
      return cat;
    });
    setEditableMenu(newMenu);
    await supabase.from('settings').update({ menu: newMenu }).eq('id', 'truck_settings');
  };

  const updateCategoryName = async (catId: string, newName: string) => {
    const newMenu = editableMenu.map(cat => cat.id === catId ? { ...cat, name: newName } : cat);
    setEditableMenu(newMenu);
    await supabase.from('settings').update({ menu: newMenu }).eq('id', 'truck_settings');
  };

  const updateOptionDetails = async (catId: string, optId: string, updates: Partial<Option>) => {
    const newMenu = editableMenu.map(cat => {
      if (cat.id === catId) {
        return {
          ...cat,
          options: cat.options.map(opt => opt.id === optId ? { ...opt, ...updates } : opt)
        };
      }
      return cat;
    });
    setEditableMenu(newMenu);
    await supabase.from('settings').update({ menu: newMenu }).eq('id', 'truck_settings');
  };

  const addOptionToCategory = async (catId: string) => {
    const newId = "new-" + Math.random().toString(36).substr(2, 4);
    const newOpt: Option = { id: newId, name: "Nouveau produit", price: 0, isAvailable: true };
    const newMenu = editableMenu.map(cat => {
      if (cat.id === catId) {
        return { ...cat, options: [...cat.options, newOpt] };
      }
      return cat;
    });
    setEditableMenu(newMenu);
    await supabase.from('settings').update({ menu: newMenu }).eq('id', 'truck_settings');
  };

  const removeOptionFromCategory = async (catId: string, optId: string) => {
    if (!window.confirm("Supprimer définitivement cet article ?")) return;
    const newMenu = editableMenu.map(cat => {
      if (cat.id === catId) {
        return { ...cat, options: cat.options.filter(o => o.id !== optId) };
      }
      return cat;
    });
    setEditableMenu(newMenu);
    await supabase.from('settings').update({ menu: newMenu }).eq('id', 'truck_settings');
  };

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'archive') return o.status === 'completed';
    if (activeTab === 'stock') return false;
    return o.status === activeTab;
  });

  return (
    <div className={cn(
      "min-h-screen bg-background text-white font-sans transition-all duration-700",
      isKitchenMode ? "p-0" : "p-8"
    )}>
      {!isKitchenMode && (
        <>
          <header className="flex justify-between items-center mb-12 bg-secondary/20 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-xl">
            <div className="flex items-center gap-8">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                <div className="relative bg-primary text-white p-5 rounded-2xl shadow-xl shadow-primary/10">
                  <LayoutDashboard size={32} strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-serif font-black italic text-fire-gradient">Command Center</h1>
                <div className="flex items-center gap-3 mt-2">
                  <div className={cn("w-2 h-2 rounded-full animate-pulse", isOpen ? "bg-green-500" : "bg-red-500")} />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">{isOpen ? "Truck Ouvert" : "Truck Fermé"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button 
                onClick={() => setIsManualModalOpen(true)}
                className="flex items-center gap-4 px-10 py-5 rounded-3xl bg-white text-black text-[13px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-white/5 hover:scale-[1.02] active:scale-95 transition-all border-b-4 border-gray-200"
              >
                <Plus size={22} strokeWidth={4} className="text-red-500" /> Commande Téléphone
              </button>
              
              <div className="w-[1px] h-12 bg-white/10 mx-2" />

               <button 
                onClick={toggleTruckStatus}
                className={cn(
                  "px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl",
                  isOpen ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-green-500 text-black"
                )}
              >
                {isOpen ? "Fermer le Truck" : "Ouvrir le Truck"}
              </button>
              
              <button 
                onClick={() => { localStorage.removeItem("admin_auth"); window.location.reload(); }}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 text-gray-500 hover:text-red-500 transition-all"
              >
                <LogOut size={20} />
              </button>
            </div>
          </header>

          <StatsCards orders={orders} />

          <div className="flex justify-between items-center mb-10">
            <nav className="flex gap-2 p-1.5 bg-secondary/40 rounded-2xl border border-white/5 backdrop-blur-md">
              {[
                { id: 'pending', label: 'Attente', count: orders.filter(o => o.status === 'pending').length },
                { id: 'preparing', label: 'Cuisine', count: orders.filter(o => o.status === 'preparing').length },
                { id: 'ready', label: 'Prêt', count: orders.filter(o => o.status === 'ready').length },
                { id: 'archive', label: 'Historique', count: 0 },
                { id: 'stock', label: 'Stock / Menu', count: 0 }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3",
                    activeTab === tab.id ? "bg-primary text-black shadow-lg shadow-primary/10" : "text-gray-500 hover:text-white"
                  )}
                >
                  {tab.id === 'stock' ? <Database size={14} /> : null}
                  {tab.label}
                  {tab.count > 0 && <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-mono", activeTab === tab.id ? "bg-black/20" : "bg-white/5")}>{tab.count}</span>}
                </button>
              ))}
            </nav>

            <div className="flex gap-4">
               <button 
                onClick={() => setIsKitchenMode(true)}
                className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-secondary border border-white/10 text-[11px] font-black uppercase tracking-widest hover:border-primary/50 transition-all group"
              >
                <ChefHat size={18} className="group-hover:rotate-12 transition-transform" /> Mode Cuisine
              </button>
            </div>
          </div>
        </>
      )}

      {isKitchenMode && (
        <div className="fixed inset-0 z-[100] bg-black p-8 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
             <div className="flex items-center gap-4">
                <ChefHat className="text-primary" size={32} />
                <h2 className="text-3xl font-black uppercase tracking-[0.3em] text-white italic">Kitchen Cockpit</h2>
             </div>
             <div className="flex items-center gap-6">
                <div className="bg-primary/10 px-6 py-3 rounded-2xl border border-primary/20 flex items-center gap-4">
                   <Clock className="text-primary" size={20} />
                   <span className="text-2xl font-black font-mono text-white">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <button 
                  onClick={() => setIsKitchenMode(false)}
                  className="px-8 py-3 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs"
                >
                  Quitter
                </button>
             </div>
          </div>
          
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-8 overflow-y-auto pr-4 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {orders.filter(o => o.status === 'pending' || o.status === 'preparing').map(order => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onNext={handleNextStatus} 
                  onCancel={cancelOrder} 
                  onBan={handleBan}
                  isKitchenMode={true}
                />
              ))}
            </AnimatePresence>
            {orders.filter(o => o.status === 'pending' || o.status === 'preparing').length === 0 && (
              <div className="col-span-full h-full flex flex-col items-center justify-center text-gray-800">
                 <Database size={80} strokeWidth={1} className="mb-6 opacity-20" />
                 <p className="text-xl font-black uppercase tracking-[0.5em] opacity-20 italic">Aucune commande en cours</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'stock' ? (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {(editableMenu.length > 0 ? editableMenu : SANDWICH_CATEGORIES).map(category => (
            <section key={category.id} className="bg-secondary/20 rounded-[2.5rem] border border-white/5 p-10 backdrop-blur-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-white/5 pb-8">
                 <div className="flex items-center gap-6">
                    <div className="bg-primary/10 p-4 rounded-2xl text-primary shadow-lg shadow-primary/5"><Database size={28} /></div>
                    <input 
                      type="text" 
                      value={category.name} 
                      onChange={(e) => updateCategoryName(category.id, e.target.value)}
                      className="text-3xl font-serif font-black italic text-white uppercase tracking-widest bg-transparent border-none outline-none focus:text-primary transition-colors w-full md:w-auto"
                    />
                 </div>
                 <button 
                  onClick={() => addOptionToCategory(category.id)}
                  className="flex items-center gap-3 px-8 py-3 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-primary transition-all shadow-xl"
                 >
                   <Plus size={16} strokeWidth={3} /> Ajouter un article
                 </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {category.options.map(option => (
                  <div
                    key={option.id}
                    className={cn(
                      "group relative p-6 rounded-[2rem] border transition-all overflow-hidden flex flex-col justify-between min-h-[180px]",
                      option.isAvailable !== false 
                        ? "bg-white/[0.03] border-white/5 hover:border-primary/30" 
                        : "bg-red-500/5 border-red-500/20"
                    )}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <button 
                        onClick={() => toggleProductAvailability(category.id, option.id)}
                        className={cn(
                          "text-[8px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full transition-all",
                          option.isAvailable !== false ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                        )}
                      >
                        {option.isAvailable !== false ? "En Stock" : "Rupture"}
                      </button>
                      <button 
                        onClick={() => removeOptionFromCategory(category.id, option.id)}
                        className="p-2 text-gray-700 hover:text-red-500 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <input 
                        type="text" 
                        value={option.name}
                        onChange={(e) => updateOptionDetails(category.id, option.id, { name: e.target.value })}
                        className="w-full bg-transparent border-none outline-none text-sm font-black uppercase tracking-wider text-white focus:text-primary transition-colors"
                      />
                      <div className="flex items-center gap-2 bg-black/20 p-2 rounded-xl border border-white/5 w-fit">
                        <input 
                          type="number" 
                          step="0.5"
                          value={option.price}
                          onChange={(e) => updateOptionDetails(category.id, option.id, { price: parseFloat(e.target.value) || 0 })}
                          className="w-16 bg-transparent border-none outline-none text-xs font-mono text-primary font-black text-center"
                        />
                        <span className="text-[10px] font-black text-gray-600 mr-1">€</span>
                      </div>
                    </div>

                    {option.isAvailable === false && (
                      <div className="absolute inset-0 bg-red-500/5 backdrop-blur-[1px] flex items-center justify-center pointer-events-none opacity-20">
                         <AlertTriangle size={64} className="text-red-500 rotate-12" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className={cn(
          "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8",
          isKitchenMode && "hidden"
        )}>
          <AnimatePresence mode="popLayout">
            {filteredOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onNext={handleNextStatus} 
                onCancel={cancelOrder} 
                onBan={handleBan}
                isReady={order.status === 'ready'}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {filteredOrders.length === 0 && !isKitchenMode && activeTab !== 'stock' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 bg-secondary/5 rounded-[3rem] border-2 border-dashed border-white/5">
          <Database size={48} className="mx-auto mb-6 text-gray-800" />
          <p className="text-gray-500 font-black uppercase tracking-[0.4em] italic text-sm">File d&apos;attente vide</p>
        </motion.div>
      )}

      <ManualOrderModal 
        isOpen={isManualModalOpen} 
        onClose={() => setIsManualModalOpen(false)} 
        onOrderCreated={(o) => setOrders([o, ...orders])}
        menuCategories={editableMenu.length > 0 ? editableMenu : SANDWICH_CATEGORIES}
      />

      {!isKitchenMode && (
        <footer className="mt-20 pt-12 border-t border-white/5 text-center text-gray-700">
          <p className="text-[10px] font-black uppercase tracking-[0.5em]">Grillade O&apos;Charbon Premium Suite • Built for Excellence</p>
        </footer>
      )}
    </div>
  );
}
