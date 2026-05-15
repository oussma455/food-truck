"use client";

import dynamic from "next/dynamic";

const SandwichBuilder = dynamic(() => import("@/components/SandwichBuilder"), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-black flex items-center justify-center text-primary uppercase font-black tracking-widest text-xs animate-pulse">Chargement Grillade...</div>
});

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      <SandwichBuilder />
    </main>
  );
}
