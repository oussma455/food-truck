"use client";

import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { Download, Share2 } from "lucide-react";

export default function QRCodePage() {
  const [url] = useState(() => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "";
  });

  useEffect(() => {
    // Initialized in useState
  }, []);

  const downloadQR = () => {
    const svg = document.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = "qrcode-truck.png";
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="premium-card p-10 max-w-sm w-full border-primary/20">
        <h1 className="text-2xl font-serif mb-2 italic">Menu Digital</h1>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-8">Scannez pour commander</p>

        <div className="bg-white p-6 rounded-3xl inline-block shadow-2xl shadow-primary/10 mb-8">
          <QRCodeSVG value={url} size={200} level="H" includeMargin={false} imageSettings={{ src: "/favicon.ico", x: undefined, y: undefined, height: 40, width: 40, excavate: true }} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={downloadQR} className="flex items-center justify-center gap-2 bg-secondary/20 border border-gray-800 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-primary/50 transition-all">
            <Download size={16} />
            Download
          </button>
          <button onClick={() => navigator.share({ title: "Gourmet Truck Menu", url })} className="flex items-center justify-center gap-2 bg-secondary/20 border border-gray-800 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-primary/50 transition-all">
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
