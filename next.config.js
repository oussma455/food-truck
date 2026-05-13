const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Désactive Turbopack pour le build Vercel car next-pwa a besoin de Webpack
  // Note: Vercel utilise Turbopack par défaut sur Next.js 15+
};

module.exports = withPWA(nextConfig);
