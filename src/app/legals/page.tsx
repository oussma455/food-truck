"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function LegalsPage() {
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans selection:bg-primary selection:text-white">
      <div className="max-w-3xl mx-auto">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-primary uppercase text-[10px] font-black tracking-widest hover:underline mb-8"
        >
          <ArrowLeft size={14} /> Retour à l'accueil
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          <header className="border-b border-gray-800 pb-8">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="text-primary" size={32} />
              <h1 className="text-3xl font-serif italic text-white">Mentions Légales & RGPD</h1>
            </div>
            <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-xl text-primary font-black uppercase tracking-widest text-[12px]">1. Éditeur du site</h2>
            <div className="bg-secondary/10 p-6 rounded-2xl border border-gray-800/50 space-y-2 text-sm text-gray-300">
              <p><strong className="text-white">Nom de l'entreprise :</strong> ***NOM DE VOTRE FOOD TRUCK***</p>
              <p><strong className="text-white">Forme juridique :</strong> ***STATUT JURIDIQUE (ex: Auto-entreprise, SASU, SARL)***</p>
              <p><strong className="text-white">SIRET :</strong> ***VOTRE NUMÉRO SIRET***</p>
              <p><strong className="text-white">Siège social :</strong> ***VOTRE ADRESSE POSTALE COMPLÈTE***</p>
              <p><strong className="text-white">Email de contact :</strong> ***VOTRE ADRESSE EMAIL***</p>
              <p><strong className="text-white">Téléphone :</strong> ***VOTRE NUMÉRO DE TÉLÉPHONE***</p>
              <p><strong className="text-white">Directeur de la publication :</strong> ***VOTRE NOM ET PRÉNOM***</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl text-primary font-black uppercase tracking-widest text-[12px]">2. Hébergement</h2>
            <div className="bg-secondary/10 p-6 rounded-2xl border border-gray-800/50 space-y-2 text-sm text-gray-300">
              <p>Ce site est hébergé par <strong>Vercel Inc.</strong></p>
              <p>440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</p>
              <p>Site web : vercel.com</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl text-primary font-black uppercase tracking-widest text-[12px]">3. Conditions Générales de Vente (CGV) & Acomptes</h2>
            <div className="bg-secondary/10 p-6 rounded-2xl border border-gray-800/50 space-y-4 text-sm text-gray-300 leading-relaxed">
              <p>
                <strong>Commandes en ligne :</strong> Toute commande passée sur ce site implique l'acceptation intégrale des présentes conditions. 
                Afin de valider définitivement une commande et d'éviter les "commandes fantômes", le paiement d'un <strong>acompte obligatoire</strong> est requis lors de la validation du panier.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-400">
                <li><strong className="text-white">Commandes Classiques :</strong> Un acompte de 30% du montant total est exigé.</li>
                <li><strong className="text-white">Pré-commandes (ex: Couscous) :</strong> Un acompte de 50% du montant total est exigé, compte tenu des délais de préparation (24h à l'avance).</li>
              </ul>
              <p>
                Le solde de la commande sera à régler sur place, lors du retrait au food truck, par carte bancaire, espèces ou titre restaurant.
              </p>
              <p className="text-amber-500/80 italic">
                En cas de non-présentation pour retirer la commande, l'acompte versé sera conservé par l'établissement à titre de dédommagement pour les frais engagés et les denrées périssables.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl text-primary font-black uppercase tracking-widest text-[12px]">4. Protection des Données Personnelles (RGPD)</h2>
            <div className="bg-secondary/10 p-6 rounded-2xl border border-gray-800/50 space-y-4 text-sm text-gray-300 leading-relaxed">
              <p>
                Dans le cadre de la prise de commande en ligne, nous collectons les données suivantes : <strong>Nom et Numéro de téléphone</strong>.
              </p>
              <p>
                Ces données sont strictement nécessaires pour :
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-400">
                <li>Traiter et préparer votre commande.</li>
                <li>Vous contacter en cas de problème ou de retard.</li>
                <li>Gérer notre programme de fidélité VIP (sauvegardé localement).</li>
              </ul>
              <p>
                Conformément à la loi "Informatique et Libertés" et au RGPD, vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition de vos données personnelles. 
                Pour exercer ce droit, veuillez nous contacter à l'adresse email mentionnée dans la section "Éditeur du site".
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl text-primary font-black uppercase tracking-widest text-[12px]">6. Crédits et Conception</h2>
            <div className="bg-secondary/10 p-6 rounded-2xl border border-gray-800/50 space-y-2 text-sm text-gray-300">
              <p>Cette application a été conçue et développée par l'agence <strong className="text-white">Search-Digital</strong>.</p>
              <p>Expert en solutions digitales pour la restauration et les commerces de proximité.</p>
              <p>Site web : <a href="https://www.search-digital.fr/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">www.search-digital.fr</a></p>
            </div>
          </section>
          
          <div className="pt-8 flex justify-center border-t border-gray-800">
             <Link 
              href="/" 
              className="premium-gradient px-8 py-4 rounded-full text-background font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform"
            >
              J'ai compris, commander
            </Link>
          </div>

        </motion.div>
      </div>
    </div>
  );
}