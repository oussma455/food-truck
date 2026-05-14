"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SANDWICH_CATEGORIES, ORDER_TYPES, FORMULAS } from "@/lib/data";
import { SandwichConfig, Option, Category, StepId } from "@/types";
import OneSignal from 'react-onesignal';
import { ShoppingCart, Check, Plus, Minus, Clock, MapPin, Phone, Shield, GraduationCap, Baby, Star, CreditCard, Wallet, UtensilsCrossed, Bell, X, Utensils, Sandwich as BurgerIcon, CupSoda } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import { PaymentMethod } from "@/types";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function SandwichBuilder() {
  const [isOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("truck_status") !== "closed";
    }
    return true;
  });

  const [step, setStep] = useState<StepId>('ORDER_TYPE');
  const [menu] = useState<Category[]>(() => {
    if (typeof window !== "undefined") {
      const savedMenu = localStorage.getItem("truck_menu");
      if (savedMenu) {
        const parsedMenu = JSON.parse(savedMenu);
        // On fusionne pour s'assurer que les nouvelles catégories (couscous) sont présentes
        const mergedMenu = [...SANDWICH_CATEGORIES].map(baseCat => {
          const savedCat = parsedMenu.find((c: Category) => c.id === baseCat.id);
          return savedCat || baseCat;
        });
        return mergedMenu;
      }
    }
    return SANDWICH_CATEGORIES;
  });

  const getAvailableOptions = (categoryId: string) => {
    const category = menu.find(c => c.id === categoryId);
    return category ? category.options.filter(o => o.isAvailable !== false) : [];
  };

  const [cart, setCart] = useState<SandwichConfig[]>([]);
  const [isCouscousMode, setIsCouscousMode] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<SandwichConfig>({
    sauces: [],
    extras: [],
    drinks: [],
    desserts: [],
  });

  const [orderInfo, setOrderInfo] = useState<{
    name: string;
    phone: string;
    type: "on_site" | "takeaway";
    pickupTime: string;
    paymentMethod: PaymentMethod;
  }>({ 
    name: "", 
    phone: "", 
    type: "takeaway",
    pickupTime: "15 min",
    paymentMethod: "card"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [rgpdAccepted, setRgpdAccepted] = useState(false);

  useEffect(() => {
    if (step === 'DRINKS') {
      const isMenu = currentConfig.formula?.id === 'menu_standard' || currentConfig.formula?.id === 'menu_student' || currentConfig.formula?.id === 'menu_kids';
      // Alert removed as requested, keeping banner in UI
    }
  }, [step, currentConfig.formula?.id]);

  useEffect(() => {
    // Initialisation : on mémorise le statut actuel sans sonner
    if (typeof window !== "undefined") {
      const initialStatus = localStorage.getItem("truck_status") || "closed";
      localStorage.setItem("last_known_status", initialStatus);
    }

    const checkStatus = () => {
      const currentStatus = localStorage.getItem("truck_status") || "closed";
      const lastStatus = localStorage.getItem("last_known_status") || "closed";
      
      // DING DING uniquement si on passe de FERMÉ à OUVERT
      if (currentStatus === "open" && lastStatus === "closed") {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
        audio.play().catch(e => console.log("Audio auto-play blocked"));
        alert("🔔 LE TRUCK EST OUVERT ! C'est l'heure de commander !");
      }
      
      localStorage.setItem("last_known_status", currentStatus);
    };

    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const [showNotifyPrompt, setShowNotifyPrompt] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("notify_prompt_shown") !== "true";
    }
    return false;
  });

  const enableNotifications = async () => {
    try {
      console.log("Demande d'activation OneSignal...");
      await OneSignal.Notifications.requestPermission();
      localStorage.setItem("notify_prompt_shown", "true");
      setShowNotifyPrompt(false);
      console.log("Permission demandée avec succès");
    } catch (err) {
      console.error("Erreur lors de la demande de permission OneSignal:", err);
      alert("Une erreur est survenue lors de l'activation des notifications.");
    }
  };

  const handleNext = (overrideStep?: StepId, formulaId?: string) => {
    const currentStep = overrideStep || step;
    
    switch (currentStep) {
      case 'ORDER_TYPE':
        setStep('FORMULA');
        break;
      case 'FORMULA':
        const selectedFormulaId = formulaId || currentConfig.formula?.id;
        if (selectedFormulaId === 'menu_kids') {
          setStep('KIDS_MENU');
        } else {
          setStep('PRESETS');
        }
        break;
      case 'KIDS_MENU':
        setStep('DRINKS');
        break;
      case 'PRESETS':
        setStep('EXTRAS');
        break;
      case 'EXTRAS':
        setStep('DRINKS');
        break;
      case 'DRINKS':
        const isMenu = currentConfig.formula?.id === 'menu_standard' || currentConfig.formula?.id === 'menu_student' || currentConfig.formula?.id === 'menu_kids';
        const hasDrink = currentConfig.drinks && currentConfig.drinks.length > 0;
        
        if (isMenu && !hasDrink) {
          alert("Dans votre Menu complet, une boisson est comprise ! Veuillez en choisir une pour continuer.");
          return;
        }
        setStep('DESSERTS');
        break;
      case 'DESSERTS':
        setStep('CHECKOUT');
        break;
      default:
        break;
    }
  };

  const showNextButton = ['EXTRAS', 'DRINKS', 'DESSERTS'].includes(step);

  const goToCheckout = () => {
    setStep('CHECKOUT');
  };

  const handleAddAnother = () => {
    setCart([...cart, currentConfig]);
    setCurrentConfig({
      sauces: [],
      extras: [],
      drinks: [],
      desserts: [],
    });
    setStep('FORMULA');
  };

  const handleBack = () => {
    switch (step) {
      case 'FORMULA': setStep('ORDER_TYPE'); break;
      case 'PRESETS': setStep('FORMULA'); break;
      case 'KIDS_MENU': setStep('FORMULA'); break;
      case 'EXTRAS': 
        if (currentConfig.formula?.id === 'menu_kids') setStep('KIDS_MENU');
        else setStep('PRESETS'); 
        break;
      case 'DRINKS': setStep('EXTRAS'); break;
      case 'DESSERTS': setStep('DRINKS'); break;
      case 'CHECKOUT': setStep('DESSERTS'); break;
      default: break;
    }
  };

  const calculateItemTotal = (config: SandwichConfig) => {
    let total = config.formula?.price || 0;
    const formulaId = config.formula?.id || '';
    const isMenu = ['menu_standard', 'menu_student', 'menu_kids'].includes(formulaId);
    const isCouscous = formulaId.startsWith('s'); // Couscous sizes are s1, s2, s3

    // 1. Sandwich/Meat Surcharge
    if (config.preset_sandwich) {
      if (isCouscous) {
        // Couscous meat surcharge (m1=0, others are extra)
        total += config.preset_sandwich.price;
      } else if (formulaId !== 'menu_kids') {
        // Standard base is 10€ for sandwiches
        const extra = Math.max(0, config.preset_sandwich.price - 10);
        total += extra;
      }
    }

    // 2. Sauces: 2 free, then 0.50€ each
    const saucesCount = config.sauces.length;
    const paidSauces = Math.max(0, saucesCount - 2);
    total += paidSauces * 0.5;
    
    // 3. Extras (always additional)
    total += config.extras.reduce((acc, e) => acc + e.price, 0);
    
    // 4. Drinks (1 free if it's a Menu)
    const drinks = config.drinks || [];
    if (isMenu) {
      const totalDrinkQty = drinks.reduce((acc, d) => acc + d.quantity, 0);
      if (totalDrinkQty > 0) {
        // Logic: Total price of all drinks - price of one drink
        // To be fair to the customer, we subtract the price of the most expensive single drink unit
        const totalDrinksPrice = drinks.reduce((acc, d) => acc + (d.option.price * d.quantity), 0);
        const maxSingleDrinkPrice = Math.max(...drinks.map(d => d.option.price));
        total += (totalDrinksPrice - maxSingleDrinkPrice);
      }
    } else {
      total += drinks.reduce((acc, d) => acc + (d.option.price * d.quantity), 0);
    }

    // 5. Desserts (always additional)
    total += (config.desserts || []).reduce((acc, d) => acc + (d.option.price * d.quantity), 0);
    
    return total;
  };

  const calculateTotal = () => {
    const cartTotal = cart.reduce((acc, item) => acc + calculateItemTotal(item), 0);
    const currentTotal = calculateItemTotal(currentConfig);
    const total = cartTotal + currentTotal;
    
    if (loyaltyPoints >= 9) return 0;
    return total;
  };

  const handleSubmitOrder = async () => {
    if (!orderInfo.name || !orderInfo.phone) {
      alert("Veuillez remplir vos informations");
      return;
    }
    if (!rgpdAccepted) {
      alert("Veuillez accepter la politique de protection des données (RGPD).");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      const newPoints = loyaltyPoints >= 9 ? 0 : loyaltyPoints + 1;
      localStorage.setItem(`loyalty_${orderInfo.phone}`, JSON.stringify(newPoints));
      setShowConfetti(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setStep('ORDER_TYPE');
        setCart([]);
        setCurrentConfig({ sauces: [], extras: [], drinks: [], desserts: [] });
        setShowConfetti(false);
        alert("Commande validée ! Merci !");
      }, 2000);
    }, 1500);
  };

  if (!isOpen) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center text-white">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="premium-card p-10 border-red-500/50">
          <Clock className="text-red-500 mx-auto mb-6 animate-pulse" size={40} />
          <h2 className="text-3xl font-serif mb-4 uppercase tracking-widest italic">Fermé</h2>
          <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">Revenez nous voir bientôt !</p>
          <a href="tel:+33600000000" className="mt-8 flex items-center justify-center gap-2 text-primary hover:scale-105 transition-all uppercase text-[10px] font-black tracking-widest border border-primary/20 px-6 py-3 rounded-full">
            <Phone size={14} /> Nous appeler
          </a>
        </motion.div>
      </div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 'ORDER_TYPE':
        return (
          <StepContainer title="Bienvenue" subtitle="Sur place ou à emporter ?">
            <div className="grid grid-cols-1 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsCouscousMode(true);
                  setStep('COUSCOUS');
                }}
                className="w-full premium-gradient p-6 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 border-primary shadow-[0_0_30px_rgba(255,0,0,0.3)] group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-white/20 animate-pulse" />
                <Utensils size={32} className="text-background group-hover:rotate-12 transition-transform" />
                <span className="text-background font-black uppercase tracking-widest text-lg">Pré-commander Couscous</span>
                <span className="text-background/80 text-[10px] uppercase font-bold tracking-widest">Réservé 24h à l'avance • 2 à 4 pers.</span>
              </motion.button>

              <div className="h-[1px] w-full bg-gray-900 my-4 flex items-center justify-center">
                <span className="bg-background px-4 text-gray-700 text-[8px] uppercase tracking-widest font-black">Ou commande instantanée</span>
              </div>

              {ORDER_TYPES.map(type => (
                <OptionCard 
                  key={type.id} 
                  option={type} 
                  isSelected={orderInfo.type === type.id} 
                  onClick={() => { 
                    setIsCouscousMode(false);
                    setOrderInfo({...orderInfo, type: type.id as "on_site" | "takeaway"}); 
                    setTimeout(() => handleNext('ORDER_TYPE'), 300); 
                  }}
                  icon={type.id === 'takeaway' ? <ShoppingCart /> : <MapPin />}
                />
              ))}
            </div>
          </StepContainer>
        );
      case 'COUSCOUS':
        const availableCouscousTypes = getAvailableOptions('couscous_type');
        const availableCouscousSizes = getAvailableOptions('couscous_size');
        return (
          <StepContainer title="Couscous Maison" subtitle="Choisissez votre régal (24h à l'avance)">
            <div className="space-y-8">
              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center gap-4">
                <Clock className="text-amber-500 shrink-0" size={24} />
                <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest leading-relaxed">Attention : Le couscous est préparé à la demande. Votre commande sera prête demain à la même heure.</p>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] text-primary font-black uppercase tracking-widest pl-1">1. Taille de la tablée</label>
                <div className="grid grid-cols-1 gap-3">
                  {availableCouscousSizes.map(size => (
                    <OptionCard 
                      key={size.id} 
                      option={size} 
                      isSelected={currentConfig.formula?.id === size.id} 
                      onClick={() => setCurrentConfig({...currentConfig, formula: size})} 
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] text-primary font-black uppercase tracking-widest pl-1">2. Accompagnement viande</label>
                <div className="grid grid-cols-1 gap-3">
                  {availableCouscousTypes.map(type => (
                    <OptionCard 
                      key={type.id} 
                      option={type} 
                      isSelected={currentConfig.preset_sandwich?.id === type.id} 
                      onClick={() => setCurrentConfig({...currentConfig, preset_sandwich: type})} 
                    />
                  ))}
                </div>
              </div>

              <button 
                onClick={() => {
                  if (!currentConfig.formula || !currentConfig.preset_sandwich) {
                    alert("Veuillez choisir la taille et le type de viande.");
                    return;
                  }
                  setStep('CHECKOUT');
                }}
                className="w-full premium-gradient text-background font-black py-5 rounded-2xl shadow-xl shadow-primary/20 uppercase tracking-widest text-[11px]"
              >
                Confirmer le choix
              </button>
            </div>
          </StepContainer>
        );
      case 'FORMULA':
        return (
          <StepContainer title="Formule" subtitle="Choisissez votre plaisir">
            <div className="grid grid-cols-1 gap-3">
              {FORMULAS.map(formula => (
                <div key={formula.id} className="space-y-2">
                  <OptionCard 
                    option={formula} 
                    isSelected={currentConfig.formula?.id === formula.id} 
                    onClick={() => { 
                      setCurrentConfig({...currentConfig, formula}); 
                      setTimeout(() => handleNext('FORMULA', formula.id), 300); 
                    }}
                    icon={
                      formula.id === 'menu_standard' ? (
                        <div className="flex gap-0.5 items-center">
                          <BurgerIcon size={16} />
                          <Utensils size={14} className="opacity-70" />
                          <CupSoda size={14} className="opacity-70" />
                        </div>
                      ) : formula.id === 'sandwich_only' ? (
                        <BurgerIcon size={20} />
                      ) : formula.id === 'menu_student' ? (
                        <div className="flex gap-0.5 items-center">
                          <GraduationCap size={16} />
                          <BurgerIcon size={14} className="opacity-70" />
                        </div>
                      ) : formula.id === 'menu_kids' ? (
                        <div className="flex gap-0.5 items-center">
                          <Baby size={16} />
                          <BurgerIcon size={14} className="opacity-70" />
                        </div>
                      ) : (
                        <Star size={18} />
                      )
                    }
                  />
                  {formula.id === 'menu_student' && (
                    <p className="text-[10px] text-amber-500 font-bold px-4 italic animate-pulse">
                      * Une carte étudiante valide vous sera demandée au comptoir.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </StepContainer>
        );
      case 'PRESETS':
        const availablePresets = getAvailableOptions('presets');
        return (
          <StepContainer title="Nos Créations" subtitle="Recettes signatures du Chef">
            <div className="grid grid-cols-1 gap-3">
              {availablePresets.length > 0 ? availablePresets.map(preset => (
                <OptionCard 
                  key={preset.id} 
                  option={preset} 
                  isSelected={currentConfig.preset_sandwich?.id === preset.id} 
                  onClick={() => { 
                    setCurrentConfig({...currentConfig, preset_sandwich: preset, bread: undefined, meat: undefined}); 
                    setTimeout(() => handleNext('PRESETS'), 300); 
                  }}
                />
              )) : (
                <div className="text-center p-10 bg-secondary/10 rounded-3xl border border-dashed border-gray-800">
                  <p className="text-gray-500 text-xs uppercase tracking-widest font-black">Toutes nos créations sont épuisées pour aujourd'hui.</p>
                </div>
              )}
            </div>
          </StepContainer>
        );
      case 'KIDS_MENU':
        const availableKids = getAvailableOptions('kids_menu');
        return (
          <StepContainer title="Menu Enfant" subtitle="Choisissez son petit régal">
            <div className="grid grid-cols-1 gap-3">
              {availableKids.length > 0 ? availableKids.map(kidsItem => (
                <OptionCard 
                  key={kidsItem.id} 
                  option={kidsItem} 
                  isSelected={currentConfig.preset_sandwich?.id === kidsItem.id} 
                  onClick={() => { 
                    setCurrentConfig({...currentConfig, preset_sandwich: kidsItem, bread: undefined, meat: undefined}); 
                    setTimeout(() => handleNext('KIDS_MENU'), 300); 
                  }}
                />
              )) : (
                <div className="text-center p-10 bg-secondary/10 rounded-3xl border border-dashed border-gray-800">
                  <p className="text-gray-500 text-xs uppercase tracking-widest font-black">Menu enfant indisponible.</p>
                </div>
              )}
            </div>
          </StepContainer>
        );
      case 'EXTRAS':
        const availableExtras = getAvailableOptions('extras');
        return <CategoryStep category={{...menu.find(c => c.id === 'extras')!, options: availableExtras}} config={currentConfig} setConfig={setCurrentConfig} onNext={() => handleNext('EXTRAS')} type="multiple" />;
      case 'DRINKS':
        const availableDrinks = getAvailableOptions('drinks');
        const isStandardMenu = currentConfig.formula?.id === 'menu_standard' || currentConfig.formula?.id === 'menu_student' || currentConfig.formula?.id === 'menu_kids';
        return (
          <StepContainer title="Boissons" subtitle="Choisissez votre rafraîchissement">
            <div className="space-y-6">
              {isStandardMenu && availableDrinks.length > 0 && (
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl flex items-center gap-3 animate-bounce">
                  <div className="bg-primary p-2 rounded-lg text-background">
                    <CupSoda size={18} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Boisson comprise dans votre menu !</p>
                </div>
              )}
              <SideSelector label="Boissons" options={availableDrinks} config={currentConfig} setConfig={setCurrentConfig} type="drinks" />
            </div>
          </StepContainer>
        );
      case 'DESSERTS':
        const availableDesserts = getAvailableOptions('desserts');
        return (
          <StepContainer title="Desserts" subtitle="Une petite touche sucrée ?">
            <div className="space-y-8">
              <SideSelector label="Desserts" options={availableDesserts} config={currentConfig} setConfig={setCurrentConfig} type="desserts" />
              
              <button 
                onClick={handleAddAnother}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-primary/30 text-primary font-black text-[10px] uppercase tracking-widest hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Ajouter un autre menu
              </button>
            </div>
          </StepContainer>
        );
      case 'CHECKOUT':
        return <CheckoutScreen 
          orderInfo={orderInfo} 
          setOrderInfo={setOrderInfo} 
          cart={cart}
          currentConfig={currentConfig}
          calculateTotal={calculateTotal} 
          rgpdAccepted={rgpdAccepted} 
          setRgpdAccepted={setRgpdAccepted} 
          isSubmitting={isSubmitting} 
          onSubmit={handleSubmitOrder}
          onAddAnother={handleAddAnother}
        />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-background text-foreground overflow-hidden max-w-md mx-auto">
      <AnimatePresence>{showConfetti && <Confetti />}</AnimatePresence>
      
      {/* Fixed Header */}
      <header className="shrink-0 py-6 px-6 text-center border-b border-gray-900/50 bg-background/80 backdrop-blur-md z-40">
        <h1 className="text-2xl font-serif font-bold text-primary italic">La Grillade O&apos;Charbon</h1>
        <div className="premium-gradient h-[1px] w-16 mx-auto my-1.5 opacity-50" />
        <p className="text-gray-500 text-[8px] uppercase tracking-[0.3em] font-bold">L&apos;excellence de la grillade</p>
      </header>

      {/* Main Content - Scrollable Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden px-6 pt-6 pb-32">
        {/* Progress Bar */}
        <div className="mb-8 px-2">
          <div className="flex justify-between mb-2">
            {['FORMULA', 'PRESETS', 'DRINKS', 'CHECKOUT'].map((s, i) => {
              const stepsOrder: StepId[] = ['ORDER_TYPE', 'FORMULA', 'PRESETS', 'KIDS_MENU', 'EXTRAS', 'DRINKS', 'DESSERTS', 'CHECKOUT'];
              const currentIndex = stepsOrder.indexOf(step);
              const stepIndex = stepsOrder.indexOf(s as StepId);
              const isActive = currentIndex >= stepIndex;
              
              return (
                <div key={s} className="flex flex-col items-center gap-1">
                  <div className={cn(
                    "w-2 h-2 rounded-full transition-all duration-500",
                    isActive ? "bg-primary shadow-[0_0_10px_rgba(255,0,0,0.5)]" : "bg-gray-800"
                  )} />
                </div>
              );
            })}
          </div>
          <div className="h-[2px] w-full bg-gray-900 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ 
                width: `${Math.min(100, (['ORDER_TYPE', 'FORMULA', 'PRESETS', 'EXTRAS', 'DRINKS', 'DESSERTS', 'CHECKOUT'].indexOf(step) / 6) * 100)}%` 
              }}
              className="h-full bg-primary"
            />
          </div>
        </div>

        <AnimatePresence>
          {showNotifyPrompt && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 overflow-hidden shrink-0"
            >
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/20 p-2 rounded-lg text-primary">
                    <Bell size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white">Restez informé</p>
                    <p className="text-[9px] text-gray-500">Ding ! Soyez prévenu dès que le truck ouvre.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={enableNotifications} className="bg-primary text-background px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest hover:scale-105 transition-all">Activer</button>
                  <button onClick={() => setShowNotifyPrompt(false)} className="text-gray-600 p-2"><X size={14} /></button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div 
            key={step} 
            initial={{ opacity: 0, x: 10 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="min-h-full"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Fixed Footer */}
      <footer className="shrink-0 p-6 bg-background/95 backdrop-blur-2xl border-t border-gray-900 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex gap-3 mb-6">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={handleBack} 
            className={cn(
              "flex-1 py-4 rounded-2xl border border-white bg-black font-black text-[9px] uppercase tracking-widest text-white transition-all", 
              step === 'ORDER_TYPE' ? "hidden" : ""
            )}
          >
            Retour
          </motion.button>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNext()} 
            disabled={
              (step === 'PRESETS' && !currentConfig.preset_sandwich) ||
              (step === 'KIDS_MENU' && !currentConfig.preset_sandwich)
            }
            className={cn(
              "bg-white text-black font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2", 
              step === 'CHECKOUT' || !showNextButton ? "hidden" : "flex-[2.5]"
            )}
          >
            {step === 'DESSERTS' ? "VOIR LE RÉSUMÉ" : "SUIVANT"} <Plus size={14} />
          </motion.button>
        </div>
        <div className="flex justify-between items-center px-2">
          <motion.a 
            whileTap={{ scale: 0.9 }}
            href="tel:+33600000000" 
            className="text-primary flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] active:opacity-50"
          >
            <div className="bg-primary p-2 rounded-lg text-white">
              <Phone size={14} fill="currentColor" />
            </div>
            Appeler
          </motion.a>
          <motion.div whileTap={{ scale: 0.9 }}>
            <Link href="/legals" className="text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-80 hover:opacity-100">
              <Shield size={14} className="text-white" /> Légal
            </Link>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}

function StepContainer({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex-1">
      <div className="mb-6">
        <span className="text-[10px] text-primary font-black tracking-[0.2em] uppercase">{title}</span>
        <h2 className="text-2xl font-serif mt-1 italic">{subtitle}</h2>
      </div>
      {children}
    </div>
  );
}

function OptionCard({ option, isSelected, onClick, icon }: { option: Option; isSelected: boolean; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <motion.div 
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={cn(
        "premium-card p-5 transition-all duration-300 flex justify-between items-center group cursor-pointer border",
        isSelected ? "border-primary bg-primary/5 shadow-[0_0_25px_rgba(212,175,55,0.1)]" : "hover:border-primary/40 border-gray-800"
      )}
    >
      <div className="flex items-center gap-4">
        {icon && <div className={cn("text-gray-500 group-hover:text-primary transition-colors", isSelected && "text-primary")}>{React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: 20 }) : icon}</div>}
        <div>
          <p className={cn("font-black text-[11px] uppercase tracking-[0.1em]", isSelected ? "text-primary" : "text-gray-300")}>{option.name}</p>
          {option.description && <p className="text-[9px] text-gray-600 mt-0.5 leading-tight">{option.description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {option.price > 0 && <span className="text-[10px] text-gray-500 font-mono font-bold">+{option.price.toFixed(2)}€</span>}
        <div className={cn("w-5 h-5 rounded-full border border-primary flex items-center justify-center transition-all", isSelected ? "bg-primary text-background" : "bg-black/40 text-transparent")}>
          <Check size={10} strokeWidth={4} />
        </div>
      </div>
    </motion.div>
  );
}

function CategoryStep({ category, config, setConfig, onNext, type, limit }: { category: Category; config: SandwichConfig; setConfig: React.Dispatch<React.SetStateAction<SandwichConfig>>; onNext: () => void; type: 'single' | 'multiple'; limit?: number }) {
  const handleToggle = (option: Option) => {
    if (type === 'single') {
      setConfig({ ...config, [category.id]: option });
      onNext();
    } else {
      const current = config[category.id as keyof SandwichConfig] as Option[] || [];
      const isSelected = current.find(s => s.id === option.id);
      if (isSelected) {
        setConfig({ ...config, [category.id]: current.filter(s => s.id !== option.id) });
      } else {
        if (limit && current.length >= limit) return;
        setConfig({ ...config, [category.id]: [...current, option] });
      }
    }
  };

  const isSelected = (id: string) => {
    const val = config[category.id as keyof SandwichConfig];
    if (Array.isArray(val)) {
      return (val as (Option | { option: Option; quantity: number })[]).some(i => 
        'id' in i ? i.id === id : i.option.id === id
      );
    }
    return (val as Option)?.id === id;
  };

  return (
    <StepContainer title="Sélection" subtitle={category.name}>
      <div className="grid grid-cols-1 gap-3">
        {category.options.map(option => (
          <OptionCard key={option.id} option={option} isSelected={isSelected(option.id)} onClick={() => handleToggle(option)} />
        ))}
      </div>
    </StepContainer>
  );
}

function SideSelector({ label, options, config, setConfig, type }: { label: string; options: Option[]; config: SandwichConfig; setConfig: React.Dispatch<React.SetStateAction<SandwichConfig>>; type: 'drinks' | 'desserts' }) {
  const current = config[type] || [];
  const getQty = (id: string) => current.find(i => i.option.id === id)?.quantity || 0;

  const update = (option: Option, delta: number) => {
    const existing = current.find(i => i.option.id === option.id);
    if (existing) {
      const newQty = Math.max(0, existing.quantity + delta);
      if (newQty === 0) setConfig({ ...config, [type]: current.filter(i => i.option.id !== option.id) });
      else setConfig({ ...config, [type]: current.map(i => i.option.id === option.id ? { ...i, quantity: newQty } : i) });
    } else if (delta > 0) {
      setConfig({ ...config, [type]: [...current, { option, quantity: 1 }] });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-[10px] text-primary font-black uppercase tracking-widest pl-1">{label}</h3>
      <div className="grid grid-cols-1 gap-3">
        {options.map(opt => (
          <div key={opt.id} className="premium-card p-4 flex justify-between items-center bg-secondary/5 border border-gray-800">
            <div>
              <p className="font-black text-[10px] uppercase text-gray-300">{opt.name}</p>
              <p className="text-[9px] text-gray-600 font-mono">{opt.price.toFixed(2)}€</p>
            </div>
            <div className="flex items-center gap-4 bg-black/60 p-1.5 rounded-xl border border-gray-800">
              <button onClick={() => update(opt, -1)} className="p-2 hover:text-primary transition-colors text-gray-500"><Minus size={14} /></button>
              <span className="text-xs font-black w-4 text-center text-primary">{getQty(opt.id)}</span>
              <button onClick={() => update(opt, 1)} className="p-2 hover:text-primary transition-colors text-gray-500"><Plus size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface CheckoutScreenProps {
  orderInfo: { name: string; phone: string; pickupTime: string; type: "on_site" | "takeaway"; paymentMethod: PaymentMethod };
  setOrderInfo: React.Dispatch<React.SetStateAction<{ name: string; phone: string; pickupTime: string; type: "on_site" | "takeaway"; paymentMethod: PaymentMethod }>>;
  cart: SandwichConfig[];
  currentConfig: SandwichConfig;
  calculateTotal: () => number;
  rgpdAccepted: boolean;
  setRgpdAccepted: (val: boolean) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
  onAddAnother: () => void;
}

function CheckoutScreen({ orderInfo, setOrderInfo, cart, currentConfig, calculateTotal, rgpdAccepted, setRgpdAccepted, isSubmitting, onSubmit, onAddAnother }: CheckoutScreenProps) {
  const allItems = [...cart, currentConfig];
  
  return (
    <StepContainer title="Résumé" subtitle="Finalisez votre commande">
      <div className="space-y-4 mb-8 mt-4 overflow-y-auto max-h-[50vh] pr-2">
        <div className="bg-secondary/20 p-4 rounded-xl border border-gray-800 space-y-3 mb-6">
          <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-2 flex justify-between items-center">
            <span>Votre Panier ({allItems.length})</span>
            <button onClick={onAddAnother} className="text-primary hover:underline text-[8px]">+ AJOUTER</button>
          </p>
          {allItems.map((item, idx) => (
            <div key={idx} className="pb-2 border-b border-gray-800/50 last:border-0 last:pb-0">
              {item.formula && <p className="text-xs text-white font-bold">● {item.formula.name}</p>}
              {item.preset_sandwich && <p className="text-xs text-gray-300 ml-3 italic">→ {item.preset_sandwich.name}</p>}
            </div>
          ))}
        </div>
        
        <div className="bg-secondary/10 p-5 rounded-2xl border border-gray-800/50">
          <label className="text-[9px] text-primary uppercase font-black tracking-[0.2em] block mb-4 text-center">Paiement souhaité</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'card', name: 'CB', icon: <CreditCard size={14} /> },
              { id: 'resto_card', name: 'Titre Resto', icon: <UtensilsCrossed size={14} /> },
              { id: 'cash', name: 'Espèces', icon: <Wallet size={14} /> },
              { id: 'online', name: 'En Ligne', icon: <Star size={14} /> }
            ].map(method => (
              <button 
                key={method.id} 
                onClick={() => setOrderInfo({...orderInfo, paymentMethod: method.id as PaymentMethod})} 
                className={cn(
                  "py-3 rounded-xl border text-[10px] font-black transition-all flex items-center justify-center gap-2", 
                  orderInfo.paymentMethod === method.id ? "bg-primary text-background border-primary" : "border-gray-800 text-gray-600"
                )}
              >
                {method.icon} {method.name}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-secondary/10 p-5 rounded-2xl border border-gray-800/50 shadow-inner">
          <label className="text-[9px] text-primary uppercase font-black tracking-[0.2em] block mb-4 text-center">Temps de retrait estimé</label>
          <div className="grid grid-cols-3 gap-2">
            {["15 min", "30 min", "45 min"].map(time => (
              <button key={time} onClick={() => setOrderInfo({...orderInfo, pickupTime: time})} className={cn("py-2.5 rounded-xl border text-[10px] font-black transition-all", orderInfo.pickupTime === time ? "bg-primary text-background border-primary shadow-md shadow-primary/10" : "border-gray-800 text-gray-600")}>{time}</button>
            ))}
          </div>
        </div>

        <input type="text" value={orderInfo.name} onChange={(e) => setOrderInfo({...orderInfo, name: e.target.value})} placeholder="VOTRE NOM" className="w-full bg-secondary/20 border border-gray-800 p-4 rounded-2xl focus:border-primary outline-none transition-all text-[11px] font-black uppercase tracking-widest text-white placeholder:text-gray-700" />
        <input type="tel" value={orderInfo.phone} onChange={(e) => setOrderInfo({...orderInfo, phone: e.target.value})} placeholder="NUMÉRO DE TÉLÉPHONE" className="w-full bg-secondary/20 border border-gray-800 p-4 rounded-2xl focus:border-primary outline-none transition-all text-[11px] font-black uppercase tracking-widest text-white placeholder:text-gray-700" />
        
        <div className="flex gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
          <button onClick={() => setRgpdAccepted(!rgpdAccepted)} className={cn("w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0 shadow-sm", rgpdAccepted ? "bg-primary border-primary text-background" : "border-gray-700 hover:border-primary/50")}>
            {rgpdAccepted && <Check size={14} strokeWidth={4} />}
          </button>
          <p className="text-[9px] text-gray-500 leading-normal font-medium">J&apos;autorise l&apos;utilisation de mon numéro pour la gestion de ma commande et mon programme VIP. <Link href="/legals" className="text-primary hover:underline font-black">LIRE LES MENTIONS</Link></p>
        </div>
      </div>

      <div className="bg-secondary/30 rounded-3xl p-6 border border-gray-800/50 mb-12 shadow-2xl">
        <div className="flex justify-between items-center border-b border-gray-800 pb-5 mb-5">
          <span className="text-xl font-serif text-white italic">Total ({allItems.length})</span>
          <span className="text-3xl font-black text-primary tracking-tighter">{calculateTotal().toFixed(2)}€</span>
        </div>
        <button onClick={onSubmit} disabled={isSubmitting} className="w-full premium-gradient text-background font-black py-5 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 tracking-[0.2em] uppercase text-[11px]">
          {isSubmitting ? <div className="w-5 h-5 border-3 border-background border-t-transparent rounded-full animate-spin" /> : <><Check size={20} strokeWidth={3} /> Confirmer la commande</>}
        </button>
      </div>
    </StepContainer>
  );
}

function Confetti() {
  const [particles, setParticles] = useState<Array<{x: number; y: number; rotate: number; color: string}>>([]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      const newParticles = [...Array(60)].map(() => ({
        x: (Math.random() - 0.5) * 1000,
        y: (Math.random() - 0.5) * 1000,
        rotate: Math.random() * 720,
        color: ["bg-primary", "bg-white", "bg-yellow-600", "bg-amber-200"][Math.floor(Math.random() * 4)]
      }));
      setParticles(newParticles);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">
      {particles.map((p, i) => (
        <motion.div key={i} initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }} animate={{ opacity: 0, x: p.x, y: p.y, rotate: p.rotate, scale: 0 }} transition={{ duration: 3, ease: "easeOut" }} className={cn("absolute w-2 h-2 rounded-sm", p.color)} />
      ))}
    </div>
  );
}
