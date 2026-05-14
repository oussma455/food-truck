"use client";

import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { Download, Share2 } from "lucide-react";

export default function QRCodePage() {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUrl(window.location.origin);
    }
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="premium-card p-10 flex flex-col items-center text-center max-w-sm"
      >
        <h1 className="text-2xl font-serif font-bold text-primary mb-2">Gourmet Truck</h1>
        <p className="text-gray-400 text-sm mb-8">Scannez pour commander votre sandwich premium</p>
        
        <div className="p-4 bg-white rounded-2xl shadow-[0_0_30px_rgba(212,175,55,0.3)]">
          {url && (
            <QRCodeSVG 
              value={url} 
              size={200}
              level="H"
              includeMargin={false}
              imageSettings={{
                src: "/favicon.ico",
                x: undefined,
                y: undefined,
                height: 40,
                width: 40,
                excavate: true,
              }}
            />
          )}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 w-full">
          <button 
            className="flex items-center justify-center gap-2 bg-secondary border border-gray-800 p-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:border-primary transition-all"
            onClick={() => window.print()}
          >
            <Download size={16} />
            Imprimer
          </button>
          <button 
            className="flex items-center justify-center gap-2 premium-gradient text-background p-3 rounded-xl text-xs font-bold uppercase tracking-widest"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: 'Gourmet Truck', url: url });
              }
            }}
          >
            <Share2 size={16} />
            Partager
          </button>
        </div>
      </motion.div>

      <p className="mt-8 text-gray-600 text-[10px] uppercase tracking-[0.3em]">
        Propulsé par Gourmet Truck Tech
      </p>
    </div>
  );
}
