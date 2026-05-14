"use client";

import React from "react";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LegalsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-8 text-sm uppercase font-bold tracking-widest">
          <ArrowLeft size={16} /> Retour
        </Link>

        <header className="mb-12">
          <ShieldCheck className="text-primary mb-4" size={48} />
          <h1 className="text-4xl font-serif font-bold">Mentions Légales & RGPD</h1>
          <p className="text-gray-500 mt-2">Dernière mise à jour : 14 mai 2026</p>
        </header>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Éditeur du Site</h2>
            <p>Le site Gourmet Truck est édité par [Votre Nom/Entreprise], situé à [Votre Adresse].</p>
            <p className="mt-2">Contact : <a href="tel:+33600000000" className="text-primary hover:underline">+33 6 00 00 00 00</a></p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Protection des Données (RGPD)</h2>
            <p>Conformément au Règlement Général sur la Protection des Données (RGPD), nous vous informons que nous recueillons vos données (Nom et Numéro de téléphone) exclusivement pour :</p>
            <ul className="list-disc ml-5 mt-3 space-y-2">
              <li>Identifier votre commande en cuisine.</li>
              <li>Vous contacter en cas de problème avec votre préparation.</li>
              <li>Gérer votre programme de fidélité via votre numéro de téléphone.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Conservation & Droits</h2>
            <p>Vos données sont conservées pour une durée maximale de 24 mois après votre dernière commande. Vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données en nous contactant par téléphone.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Hébergement</h2>
            <p>Le site est hébergé par Vercel Inc., situé au 340 S Lemon Ave #1150, Walnut, CA 91789, USA.</p>
          </section>
        </div>

        <footer className="mt-16 pt-8 border-t border-gray-800 text-center">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest">Gourmet Truck © 2026 - Tous droits réservés</p>
        </footer>
      </div>
    </div>
  );
}
