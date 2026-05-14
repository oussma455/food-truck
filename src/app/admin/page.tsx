"use client";

import React, { useState, useEffect } from "react";
import AdminDashboard from "@/components/AdminDashboard";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin_auth") === "true";
    }
    return false;
  });
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Pour la démo/V1, on utilise un mot de passe simple
  // En production, on utilisera Supabase Auth
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem("admin_auth", "true");
    } else {
      setError("Mot de passe incorrect");
      setTimeout(() => setError(""), 3000);
    }
  };

  useEffect(() => {
    // Initial check handled by useState initializer
  }, []);

  if (isAuthenticated) {
    return <AdminDashboard />;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card p-8 w-full max-w-md border-t-4 border-t-primary"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <Lock className="text-primary" size={30} />
          </div>
          <h1 className="text-2xl font-serif font-bold text-white">Accès Admin</h1>
          <p className="text-gray-400 text-sm mt-2">Identifiez-vous pour gérer les commandes</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="text-xs text-primary uppercase font-bold tracking-widest block mb-2">Mot de passe</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-secondary border border-gray-800 p-4 rounded-xl focus:border-primary outline-none transition-all text-white"
            />
            {error && <p className="text-red-500 text-xs mt-2 italic">{error}</p>}
          </div>

          <button 
            type="submit"
            className="w-full premium-gradient text-background font-bold py-4 rounded-xl shadow-lg shadow-primary/20 uppercase tracking-widest text-sm transition-transform active:scale-95"
          >
            Se connecter
          </button>
        </form>

        <p className="text-center text-gray-600 text-[10px] mt-8 uppercase tracking-widest">
          Gourmet Truck v1.0 • Sécurisé
        </p>
      </motion.div>
    </div>
  );
}
