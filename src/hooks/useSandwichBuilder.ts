"use client";

import { useState, useEffect } from "react";
import { SANDWICH_CATEGORIES } from "@/lib/data";
import { SandwichConfig, Category, StepId, PaymentMethod, Order } from "@/types";
import { supabase } from "@/lib/supabase";

export function useSandwichBuilder() {
  const [isOpen, setIsOpen] = useState(true);
  const [waitTime, setWaitTime] = useState("15 min");
  const [menu, setMenu] = useState<Category[]>(SANDWICH_CATEGORIES);
  const [step, setStep] = useState<StepId>('ORDER_TYPE');
  const [cart, setCart] = useState<SandwichConfig[]>([]);
  const [currentConfig, setCurrentConfig] = useState<SandwichConfig>({ sauces: [], extras: [], drinks: [], desserts: [] });
  const [orderInfo, setOrderInfo] = useState({ 
    name: '', 
    phone: '', 
    pickupTime: '15 min', 
    type: 'takeaway' as 'on_site' | 'takeaway', 
    paymentMethod: 'card' as PaymentMethod,
    notes: ''
  });
  const [activeTab, setActiveTab] = useState<'menu' | 'cart'>('menu');
  const [isCouscousMode, setIsCouscousMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [rgpdAccepted, setRgpdAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('*').eq('id', 'truck_settings').single();
      if (data) {
        setIsOpen(data.is_open);
        setWaitTime(data.wait_time);
        if (data.menu) setMenu(data.menu);
      }
    };
    fetchSettings();

    const sub = supabase.channel('client_settings')
      .on('postgres_changes', { event: 'UPDATE', table: 'settings', schema: 'public' }, (payload) => {
        setIsOpen(payload.new.is_open);
        setWaitTime(payload.new.wait_time);
        if (payload.new.menu) setMenu(payload.new.menu);
      }).subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  const getAvailableOptions = (categoryId: string) => {
    const category = menu.find(c => c.id === categoryId);
    if (!category) return [];
    return category.options.filter(o => o.isAvailable !== false);
  };

  const calculateItemTotal = (config: SandwichConfig) => {
    let total = config.formula?.price || 0;
    const formulaId = config.formula?.id || '';
    const isStandardMenu = ['menu_standard', 'menu_student', 'menu_kids'].includes(formulaId);
    const isCouscous = formulaId.startsWith('COUSCOUS_');

    if (isCouscous) {
      if (config.preset_sandwich) total += config.preset_sandwich.price;
      
      const drinks = config.drinks || [];
      const totalDrinkQty = drinks.reduce((acc, d) => acc + d.quantity, 0);
      
      if (formulaId === 'COUSCOUS_S3') {
        // Logique 4 Personnes : 4 canettes OU 1 bouteille 1.5L
        const hasBottle = drinks.some(d => d.option.name.includes('1.5L') && d.quantity > 0);
        
        if (hasBottle) {
          // Si une bouteille est prise, elle est gratuite, tout le reste est payant
          let bottleFound = false;
          total += drinks.reduce((acc, d) => {
            const isTargetBottle = d.option.name.includes('1.5L');
            if (isTargetBottle && !bottleFound) {
              bottleFound = true;
              return acc + (d.option.price * (d.quantity - 1));
            }
            return acc + (d.option.price * d.quantity);
          }, 0);
        } else {
          // Sinon, 4 canettes gratuites
          const cansPrices = drinks.filter(d => !d.option.name.includes('1.5L') && !d.option.name.includes('2L'))
            .flatMap(d => Array(d.quantity).fill(d.option.price))
            .sort((a, b) => b - a);
          total += cansPrices.slice(4).reduce((acc, p) => acc + p, 0);
          // Les bouteilles 2L restent payantes
          total += drinks.filter(d => d.option.name.includes('2L')).reduce((acc, d) => acc + (d.option.price * d.quantity), 0);
        }
      } else {
        // Logique 2 et 3 Personnes : Uniquement canettes
        let drinkQuota = formulaId === 'COUSCOUS_S1' ? 2 : 3;
        const cansPrices = drinks.filter(d => !d.option.name.includes('1.5L') && !d.option.name.includes('2L'))
          .flatMap(d => Array(d.quantity).fill(d.option.price))
          .sort((a, b) => b - a);
        total += cansPrices.slice(drinkQuota).reduce((acc, p) => acc + p, 0);
        total += drinks.filter(d => d.option.name.includes('1.5L') || d.option.name.includes('2L'))
          .reduce((acc, d) => acc + (d.option.price * d.quantity), 0);
      }
    } else {
      if (config.preset_sandwich && formulaId !== 'menu_kids') {
        total += Math.max(0, config.preset_sandwich.price - 12);
      }
      // Mix Grill: +2€ for each meat above 2
      if (config.preset_sandwich?.id === 'p4' && config.meats && config.meats.length > 2) {
        total += (config.meats.length - 2) * 2;
      }
      total += config.sauces.length > 2 ? (config.sauces.length - 2) * 0.5 : 0;
      total += config.extras.reduce((acc, e) => acc + e.price, 0);
      if (config.preset_sandwich?.id === 'p5' && config.steaks_qty) total += config.steaks_qty.price;
      
      const drinks = config.drinks || [];
      const drinkQuota = isStandardMenu ? 1 : 0;
      const cansPrices = drinks.filter(d => !d.option.name.includes('1.5L') && !d.option.name.includes('2L')).flatMap(d => Array(d.quantity).fill(d.option.price)).sort((a, b) => b - a);
      total += cansPrices.slice(drinkQuota).reduce((acc, p) => acc + p, 0);
      total += drinks.filter(d => d.option.name.includes('1.5L') || d.option.name.includes('2L')).reduce((acc, d) => acc + (d.option.price * d.quantity), 0);
    }

    total += (config.desserts || []).reduce((acc, d) => acc + (d.option.price * d.quantity), 0);
    return total;
  };

  const calculateTotal = () => {
    const cartTotal = cart.reduce((acc, item) => acc + calculateItemTotal(item), 0);
    const currentTotal = calculateItemTotal(currentConfig);
    return cartTotal + currentTotal;
  };

  const handleNext = (overrideStep?: StepId, formulaId?: string) => {
    const currentStep = overrideStep || step;
    switch (currentStep) {
      case 'ORDER_TYPE': setIsCouscousMode(false); setStep('FORMULA'); break;
      case 'FORMULA':
        const selId = formulaId || currentConfig.formula?.id;
        if (selId === 'menu_kids') { setIsCouscousMode(false); setStep('KIDS_MENU'); }
        else if (selId?.startsWith('COUSCOUS_')) { setIsCouscousMode(true); setStep('COUSCOUS_MEAT'); }
        else { setIsCouscousMode(false); setStep('PRESETS'); }
        break;
      case 'COUSCOUS': setStep('COUSCOUS_MEAT'); break;
      case 'COUSCOUS_MEAT': setStep('DRINKS'); break;
      case 'KIDS_MENU': setStep('SAUCES'); break;
      case 'PRESETS':
        if (currentConfig.preset_sandwich?.id === 'p4') setStep('MEATS');
        else if (currentConfig.preset_sandwich?.id === 'p5') setStep('STEAKS');
        else setStep('SAUCES');
        break;
      case 'MEATS': setStep('SAUCES'); break;
      case 'STEAKS': setStep('SAUCES'); break;
      case 'SAUCES': setStep('EXTRAS'); break;
      case 'EXTRAS': setStep('DRINKS'); break;
      case 'DRINKS':
        const fId = currentConfig.formula?.id || '';
        let q = ['menu_standard', 'menu_student', 'menu_kids'].includes(fId) ? 1 : 0;
        if (fId.startsWith('COUSCOUS_')) q = fId === 'COUSCOUS_S1' ? 2 : fId === 'COUSCOUS_S2' ? 3 : 4;
        if (q > 0 && (currentConfig.drinks || []).reduce((acc, d) => acc + d.quantity, 0) < q) {
          alert(`Votre formule inclut ${q} boisson(s) !`);
          return;
        }
        setStep('DESSERTS');
        break;
      case 'DESSERTS': setStep('CHECKOUT'); setActiveTab('cart'); break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'FORMULA': setStep('ORDER_TYPE'); break;
      case 'COUSCOUS': setStep('ORDER_TYPE'); break;
      case 'COUSCOUS_MEAT': setStep('COUSCOUS'); break;
      case 'PRESETS': setStep('FORMULA'); break;
      case 'KIDS_MENU': setStep('FORMULA'); break;
      case 'MEATS': setStep('PRESETS'); break;
      case 'STEAKS': setStep('PRESETS'); break;
      case 'SAUCES': 
        if (currentConfig.formula?.id === 'menu_kids') setStep('KIDS_MENU');
        else if (currentConfig.preset_sandwich?.id === 'p4') setStep('MEATS');
        else if (currentConfig.preset_sandwich?.id === 'p5') setStep('STEAKS');
        else setStep('PRESETS');
        break;
      case 'EXTRAS': setStep('SAUCES'); break;
      case 'DRINKS': setStep(isCouscousMode ? 'COUSCOUS_MEAT' : 'EXTRAS'); break;
      case 'DESSERTS': setStep('DRINKS'); break;
      case 'CHECKOUT': setStep('DESSERTS'); setActiveTab('menu'); break;
    }
  };

  const handleAddAnother = () => {
    if (currentConfig.formula) {
      setCart([...cart, currentConfig]);
    }
    setCurrentConfig({ sauces: [], extras: [], drinks: [], desserts: [] });
    setStep('FORMULA');
    setActiveTab('menu');
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleSubmitOrder = async () => {
    if (!orderInfo.name || !orderInfo.phone) { alert("Veuillez remplir vos informations"); return; }
    const { data: isBanned } = await supabase.from('blacklist').select('phone').eq('phone', orderInfo.phone).single();
    if (isBanned) { alert("Numéro restreint."); return; }
    if (!rgpdAccepted) { alert("Acceptez le RGPD"); return; }
    
    setIsProcessing(true);
    const total = calculateTotal();
    
    // N'inclure currentConfig que s'il a une formule, sinon on prend juste le panier
    const finalItems = [...cart];
    if (currentConfig.formula) {
      finalItems.push(currentConfig);
    }
    
    if (finalItems.length === 0) {
      alert("Votre panier est vide.");
      setIsProcessing(false);
      return;
    }

    const newOrder: Order = {
      id: "WEB-" + Math.random().toString(36).substr(2, 5).toUpperCase(),
      client_name: orderInfo.name,
      client_phone: orderInfo.phone,
      items: finalItems,
      total_price: total,
      deposit_amount: total * (isCouscousMode ? 0.5 : 0.3),
      deposit_status: 'paid',
      status: 'pending',
      payment_status: 'partial',
      payment_method: orderInfo.paymentMethod,
      order_type: orderInfo.type,
      pickup_time: isCouscousMode ? "Demain" : orderInfo.pickupTime,
      notes: orderInfo.notes,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('orders').insert([newOrder]);
    if (error) { alert("Erreur validation."); setIsProcessing(false); return; }

    setTimeout(() => {
      setIsProcessing(false);
      setShowConfetti(true);
      setTimeout(() => {
        setStep('ORDER_TYPE'); setActiveTab('menu'); setCart([]); 
        setCurrentConfig({ sauces: [], extras: [], drinks: [], desserts: [] });
        setShowConfetti(false);
      }, 2000);
    }, 2500);
  };

  return {
    isOpen, waitTime, menu, step, cart, currentConfig, orderInfo, activeTab,
    isCouscousMode, isProcessing, showConfetti, rgpdAccepted, isSubmitting,
    setStep, setCart, setCurrentConfig, setOrderInfo, setActiveTab, setRgpdAccepted, setIsCouscousMode,
    getAvailableOptions, calculateTotal, handleNext, handleBack, handleSubmitOrder, handleAddAnother, handleRemoveFromCart
  };
}
